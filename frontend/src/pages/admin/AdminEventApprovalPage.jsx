import React, { useMemo, useState } from 'react';
import { CheckCheck, FileText, Send, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { pendingEvents } from '../../shared/admin/adminData';

export default function AdminEventApprovalPage() {
  const [selectedEventId, setSelectedEventId] = useState(pendingEvents[0]?.id ?? '');
  const [decision, setDecision] = useState('Duyệt');
  const [feedback, setFeedback] = useState('');
  const [notice, setNotice] = useState('');

  const selectedEvent = useMemo(
    () => pendingEvents.find((item) => item.id === selectedEventId) ?? pendingEvents[0],
    [selectedEventId]
  );

  const handleSubmit = () => {
    const message =
      decision === 'Duyệt'
        ? `Đã chuyển "${selectedEvent.title}" sang trạng thái Đã duyệt.`
        : `Đã gửi phản hồi "${decision}" cho đơn vị tổ chức.`;
    setNotice(message);
  };

  return (
    <AdminLayout
      currentPath="/admin/event-approvals"
      title="Duyệt sự kiện"
      subtitle="Đoàn trường xem xét hồ sơ sự kiện, duyệt, từ chối hoặc yêu cầu chỉnh sửa theo đúng use case UC006."
    >
      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="space-y-4">
          {pendingEvents.map((event) => (
            <motion.button
              key={event.id}
              type="button"
              whileHover={{ y: -3 }}
              onClick={() => setSelectedEventId(event.id)}
              className={`profile-panel w-full rounded-[28px] border p-5 text-left transition-all ${
                selectedEventId === event.id ? 'border-[#88b2ef] bg-[#eef6ff]' : 'border-[#dce8f5] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-[#132b57]">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.unit}</p>
                </div>
                <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-bold leading-none text-amber-700">{event.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{event.time}</p>
            </motion.button>
          ))}
        </section>

        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
          {selectedEvent && (
            <>
              <div className="flex flex-col gap-4 border-b border-[#e7eff8] pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Chi tiết hồ sơ</p>
                  <h2 className="mt-2 text-3xl font-black text-[#132b57]">{selectedEvent.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{selectedEvent.unit}</p>
                </div>
                <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-bold leading-none text-amber-700">{selectedEvent.category}</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thời gian</p>
                  <p className="mt-2 font-semibold text-slate-700">{selectedEvent.time}</p>
                </div>
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Địa điểm</p>
                  <p className="mt-2 font-semibold text-slate-700">{selectedEvent.location}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] bg-[#f6faff] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Mô tả sự kiện</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedEvent.description}</p>
              </div>

              <div className="mt-4 rounded-[24px] bg-[#f6faff] p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1747a6]" />
                  <p className="font-semibold text-[#132b57]">Kế hoạch đính kèm</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedEvent.plan}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {['Duyệt', 'Yêu cầu chỉnh sửa', 'Từ chối'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDecision(value)}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                      decision === value ? 'bg-[#1747a6] text-white' : 'border border-[#dce8f5] bg-white text-slate-600'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nội dung phản hồi</span>
                <textarea
                  rows="5"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                  placeholder="Nhập lý do từ chối hoặc các điểm cần chỉnh sửa nếu cần."
                />
              </label>

              {notice && <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
                  <CheckCheck className="h-5 w-5" />
                  Gửi quyết định
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
                  <XCircle className="h-5 w-5" />
                  Hủy thao tác
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-[#eef6ff] px-5 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#e4f0ff]">
                  <Send className="h-5 w-5" />
                  Gửi phản hồi cho đơn vị
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
