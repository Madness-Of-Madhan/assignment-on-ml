import { useState } from "react";
import { Clock, Search, AlertCircle } from "lucide-react";

const InputForm = ({ onSubmit, loading }) => {
  const [time, setTime] = useState("");
  const [timeError, setTimeError] = useState(false);

  const handleSubmit = () => {
    if (!time) {
      setTimeError(true);
      return;
    }
    setTimeError(false);
    onSubmit(time);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 backdrop-blur-lg bg-white/10 rounded-xl shadow-xl border border-white/20 flex flex-col items-center text-center">
      <h2 className="text-xl font-semibold mb-6 text-blue-300 flex items-center">
        <Clock className="mr-2" />
        Select Time
      </h2>

      <div className="relative w-full mb-6">
        <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Clock size={18} />
        </div>
        <input
          type="time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            setTimeError(false);
          }}
          className={`backdrop-blur-md bg-white/5 text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10 text-center ${
            timeError ? "ring-2 ring-red-500" : ""
          }`}
        />
        {timeError && (
          <div className="flex items-center mt-2 text-red-400 text-sm justify-center">
            <AlertCircle size={14} className="mr-1" />
            Please select a time
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`flex items-center justify-center w-full py-3 rounded-lg font-semibold transition-all ${
          loading
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600/70 hover:bg-blue-700 text-white backdrop-blur-md"
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <Search className="mr-2" />
            Find Available Doctors
          </>
        )}
      </button>

      <div className="p-4 mt-4 backdrop-blur-md bg-white/5 rounded-lg border border-white/10 w-full">
        <h3 className="font-medium text-blue-300 mb-2">Quick Times</h3>
        <div className="grid grid-cols-2 gap-2">
          {["09:00", "12:00", "15:00", "18:00"].map((quickTime) => (
            <button
              key={quickTime}
              onClick={() => {
                setTime(quickTime);
                setTimeError(false);
              }}
              className="bg-gray-700/50 hover:bg-gray-600/50 py-2 rounded text-sm transition-colors backdrop-blur-sm"
            >
              {quickTime}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InputForm;