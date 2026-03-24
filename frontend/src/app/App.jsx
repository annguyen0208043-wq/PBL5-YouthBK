import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminEventApprovalPage from '../pages/admin/AdminEventApprovalPage';
import AdminUserManagementPage from '../pages/admin/AdminUserManagementPage';
import PersonalProfilePage from '../pages/profile/PersonalProfilePage';
import StudentActivityHistoryPage from '../pages/student/StudentActivityHistoryPage';
import StudentEventsPage from '../pages/student/StudentEventsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/event-approvals" element={<AdminEventApprovalPage />} />
      <Route path="/admin/users" element={<AdminUserManagementPage />} />
      <Route path="/profile" element={<PersonalProfilePage />} />
      <Route path="/student/events" element={<StudentEventsPage />} />
      <Route path="/student/history" element={<StudentActivityHistoryPage />} />
    </Routes>
  );
}
