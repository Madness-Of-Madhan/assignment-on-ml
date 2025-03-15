from flask import Flask, request, jsonify
from flask_cors import CORS
from concurrent.futures import ThreadPoolExecutor
import logging
from model import predict_best_doctors, initialize

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)
CORS(app)

# Create thread pool for handling concurrent requests
executor = ThreadPoolExecutor(max_workers=8)

@app.before_request
def before_request():
    """Ensure resources are initialized before handling a request."""
    if not hasattr(app, "initialized"):
        logging.info("Initializing app resources...")
        initialize()
        app.initialized = True  # Mark as initialized

@app.route('/get_doctors', methods=['GET'])
def get_available_doctors():
    time = request.args.get('time', '')
    limit = request.args.get('limit', 10, type=int)
    
    if not time:
        return jsonify({'error': 'Time parameter is required'}), 400
    
    # Run prediction in a separate thread to improve performance
    future = executor.submit(predict_best_doctors, time, limit)
    
    try:
        result = future.result(timeout=10)  # Set timeout to prevent hanging
        
        if not result:
            return jsonify({'message': 'No doctors available at the specified time.', 'doctors': []}), 200
            
        return jsonify({'message': 'Doctors found.', 'doctors': result}), 200
    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return jsonify({'error': 'An error occurred processing your request.'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple endpoint to check if API is running."""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    logging.info("Starting Flask application...")
    initialize()  # Ensure initialization before starting the app
    app.run(debug=True, threaded=True, host='0.0.0.0', port=5000)
