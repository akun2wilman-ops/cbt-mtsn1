
export enum UserRole {
  Admin = 'admin',
  Student = 'student',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  MultipleAnswer = 'multiple-answer',
  ShortAnswer = 'short-answer',
}

export interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  options: string[];
  correctAnswers: string[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  questions: Question[];
}

export interface StudentAnswer {
  questionId: string;
  answers: string[];
}
