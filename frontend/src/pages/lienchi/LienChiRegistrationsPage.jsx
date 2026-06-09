import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, CheckCircle2, XCircle, Trash2, UserPlus, Save, AlertCircle, X, MapPin, Mail, Phone, Award } from 'lucide-react';
import LienChiLayout from '../../components/lienchi/LienChiLayout';
import AdminLayout from '../../components/admin/AdminLayout';
import { getStoredUserProfile } from '../../shared/user/session';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function LienChiRegistrationsPage() {
  const user = getStoredUserProfile();
  const isAdmin = user.role === 'admin';
  const Layout = isAdmin ? AdminLayout : LienChiLayout;

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // States for manual add
  const [newStudentId, setNewStudentId] = useState('');
  const [addFeedback, setAddFeedback] = useState({ type: '', message: '' });

  // States for student detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    } else {
      setRegistrations([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        let approvedEvents = data.events.filter(e => e.status === 'approved' || e.status === 'ongoing');

        setEvents(approvedEvents);
        if (approvedEvents.length > 0) {
          setSelectedEventId(approvedEvents[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRegistrations = async (eventId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations);
      } else {
        setRegistrations([]);
      }
    } catch (err) {
      console.error(err);
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (registrationId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/events/registrations/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchRegistrations(selectedEventId);
      } else {
        const err = await response.json();
        alert(err.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sinh viên này khỏi danh sách?')) return;
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/events/registrations/${registrationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchRegistrations(selectedEventId);
      } else {
        const err = await response.json();
        alert(err.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleIssueCertificate = async (reg) => {
    const studentUser = reg.User || {};
    const event = events.find(e => e.id === selectedEventId) || { title: 'Sự kiện BK-Youth' };
    
    // Auto-approve in backend if not already requested
    try {
      const token = localStorage.getItem('token') || '';
      await fetch('/api/certificates/request', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, activityTitle: event.title, studentIdOverride: studentUser.id })
      });
    } catch (e) {
      console.log('Error auto-requesting certificate:', e);
    }
    
    // Generate PDF immediately for Lien Chi to download
    const exportNode = document.createElement('div');
    exportNode.style.position = 'fixed';
    exportNode.style.left = '-99999px';
    exportNode.style.top = '0';
    exportNode.style.width = '1200px';
    exportNode.style.height = '848px';
    exportNode.style.background = '#f7faff';
    exportNode.style.border = '6px solid #113b90';
    exportNode.style.padding = '44px';
    exportNode.style.fontFamily = '"Segoe UI", Arial, sans-serif';
    exportNode.style.color = '#132b57';
    exportNode.innerHTML = `
      <div style="height:100%; border:2px solid #8cb4eb; position:relative; padding:36px 42px; box-sizing:border-box;">
        <div style="text-align:center; letter-spacing:2px; font-size:14px; font-weight:700; color:#1f5dcc;">HỆ THỐNG BK-YOUTH</div>
        <h1 style="margin:18px 0 8px; text-align:center; font-size:48px; color:#113b90; font-weight:900;">GIẤY CHỨNG NHẬN</h1>
        <p style="margin:0; text-align:center; font-size:24px; color:#334155;">Xác nhận sinh viên đã hoàn thành hoạt động</p>
        <h2 style="margin:26px 0 0; text-align:center; font-size:38px; color:#132b57; font-weight:900;">${event.title}</h2>
        <div style="margin-top:42px; font-size:24px; line-height:1.7; color:#1e293b;">
          <div><strong>Sinh viên:</strong> ${studentUser.fullName || ''}</div>
          <div><strong>MSSV:</strong> ${studentUser.studentId || ''}</div>
          <div><strong>Người duyệt:</strong> ${user.fullName || 'Đoàn trường'}</div>
          <div><strong>Thời điểm duyệt:</strong> ${new Date().toLocaleString('vi-VN')}</div>
          <div><strong>Mã mộc:</strong> BKYOUTH-${user.role === 'admin' ? 'DOANTRUONG' : 'LIENCHI'}-APPROVED</div>
        </div>
        <div style="position:absolute; right:62px; bottom:86px; width:180px; height:180px; border:4px solid #b12020; border-radius:50%; color:#b12020; display:flex; flex-direction:column; align-items:center; justify-content:center; transform:rotate(-12deg); font-weight:800;">
          <div style="font-size:20px;">ĐÃ DUYỆT</div>
          <div style="font-size:16px; margin-top:4px;">${user.role === 'admin' ? 'ĐOÀN TRƯỜNG' : 'LIÊN CHI ĐOÀN'}</div>
          <div style="font-size:16px;">BK-YOUTH</div>
        </div>
        <div style="position:absolute; left:42px; right:42px; bottom:34px; text-align:center; font-size:16px; color:#64748b;">
          Chứng nhận điện tử - phát hành bởi hệ thống BK-YOUTH
        </div>
      </div>
    `;

    document.body.appendChild(exportNode);
    setAddFeedback({ type: 'info', message: 'Đang tạo minh chứng...' });

    html2canvas(exportNode, { scale: 2, useCORS: true, backgroundColor: '#f7faff' })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });
        doc.addImage(imgData, 'PNG', 0, 0, 297, 210);
        const safeTitle = event.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        doc.save(`chung-nhan-${safeTitle}-${studentUser.studentId}.pdf`);
        setAddFeedback({ type: 'success', message: 'Cấp minh chứng thành công!' });
      })
      .catch(() => {
        setAddFeedback({ type: 'error', message: 'Lỗi khi tạo PDF' });
      })
      .finally(() => {
        document.body.removeChild(exportNode);
        setTimeout(() => setAddFeedback({ type: '', message: '' }), 3000);
      });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentId.trim()) return;
    
    try {
      setAddFeedback({ type: 'info', message: 'Đang xử lý...' });
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/events/${selectedEventId}/registrations/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: newStudentId.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        setAddFeedback({ type: 'success', message: 'Thêm thành công!' });
        setNewStudentId('');
        fetchRegistrations(selectedEventId);
        setTimeout(() => setAddFeedback({ type: '', message: '' }), 3000);
      } else {
        setAddFeedback({ type: 'error', message: data.message || 'Có lỗi xảy ra' });
      }
    } catch (err) {
      setAddFeedback({ type: 'error', message: 'Lỗi kết nối máy chủ' });
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const user = reg.User || {};
    return (
      (user.fullName || '').toLowerCase().includes(s) ||
      (user.studentId || '').toLowerCase().includes(s) ||
      (user.department || '').toLowerCase().includes(s)
    );
  });

  return (
    <Layout currentPath={isAdmin ? "/admin/registrations" : "/lien-chi/registrations"} title="Quản lý người đăng ký" subtitle="Xem, chỉnh sửa, thêm hoặc xoá sinh viên trong danh sách đăng ký.">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-6 md:grid-cols-12">
          {/* Cột chọn sự kiện */}
          <div className="md:col-span-4 lg:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-700">Chọn sự kiện</label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 outline-none transition-all focus:border-[#1747a6] focus:ring-4 focus:ring-[#1747a6]/10 text-sm"
              >
                {events.length === 0 && <option value="">Không có sự kiện</option>}
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Cột tìm kiếm */}
          <div className="md:col-span-8 lg:col-span-9 flex items-end">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm theo tên, MSSV hoặc lớp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none transition-all focus:border-[#1747a6] focus:ring-4 focus:ring-[#1747a6]/10"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Khung Table */}
        <div className="mb-8 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8fafc] text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4">Lớp</th>
                  <th className="px-6 py-4">Khoa</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Điểm danh</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Không có dữ liệu phù hợp.</td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const user = reg.User || {};
                    const isCancelled = reg.status === 'cancelled';
                    return (
                      <tr key={reg.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedStudent(user)}
                            className="font-bold text-[#132b57] text-left hover:text-[#1747a6] hover:underline transition-all"
                          >
                            {user.fullName}
                          </button>
                          <div className="mt-1 text-xs text-slate-500">MSSV: {user.studentId}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">{user.department || '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{user.faculty || '-'}</td>
                        <td className="px-6 py-4">
                          {reg.status === 'registered' && <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">Đã đăng ký</span>}
                          {reg.status === 'attended' && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">Đã tham gia</span>}
                          {reg.status === 'cancelled' && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">Đã hủy</span>}
                        </td>
                        <td className="px-6 py-4">
                          {reg.status === 'attended' ? (
                            <span className="font-semibold text-emerald-600">Đã check-in</span>
                          ) : (
                            <span className="text-slate-400">Chưa check-in</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {reg.status === 'attended' && (
                              <button
                                onClick={() => handleIssueCertificate(reg)}
                                className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                                title="Cấp minh chứng ngay"
                              >
                                <Award className="h-5 w-5" />
                              </button>
                            )}
                            {reg.status !== 'cancelled' && (
                              <button
                                onClick={() => handleUpdateStatus(reg.id, reg.status === 'attended' ? 'registered' : 'attended')}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1747a6]"
                                title={reg.status === 'attended' ? 'Hủy check-in' : 'Check-in'}
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </button>
                            )}
                            {reg.status !== 'cancelled' && (
                              <button
                                onClick={() => handleUpdateStatus(reg.id, 'cancelled')}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Hủy đăng ký"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRegistration(reg.id)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Xóa khỏi danh sách"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Khung chức năng */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Thêm người đăng ký */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#132b57]">Thêm người đăng ký thủ công</h3>
                <p className="text-sm text-slate-500">Mô phỏng luồng bổ sung sinh viên vào sự kiện do liên chi quản lý.</p>
              </div>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Mã Số Sinh Viên (MSSV)</label>
                <input
                  type="text"
                  placeholder="Nhập MSSV (vd: 102230046)"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-[#1747a6] focus:ring-4 focus:ring-[#1747a6]/10"
                />
              </div>
              
              <AnimatePresence>
                {addFeedback.message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
                      addFeedback.type === 'error' ? 'bg-red-50 text-red-600' :
                      addFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    {addFeedback.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!selectedEventId}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8] active:scale-[0.98] disabled:opacity-50"
              >
                Thêm sinh viên
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl"
            >
              <div className="bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] px-6 py-8 text-center text-white">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-black backdrop-blur-md">
                  {selectedStudent.fullName?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-black">{selectedStudent.fullName}</h2>
                <p className="mt-1 font-medium text-blue-100">MSSV: {selectedStudent.studentId}</p>
              </div>

              <div className="p-6">
                <div className="space-y-4 text-slate-600">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <span>{selectedStudent.email || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <span>{selectedStudent.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <span>Lớp {selectedStudent.department} - {selectedStudent.faculty}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold text-emerald-600">{selectedStudent.communityPoints || 0} điểm cộng đồng tích lũy</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="mt-8 w-full rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-600 hover:bg-slate-200"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
