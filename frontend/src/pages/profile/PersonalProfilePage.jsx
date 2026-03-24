import React from 'react';
import { Save, ShieldCheck } from 'lucide-react';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';

const menuItems = [{ id: 'profile', label: 'Hồ sơ cá nhân' }];

function ProfileLayout({ activeView, onChangeView, children, title, subtitle, role }) {
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
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-semibold">Trung tâm tài khoản</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-50/90">
              <li>Xem thông tin cá nhân</li>
              <li>Cập nhật hồ sơ</li>
              <li>Kiểm tra trạng thái tài khoản</li>
              <li>Lưu thay đổi an toàn</li>
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Account</p>
            <h1 className="mt-2 text-3xl font-black text-[#132b57]">{title}</h1>
            <p className="mt-1 text-slate-500">{subtitle}</p>
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
  return (
    <ProfileLayout
      activeView={activeView}
      onChangeView={onChangeView}
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin tài khoản, cập nhật dữ liệu cá nhân và giữ hồ sơ luôn chính xác."
      role="Sinh viên / Ban cán sự"
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-5">
          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] text-3xl font-black text-white shadow-lg">
                NT
              </div>
              <h3 className="mt-4 text-2xl font-black text-[#132b57]">Nguyễn Đỗ Thắng</h3>
              <p className="mt-1 text-sm font-semibold text-[#1f5dcc]">Sinh viên Khoa Công nghệ thông tin</p>
              <div className="mt-3">
                <StatusPill value="Đã xác nhận" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                ['MSSV', '102230046'],
                ['Lớp sinh hoạt', '23T_Nhat1'],
                ['Email', 'nguyendothang@sv.dut.udn.vn'],
                ['Vai trò', 'Sinh viên'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f8fbff] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-2 font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <h3 className="text-xl font-black text-[#132b57]">Tình trạng hồ sơ</h3>
            <div className="mt-4 space-y-3">
              {[
                'Thông tin học tập đã được đồng bộ từ tài khoản hiện tại',
                'Bạn có thể cập nhật email cá nhân, số điện thoại và địa chỉ liên hệ',
                'Các trường quan trọng như MSSV và vai trò được khóa để đảm bảo thống nhất dữ liệu',
                'Mọi thay đổi sẽ được kiểm tra trước khi lưu vào hệ thống',
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
              <p className="mt-2 text-sm text-slate-500">Các trường được điền sẵn theo dữ liệu hiện tại để người dùng sửa trực tiếp.</p>
            </div>
            <button className="rounded-2xl border border-[#dce8f5] bg-[#f7fbff] px-4 py-3 font-semibold text-[#1f5dcc]">
              Hủy thay đổi
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue="Nguyễn Đỗ Thắng" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email cá nhân</span>
              <input type="email" className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue="endiezzhang13@gmail.com" />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mã số sinh viên</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] bg-slate-50 px-4 py-3 text-slate-500 outline-none" defaultValue="102230046" disabled />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Vai trò</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] bg-slate-50 px-4 py-3 text-slate-500 outline-none" defaultValue="Sinh viên" disabled />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue="0905 123 456" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Lớp sinh hoạt</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" defaultValue="23T_Nhat1" />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Địa chỉ liên hệ</span>
            <textarea
              rows="4"
              className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
              defaultValue="Ký túc xá phía Tây, Đại học Đà Nẵng"
            />
          </label>

          <div className="mt-5 rounded-[24px] bg-[#eef6ff] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[#1f5dcc]" />
              <div>
                <p className="font-semibold text-[#14356b]">Kiểm tra hợp lệ trước khi lưu</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Họ tên không chứa số, email đúng định dạng và các trường bắt buộc không được để trống.
                </p>
              </div>
            </div>
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

