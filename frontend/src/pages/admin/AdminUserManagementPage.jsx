import React, { useMemo, useState } from 'react';
import { LockKeyhole, Search, ShieldCheck, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { userAccounts } from '../../shared/admin/adminData';

function statusTone(status) {
  return status === 'Hoạt động' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
}

export default function AdminUserManagementPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả');
  const [notice, setNotice] = useState('');

  const roles = ['Tất cả', 'Sinh viên', 'Liên chi Đoàn', 'Đoàn trường'];

  const visibleUsers = useMemo(
    () =>
      userAccounts.filter((user) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          user.fullName.toLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch) ||
          user.studentId.toLowerCase().includes(normalizedSearch);
        const matchesRole = roleFilter === 'Tất cả' || user.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [roleFilter, search]
  );

  return (
    <AdminLayout
      currentPath="/admin/users"
      title="Quản lý tài khoản"
      subtitle="Theo dõi trạng thái tài khoản, phân quyền và kiểm soát người dùng toàn hệ thống."
    >
      <div className="space-y-5">
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

        {notice && <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

        <div className="profile-panel overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white">
          <div className="grid grid-cols-[1.3fr_1.1fr_0.9fr_0.7fr_0.8fr] gap-4 border-b border-[#e7eff8] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>Người dùng</span>
            <span>Email</span>
            <span>Vai trò</span>
            <span>Khoa</span>
            <span>Trạng thái</span>
          </div>

          <div className="divide-y divide-[#edf2f8]">
            {visibleUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-[1.3fr_1.1fr_0.9fr_0.7fr_0.8fr] gap-4 px-5 py-4">
                <div>
                  <p className="font-bold text-[#132b57]">{user.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">MSSV/Mã: {user.studentId}</p>
                </div>
                <p className="text-sm text-slate-600">{user.email}</p>
                <div>
                  <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#1747a6]">{user.role}</span>
                </div>
                <p className="text-sm text-slate-600">{user.faculty}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(user.status)}`}>{user.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
              <button onClick={() => setNotice('Đã mở luồng cấp quyền Liên chi Đoàn cho tài khoản được chọn.')} className="rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
                Cấp quyền Liên chi Đoàn
              </button>
              <button onClick={() => setNotice('Đã đưa tài khoản về vai trò Sinh viên.')} className="rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
                Đưa về Sinh viên
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
              <button onClick={() => setNotice('Đã tạm khóa tài khoản được chọn.')} className="rounded-2xl bg-[#d24c4c] px-4 py-3 font-bold text-white transition-all hover:bg-[#bf3b3b]">
                Tạm khóa tài khoản
              </button>
              <button onClick={() => setNotice('Đã mở lại trạng thái hoạt động cho tài khoản được chọn.')} className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
                <ShieldCheck className="h-5 w-5 text-[#1747a6]" />
                Mở lại tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
