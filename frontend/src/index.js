import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css'; // CRA에서 Tailwind를 사용중이면 설정된 index.css가 있어야 합니다.


const container = document.getElementById('root');
const root = createRoot(container);


root.render(
  
    <AuthProvider>
      <App />
    </AuthProvider>
  
);