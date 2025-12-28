import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { ADMIN_CREDENTIALS } from '../constants';
import { useData } from '../context/DataContext';

type LoginRole = 'student' | 'admin';

const LoginPage: React.FC = () => {
  const [role, setRole] = useState<LoginRole>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { students } = useData();

  useEffect(() => {
    if (user) {
      navigate(user.role === UserRole.Admin ? '/admin' : '/student');
    }
  }, [user, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (role === 'student') {
        if (username !== password) {
          setError('NISN dan Password harus sama.');
          setLoading(false);
          return;
        }
        const foundStudent = students.find(s => s.id === username);
        if (foundStudent) {
          login({ ...foundStudent, role: UserRole.Student });
          navigate('/student');
        } else {
          setError('NISN tidak ditemukan.');
        }
      } else { // admin
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
          login({ id: 'admin01', name: 'Admin MTsN 1 Ciamis', role: UserRole.Admin });
          navigate('/admin');
        } else {
          setError('Username atau Password Admin salah.');
        }
      }
      setLoading(false);
    }, 500);
  };
  
  const activeTabClass = "border-b-2 border-indigo-500 text-indigo-600";
  const inactiveTabClass = "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login ke Portal Ujian
          </h2>
        </div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button 
              onClick={() => setRole('student')}
              className={`whitespace-nowrap py-4 px-1 text-base font-medium ${role === 'student' ? activeTabClass : inactiveTabClass}`}
            >
              Siswa
            </button>
            <button 
              onClick={() => setRole('admin')}
              className={`whitespace-nowrap py-4 px-1 text-base font-medium ${role === 'admin' ? activeTabClass : inactiveTabClass}`}
            >
              Admin
            </button>
          </nav>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username-input" className="sr-only">{role === 'student' ? 'NISN' : 'Username'}</label>
              <input
                id="username-input"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={role === 'student' ? 'Masukkan NISN' : 'Username Admin'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">Password</label>
              <input
                id="password-input"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={role === 'student' ? 'Password (NISN)' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
