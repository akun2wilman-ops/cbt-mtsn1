import React, { useState } from 'react';
import { Exam, Question, QuestionType, User } from '../types';
import { generateQuestionsWithAI, generateQuestionsFromText } from '../services/geminiService';
import { useData } from '../context/DataContext';

// Declare XLSX and pdfjsLib since they are loaded from CDN
declare const XLSX: any;
declare const pdfjsLib: any;

// Helper functions for file parsing
const parseJsonFile = async (file: File): Promise<Partial<Question>[]> => {
  const content = await file.text();
  return JSON.parse(content);
};

const parseCsvFile = async (file: File): Promise<Partial<Question>[]> => {
  const content = await file.text();
  const rows = content.split('\n').slice(1); // skip header
  return rows.map(row => {
    const [questionText, type, options, correctAnswers] = row.split(',').map(item => item.trim().replace(/"/g, ''));
    return {
      questionText,
      type: type as QuestionType,
      options: options ? options.split('|') : [],
      correctAnswers: correctAnswers ? correctAnswers.split('|') : [],
    };
  }).filter(q => q.questionText);
};

const parseExcelFile = async (file: File): Promise<Partial<Question>[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json: any[] = XLSX.utils.sheet_to_json(worksheet);
  return json.map(row => ({
     questionText: row.questionText,
     type: row.type as QuestionType,
     options: typeof row.options === 'string' ? row.options.split('|') : [],
     correctAnswers: typeof row.correctAnswers === 'string' ? row.correctAnswers.split('|') : [],
  })).filter(q => q.questionText);
};

const parsePdfFile = async (file: File, setUploadStatus: (status: any) => void): Promise<Partial<Question>[]> => {
  setUploadStatus({ message: 'Membaca file PDF... Mohon tunggu.', type: 'info' });
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
     pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;
  }
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(data).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }
  setUploadStatus({ message: 'File PDF dibaca. Mengirim ke AI untuk diproses...', type: 'info' });
  return generateQuestionsFromText(fullText);
};


const QuestionGenerator: React.FC<{onAddQuestions: (questions: Question[]) => void}> = ({ onAddQuestions }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    QuestionType.MultipleChoice,
    QuestionType.MultipleAnswer,
    QuestionType.ShortAnswer,
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeChange = (type: QuestionType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!topic) {
      setError('Topik tidak boleh kosong.');
      return;
    }
    if (selectedTypes.length === 0) {
      setError('Pilih minimal satu tipe soal.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const partialQuestions = await generateQuestionsWithAI(topic, count, selectedTypes);
      const fullQuestions = partialQuestions.map((q, i) => ({
        ...q,
        id: `gen-${Date.now()}-${i}`,
      })) as Question[];
      onAddQuestions(fullQuestions);
      alert(`${fullQuestions.length} soal berhasil dibuat dan ditambahkan ke form ujian baru.`);
    } catch (e: any)
    {
      setError(e.message || 'Gagal membuat soal.');
    } finally {
      setLoading(false);
    }
  };

  const allQuestionTypes = [
    { id: QuestionType.MultipleChoice, label: 'Pilihan Ganda' },
    { id: QuestionType.MultipleAnswer, label: 'Jawaban Ganda' },
    { id: QuestionType.ShortAnswer, label: 'Isian Singkat' },
  ];

  return (
    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Buat Soal dengan AI</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Topik Materi</label>
          <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Contoh: Sejarah Kerajaan Majapahit" />
        </div>
        <div>
          <label htmlFor="count" className="block text-sm font-medium text-gray-700">Jumlah Soal</label>
          <input type="number" id="count" value={count} onChange={e => setCount(parseInt(e.target.value))} min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipe Soal</label>
          <div className="mt-2 space-y-2 sm:space-y-0 sm:flex sm:space-x-4">
            {allQuestionTypes.map(typeInfo => (
              <div key={typeInfo.id} className="flex items-center">
                <input
                  id={typeInfo.id}
                  name={typeInfo.id}
                  type="checkbox"
                  checked={selectedTypes.includes(typeInfo.id)}
                  onChange={() => handleTypeChange(typeInfo.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor={typeInfo.id} className="ml-2 block text-sm text-gray-900">
                  {typeInfo.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
          {loading ? 'Membuat soal...' : 'Buat & Tambahkan Soal'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};

const ManualQuestionForm: React.FC<{ onAddQuestion: (question: Question) => void }> = ({ onAddQuestion }) => {
    const [questionText, setQuestionText] = useState('');
    const [type, setType] = useState<QuestionType>(QuestionType.MultipleChoice);
    const [options, setOptions] = useState('');
    const [correctAnswers, setCorrectAnswers] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText || !correctAnswers || (type !== QuestionType.ShortAnswer && !options)) {
            alert('Harap isi semua field soal.');
            return;
        }
        const newQuestion: Question = {
            id: `manual-${Date.now()}`,
            questionText,
            type,
            options: type === QuestionType.ShortAnswer ? [] : options.split('\n').filter(o => o.trim() !== ''),
            correctAnswers: correctAnswers.split('\n').filter(a => a.trim() !== ''),
        };
        onAddQuestion(newQuestion);
        // Reset form
        setQuestionText('');
        setType(QuestionType.MultipleChoice);
        setOptions('');
        setCorrectAnswers('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-200 mt-4 pt-4">
            <h4 className="text-md font-semibold text-gray-700">Tambah Soal Manual</h4>
             <div>
                <label className="block text-sm font-medium text-gray-600">Teks Soal</label>
                <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} required rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600">Tipe Soal</label>
                <select value={type} onChange={e => setType(e.target.value as QuestionType)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                    <option value={QuestionType.MultipleChoice}>Pilihan Ganda</option>
                    <option value={QuestionType.MultipleAnswer}>Jawaban Ganda</option>
                    <option value={QuestionType.ShortAnswer}>Isian Singkat</option>
                </select>
            </div>
            {type !== QuestionType.ShortAnswer && (
                 <div>
                    <label className="block text-sm font-medium text-gray-600">Pilihan Jawaban (satu per baris)</label>
                    <textarea value={options} onChange={e => setOptions(e.target.value)} required rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"></textarea>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-600">Jawaban Benar (satu per baris)</label>
                <textarea value={correctAnswers} onChange={e => setCorrectAnswers(e.target.value)} required rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"></textarea>
            </div>
            <button type="submit" className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-800 pt-2">Tambahkan Soal Ini</button>
        </form>
    );
};

const QuizList: React.FC<{ exams: Exam[], onSelectExam: (exam: Exam) => void }> = ({ exams, onSelectExam }) => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-xl font-semibold text-gray-800 p-4">Daftar Kuis yang Dibuat</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjek</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Pertanyaan</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.questions.length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onSelectExam(exam)} className="text-indigo-600 hover:text-indigo-900">Lihat</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
const AdminDashboard: React.FC = () => {
  const { exams, setExams, students, setStudents } = useData();
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const initialNewExamState = { title: '', subject: '', duration: 60, questions: [] };
  const [newExam, setNewExam] = useState<{title: string; subject: string; duration: number; questions: Question[]}>(initialNewExamState);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [rawText, setRawText] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [textProcessingStatus, setTextProcessingStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [newStudentNisn, setNewStudentNisn] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  const addQuestionsToNewExam = (questions: Question[]) => {
    setNewExam(prev => ({
        ...prev,
        questions: [...prev.questions, ...questions]
    }));
  };

  const removeQuestionFromNewExam = (questionId: string) => {
    setNewExam(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleNewExamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExam(prev => ({
        ...prev,
        [name]: name === 'duration' ? parseInt(value) || 0 : value
    }));
  };
  
  const handleSaveNewExam = () => {
    if (!newExam.title || !newExam.subject || newExam.duration <= 0 || newExam.questions.length === 0) {
        alert('Harap lengkapi Judul, Mapel, Durasi (>0), dan tambahkan minimal 1 soal.');
        return;
    }
    const finalExam: Exam = {
        id: `exam-${Date.now()}`,
        ...newExam
    };
    setExams(prev => [...prev, finalExam]);
    setNewExam(initialNewExamState);
    alert('Ujian baru berhasil disimpan!');
  };

  const downloadTemplate = (format: 'json' | 'csv') => {
    if (format === 'json') {
        const template = [
          {
            questionText: "Contoh soal Pilihan Ganda: Apa ibukota negara Indonesia?",
            type: QuestionType.MultipleChoice,
            options: ["Jakarta", "Bandung", "Surabaya", "Medan"],
            correctAnswers: ["Jakarta"]
          },
          {
            questionText: "Contoh soal Jawaban Ganda: Manakah dari berikut ini yang termasuk pulau besar di Indonesia?",
            type: QuestionType.MultipleAnswer,
            options: ["Jawa", "Bali", "Sumatera", "Lombok"],
            correctAnswers: ["Jawa", "Sumatera"]
          },
          {
            questionText: "Contoh soal Isian Singkat: Siapakah presiden pertama Republik Indonesia?",
            type: QuestionType.ShortAnswer,
            options: [],
            correctAnswers: ["Soekarno"]
          }
        ];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "template_soal.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    } else if (format === 'csv') {
      const headers = "questionText,type,options,correctAnswers";
      const examples = [
        '"Apa ibukota negara Indonesia?","multiple-choice","Jakarta|Bandung|Surabaya|Medan","Jakarta"',
        '"Manakah yang termasuk pulau besar?","multiple-answer","Jawa|Bali|Sumatera|Lombok","Jawa|Sumatera"',
        '"Siapa presiden pertama RI?","short-answer","","Soekarno"'
      ];
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + examples.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "template_soal.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus({ message: `Mengunggah ${file.name}...`, type: 'info' });

    try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let questions: Partial<Question>[] = [];

        switch (fileExtension) {
            case 'json':
                questions = await parseJsonFile(file);
                break;
            case 'csv':
                questions = await parseCsvFile(file);
                break;
            case 'xlsx':
            case 'xls':
                questions = await parseExcelFile(file);
                break;
            case 'pdf':
                questions = await parsePdfFile(file, setUploadStatus);
                break;
            default:
                throw new Error('Tipe file tidak didukung. Silakan gunakan .json, .csv, .xlsx, atau .pdf');
        }
        
        if (!questions || questions.length === 0) {
            throw new Error('Tidak ada soal yang valid ditemukan di dalam file.');
        }

        const fullQuestions = questions.map((q, i) => ({
            id: `upl-${fileExtension}-${Date.now()}-${i}`,
            questionText: q.questionText || '',
            type: q.type || QuestionType.ShortAnswer,
            options: q.options || [],
            correctAnswers: q.correctAnswers || [],
        })) as Question[];
      
        addQuestionsToNewExam(fullQuestions);
        setUploadStatus({ message: `Berhasil menambahkan ${fullQuestions.length} soal dari ${file.name} ke form ujian.`, type: 'success' });

    } catch (error: any) {
      console.error(error);
      setUploadStatus({ message: error.message || 'Gagal memproses file.', type: 'error' });
    } finally {
        setIsUploading(false);
        event.target.value = '';
    }
  };

  const handleProcessRawText = async () => {
    if (!rawText.trim()) {
        setTextProcessingStatus({ message: 'Kolom teks tidak boleh kosong.', type: 'error' });
        return;
    }
    setIsProcessingText(true);
    setTextProcessingStatus({ message: 'Memproses teks dengan AI...', type: 'info' });
    try {
        const questions = await generateQuestionsFromText(rawText);
        if (!questions || questions.length === 0) {
            throw new Error('Tidak ada soal valid yang dapat diekstrak dari teks yang diberikan.');
        }
        const fullQuestions: Question[] = questions.map((q, i) => ({
            id: `text-ai-${Date.now()}-${i}`,
            questionText: q.questionText || '',
            type: q.type || QuestionType.ShortAnswer,
            options: q.options || [],
            correctAnswers: q.correctAnswers || []
        }));
        
        addQuestionsToNewExam(fullQuestions);
        setTextProcessingStatus({ message: `Berhasil menambahkan ${fullQuestions.length} soal dari teks ke form ujian.`, type: 'success' });
        setRawText(''); // Clear textarea on success
    } catch (error: any) {
        setTextProcessingStatus({ message: error.message || 'Gagal memproses teks.', type: 'error' });
    } finally {
        setIsProcessingText(false);
    }
  };

   const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentNisn.trim() || !newStudentName.trim()) {
      alert('NISN dan Nama Siswa tidak boleh kosong.');
      return;
    }
    if (students.some(s => s.id === newStudentNisn.trim())) {
      alert('NISN sudah terdaftar.');
      return;
    }
    const newStudent: Omit<User, 'role'> = {
      id: newStudentNisn.trim(),
      name: newStudentName.trim(),
    };
    setStudents(prev => [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)));
    setNewStudentNisn('');
    setNewStudentName('');
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm(`Yakin ingin menghapus siswa dengan NISN ${studentId}?`)) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Admin</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
          <QuizList exams={exams} onSelectExam={setViewingExam} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Manajemen Data Siswa</h3>
            <div className="bg-white rounded-lg shadow">
              <form onSubmit={handleAddStudent} className="p-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-1">
                  <label htmlFor="nisn" className="block text-sm font-medium text-gray-700">NISN</label>
                  <input type="text" id="nisn" value={newStudentNisn} onChange={e => setNewStudentNisn(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="NISN Siswa" />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <input type="text" id="name" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nama Siswa" />
                </div>
                <button type="submit" className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Tambah Siswa</button>
              </form>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NISN</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.length > 0 ? students.map(student => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data siswa.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Buat Ujian Baru</h3>
                <p className="text-sm text-gray-500 mb-4">Konfigurasikan detail ujian dan tambahkan soal di bawah ini.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Judul Ujian</label>
                        <input type="text" name="title" value={newExam.title} onChange={handleNewExamChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                            <input type="text" name="subject" value={newExam.subject} onChange={handleNewExamChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Durasi (menit)</label>
                            <input type="number" name="duration" value={newExam.duration} onChange={handleNewExamChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-md font-semibold text-gray-700 mt-2">Daftar Soal ({newExam.questions.length})</h4>
                        <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-2 space-y-2 bg-slate-50">
                            {newExam.questions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Belum ada soal. Tambahkan soal melalui import, AI, atau manual.</p>
                            ) : newExam.questions.map((q, index) => (
                                <div key={q.id} className="text-sm p-2 bg-white rounded shadow-sm flex justify-between items-start">
                                    <p className="flex-1 pr-2"><span className="font-semibold">{index + 1}.</span> {q.questionText}</p>
                                    <button onClick={() => removeQuestionFromNewExam(q.id)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <ManualQuestionForm onAddQuestion={(q) => addQuestionsToNewExam([q])} />

                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button onClick={handleSaveNewExam} className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Simpan Ujian</button>
                        <button onClick={() => setNewExam(initialNewExamState)} className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Reset</button>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Import Soal</h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="text-md font-medium text-gray-700">1. Download Template (Opsional)</h4>
                        <p className="text-sm text-gray-500 mt-1">Gunakan template untuk memastikan format file soal Anda benar.</p>
                        <div className="flex space-x-2 mt-3">
                            <button 
                                onClick={() => downloadTemplate('json')} 
                                className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Download Template JSON
                            </button>
                            <button 
                                onClick={() => downloadTemplate('csv')} 
                                className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Download Template CSV
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-md font-medium text-gray-700">2. Upload File Soal</h4>
                        <p className="text-sm text-gray-500 mt-1">Soal dari file akan ditambahkan ke form "Buat Ujian Baru".</p>
                        <div className="mt-3">
                            <label htmlFor="file-upload" className={`cursor-pointer w-full inline-flex justify-center py-2 px-4 border border-indigo-600 rounded-md shadow-sm bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 ${isUploading ? 'bg-gray-200 cursor-not-allowed' : ''}`}>
                                {isUploading ? 'Memproses...' : 'Pilih File untuk Di-upload'}
                            </label>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".json,.csv,.xlsx,.xls,.pdf" onChange={handleFileUpload} disabled={isUploading} />
                            <p className="text-xs text-gray-500 mt-1 text-center">Mendukung: JSON, CSV, Excel, PDF (via AI)</p>
                        </div>
                        {uploadStatus && (
                            <div className={`mt-3 p-3 rounded-md text-sm ${
                                uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 
                                uploadStatus.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                                {uploadStatus.message}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-700">Atau Tempel Teks Mentah</h4>
                      <p className="text-sm text-gray-500 mt-1 mb-2">AI akan mencoba mengekstrak soal dari teks yang Anda berikan.</p>
                      <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        rows={5}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Contoh: 1. Apa ibukota Indonesia? A. Jakarta B. Bandung. Jawaban: A"
                        disabled={isProcessingText}
                      />
                      <button
                        onClick={handleProcessRawText}
                        disabled={isProcessingText || !rawText.trim()}
                        className="w-full mt-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-400"
                      >
                        {isProcessingText ? 'Memproses Teks...' : 'Proses Teks & Tambahkan Soal'}
                      </button>
                      {textProcessingStatus && (
                        <div className={`p-3 mt-2 rounded-md text-sm ${
                            textProcessingStatus.type === 'success' ? 'bg-green-100 text-green-800' :
                            textProcessingStatus.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {textProcessingStatus.message}
                        </div>
                      )}
                    </div>
                </div>
            </div>
          <QuestionGenerator onAddQuestions={addQuestionsToNewExam}/>
        </div>
      </div>
       {viewingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{viewingExam.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{viewingExam.subject} &bull; {viewingExam.questions.length} soal &bull; {viewingExam.duration} menit</p>
                </div>
                <button onClick={() => setViewingExam(null)} className="text-gray-400 hover:text-gray-700 text-3xl font-light">&times;</button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              <div className="space-y-6">
                {viewingExam.questions.map((q, index) => {
                  const isMCQ = q.type === QuestionType.MultipleChoice || q.type === QuestionType.MultipleAnswer;
                  return (
                    <div key={q.id} className="p-5 border rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-start">
                        <span className="text-indigo-600 font-bold mr-4 text-lg">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 mb-4">{q.questionText}</p>
                          
                          {isMCQ ? (
                            <ul className="space-y-2 text-sm">
                              {q.options.map((opt, optIndex) => {
                                const isCorrect = q.correctAnswers.includes(opt);
                                return (
                                  <li key={optIndex} className={`flex items-center justify-between p-3 rounded-md border ${
                                    isCorrect 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <span className={`${isCorrect ? 'text-green-900 font-semibold' : 'text-gray-700'}`}>{opt}</span>
                                    {isCorrect && (
                                        <span className="text-xs font-bold text-green-800 bg-green-200 py-0.5 px-2 rounded-full">Benar ✓</span>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-gray-600 mb-1">Jawaban Benar:</p>
                              <div className="p-3 bg-green-50 text-green-900 rounded-md font-semibold text-sm border border-green-200 inline-block">
                                {q.correctAnswers.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t text-right">
               <button onClick={() => setViewingExam(null)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                 Tutup
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;