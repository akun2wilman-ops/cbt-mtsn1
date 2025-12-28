import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question, QuestionType, StudentAnswer } from '../types';
import { useData } from '../context/DataContext';

const QuestionCard: React.FC<{
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  studentAnswer: string[];
  onAnswerChange: (answers: string[]) => void;
}> = ({ question, questionNumber, totalQuestions, studentAnswer, onAnswerChange }) => {
  const handleMultipleChoiceChange = (option: string) => {
    onAnswerChange([option]);
  };
  
  const handleMultipleAnswerChange = (option: string) => {
    const newAnswers = studentAnswer.includes(option)
      ? studentAnswer.filter(ans => ans !== option)
      : [...studentAnswer, option];
    onAnswerChange(newAnswers);
  };
  
  const handleShortAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAnswerChange([e.target.value]);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <p className="text-sm text-gray-500 mb-2">Soal {questionNumber} dari {totalQuestions}</p>
      <p className="text-lg font-medium text-gray-800 mb-6">{question.questionText}</p>
      <div className="space-y-4">
        {question.type === QuestionType.MultipleChoice && question.options.map(option => (
          <label key={option} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input type="radio" name={question.id} value={option} checked={studentAnswer[0] === option} onChange={() => handleMultipleChoiceChange(option)} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
            <span className="ml-3 text-gray-700">{option}</span>
          </label>
        ))}
        {question.type === QuestionType.MultipleAnswer && question.options.map(option => (
          <label key={option} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" name={option} value={option} checked={studentAnswer.includes(option)} onChange={() => handleMultipleAnswerChange(option)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="ml-3 text-gray-700">{option}</span>
          </label>
        ))}
        {question.type === QuestionType.ShortAnswer && (
          <input type="text" value={studentAnswer[0] || ''} onChange={handleShortAnswerChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ketik jawaban Anda di sini" />
        )}
      </div>
    </div>
  );
};


const ExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams } = useData();
  const exam = useMemo(() => exams.find(e => e.id === id), [id, exams]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(exam ? exam.duration * 60 : 0);
  
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const handleSubmit = useCallback((isAutoSubmit: boolean = false) => {
    if (!exam) return;

    if (!isAutoSubmit && !window.confirm('Apakah Anda yakin ingin menyelesaikan ujian ini?')) {
      return;
    }
    
    if (isAutoSubmit) {
      alert('Waktu habis! Ujian Anda telah dikumpulkan secara otomatis.');
    }
    
    let score = 0;
    const finalAnswers = answersRef.current;
    exam.questions.forEach(q => {
      const studentAnswer = finalAnswers.find(a => a.questionId === q.id);
      if (studentAnswer) {
        const sortedStudentAnswers = [...studentAnswer.answers].sort();
        const sortedCorrectAnswers = [...q.correctAnswers].sort();
        if (JSON.stringify(sortedStudentAnswers) === JSON.stringify(sortedCorrectAnswers)) {
          score++;
        }
      }
    });
    const finalScore = (score / exam.questions.length) * 100;
    alert(`Ujian Selesai!\nSkor Anda: ${finalScore.toFixed(2)}`);
    navigate('/student');
  }, [exam, navigate]);
  
  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, handleSubmit]);
  
  if (!exam) {
    return <div className="text-center text-red-500">Ujian tidak ditemukan.</div>;
  }

  const handleAnswerChange = (newAnswers: string[]) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === exam.questions[currentQuestionIndex].id);
    const updatedAnswers = [...answers];
    if (existingAnswerIndex > -1) {
      updatedAnswers[existingAnswerIndex].answers = newAnswers;
    } else {
      updatedAnswers.push({ questionId: exam.questions[currentQuestionIndex].id, answers: newAnswers });
    }
    setAnswers(updatedAnswers);
  };

  const currentStudentAnswer = answers.find(a => a.questionId === exam.questions[currentQuestionIndex].id)?.answers || [];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center sticky top-4 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{exam.title}</h2>
          <p className="text-gray-600">{exam.subject}</p>
        </div>
        <div className="text-right">
            <p className="text-sm text-gray-500">Sisa Waktu</p>
            <p className="text-xl font-bold text-red-600">{formatTime(timeLeft)}</p>
        </div>
      </div>
      
      <QuestionCard 
        question={exam.questions[currentQuestionIndex]} 
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={exam.questions.length}
        studentAnswer={currentStudentAnswer}
        onAnswerChange={handleAnswerChange}
      />
      
      <div className="flex justify-between mt-8">
        <button 
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)} 
          disabled={currentQuestionIndex === 0}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          Sebelumnya
        </button>
        {currentQuestionIndex === exam.questions.length - 1 ? (
          <button onClick={() => handleSubmit(false)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg">
            Selesai
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Selanjutnya
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamPage;
