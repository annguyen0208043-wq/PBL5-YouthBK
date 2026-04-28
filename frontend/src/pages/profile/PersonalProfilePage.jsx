import React from 'react';
import { CalendarRange, MessageCircleMore, Save, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

const menuItems = [{ id: 'profile', label: 'Hồ sơ cá nhân' }];

function UserIdentity({ user, subtitle }) {
  const userInitials = getUserInitials(user.fullName);

  return (
    <div className="profile-user-chip rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
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
          <p className="profile-user-subtitle text-sm text-blue-100/85">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function HeaderIdentity({ user }) {
  const userInitials = getUserInitials(user.fullName);

  return (
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
  );
}

function ProfileLayout({ activeView, onChangeView, children, title, subtitle, role, user }) {
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

          <div className="mb-6">
            <UserIdentity user={user} subtitle={user.studentId} />
          </div>

          <div className="mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100">Vai trò hiện tại</p>
            <p className="mt-2 text-xl font-bold">{role}</p>
            <p className="mt-2 text-sm text-blue-50/85">Quản lý thông tin cá nhân, cập nhật hồ sơ và theo dõi trạng thái tài khoản.</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeView(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                  activeView === item.id ? 'bg-white text-[#123d94] shadow-lg' : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
            <Link to="/student/events" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Sự kiện của tôi
            </Link>
            <Link to="/student/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
            <Link to="/student/chat" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Chat sinh viên
            </Link>
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-semibold">Tiện ích tài khoản</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-50/90">
              <li>Xem thông tin cá nhân</li>
              <li>Cập nhật hồ sơ</li>
              <li>Đăng ký tham gia sự kiện</li>
              <li>Theo dõi lịch sử hoạt động</li>
              <li>Lưu thay đổi an toàn</li>
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Account</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#132b57]">{title}</h1>
                <p className="mt-1 text-slate-500">{subtitle}</p>
              </div>
              <HeaderIdentity user={user} />
            </div>
          </div>

          <div className="p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function StatusPill({ value }) {
  return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{value}</span>;
}

export default function PersonalProfilePage({ activeView = 'profile', onChangeView = () => {} }) {
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);

  return (
    <ProfileLayout
      activeView={activeView}
      onChangeView={onChangeView}
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin tài khoản, cập nhật dữ liệu cá nhân và giữ hồ sơ luôn chính xác."
      role={user.role === 'Sinh viên' ? 'Sinh viên / Ban cán sự' : user.role}
      user={user}
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-5">
          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
            <div className="flex flex-col items-center text-center">
              <div className="profile-avatar-ring">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="profile-avatar-image h-28 w-28 rounded-full object-cover" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] text-3xl font-black text-white shadow-lg">
                    {userInitials}
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-2xl font-black text-[#132b57]">{user.fullName}</h3>
              <p className="mt-1 text-sm font-semibold text-[#1f5dcc]">{user.role} {user.faculty}</p>
              <div className="mt-3">
                <StatusPill value="Đã xác nhận" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                ['MSSV', user.studentId],
                ['Lớp sinh hoạt', user.className],
                ['Email', user.email],
                ['Vai trò', user.role],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f8fbff] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-2 font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <h3 className="text-xl font-black text-[#132b57]">Trạng thái hồ sơ</h3>
            <div className="mt-4 space-y-3">
              {[
                'Thông tin học tập đã được đồng bộ từ tài khoản hiện tại.',
                'Bạn có thể cập nhật email cá nhân, số điện thoại và địa chỉ liên hệ.',
                'Các trường quan trọng như MSSV và vai trò được khóa để đảm bảo thống nhất dữ liệu.',
                'Mọi thay đổi sẽ được kiểm tra trước khi lưu vào hệ thống.',
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-[#f6faff] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1747a6] text-sm font-bold text-white">{index + 1}</div>
                  <p className="text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
          <div className="flex flex-col gap-4 border-b border-[#e7eff8] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Chỉnh sửa thông tin</p>
              <h3 className="mt-2 text-2xl font-black text-[#132b57]">Cập nhật hồ sơ người dùng</h3>
              <p className="mt-2 text-sm text-slate-500">Các trường được điền sẵn theo dữ liệu hiện tại để bạn chỉnh sửa trực tiếp.</p>
            </div>
            <button className="rounded-2xl border border-[#dce8f5] bg-[#f7fbff] px-4 py-3 font-semibold text-[#1f5dcc]">
              Hủy thay đổi
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue={user.fullName} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email cá nhân</span>
              <input type="email" className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue={user.personalEmail} />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mã số sinh viên</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] bg-slate-50 px-4 py-3 text-slate-500 outline-none" defaultValue={user.studentId} disabled />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Vai trò</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] bg-slate-50 px-4 py-3 text-slate-500 outline-none" defaultValue={user.role} disabled />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue={user.phone} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Lớp sinh hoạt</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue={user.className} />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Địa chỉ liên hệ</span>
            <textarea
              rows="4"
              className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
              defaultValue={user.address}
            />
          </label>

          <div className="mt-5 rounded-[24px] bg-[#eef6ff] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[#1f5dcc]" />
              <div>
                <p className="font-semibold text-[#14356b]">Lưu ý trước khi cập nhật</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Họ tên không chứa số, email đúng định dạng và các trường bắt buộc không được để trống.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#dce8f5] bg-[#f8fbff] p-4">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1f5dcc]">Hoạt động của bạn</p>
            <h4 className="mt-2 text-lg font-black text-[#132b57]">Đăng ký hoạt động Đoàn - Hội</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Truy cập danh sách sự kiện đang mở để đăng ký tham gia, theo dõi chỉ tiêu còn lại và quản lý các hoạt động bạn đã chọn.
            </p>
            <Link
              to="/student/events"
              className="mt-4 inline-flex rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
            >
              Xem sự kiện của tôi
            </Link>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#dce8f5] bg-white p-4">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1f5dcc]">Theo dõi tham gia</p>
            <h4 className="mt-2 text-lg font-black text-[#132b57]">Lịch sử hoạt động</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Xem nhanh những hoạt động đã tham gia, trạng thái điểm danh, kết quả cộng điểm và chứng nhận đã nhận.
            </p>
            <Link
              to="/student/history"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-[#eef6ff] px-4 py-3 font-bold text-[#1747a6] transition-all hover:bg-[#e4f0ff]"
            >
              <CalendarRange className="h-5 w-5" />
              Xem lịch sử hoạt động
            </Link>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#dce8f5] bg-white p-4">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1f5dcc]">Kết nối sinh viên</p>
            <h4 className="mt-2 text-lg font-black text-[#132b57]">Chat và trao đổi nhóm</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Trao đổi với bạn học, nhóm hoạt động và các kênh nội bộ sinh viên ngay trong hệ thống.
            </p>
            <Link
              to="/student/chat"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-[#eef6ff] px-4 py-3 font-bold text-[#1747a6] transition-all hover:bg-[#e4f0ff]"
            >
              <MessageCircleMore className="h-5 w-5" />
              Mở chat sinh viên
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white">
              <Save className="h-5 w-5" />
              Lưu thay đổi
            </button>
            <button className="rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600">Quay lại hồ sơ</button>
          </div>
        </section>
      </div>
    </ProfileLayout>
  );
}
