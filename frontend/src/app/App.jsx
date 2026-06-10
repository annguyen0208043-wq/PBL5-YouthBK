import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';
import AdminCreateEventPage from '../pages/admin/AdminCreateEventPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminEventApprovalPage from '../pages/admin/AdminEventApprovalPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminSystemSettingsPage from '../pages/admin/AdminSystemSettingsPage';
import AdminUserManagementPage from '../pages/admin/AdminUserManagementPage';
import AdminCertificateApprovalPage from '../pages/admin/AdminCertificateApprovalPage';
import AdminEventsPage from '../pages/admin/AdminEventsPage';
import LienChiCreateEventPage from '../pages/lienchi/LienChiCreateEventPage';
import LienChiDashboardPage from '../pages/lienchi/LienChiDashboardPage';
import LienChiManagedEventsPage from '../pages/lienchi/LienChiManagedEventsPage';
import LienChiEditEventPage from '../pages/lienchi/LienChiEditEventPage';
import LienChiRegistrationsPage from '../pages/lienchi/LienChiRegistrationsPage';
import LienChiNotificationsPage from '../pages/lienchi/LienChiNotificationsPage';
import StudentActivityHistoryPage from '../pages/student/StudentActivityHistoryPage';
import StudentChatPage from '../pages/student/StudentChatPage';
import StudentEventsPage from '../pages/student/StudentEventsPage';
import StudentNotificationPage from '../pages/student/StudentNotificationPage';
import PersonalProfilePage from '../pages/profile/PersonalProfilePage';
import StudentClassPointsPage from '../pages/student/StudentClassPointsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/profile" element={<PersonalProfilePage />} />
      <Route path="/admin/events" element={<AdminEventsPage />} />
      <Route path="/admin/events/create" element={<AdminCreateEventPage />} />
      <Route path="/admin/event-approvals" element={<AdminEventApprovalPage />} />
      <Route path="/admin/certificates" element={<AdminCertificateApprovalPage />} />
      <Route path="/admin/registrations" element={<LienChiRegistrationsPage />} />
      <Route path="/admin/users" element={<AdminUserManagementPage />} />
      <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
      <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
      <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      
      {/* Lien Chi Routes */}
      <Route path="/lien-chi" element={<LienChiDashboardPage />} />
      <Route path="/lien-chi/events/create" element={<LienChiCreateEventPage />} />
      <Route path="/lien-chi/events/manage" element={<LienChiManagedEventsPage />} />
      <Route path="/lien-chi/events/manage/edit/:id" element={<LienChiEditEventPage />} />
      <Route path="/lien-chi/registrations" element={<LienChiRegistrationsPage />} />
      <Route path="/lien-chi/notifications" element={<LienChiNotificationsPage />} />
      
      {/* Student Routes */}
      <Route path="/sinhvien" element={<Navigate to="/sinhvien/event" replace />} />
      <Route path="/sinhvien/chat" element={<StudentChatPage />} />
      <Route path="/sinhvien/event" element={<StudentEventsPage />} />
      <Route path="/sinhvien/history" element={<StudentActivityHistoryPage />} />
      <Route path="/sinhvien/notifications" element={<StudentNotificationPage />} />
      <Route path="/sinhvien/profile" element={<PersonalProfilePage />} />
      <Route path="/sinhvien/class-points" element={<StudentClassPointsPage />} />
    </Routes>
  );
}
