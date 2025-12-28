
import React from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img src="https://picsum.photos/40/40" alt="Logo" className="h-10 w-10 rounded-full" />
            <h1 className="text-xl font-bold text-gray-800">Ujian Online MTsN 1 Ciamis</h1>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-700">{user.name}</p>
                <p className="text-sm text-gray-500">{user.role === UserRole.Admin ? 'Administrator' : `NISN: ${user.id}`}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
