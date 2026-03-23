import React, { useState } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
  Flag,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

import schoolLogo from './assets/logo-bk.png';
import doanLogo from './assets/logo-doan.png';

const SCHOOL_LOGO_SRC = schoolLogo;
const DOAN_LOGO_SRC = doanLogo;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 180, damping: 20 }
  }
};

const floatingBadges = [
  { label: 'Liên chi', top: '15%', offset: '-30px', color: 'from-sky-400 to-blue-600', delay: 0.1 },
  { label: 'Sự kiện', top: '42%', offset: '-22px', color: 'from-amber-400 to-orange-500', delay: 0.25 },
  { label: 'Đoàn viên', top: '74%', offset: '-18px', color: 'from-rose-400 to-red-500', delay: 0.4 },
  { label: 'Thanh niên', top: '10%', offset: '18px', color: 'from-blue-500 to-indigo-700', delay: 0.15, right: true },
  { label: 'Cộng đồng', top: '35%', offset: '30px', color: 'from-orange-400 to-amber-500', delay: 0.3, right: true }
];

const studentCards = [
  { icon: Flag, label: 'Phong trào năng động' },
  { icon: BookOpen, label: 'Hồ sơ tập trung' },
  { icon: GraduationCap, label: 'Kết nối sinh viên' }
];

const roleOptions = [
  'Sinh viên',
  'Bí thư / Lớp trưởng',
  'Cán bộ Đoàn - Hội',
  'Giảng viên phụ trách'
];

const BachKhoaLogo = () => (
  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
    {SCHOOL_LOGO_SRC ? (
      <img src={SCHOOL_LOGO_SRC} alt="Logo Trường Bách Khoa" className="h-12 w-12 object-contain" />
    ) : (
      <div className="relative h-12 w-12 overflow-hidden rounded-md border-[3px] border-yellow-400 bg-[#1428bf]">
        <div className="absolute inset-y-0 left-0 w-[38%] bg-white" />
        <div className="absolute left-[5px] top-[2px] text-[7px] font-bold tracking-[0.42em] text-[#1428bf]">
          Đ
        </div>
        <div className="absolute left-[5px] top-[14px] text-[7px] font-bold leading-[1.25] tracking-[0.33em] text-[#1428bf]">
          N
          <br />
          Ẵ
          <br />
          N
          <br />
          G
        </div>
        <div className="absolute right-[-6px] top-[-8px] h-[68px] w-[50px] rounded-full border-[9px] border-yellow-300 border-b-transparent border-l-transparent rotate-[18deg]" />
      </div>
    )}
  </div>
);

const DoanLogo = () => (
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
    {DOAN_LOGO_SRC ? (
      <img src={DOAN_LOGO_SRC} alt="Logo Đoàn Thanh niên" className="h-11 w-11 object-contain" />
    ) : (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white">
        <Shield className="h-5 w-5" />
      </div>
    )}
  </div>
);

const PosterPanel = () => (
  <section className="relative hidden w-[54%] overflow-hidden border-r border-[#d7e7f7] bg-white lg:block">
    <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_54%,#e9f4ff_54%,#e9f4ff_100%)]" />
    <div className="absolute -left-20 bottom-16 h-72 w-72 rounded-full bg-[#2f80ed]" />
    <div className="absolute left-24 top-32 h-72 w-72 rounded-full bg-[#caebff]" />
    <div className="absolute right-[-80px] top-20 h-[420px] w-[420px] rotate-[22deg] rounded-[100px] bg-[#c9f5d8]" />
    <div className="absolute right-14 top-36 h-72 w-72 rounded-[48px] border-[16px] border-[#9bd3ff] opacity-60" />

    {floatingBadges.map((badge) => (
      <motion.div
        key={badge.label}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ duration: 3.6, delay: badge.delay, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute z-30 ${badge.right ? 'right-0' : 'left-0'}`}
        style={{ top: badge.top, transform: `translateX(${badge.offset})` }}
      >
        <div className="relative h-[74px] w-[74px]">
          <div className="absolute inset-0 translate-y-[8px] rounded-[24px] bg-[#b9c9da]" />
          <div className="absolute inset-[3px] rounded-[24px] border border-white/80 bg-white shadow-[0_16px_28px_rgba(15,23,42,0.16)]" />
          <div
            className={`absolute inset-[10px] flex items-center justify-center rounded-[20px] bg-gradient-to-br ${badge.color} px-1 text-[9px] font-black uppercase leading-tight tracking-[0.04em] text-white shadow-inner`}
          >
            {badge.label}
          </div>
          <div className="absolute right-[14px] top-[12px] h-2.5 w-2.5 rounded-full bg-white/60" />
        </div>
      </motion.div>
    ))}

    <div className="relative z-10 flex h-full flex-col justify-between px-14 py-10">
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-xl"
      >
        <p className="mb-4 inline-flex rounded-full bg-[#eaf4ff] px-4 py-2 text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">
          BK-Youth
        </p>
        <h1 className="text-[42px] font-black uppercase leading-tight tracking-tight text-[#132b57]">
          Hệ thống quản lý hoạt động
          <span className="block">Đoàn - Hội</span>
        </h1>
        <p className="mt-3 text-lg font-semibold text-[#2f80ed]">
          Tạo tài khoản mới để tham gia hệ sinh thái số dành cho sinh viên Bách Khoa Đà Nẵng
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative mx-auto my-8 flex w-full max-w-[620px] items-end justify-center"
      >
        <div className="absolute bottom-10 left-8 h-32 w-32 rounded-[28px] bg-white/80 shadow-md" />
        <div className="absolute bottom-24 left-10 flex h-24 w-24 items-center justify-center rounded-[26px] bg-[#2f80ed] text-white shadow-lg">
          <Building2 className="h-12 w-12" />
        </div>
        <div className="absolute bottom-16 right-14 flex h-36 w-28 items-center justify-center rounded-[30px] bg-[#65b8ff] text-white shadow-lg">
          <Building2 className="h-12 w-12" />
        </div>
        <div className="absolute bottom-20 right-40 flex h-44 w-32 items-center justify-center rounded-[34px] bg-[#3794ff] text-white shadow-lg">
          <Building2 className="h-14 w-14" />
        </div>

        <div className="relative z-10 mt-14 grid w-full grid-cols-3 gap-4">
          {studentCards.map(({ icon: Icon, label }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.12 }}
              className={`relative rounded-[34px] border-4 border-[#1747a6] bg-[#1f5dcc] p-4 text-white shadow-[0_20px_30px_rgba(31,93,204,0.18)] ${
                index === 1 ? 'mt-10' : index === 2 ? 'mt-16' : 'mt-2'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="h-8 w-8 rounded-full bg-[#ffdb4d]" />
              </div>
              <div className="rounded-[22px] bg-white px-3 py-4 text-center text-sm font-bold text-[#17356b] shadow-inner">
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-[#d9e5f2]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#44a8ff] text-[#1f5dcc]">
              <Users className="h-8 w-8" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f80ed]">
              Cộng đồng sinh viên
            </p>
            <p className="mt-1 text-[34px] font-black uppercase leading-tight text-[#132b57]">
              Đồng hành và phát triển
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#edf5fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1400px] overflow-hidden rounded-[28px] border border-[#cfe1f4] bg-[#f8fbfe] shadow-[0_20px_60px_rgba(37,99,235,0.12)] lg:rounded-[36px]">
        <PosterPanel />

        <section className="relative flex flex-1 items-center justify-center bg-[linear-gradient(180deg,#eef6fd_0%,#f8fbff_100%)] px-5 py-8 sm:px-8 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(47,128,237,0.12),_transparent_32%)]" />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 w-full max-w-[520px]"
          >
            <div className="rounded-[26px] border border-[#d9e7f4] bg-white px-6 py-8 shadow-[0_22px_45px_rgba(15,23,42,0.10)] sm:px-8">
              <div className="flex items-center justify-center gap-5">
                <DoanLogo />
                <BachKhoaLogo />
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth</p>
                <h2 className="mt-3 text-4xl font-black uppercase tracking-tight text-[#132b57]">
                  Tạo tài khoản
                </h2>
                <p className="mt-2 text-lg text-slate-500">Đăng ký thành viên mới cho hệ thống</p>
              </div>

              <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="mt-8 space-y-4"
              >
                <motion.div variants={itemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      className="block w-full rounded-2xl border border-[#d6e0eb] bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Mã số sinh viên</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        className="block w-full rounded-2xl border border-[#d6e0eb] bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                        placeholder="Ví dụ: 102210001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <Phone className="h-5 w-5" />
                      </div>
                      <input
                        type="tel"
                        className="block w-full rounded-2xl border border-[#d6e0eb] bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email trường</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      className="block w-full rounded-2xl border border-[#d6e0eb] bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="sv@dut.udn.vn"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Vai trò</label>
                  <select className="block w-full rounded-2xl border border-[#d6e0eb] bg-white px-4 py-3.5 text-base text-slate-800 outline-none transition-all focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10">
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="password-input block w-full rounded-2xl border border-[#d6e0eb] bg-white py-3.5 pl-12 pr-12 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                        placeholder="Tạo mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-[#2f80ed]"
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Nhập lại mật khẩu</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="password-input block w-full rounded-2xl border border-[#d6e0eb] bg-white py-3.5 pl-12 pr-12 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                        placeholder="Xác nhận mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-[#2f80ed]"
                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="rounded-2xl bg-[#eef6ff] px-4 py-3 text-sm text-slate-600">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1f5dcc] focus:ring-[#1f5dcc]"
                    />
                    <span>
                      Tôi đồng ý với điều khoản sử dụng, chính sách bảo mật và quy chế hoạt động của hệ thống
                      BK-Youth.
                    </span>
                  </label>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#1747a6] px-4 py-4 text-base font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_24px_rgba(23,71,166,0.25)] transition-all hover:bg-[#205fd8]"
                  >
                    Đăng ký tài khoản
                  </button>
                </motion.div>
              </motion.form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center text-lg text-slate-700"
              >
                Đã có tài khoản?{' '}
                <a href="#" className="font-bold text-[#1f5dcc] hover:underline">
                  Đăng nhập ngay.
                </a>
              </motion.p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
