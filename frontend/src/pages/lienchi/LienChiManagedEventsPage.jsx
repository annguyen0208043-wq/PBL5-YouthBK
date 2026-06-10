import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BellRing, CalendarClock, PencilLine, XCircle, Loader, X, MapPin, Users, Tag, Clock, QrCode, MessageSquare, ChevronLeft, ChevronRight, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import jsQR from 'jsqr';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
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

  // Below Minimum Action Modal States
  const [showBelowMinModal, setShowBelowMinModal] = useState(false);
  const [belowMinAction, setBelowMinAction] = useState('proceed'); // 'proceed' | 'cancel'
  const [belowMinNote, setBelowMinNote] = useState('');

  // Image Carousel active index inside detail modal
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [showQRModal, setShowQRModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  // Detailed event data (loaded when clicked)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Student QR Attendance Scanner States
  const [isScanningStudent, setIsScanningStudent] = useState(false);
  const [scanNotice, setScanNotice] = useState('');
  const qrVideoRef = useRef(null);
  const qrStreamRef = useRef(null);
  const qrDetectorRef = useRef(null);
  const qrLoopFrameRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => () => {
    if (qrLoopFrameRef.current) {
      window.cancelAnimationFrame(qrLoopFrameRef.current);
    }
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }
  }, []);

  const stopStudentScanner = () => {
    if (qrLoopFrameRef.current) {
      window.cancelAnimationFrame(qrLoopFrameRef.current);
      qrLoopFrameRef.current = null;
    }
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
    setIsScanningStudent(false);
  };

  const startStudentScanner = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanNotice('Trình duyệt chưa hỗ trợ truy cập camera.');
      return;
    }

    try {
      setScanNotice('Đang khởi động camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      qrStreamRef.current = stream;
      setIsScanningStudent(true);
      setScanNotice('Hãy đưa QR code của Sinh viên trước camera.');

      const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
      const BarcodeDetectorConstructor = hasBarcodeDetector ? window.BarcodeDetector : null;
      
      if (BarcodeDetectorConstructor) {
        qrDetectorRef.current = new BarcodeDetectorConstructor({ formats: ['qr_code'] });
      }

      let lastScannedCode = '';
      let coolDownActive = false;

      // Create offscreen canvas for jsQR fallback if no native detector
      let canvas = null;
      let canvasContext = null;
      if (!qrDetectorRef.current) {
        canvas = document.createElement('canvas');
        canvasContext = canvas.getContext('2d');
      }

      // Wait for React to render the video element in DOM before binding and starting play
      setTimeout(() => {
        if (!qrVideoRef.current) {
          setScanNotice('Không tìm thấy phần tử hiển thị video.');
          return;
        }

        qrVideoRef.current.srcObject = stream;
        qrVideoRef.current.play()
          .then(() => {
            const scanFrame = async () => {
              if (!qrVideoRef.current || !qrStreamRef.current) {
                return;
              }

              try {
                const video = qrVideoRef.current;
                
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                  let qrCodeValue = null;

                  if (qrDetectorRef.current) {
                    const barcodes = await qrDetectorRef.current.detect(video);
                    if (barcodes.length > 0 && barcodes[0].rawValue) {
                      qrCodeValue = barcodes[0].rawValue;
                    }
                  } else if (canvasContext && canvas) {
                    // jsQR fallback decoding
                    const width = video.videoWidth;
                    const height = video.videoHeight;
                    canvas.width = width;
                    canvas.height = height;
                    canvasContext.drawImage(video, 0, 0, width, height);
                    const imageData = canvasContext.getImageData(0, 0, width, height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: 'dontInvert',
                    });
                    if (code) {
                      qrCodeValue = code.data;
                    }
                  }

                  if (qrCodeValue && !coolDownActive) {
                    if (qrCodeValue !== lastScannedCode) {
                      lastScannedCode = qrCodeValue;
                      coolDownActive = true;
                      
                      // Trigger backend check-in!
                      await handleCheckInStudentQR(qrCodeValue);
                      
                      // Cool down for 3 seconds before allowing scanning the same or another code
                      scanTimerRef.current = setTimeout(() => {
                        coolDownActive = false;
                        lastScannedCode = '';
                      }, 3000);
                    }
                  }
                }
              } catch (err) {
                console.error('QR scanner error:', err);
              }

              qrLoopFrameRef.current = window.requestAnimationFrame(scanFrame);
            };

            qrLoopFrameRef.current = window.requestAnimationFrame(scanFrame);
          })
          .catch((err) => {
            console.error('Error starting video play:', err);
            setScanNotice('Không thể khởi động luồng video từ camera.');
          });
      }, 150);
    } catch (err) {
      setScanNotice('Không thể truy cập camera. Vui lòng cấp quyền camera.');
      stopStudentScanner();
    }
  };

  const handleCheckInStudentQR = async (studentQrCode) => {
    try {
      setScanNotice('Đang đối chiếu dữ liệu...');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${selectedEventId}/attendance/scan-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentQrCode })
      });

      const data = await response.json();
      if (!response.ok) {
        setScanNotice(`Lỗi: ${data.message || 'Điểm danh thất bại'}`);
      } else {
        setScanNotice(data.message || 'Điểm danh thành công!');
        // Update local slot registrations or count
        fetchEvents();
      }
    } catch (err) {
      setScanNotice('Lỗi kết nối máy chủ');
    }
  };

  // Fetch all events created by this Lien Chi
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

  useEffect(() => {
    fetchEvents();
  }, [user.fullName]);

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

  const filters = ['Tất cả', 'Mở đăng ký', 'Đang diễn ra', 'Đã kết thúc'];

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const matchSearch = !search || event.title.toLowerCase().includes(search.toLowerCase());
      const translated = translateStatus(event.status);
      const matchFilter = activeFilter === 'Tất cả' || translated === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [events, search, activeFilter]);

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
      // Refresh list
      fetchEvents();
      setSelectedEventId('');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleBelowMinDecision = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${selectedEventId}/below-min`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: belowMinAction,
          note: belowMinNote
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi giải quyết số lượng tối thiểu');

      setNotice('Đã cập nhật quyết định giải quyết số lượng tối thiểu thành công.');
      setShowBelowMinModal(false);
      setBelowMinNote('');
      fetchEvents();
      setSelectedEventId('');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleToggleQR = async (active) => {
    try {
      const token = localStorage.getItem('token');
      // DUT default coordinates
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
      // Update selectedEvent and list locally
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
    <LienChiLayout
      currentPath="/lien-chi/events/manage"
      title="Sự kiện của tôi"
      subtitle="Quản lý vòng đời sự kiện, cập nhật quyết định số lượng tối thiểu và xem đánh giá thực tế."
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
                placeholder="Tìm kiếm sự kiện theo tên..."
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
              {visibleEvents.map((event) => {
                const coverImage = event.images?.find(img => img.isCover === 1) || event.images?.[0];
                return (
                  <motion.button
                    key={event.id}
                    type="button"
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full rounded-[28px] border p-4 text-left transition-all ${selectedEventId === event.id ? 'border-[#88b2ef] bg-[#eef6ff] shadow-sm' : 'border-[#dce8f5] bg-white'
                      }`}
                  >
                    <div className="flex gap-4">
                      {coverImage ? (
                        <img src={coverImage.imageUrl} alt={event.title} className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-sm" />
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">Không có ảnh</div>
                      )}
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-lg font-black text-[#132b57]" title={event.title}>{event.title}</p>
                        <p className="truncate text-sm text-slate-500">{new Date(event.plannedStartDate).toLocaleString('vi-VN')} • {event.locationName}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{event.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${statusTone(event.status)}`}>{translateStatus(event.status)}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Đăng ký: {event.currentSlots} / {event.maxParticipants || '∞'}</span>
                          {event.minParticipants && (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Tối thiểu: {event.minParticipants}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              {visibleEvents.length === 0 && <p className="text-center text-sm text-slate-500 py-4">Không tìm thấy sự kiện phù hợp bộ lọc.</p>}
            </div>
          </section>
        </div>
      )}

      {/* ===== DETAIL MODAL OVERLAY ===== */}
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
              {/* Close */}
              <button onClick={() => { setSelectedEventId(''); setNotice(''); }} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 z-10">
                <X className="h-5 w-5" />
              </button>

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader className="h-8 w-8 animate-spin text-[#1747a6]" />
                  <p className="mt-4 text-slate-600">Đang tải chi tiết sự kiện...</p>
                </div>
              ) : selectedEvent ? (
                <>
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7eff8] pb-5 pr-10">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Chi tiết quản lý sự kiện</p>
                      <h2 className="mt-2 text-2xl md:text-3xl font-black text-[#132b57]">{selectedEvent.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Người tạo: {selectedEvent.creator?.name || 'N/A'}
                        {selectedEvent.leader?.name && ` | Người chủ trì: ${selectedEvent.leader.name}`}
                      </p>
                    </div>
                    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedEvent.status)}`}>{translateStatus(selectedEvent.status)}</span>
                  </div>

                  {/* Multiple Cover Image Carousel */}
                  {selectedEvent.images && selectedEvent.images.length > 0 && (
                    <div className="mt-5 relative bg-slate-900 rounded-3xl overflow-hidden shadow-md group">
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

                      {/* Navigation buttons */}
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

                          {/* Indicator dots */}
                          <div className="absolute top-4 right-4 flex gap-1 bg-black/50 px-2 py-1 rounded-full">
                            {selectedEvent.images.map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Info cards */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                      <Users className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Đăng ký</p>
                        <p className="font-semibold text-slate-700 text-sm">{selectedEvent.currentSlots} / {selectedEvent.maxParticipants || '∞'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                      <Tag className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Danh mục</p>
                        <p className="font-semibold text-slate-700 text-sm truncate max-w-[120px]">{selectedEvent.category || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                      <Clock className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Thời gian dự kiến</p>
                        <p className="font-semibold text-slate-700 text-[10px] leading-tight">
                          {new Date(selectedEvent.plannedStartDate).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6faff] p-4">
                      <MapPin className="h-5 w-5 text-[#1747a6]" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Địa điểm</p>
                        <p className="font-semibold text-slate-700 text-xs truncate max-w-[120px]">{selectedEvent.locationName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="mt-4">
                      <p className="mb-1 text-sm font-bold text-[#132b57]">Mô tả sự kiện</p>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{selectedEvent.description}</div>
                    </div>
                  )}

                  {/* Documents attachment section */}
                  {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-bold text-[#132b57]">Tài liệu đính kèm ({selectedEvent.documents.length})</p>
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
                              <p className="text-xs font-semibold text-slate-700 truncate">{doc.fileName}</p>
                              <p className="text-[10px] text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB • {doc.fileType?.toUpperCase()}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* revision Message / rejection reason */}
                  {selectedEvent.status === 'revision_required' && selectedEvent.revisionMessage && (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-center gap-2 text-rose-700 mb-1 font-bold text-sm">
                        <AlertTriangle className="h-5 w-5" />
                        ĐOÀN TRƯỜNG YÊU CẦU CHỈNH SỬA
                      </div>
                      <p className="text-sm text-rose-900 leading-relaxed">{selectedEvent.revisionMessage}</p>
                      {selectedEvent.revisionDeadline && (
                        <p className="mt-2 text-xs font-semibold text-rose-700">Hạn chỉnh sửa: {new Date(selectedEvent.revisionDeadline).toLocaleString('vi-VN')}</p>
                      )}
                    </div>
                  )}

                  {selectedEvent.status === 'cancelled' && selectedEvent.rejectionReason && (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">LÝ DO TỪ CHỐI DUYỆT</p>
                      <p className="mt-2 text-sm text-rose-900 leading-relaxed">{selectedEvent.rejectionReason}</p>
                    </div>
                  )}

                  {selectedEvent.belowMinNote && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">XỬ LÝ DƯỚI TỐI THIỂU</p>
                      <p className="mt-1 text-sm text-amber-900 leading-relaxed font-medium">Quyết định: {selectedEvent.belowMinAction === 'proceed' ? 'Tiếp tục tổ chức' : 'Hủy bỏ'}</p>
                      <p className="mt-1 text-sm text-slate-600">Ghi chú: {selectedEvent.belowMinNote}</p>
                    </div>
                  )}

                  {selectedEvent.approvals && selectedEvent.approvals.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-[#e4effc] bg-[#f8fbff] p-5">
                      <div className="mb-3 flex items-center gap-2 text-[#132b57]">
                        <MessageSquare className="h-5 w-5 text-[#1747a6]" />
                        <p className="font-bold">Lịch sử duyệt sự kiện</p>
                      </div>
                      <div className="space-y-2">
                        {[...selectedEvent.approvals]
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((approval) => (
                            <div key={approval.id} className="rounded-xl border border-slate-100 bg-white p-3 text-xs">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-slate-700">Đoàn trường: {approval.approver?.name || 'Admin'}</p>
                                  <p className="mt-1 font-mono text-[10px] text-slate-400">
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
                              {approval.revisionDeadline && (
                                <p className="mt-2 text-[10px] font-bold text-orange-700">
                                  Hạn chỉnh sửa: {new Date(approval.revisionDeadline).toLocaleString('vi-VN')}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline 2 level display */}
                  {selectedEvent.timelines && selectedEvent.timelines.length > 0 && (
                    <div className="mt-5 rounded-2xl bg-[#f8fbff] p-5 border border-[#e4effc]">
                      <div className="flex items-center gap-2 text-[#132b57] mb-3">
                        <CalendarClock className="h-5 w-5 text-[#1747a6]" />
                        <p className="font-bold">Các giai đoạn & Mốc chi tiết</p>
                      </div>
                      <div className="space-y-4">
                        {selectedEvent.timelines.map((phase, idx) => (
                          <div key={phase.id} className="border-l-2 border-[#1747a6]/20 pl-4 relative">
                            {/* Dot indicator */}
                            <div className="absolute w-3 h-3 rounded-full bg-[#1747a6] -left-[7px] top-1.5" />

                            <div className="flex items-baseline justify-between flex-wrap gap-2">
                              <h4 className="font-bold text-slate-800 text-sm">Giai đoạn {idx + 1}: {phase.title}</h4>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                {new Date(phase.startDate).toLocaleDateString('vi-VN')} - {new Date(phase.endDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            {phase.description && <p className="text-xs text-slate-500 mt-1">{phase.description}</p>}

                            {/* Detailed milestones under phase */}
                            {phase.details && phase.details.length > 0 && (
                              <div className="mt-2 space-y-2 bg-white rounded-xl p-3 border border-slate-100">
                                {phase.details.map(milestone => (
                                  <div key={milestone.id} className="text-xs border-b border-dashed border-slate-100 last:border-0 pb-1.5 last:pb-0 pt-1.5 first:pt-0">
                                    <div className="flex justify-between font-semibold text-slate-700">
                                      <span>{milestone.title}</span>
                                      <span className="text-slate-400 font-mono">{new Date(milestone.dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {milestone.content && <p className="text-slate-500 mt-0.5 font-normal">{milestone.content}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {notice && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

                  {/* Action buttons footer */}
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e7eff8] pt-5">
                    {['draft', 'revision_required'].includes(selectedEvent.status) && (
                      <button type="button" onClick={() => handlePublish(selectedEvent.id)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition-all hover:bg-emerald-700 shadow-sm">
                        <CheckCircle2 className="h-5 w-5" />
                        Gửi duyệt
                      </button>
                    )}

                    {['draft', 'revision_required'].includes(selectedEvent.status) && (
                      <button type="button" onClick={() => navigate(`/lien-chi/events/manage/edit/${selectedEvent.id}`)} className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8] shadow-sm">
                        <PencilLine className="h-5 w-5" />
                        Sửa sự kiện
                      </button>
                    )}

                    {selectedEvent.status === 'below_minimum' && (
                      <button type="button" onClick={() => { setBelowMinAction('proceed'); setShowBelowMinModal(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white transition-all hover:bg-amber-600 shadow-sm">
                        <AlertTriangle className="h-5 w-5" />
                        Giải quyết Dưới tối thiểu
                      </button>
                    )}

                    {['open_registration', 'ongoing', 'completed', 'ended'].includes(selectedEvent.status) && (
                      <>
                        <button type="button" onClick={() => setShowQRModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition-all hover:bg-indigo-700">
                          <MapPin className="h-5 w-5" />
                          Điểm danh GPS
                        </button>
                        <button type="button" onClick={handleViewFeedbacks} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 font-semibold text-indigo-700 transition-all hover:bg-indigo-100">
                          <MessageSquare className="h-5 w-5" />
                          Xem Đánh giá ({selectedEvent.feedbacks?.length || 0})
                        </button>
                      </>
                    )}

                    <button 
                      type="button" 
                      onClick={() => navigate(`/lien-chi/registrations?eventId=${selectedEvent.id}`)} 
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]"
                    >
                      Danh sách SV đăng ký
                    </button>
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Below Minimum Decision Modal */}
      {showBelowMinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl relative">
            <h3 className="text-xl font-black text-[#132b57] mb-1">Quyết định tổ chức sự kiện</h3>
            <p className="text-xs text-slate-500 mb-4">Sự kiện hiện không đạt số lượng tối thiểu ({selectedEvent?.currentSlots}/{selectedEvent?.minParticipants})</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setBelowMinAction('proceed')}
                className={`py-3 rounded-xl font-bold transition-all border text-center ${belowMinAction === 'proceed' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Tiếp tục tổ chức
              </button>
              <button
                type="button"
                onClick={() => setBelowMinAction('cancel')}
                className={`py-3 rounded-xl font-bold transition-all border text-center ${belowMinAction === 'cancel' ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Hủy bỏ sự kiện
              </button>
            </div>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú lý do quyết định:</span>
              <textarea
                rows="3"
                value={belowMinNote}
                onChange={(e) => setBelowMinNote(e.target.value)}
                placeholder="Nhập lý do chi tiết gửi Đoàn trường..."
                className="w-full rounded-xl border border-[#dce8f5] px-3 py-2 outline-none focus:border-[#1f5dcc] text-sm"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowBelowMinModal(false)} className="flex-1 rounded-2xl border bg-white py-3 font-semibold text-slate-600 hover:bg-slate-50">Quay lại</button>
              <button onClick={handleBelowMinDecision} className="flex-1 rounded-2xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Modal */}
      {showQRModal && selectedEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl text-center relative max-h-[95vh] overflow-y-auto scrollbar-hide">
            <button onClick={() => { stopStudentScanner(); setShowQRModal(false); }} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-black text-[#132b57] mb-2">Điểm danh Sự kiện</h3>
            <p className="text-slate-500 text-sm mb-4">Sự kiện: {selectedEvent.title}</p>

            <div className="text-left bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 text-xs space-y-1.5 text-slate-600">
              <p><strong>Địa điểm ghim:</strong> {selectedEvent.locationName || 'Chưa cấu hình'}</p>
              <p><strong>Bán kính tự phục vụ:</strong> {selectedEvent.attendanceRadius ? `${selectedEvent.attendanceRadius}m` : 'N/A'}</p>
            </div>

            {selectedEvent.qrActive ? (
              <div className="flex flex-col items-center">
                <div className="text-emerald-600 font-semibold mb-4 flex items-center gap-2 text-sm justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div> 
                  Phiên điểm danh đang HOẠT ĐỘNG
                </div>

                {/* Video Scanner block */}
                {isScanningStudent ? (
                  <div className="w-full mb-4 relative rounded-2xl overflow-hidden border border-[#dce8f5] shadow-inner bg-black">
                    <video
                      ref={qrVideoRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-40 border-2 border-indigo-400 border-dashed rounded-lg animate-pulse"></div>
                    </div>
                    <button 
                      type="button" 
                      onClick={stopStudentScanner} 
                      className="absolute bottom-3 right-3 bg-rose-600 text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-rose-700 shadow"
                    >
                      Dừng quét camera
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={startStudentScanner} 
                    className="w-full mb-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3.5 font-bold text-white shadow-md transition-colors"
                  >
                    <QrCode className="h-5 w-5" />
                    Mở Camera quét QR Sinh viên
                  </button>
                )}

                {scanNotice && (
                  <div className={`w-full mb-4 rounded-xl px-4 py-3 text-xs font-semibold leading-relaxed border ${
                    scanNotice.startsWith('Lỗi') || scanNotice.startsWith('Không')
                      ? 'bg-rose-50 border-rose-200 text-rose-700' 
                      : scanNotice.startsWith('Điểm danh thành công')
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}>
                    {scanNotice}
                  </div>
                )}

                <button onClick={() => { stopStudentScanner(); handleToggleQR(false); }} className="w-full rounded-2xl bg-rose-100 text-rose-700 py-3 font-bold hover:bg-rose-200 transition-colors mt-2">Đóng phiên điểm danh</button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm mb-6">Mở phiên để sinh viên có thể tự điểm danh bằng GPS hoặc bạn có thể quét QR cá nhân của sinh viên bằng camera laptop.</p>
                <button onClick={() => handleToggleQR(true)} className="w-full rounded-2xl bg-indigo-600 text-white py-3 font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Mở phiên điểm danh</button>
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
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`text-lg ${star <= fb.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {/* Changed fb.content to fb.comment */}
                    <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-100">{fb.comment || 'Không có bình luận.'}</p>
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
