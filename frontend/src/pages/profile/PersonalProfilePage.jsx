import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Save, ShieldCheck, User, Mail, Phone, MapPin, School, Upload, CheckCircle2, AlertCircle, Loader2, History } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import AdminLayout from '../../components/admin/AdminLayout';
import LienChiLayout from '../../components/lienchi/LienChiLayout';
import { getStoredUserProfile, getUserInitials, isAdminRole, isLienChiRole } from '../../shared/user/session';
import NotificationBell from '../student/NotificationBell';

function UserIdentity({ user, subtitle }) {
  const userInitials = getUserInitials(user.fullName);

  return (
    <div className="profile-user-chip rounded-[24px] bg-white/10 p-4 backdrop-blur-md w-full min-w-0">
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
          <p className="profile-user-subtitle text-sm text-slate-500">MSSV/Mã: {user.studentId || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileLayout({ children, title, subtitle, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="app-sidebar hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Không gian sinh viên</p>
            </div>
          </div>

          <div className="mb-6">
            <UserIdentity user={user} subtitle={user.studentId || 'Sinh viên'} />
          </div>

          <nav className="space-y-2">
            <Link to="/sinhvien/event" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Sự kiện của tôi
            </Link>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Hồ sơ cá nhân</div>
            <Link to="/sinhvien/chat" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Chat sinh viên
            </Link>
            <Link to="/sinhvien/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
            <Link to="/sinhvien/notifications" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Thông báo
            </Link>
          </nav>

          <div className="mt-auto pt-6">
            <button
              onClick={handleLogout}
              className="app-logout-button flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-white transition-all hover:bg-white/10"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main ref={mainRef} className="app-main flex-1">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Account</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#132b57]">{title}</h1>
                <p className="mt-1 text-slate-500">{subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <HeaderIdentity user={user} />
              </div>
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

export default function PersonalProfilePage() {
  const [activeProfileTab, setActiveProfileTab] = useState('overview');
  const [user, setUser] = useState(getStoredUserProfile());
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    faculty: '',
    department: ''
  });

  const userInitials = getUserInitials(user.fullName);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const dbUser = data.user;
          const updatedUser = {
            ...user,
            ...dbUser,
            fullName: dbUser.name || dbUser.fullName,
            communityPoints: dbUser.communityPoints || 0
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          setEditFormData({
            fullName: dbUser.name || dbUser.fullName || '',
            phone: dbUser.phone || '',
            faculty: dbUser.faculty || '',
            department: dbUser.department || ''
          });

          // Fetch points history for student
          if (!isAdminRole(dbUser.role) && !isLienChiRole(dbUser.role)) {
            setLoadingHistory(true);
            try {
              const historyResponse = await fetch('/api/users/profile/points-history', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                setPointsHistory(historyData.history || []);
              }
            } catch (historyErr) {
              console.error('Fetch points history error:', historyErr);
            } finally {
              setLoadingHistory(false);
            }
          }
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotice('❌ Ảnh đại diện không được vượt quá 5MB');
      return;
    }

    setUploadingAvatar(true);
    setNotice('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText || `HTTP ${response.status}: Lỗi máy chủ` };
      }
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi tải ảnh đại diện');
      }

      const updatedAvatarUrl = data.avatarUrl;
      const updatedUser = {
        ...user,
        avatar: updatedAvatarUrl,
        avatarUrl: updatedAvatarUrl
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setNotice('✅ Cập nhật ảnh đại diện thành công!');
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice('');

    if (!editFormData.fullName.trim()) {
      setNotice('❌ Họ tên không được để trống');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: editFormData.fullName,
          phone: editFormData.phone,
          faculty: editFormData.faculty,
          department: editFormData.department
        })
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText || `HTTP ${response.status}: Lỗi máy chủ` };
      }
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi cập nhật thông tin');
      }

      const rawUser = data.user;
      const updatedUser = {
        ...user,
        fullName: rawUser.name || rawUser.fullName,
        phone: rawUser.phone,
        faculty: rawUser.faculty,
        department: rawUser.department
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setNotice('✅ Cập nhật thông tin cá nhân thành công!');
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderProfileContent = () => (
    <div className="space-y-6">
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
            notice.startsWith('✅')
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.startsWith('✅') ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{notice}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-[#dce8f5] bg-white p-1 shadow-sm">
        {[
          ['overview', 'Tổng quan hồ sơ'],
          ['edit', 'Chỉnh sửa thông tin'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveProfileTab(id)}
            className={`profile-tab rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeProfileTab === id
                ? 'bg-[#1747a6] text-white shadow-[0_10px_22px_rgba(23,71,166,0.22)]'
                : 'text-slate-600 hover:bg-[#eef6ff] hover:text-[#1747a6]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Left Side: Avatar Card */}
        <section className="space-y-5">
          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                <div className="profile-avatar-ring">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="profile-avatar-image h-28 w-28 rounded-full object-cover transition-all duration-300 group-hover:brightness-75" />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] text-3xl font-black text-white shadow-lg transition-all duration-300 group-hover:brightness-90">
                      {userInitials}
                    </div>
                  )}
                  {/* Upload overlay */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </div>
              <h3 className="mt-4 text-2xl font-black text-[#132b57] truncate w-full px-2" title={user.fullName}>{user.fullName}</h3>
              <p className="mt-1 text-sm font-semibold text-[#1f5dcc] uppercase tracking-wider">{user.role || 'Người dùng'}</p>
              
              <button
                type="button"
                onClick={triggerFileSelect}
                className="mt-3 flex items-center gap-1.5 rounded-xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-2 text-xs font-bold text-[#1f5dcc] hover:bg-[#eef6ff] transition-all shadow-sm active:scale-95"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Thay ảnh đại diện</span>
              </button>

              <div className="mt-3">
                <StatusPill value="Tài khoản hoạt động" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                ['Mã số / Username', user.studentId || 'N/A'],
                ['Email liên hệ', user.email],
                ['Vai trò', user.role || 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f8fbff] p-4 border border-[#e7eff8]">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-1 font-semibold text-slate-700 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Side: Details/Form Card */}
        <section>
          <AnimatePresence mode="wait">
            {activeProfileTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm space-y-6"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Thông tin tổng quan</p>
                  <h3 className="mt-1 text-2xl font-black text-[#132b57]">Chi tiết hồ sơ</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và tên</p>
                    <p className="mt-1 text-base font-bold text-slate-800">{user.fullName}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</p>
                    <p className="mt-1 text-base font-bold text-slate-800">{user.phone || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khoa / Đơn vị</p>
                    <p className="mt-1 text-base font-bold text-slate-800">{user.faculty || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp / Phòng ban</p>
                    <p className="mt-1 text-base font-bold text-slate-800">{user.department || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                {!isAdminRole(user.role) && !isLienChiRole(user.role) && (
                  <>
                    <div className="p-4 rounded-2xl border border-[#e2f0fe] bg-[#f0f7ff] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#1f5dcc] uppercase tracking-wider">Điểm hoạt động cộng đồng</p>
                        <p className="mt-1 text-2xl font-black text-[#1747a6]">{user.communityPoints || 0} Điểm</p>
                      </div>
                      <CheckCircle2 className="h-10 w-10 text-[#1f5dcc] opacity-40" />
                    </div>

                    <div className="mt-6 border-t border-[#e7eff8] pt-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-[#1f5dcc]" />
                        <h4 className="text-lg font-bold text-[#132b57]">Lịch sử điểm phục vụ cộng đồng</h4>
                      </div>

                      {loadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 text-[#1f5dcc] animate-spin" />
                        </div>
                      ) : pointsHistory.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm bg-[#fafbfe]">
                          Chưa có lịch sử nhận điểm phục vụ cộng đồng.
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-[#dce8f5] bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                              <thead className="bg-[#f7fbff] border-b border-[#dce8f5] text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                  <th className="px-4 py-3">Ngày nhận</th>
                                  <th className="px-4 py-3">Nội dung / Sự kiện</th>
                                  <th className="px-4 py-3 text-right">Điểm cộng</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e7eff8] text-slate-700">
                                {pointsHistory.map((item) => (
                                  <tr key={item.id} className="hover:bg-[#fcfdfe] transition-colors">
                                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-500">
                                      {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <div className="font-semibold text-[#132b57] break-words line-clamp-2">
                                        {item.reason}
                                      </div>
                                      {item.eventId && (
                                        <Link
                                          to={`/sinhvien/event?eventId=${item.eventId}`}
                                          className="mt-1 inline-flex items-center text-xs font-semibold text-[#1f5dcc] hover:underline"
                                        >
                                          Xem chi tiết sự kiện
                                        </Link>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                        +{item.points} Điểm
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}


              </motion.div>
            )}

            {activeProfileTab === 'edit' && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm"
              >
                <div className="border-b border-[#e7eff8] pb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Cập nhật thông tin</p>
                  <h3 className="mt-1 text-2xl font-black text-[#132b57]">Chỉnh sửa hồ sơ</h3>
                  <p className="mt-2 text-sm text-slate-500">Các thay đổi sẽ được cập nhật trực tiếp trên toàn hệ thống.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên *</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          name="fullName"
                          value={editFormData.fullName}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-[#dce8f5] pl-11 pr-4 py-3 outline-none focus:border-[#1f5dcc] focus:ring-4 focus:ring-[#1f5dcc]/5 transition-all text-slate-800"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Số điện thoại</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Phone className="h-5 w-5" />
                        </div>
                        <input
                          name="phone"
                          value={editFormData.phone}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-[#dce8f5] pl-11 pr-4 py-3 outline-none focus:border-[#1f5dcc] focus:ring-4 focus:ring-[#1f5dcc]/5 transition-all text-slate-800"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Khoa / Đơn vị</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <School className="h-5 w-5" />
                        </div>
                        <input
                          name="faculty"
                          value={editFormData.faculty}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-[#dce8f5] pl-11 pr-4 py-3 outline-none focus:border-[#1f5dcc] focus:ring-4 focus:ring-[#1f5dcc]/5 transition-all text-slate-800"
                          placeholder="Nhập khoa hoặc phòng ban lớn"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Lớp / Phòng ban</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <input
                          name="department"
                          value={editFormData.department}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-[#dce8f5] pl-11 pr-4 py-3 outline-none focus:border-[#1f5dcc] focus:ring-4 focus:ring-[#1f5dcc]/5 transition-all text-slate-800"
                          placeholder="Nhập lớp học hoặc phòng ban chi tiết"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-400">MSSV / Mã số (Khóa)</span>
                      <input
                        className="w-full rounded-2xl border border-[#e2ecf5] bg-slate-50/80 px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                        value={user.studentId || 'N/A'}
                        disabled
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-400">Email liên kết (Khóa)</span>
                      <input
                        className="w-full rounded-2xl border border-[#e2ecf5] bg-slate-50/80 px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                        value={user.email}
                        disabled
                      />
                    </label>
                  </div>



                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 rounded-2xl bg-[#1747a6] px-6 py-3 font-bold text-white shadow-lg shadow-[#1747a6]/20 transition-all hover:bg-[#205fd8] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );

  const role = (user.role || '').trim().toLowerCase();
  
  if (isAdminRole(role)) {
    return (
      <AdminLayout
        title="Hồ sơ cá nhân"
        subtitle="Xem và cập nhật thông tin cá nhân của quản trị viên Đoàn trường."
        currentPath="/admin/profile"
      >
        {renderProfileContent()}
      </AdminLayout>
    );
  }

  if (isLienChiRole(role)) {
    return (
      <LienChiLayout
        title="Hồ sơ cá nhân"
        subtitle="Xem và cập nhật thông tin cá nhân của cán bộ Liên chi đoàn."
        currentPath="/lien-chi/profile"
      >
        {renderProfileContent()}
      </LienChiLayout>
    );
  }

  // Fallback to student space layout
  return (
    <ProfileLayout
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin tài khoản, cập nhật dữ liệu cá nhân sinh viên."
      user={user}
    >
      {renderProfileContent()}
    </ProfileLayout>
  );
}
