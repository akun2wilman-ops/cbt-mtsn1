import React, { useState, createContext, useContext, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import ExamPage from './components/ExamPage';
import Header from './components/Header';
import { User, UserRole } from './types';
import { DataProvider } from './context/DataContext';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ProtectedRoute: React.FC<{ role: UserRole; children: React.ReactNode }> = ({ role, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === UserRole.Admin ? '/admin' : '/student'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <div className="bg-slate-100 min-h-screen">
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute role={UserRole.Admin}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute role={UserRole.Student}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exam/:id"
                  element={
                    <ProtectedRoute role={UserRole.Student}>
                      <ExamPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
