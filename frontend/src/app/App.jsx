import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';
import AdminCreateEventPage from '../pages/admin/AdminCreateEventPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminEventApprovalPage from '../pages/admin/AdminEventApprovalPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminSystemSettingsPage from '../pages/admin/AdminSystemSettingsPage';
import AdminUserManagementPage from '../pages/admin/AdminUserManagementPage';
import AdminCertificateApprovalPage from '../pages/admin/AdminCertificateApprovalPage';
import LienChiCreateEventPage from '../pages/lienchi/LienChiCreateEventPage';
import LienChiDashboardPage from '../pages/lienchi/LienChiDashboardPage';
import LienChiEvidenceApprovalPage from '../pages/lienchi/LienChiEvidenceApprovalPage';
import LienChiManagedEventsPage from '../pages/lienchi/LienChiManagedEventsPage';
import LienChiRegistrationsPage from '../pages/lienchi/LienChiRegistrationsPage';
import PersonalProfilePage from '../pages/profile/PersonalProfilePage';
import StudentActivityHistoryPage from '../pages/student/StudentActivityHistoryPage';
import StudentChatPage from '../pages/student/StudentChatPage';
import StudentEventsPage from '../pages/student/StudentEventsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/events/create" element={<AdminCreateEventPage />} />
      <Route path="/admin/event-approvals" element={<AdminEventApprovalPage />} />
      <Route path="/admin/certificates" element={<AdminCertificateApprovalPage />} />
      <Route path="/admin/users" element={<AdminUserManagementPage />} />
      <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
      <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
      <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      <Route path="/lien-chi" element={<LienChiDashboardPage />} />
      <Route path="/lien-chi/events/create" element={<LienChiCreateEventPage />} />
      <Route path="/lien-chi/events/manage" element={<LienChiManagedEventsPage />} />
      <Route path="/lien-chi/registrations" element={<LienChiRegistrationsPage />} />
      <Route path="/lien-chi/evidences" element={<LienChiEvidenceApprovalPage />} />
      <Route path="/profile" element={<PersonalProfilePage />} />
      <Route path="/student/chat" element={<StudentChatPage />} />
      <Route path="/student/events" element={<StudentEventsPage />} />
      <Route path="/student/history" element={<StudentActivityHistoryPage />} />
    </Routes>
  );
}
