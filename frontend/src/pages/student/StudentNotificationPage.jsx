import React, { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';
import NotificationTab from './NotificationTab';
import NotificationBell from './NotificationBell';

export default function StudentNotificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
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
            <Link to="/sinhvien/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
            {['monitor', 'ban cán sự', 'ban can su'].includes(user.role?.toLowerCase()) && (
              <Link to="/sinhvien/class-points" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
                Theo dõi điểm lớp
              </Link>
            )}
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Thông báo</div>
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

        <main ref={mainRef} className="app-main flex-1">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Thông báo</h1>
                <p className="mt-1 text-slate-500">Xem và quản lý các thông báo từ hệ thống.</p>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div
                  className="profile-header-user rounded-[24px] border border-[#dce8f5] bg-[#f7fbff] px-4 py-3"
                  aria-label="Mở trang chỉnh sửa thông tin cá nhân"
                >
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

          <div className="p-5 sm:p-8">
            <NotificationTab />
          </div>
        </main>
      </div>
    </div>
  );
}
