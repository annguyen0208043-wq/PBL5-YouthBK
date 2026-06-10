import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BadgeCheck, BellRing, CalendarPlus2, ClipboardList, FilePenLine, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';
import useSocket from '../../hooks/useSocket';

const navSections = [
  {
    title: 'Điều hành',
    items: [
      { to: '/lien-chi', label: 'Tổng quan', icon: LayoutDashboard },
      { to: '/lien-chi/notifications', label: 'Thông báo', icon: BellRing }
    ],
  },
  {
    title: 'Quản lý sự kiện',
    items: [
      { to: '/lien-chi/events/create', label: 'Tạo sự kiện', icon: CalendarPlus2 },
      { to: '/lien-chi/events/manage', label: 'Sự kiện của tôi', icon: FilePenLine },
      { to: '/lien-chi/registrations', label: 'Người đăng ký', icon: ClipboardList },
    ],
  },
];

export default function LienChiLayout({ title, subtitle, currentPath, children }) {
  const navigate = useNavigate();
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get('/api/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(resp.data.unreadCount || 0);
    } catch (err) {
      console.error('fetchUnreadCount error:', err.message);
    }
  }, []);

  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleNewNotification = useCallback(() => {
    setUnreadCount((c) => c + 1);
  }, []);

  const handleNotificationRead = useCallback(() => {
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  useSocket(handleNewNotification, handleNotificationRead);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    navigate('/login');
  };

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="app-sidebar hidden w-[340px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#0f3276_0%,#1849a6_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Liên chi Đoàn</p>
            </div>
          </div>

          <Link to="/lien-chi/profile" className="profile-user-chip mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md hover:bg-white/15 transition-all block text-white no-underline w-full min-w-0">
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
                <p className="profile-user-subtitle text-sm text-blue-100/85">{user.role || 'Liên chi Đoàn'}</p>
              </div>
            </div>
          </Link>

          <div className="admin-sidebar-nav">
            {navSections.map((section) => (
              <div key={section.title} className="mb-5">
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100/85">{section.title}</p>
                <div className="space-y-2">
                  {section.items.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className={`admin-sidebar-link relative flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all ${
                        currentPath === to ? 'bg-white text-[#123d94] shadow-lg' : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="admin-sidebar-link-label">{label}</span>
                      
                      {to === '/lien-chi/notifications' && unreadCount > 0 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-sm ring-2 ring-red-500/30">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="app-logout-button flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main className="app-main flex-1">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Faculty Union</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#132b57]">{title}</h1>
                <p className="mt-1 text-slate-500">{subtitle}</p>
              </div>
              <Link to="/lien-chi/profile" className="profile-header-user rounded-[24px] border border-[#dce8f5] bg-[#f7fbff] px-4 py-3 hover:bg-[#eef6ff] transition-all block text-slate-800 no-underline">
                <div className="flex items-center gap-3 w-full min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="profile-user-avatar h-12 w-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="profile-user-avatar flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] text-sm font-black text-white">
                      {userInitials}
                    </div>
                  )}
                  <div className="profile-user-meta">
                    <p className="profile-user-name font-bold text-[#132b57]">{user.fullName}</p>
                    <p className="profile-user-subtitle text-sm text-slate-500">{user.faculty || 'Văn phòng Liên chi'}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
