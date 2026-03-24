import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

import AuthShowcase from '../../components/auth/AuthShowcase';
import { BachKhoaLogo, DoanLogo } from '../../components/auth/AuthLogos';
import { authContainerVariants, authItemVariants } from '../../shared/auth/authData';

const API_URL = 'http://localhost:3000/api/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="auth-shell mx-auto flex w-full max-w-[1400px] overflow-hidden rounded-[28px] border border-[#cfe1f4] bg-[#f8fbfe] shadow-[0_20px_60px_rgba(37,99,235,0.12)] lg:rounded-[36px]">
        <AuthShowcase
          title={
            <>
              Hệ thống quản lý hoạt động
              <span className="block">Đoàn - Hội</span>
            </>
          }
          subtitle="Số hóa hoạt động, kết nối sinh viên Bách Khoa Đà Nẵng"
          footerTitle="Kết nối và hành động"
        />

        <section className="auth-section-bg relative flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(47,128,237,0.12),_transparent_32%)]" />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 w-full max-w-[460px]"
          >
            <div className="auth-card rounded-[26px] border border-[#d9e7f4] bg-white px-6 py-8 sm:px-8">
              <div className="flex items-center justify-center gap-5">
                <DoanLogo />
                <BachKhoaLogo />
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-4xl font-black uppercase tracking-tight text-[#132b57]">Chào mừng trở lại!</h2>
                <p className="mt-2 text-lg text-slate-500">Vui lòng đăng nhập để bắt đầu</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="auth-error mt-4 rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </motion.div>
              )}

              <motion.form
                variants={authContainerVariants}
                initial="hidden"
                animate="show"
                className="mt-8 space-y-5"
                onSubmit={handleLogin}
              >
                <motion.div variants={authItemVariants}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="block w-full rounded-2xl border border-[#9db1ca] bg-white py-4 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Mã số sinh viên hoặc Email trường"
                    />
                  </div>
                </motion.div>

                <motion.div variants={authItemVariants}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="password-input block w-full rounded-2xl border border-[#d6e0eb] bg-white py-4 pl-12 pr-12 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Mật khẩu"
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
                </motion.div>

                <motion.div variants={authItemVariants} className="flex items-center justify-between gap-4 text-sm text-slate-600">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#1f5dcc] focus:ring-[#1f5dcc]" />
                    <span className="font-medium">Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#" className="font-semibold text-[#395483] transition-colors hover:text-[#1f5dcc]">
                    Quên mật khẩu?
                  </a>
                </motion.div>

                <motion.div variants={authItemVariants}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-[#1747a6] px-4 py-4 text-base font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_24px_rgba(23,71,166,0.25)] transition-all hover:bg-[#205fd8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </motion.div>
              </motion.form>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 text-center text-lg text-slate-700">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-bold text-[#1f5dcc] hover:underline">
                  Đăng ký ngay.
                </Link>
              </motion.p>
            </div>

            <p className="mt-5 text-center text-sm text-slate-500 underline-offset-4">
              <a href="#" className="hover:underline">
                Báo cáo sự cố hoặc liên hệ hỗ trợ
              </a>
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

