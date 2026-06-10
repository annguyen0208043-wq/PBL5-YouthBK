import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, CalendarClock, CheckCircle2, Clock3, Download, FileBadge2, History, LogOut, Stamp, X, MapPin, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';
import NotificationBell from './NotificationBell';

function statusTone(status) {
  if (status === 'completed' || status === 'ended') return 'bg-emerald-100 text-emerald-700';
  if (status === 'ongoing') return 'bg-blue-100 text-blue-700';
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function getStatusLabel(status) {
  if (status === 'completed' || status === 'ended') return 'Đã kết thúc';
  if (status === 'ongoing') return 'Đang diễn ra';
  if (status === 'cancelled') return 'Đã hủy';
  return 'Sắp diễn ra';
}

export default function StudentActivityHistoryPage({ embedded = false } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);
  
  const [dbEvents, setDbEvents] = useState([]);
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [certificateNotice, setCertificateNotice] = useState('');
  const [viewCertModal, setViewCertModal] = useState({ show: false, url: '' });
  const [viewEventModal, setViewEventModal] = useState({ show: false, event: null });
  
  const [activeTab, setActiveTab] = useState('all'); // all, joined, ended

  const fetchHistoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [eventsRes, certsRes] = await Promise.all([
        fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/certificates/mine', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setDbEvents(data.events || []);
      }
      if (certsRes.ok) {
        const data = await certsRes.json();
        setCertificateRequests(data.certificates || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    fetchHistoryData();
  }, [location.pathname]);

  const joinedActivities = useMemo(() => {
    return dbEvents.filter(e => e.isRegistered && !['completed', 'ended'].includes(e.status));
  }, [dbEvents]);

  const endedActivities = useMemo(() => {
    return dbEvents.filter(e => e.isRegistered && ['completed', 'ended'].includes(e.status));
  }, [dbEvents]);

  const filteredActivities = useMemo(() => {
    if (activeTab === 'joined') return joinedActivities;
    if (activeTab === 'ended') return endedActivities;
    return dbEvents.filter(e => e.isRegistered);
  }, [dbEvents, activeTab, joinedActivities, endedActivities]);



  const exportCertificatePdf = (request) => {
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
        <h2 style="margin:26px 0 0; text-align:center; font-size:38px; color:#132b57; font-weight:900;">${request.activityTitle}</h2>
        <div style="margin-top:42px; font-size:24px; line-height:1.7; color:#1e293b;">
          <div><strong>Sinh viên:</strong> ${user.fullName}</div>
          <div><strong>MSSV:</strong> ${user.studentId}</div>
          <div><strong>Người duyệt:</strong> ${request.approverName || 'Đoàn trường'}</div>
          <div><strong>Thời điểm duyệt:</strong> ${new Date(request.approvedAt || Date.now()).toLocaleString('vi-VN')}</div>
          <div><strong>Mã mộc:</strong> ${request.stampCode || 'PENDING'}</div>
        </div>
        <div style="position:absolute; right:62px; bottom:86px; width:180px; height:180px; border:4px solid #b12020; border-radius:50%; color:#b12020; display:flex; flex-direction:column; align-items:center; justify-content:center; transform:rotate(-12deg); font-weight:800;">
          <div style="font-size:20px;">ĐÃ DUYỆT</div>
          <div style="font-size:16px; margin-top:4px;">ĐOÀN TRƯỜNG</div>
          <div style="font-size:16px;">BK-YOUTH</div>
        </div>
        <div style="position:absolute; left:42px; right:42px; bottom:34px; text-align:center; font-size:16px; color:#64748b;">
          Chứng nhận điện tử - phát hành bởi hệ thống BK-YOUTH
        </div>
      </div>
    `;

    document.body.appendChild(exportNode);

    html2canvas(exportNode, { scale: 2, useCORS: true, backgroundColor: '#f7faff' })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });
        doc.addImage(imgData, 'PNG', 0, 0, 297, 210);
        const safeTitle = request.activityTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        doc.save(`chung-nhan-${safeTitle}-${user.studentId}.pdf`);
      })
      .finally(() => {
        document.body.removeChild(exportNode);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={embedded ? 'w-full' : 'profile-page p-4 sm:p-6'}>
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className={embedded ? 'hidden' : 'app-sidebar hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col'}>
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
                <p className="profile-user-subtitle text-sm text-blue-100/85">MSSV: {user.studentId}</p>
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
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Lịch sử hoạt động</div>
            {['monitor', 'ban cán sự', 'ban can su'].includes(user.role?.toLowerCase()) && (
              <Link to="/sinhvien/class-points" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
                Theo dõi điểm lớp
              </Link>
            )}
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

        <main ref={mainRef} className="app-main flex-1 flex flex-col h-screen overflow-hidden">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8 z-10 sticky top-0 flex-shrink-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Lịch sử hoạt động</h1>
                <p className="mt-1 text-slate-500">Quản lý các sự kiện đã tham gia và chứng nhận hoạt động.</p>
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
            <div className="max-w-5xl mx-auto space-y-8">
              {certificateNotice && (
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 flex justify-between items-center shadow-sm">
                  <span>{certificateNotice}</span>
                  <button onClick={() => setCertificateNotice('')} className="p-1 hover:bg-emerald-100 rounded-full transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* TABS */}
              <div className="flex items-center gap-3 border-b border-slate-200 pb-px">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-5 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'all' ? 'border-[#1747a6] text-[#1747a6]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  Tất cả ({dbEvents.filter(e => e.isRegistered).length})
                </button>
                <button
                  onClick={() => setActiveTab('joined')}
                  className={`px-5 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'joined' ? 'border-[#1747a6] text-[#1747a6]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  Đã tham gia ({joinedActivities.length})
                </button>
                <button
                  onClick={() => setActiveTab('ended')}
                  className={`px-5 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'ended' ? 'border-[#1747a6] text-[#1747a6]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  Đã kết thúc ({endedActivities.length})
                </button>
              </div>

              {/* LIST ACTIVITIES */}
              <div className="space-y-4">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-[32px] border border-dashed border-slate-300">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-[#132b57] mb-2">Không có sự kiện nào</h3>
                    <p className="text-slate-500">Chưa có dữ liệu sự kiện phù hợp với bộ lọc hiện tại.</p>
                  </div>
                ) : (
                  filteredActivities.map((event) => {
                    const isEnded = ['completed', 'ended'].includes(event.status);
                    
                    return (
                      <motion.article
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone(event.status)}`}>
                                {getStatusLabel(event.status)}
                              </span>
                              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" />
                                {new Date(event.plannedStartDate).toLocaleDateString('vi-VN')}
                              </span>
                              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {event.locationName}
                              </span>
                            </div>
                            <h2 className="text-xl font-black text-[#132b57] mb-2 group-hover:text-[#1747a6] transition-colors">{event.title}</h2>
                            <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-3 lg:w-[240px] lg:border-l lg:border-slate-100 lg:pl-6">
                            {!isEnded ? (
                              <button
                                onClick={() => setViewEventModal({ show: true, event })}
                                className="w-full flex justify-between items-center gap-2 rounded-2xl bg-blue-50 px-5 py-4 font-bold text-[#1747a6] transition-all hover:bg-blue-100"
                              >
                                <span>Xem chi tiết</span>
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            ) : (
                              <div className="w-full rounded-2xl bg-[#f5f9ff] px-4 py-4 text-sm">
                                <p className="font-bold text-[#132b57] mb-2">Chứng nhận hoạt động</p>
                                {(() => {
                                  const existingCert = certificateRequests.find(c => c.eventId === event.id && c.status === 'approved');
                                  if (existingCert && existingCert.certificateUrl) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => setViewCertModal({ show: true, url: existingCert.certificateUrl })}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1747a6] px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#205fd8] hover:-translate-y-0.5 active:scale-95 shadow-md shadow-blue-500/20"
                                      >
                                        <Award className="h-4 w-4" />
                                        Xem Chứng Nhận
                                      </button>
                                    );
                                  }
                                  
                                  return (
                                    <span className="inline-flex w-full justify-center rounded-xl bg-slate-50 text-slate-500 px-3 py-2.5 text-xs font-bold border border-slate-200">
                                      Đang chờ cấp chứng nhận
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {viewCertModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
              onClick={() => setViewCertModal({ show: false, url: '' })} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col max-h-full"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white z-10 shrink-0">
                <h3 className="text-xl font-black text-[#132b57] flex items-center gap-2">
                  <Award className="h-6 w-6 text-[#1747a6]" />
                  Giấy Chứng Nhận Điện Tử
                </h3>
                <div className="flex items-center gap-3">
                  <a
                    href={viewCertModal.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1747a6] to-[#205fd8] px-5 py-2.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 hover:-translate-y-0.5"
                  >
                    <Download className="h-4 w-4" />
                    Tải ảnh gốc
                  </a>
                  <button
                    onClick={() => setViewCertModal({ show: false, url: '' })}
                    className="rounded-full bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 to-white flex justify-center items-center min-h-[50vh]">
                <img 
                  src={viewCertModal.url} 
                  alt="Chứng nhận điện tử" 
                  className="max-h-[70vh] w-auto rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 object-contain" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AnimatePresence>
        {viewEventModal.show && viewEventModal.event && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setViewEventModal({ show: false, event: null })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col max-h-full"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white z-10 shrink-0">
                <h3 className="text-xl font-black text-[#132b57] flex items-center gap-2">
                  Thông tin sự kiện
                </h3>
                <button
                  onClick={() => setViewEventModal({ show: false, event: null })}
                  className="rounded-full bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-[#132b57] mb-3">{viewEventModal.event.title}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone(viewEventModal.event.status)}`}>
                        {getStatusLabel(viewEventModal.event.status)}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" />
                        {new Date(viewEventModal.event.plannedStartDate).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {viewEventModal.event.locationName}
                      </span>
                    </div>
                  </div>

                  {viewEventModal.event.description && (
                    <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-200">
                      <h4 className="text-lg font-bold text-[#132b57] mb-3">Mô tả sự kiện</h4>
                      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{viewEventModal.event.description}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">Điểm rèn luyện</h4>
                      <p className="text-[#132b57] font-bold text-lg">{viewEventModal.event.points || '+5 ĐRL'}</p>
                    </div>
                    {viewEventModal.event.communityPoints > 0 && (
                      <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">Điểm cộng đồng</h4>
                        <p className="text-emerald-600 font-bold text-lg">+{viewEventModal.event.communityPoints}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setViewEventModal({ show: false, event: null })}
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
