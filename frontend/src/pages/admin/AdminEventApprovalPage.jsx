import React, { useMemo, useState, useEffect } from 'react';
import { CheckCheck, FileText, Send, XCircle, Loader, Calendar, MapPin, Tag, Clock, Users, FileDown, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';

function translateStatus(status) {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'pending': return 'Chờ duyệt';
    case 'revision_required': return 'Cần chỉnh sửa';
    case 'open_registration': return 'Mở đăng ký';
    case 'below_minimum': return 'Dưới tối thiểu';
    case 'ongoing': return 'Đang diễn ra';
    case 'ended': return 'Đã kết thúc';
    case 'completed': return 'Đã hoàn tất';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
}

function statusTone(status) {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'open_registration': return 'bg-emerald-100 text-emerald-700';
    case 'ongoing': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-indigo-100 text-indigo-700';
    case 'cancelled': return 'bg-rose-100 text-rose-700';
    case 'revision_required': return 'bg-orange-100 text-orange-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

export default function AdminEventApprovalPage() {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [selectedEventId, setSelectedEventId] = useState('');
  const [decision, setDecision] = useState('Duyệt');
  const [feedback, setFeedback] = useState('');
  const [revisionDeadline, setRevisionDeadline] = useState('');
  
  // Custom official start/end dates for approval
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');

  const [alertModal, setAlertModal] = useState({ show: false, type: 'error', message: '' });
  const [loading, setLoading] = useState(true);

  const setNotice = (msg) => {
    if (!msg) return;
    const type = msg.startsWith('✅') || msg.startsWith('✓') ? 'success' : 'error';
    setAlertModal({ show: true, type, message: msg });
  };
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detailed event object loaded from API
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch all events on component mount
  const fetchEventsList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách sự kiện');
      }

      const data = await response.json();
      const allEvents = data.events || [];
      setEvents(allEvents);
      
      const pending = allEvents.filter(e => e.status === 'pending');
      const hist = allEvents.filter(e => e.status !== 'pending' && e.status !== 'draft');
      
      if (activeTab === 'pending' && pending.length > 0) {
        setSelectedEventId(pending[0].id);
      } else if (activeTab === 'history' && hist.length > 0) {
        setSelectedEventId(hist[0].id);
      } else {
        setSelectedEventId('');
        setSelectedEvent(null);
      }
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsList();
  }, [activeTab]);

  // Load selected event details recursively
  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/events/${selectedEventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Không thể tải chi tiết sự kiện');
        const data = await response.json();
        const ev = data.event;
        setSelectedEvent(ev);

        // Populate datetime default states
        const formatDateTime = (isoStr) => {
          if (!isoStr) return '';
          const d = new Date(isoStr);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().slice(0, 16);
        };
        
        setActualStartDate(formatDateTime(ev.actualStartDate || ev.plannedStartDate));
        setActualEndDate(formatDateTime(ev.actualEndDate || ev.plannedEndDate));
      } catch (err) {
        setNotice(`❌ Lỗi tải chi tiết: ${err.message}`);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedEventId]);

  const pendingEvents = useMemo(() => events.filter(e => e.status === 'pending'), [events]);
  const historyEvents = useMemo(() => 
    events.filter(e => e.status !== 'pending' && e.status !== 'draft')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), 
    [events]
  );

  const displayedEvents = activeTab === 'pending' ? pendingEvents : historyEvents;

  const handleSubmit = async () => {
    if (!selectedEvent) {
      setNotice('❌ Vui lòng chọn sự kiện');
      return;
    }

    if (decision !== 'Duyệt' && (!feedback || feedback.trim() === '')) {
      setNotice('❌ Vui lòng cung cấp nội dung phản hồi');
      return;
    }

    if (decision === 'Yêu cầu chỉnh sửa' && !revisionDeadline) {
      setNotice('❌ Vui lòng chọn hạn chỉnh sửa cho Liên chi đoàn');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let body = {};

      if (decision === 'Duyệt') {
        endpoint = `/api/events/${selectedEvent.id}/approve`;
        body = { 
          note: feedback,
          actualStartDate,
          actualEndDate
        };
      } else if (decision === 'Từ chối') {
        endpoint = `/api/events/${selectedEvent.id}/reject`;
        body = { reason: feedback };
      } else if (decision === 'Yêu cầu chỉnh sửa') {
        endpoint = `/api/events/${selectedEvent.id}/request-revision`;
        body = { 
          message: feedback,
          revisionDeadline
        };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Lỗi gửi quyết định');
      }

      const successMessage =
        decision === 'Duyệt'
          ? `✅ Đã duyệt sự kiện "${selectedEvent.title}".`
          : decision === 'Từ chối'
          ? `✅ Đã từ chối duyệt sự kiện "${selectedEvent.title}".`
          : `✅ Đã gửi yêu cầu chỉnh sửa cho "${selectedEvent.title}".`;
      
      setNotice(successMessage);
      setFeedback('');
      setRevisionDeadline('');

      // Refresh the list after brief display
      setTimeout(() => {
        setNotice('');
        fetchEventsList();
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
      subtitle="Xem xét hồ sơ sự kiện, điều chỉnh ngày bắt đầu/kết thúc chính thức, duyệt, từ chối hoặc yêu cầu sửa đổi."
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
            <p className="text-slate-600">Đang tải danh sách sự kiện...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`rounded-2xl px-5 py-2.5 font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-[#1747a6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Chờ duyệt ({pendingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded-2xl px-5 py-2.5 font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#1747a6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Lịch sử duyệt ({historyEvents.length})
            </button>
          </div>

          {displayedEvents.length === 0 ? (
            <div className="rounded-[28px] border border-[#dce8f5] bg-white p-12 text-center">
              <p className="text-slate-600">Không tìm thấy sự kiện nào ở tab này.</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
              {/* Left Column: Event List */}
              <section className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                {displayedEvents.map((event) => (
                  <motion.button
                    key={event.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`profile-panel w-full rounded-[28px] border p-5 text-left transition-all ${
                      selectedEventId === event.id ? 'border-[#88b2ef] bg-[#eef6ff] shadow-sm' : 'border-[#dce8f5] bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-[#132b57] line-clamp-2">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-500 font-semibold">Tạo bởi: {event.creator?.name || 'Liên chi'}</p>
                      </div>
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold leading-none ${statusTone(event.status)}`}>
                        {translateStatus(event.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 font-medium">
                      Thời gian dự kiến: {new Date(event.plannedStartDate).toLocaleString('vi-VN')}
                    </p>
                  </motion.button>
                ))}
              </section>

              {/* Right Column: Event Detail & Approval Actions */}
              <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 space-y-4">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <Loader className="h-8 w-8 animate-spin text-[#1747a6]" />
                    <p className="mt-4 text-slate-500 text-sm">Đang tải hồ sơ chi tiết...</p>
                  </div>
                ) : selectedEvent ? (
                  <>
                    <div className="flex flex-col gap-4 border-b border-[#e7eff8] pb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Hồ sơ đề nghị duyệt</p>
                        <h2 className="mt-2 text-2xl font-black text-[#132b57] leading-snug">{selectedEvent.title}</h2>
                        <p className="mt-2 text-xs text-slate-500 font-medium">Người tạo: {selectedEvent.creator?.name} ({selectedEvent.creator?.faculty || 'Khoa'}){selectedEvent.leader?.name && ` | Người chủ trì: ${selectedEvent.leader.name}`}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{selectedEvent.category}</span>
                    </div>

                    {/* Cover Images previews */}
                    {selectedEvent.images && selectedEvent.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {selectedEvent.images.map((img, i) => (
                          <div key={i} className="shrink-0 relative">
                            <img src={img.imageUrl} className="h-20 w-32 object-cover rounded-xl shadow-sm bg-slate-100" />
                            {img.isCover === 1 && (
                              <span className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">Bìa</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata Cards */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#f6faff] p-3 text-xs">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Thời gian dự kiến</p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {new Date(selectedEvent.plannedStartDate).toLocaleString('vi-VN')} - {new Date(selectedEvent.plannedEndDate).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f6faff] p-3 text-xs">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Số lượng tối thiểu/tối đa</p>
                        <p className="mt-1 font-semibold text-slate-700">
                          Min: {selectedEvent.minParticipants || 'Không'} | Max: {selectedEvent.maxParticipants || 'Không giới hạn'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f6faff] p-3 text-xs">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Địa điểm</p>
                        <p className="mt-1 font-semibold text-slate-700">{selectedEvent.locationName}</p>
                      </div>
                      {selectedEvent.attendanceRadius && (
                        <div className="rounded-2xl bg-[#f6faff] p-3 text-xs">
                          <p className="text-slate-400 font-bold uppercase tracking-wider">Điểm danh GPS</p>
                          <p className="mt-1 font-semibold text-slate-700">Bán kính: {selectedEvent.attendanceRadius}m</p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      <p className="font-bold text-slate-700 mb-1">Nội dung chi tiết:</p>
                      {selectedEvent.description || 'Chưa có mô tả chi tiết.'}
                    </div>

                    {/* Documents Download */}
                    {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-[#132b57]">Tài liệu đính kèm ({selectedEvent.documents.length})</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {selectedEvent.documents.map(doc => (
                            <a 
                              key={doc.id} 
                              href={doc.fileUrl} 
                              download 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-between border border-slate-100 rounded-xl p-2 bg-slate-50 hover:bg-slate-100 text-xs"
                            >
                              <span className="truncate font-medium text-slate-700 max-w-[150px]">{doc.fileName}</span>
                              <FileDown className="h-4 w-4 text-[#1747a6]" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline display */}
                    {selectedEvent.timelines && selectedEvent.timelines.length > 0 && (
                      <div className="rounded-2xl bg-[#f8fbff] p-4 text-xs">
                        <p className="font-bold text-[#132b57] mb-2">Timeline các giai đoạn:</p>
                        <div className="space-y-3">
                          {selectedEvent.timelines.map((phase, i) => (
                            <div key={phase.id} className="border-l border-slate-200 pl-3">
                              <p className="font-bold text-slate-700">GD {i + 1}: {phase.title}</p>
                              {phase.details && phase.details.length > 0 && (
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 pl-1">
                                  {phase.details.map(m => (
                                    <li key={m.id}>
                                      {m.title} ({new Date(m.dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Form for Pending Events */}
                    {activeTab === 'pending' && (
                      <div className="border-t border-[#e7eff8] pt-4 space-y-4">
                        <p className="text-xs font-bold text-[#132b57]">QUYẾT ĐỊNH DUYỆT</p>
                        
                        <div className="grid gap-2 grid-cols-3">
                          {['Duyệt', 'Yêu cầu chỉnh sửa', 'Từ chối'].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setDecision(value);
                                setNotice('');
                              }}
                              className={`rounded-xl py-2.5 text-xs font-bold transition-all border ${
                                decision === value 
                                  ? 'bg-[#1747a6] text-white border-[#1747a6] shadow-sm' 
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>

                        {/* If decision is approve: Allow adjustment of actualStartDate / actualEndDate */}
                        {decision === 'Duyệt' && (
                          <div className="grid gap-3 sm:grid-cols-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                            <label className="block">
                              <span className="block text-[10px] font-bold text-slate-500 mb-1">Bắt đầu chính thức</span>
                              <input 
                                type="datetime-local" 
                                value={actualStartDate}
                                onChange={(e) => setActualStartDate(e.target.value)}
                                className="w-full text-xs rounded border p-1"
                              />
                            </label>
                            <label className="block">
                              <span className="block text-[10px] font-bold text-slate-500 mb-1">Kết thúc chính thức</span>
                              <input 
                                type="datetime-local" 
                                value={actualEndDate}
                                onChange={(e) => setActualEndDate(e.target.value)}
                                className="w-full text-xs rounded border p-1"
                              />
                            </label>
                          </div>
                        )}

                        {/* If decision is revision_required: MUST enter revision deadline */}
                        {decision === 'Yêu cầu chỉnh sửa' && (
                          <label className="block bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                            <span className="block text-xs font-bold text-orange-800 mb-1">Hạn chỉnh sửa bắt buộc *</span>
                            <input 
                              type="datetime-local" 
                              value={revisionDeadline}
                              onChange={(e) => setRevisionDeadline(e.target.value)}
                              className="w-full text-xs rounded border p-2 focus:border-orange-400 outline-none"
                            />
                          </label>
                        )}

                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-700">
                            {decision === 'Duyệt' ? 'Ghi chú duyệt (không bắt buộc)' : 'Nội dung phản hồi từ Đoàn trường *'}
                          </span>
                          <textarea
                            rows="4"
                            value={feedback}
                            onChange={(event) => setFeedback(event.target.value)}
                            className="w-full rounded-xl border border-[#dce8f5] px-3 py-2 outline-none focus:border-[#1f5dcc] text-xs leading-relaxed"
                            placeholder={
                              decision === 'Duyệt'
                                ? 'Lời dặn dò cho liên chi đoàn...'
                                : 'Điểm cần sửa đổi chi tiết / Lý do không đồng ý...'
                            }
                          />
                        </label>



                        <div className="flex gap-2">
                          <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1747a6] px-5 py-2.5 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50 text-xs shadow-sm flex-1"
                          >
                            <CheckCheck className="h-4 w-4" />
                            {submitting ? 'Đang gửi...' : 'Gửi phê duyệt'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* History approvals log display */}
                    {activeTab === 'history' && selectedEvent.approvals && selectedEvent.approvals.length > 0 && (
                      <div className="border-t border-[#e7eff8] pt-4 space-y-2">
                        <p className="text-xs font-bold text-slate-600">LỊCH SỬ DUYỆT SỰ KIỆN</p>
                        <div className="space-y-2">
                          {selectedEvent.approvals.map((appr, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span className="text-slate-700">Duyệt bởi: {appr.approver?.name || 'Admin'}</span>
                                <span className={statusTone(appr.status === 'revision_requested' ? 'revision_required' : appr.status === 'approved' ? 'open_registration' : 'cancelled') + ' px-2 py-0.5 rounded text-[10px]'}>
                                  {appr.status === 'approved' ? 'Đã duyệt' : appr.status === 'rejected' ? 'Từ chối' : 'Yêu cầu sửa'}
                                </span>
                              </div>
                              <p className="text-slate-500 font-mono text-[10px]">{new Date(appr.createdAt).toLocaleString('vi-VN')}</p>
                              {appr.note && <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 italic">"{appr.note}"</p>}
                              {appr.revisionDeadline && (
                                <p className="text-[10px] text-orange-700 font-bold">Hạn chỉnh sửa: {new Date(appr.revisionDeadline).toLocaleString('vi-VN')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-slate-400">Vui lòng chọn sự kiện để xem chi tiết</div>
                )}
              </section>
            </div>
          )}
        </>
      )}
      {/* Custom Alert Modal popup overlay */}
      {alertModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
              alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
            }`}>
              {alertModal.type === 'success' ? '✓' : '⚠️'}
            </div>
            <h3 className="text-lg font-black text-[#132b57]">
              {alertModal.type === 'success' ? 'Thành công' : 'Thông báo'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {alertModal.message}
            </p>
            <button
              type="button"
              onClick={() => setAlertModal({ show: false, type: 'error', message: '' })}
              className="w-full rounded-xl bg-[#1747a6] py-3 text-sm font-bold text-white shadow-md hover:bg-[#205fd8] transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
