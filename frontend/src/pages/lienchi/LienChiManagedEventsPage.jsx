import React, { useMemo, useState, useEffect } from 'react';
import { BellRing, CalendarClock, PencilLine, XCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import { getStoredUserProfile } from '../../shared/user/session';

function translateStatus(status) {
  switch (status) {
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

  const filters = ['Tất cả', 'Chờ duyệt', 'Đã duyệt', 'Đang diễn ra', 'Cần sửa chữa', 'Đã hủy'];
  
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
        <div className={`grid gap-6 transition-all duration-300 ${selectedEvent ? 'xl:grid-cols-[1fr_1.2fr]' : 'grid-cols-1'}`}>
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

          {selectedEvent && (
            <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7eff8] pb-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Thông tin sự kiện</p>
                  <h2 className="mt-2 text-3xl font-black text-[#132b57]">{selectedEvent.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{selectedEvent.creator?.name || 'N/A'}</p>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedEvent.status)}`}>{translateStatus(selectedEvent.status)}</span>
              </div>

              {selectedEvent.images && selectedEvent.images.length > 0 && (
                <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-3 scrollbar-hide">
                  {selectedEvent.images.map(img => (
                    <img key={img.id} src={img.imageUrl} alt="Sự kiện" className="h-48 w-72 shrink-0 snap-center rounded-2xl object-cover shadow-sm" />
                  ))}
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sức chứa</p>
                  <p className="mt-2 font-semibold text-slate-700">
                    {selectedEvent.capacity || selectedEvent.maxParticipants || 'Không giới hạn'} sinh viên
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Danh mục</p>
                  <p className="mt-2 font-semibold text-slate-700">{selectedEvent.category || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Thời gian bắt đầu</span>
                  <input defaultValue={new Date(selectedEvent.startTime).toLocaleString('vi-VN') || ''} className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" readOnly />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Địa điểm</span>
                  <input defaultValue={selectedEvent.location} className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" readOnly />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</span>
                <textarea rows="5" defaultValue={selectedEvent.description} className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" readOnly />
              </label>

              {selectedEvent.approvals && selectedEvent.approvals.length > 0 && ['revision_requested', 'rejected', 'cancelled'].includes(selectedEvent.status) && (
                <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">Phản hồi từ admin</p>
                  <p className="mt-2 text-sm text-rose-900">
                    {selectedEvent.approvals[selectedEvent.approvals.length - 1].note}
                  </p>
                </div>
              )}

              {selectedEvent.timelines && selectedEvent.timelines.length > 0 && (
                <div className="mt-4 rounded-[24px] bg-[#f8fbff] p-4">
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

              {notice && <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/lien-chi/events/manage/edit/${selectedEvent.id}`)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
                >
                  <PencilLine className="h-5 w-5" />
                  {selectedEvent.status === 'approved' ? 'Xin sửa sự kiện' : 'Sửa sự kiện toàn diện'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPostponeModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]"
                >
                  <CalendarClock className="h-5 w-5 text-[#1747a6]" />
                  Xin hoãn
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition-all hover:bg-rose-100"
                >
                  <XCircle className="h-5 w-5" />
                  Xin huỷ
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
            </section>
          )}
          </div>
        )}

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
      </LienChiLayout>
    );
  }
