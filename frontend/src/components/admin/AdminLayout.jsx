import React from 'react';
import { BarChart3, CheckCheck, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: BarChart3 },
  { to: '/admin/event-approvals', label: 'Duyệt sự kiện', icon: CheckCheck },
  { to: '/admin/users', label: 'Quản lý tài khoản', icon: Users },
];

export default function AdminLayout({ title, subtitle, currentPath, children }) {
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="hidden w-[300px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#0f3276_0%,#1849a6_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Quản trị Đoàn trường</p>
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
                <p className="profile-user-subtitle text-sm text-blue-100/85">{user.role || 'Đoàn trường'}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100">Quyền quản trị</p>
            <p className="mt-2 text-xl font-bold">Điều phối toàn hệ thống</p>
            <p className="mt-2 text-sm text-blue-50/85">Phê duyệt sự kiện, quản lý tài khoản và theo dõi hoạt động của toàn trường.</p>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all ${
                  currentPath === to ? 'bg-white text-[#123d94] shadow-lg' : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Gợi ý quản trị</p>
                <p className="mt-2 text-sm text-blue-50/90">Ưu tiên xử lý các sự kiện chờ duyệt trong ngày và kiểm tra tài khoản mới được cấp quyền.</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Admin</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#132b57]">{title}</h1>
                <p className="mt-1 text-slate-500">{subtitle}</p>
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
                    <p className="profile-user-subtitle text-sm text-slate-500">{user.role || 'Đoàn trường'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
