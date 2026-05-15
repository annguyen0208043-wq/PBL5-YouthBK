import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { motion } from 'framer-motion';

import AuthShowcase from '../../components/auth/AuthShowcase';
import { BachKhoaLogo, DoanLogo } from '../../components/auth/AuthLogos';
import { authContainerVariants, authItemVariants } from '../../shared/auth/authData';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Vui lòng nhập email hoặc mã số sinh viên');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setMessage('Nếu tài khoản tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu đến email đã đăng ký.');
    }, 700);
  };

  return (
    <div className="auth-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="auth-shell mx-auto flex w-full max-w-[1400px] overflow-hidden rounded-[28px] border border-[#cfe1f4] bg-[#f8fbfe] shadow-[0_20px_60px_rgba(37,99,235,0.12)] lg:rounded-[36px]">
        <AuthShowcase
          title={
            <>
              Khôi phục quyền truy cập
              <span className="block">BK-Youth</span>
            </>
          }
          subtitle="Nhận hướng dẫn đặt lại mật khẩu qua email trường hoặc email cá nhân đã đăng ký"
          footerTitle="Bảo mật tài khoản"
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
                <h2 className="text-4xl font-black uppercase tracking-tight text-[#132b57]">Quên mật khẩu?</h2>
                <p className="mt-2 text-lg text-slate-500">Nhập thông tin tài khoản để nhận hướng dẫn khôi phục</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="auth-error mt-4 rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </motion.div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                >
                  {message}
                </motion.div>
              )}

              <motion.form
                variants={authContainerVariants}
                initial="hidden"
                animate="show"
                className="mt-8 space-y-5"
                onSubmit={handleSubmit}
              >
                <motion.div variants={authItemVariants}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="block w-full rounded-2xl border border-[#9db1ca] bg-white py-4 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Mã số sinh viên hoặc email đã đăng ký"
                    />
                  </div>
                </motion.div>

                <motion.div variants={authItemVariants}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1747a6] px-4 py-4 text-base font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_24px_rgba(23,71,166,0.25)] transition-all hover:bg-[#205fd8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" />
                    {loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
                  </button>
                </motion.div>
              </motion.form>

              <Link to="/login" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dce8f5] bg-[#f7fbff] px-4 py-3 font-bold text-[#1747a6] transition-all hover:bg-[#eef6ff]">
                <ArrowLeft className="h-5 w-5" />
                Quay lại đăng nhập
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
