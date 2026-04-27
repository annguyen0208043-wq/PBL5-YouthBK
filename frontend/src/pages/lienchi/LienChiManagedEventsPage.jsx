import React, { useMemo, useState } from 'react';
import { BellRing, CalendarClock, PencilLine, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import { lienChiEvents } from '../../shared/lienchi/lienChiData';

function statusTone(status) {
  if (status === 'Đã duyệt') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Cần chỉnh sửa') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

export default function LienChiManagedEventsPage() {
  const [events, setEvents] = useState(lienChiEvents);
  const [selectedEventId, setSelectedEventId] = useState(lienChiEvents[0]?.id ?? '');
  const [notice, setNotice] = useState('');

  const selectedEvent = useMemo(() => events.find((item) => item.id === selectedEventId) ?? events[0], [events, selectedEventId]);

  const updateStatus = (nextStatus, message) => {
    setEvents((current) => current.map((item) => (item.id === selectedEventId ? { ...item, status: nextStatus, note: message } : item)));
    setNotice(message);
  };

  return (
    <LienChiLayout
      currentPath="/lien-chi/events/manage"
      title="Sự kiện của tôi"
      subtitle="Liên chi chỉnh sửa, hoãn, huỷ sự kiện và chủ động thông báo thay đổi cho sinh viên theo UC005."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          {events.map((event) => (
            <motion.button
              key={event.id}
              type="button"
              whileHover={{ y: -3 }}
              onClick={() => setSelectedEventId(event.id)}
              className={`w-full rounded-[28px] border p-5 text-left transition-all ${
                selectedEventId === event.id ? 'border-[#88b2ef] bg-[#eef6ff]' : 'border-[#dce8f5] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-[#132b57]">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.time}</p>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(event.status)}`}>{event.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{event.location}</p>
            </motion.button>
          ))}
        </section>

        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
          {selectedEvent && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7eff8] pb-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Thông tin sự kiện</p>
                  <h2 className="mt-2 text-3xl font-black text-[#132b57]">{selectedEvent.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{selectedEvent.organizer}</p>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedEvent.status)}`}>{selectedEvent.status}</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Đăng ký</p>
                  <p className="mt-2 font-semibold text-slate-700">
                    {selectedEvent.registrations}/{selectedEvent.capacity} sinh viên
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Điểm danh</p>
                  <p className="mt-2 font-semibold text-slate-700">{selectedEvent.attendanceMethod}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Thời gian</span>
                  <input defaultValue={selectedEvent.time} className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Địa điểm</span>
                  <input defaultValue={selectedEvent.location} className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú điều chỉnh</span>
                <textarea rows="5" defaultValue={selectedEvent.note} className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
              </label>

              <div className="mt-4 rounded-[24px] bg-[#f8fbff] p-4">
                <div className="flex items-center gap-2 text-[#132b57]">
                  <CalendarClock className="h-5 w-5 text-[#1747a6]" />
                  <p className="font-semibold">Timeline hiện tại</p>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedEvent.timeline.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {notice && <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateStatus(selectedEvent.status, 'Đã lưu thay đổi thông tin sự kiện và sẵn sàng gửi thông báo đến sinh viên.')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
                >
                  <PencilLine className="h-5 w-5" />
                  Lưu chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus('Chờ duyệt', 'Đã hoãn sự kiện và đánh dấu chờ phê duyệt hoặc đổi lịch mới.')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]"
                >
                  <CalendarClock className="h-5 w-5 text-[#1747a6]" />
                  Hoãn sự kiện
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus('Cần chỉnh sửa', 'Đã huỷ sự kiện và mở luồng thông báo đến sinh viên đã đăng ký.')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition-all hover:bg-rose-100"
                >
                  <XCircle className="h-5 w-5" />
                  Huỷ sự kiện
                </button>
                <button
                  type="button"
                  onClick={() => setNotice('Đã ghi nhận yêu cầu gửi email thông báo thay đổi đến sinh viên đã đăng ký.')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-[#eef6ff] px-5 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#e4f0ff]"
                >
                  <BellRing className="h-5 w-5" />
                  Thông báo đến sinh viên
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </LienChiLayout>
  );
}
