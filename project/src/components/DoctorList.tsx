import { UserCircle, Clock } from "lucide-react";

const DoctorList = ({ doctors, loading, error }) => {
  if (loading) {
    return (
      <div className="w-full p-6 backdrop-blur-lg bg-black/30 rounded-xl shadow-xl border border-white/20 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-blue-300 text-lg">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 backdrop-blur-lg bg-black/30 rounded-xl shadow-xl border border-white/20 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center h-64 text-red-400">
          <UserCircle className="w-12 h-12 mb-4" />
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="w-full p-6 backdrop-blur-lg bg-black/30 rounded-xl shadow-xl border border-white/20 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <UserCircle className="w-12 h-12 mb-4" />
          <p className="text-lg">No doctors available at this time</p>
          <p className="text-sm mt-2">Try selecting a different time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 backdrop-blur-lg bg-black/30 rounded-xl shadow-xl border border-white/20 overflow-hidden">
      <h2 className="text-xl font-semibold text-center mb-6 text-white">
        Available Doctors
        <span className="bg-blue-600/70 backdrop-blur-md text-xs font-medium text-white py-1 px-2 rounded-full ml-2">
          {doctors.length}
        </span>
      </h2>

      <div className="overflow-x-auto max-h-96 custom-scrollbar">
        <table className="min-w-full border-collapse text-white text-sm">
          <thead>
            <tr className="bg-white/10 backdrop-blur-md text-center">
              <th className="px-10 py-3">Doctor ID</th>
              <th className="px-10 py-3">Login</th>
              <th className="px-10 py-3">Logout</th>
              <th className="px-10 py-3">Session (min)</th>
              <th className="px-10 py-3">Surveys</th>
              <th className="px-10 py-3">Match Score</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc, index) => {
              const score = doc.prediction_prob ? (doc.prediction_prob * 100).toFixed(1) : 0;
              const scoreColor = score > 70 ? "bg-green-500/70" : score > 40 ? "bg-yellow-500/70" : "bg-red-500/70";
              return (
                <tr key={index} className="border-b border-white/10 hover:bg-white/10 transition text-center">
                  <td className="px-10 py-4 flex items-center gap-6 justify-center">
                    <UserCircle className="text-blue-300" size={20} />
                    {doc.NPI}
                  </td>
                  <td className="px-10 py-4 flex items-center gap-6 justify-center">
                    <Clock className="text-blue-300" size={16} />
                    {doc.login_hour}:00
                  </td>
                  <td className="px-10 py-4 flex items-center gap-6 justify-center">
                    <Clock className="text-red-300" size={16} />
                    {doc.logout_hour}:00
                  </td>
                  <td className="px-10 py-4">{Math.round(doc.session_duration)}</td>
                  <td className="px-10 py-4">{doc["Count of Survey Attempts"]}</td>
                  <td className="px-10 py-4">
                    <div className="flex flex-col items-center w-full">
                      <div className="relative w-full h-2 bg-gray-800/50 rounded-full mb-1">
                        <div className={`${scoreColor} backdrop-blur-sm h-2 rounded-full`} style={{ width: `${score}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-300">{score}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorList;