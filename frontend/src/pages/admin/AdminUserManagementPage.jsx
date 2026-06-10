import React, { useMemo, useState, useEffect } from 'react';
import { KeyRound, LockKeyhole, Search, ShieldCheck, Loader, Plus, X, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';

function statusTone(status) {
  return status === 'Hoạt động' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
}

const ROLE_OPTIONS = ['Sinh viên', 'Ban cán sự', 'Liên chi Đoàn'];
const FACULTY_OPTIONS = ['CNTT', 'Cơ khí', 'Điện', 'Xây dựng', 'Kinh tế', 'Khác'];
const CUSTOM_FACULTY_VALUE = '__custom_faculty__';

function normalizeRole(role = '') {
  const normalized = String(role)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  if (normalized === 'admin' || normalized.includes('doan truong')) return 'admin';
  if (normalized === 'lienchi' || normalized.includes('lien chi')) return 'lienchi';
  if (normalized === 'student' || normalized.includes('sinh vien')) return 'student';
  if (normalized === 'monitor' || normalized.includes('ban can su')) return 'monitor';
  return normalized;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả');
  const [facultyFilter, setFacultyFilter] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    faculty: '',
    department: '',
    role: 'Sinh viên',
    password: ''
  });
  const [customFaculty, setCustomFaculty] = useState('');
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    faculty: '',
    department: '',
    role: 'Sinh viên'
  });
  const [editCustomFaculty, setEditCustomFaculty] = useState('');

  const roles = ['Tất cả', 'Sinh viên', 'Ban cán sự', 'Liên chi Đoàn'];

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
        const userRole = normalizeRole(user.role);
        const isManageableRole = userRole !== 'admin';
        const matchesRole = roleFilter === 'Tất cả' || userRole === normalizeRole(roleFilter);
        
        // Faculty filter logic (fuzzy matching to support full names like 'Công nghệ thông tin' with options like 'CNTT')
        let matchesFaculty = true;
        if (facultyFilter !== 'Tất cả') {
          const userFaculty = (user.faculty || '').trim().toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd');
          
          if (facultyFilter === 'CNTT') {
            matchesFaculty = userFaculty.includes('cntt') || userFaculty.includes('cong nghe thong tin') || userFaculty.includes('it');
          } else if (facultyFilter === 'Cơ khí') {
            matchesFaculty = userFaculty.includes('co khi');
          } else if (facultyFilter === 'Điện') {
            matchesFaculty = userFaculty.includes('dien');
          } else if (facultyFilter === 'Xây dựng') {
            matchesFaculty = userFaculty.includes('xay dung');
          } else if (facultyFilter === 'Kinh tế') {
            matchesFaculty = userFaculty.includes('kinh te') || userFaculty.includes('quan ly du an');
          } else if (facultyFilter === 'Khác') {
            const isPreset = userFaculty.includes('cntt') ||
                             userFaculty.includes('cong nghe thong tin') ||
                             userFaculty.includes('it') ||
                             userFaculty.includes('co khi') ||
                             userFaculty.includes('dien') ||
                             userFaculty.includes('xay dung') ||
                             userFaculty.includes('kinh te') ||
                             userFaculty.includes('quan ly du an');
            matchesFaculty = !isPreset;
          } else {
            const normalizedFilter = facultyFilter.trim().toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd');
            matchesFaculty = userFaculty === normalizedFilter || userFaculty.includes(normalizedFilter);
          }
        }

        return isManageableRole && matchesSearch && matchesRole && matchesFaculty;
      }),
    [roleFilter, facultyFilter, search, users]
  );

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return visibleUsers.slice(start, start + itemsPerPage);
  }, [visibleUsers, currentPage]);

  const totalPages = Math.ceil(visibleUsers.length / itemsPerPage);

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

  const performLockAccount = async (userId) => {
    await handleChangeStatus(userId, 'Tạm khóa');
  };

  const handleUnlockAccount = async (userId) => {
    await handleChangeStatus(userId, 'Hoạt động');
  };

  const performResetPassword = async (userId) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi reset mật khẩu');
      }

      setNotice(`✅ ${data.message || 'Đã reset mật khẩu thành công'}`);
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConfirm = (type, user) => {
    const config = type === 'lock'
      ? {
          type,
          user,
          icon: LockKeyhole,
          iconClassName: 'bg-rose-50 text-rose-600',
          title: 'Khóa tài khoản?',
          description: `Tài khoản "${user.fullName}" sẽ tạm thời không thể đăng nhập cho đến khi được mở lại.`,
          confirmLabel: 'Khóa tài khoản',
          confirmClassName: 'bg-[#d24c4c] hover:bg-[#bf3b3b]',
          onConfirm: () => performLockAccount(user.id)
        }
      : {
          type,
          user,
          icon: KeyRound,
          iconClassName: 'bg-amber-50 text-amber-600',
          title: 'Reset mật khẩu?',
          description: `Mật khẩu của "${user.fullName}" sẽ được đưa về mặc định: 123456.`,
          confirmLabel: 'Reset mật khẩu',
          confirmClassName: 'bg-[#1747a6] hover:bg-[#205fd8]',
          onConfirm: () => performResetPassword(user.id)
        };

    setConfirmAction(config);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    await confirmAction.onConfirm();
    setConfirmAction(null);
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'faculty' && value !== CUSTOM_FACULTY_VALUE) {
      setCustomFaculty('');
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'faculty' && value !== CUSTOM_FACULTY_VALUE) {
      setEditCustomFaculty('');
    }

    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async () => {
    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      setCreateError('❌ Vui lòng điền đầy đủ: Họ tên, Email, Mật khẩu');
      return;
    }

    if (formData.password.length < 6) {
      setCreateError('❌ Mật khẩu phải ít nhất 6 ký tự');
      return;
    }

    setSubmitting(true);
    setCreateError('');
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
          faculty: formData.faculty === CUSTOM_FACULTY_VALUE ? (customFaculty.trim() || null) : (formData.faculty || null),
          department: formData.department || null,
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
        department: '',
        role: 'Sinh viên',
        password: ''
      });
      setCustomFaculty('');
      setShowCreateForm(false);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setCreateError(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditForm = (userId) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      const selectedFaculty = selected.faculty || '';
      const isPresetFaculty = FACULTY_OPTIONS.includes(selectedFaculty);

      setSelectedUserId(userId);
      setEditFormData({
        fullName: selected.fullName,
        email: selected.email,
        phone: selected.phone || '',
        faculty: selectedFaculty ? (isPresetFaculty ? selectedFaculty : CUSTOM_FACULTY_VALUE) : '',
        department: selected.department || '',
        role: selected.role
      });
      setEditCustomFaculty(selectedFaculty && !isPresetFaculty ? selectedFaculty : '');
      setEditError('');
      setShowEditForm(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!editFormData.fullName || !editFormData.email) {
      setEditError('❌ Vui lòng điền đầy đủ: Họ tên, Email');
      return;
    }

    setSubmitting(true);
    setEditError('');
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
          faculty: editFormData.faculty === CUSTOM_FACULTY_VALUE ? (editCustomFaculty.trim() || null) : (editFormData.faculty || null),
          department: editFormData.department || null,
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
      setEditCustomFaculty('');
      setShowEditForm(false);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setEditError(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/users"
      title="Quản lý tài khoản"
      subtitle="Theo dõi trạng thái tài khoản, cấp quyền đúng đối tượng và kiểm soát người dùng toàn hệ thống."
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
              onClick={() => {
                setCreateError('');
                setShowCreateForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
            >
              <Plus className="h-5 w-5" />
              Tạo tài khoản mới
            </button>
          </div>

          <div className="profile-panel rounded-[24px] border border-[#dce8f5] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Box */}
              <div className="flex-1 flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 focus-within:border-[#1f5dcc] focus-within:bg-white transition-all">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-[#132b57] font-medium"
                  placeholder="Tìm theo họ tên, MSSV hoặc email..."
                />
              </div>

              {/* Right Filter Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Role Tabs */}
                <div className="flex rounded-2xl border border-[#dce8f5] bg-[#f8fbff] p-1">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => { setRoleFilter(role); setCurrentPage(1); }}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        roleFilter === role
                          ? 'bg-[#1747a6] text-white shadow-sm'
                          : 'text-slate-500 hover:text-[#1747a6]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {/* Faculty Dropdown Select */}
                <div className="relative min-w-[200px]">
                  <select
                    value={facultyFilter}
                    onChange={(event) => { setFacultyFilter(event.target.value); setCurrentPage(1); }}
                    className="w-full appearance-none rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 pr-10 text-xs font-bold text-slate-650 outline-none focus:border-[#1f5dcc] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Tất cả">Tất cả các Khoa</option>
                    <option value="CNTT">Khoa Công nghệ thông tin (CNTT)</option>
                    <option value="Cơ khí">Khoa Cơ khí</option>
                    <option value="Điện">Khoa Điện</option>
                    <option value="Xây dựng">Khoa Xây dựng</option>
                    <option value="Kinh tế">Khoa Quản lý dự án / Kinh tế</option>
                    <option value="Khác">Khoa khác / Khác</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {notice && (
            <div
              className={`rounded-[24px] border px-4 py-3 text-sm font-semibold ${
                notice.startsWith('✅')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {notice}
            </div>
          )}  
          <div className="profile-panel overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white">
            <div className="grid grid-cols-[1.3fr_1.1fr_0.9fr_0.7fr_0.8fr_0.9fr] gap-4 border-b border-[#e7eff8] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <span>Người dùng</span>
              <span>Email</span>
              <span>Vai trò</span>
              <span>Khoa</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>

            <div className="divide-y divide-[#edf2f8]">
              {paginatedUsers.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500">
                  Không tìm thấy tài khoản nào.
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1.3fr_1.1fr_0.9fr_0.7fr_0.8fr_0.9fr] gap-4 px-5 py-4 transition-all hover:bg-[#f8fbff]"
                  >
                    <div>
                      <p className="font-bold text-[#132b57]">{user.fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        MSSV/Mã: {user.studentId || 'N/A'}
                        {user.department && ` | Lớp: ${user.department}`}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <div>
                      <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#1747a6]">{user.role}</span>
                    </div>
                    <p className="text-sm text-slate-600">{user.faculty || 'N/A'}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(user.status)}`}>{user.status}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(user.id)}
                        disabled={submitting}
                        title="Chỉnh sửa tài khoản"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce8f5] bg-white text-[#1747a6] transition-all hover:bg-[#eef6ff] disabled:opacity-50"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenConfirm('reset', user)}
                        disabled={submitting}
                        title="Reset mật khẩu mặc định"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 transition-all hover:bg-amber-100 disabled:opacity-50"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      {user.status === 'Hoạt động' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenConfirm('lock', user)}
                          disabled={submitting}
                          title="Tạm khóa tài khoản"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition-all hover:bg-rose-100 disabled:opacity-50"
                        >
                          <LockKeyhole className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUnlockAccount(user.id)}
                          disabled={submitting}
                          title="Mở lại tài khoản"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#edf2f8] bg-[#fcfdfe] px-5 py-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Trang {currentPage} / {totalPages} (Tổng số {visibleUsers.length} tài khoản)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="rounded-xl border border-[#dce8f5] bg-white px-3 py-1.5 text-xs font-bold text-[#1747a6] transition-all hover:bg-[#eef6ff] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-[#1747a6] text-white shadow-md shadow-[#1747a6]/20'
                          : 'border border-[#dce8f5] bg-white text-slate-600 hover:bg-[#eef6ff]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="rounded-xl border border-[#dce8f5] bg-white px-3 py-1.5 text-xs font-bold text-[#1747a6] transition-all hover:bg-[#eef6ff] disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Action Modal */}
          {confirmAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
            >
              <motion.div
                initial={{ scale: 0.94, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 12 }}
                className="profile-panel w-full max-w-md rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${confirmAction.iconClassName}`}>
                    <confirmAction.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-black text-[#132b57]">{confirmAction.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{confirmAction.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={submitting}
                    className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-[#f3f8ff] hover:text-slate-600 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={submitting}
                    className={`flex-1 rounded-2xl px-4 py-3 font-bold text-white transition-all disabled:opacity-50 ${confirmAction.confirmClassName}`}
                  >
                    {submitting ? 'Đang xử lý...' : confirmAction.confirmLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={submitting}
                    className="flex-1 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </motion.div>
            </motion.div>
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
                  {createError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {createError}
                    </div>
                  )}

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
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Lớp (Mã lớp)</span>
                    <input
                      name="department"
                      value={formData.department}
                      onChange={handleCreateFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập mã lớp (Ví dụ: 23T_Nhat1)"
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
                      <option value={CUSTOM_FACULTY_VALUE}>Nhập thêm...</option>
                    </select>
                  </label>

                  {formData.faculty === CUSTOM_FACULTY_VALUE && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Nhập khoa / phòng ban</span>
                      <input
                        value={customFaculty}
                        onChange={(e) => setCustomFaculty(e.target.value)}
                        className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                        placeholder="Nhập tên khoa hoặc phòng ban"
                      />
                    </label>
                  )}

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
                  {editError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {editError}
                    </div>
                  )}

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
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Lớp (Mã lớp)</span>
                    <input
                      name="department"
                      value={editFormData.department}
                      onChange={handleEditFormChange}
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                      placeholder="Nhập mã lớp (Ví dụ: 23T_Nhat1)"
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
                      <option value={CUSTOM_FACULTY_VALUE}>Nhập thêm...</option>
                    </select>
                  </label>

                  {editFormData.faculty === CUSTOM_FACULTY_VALUE && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Nhập khoa / phòng ban</span>
                      <input
                        value={editCustomFaculty}
                        onChange={(e) => setEditCustomFaculty(e.target.value)}
                        className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                        placeholder="Nhập tên khoa hoặc phòng ban"
                      />
                    </label>
                  )}

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
