import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BadgeCheck, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';

import AuthShowcase from '../../components/auth/AuthShowcase';
import { BachKhoaLogo, DoanLogo } from '../../components/auth/AuthLogos';
import { authContainerVariants, authItemVariants } from '../../shared/auth/authData';

const API_URL = 'http://localhost:3000/api/auth';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const role = 'Sinh viên';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const validateStudentId = (value) => {
    if (value && !/^\d+$/.test(value)) return 'Mã số sinh viên chỉ được chứa số';
    return '';
  };

  const validatePhone = (value) => {
    if (value && !/^\d+$/.test(value)) return 'Số điện thoại chỉ được chứa số';
    if (value && (value.length < 9 || value.length > 11)) return 'Số điện thoại phải từ 9-11 chữ số';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email không đúng định dạng (VD: sv@dut.udn.vn)';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return '';
    if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!/[a-z]/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
    if (!/[A-Z]/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ in hoa';
    return '';
  };

  const validateConfirmPassword = (value) => {
    if (!value) return '';
    if (value !== password) return 'Mật khẩu xác nhận không khớp';
    return '';
  };

  const handleFieldChange = (field, value, setter, validator) => {
    setter(value);
    if (validator) {
      const fieldError = validator(value);
      setFieldErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    const errors = {
      studentId: validateStudentId(studentId),
      phone: validatePhone(phone),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword),
    };

    setFieldErrors(errors);

    if (Object.values(errors).some((value) => value !== '')) return;

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (!agree) {
      setError('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/register`, { fullName, studentId, phone, email, role, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldError = (field) =>
    fieldErrors[field] ? <p className="mt-1.5 pl-1 text-xs font-medium text-red-500">{fieldErrors[field]}</p> : null;

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
          subtitle="Tạo tài khoản mới để tham gia hệ sinh thái số dành cho sinh viên Bách Khoa Đà Nẵng"
        />

        <section className="auth-section-bg relative flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(47,128,237,0.12),_transparent_32%)]" />

          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 w-full max-w-[520px]">
            <div className="auth-card rounded-[26px] border border-[#d9e7f4] bg-white px-6 py-8 sm:px-8">
              <div className="flex items-center justify-center gap-5">
                <DoanLogo />
                <BachKhoaLogo />
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth</p>
                <h2 className="mt-3 text-4xl font-black uppercase tracking-tight text-[#132b57]">Tạo tài khoản</h2>
                <p className="mt-2 text-lg text-slate-500">Đăng ký thành viên mới cho hệ thống</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="auth-error mt-4 rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </motion.div>
              )}

              <motion.form variants={authContainerVariants} initial="hidden" animate="show" className="mt-8 space-y-4" onSubmit={handleRegister}>
                <motion.div variants={authItemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="block w-full rounded-2xl border border-[#d6e0eb] bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2f80ed] focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                  </div>
                </motion.div>

                <motion.div variants={authItemVariants} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Mã số sinh viên</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(event) => handleFieldChange('studentId', event.target.value, setStudentId, validateStudentId)}
                        className={`block w-full rounded-2xl border bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
                          fieldErrors.studentId ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-[#d6e0eb] focus:border-[#2f80ed] focus:ring-[#2f80ed]/10'
                        }`}
                        placeholder="Ví dụ: 102210001"
                      />
                    </div>
                    {renderFieldError('studentId')}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <Phone className="h-5 w-5" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => handleFieldChange('phone', event.target.value, setPhone, validatePhone)}
                        className={`block w-full rounded-2xl border bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
                          fieldErrors.phone ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-[#d6e0eb] focus:border-[#2f80ed] focus:ring-[#2f80ed]/10'
                        }`}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    {renderFieldError('phone')}
                  </div>
                </motion.div>

                <motion.div variants={authItemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email trường</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => handleFieldChange('email', event.target.value, setEmail, validateEmail)}
                      className={`block w-full rounded-2xl border bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
                        fieldErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-[#d6e0eb] focus:border-[#2f80ed] focus:ring-[#2f80ed]/10'
                      }`}
                      placeholder="sv@dut.udn.vn"
                    />
                  </div>
                  {renderFieldError('email')}
                </motion.div>

                <motion.div variants={authItemVariants}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Vai trò tài khoản</label>
                  <div className="rounded-2xl border border-[#d6e0eb] bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-700">
                    Sinh viên
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Tài khoản cán bộ Đoàn - Hội, lớp trưởng hoặc quản trị viên sẽ do nhà trường hoặc quản trị hệ thống cấp riêng.
                  </p>
                </motion.div>

                <motion.div variants={authItemVariants} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => handleFieldChange('password', event.target.value, setPassword, validatePassword)}
                        className={`password-input block w-full rounded-2xl border bg-white py-3.5 pl-12 pr-12 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
                          fieldErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-[#d6e0eb] focus:border-[#2f80ed] focus:ring-[#2f80ed]/10'
                        }`}
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
                    {renderFieldError('password')}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Nhập lại mật khẩu</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => handleFieldChange('confirmPassword', event.target.value, setConfirmPassword, validateConfirmPassword)}
                        className={`password-input block w-full rounded-2xl border bg-white py-3.5 pl-12 pr-12 text-base text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
                          fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-[#d6e0eb] focus:border-[#2f80ed] focus:ring-[#2f80ed]/10'
                        }`}
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
                    {renderFieldError('confirmPassword')}
                  </div>
                </motion.div>

                <motion.div variants={authItemVariants} className="rounded-2xl bg-[#eef6ff] px-4 py-3 text-sm text-slate-600">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(event) => setAgree(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1f5dcc] focus:ring-[#1f5dcc]"
                    />
                    <span>
                      Tôi đồng ý với điều khoản sử dụng, chính sách bảo mật và quy chế hoạt động của hệ thống BK-Youth.
                    </span>
                  </label>
                </motion.div>

                <motion.div variants={authItemVariants}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-[#1747a6] px-4 py-4 text-base font-bold uppercase tracking-[0.04em] text-white shadow-[0_12px_24px_rgba(23,71,166,0.25)] transition-all hover:bg-[#205fd8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
                  </button>
                </motion.div>
              </motion.form>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 text-center text-lg text-slate-700">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-bold text-[#1f5dcc] hover:underline">
                  Đăng nhập ngay.
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
