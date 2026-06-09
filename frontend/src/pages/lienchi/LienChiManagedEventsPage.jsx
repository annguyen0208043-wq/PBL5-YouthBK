import React, { useMemo, useState, useEffect } from 'react';
import { BellRing, CalendarClock, PencilLine, XCircle, Loader, X, MapPin, Users, Tag, Clock, QrCode, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import { getStoredUserProfile } from '../../shared/user/session';

function translateStatus(status) {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'pending': return 'Chờ duyệt';
    case 'approved': return 'Đã duyệt';
    case 'ongoing': return 'Đang diễn ra';
    case 'completed': return 'Đã kết thúc';
    case 'cancelled': return 'Đã hủy';
    case 'revision_requested': return 'Cần sửa chữa';
    case 'rejected': return 'Bị từ chối';
    default: return status;
  }
}

function statusTone(status) {
  if (['approved', 'ongoing', 'completed', 'Đã duyệt', 'Đang diễn ra', 'Đã kết thúc'].includes(status)) return 'bg-emerald-100 text-emerald-700';
  if (['revision_requested', 'cancelled', 'rejected', 'Cần sửa chữa', 'Đã hủy', 'Bị từ chối'].includes(status)) return 'bg-rose-100 text-rose-700';
  if (['draft', 'Nháp'].includes(status)) return 'bg-slate-100 text-slate-700';
  return 'bg-amber-100 text-amber-700';
}

export default function LienChiManagedEventsPage() {
  const navigate = useNavigate();
  const user = getStoredUserProfile();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [actionReason, setActionReason] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  // Fetch events created by current user
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Get user ID from stored user data or extract from user object
        // Since we need user.id, let's fetch it from an endpoint or use the token
        // For now, we'll fetch all events and filter by creator (or we can improve backend)
        const response = await fetch(`/api/events`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        // Filter events created by current user
        const userEvents = data.events.filter(event => event.creator?.name === user.fullName);
        
        setEvents(userEvents);
        setError('');
      } catch (err) {
        setError(`Lỗi: ${err.message}`);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user.fullName]);

  const filters = ['Tất cả', 'Nháp', 'Chờ duyệt', 'Đã duyệt', 'Đang diễn ra', 'Cần sửa chữa', 'Đã hủy'];
  
  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const matchSearch = !search || event.title.toLowerCase().includes(search.toLowerCase());
      const translated = translateStatus(event.status);
      const matchFilter = activeFilter === 'Tất cả' || translated === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [events, search, activeFilter]);

  const selectedEvent = useMemo(() => events.find((item) => item.id === selectedEventId) || null, [events, selectedEventId]);

  const updateStatus = (nextStatus, message) => {
    setEvents((current) => current.map((item) => (item.id === selectedEventId ? { ...item, status: nextStatus, note: message } : item)));
    setNotice(message);
  };

  const handlePublish = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${eventId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Lỗi khi gửi duyệt sự kiện');
      setNotice('Đã gửi duyệt sự kiện thành công.');
      setEvents(current => current.map(item => item.id === eventId ? { ...item, status: 'pending' } : item));
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleRequestCancel = async () => {
    if (!actionReason) return;
    try {
      const token = localStorage.getItem('token');
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const payload = {
        status: 'pending',
        title: `[XIN HỦY] ${selectedEvent.title}`,
        description: `LÝ DO HỦY: ${actionReason}\n\n${selectedEvent.description}`
      };
      const res = await fetch(`/api/events/${selectedEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Lỗi khi gửi yêu cầu hủy');
      setNotice('Đã gửi yêu cầu hủy sự kiện đến Đoàn trường.');
      setEvents(current => current.map(item => item.id === selectedEventId ? { ...item, ...payload } : item));
      setShowCancelModal(false);
      setActionReason('');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleRequestPostpone = async () => {
    if (!actionReason || !newStartTime || !newEndTime) return;
    try {
      const token = localStorage.getItem('token');
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const payload = {
        status: 'pending',
        startTime: newStartTime,
        endTime: newEndTime,
        title: `[XIN HOÃN] ${selectedEvent.title}`,
        description: `LÝ DO HOÃN: ${actionReason}\n\n${selectedEvent.description}`
      };
      const res = await fetch(`/api/events/${selectedEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Lỗi khi gửi yêu cầu hoãn');
      setNotice('Đã gửi yêu cầu hoãn sự kiện đến Đoàn trường.');
      setEvents(current => current.map(item => item.id === selectedEventId ? { ...item, ...payload } : item));
      setShowPostponeModal(false);
      setActionReason('');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleToggleQR = async (active) => {
    try {
      const token = localStorage.getItem('token');
      // For demo purposes, we can hardcode default university coordinates or ask user for GPS.
      // We'll just pass a mock location (DUT: 16.074061, 108.150720) when turning ON
      const payload = { active };
      if (active) {
        payload.latitude = 16.074061;
        payload.longitude = 108.150720;
      }
      const res = await fetch(`/api/events/${selectedEventId}/qr/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi thao tác mã QR');
      
      setNotice(data.message);
      setEvents(current => current.map(item => item.id === selectedEventId ? { ...item, qrActive: data.qrActive, qrCode: data.qrCode } : item));
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleViewFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${selectedEventId}/feedbacks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi lấy feedbacks');
      setFeedbacks(data.feedbacks || []);
      setShowFeedbackModal(true);
    } catch (err) {
      setNotice(err.message);
    }
  };

  return (
    <LienChiLayout
      currentPath="/lien-chi/events/manage"
      title="Sự kiện của tôi"
      subtitle="Liên chi chỉnh sửa, hoãn, huỷ sự kiện và chủ động thông báo thay đổi cho sinh viên theo UC005."
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
            <p className="text-slate-600">Đang tải dữ liệu sự kiện...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-center text-slate-600">
          <p className="font-semibold">Chưa có sự kiện nào</p>
          <p className="mt-1 text-sm">Hãy tạo sự kiện mới từ mục &quot;Tạo sự kiện&quot;</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1">
          <section className="space-y-4">
            <div className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Tìm kiếm sự kiện..." 
                className="w-full rounded-2xl border px-4 py-2 outline-none focus:border-[#1f5dcc]" 
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.map(f => (
                  <button 
                    key={f} 
                    onClick={() => setActiveFilter(f)} 
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${activeFilter === f ? 'bg-[#1747a6] text-white shadow-md' : 'border border-[#dce8f5] bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '70vh' }}>
              {visibleEvents.map((event) => (
                <motion.button
                  key={event.id}
                  type="button"
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`w-full rounded-[28px] border p-4 text-left transition-all ${
                    selectedEventId === event.id ? 'border-[#88b2ef] bg-[#eef6ff] shadow-sm' : 'border-[#dce8f5] bg-white'
                  }`}
                >
                  <div className="flex gap-4">
                    {event.images && event.images.length > 0 ? (
                      <img src={event.images[0].imageUrl} alt={event.title} className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">Không có ảnh</div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-lg font-black text-[#132b57]" title={event.title}>{event.title}</p>
                      <p className="truncate text-sm text-slate-500">{new Date(event.startTime || event.startDate).toLocaleString('vi-VN')} • {event.location}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{event.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${statusTone(event.status)}`}>{translateStatus(event.status)}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{event.capacity || event.maxParticipants || 'Không giới hạn'} slots</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
              {visibleEvents.length === 0 && <p className="text-center text-sm text-slate-500 py-4">Không tìm thấy sự kiện phù hợp bộ lọc.</p>}
            </div>
          </section>

          </div>
        )}

        {/* ===== DETAIL MODAL OVERLAY ===== */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
              onClick={() => { setSelectedEventId(''); setNotice(''); }}
            >
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.97 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white p-6 md:p-8 shadow-2xl scrollbar-hide"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close */}
                <button onClick={() => { setSelectedEventId(''); setNotice(''); }} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 z-10">
                  <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7eff8] pb-5 pr-10">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Chi tiết sự kiện</p>
                    <h2 className="mt-2 text-2xl md:text-3xl font-black text-[#132b57]">{selectedEvent.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">Người tạo: {selectedEvent.creator?.name || 'N/A'}</p>
                  </div>
                  <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedEvent.status)}`}>{translateStatus(selectedEvent.status)}</span>
                </div>

                {/* Images */}
                {selectedEvent.images && selectedEvent.images.length > 0 && (
                  <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-3 scrollbar-hide">
                    {selectedEvent.images.map(img => (
                      <img key={img.id} src={img.imageUrl} alt="Sự kiện" className="h-48 w-72 shrink-0 snap-center rounded-2xl object-cover shadow-sm" />
                    ))}
                  </div>
                )}

                {/* Info cards */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                    <Users className="h-5 w-5 text-[#1747a6]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">Sức chứa</p>
                      <p className="font-semibold text-slate-700">{selectedEvent.capacity || selectedEvent.maxParticipants || '∞'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                    <Tag className="h-5 w-5 text-[#1747a6]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">Danh mục</p>
                      <p className="font-semibold text-slate-700">{selectedEvent.category || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                    <Clock className="h-5 w-5 text-[#1747a6]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">Bắt đầu</p>
                      <p className="font-semibold text-slate-700 text-xs">{new Date(selectedEvent.startTime).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                    <MapPin className="h-5 w-5 text-[#1747a6]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">Địa điểm</p>
                      <p className="font-semibold text-slate-700 text-xs">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Mô tả</p>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap">{selectedEvent.description}</div>
                  </div>
                )}

                {/* Admin feedback */}
                {selectedEvent.approvals && selectedEvent.approvals.length > 0 && ['revision_requested', 'rejected', 'cancelled'].includes(selectedEvent.status) && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">Phản hồi từ admin</p>
                    <p className="mt-2 text-sm text-rose-900">{selectedEvent.approvals[selectedEvent.approvals.length - 1].note}</p>
                  </div>
                )}

                {/* Timeline */}
                {selectedEvent.timelines && selectedEvent.timelines.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-[#f8fbff] p-4">
                    <div className="flex items-center gap-2 text-[#132b57]">
                      <CalendarClock className="h-5 w-5 text-[#1747a6]" />
                      <p className="font-semibold">Timeline</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedEvent.timelines.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-slate-700">{new Date(item.dateTime).toLocaleString('vi-VN')}</p>
                          <p className="mt-1">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {notice && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e7eff8] pt-5">
                  {['draft', 'revision_requested'].includes(selectedEvent.status) && (
                    <button type="button" onClick={() => handlePublish(selectedEvent.id)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition-all hover:bg-emerald-700">
                      Gửi duyệt
                    </button>
                  )}
                  <button type="button" onClick={() => navigate(`/lien-chi/events/manage/edit/${selectedEvent.id}`)} className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
                    <PencilLine className="h-5 w-5" />
                    {selectedEvent.status === 'approved' ? 'Xin sửa sự kiện' : 'Sửa sự kiện toàn diện'}
                  </button>
                  <button type="button" onClick={() => setShowPostponeModal(true)} className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
                    <CalendarClock className="h-5 w-5 text-[#1747a6]" />
                    Xin hoãn
                  </button>
                  <button type="button" onClick={() => setShowCancelModal(true)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition-all hover:bg-rose-100">
                    <XCircle className="h-5 w-5" />
                    Xin huỷ
                  </button>
                  <button type="button" onClick={() => setNotice('Đã ghi nhận yêu cầu gửi email thông báo thay đổi đến sinh viên đã đăng ký.')} className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-[#eef6ff] px-5 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#e4f0ff]">
                    <BellRing className="h-5 w-5" />
                    Thông báo đến sinh viên
                  </button>

                  {['approved', 'ongoing', 'completed', 'ended'].includes(selectedEvent.status) && (
                    <>
                      <button type="button" onClick={() => setShowQRModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition-all hover:bg-indigo-700">
                        <QrCode className="h-5 w-5" />
                        Quản lý QR & Điểm danh
                      </button>
                      <button type="button" onClick={handleViewFeedbacks} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 font-semibold text-indigo-700 transition-all hover:bg-indigo-100">
                        <MessageSquare className="h-5 w-5" />
                        Xem Đánh giá (Feedback)
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
              <h3 className="text-xl font-black text-[#132b57]">Lý do hủy sự kiện</h3>
              <p className="mt-2 text-sm text-slate-600">Yêu cầu của bạn sẽ được gửi tới Đoàn trường để phê duyệt lại.</p>
              <textarea
                rows="4"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="mt-4 w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
              />
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 rounded-2xl border bg-white py-3 font-semibold text-slate-600 hover:bg-slate-50">Hủy bỏ</button>
                <button onClick={handleRequestCancel} className="flex-1 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700">Gửi xin hủy</button>
              </div>
            </div>
          </div>
        )}

        {showPostponeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
              <h3 className="text-xl font-black text-[#132b57]">Yêu cầu hoãn sự kiện</h3>
              <p className="mt-2 text-sm text-slate-600">Vui lòng chọn thời gian mới và lý do hoãn để Đoàn trường xem xét.</p>
              <div className="mt-4 grid gap-3">
                <label>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Bắt đầu mới</span>
                  <input type="datetime-local" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full rounded-2xl border px-3 py-2 outline-none focus:border-[#1f5dcc]" />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Kết thúc mới</span>
                  <input type="datetime-local" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="w-full rounded-2xl border px-3 py-2 outline-none focus:border-[#1f5dcc]" />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Lý do hoãn</span>
                  <textarea rows="3" value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Chi tiết lý do..." className="w-full rounded-2xl border px-4 py-2 outline-none focus:border-[#1f5dcc]" />
                </label>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowPostponeModal(false)} className="flex-1 rounded-2xl border bg-white py-3 font-semibold text-slate-600 hover:bg-slate-50">Hủy bỏ</button>
                <button onClick={handleRequestPostpone} className="flex-1 rounded-2xl bg-[#1747a6] py-3 font-bold text-white hover:bg-[#205fd8]">Gửi xin hoãn</button>
              </div>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && selectedEvent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl text-center relative">
              <button onClick={() => setShowQRModal(false)} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-2xl font-black text-[#132b57] mb-2">Điểm danh QR</h3>
              <p className="text-slate-500 text-sm mb-6">Sự kiện: {selectedEvent.title}</p>

              {selectedEvent.qrActive && selectedEvent.qrCode ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-3xl shadow-lg border-2 border-indigo-100 mb-6">
                    {typeof QRCode === 'function' || typeof QRCode === 'object' ? (
                      React.createElement(QRCode.default || QRCode, { value: selectedEvent.qrCode, size: 250 })
                    ) : null}
                  </div>
                  <p className="font-mono bg-slate-100 px-4 py-2 rounded-xl text-lg font-bold tracking-widest">{selectedEvent.qrCode}</p>
                  <div className="text-emerald-600 font-semibold mt-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Mã QR đang hoạt động</div>
                  <button onClick={() => handleToggleQR(false)} className="mt-6 w-full rounded-2xl bg-rose-100 text-rose-700 py-3 font-bold hover:bg-rose-200 transition-colors">Tắt mã QR</button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <QrCode className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-6">Mã QR điểm danh đang tắt.</p>
                  <button onClick={() => handleToggleQR(true)} className="w-full rounded-2xl bg-indigo-600 text-white py-3 font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Tạo & Bật mã QR</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl relative">
              <button onClick={() => setShowFeedbackModal(false)} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-2xl font-black text-[#132b57] mb-2">Đánh giá từ Sinh viên</h3>
              <p className="text-slate-500 text-sm mb-6">Sự kiện: {selectedEvent?.title}</p>
              
              <div className="space-y-4">
                {feedbacks.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">Chưa có đánh giá nào cho sự kiện này.</p>
                  </div>
                ) : (
                  feedbacks.map(fb => (
                    <div key={fb.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-3 mb-3">
                        {fb.user?.avatar ? (
                          <img src={fb.user.avatar} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">{fb.user?.name?.charAt(0) || 'U'}</div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{fb.user?.name}</p>
                          <p className="text-xs text-slate-500">{new Date(fb.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        <div className="ml-auto flex gap-1">
                          {[1,2,3,4,5].map(star => (
                            <span key={star} className={`text-lg ${star <= fb.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-100">{fb.content || 'Không có bình luận.'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </LienChiLayout>
    );
  }
