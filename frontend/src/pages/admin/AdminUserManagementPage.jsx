import React, { useMemo, useState, useEffect } from 'react';
import { LockKeyhole, Search, ShieldCheck, UserCog, Loader, Plus, X, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';

function statusTone(status) {
  return status === 'Hoạt động' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
}

const ROLE_OPTIONS = ['Sinh viên', 'Liên chi Đoàn', 'Đoàn trường'];
const FACULTY_OPTIONS = ['CNTT', 'Cơ khí', 'Điện', 'Xây dựng', 'Kinh tế', 'Khác'];

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    faculty: '',
    role: 'Sinh viên',
    password: ''
  });
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    faculty: '',
    role: 'Sinh viên'
  });

  const roles = ['Tất cả', 'Sinh viên', 'Liên chi Đoàn', 'Đoàn trường'];

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Không thể tải danh sách tài khoản');
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setNotice(`❌ Lỗi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const visibleUsers = useMemo(
    () =>
      users.filter((user) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          user.fullName.toLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch) ||
          (user.studentId && user.studentId.toLowerCase().includes(normalizedSearch));
        const matchesRole = roleFilter === 'Tất cả' || user.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [roleFilter, search, users]
  );

  const handleChangeRole = async (userId, newRole) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi thay đổi vai trò');
      }

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setNotice(`✅ Đã cập nhật vai trò thành "${newRole}"`);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (userId, newStatus) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi thay đổi trạng thái');
      }

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      setNotice(`✅ Đã cập nhật trạng thái thành "${newStatus}"`);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrantLianChiDoan = async (userId) => {
    await handleChangeRole(userId, 'Liên chi Đoàn');
  };

  const handleDemoteToStudent = async (userId) => {
    await handleChangeRole(userId, 'Sinh viên');
  };

  const handleLockAccount = async (userId) => {
    await handleChangeStatus(userId, 'Tạm khóa');
  };

  const handleUnlockAccount = async (userId) => {
    await handleChangeStatus(userId, 'Hoạt động');
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async () => {
    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      setNotice('❌ Vui lòng điền đầy đủ: Họ tên, Email, Mật khẩu');
      return;
    }

    if (formData.password.length < 6) {
      setNotice('❌ Mật khẩu phải ít nhất 6 ký tự');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          studentId: formData.studentId || null,
          email: formData.email,
          phone: formData.phone || null,
          faculty: formData.faculty || null,
          role: formData.role,
          password: formData.password,
          status: 'Hoạt động'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi tạo tài khoản');
      }

      const data = await response.json();
      setUsers([...users, data.user]);
      setNotice('✅ Tạo tài khoản thành công!');
      
      // Reset form
      setFormData({
        fullName: '',
        studentId: '',
        email: '',
        phone: '',
        faculty: '',
        role: 'Sinh viên',
        password: ''
      });
      setShowCreateForm(false);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditForm = () => {
    const selected = users.find(u => u.id === selectedUserId);
    if (selected) {
      setEditFormData({
        fullName: selected.fullName,
        email: selected.email,
        phone: selected.phone || '',
        faculty: selected.faculty || '',
        role: selected.role
      });
      setShowEditForm(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!editFormData.fullName || !editFormData.email) {
      setNotice('❌ Vui lòng điền đầy đủ: Họ tên, Email');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${selectedUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone || null,
          faculty: editFormData.faculty || null,
          role: editFormData.role
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi cập nhật tài khoản');
      }

      const data = await response.json();
      setUsers(users.map(u => u.id === selectedUserId ? data.user : u));
      setNotice('✅ Cập nhật tài khoản thành công!');
      setShowEditForm(false);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/users"
      title="Quản lý tài khoản"
      subtitle="Theo dõi trạng thái tài khoản, phân quyền và kiểm soát người dùng toàn hệ thống."
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
            <p className="text-slate-600">Đang tải danh sách tài khoản...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Create button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
            >
              <Plus className="h-5 w-5" />
              Tạo tài khoản mới
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 focus-within:border-[#1f5dcc]">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Tìm theo họ tên, MSSV hoặc email"
                />
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      roleFilter === role ? 'bg-[#1747a6] text-white' : 'border border-[#dce8f5] bg-white text-slate-600'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {notice && (
            <div className={`rounded-[24px] border px-4 py-3 text-sm font-semibold ${
              notice.startsWith('✅')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {notice}
            </div>
          )}

          <div className="profile-panel overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white">
            <div className="grid grid-cols-[1.3fr_1.1fr_0.9fr_0.7fr_0.8fr] gap-4 border-b border-[#e7eff8] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <span>Người dùng</span>
              <span>Email</span>
              <span>Vai trò</span>
              <span>Khoa</span>
              <span>Trạng thái</span>
            </div>

            <div className="divide-y divide-[#edf2f8]">
              {visibleUsers.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500">
                  Không tìm thấy tài khoản nào.
                </div>
              ) : (
                visibleUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`grid grid-cols-[1.3fr_1.1fr_0.9fr_0.7fr_0.8fr] gap-4 px-5 py-4 cursor-pointer transition-all ${
                      selectedUserId === user.id ? 'bg-[#eef6ff]' : 'hover:bg-[#f8fbff]'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-[#132b57]">{user.fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">MSSV/Mã: {user.studentId || 'N/A'}</p>
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <div>
                      <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#1747a6]">{user.role}</span>
                    </div>
                    <p className="text-sm text-slate-600">{user.faculty || 'N/A'}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(user.status)}`}>{user.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedUserId && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                    <UserCog className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#132b57]">Phân quyền nhanh</h3>
                    <p className="text-sm text-slate-500">Thiết lập vai trò người dùng theo từng nhóm tác nhân.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleGrantLianChiDoan(selectedUserId)}
                    disabled={submitting}
                    className="rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50"
                  >
                    {submitting ? 'Đang xử lý...' : 'Cấp quyền Liên chi Đoàn'}
                  </button>
                  <button
                    onClick={() => handleDemoteToStudent(selectedUserId)}
                    disabled={submitting}
                    className="rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
                  >
                    {submitting ? 'Đang xử lý...' : 'Đưa về Sinh viên'}
                  </button>
                  <button
                    onClick={handleOpenEditForm}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </div>

              <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#fff3ee] p-3 text-[#d15f2b]">
                    <LockKeyhole className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#132b57]">Kiểm soát truy cập</h3>
                    <p className="text-sm text-slate-500">Tạm khóa hoặc mở lại tài khoản khi cần xử lý nghiệp vụ.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleLockAccount(selectedUserId)}
                    disabled={submitting}
                    className="rounded-2xl bg-[#d24c4c] px-4 py-3 font-bold text-white transition-all hover:bg-[#bf3b3b] disabled:opacity-50"
                  >
                    {submitting ? 'Đang xử lý...' : 'Tạm khóa tài khoản'}
                  </button>
                  <button
                    onClick={() => handleUnlockAccount(selectedUserId)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
                  >
                    <ShieldCheck className="h-5 w-5 text-[#1747a6]" />
                    {submitting ? 'Đang xử lý...' : 'Mở lại tài khoản'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create User Modal */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="profile-panel w-full max-w-md rounded-[28px] border border-[#dce8f5] bg-white p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-[#132b57]">Tạo tài khoản mới</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-lg hover:bg-[#f3f8ff]"
                  >
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên *</span>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập họ và tên"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Email *</span>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập email"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu *</span>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">MSSV / Mã cán bộ</span>
                    <input
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập MSSV hoặc mã cán bộ"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Điện thoại</span>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập số điện thoại"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Khoa / Phòng ban</span>
                    <select
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]"
                    >
                      <option value="">-- Chọn khoa --</option>
                      {FACULTY_OPTIONS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Vai trò</span>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]"
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleCreateUser}
                      disabled={submitting}
                      className="flex-1 rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50"
                    >
                      {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      disabled={submitting}
                      className="flex-1 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Edit User Modal */}
          {showEditForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="profile-panel w-full max-w-md rounded-[28px] border border-[#dce8f5] bg-white p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-[#132b57]">Chỉnh sửa tài khoản</h2>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="rounded-lg hover:bg-[#f3f8ff]"
                  >
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên *</span>
                    <input
                      name="fullName"
                      value={editFormData.fullName}
                      onChange={handleEditFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập họ và tên"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Email *</span>
                    <input
                      name="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập email"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Điện thoại</span>
                    <input
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập số điện thoại"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Khoa / Phòng ban</span>
                    <select
                      name="faculty"
                      value={editFormData.faculty}
                      onChange={handleEditFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]"
                    >
                      <option value="">-- Chọn khoa --</option>
                      {FACULTY_OPTIONS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Vai trò</span>
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]"
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleUpdateUser}
                      disabled={submitting}
                      className="flex-1 rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50"
                    >
                      {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      onClick={() => setShowEditForm(false)}
                      disabled={submitting}
                      className="flex-1 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
