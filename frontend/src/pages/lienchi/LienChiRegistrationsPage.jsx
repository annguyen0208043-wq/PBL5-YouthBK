import React, { useMemo, useState } from 'react';
import { ClipboardPlus, Search, Trash2, UserRoundPen } from 'lucide-react';
import { motion } from 'framer-motion';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import { lienChiEvents, lienChiRegistrations } from '../../shared/lienchi/lienChiData';

export default function LienChiRegistrationsPage() {
  const [selectedEventId, setSelectedEventId] = useState(lienChiEvents[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [registrations, setRegistrations] = useState(lienChiRegistrations);

  const eventOptions = lienChiEvents.map((event) => ({ id: event.id, title: event.title }));
  const selectedRegistrations = registrations[selectedEventId] ?? [];

  const visibleRegistrations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return selectedRegistrations;
    }

    return selectedRegistrations.filter((student) =>
      [student.fullName, student.studentId, student.className].some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [search, selectedRegistrations]);

  const updateStudentStatus = (studentId, status, message) => {
    setRegistrations((current) => ({
      ...current,
      [selectedEventId]: (current[selectedEventId] ?? []).map((student) => (student.id === studentId ? { ...student, status } : student)),
    }));
    setNotice(message);
  };

  const removeStudent = (studentId) => {
    setRegistrations((current) => ({
      ...current,
      [selectedEventId]: (current[selectedEventId] ?? []).filter((student) => student.id !== studentId),
    }));
    setNotice('Đã xoá sinh viên khỏi danh sách đăng ký của sự kiện.');
  };

  return (
    <LienChiLayout
      currentPath="/lien-chi/registrations"
      title="Quản lý người đăng ký"
      subtitle="Xem, chỉnh sửa, thêm hoặc xoá sinh viên trong danh sách đăng ký theo UC013."
    >
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Chọn sự kiện</span>
              <select
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]"
              >
                {eventOptions.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 focus-within:border-[#1f5dcc]">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Tìm theo tên, MSSV hoặc lớp"
              />
            </div>
          </motion.div>
        </div>

        {notice && <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

        <div className="profile-panel overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-4 border-b border-[#e7eff8] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>Sinh viên</span>
            <span>Lớp</span>
            <span>Khoa</span>
            <span>Trạng thái</span>
            <span>Điểm danh</span>
          </div>

          <div className="divide-y divide-[#edf2f8]">
            {visibleRegistrations.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-500">Sự kiện hiện chưa có sinh viên đăng ký hoặc không có kết quả phù hợp.</div>
            ) : (
              visibleRegistrations.map((student) => (
                <div key={student.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-4 px-5 py-4">
                  <div>
                    <p className="font-bold text-[#132b57]">{student.fullName}</p>
                    <p className="mt-1 text-sm text-slate-500">MSSV: {student.studentId}</p>
                  </div>
                  <p className="text-sm text-slate-600">{student.className}</p>
                  <p className="text-sm text-slate-600">{student.faculty}</p>
                  <p className="text-sm font-semibold text-slate-700">{student.status}</p>
                  <div className="flex items-center justify-between gap-2 text-sm text-slate-600">{student.attendance}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <UserRoundPen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Chỉnh sửa danh sách</h3>
                <p className="text-sm text-slate-500">Cập nhật trạng thái sinh viên hoặc ghi nhận lại dữ liệu đăng ký.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const firstStudent = selectedRegistrations[0];
                  if (firstStudent) {
                    updateStudentStatus(firstStudent.id, 'Đã xác nhận', 'Đã cập nhật thông tin sinh viên và lưu thay đổi vào danh sách.');
                  }
                }}
                className="rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
              >
                Lưu cập nhật
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstStudent = selectedRegistrations[0];
                  if (firstStudent) {
                    removeStudent(firstStudent.id);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition-all hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Xoá sinh viên đầu tiên
              </button>
            </div>
          </div>

          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <ClipboardPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Thêm người đăng ký</h3>
                <p className="text-sm text-slate-500">Mô phỏng luồng bổ sung sinh viên vào sự kiện do liên chi quản lý.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input className="rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Họ và tên" />
              <input className="rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="MSSV" />
              <input className="rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Lớp" />
              <input className="rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Khoa" />
            </div>

            <button type="button" onClick={() => setNotice('Đã ghi nhận yêu cầu thêm sinh viên vào danh sách đăng ký.')} className="mt-4 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
              Thêm người đăng ký
            </button>
          </div>
        </div>
      </div>
    </LienChiLayout>
  );
}
