import pandas as pd
import numpy as np
import xgboost as xgb
import logging
import os
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import multiprocessing

# Enable logging
logging.basicConfig(level=logging.INFO)

# Ensure correct file path
file_path = os.path.abspath("dummy_npi_data.xlsx")

# Cache for storing model and data
_model_cache = None
_data_cache = None

def load_data():
    """Loads the dataset from an Excel file."""
    global _data_cache
    
    # Return cached data if available
    if _data_cache is not None:
        return _data_cache
        
    try:
        df = pd.read_excel(file_path, engine="openpyxl")
        logging.info(f"Dataset Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Preprocess immediately
        df = preprocess_data(df)
        
        # Cache the processed data
        _data_cache = df
        return df
    except Exception as e:
        logging.error(f"Error loading dataset: {e}")
        return None

def preprocess_data(df):
    """Preprocesses the dataset by cleaning and converting required columns."""
    try:
        # Encode NPI
        label_encoder = LabelEncoder()
        df['NPI'] = label_encoder.fit_transform(df['NPI'])
        
        # Process time columns
        df['login_hour'] = pd.to_datetime(df['Login Time']).dt.hour
        df['logout_hour'] = pd.to_datetime(df['Logout Time']).dt.hour
        df['session_duration'] = (pd.to_datetime(df['Logout Time']) - pd.to_datetime(df['Login Time'])).dt.total_seconds() / 60
        df['peak_hours'] = df['login_hour'].apply(lambda x: 1 if 9 <= x <= 18 else 0)
        
        # Create target time categorization
        df['target_time'] = df['login_hour'].apply(time_category)
        
        # Drop nulls in important columns
        df.dropna(subset=['login_hour', 'logout_hour', 'session_duration', 'Count of Survey Attempts'], inplace=True)
        
        # Reset index for safer lookups
        df = df.reset_index(drop=True)
        
        logging.info("Data preprocessing completed successfully")
        return df
    except Exception as e:
        logging.error(f"Error preprocessing data: {e}")
        return None

def time_category(hour):
    """Categorize time into four periods of the day."""
    if 0 <= hour < 6:
        return 0  # Night
    elif 6 <= hour < 12:
        return 1  # Morning
    elif 12 <= hour < 18:
        return 2  # Afternoon
    else:
        return 3  # Evening

def train_model(df=None):
    """Trains an XGBoost model to predict the time category."""
    global _model_cache
    
    # Return cached model if available
    if _model_cache is not None:
        return _model_cache
    
    if df is None:
        df = load_data()
    
    if df is None:
        logging.error("Data unavailable for training.")
        return None
    
    try:
        # Prepare features and target
        X = df[['NPI', 'login_hour', 'logout_hour', 'session_duration', 'peak_hours', 'Count of Survey Attempts']]
        Y = df['target_time']
        
        # Split data for training
        X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
        
        # Ensure all classes are represented
        expected_classes = [0, 1, 2, 3]
        for category in expected_classes:
            if category not in y_train.values:
                logging.warning(f"Category {category} is missing! Adding a synthetic sample.")
                
                if len(y_train) > 0:
                    sample = X_train.iloc[0].copy()
                    X_train = pd.concat([X_train, pd.DataFrame([sample])], ignore_index=True)
                    y_train = pd.concat([y_train, pd.Series([category])], ignore_index=True)
        
        # Train XGBoost model
        xgb_model = xgb.XGBClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            n_jobs=multiprocessing.cpu_count() - 1  # Use multiple cores but leave one for system
        )
        xgb_model.fit(X_train, y_train)
        
        logging.info("XGBoost model trained successfully.")
        
        # Cache the trained model
        _model_cache = xgb_model
        return xgb_model
    except Exception as e:
        logging.error(f"Error training model: {e}")
        return None

def predict_best_doctors(input_time, limit=10):
    """Predicts the best doctors based on the given input time."""
    # Ensure model and data are loaded
    df = load_data()
    model = train_model(df)
    
    if df is None or model is None:
        logging.error("Data or model unavailable for prediction.")
        return []

    try:
        # Convert input_time to hour format
        try:
            input_hour = pd.to_datetime(input_time, format="%H:%M").hour
            logging.info(f"Input time converted to hour: {input_hour}")
        except ValueError:
            logging.error(f"Invalid time format: {input_time}")
            return []
        
        # Get time category for the input hour
        target_category = time_category(input_hour)
        
        # Filter doctors available at the given time category
        available_doctors = df[df['target_time'] == target_category].copy()
        
        if available_doctors.empty:
            logging.warning(f"No doctors available at {input_time}")
            return []

        logging.info(f"Found {len(available_doctors)} doctors available at time category {target_category}")

        # Prepare features for prediction
        X_available = available_doctors[['NPI', 'login_hour', 'logout_hour', 'session_duration', 'peak_hours', 'Count of Survey Attempts']]
        
        # Get probability predictions for the category
        proba = model.predict_proba(X_available)
        
        # Add probability of the target category
        available_doctors['prediction_prob'] = proba[:, target_category]
        
        # Sort doctors by prediction probability and survey attempts
        top_doctors = available_doctors.sort_values(
            by=['prediction_prob', 'Count of Survey Attempts'], 
            ascending=[False, False]
        )
        
        # Select the top N doctors and prepare return format
        result = top_doctors.head(limit)[['NPI', 'login_hour', 'logout_hour', 'session_duration', 
                                         'Count of Survey Attempts', 'prediction_prob']]
        
        # Convert to dictionary format
        return result.to_dict(orient="records")
    except Exception as e:
        logging.error(f"Prediction error: {e}")
        return []

# Initialize model and data at module load time
def initialize():
    """Pre-loads data and trains model to speed up future requests."""
    load_data()
    train_model()
    logging.info("Model and data initialized")