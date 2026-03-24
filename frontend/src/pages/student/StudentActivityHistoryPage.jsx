import React, { useMemo } from 'react';
import { Award, CalendarClock, CheckCircle2, Clock3, History, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { activityHistory, defaultRegisteredEventIds, STORAGE_REGISTERED_EVENTS_KEY, studentEvents } from '../../shared/student/studentData';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

function getRegisteredEventIds() {
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

function statusTone(status) {
  if (status === 'Hoàn thành') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Đã xác nhận tham gia') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

export default function StudentActivityHistoryPage() {
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);
  const registeredEventIds = getRegisteredEventIds();

  const upcomingRegistrations = useMemo(
    () =>
      studentEvents
        .filter((event) => registeredEventIds.includes(event.id))
        .map((event) => ({
          ...event,
          progressText: event.status === 'Sắp diễn ra' ? 'Sẵn sàng check-in' : 'Đang chờ xác nhận cuối',
        })),
    [registeredEventIds]
  );

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
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100">Theo dõi tham gia</p>
            <p className="mt-2 text-xl font-bold">Lịch sử hoạt động</p>
            <p className="mt-2 text-sm text-blue-50/85">Tổng hợp các hoạt động đã tham gia, chứng nhận đã nhận và những sự kiện sắp diễn ra.</p>
          </div>

          <nav className="space-y-2">
            <Link to="/profile" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Hồ sơ cá nhân
            </Link>
            <Link to="/student/events" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Sự kiện của tôi
            </Link>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Lịch sử hoạt động</div>
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-semibold">Tóm tắt nhanh</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-50/90">
              <li>{activityHistory.length} hoạt động đã được ghi nhận</li>
              <li>{upcomingRegistrations.length} hoạt động đang theo dõi</li>
              <li>Chứng nhận và điểm rèn luyện luôn hiển thị cùng hồ sơ</li>
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Lịch sử hoạt động của tôi</h1>
                <p className="mt-1 text-slate-500">Theo dõi các hoạt động đã tham gia và những sự kiện bạn đang chờ diễn ra.</p>
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
            <div className="grid gap-5 lg:grid-cols-3">
              <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Đã tham gia</p>
                    <h2 className="text-3xl font-black text-[#132b57]">{activityHistory.length}</h2>
                  </div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#edfdf3] p-3 text-emerald-600">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Chứng nhận nổi bật</p>
                    <h2 className="text-3xl font-black text-[#132b57]">02</h2>
                  </div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#fff6eb] p-3 text-amber-600">
                    <CalendarClock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Đang theo dõi</p>
                    <h2 className="text-3xl font-black text-[#132b57]">{upcomingRegistrations.length}</h2>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <section className="space-y-4">
                {activityHistory.map((item) => (
                  <motion.article
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className="profile-panel relative overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white p-5"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone(item.status)}`}>
                          {item.status}
                        </span>
                        <h2 className="mt-4 text-2xl font-black text-[#132b57]">{item.title}</h2>
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          <span>{item.time}</span>
                        </div>
                        <p className="mt-4 text-sm font-semibold text-[#1747a6]">{item.result}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                      </div>
                      <div className="rounded-[24px] bg-[#f5f9ff] px-4 py-4 text-sm text-slate-600 lg:w-[220px]">
                        <p className="font-bold text-[#132b57]">Trạng thái hồ sơ</p>
                        <div className="mt-3 flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Đã lưu vào hồ sơ cá nhân</span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </section>

              <section className="space-y-4">
                <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                  <h3 className="text-xl font-black text-[#132b57]">Sự kiện đang chờ diễn ra</h3>
                  <div className="mt-4 space-y-3">
                    {upcomingRegistrations.map((event) => (
                      <div key={event.id} className="rounded-[24px] bg-[#f6faff] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#132b57]">{event.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{event.time}</p>
                          </div>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Đã đăng ký</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{event.progressText}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                  <h3 className="text-xl font-black text-[#132b57]">Gợi ý tiếp theo</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li>Kiểm tra lại thời gian check-in cho các hoạt động sắp diễn ra.</li>
                    <li>Hoàn thiện minh chứng đúng hạn để hệ thống cộng điểm tự động.</li>
                    <li>Tải chứng nhận điện tử về máy sau khi hoạt động kết thúc.</li>
                  </ul>
                </div>
              </section>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/student/events"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
              >
                <Ticket className="h-5 w-5" />
                Quay lại sự kiện của tôi
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]"
              >
                Hồ sơ cá nhân
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
