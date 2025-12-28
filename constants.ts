
import { User, Exam, QuestionType, UserRole } from './types';

// In a real app, this would come from a secure backend
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123',
};

// Mock student data (sample)
export const MOCK_STUDENTS: Omit<User, 'role'>[] = Array.from({ length: 10 }, (_, i) => ({
  id: `123456789${i}`,
  name: `Siswa ${i + 1}`,
}));

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'matematika-01',
    title: 'Ujian Akhir Semester - Matematika',
    subject: 'Matematika',
    duration: 90,
    questions: [
      {
        id: 'q1',
        questionText: 'Hasil dari 15 x (20 - 5) : 3 adalah...',
        type: QuestionType.MultipleChoice,
        options: ['75', '50', '25', '100'],
        correctAnswers: ['75'],
      },
      {
        id: 'q2',
        questionText: 'Manakah dari berikut ini yang merupakan bilangan prima?',
        type: QuestionType.MultipleAnswer,
        options: ['2', '4', '7', '9', '11'],
        correctAnswers: ['2', '7', '11'],
      },
      {
        id: 'q3',
        questionText: 'Sebuah persegi memiliki sisi 8 cm. Berapakah luasnya dalam cm²?',
        type: QuestionType.ShortAnswer,
        options: [],
        correctAnswers: ['64'],
      },
    ],
  },
  {
    id: 'ipa-01',
    title: 'Ulangan Harian - IPA',
    subject: 'Ilmu Pengetahuan Alam',
    duration: 45,
    questions: [
      {
        id: 'q1',
        questionText: 'Proses tumbuhan membuat makanannya sendiri disebut...',
        type: QuestionType.MultipleChoice,
        options: ['Respirasi', 'Fotosintesis', 'Evaporasi', 'Transpirasi'],
        correctAnswers: ['Fotosintesis'],
      },
      {
        id: 'q2',
        questionText: 'Tuliskan rumus kimia untuk air.',
        type: QuestionType.ShortAnswer,
        options: [],
        correctAnswers: ['H2O'],
      },
    ],
  },
];
