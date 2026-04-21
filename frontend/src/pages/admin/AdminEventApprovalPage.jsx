import React, { useMemo, useState, useEffect } from 'react';
import { CheckCheck, FileText, Send, XCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminEventApprovalPage() {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [decision, setDecision] = useState('Duyệt');
  const [feedback, setFeedback] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch pending events on component mount
  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/events/pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Không thể tải danh sách sự kiện chờ duyệt');
        }

        const data = await response.json();
        setPendingEvents(data.events || []);
        if (data.events && data.events.length > 0) {
          setSelectedEventId(data.events[0].id);
        }
      } catch (err) {
        setNotice(`❌ Lỗi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingEvents();
  }, []);

  const selectedEvent = useMemo(
    () => pendingEvents.find((item) => item.id === parseInt(selectedEventId)) ?? pendingEvents[0],
    [selectedEventId, pendingEvents]
  );

  const handleSubmit = async () => {
    if (!selectedEvent) {
      setNotice('❌ Vui lòng chọn sự kiện');
      return;
    }

    if (decision !== 'Duyệt' && (!feedback || feedback.trim() === '')) {
      setNotice('❌ Vui lòng cung cấp nội dung phản hồi');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let body = {};

      if (decision === 'Duyệt') {
        endpoint = `/api/events/${selectedEvent.id}/approve`;
        body = { note: feedback };
      } else if (decision === 'Từ chối') {
        endpoint = `/api/events/${selectedEvent.id}/reject`;
        body = { note: feedback };
      } else if (decision === 'Yêu cầu chỉnh sửa') {
        endpoint = `/api/events/${selectedEvent.id}/request-revision`;
        body = { note: feedback };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi gửi quyết định');
      }

      const successMessage =
        decision === 'Duyệt'
          ? `✅ Đã duyệt sự kiện "${selectedEvent.title}".`
          : decision === 'Từ chối'
          ? `✅ Đã từ chối sự kiện "${selectedEvent.title}".`
          : `✅ Đã gửi yêu cầu chỉnh sửa cho "${selectedEvent.title}".`;
      
      setNotice(successMessage);

      // Refresh the list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/event-approvals"
      title="Duyệt sự kiện"
      subtitle="Đoàn trường xem xét hồ sơ sự kiện, duyệt, từ chối hoặc yêu cầu chỉnh sửa theo đúng use case UC006."
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
            <p className="text-slate-600">Đang tải danh sách sự kiện chờ duyệt...</p>
          </div>
        </div>
      ) : pendingEvents.length === 0 ? (
        <div className="rounded-[28px] border border-[#dce8f5] bg-white p-12 text-center">
          <p className="text-slate-600">Không có sự kiện nào chờ duyệt.</p>
        </div>
      ) : (
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
                    <p className="mt-1 text-sm text-slate-500">{event.creator?.fullName || 'N/A'}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{event.status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {new Date(event.startTime).toLocaleString('vi-VN')}
                </p>
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
                    <p className="mt-2 text-sm text-slate-500">{selectedEvent.creator?.fullName || 'N/A'}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{selectedEvent.category}</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-[#f6faff] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thời gian bắt đầu</p>
                    <p className="mt-2 font-semibold text-slate-700">{new Date(selectedEvent.startTime).toLocaleString('vi-VN')}</p>
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

                {selectedEvent.timelines && selectedEvent.timelines.length > 0 && (
                  <div className="mt-4 rounded-[24px] bg-[#f6faff] p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#1747a6]" />
                      <p className="font-semibold text-[#132b57]">Timeline sự kiện</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedEvent.timelines.map((item, index) => (
                        <div key={index} className="text-sm text-slate-600">
                          <p className="font-semibold text-slate-700">{new Date(item.dateTime).toLocaleString('vi-VN')}</p>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {['Duyệt', 'Yêu cầu chỉnh sửa', 'Từ chối'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setDecision(value);
                        setFeedback('');
                      }}
                      className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                        decision === value ? 'bg-[#1747a6] text-white' : 'border border-[#dce8f5] bg-white text-slate-600'
                    }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {decision === 'Duyệt' ? 'Ghi chú (tùy chọn)' : 'Nội dung phản hồi *'}
                  </span>
                  <textarea
                    rows="5"
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                    placeholder={
                      decision === 'Duyệt'
                        ? 'Nhập ghi chú nếu có (không bắt buộc)...'
                        : 'Nhập lý do từ chối hoặc các điểm cần chỉnh sửa...'
                    }
                  />
                </label>

                {notice && (
                  <div
                    className={`mt-4 rounded-[24px] border px-4 py-3 text-sm font-semibold ${
                      notice.startsWith('✅')
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {notice}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50"
                  >
                    <CheckCheck className="h-5 w-5" />
                    {submitting ? 'Đang xử lý...' : 'Gửi quyết định'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback('');
                      setNotice('');
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]"
                  >
                    <XCircle className="h-5 w-5" />
                    Hủy thao tác
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
