import React from 'react';
import { BadgeCheck, CalendarPlus2, ClipboardList, FilePenLine, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

const navSections = [
  {
    title: 'Điều hành',
    items: [{ to: '/lien-chi', label: 'Tổng quan', icon: LayoutDashboard }],
  },
  {
    title: 'Quản lý sự kiện',
    items: [
      { to: '/lien-chi/events/create', label: 'Tạo sự kiện', icon: CalendarPlus2 },
      { to: '/lien-chi/events/manage', label: 'Sự kiện của tôi', icon: FilePenLine },
      { to: '/lien-chi/registrations', label: 'Người đăng ký', icon: ClipboardList },
    ],
  },
  {
    title: 'Xử lý hồ sơ',
    items: [{ to: '/lien-chi/evidences', label: 'Duyệt minh chứng', icon: BadgeCheck }],
  },
];

export default function LienChiLayout({ title, subtitle, currentPath, children }) {
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="hidden w-[340px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#0f3276_0%,#1849a6_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Liên chi Đoàn</p>
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
                <p className="profile-user-subtitle text-sm text-blue-100/85">{user.role || 'Liên chi Đoàn'}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Phạm vi nghiệp vụ</p>
                <p className="mt-2 text-sm leading-6 text-blue-50/90">
                  Khởi tạo sự kiện, quản lý người đăng ký và duyệt minh chứng cho sinh viên thuộc khoa.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-sidebar-nav">
            {navSections.map((section) => (
              <div key={section.title} className="mb-5">
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100/85">{section.title}</p>
                <div className="space-y-2">
                  {section.items.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className={`admin-sidebar-link flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all ${
                        currentPath === to ? 'bg-white text-[#123d94] shadow-lg' : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="admin-sidebar-link-label">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Faculty Union</p>
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
                    <p className="profile-user-subtitle text-sm text-slate-500">{user.faculty || 'Văn phòng Liên chi'}</p>
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
