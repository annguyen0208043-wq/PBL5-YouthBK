import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Users, Award, Mail, Phone, Clock3, X, History, Sparkles, Loader2, BookOpen, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';
import NotificationBell from './NotificationBell';

export default function StudentClassPointsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);

  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState(user.className || 'Lớp học');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal points history states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const fetchClassPoints = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/users/class-points', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tải danh sách điểm lớp');
      }

      setStudents(data.students || []);
      if (data.className) {
        setClassName(data.className);
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHistory = async (student) => {
    try {
      setSelectedStudent(student);
      setLoadingHistory(true);
      setHistoryError('');
      setPointsHistory([]);

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/class-points/${student.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tải lịch sử điểm');
      }

      setPointsHistory(data.history || []);
    } catch (err) {
      setHistoryError(err.message || 'Lỗi tải lịch sử điểm');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    fetchClassPoints();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Filter students based on search input
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  // Compute aggregate metrics
  const classMetrics = useMemo(() => {
    if (students.length === 0) return { total: 0, passed: 0, failed: 0 };
    const passedCount = students.filter((s) => (s.communityPoints || 0) >= 60).length;
    return {
      total: students.length,
      passed: passedCount,
      failed: students.length - passedCount
    };
  }, [students]);

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        
        {/* Sidebar Nav */}
        <aside className="app-sidebar hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Không gian sinh viên</p>
            </div>
          </div>

          <Link to="/sinhvien/profile" className="profile-user-chip mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md hover:bg-white/15 transition-all block text-white no-underline w-full min-w-0">
            <div className="flex items-center gap-3 w-full min-w-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="profile-user-avatar h-14 w-14 rounded-2xl border border-white/25 object-cover" />
              ) : (
                <div className="profile-user-avatar flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-black text-white">
                  {userInitials}
                </div>
              )}
              <div className="profile-user-meta">
                <p className="profile-user-name text-base font-bold text-white">{user.fullName}</p>
                <p className="profile-user-subtitle text-sm text-blue-100/85">Cán sự lớp: {className}</p>
              </div>
            </div>
          </Link>

          <nav className="space-y-2">
            <Link to="/sinhvien/event" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Sự kiện của tôi
            </Link>
            <Link to="/sinhvien/chat" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Chat sinh viên
            </Link>
            <Link to="/sinhvien/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Theo dõi điểm lớp</div>
            <Link to="/sinhvien/notifications" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Thông báo
            </Link>
          </nav>

          <div className="mt-auto pt-6">
            <button
              onClick={handleLogout}
              className="app-logout-button flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main ref={mainRef} className="app-main flex-1 flex flex-col h-screen overflow-hidden">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8 z-10 sticky top-0 flex-shrink-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Class Board</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Theo dõi điểm lớp</h1>
                <p className="mt-1 text-slate-500">Giám sát điểm phục vụ cộng đồng của toàn bộ thành viên lớp {className}.</p>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="profile-header-user rounded-[24px] border border-[#dce8f5] bg-[#f7fbff] px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="profile-user-avatar h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="profile-user-avatar flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] text-sm font-black text-white">
                        {userInitials}
                      </div>
                    )}
                    <div className="profile-user-meta">
                      <p className="profile-user-name font-bold text-[#132b57]">{user.fullName}</p>
                      <p className="profile-user-subtitle text-sm text-slate-500">MSSV: {user.studentId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Class KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[24px] border border-[#dce8f5] bg-white p-5 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#eef6ff] p-3 text-[#1747a6]">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Sĩ số lớp</p>
                      <h2 className="mt-1 text-2xl font-black text-[#132b57]">{classMetrics.total} sinh viên</h2>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[24px] border border-[#dce8f5] bg-white p-5 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Đạt chỉ tiêu</p>
                      <h2 className="mt-1 text-2xl font-black text-[#132b57]">{classMetrics.passed} sinh viên</h2>
                    </div>
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[24px] border border-[#dce8f5] bg-white p-5 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-1 bg-rose-500" />
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                      <X className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Chưa đạt chỉ tiêu</p>
                      <h2 className="mt-1 text-2xl font-black text-[#132b57]">{classMetrics.failed} sinh viên</h2>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Filters & Search */}
              <div className="rounded-[24px] border border-[#dce8f5] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 focus-within:border-[#1f5dcc] focus-within:bg-white transition-all">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-[#132b57] font-medium"
                    placeholder="Tìm sinh viên theo họ tên, MSSV, email..."
                  />
                </div>
              </div>

              {/* Main List */}
              {loading ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-[#dce8f5]">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
                  <p className="text-slate-500 font-semibold">Đang tải danh sách lớp...</p>
                </div>
              ) : error ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center text-red-700 font-semibold">
                  {error}
                </div>
              ) : (
                <div className="profile-panel overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-[#f7fbff] border-b border-[#dce8f5] text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Sinh viên</th>
                          <th className="px-6 py-4">Liên hệ</th>
                          <th className="px-6 py-4 text-center">Vai trò</th>
                          <th className="px-6 py-4 text-right">Điểm cộng đồng</th>
                          <th className="px-6 py-4 text-center">Trạng thái</th>
                          <th className="px-6 py-4 text-center">Lịch sử</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e7eff8] text-slate-700">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                              Không tìm thấy sinh viên nào phù hợp.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((s, idx) => {
                            const isMe = s.id === user.id;
                            const isMonitor = s.role === 'monitor';
                            return (
                              <tr key={s.id} className="hover:bg-[#fcfdfe] transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <span className="font-bold text-[#132b57] text-base flex items-center gap-1.5">
                                      {s.name}
                                      {isMe && (
                                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                          Tôi
                                        </span>
                                      )}
                                    </span>
                                    <p className="mt-1 text-sm text-slate-550">MSSV: {s.studentId || 'N/A'}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <p className="text-sm text-slate-650 flex items-center gap-1">
                                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                                      {s.email}
                                    </p>
                                    {s.phone && (
                                      <p className="text-sm text-slate-605 flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        {s.phone}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${isMonitor ? 'bg-indigo-150 text-indigo-700 bg-indigo-50 border border-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
                                    {isMonitor ? 'Ban cán sự' : 'Sinh viên'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700 border border-emerald-200">
                                    {s.communityPoints || 0} Điểm
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.status === 'Hoạt động' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => fetchStudentHistory(s)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce8f5] bg-white text-[#1747a6] hover:bg-[#eef6ff] transition-all hover:scale-105 active:scale-95 shadow-sm"
                                    title="Xem lịch sử điểm phục vụ cộng đồng"
                                  >
                                    <History className="h-4.5 w-4.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Point History Log Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedStudent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white z-10 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-[#132b57] flex items-center gap-2">
                    <History className="h-5.5 w-5.5 text-[#1747a6]" />
                    Lịch sử điểm cộng đồng
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sinh viên: {selectedStudent.name} (MSSV: {selectedStudent.studentId})</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-[#1f5dcc] animate-spin mb-2" />
                    <p className="text-sm font-semibold text-slate-500">Đang tải lịch sử điểm...</p>
                  </div>
                ) : historyError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 text-center">
                    {historyError}
                  </div>
                ) : pointsHistory.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 p-12 text-center text-slate-400 bg-white">
                    <BookOpen className="h-8 w-8 mx-auto text-slate-350 mb-3" />
                    <p className="text-sm font-bold">Chưa có lịch sử nhận điểm</p>
                    <p className="text-xs text-slate-400 mt-1">Sinh viên này chưa tham gia sự kiện nào tích lũy điểm phục vụ cộng đồng.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pointsHistory.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow transition-shadow flex items-start justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#132b57] break-words line-clamp-2">
                            {item.reason}
                          </h4>
                          {item.event && (
                            <div className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              Sự kiện: {item.event.title}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700 border border-emerald-250">
                          +{item.points} Điểm
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-xl px-5 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
