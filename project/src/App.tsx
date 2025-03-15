import React, { useState } from "react";
import Scene from "./components/Scene";
import InputForm from "./components/InputForm";
import DoctorList from "./components/DoctorList";

function App() {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState(null);
  
  const handleTimeSubmit = async (time) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/get_doctors?time=${time}`);
      if (!response.ok) {
        throw new Error("Failed to fetch doctor availability");
      }
      const data = await response.json();
      
      // Extract doctors from the response structure
      setDoctors(data.doctors); // This is the key fix - we're accessing data.doctors now
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch doctor availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white relative">
      <Scene />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Doctor Availability Dashboard
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Find available doctors based on your preferred time. Our intelligent system matches you with the most suitable healthcare professionals.
          </p>
        </header>
        
        <div className="grid gap-8 max-w-6xl mx-auto">
          <InputForm onSubmit={handleTimeSubmit} loading={loading} />
          {(doctors || loading || error) && (
            <DoctorList doctors={doctors} loading={loading} error={error} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;