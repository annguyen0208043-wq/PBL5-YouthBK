import React, { useMemo, useState, useEffect } from 'react';
import { CalendarClock, PencilLine, Loader, X, MapPin, Users, Tag, Clock, QrCode, MessageSquare, ChevronLeft, ChevronRight, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

import AdminLayout from '../../components/admin/AdminLayout';
import { getStoredUserProfile } from '../../shared/user/session';

function translateStatus(status) {
  switch (status) {
    case 'draft': return 'Nháp';
    case 'pending': return 'Chờ duyệt';
    case 'revision_required': return 'Cần sửa chữa';
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
  if (['open_registration', 'ongoing', 'completed', 'Mở đăng ký', 'Đang diễn ra', 'Đã hoàn tất'].includes(status)) return 'bg-emerald-100 text-emerald-700';
  if (['revision_required', 'cancelled', 'Cần sửa chữa', 'Đã hủy'].includes(status)) return 'bg-rose-100 text-rose-700';
  if (['draft', 'Nháp'].includes(status)) return 'bg-slate-100 text-slate-700';
  if (['below_minimum', 'Dưới tối thiểu'].includes(status)) return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

function approvalStatusLabel(status) {
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'rejected') return 'Từ chối';
  if (status === 'revision_requested') return 'Yêu cầu sửa';
  return status;
}

function approvalStatusTone(status) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-100 text-rose-700';
  if (status === 'revision_requested') return 'bg-orange-100 text-orange-700';
  return 'bg-slate-100 text-slate-700';
}

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const user = getStoredUserProfile();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  // Modal States
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  // Detailed event data (loaded when clicked)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch all events in system
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setError('');
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Load detailed event when selectedEventId changes
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
        setSelectedEvent(data.event);
        setCarouselIndex(0);
      } catch (err) {
        setNotice(`Lỗi tải chi tiết: ${err.message}`);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedEventId]);

  const filters = ['Tất cả', 'Chờ duyệt', 'Mở đăng ký', 'Đang diễn ra', 'Đã kết thúc', 'Đã hủy'];

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const matchSearch = !search || event.title.toLowerCase().includes(search.toLowerCase());
      const translated = translateStatus(event.status);

      let matchFilter = activeFilter === 'Tất cả';
      if (activeFilter === 'Chờ duyệt') matchFilter = event.status === 'pending';
      else if (activeFilter === 'Mở đăng ký') matchFilter = event.status === 'open_registration';
      else if (activeFilter === 'Đang diễn ra') matchFilter = event.status === 'ongoing';
      else if (activeFilter === 'Đã kết thúc') matchFilter = ['ended', 'completed'].includes(event.status);
      else if (activeFilter === 'Đã hủy') matchFilter = event.status === 'cancelled';

      return matchSearch && matchFilter;
    });
  }, [events, search, activeFilter]);

  const handleToggleQR = async (active) => {
    try {
      const token = localStorage.getItem('token');
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
      setSelectedEvent(curr => curr ? { ...curr, qrActive: data.qrActive, qrCode: data.qrCode } : null);
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
    <AdminLayout
      currentPath="/admin/events"
      title="Danh sách sự kiện"
      subtitle="Theo dõi toàn bộ các sự kiện trong hệ thống, quản lý điểm danh QR và xem đánh giá từ sinh viên."
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
            <p className="text-slate-655 font-semibold">Đang tải danh sách sự kiện...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-5 max-w-5xl mx-auto">
          {/* Filters card */}
          <div className="profile-panel rounded-[24px] border border-[#dce8f5] bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 focus-within:border-[#1f5dcc] focus-within:bg-white transition-all">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sự kiện theo tên..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-[#132b57] font-medium"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeFilter === f
                    ? 'bg-[#1747a6] text-white shadow-sm'
                    : 'border border-[#dce8f5] bg-[#f8fbff] text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Events cards grid */}
          <div className="grid gap-4 md:grid-cols-1">
            {visibleEvents.map((event) => {
              const coverImage = event.images?.find(img => img.isCover === 1) || event.images?.[0];
              return (
                <motion.button
                  key={event.id}
                  type="button"
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`w-full rounded-[28px] border p-5 text-left transition-all ${selectedEventId === event.id ? 'border-[#88b2ef] bg-[#eef6ff] shadow-sm' : 'border-[#dce8f5] bg-white shadow-sm'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {coverImage ? (
                      <img src={coverImage.imageUrl} alt={event.title} className="h-24 w-full sm:w-24 shrink-0 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-24 w-full sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">Không có ảnh</div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-lg font-black text-[#132b57] leading-snug truncate group-hover:text-[#1747a6]" title={event.title}>{event.title}</p>
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold leading-none ${statusTone(event.status)}`}>
                          {translateStatus(event.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold">Đơn vị tạo: <span className="text-[#1747a6] font-bold">{event.creator?.name || 'Văn phòng Đoàn'}</span></p>
                      <p className="text-xs text-slate-500 font-medium">{new Date(event.plannedStartDate).toLocaleString('vi-VN')} • {event.locationName}</p>

                      <div className="flex items-center gap-3 pt-1 border-t border-slate-100 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Đăng ký: {event.currentSlots} / {event.maxParticipants || '∞'}</span>
                        {event.minParticipants && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Tối thiểu: {event.minParticipants}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {visibleEvents.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-12 bg-white rounded-[28px] border border-[#dce8f5]">Không tìm thấy sự kiện phù hợp bộ lọc.</p>
            )}
          </div>
        </div>
      )}

      {/* ===== EVENT DETAILS MODAL ===== */}
      <AnimatePresence>
        {selectedEventId && (
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
              <button onClick={() => { setSelectedEventId(''); setNotice(''); }} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 z-10">
                <X className="h-5 w-5" />
              </button>

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader className="h-8 w-8 animate-spin text-[#1747a6]" />
                  <p className="mt-4 text-slate-655 font-semibold">Đang tải chi tiết sự kiện...</p>
                </div>
              ) : selectedEvent ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7eff8] pb-5 pr-10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Chi tiết quản lý sự kiện</p>
                      <h2 className="mt-2 text-2xl md:text-3xl font-black text-[#132b57]">{selectedEvent.title}</h2>
                      <p className="mt-1 text-sm text-slate-500 font-semibold">
                        Đơn vị tạo: <span className="text-[#1747a6]">{selectedEvent.creator?.name || 'N/A'}</span>
                        {selectedEvent.leader?.name && ` | Người chủ trì: ${selectedEvent.leader.name}`}
                      </p>
                    </div>
                    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedEvent.status)}`}>{translateStatus(selectedEvent.status)}</span>
                  </div>

                  {/* Image Carousel */}
                  {selectedEvent.images && selectedEvent.images.length > 0 && (
                    <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-md group">
                      <div className="h-64 md:h-80 w-full flex items-center justify-center">
                        <img
                          src={selectedEvent.images[carouselIndex].imageUrl}
                          alt="Cover carousel"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {selectedEvent.images[carouselIndex].caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-5 py-3 text-sm text-white font-medium">
                          {selectedEvent.images[carouselIndex].caption}
                        </div>
                      )}
                      {selectedEvent.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setCarouselIndex(prev => (prev === 0 ? selectedEvent.images.length - 1 : prev - 1))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm text-slate-700"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCarouselIndex(prev => (prev === selectedEvent.images.length - 1 ? 0 : prev + 1))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm text-slate-700"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Info badges */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <Users className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Đăng ký</p>
                        <p className="font-bold text-slate-700 text-sm mt-0.5">{selectedEvent.currentSlots} / {selectedEvent.maxParticipants || '∞'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <Tag className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Danh mục</p>
                        <p className="font-bold text-slate-700 text-sm mt-0.5 truncate max-w-[120px]">{selectedEvent.category || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <Clock className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Thời gian</p>
                        <p className="font-bold text-slate-700 text-[10px] leading-tight mt-0.5">
                          {new Date(selectedEvent.plannedStartDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4 border border-[#dce8f5]">
                      <MapPin className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Địa điểm</p>
                        <p className="font-bold text-slate-700 text-xs mt-0.5 truncate max-w-[120px]">{selectedEvent.locationName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-[#132b57] uppercase tracking-wider">Mô tả sự kiện</p>
                      <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-650 whitespace-pre-wrap leading-relaxed border border-slate-100">{selectedEvent.description}</div>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-[#132b57] uppercase tracking-wider">Tài liệu đính kèm ({selectedEvent.documents.length})</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedEvent.documents.map(doc => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50 hover:bg-[#f3f7ff] hover:border-[#83a8ea] transition-all"
                          >
                            <FileText className="h-5 w-5 text-[#1747a6]" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-750 truncate">{doc.fileName}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{(doc.fileSize / 1024).toFixed(1)} KB • {doc.fileType?.toUpperCase()}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approvals history */}
                  {selectedEvent.approvals && selectedEvent.approvals.length > 0 && (
                    <div className="rounded-2xl border border-[#e4effc] bg-[#f8fbff] p-5">
                      <div className="mb-3 flex items-center gap-2 text-[#132b57]">
                        <MessageSquare className="h-5 w-5 text-[#1747a6]" />
                        <p className="font-bold">Lịch sử duyệt sự kiện</p>
                      </div>
                      <div className="space-y-2">
                        {[...selectedEvent.approvals]
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((approval) => (
                            <div key={approval.id} className="rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-slate-700">Người phê duyệt: {approval.approver?.name || 'Admin'}</p>
                                  <p className="mt-1 font-mono text-[10px] text-slate-450">
                                    {new Date(approval.createdAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${approvalStatusTone(approval.status)}`}>
                                  {approvalStatusLabel(approval.status)}
                                </span>
                              </div>
                              {approval.note && (
                                <p className="mt-2 rounded-lg bg-slate-50 p-2 text-slate-700">
                                  &quot;{approval.note}&quot;
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {notice && <div className="rounded-2xl border border-emerald-250 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">{notice}</div>}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 border-t border-[#e7eff8] pt-5 justify-end">
                    {selectedEvent.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => { setSelectedEventId(''); navigate(`/admin/event-approvals`); }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white transition-all hover:bg-amber-600 shadow-sm"
                      >
                        Đi tới duyệt sự kiện
                      </button>
                    )}

                    {['open_registration', 'ongoing', 'completed', 'ended'].includes(selectedEvent.status) && (
                      <>
                        <button type="button" onClick={() => setShowQRModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition-all hover:bg-indigo-700 shadow-sm">
                          <QrCode className="h-5 w-5" />
                          Điểm danh QR
                        </button>
                        <button type="button" onClick={handleViewFeedbacks} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 font-semibold text-indigo-700 transition-all hover:bg-indigo-100 shadow-sm">
                          <MessageSquare className="h-5 w-5" />
                          Xem Đánh giá
                        </button>
                      </>
                    )}
                    <button onClick={() => { setSelectedEventId(''); setNotice(''); }} className="rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-bold text-slate-650 hover:bg-slate-50 transition-all">Đóng</button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
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
                <p className="text-slate-655 mb-6">Mã QR điểm danh đang tắt.</p>
                <button onClick={() => handleToggleQR(true)} className="w-full rounded-2xl bg-indigo-600 text-white py-3 font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Tạo & Bật mã QR</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedbacks Modal */}
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
                  <p className="text-slate-555">Chưa có đánh giá nào cho sự kiện này.</p>
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
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`text-lg ${star <= fb.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-100">{fb.comment || 'Không có bình luận.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
