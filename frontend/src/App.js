import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';


function App() {
  const { isLoggedIn, isLoading } = useAuth();


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        앱 로딩 중...
      </div>
    );
  }


  return isLoggedIn ? <HomePage /> : <LoginPage />;
}


export default App;