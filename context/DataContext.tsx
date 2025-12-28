import React, { createContext, useState, useMemo, useContext } from 'react';
import { Exam, User } from '../types';
import { MOCK_EXAMS, MOCK_STUDENTS } from '../constants';

// Mendefinisikan tipe untuk data siswa yang dikelola dalam konteks ini
type StudentData = Omit<User, 'role'>;

interface DataContextType {
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS);
  const [students, setStudents] = useState<StudentData[]>(MOCK_STUDENTS);

  const value = useMemo(() => ({
    exams,
    setExams,
    students,
    setStudents
  }), [exams, students]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
