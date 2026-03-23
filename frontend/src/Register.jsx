import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Mail, BadgeCheck } from 'lucide-react';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      
      {/* NỬA TRÁI: GIỮ NGUYÊN NHƯ TRANG ĐĂNG NHẬP */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 flex-col justify-between p-12 relative overflow-hidden fixed h-screen">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center mt-10">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wide uppercase">
            Hệ thống quản lý
          </h1>
          <h2 className="text-3xl font-bold text-blue-200 uppercase mb-4">
            Hoạt động Đoàn - Hội
          </h2>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center my-8">
          <div className="w-full max-w-lg aspect-square bg-blue-500/30 rounded-3xl border-2 border-blue-400/50 border-dashed flex items-center justify-center backdrop-blur-sm">
             <span className="text-blue-100 font-medium text-lg">
                [Chèn ảnh minh họa / Background tòa nhà vào đây]
             </span>
          </div>
        </div>

        <div className="relative z-10 text-center mb-10">
          <p className="text-white text-xl font-medium tracking-widest uppercase">
            Số hóa hoạt động, Kết nối sinh viên
          </p>
        </div>
      </div>

      {/* NỬA PHẢI: FORM ĐĂNG KÝ CÓ THANH CUỘN (SCROLL) */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center p-6 sm:p-12 min-h-screen py-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">TẠO TÀI KHOẢN</h2>
            <p className="text-gray-500 font-medium">Đăng ký thành viên hệ thống BK-YOUTH</p>
          </div>

          <form className="space-y-5">
            {/* Họ và tên */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-gray-50 focus:bg-white outline-none"
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </div>
            </div>

            {/* MSSV */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mã số sinh viên (MSSV)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <BadgeCheck className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-gray-50 focus:bg-white outline-none"
                  placeholder="Nhập mã số sinh viên"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email trường cấp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-gray-50 focus:bg-white outline-none"
                  placeholder="sv@dut.udn.vn"
                />
              </div>
            </div>

            {/* Chọn vai trò */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vai trò
              </label>
              <select className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-gray-50 focus:bg-white outline-none text-gray-700 appearance-none">
                <option value="student">1. Người dùng (Sinh viên)</option>
                <option value="class_leader">2. Bí thư/ Lớp trưởng</option>
                <option value="manager">3. Người quản lý (Cán bộ Đoàn/Giảng viên)</option>
              </select>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-gray-50 focus:bg-white outline-none"
                  placeholder="Tạo mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Nút Đăng ký */}
            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 mt-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98]"
            >
              ĐĂNG KÝ TÀI KHOẢN
            </button>
          </form>

          {/* Quay lại đăng nhập */}
          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            Đã có tài khoản?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">
              Đăng nhập ngay
            </a>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;