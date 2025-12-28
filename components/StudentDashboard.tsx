import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useData } from '../context/DataContext';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { exams } = useData();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang, {user?.name}!</h2>
      <p className="text-lg text-gray-600 mb-8">Silakan pilih ujian yang tersedia di bawah ini.</p>
      
      <div className="space-y-6">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-transform transform hover:scale-105">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                <span>{exam.subject}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{exam.questions.length} Soal</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{exam.duration} Menit</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/exam/${exam.id}`)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200"
            >
              Mulai Ujian
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
