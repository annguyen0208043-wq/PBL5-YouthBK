import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PersonalProfilePage from '../pages/profile/PersonalProfilePage';
import StudentEventsPage from '../pages/student/StudentEventsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<PersonalProfilePage />} />
      <Route path="/student/events" element={<StudentEventsPage />} />
    </Routes>
  );
}
