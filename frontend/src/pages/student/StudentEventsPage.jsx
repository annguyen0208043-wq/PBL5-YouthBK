import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Filter, MapPin, Search, Sparkles, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { defaultRegisteredEventIds, STORAGE_REGISTERED_EVENTS_KEY, studentEvents } from '../../shared/student/studentData';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

function tagTone(tag) {
  const tones = {
    'Ngoài trời': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Điểm danh QR': 'bg-blue-100 text-blue-700 border-blue-200',
    'Có minh chứng': 'bg-violet-100 text-violet-700 border-violet-200',
    'Kỹ năng': 'bg-amber-100 text-amber-700 border-amber-200',
    'Có chứng nhận': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Giấy chứng nhận': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Ưu tiên sinh viên năm cuối': 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return tones[tag] || 'bg-slate-100 text-slate-700 border-slate-200';
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 140, damping: 18 },
  },
};

function EventStatus({ value }) {
  const tone =
    value === 'Đang mở đăng ký'
      ? 'bg-emerald-100 text-emerald-700'
      : value === 'Đã đăng ký'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{value}</span>;
}

function getInitialRegisteredEvents() {
  if (typeof window === 'undefined') {
    return defaultRegisteredEventIds;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_REGISTERED_EVENTS_KEY);
    return rawValue ? JSON.parse(rawValue) : defaultRegisteredEventIds;
  } catch {
    return defaultRegisteredEventIds;
  }
}

export default function StudentEventsPage() {
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [registeredIds, setRegisteredIds] = useState(getInitialRegisteredEvents);
  const [feedback, setFeedback] = useState('');
  const toastTimerRef = useRef(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_REGISTERED_EVENTS_KEY, JSON.stringify(registeredIds));
  }, [registeredIds]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  const filters = ['Tất cả', 'Đang mở đăng ký', 'Đã đăng ký', 'Sắp diễn ra'];

  const visibleEvents = useMemo(() => {
    return studentEvents
      .map((event) => ({
        ...event,
        enrolled: registeredIds.includes(event.id),
      }))
      .filter((event) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          event.title.toLowerCase().includes(normalizedSearch) ||
          event.organizer.toLowerCase().includes(normalizedSearch) ||
          event.category.toLowerCase().includes(normalizedSearch);

        const matchesFilter =
          activeFilter === 'Tất cả' ||
          (activeFilter === 'Đã đăng ký' && event.enrolled) ||
          (activeFilter !== 'Đã đăng ký' && event.status === activeFilter);

        return matchesSearch && matchesFilter;
      });
  }, [activeFilter, registeredIds, search]);

  const toggleRegistration = (eventId, eventTitle) => {
    const isEnrolled = registeredIds.includes(eventId);
    setRegisteredIds((current) => (isEnrolled ? current.filter((id) => id !== eventId) : [...current, eventId]));
    setFeedback(isEnrolled ? `Bạn đã hủy đăng ký: ${eventTitle}` : `Đăng ký thành công: ${eventTitle}`);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setFeedback(''), 2200);
  };

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="hidden w-[280px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Hệ thống Đoàn - Hội</p>
            </div>
          </div>

          <div className="profile-user-chip mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
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
          </div>

          <div className="mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100">Quản lý tham gia</p>
            <p className="mt-2 text-xl font-bold">Sự kiện của tôi</p>
            <p className="mt-2 text-sm text-blue-50/85">Theo dõi hoạt động đang mở, đăng ký tham gia và kiểm tra trạng thái của bạn.</p>
          </div>

          <nav className="space-y-2">
            <Link to="/profile" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Hồ sơ cá nhân
            </Link>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Sự kiện của tôi</div>
            <Link to="/student/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-semibold">Cách sử dụng nhanh</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-50/90">
              <li>Xem danh sách sự kiện đang mở</li>
              <li>Đọc thông tin và chỉ tiêu đăng ký</li>
              <li>Đăng ký hoặc hủy đăng ký</li>
              <li>Theo dõi trạng thái tham gia</li>
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Sự kiện dành cho sinh viên</h1>
                <p className="mt-1 text-slate-500">Khám phá hoạt động nổi bật và đăng ký tham gia trực tiếp trên hệ thống.</p>
              </div>
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

          <div className="p-5 sm:p-8">
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.96 }}
                  className="mb-5 flex items-center gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">{feedback}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <motion.div whileHover={{ y: -3 }} className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 transition-all focus-within:border-[#1f5dcc] focus-within:shadow-[0_0_0_4px_rgba(31,93,204,0.08)]">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Tìm theo tên sự kiện, đơn vị tổ chức hoặc chủ đề"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {filters.map((filter) => (
                    <motion.button
                      key={filter}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        activeFilter === filter
                          ? 'bg-[#1747a6] text-white shadow-[0_10px_24px_rgba(23,71,166,0.24)]'
                          : 'border border-[#dce8f5] bg-white text-slate-600 hover:border-[#9ec0f0] hover:bg-[#f8fbff]'
                      }`}
                    >
                      {filter}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1747a6] via-[#4ba3ff] to-[#19c37d]" />
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.04, 1] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]"
                  >
                    <Sparkles className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Tình trạng hiện tại</p>
                    <h2 className="mt-1 text-2xl font-black text-[#132b57]">{registeredIds.length} sự kiện đã đăng ký</h2>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Bạn có thể theo dõi các sự kiện đã đăng ký và chuyển sang lịch sử hoạt động để xem tiến trình tham gia.
                </p>
                <Link
                  to="/student/history"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 text-sm font-bold text-[#1747a6] transition-all hover:bg-[#eef6ff]"
                >
                  <CalendarDays className="h-4 w-4" />
                  Xem lịch sử hoạt động
                </Link>
              </motion.div>
            </div>

            <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-5">
              {visibleEvents.map((event) => {
                const usedSlots = event.enrolled ? event.registered + 1 : event.registered;
                const displayStatus = event.enrolled ? 'Đã đăng ký' : event.status;
                const progress = Math.min((usedSlots / event.slots) * 100, 100);

                return (
                  <motion.article
                    key={event.id}
                    variants={itemVariants}
                    whileHover={{ y: -6 }}
                    className="student-event-card relative overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${event.accent}`} />
                    <div className="absolute -right-12 top-8 h-28 w-28 rounded-full bg-[#eff6ff] blur-2xl" />

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <EventStatus value={displayStatus} />
                          <span className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-bold text-[#1f5dcc]">{event.points}</span>
                          <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-bold text-[#cb6d13]">{event.category}</span>
                        </div>

                        <h2 className="mt-4 text-2xl font-black text-[#132b57]">{event.title}</h2>
                        <p className="mt-2 text-sm font-semibold text-[#1f5dcc]">{event.organizer}</p>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{event.description}</p>

                        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-slate-400" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {event.tags.map((tag) => (
                            <motion.span
                              key={tag}
                              whileHover={{ y: -2 }}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${tagTone(tag)}`}
                            >
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      <div className="relative w-full overflow-hidden rounded-[24px] bg-[#f4f8ff] p-4 xl:w-[260px]">
                        <div className={`absolute inset-x-6 top-0 h-20 rounded-b-[30px] bg-gradient-to-b ${event.accent} opacity-10 blur-2xl`} />
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tình hình đăng ký</p>
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                          <span>{usedSlots} / {event.slots} sinh viên</span>
                          <motion.span key={usedSlots} initial={{ scale: 0.85, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="font-bold text-[#1747a6]">
                            {Math.round(progress)}%
                          </motion.span>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-3 rounded-full bg-gradient-to-r ${event.accent}`}
                          />
                        </div>

                        <div className="mt-5 grid gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleRegistration(event.id, event.title)}
                            className={`rounded-2xl px-4 py-3 font-bold text-white transition-all ${
                              event.enrolled
                                ? 'bg-[#d24c4c] shadow-[0_12px_24px_rgba(210,76,76,0.24)] hover:bg-[#bf3b3b]'
                                : 'bg-[#1747a6] shadow-[0_12px_24px_rgba(23,71,166,0.24)] hover:bg-[#205fd8]'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {event.enrolled && <CheckCircle2 className="h-4 w-4" />}
                              {event.enrolled ? 'Hủy đăng ký' : 'Đăng ký tham gia'}
                            </span>
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f7fbff]"
                          >
                            Xem chi tiết
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}

              {visibleEvents.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[28px] border border-dashed border-[#c6d7ea] bg-white px-6 py-10 text-center text-slate-500"
                >
                  Không tìm thấy sự kiện phù hợp với bộ lọc hiện tại.
                </motion.div>
              )}
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="mt-6 rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]"
                >
                  <Filter className="h-6 w-6" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-black text-[#132b57]">Lưu ý khi tham gia hoạt động</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    <li>Đăng ký thành công không đồng nghĩa với hoàn thành hoạt động. Bạn vẫn cần điểm danh theo hướng dẫn.</li>
                    <li>Nếu sự kiện yêu cầu minh chứng, hãy nộp đúng hạn để được cộng điểm rèn luyện.</li>
                    <li>Các sự kiện đã gần diễn ra có thể bị khóa chức năng hủy đăng ký theo quy định của đơn vị tổ chức.</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <div className="mt-6">
              <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]"
                >
                  <Ticket className="h-5 w-5" />
                  Quay lại hồ sơ cá nhân
                </Link>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
