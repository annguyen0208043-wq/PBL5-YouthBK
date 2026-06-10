import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, CalendarClock, CheckCheck, Loader, ShieldAlert, Users, BarChart3, MapPin, Tag, Clock, FileText, CheckCircle2, AlertTriangle, X, ChevronLeft, ChevronRight, MessageSquare, QrCode } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { getStoredUserProfile } from '../../shared/user/session';

const summaryIcons = {
  'pending-events': CalendarClock,
  'active-accounts': Users,
  'today-notices': Bell,
};

const summaryUnits = {
  'pending-events': 'sự kiện',
  'active-accounts': 'tài khoản',
  'today-notices': 'thông báo',
};

function formatDateTime(value) {
  if (!value) return 'Chưa xác định';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isToday(dateValue) {
  if (!dateValue) return false;
  const current = new Date();
  const target = new Date(dateValue);
  return (
    current.getFullYear() === target.getFullYear() &&
    current.getMonth() === target.getMonth() &&
    current.getDate() === target.getDate()
  );
}

function translateStatus(status) {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'pending': return 'Chờ duyệt';
    case 'approved': return 'Đã duyệt';
    case 'ongoing': return 'Đang diễn ra';
    case 'completed': return 'Đã kết thúc';
    case 'cancelled': return 'Đã hủy';
    case 'revision_required': return 'Cần chỉnh sửa';
    default: return status;
  }
}

function statusTone(status) {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-700';
    case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'approved': return 'bg-emerald-100 text-emerald-700 border border-emerald-250';
    case 'ongoing': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'completed': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case 'cancelled': return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'revision_required': return 'bg-orange-100 text-orange-700 border border-orange-200';
    default: return 'bg-slate-100 text-slate-700';
  }
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUserProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allEvents, setAllEvents] = useState([]);

  // Detail Modal states
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [eventsResponse, ongoingEventsResponse, usersResponse, notificationsResponse, allEventsResponse] = await Promise.all([
        fetch('/api/events/pending', { headers }),
        fetch('/api/events?status=ongoing', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/notifications/sent', { headers }),
        fetch('/api/events', { headers }),
      ]);

      if (!eventsResponse.ok) {
        const payload = await eventsResponse.json().catch(() => ({}));
        throw new Error(payload.message || 'Không thể tải danh sách sự kiện chờ duyệt');
      }

      if (!usersResponse.ok) {
        const payload = await usersResponse.json().catch(() => ({}));
        throw new Error(payload.message || 'Không thể tải danh sách tài khoản');
      }

      if (!notificationsResponse.ok) {
        const payload = await notificationsResponse.json().catch(() => ({}));
        throw new Error(payload.message || 'Không thể tải danh sách thông báo');
      }

      if (!allEventsResponse.ok) {
        const payload = await allEventsResponse.json().catch(() => ({}));
        throw new Error(payload.message || 'Không thể tải danh sách tất cả sự kiện');
      }

      const eventsData = await eventsResponse.json();
      const ongoingEventsData = await ongoingEventsResponse.json();
      const usersData = await usersResponse.json();
      const notificationsData = await notificationsResponse.json();
      const allEventsData = await allEventsResponse.json();

      setPendingEvents(eventsData.events || []);
      setOngoingEvents(ongoingEventsData.events || []);
      setUsers(usersData.users || []);
      setNotifications(notificationsData.notifications || []);
      setAllEvents(allEventsData.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Load event details when selectedEventId changes
  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/events/${selectedEventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Không thể tải chi tiết sự kiện');
        const data = await response.json();
        setSelectedEvent(data.event);
        setCarouselIndex(0);
      } catch (err) {
        setError(`Lỗi tải chi tiết: ${err.message}`);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedEventId]);

  const summaryCards = useMemo(() => {
    const activeAccounts = users.filter((item) => item.status === 'Hoạt động').length;
    const todayNotices = notifications.filter((item) => isToday(item.createdAt)).length;

    return [
      {
        id: 'pending-events',
        label: 'Sự kiện chờ duyệt',
        value: pendingEvents.length,
        description: 'Cần thẩm định phê duyệt',
        color: 'from-amber-500 to-orange-500',
        tone: 'bg-amber-50 text-amber-600',
      },
      {
        id: 'active-accounts',
        label: 'Tài khoản hoạt động',
        value: activeAccounts,
        description: 'Đoàn viên & Cán bộ Đoàn',
        color: 'from-[#1747a6] to-[#205fd8]',
        tone: 'bg-[#f4f8ff] text-[#1747a6]',
      },
      {
        id: 'today-notices',
        label: 'Thông báo hôm nay',
        value: todayNotices,
        description: 'Đã gửi đến các đơn vị',
        color: 'from-purple-500 to-indigo-500',
        tone: 'bg-purple-50 text-purple-650',
      },
    ];
  }, [notifications, pendingEvents, users]);

  const activeAccounts = useMemo(
    () => users.filter((item) => item.status === 'Hoạt động').length,
    [users]
  );

  const facultyStats = useMemo(() => {
    const counts = {
      'CNTT': 0,
      'Cơ khí': 0,
      'Điện': 0,
      'Xây dựng': 0,
      'Kinh tế': 0,
      'Khác': 0
    };

    allEvents.forEach(event => {
      const creatorFaculty = event.creator?.faculty || '';
      const facLower = creatorFaculty.toLowerCase();

      if (facLower.includes('cong nghe thong tin') || facLower.includes('cntt') || facLower.includes('it')) {
        counts['CNTT']++;
      } else if (facLower.includes('co khi')) {
        counts['Cơ khí']++;
      } else if (facLower.includes('dien')) {
        counts['Điện']++;
      } else if (facLower.includes('xay dung')) {
        counts['Xây dựng']++;
      } else if (facLower.includes('kinh te') || facLower.includes('quan ly du an')) {
        counts['Kinh tế']++;
      } else {
        counts['Khác']++;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [allEvents]);

  return (
    <AdminLayout
      currentPath="/admin"
      title="Tổng quan quản trị"
      subtitle="Theo dõi nhanh các đầu việc quan trọng của Đoàn trường bằng dữ liệu đồng bộ trực tiếp từ hệ thống."
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-[#1747a6]" />
            <p className="text-slate-650 font-semibold">Đang đồng bộ dữ liệu tổng quan...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#0f3276] to-[#1849a6] p-6 md:p-8 text-white shadow-lg shadow-[#0f3276]/10">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black md:text-3xl">Xin chào, {user?.fullName || 'Quản trị viên'}!</h2>
                <p className="mt-2 text-sm text-blue-100/90 font-medium">Hệ thống đang hoạt động ổn định. Dưới đây là phân tích hoạt động và các đầu việc cần xử lý.</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Hệ thống: Live</span>
              </div>
            </div>
            {/* Decorative layout circles */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-white/5" />
          </div>

          {error ? (
            <div className="rounded-[24px] border border-rose-250 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm">
              Lỗi đồng bộ dữ liệu: {error}
            </div>
          ) : null}

          {/* Stats metrics widgets row */}
          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <motion.div key={card.id} whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className={`rounded-2xl p-3 ${card.tone}`}>
                    {(() => {
                      const Icon = summaryIcons[card.id] || Bell;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">{summaryUnits[card.id]}</span>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <h2 className="text-4xl font-black tracking-tight text-[#132b57] mt-1.5">{card.value}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dashboard Main Grid Content */}
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Left Column: Events lists */}
            <section className="space-y-5">
              {/* Pending approvals */}
              <motion.div whileHover={{ y: -2 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-[#e7eff8] pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1f5dcc]">Đang chờ thẩm định</p>
                    <h3 className="mt-1 text-xl font-black text-[#132b57]">Sự kiện chờ duyệt nổi bật</h3>
                  </div>
                  <Link to="/admin/event-approvals" className="inline-flex items-center gap-2 rounded-xl bg-[#1747a6] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#205fd8] shadow-sm">
                    Quản lý duyệt
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {pendingEvents.length === 0 ? (
                    <div className="rounded-[24px] bg-[#f8fbff] p-6 text-center text-slate-550 border border-[#dce8f5] border-dashed">
                      Hiện không có sự kiện nào đang chờ duyệt.
                    </div>
                  ) : (
                    pendingEvents.slice(0, 3).map((event) => (
                      <motion.button
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        whileHover={{ x: 3, backgroundColor: '#f9fbfe' }}
                        className="w-full text-left rounded-[24px] bg-[#f8fbff] border border-[#dce8f5] p-5 block transition-all relative group cursor-pointer"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-black text-[#132b57] group-hover:text-[#1747a6] transition-colors">{event.title}</p>
                            <p className="mt-1 text-xs text-slate-500 font-medium">Đơn vị tạo: <span className="font-bold text-[#1f5dcc]">{event.creator?.name || 'Văn phòng Đoàn'}</span></p>
                          </div>
                          <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black leading-none uppercase ${statusTone(event.status)}`}>
                            {translateStatus(event.status)}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-550 font-medium">
                          <span>Dự kiến: {formatDateTime(event.plannedStartDate)}</span>
                          <span className="text-slate-400 group-hover:text-[#1747a6] flex items-center gap-1 transition-all">Xem chi tiết <ArrowRight className="h-3 w-3" /></span>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Ongoing Events */}
              <motion.div whileHover={{ y: -2 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-[#e7eff8] pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1f5dcc]">Hoạt động thực tế</p>
                    <h3 className="mt-1 text-xl font-black text-[#132b57]">Sự kiện đang diễn ra</h3>
                  </div>
                  <Link to="/admin/events" className="inline-flex items-center gap-2 rounded-xl bg-[#eef6ff] px-4 py-2.5 text-xs font-bold text-[#1747a6] transition-all hover:bg-[#dce8f5]">
                    Xem danh sách
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {ongoingEvents.length === 0 ? (
                    <div className="rounded-[24px] bg-[#f8fbff] p-6 text-center text-slate-550 border border-[#dce8f5] border-dashed">
                      Hiện không có sự kiện nào đang diễn ra trên thực tế.
                    </div>
                  ) : (
                    ongoingEvents.slice(0, 3).map((event) => (
                      <motion.button
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        whileHover={{ x: 3, backgroundColor: '#f9fbfe' }}
                        className="w-full text-left rounded-[24px] bg-[#f8fbff] border border-[#dce8f5] p-5 block transition-all relative group cursor-pointer"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-black text-[#132b57] group-hover:text-[#1747a6] transition-colors">{event.title}</p>
                            <p className="mt-1 text-xs text-slate-500 font-medium">Chủ trì: <span className="font-bold text-[#1f5dcc]">{event.creator?.name || 'N/A'}</span></p>
                          </div>
                          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase leading-none">
                            Đang diễn ra
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 font-medium">
                          <span>Địa điểm: {event.locationName}</span>
                          <span className="text-slate-400 group-hover:text-[#1747a6] flex items-center gap-1 transition-all">Xem chi tiết <ArrowRight className="h-3 w-3" /></span>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            </section>

            {/* Right Column: Faculty statistics + User management link */}
            <section className="space-y-5">
              {/* Account Quick Widget */}
              <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#132b57]">Quản lý tài khoản</h3>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] bg-[#f8fbff] border border-[#dce8f5] p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số tài khoản đang hoạt động</p>
                  <p className="mt-2 text-4xl font-black text-[#132b57]">{activeAccounts}</p>
                </div>

                <div className="mt-5">
                  <Link to="/admin/users" className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8] shadow-sm">
                    Mở quản lý người dùng
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Faculty activities widget */}
              <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#e7eff8] pb-4">
                  <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#132b57]">Hoạt động Liên chi đoàn</h3>
                    <p className="text-xs text-slate-500">Phân bổ sự kiện tổ chức theo từng Khoa.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {facultyStats.map((item) => {
                    const maxCount = Math.max(...facultyStats.map(f => f.count), 1);
                    const barWidthPercent = (item.count / maxCount) * 100;
                    
                    let barColorClass = 'bg-gradient-to-r from-blue-500 to-indigo-500';
                    if (item.name === 'CNTT') barColorClass = 'bg-gradient-to-r from-[#1747a6] to-[#205fd8]';
                    else if (item.name === 'Cơ khí') barColorClass = 'bg-gradient-to-r from-amber-500 to-orange-500';
                    else if (item.name === 'Điện') barColorClass = 'bg-gradient-to-r from-emerald-500 to-teal-500';
                    else if (item.name === 'Xây dựng') barColorClass = 'bg-gradient-to-r from-rose-500 to-red-500';
                    else if (item.name === 'Kinh tế') barColorClass = 'bg-gradient-to-r from-purple-500 to-pink-500';
                    else if (item.name === 'Khác') barColorClass = 'bg-gradient-to-r from-slate-400 to-slate-500';

                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#132b57]">{item.name}</span>
                          <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                            {item.count} sự kiện
                          </span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidthPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${barColorClass}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </section>
          </div>
        </div>
      )}

      {/* ===== DETAILED EVENT DIALOG MODAL ===== */}
      <AnimatePresence>
        {selectedEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
            onClick={() => setSelectedEventId('')}
          >
            <motion.div
              initial={{ opacity: 0, y: 45, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 45, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white p-6 md:p-8 shadow-2xl scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Icon Button */}
              <button 
                onClick={() => setSelectedEventId('')} 
                className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader className="h-8 w-8 animate-spin text-[#1747a6]" />
                  <p className="mt-4 text-slate-650 font-semibold">Đang tải chi tiết sự kiện...</p>
                </div>
              ) : selectedEvent ? (
                <div className="space-y-6">
                  {/* Modal Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7eff8] pb-5 pr-10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Chi tiết thông tin sự kiện</p>
                      <h2 className="mt-2 text-2xl md:text-3xl font-black text-[#132b57]">{selectedEvent.title}</h2>
                      <p className="mt-1 text-sm text-slate-500 font-medium">
                        Tổ chức bởi: <span className="font-bold text-[#1747a6]">{selectedEvent.creator?.name || 'N/A'}</span>
                        {selectedEvent.leader?.name && ` | Chủ trì: ${selectedEvent.leader.name}`}
                      </p>
                    </div>
                    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedEvent.status)}`}>
                      {translateStatus(selectedEvent.status)}
                    </span>
                  </div>

                  {/* Carousel Images */}
                  {selectedEvent.images && selectedEvent.images.length > 0 && (
                    <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-md group">
                      <div className="h-64 md:h-80 w-full flex items-center justify-center">
                        <img 
                          src={selectedEvent.images[carouselIndex].imageUrl} 
                          alt="Cover carousel" 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      
                      {selectedEvent.images[carouselIndex].caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-5 py-3 text-sm text-white font-medium">
                          {selectedEvent.images[carouselIndex].caption}
                        </div>
                      )}

                      {selectedEvent.images.length > 1 && (
                        <>
                          <button 
                            type="button" 
                            onClick={() => setCarouselIndex(prev => (prev === 0 ? selectedEvent.images.length - 1 : prev - 1))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm text-slate-700"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setCarouselIndex(prev => (prev === selectedEvent.images.length - 1 ? 0 : prev + 1))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm text-slate-700"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Info Cards Panel */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <Users className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Số đăng ký</p>
                        <p className="font-bold text-slate-750 text-sm mt-0.5">{selectedEvent.currentSlots} / {selectedEvent.maxParticipants || '∞'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <Tag className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Thể loại</p>
                        <p className="font-bold text-slate-750 text-sm mt-0.5 truncate max-w-[120px]">{selectedEvent.category || 'Học tập'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <Clock className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Ngày bắt đầu</p>
                        <p className="font-bold text-slate-750 text-[10px] leading-tight mt-0.5">
                          {new Date(selectedEvent.plannedStartDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <MapPin className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Địa điểm</p>
                        <p className="font-bold text-slate-750 text-xs mt-0.5 truncate max-w-[120px]">{selectedEvent.locationName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  {selectedEvent.description && (
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-[#132b57] uppercase tracking-wider">Mô tả chi tiết</p>
                      <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-650 whitespace-pre-wrap leading-relaxed border border-slate-100">
                        {selectedEvent.description}
                      </div>
                    </div>
                  )}

                  {/* Document Attachments */}
                  {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-[#132b57] uppercase tracking-wider">Tài liệu đính kèm ({selectedEvent.documents.length})</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedEvent.documents.map(doc => (
                          <a 
                            key={doc.id} 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 border border-slate-150 rounded-xl p-3 bg-slate-50 hover:bg-[#f3f7ff] hover:border-[#83a8ea] transition-all"
                          >
                            <FileText className="h-5 w-5 text-[#1747a6]" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-750 truncate">{doc.fileName}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{(doc.fileSize / 1024).toFixed(1)} KB • {doc.fileType?.toUpperCase()}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Link Footer */}
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e7eff8] pt-5 justify-end">
                    {selectedEvent.status === 'pending' && (
                      <button 
                        type="button"
                        onClick={() => { setSelectedEventId(''); navigate('/admin/event-approvals'); }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 font-bold text-white transition-all hover:bg-amber-600 shadow-sm"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Đi tới duyệt phê duyệt sự kiện
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => setSelectedEventId('')}
                      className="rounded-2xl border border-[#dce8f5] bg-white px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
