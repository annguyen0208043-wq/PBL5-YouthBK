import React, { useMemo, useState } from 'react';
import { Save, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { systemSettings } from '../../shared/admin/adminData';
import { STORAGE_ATTENDANCE_WINDOW_KEY } from '../../shared/student/studentData';

function toDateTimeLocalValue(dateValue) {
  if (!dateValue) {
    return '';
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const timezoneOffset = parsedDate.getTimezoneOffset();
  const localDate = new Date(parsedDate.getTime() - timezoneOffset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getInitialAttendanceWindow() {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      startAt: '',
      endAt: '',
    };
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_ATTENDANCE_WINDOW_KEY);
    if (!rawValue) {
      return {
        enabled: false,
        startAt: '',
        endAt: '',
      };
    }

    const parsed = JSON.parse(rawValue);
    return {
      enabled: Boolean(parsed.enabled),
      startAt: toDateTimeLocalValue(parsed.startAt),
      endAt: toDateTimeLocalValue(parsed.endAt),
    };
  } catch {
    return {
      enabled: false,
      startAt: '',
      endAt: '',
    };
  }
}

export default function AdminSystemSettingsPage() {
  const [notice, setNotice] = useState('');
  const [attendanceWindow, setAttendanceWindow] = useState(getInitialAttendanceWindow);

  const isWindowValid = useMemo(() => {
    if (!attendanceWindow.enabled) {
      return true;
    }

    if (!attendanceWindow.startAt || !attendanceWindow.endAt) {
      return false;
    }

    return new Date(attendanceWindow.endAt).getTime() > new Date(attendanceWindow.startAt).getTime();
  }, [attendanceWindow]);

  const handleSaveSettings = () => {
    if (!isWindowValid) {
      setNotice('Thời gian điểm danh không hợp lệ. Vui lòng kiểm tra mốc bắt đầu/kết thúc.');
      return;
    }

    const payload = {
      enabled: attendanceWindow.enabled,
      startAt: attendanceWindow.startAt ? new Date(attendanceWindow.startAt).toISOString() : null,
      endAt: attendanceWindow.endAt ? new Date(attendanceWindow.endAt).toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_ATTENDANCE_WINDOW_KEY, JSON.stringify(payload));
    setNotice('Đã lưu thay đổi cấu hình hệ thống. Cửa sổ điểm danh đã được cập nhật.');
  };

  return (
    <AdminLayout
      currentPath="/admin/settings"
      title="Cấu hình hệ thống"
      subtitle="Thiết lập học kỳ, quy định đăng ký, điểm danh và hạn nộp minh chứng cho toàn hệ thống."
    >
      <div className="grid gap-5">
        {notice && <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

        <div className="grid gap-5 xl:grid-cols-2">
          {systemSettings.map((item) => (
            <motion.div key={item.id} whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#132b57]">{item.label}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
              <input
                defaultValue={item.value}
                className="mt-4 w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
              />
            </motion.div>
          ))}
        </div>

        <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#132b57]">Mở thời gian điểm danh</h3>
              <p className="text-sm text-slate-500">Sinh viên chỉ điểm danh khi sự kiện đang diễn ra hoặc trong khung do admin mở.</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">Kích hoạt mở điểm danh thủ công</p>
            <button
              type="button"
              onClick={() =>
                setAttendanceWindow((current) => ({
                  ...current,
                  enabled: !current.enabled,
                }))
              }
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                attendanceWindow.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {attendanceWindow.enabled ? 'Đang bật' : 'Đang tắt'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-600">
              Bắt đầu điểm danh
              <input
                type="datetime-local"
                value={attendanceWindow.startAt}
                onChange={(event) =>
                  setAttendanceWindow((current) => ({
                    ...current,
                    startAt: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-600">
              Kết thúc điểm danh
              <input
                type="datetime-local"
                value={attendanceWindow.endAt}
                onChange={(event) =>
                  setAttendanceWindow((current) => ({
                    ...current,
                    endAt: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
              />
            </label>
          </div>
          {!isWindowValid && <p className="mt-3 text-sm font-semibold text-rose-600">Mốc thời gian chưa hợp lệ hoặc thiếu dữ liệu.</p>}
        </div>

        <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSaveSettings} className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
              <Save className="h-5 w-5" />
              Lưu cấu hình
            </button>
            <button type="button" className="rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
              Khôi phục mặc định
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
