import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Filter, LogOut, MapPin, Navigation, QrCode, Search, Sparkles, XCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { defaultRegisteredEventIds, STORAGE_ATTENDANCE_CHECKINS_KEY, STORAGE_ATTENDANCE_WINDOW_KEY, STORAGE_REGISTERED_EVENTS_KEY } from '../../shared/student/studentData';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(pointA, pointB) {
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);

  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function tagTone(tag) {
  const tones = {
    'Ngoài trời': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Điểm danh QR': 'bg-blue-100 text-blue-700 border-blue-200',
    'Có minh chứng': 'bg-violet-100 text-violet-700 border-violet-200',
    'Kỹ năng': 'bg-amber-100 text-amber-700 border-amber-200',
    'Có chứng nhận': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Giấy chứng nhận': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Ưu tiên sinh viên năm cuối': 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return tones[tag] || 'bg-slate-100 text-slate-700 border-slate-200';
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 140, damping: 18 },
  },
};

function EventStatus({ value }) {
  const tone =
    value === 'Đang mở đăng ký'
      ? 'bg-emerald-100 text-emerald-700'
      : value === 'Đã đăng ký'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{value}</span>;
}

function getInitialRegisteredEvents() {
  if (typeof window === 'undefined') {
    return defaultRegisteredEventIds;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_REGISTERED_EVENTS_KEY);
    return rawValue ? JSON.parse(rawValue) : defaultRegisteredEventIds;
  } catch {
    return defaultRegisteredEventIds;
  }
}

function getInitialAttendanceCheckins() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_ATTENDANCE_CHECKINS_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch {
    return {};
  }
}

function getInitialAttendanceWindowConfig() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_ATTENDANCE_WINDOW_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function parseEventTimeRange(timeLabel) {
  const pattern = /^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}),\s*(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = timeLabel.match(pattern);

  if (!match) {
    return null;
  }

  const [, startClock, endClock, day, month, year] = match;
  const [startHour, startMinute] = startClock.split(':').map(Number);
  const [endHour, endMinute] = endClock.split(':').map(Number);

  const startAt = new Date(Number(year), Number(month) - 1, Number(day), startHour, startMinute);
  const endAt = new Date(Number(year), Number(month) - 1, Number(day), endHour, endMinute);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return null;
  }

  return { startAt, endAt };
}

function buildAttendanceGate(event, attendanceWindowConfig) {
  if (event.qrActive) {
    return {
      canCheckIn: true,
      message: 'Mã QR điểm danh đang mở, bạn có thể điểm danh ngay!',
    };
  }

  const now = new Date();
  
  let isEventInProgress = false;
  if (event.startAt && event.endAt) {
    isEventInProgress = now >= event.startAt && now <= event.endAt;
  } else if (event.time) {
    const eventRange = parseEventTimeRange(event.time);
    isEventInProgress = eventRange ? now >= eventRange.startAt && now <= eventRange.endAt : false;
  }

  const isAdminWindowEnabled = Boolean(attendanceWindowConfig?.enabled);
  const adminStartAt = attendanceWindowConfig?.startAt ? new Date(attendanceWindowConfig.startAt) : null;
  const adminEndAt = attendanceWindowConfig?.endAt ? new Date(attendanceWindowConfig.endAt) : null;
  const hasValidAdminRange =
    adminStartAt instanceof Date &&
    adminEndAt instanceof Date &&
    !Number.isNaN(adminStartAt.getTime()) &&
    !Number.isNaN(adminEndAt.getTime()) &&
    adminStartAt < adminEndAt;
  const isAdminWindowActive = isAdminWindowEnabled && hasValidAdminRange && now >= adminStartAt && now <= adminEndAt;

  if (isEventInProgress || isAdminWindowActive) {
    return {
      canCheckIn: true,
      message: isEventInProgress ? 'Sự kiện đang diễn ra: có thể điểm danh.' : 'Admin đang mở cửa sổ điểm danh.',
    };
  }

  if (isAdminWindowEnabled && !hasValidAdminRange) {
    return {
      canCheckIn: false,
      message: 'Khung giờ điểm danh do admin cấu hình chưa hợp lệ.',
    };
  }

  return {
    canCheckIn: false,
    message: 'Chỉ điểm danh khi sự kiện đang diễn ra hoặc mã QR được mở.',
  };
}

function normalizeAudienceText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(khoa|lien chi doan|lien chi|doan khoa)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStudentEventStatus(status) {
  if (status === 'open_registration') return 'Đang mở đăng ký';
  if (status === 'ongoing') return 'Đang tham gia';
  if (status === 'ended' || status === 'completed') return 'Đã kết thúc';
  return 'Sắp diễn ra';
}

function isPublicEvent(event) {
  return event.createdByRole === 'admin' || normalizeAudienceText(event.creator?.faculty).includes('doan truong');
}

function isEventForStudentFaculty(event, studentFaculty) {
  if (isPublicEvent(event)) return true;
  const creatorFaculty = normalizeAudienceText(event.creator?.faculty || event.creator?.department);
  return Boolean(studentFaculty && creatorFaculty && creatorFaculty === studentFaculty);
}

export default function StudentEventsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);
  const studentFaculty = normalizeAudienceText(user.faculty || user.department);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [attendanceCheckins, setAttendanceCheckins] = useState(getInitialAttendanceCheckins);
  const [openedAttendanceEventId, setOpenedAttendanceEventId] = useState('');
  const [isCheckingGps, setIsCheckingGps] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [attendanceWindowConfig, setAttendanceWindowConfig] = useState(getInitialAttendanceWindowConfig);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const toastTimerRef = useRef(null);
  const qrVideoRef = useRef(null);
  const qrStreamRef = useRef(null);
  const qrDetectorRef = useRef(null);
  const qrLoopFrameRef = useRef(null);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    navigate('/login');
  };

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_ATTENDANCE_CHECKINS_KEY, JSON.stringify(attendanceCheckins));
  }, [attendanceCheckins]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    if (qrLoopFrameRef.current) {
      window.cancelAnimationFrame(qrLoopFrameRef.current);
    }
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    const syncAttendanceWindowConfig = () => {
      setAttendanceWindowConfig(getInitialAttendanceWindowConfig());
    };

    window.addEventListener('focus', syncAttendanceWindowConfig);
    window.addEventListener('storage', syncAttendanceWindowConfig);

    return () => {
      window.removeEventListener('focus', syncAttendanceWindowConfig);
      window.removeEventListener('storage', syncAttendanceWindowConfig);
    };
  }, []);

  const filters = ['Tất cả', 'Đang mở đăng ký', 'Đã đăng ký', 'Sắp diễn ra'];

  const [dbEvents, setDbEvents] = useState([]);

  useEffect(() => {
    const fetchDbEvents = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch('/api/events', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          const approvedEvents = data.events.filter(e => e.status === 'approved' || e.status === 'ongoing');
          
          const formattedEvents = approvedEvents.map(e => {
            const formatTime = (iso) => {
              if (!iso) return '';
              const d = new Date(iso);
              const hh = String(d.getHours()).padStart(2, '0');
              const mm = String(d.getMinutes()).padStart(2, '0');
              const DD = String(d.getDate()).padStart(2, '0');
              const MM = String(d.getMonth() + 1).padStart(2, '0');
              const YYYY = d.getFullYear();
              return `${hh}:${mm}, ${DD}/${MM}/${YYYY}`;
            };
            const timeRange = `${formatTime(e.startTime || e.startDate)} - ${formatTime(e.endTime || e.endDate)}`;

            return {
              id: `db-${e.id}`,
              realId: e.id,
              title: e.title,
              organizer: e.creator?.name || 'Liên chi Đoàn',
              category: e.category || 'Hoạt động',
              time: timeRange,
              startAt: e.startTime ? new Date(e.startTime) : (e.startDate ? new Date(e.startDate) : null),
              endAt: e.endTime ? new Date(e.endTime) : (e.endDate ? new Date(e.endDate) : null),
              qrActive: Boolean(e.qrActive),
              location: e.location,
              points: '+5 ĐRL',
              slots: e.maxSlots || e.maxParticipants || e.capacity || 100,
              registered: e.currentSlots || 0,
              enrolled: e.isRegistered || false,
              status: e.status === 'ongoing' ? 'Sắp diễn ra' : 'Đang mở đăng ký',
              description: e.description,
              tags: e.tags || ['Cập nhật mới'],
              accent: 'from-blue-500 to-indigo-500',
              attendanceConfig: { gpsCenter: { lat: 16.074061, lng: 108.150720 }, allowedRadiusMeters: 100, qrValue: `BKYOUTH-${e.id}` },
              imageUrl: e.images && e.images.length > 0 ? e.images[0].imageUrl : null,
              communityPoints: e.communityPoints || 0,
            };
          });
          
          setDbEvents(formattedEvents);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchDbEventsRef.current = fetchDbEvents;
    fetchDbEvents();
  }, []);

  const visibleEvents = useMemo(() => {
    const allEvents = [...dbEvents];
    return allEvents
      .map((event) => ({
        ...event,
        attendance: attendanceCheckins[event.id] || null,
        attendanceGate: buildAttendanceGate(event, attendanceWindowConfig),
      }))
      .filter((event) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          event.title.toLowerCase().includes(normalizedSearch) ||
          event.organizer.toLowerCase().includes(normalizedSearch) ||
          event.category.toLowerCase().includes(normalizedSearch);

        const matchesFilter =
          activeFilter === 'Tất cả' ||
          (activeFilter === 'Đã đăng ký' && event.enrolled) ||
          (activeFilter !== 'Đã đăng ký' && event.status === activeFilter);

        return matchesSearch && matchesFilter;
      });
  }, [dbEvents, activeFilter, search, attendanceCheckins, attendanceWindowConfig]);

  const stopQrScanner = () => {
    if (qrLoopFrameRef.current) {
      window.cancelAnimationFrame(qrLoopFrameRef.current);
      qrLoopFrameRef.current = null;
    }
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
    }
    setIsScanningQr(false);
  };

  const startQrScanner = async () => {
    const BarcodeDetectorConstructor = window.BarcodeDetector;
    if (!BarcodeDetectorConstructor || !navigator.mediaDevices?.getUserMedia) {
      setFeedback('Trình duyệt chưa hỗ trợ quét camera. Vui lòng nhập mã QR thủ công.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      qrStreamRef.current = stream;
      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream;
        await qrVideoRef.current.play();
      }

      qrDetectorRef.current = new BarcodeDetectorConstructor({ formats: ['qr_code'] });
      setIsScanningQr(true);

      const scanFrame = async () => {
        if (!qrVideoRef.current || !qrDetectorRef.current) {
          return;
        }

        try {
          const barcodes = await qrDetectorRef.current.detect(qrVideoRef.current);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            setQrInput(barcodes[0].rawValue);
            stopQrScanner();
            return;
          }
        } catch {
          // No-op: keep scanning next frame.
        }

        qrLoopFrameRef.current = window.requestAnimationFrame(scanFrame);
      };

      qrLoopFrameRef.current = window.requestAnimationFrame(scanFrame);
    } catch {
      setFeedback('Không thể truy cập camera. Hãy kiểm tra quyền camera trên trình duyệt.');
      stopQrScanner();
    }
  };

  const saveAttendanceState = (eventId, payload) => {
    setAttendanceCheckins((current) => ({
      ...current,
      [eventId]: {
        ...(current[eventId] || {}),
        ...payload,
      },
    }));
  };

  const handleQRCheckIn = async (event) => {
    const submittedValue = qrInput.trim();

    if (!submittedValue) {
      setFeedback('Vui lòng nhập hoặc quét mã QR.');
      return;
    }

    if (!navigator.geolocation) {
      setFeedback('Thiết bị không hỗ trợ định vị GPS.');
      return;
    }

    setIsCheckingGps(true);
    setFeedback('Đang lấy vị trí GPS và điểm danh...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const token = localStorage.getItem('token');

          const response = await fetch(`/api/events/${event.realId}/attendance/qr`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              qrCode: submittedValue,
              latitude,
              longitude
            })
          });

          const data = await response.json();
          if (!response.ok) {
            setFeedback(data.message || 'Điểm danh thất bại');
          } else {
            setFeedback(`Điểm danh thành công: ${event.title}`);
            setQrInput('');
            setOpenedAttendanceEventId('');
            if (fetchDbEventsRef.current) {
              fetchDbEventsRef.current();
            }
          }
        } catch (error) {
          setFeedback('Lỗi kết nối máy chủ');
        } finally {
          setIsCheckingGps(false);
        }
      },
      () => {
        setFeedback('Không lấy được vị trí. Vui lòng bật GPS và cho phép quyền truy cập vị trí.');
        setIsCheckingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackInput.trim()) {
      setFeedback('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${selectedEventForFeedback.realId}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: feedbackRating,
          content: feedbackInput
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedback(data.message || 'Lỗi khi gửi đánh giá');
      } else {
        setFeedback('Gửi đánh giá thành công! Cảm ơn bạn.');
        setShowFeedbackModal(false);
        setFeedbackInput('');
        setFeedbackRating(5);
        if (fetchDbEventsRef.current) {
          fetchDbEventsRef.current();
        }
      }
    } catch (err) {
      setFeedback('Lỗi kết nối máy chủ');
    }
  };

  const fetchDbEventsRef = useRef(null); // to re-fetch events

  const toggleRegistration = async (eventId, eventTitle, isEnrolled, realId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const endpoint = isEnrolled ? `/api/events/${realId}/cancel-registration` : `/api/events/${realId}/register`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedback(data.message || 'Có lỗi xảy ra');
      } else {
        setFeedback(isEnrolled ? `Bạn đã hủy đăng ký: ${eventTitle}` : `Đăng ký thành công: ${eventTitle}`);
        // Re-fetch events to get updated slots and registration status
        if (fetchDbEventsRef.current) {
          fetchDbEventsRef.current();
        }
      }
    } catch (err) {
      setFeedback('Lỗi kết nối máy chủ');
    }
    
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setFeedback(''), 3000);
  };

  const toggleAttendancePanel = (eventId) => {
    const selectedEvent = visibleEvents.find((event) => event.id === eventId);
    if (selectedEvent && !selectedEvent.attendanceGate.canCheckIn) {
      setFeedback(selectedEvent.attendanceGate.message);
      return;
    }

    if (openedAttendanceEventId === eventId) {
      setOpenedAttendanceEventId('');
      setQrInput('');
      stopQrScanner();
      return;
    }

    setOpenedAttendanceEventId(eventId);
    setQrInput('');
    stopQrScanner();
  };

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="app-sidebar hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Không gian sinh viên</p>
            </div>
          </div>

          <Link to="/sinhvien/profile" className="profile-user-chip mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md hover:bg-white/15 transition-all block text-white no-underline w-full min-w-0">
            <div className="flex items-center gap-3 w-full min-w-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="profile-user-avatar h-14 w-14 rounded-2xl border border-white/25 object-cover" />
              ) : (
                <div className="profile-user-avatar flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-black text-white">
                  {userInitials}
                </div>
              )}
              <div className="profile-user-meta">
                <p className="profile-user-name text-base font-bold text-white">{user.fullName}</p>
                <p className="profile-user-subtitle text-sm text-blue-100/85">MSSV: {user.studentId}</p>
              </div>
            </div>
          </Link>

          <nav className="space-y-2">
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Sự kiện của tôi</div>
            <Link to="/sinhvien/profile" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Hồ sơ cá nhân
            </Link>
            <Link to="/sinhvien/chat" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Chat sinh viên
            </Link>
            <Link to="/sinhvien/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
          </nav>

          <div className="mt-auto pt-6">
            <button
              onClick={handleLogout}
              className="app-logout-button flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main ref={mainRef} className="app-main flex-1">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Sự kiện dành cho sinh viên</h1>
                <p className="mt-1 text-slate-500">Khám phá hoạt động nổi bật và đăng ký tham gia trực tiếp trên hệ thống.</p>
              </div>
              <Link
                to="/sinhvien/profile"
                className="profile-header-user rounded-[24px] border border-[#dce8f5] bg-[#f7fbff] px-4 py-3 hover:bg-[#eef6ff] transition-all block text-slate-800 no-underline"
                aria-label="Mở trang chỉnh sửa thông tin cá nhân"
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="profile-user-avatar h-12 w-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="profile-user-avatar flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] text-sm font-black text-white">
                      {userInitials}
                    </div>
                  )}
                  <div className="profile-user-meta">
                    <p className="profile-user-name font-bold text-[#132b57]">{user.fullName}</p>
                    <p className="profile-user-subtitle text-sm text-slate-500">MSSV: {user.studentId}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.96 }}
                  className="mb-5 flex items-center gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">{feedback}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <motion.div whileHover={{ y: -3 }} className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 transition-all focus-within:border-[#1f5dcc] focus-within:shadow-[0_0_0_4px_rgba(31,93,204,0.08)]">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Tìm theo tên sự kiện, đơn vị tổ chức hoặc chủ đề"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {filters.map((filter) => (
                    <motion.button
                      key={filter}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        activeFilter === filter
                          ? 'bg-[#1747a6] text-white shadow-[0_10px_24px_rgba(23,71,166,0.24)]'
                          : 'border border-[#dce8f5] bg-white text-slate-600 hover:border-[#9ec0f0] hover:bg-[#f8fbff]'
                      }`}
                    >
                      {filter}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1747a6] via-[#4ba3ff] to-[#19c37d]" />
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.04, 1] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]"
                  >
                    <Sparkles className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Tình trạng hiện tại</p>
                    <h2 className="mt-1 text-2xl font-black text-[#132b57]">{dbEvents.filter(e => e.enrolled).length} sự kiện đã đăng ký</h2>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Theo dõi các sự kiện đang mở, các sự kiện đã đăng ký và thao tác điểm danh ngay trong danh sách bên dưới.
                </p>
              </motion.div>
            </div>

            <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-5">
              {visibleEvents.map((event) => {
                const usedSlots = event.registered;
                const displayStatus = event.enrolled ? 'Đã đăng ký' : event.status;
                const progress = Math.min((usedSlots / event.slots) * 100, 100);
                const checkinState = event.attendance || {};
                const isCheckedIn = event.userRegistrationStatus === 'attended' || Boolean(checkinState.gpsVerified && checkinState.qrVerified && checkinState.checkedInAt);
                const showAttendancePanel = openedAttendanceEventId === event.id && !isCheckedIn;

                return (
                  <motion.article
                    key={event.id}
                    variants={itemVariants}
                    whileHover={{ y: -6 }}
                    className="student-event-card relative overflow-hidden rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${event.accent}`} />
                    <div className="absolute -right-12 top-8 h-28 w-28 rounded-full bg-[#eff6ff] blur-2xl" />

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <EventStatus value={displayStatus} />
                          <span className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-bold text-[#1f5dcc]">{event.points}</span>
                          {event.communityPoints > 0 && (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">+{event.communityPoints} Điểm cộng đồng</span>
                          )}
                          <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-bold text-[#cb6d13]">{event.category}</span>
                        </div>

                        {event.imageUrl && (
                          <div className="mb-4 overflow-hidden rounded-2xl">
                            <img src={event.imageUrl} alt={event.title} className="h-44 w-full object-cover" />
                          </div>
                        )}
                        <h2 className="mt-4 text-2xl font-black text-[#132b57]">{event.title}</h2>
                        <p className="mt-2 text-sm font-semibold text-[#1f5dcc]">{event.organizer}</p>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{event.description}</p>

                        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-slate-400" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {event.tags.map((tag) => (
                            <motion.span
                              key={tag}
                              whileHover={{ y: -2 }}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${tagTone(tag)}`}
                            >
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      <div className="relative w-full overflow-hidden rounded-[24px] bg-[#f4f8ff] p-4 xl:w-[260px]">
                        <div className={`absolute inset-x-6 top-0 h-20 rounded-b-[30px] bg-gradient-to-b ${event.accent} opacity-10 blur-2xl`} />
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tình hình đăng ký</p>
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                          <span>{usedSlots} / {event.slots} sinh viên</span>
                          <motion.span key={usedSlots} initial={{ scale: 0.85, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="font-bold text-[#1747a6]">
                            {Math.round(progress)}%
                          </motion.span>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-3 rounded-full bg-gradient-to-r ${event.accent}`}
                          />
                        </div>

                        <div className="mt-5 grid gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleRegistration(event.id, event.title, event.enrolled, event.realId)}
                            disabled={!event.enrolled && event.registered >= event.slots}
                            className={`rounded-2xl px-4 py-3 font-bold text-white transition-all ${
                              event.enrolled
                                ? 'bg-[#d24c4c] shadow-[0_12px_24px_rgba(210,76,76,0.24)] hover:bg-[#bf3b3b]'
                                : event.registered >= event.slots
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-[#1747a6] shadow-[0_12px_24px_rgba(23,71,166,0.24)] hover:bg-[#205fd8]'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {event.enrolled && <CheckCircle2 className="h-4 w-4" />}
                              {event.enrolled ? 'Đã đăng ký (Nhấn để hủy)' : event.registered >= event.slots ? 'Đã đầy' : 'Đăng ký tham gia'}
                            </span>
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleAttendancePanel(event.id)}
                            disabled={!event.enrolled || isCheckedIn}
                            className={`rounded-2xl border px-4 py-3 font-semibold transition-all ${isCheckedIn ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-not-allowed opacity-90' : 'border-[#dce8f5] bg-white text-slate-600 hover:bg-[#f7fbff] disabled:cursor-not-allowed disabled:opacity-70'}`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {isCheckedIn ? <CheckCircle2 className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                              {!event.enrolled ? 'Đăng ký trước khi điểm danh' : isCheckedIn ? 'Đã điểm danh thành công' : 'Điểm danh GPS + QR'}
                            </span>
                          </motion.button>
                          
                          {['completed', 'ended', 'Đã kết thúc'].includes(event.status) && isCheckedIn && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => { setSelectedEventForFeedback(event); setShowFeedbackModal(true); }}
                              className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Gửi đánh giá sự kiện
                              </span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showAttendancePanel && event.enrolled && (
                        <motion.div
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 18 }}
                          className="mt-5 rounded-[24px] border border-[#dce8f5] bg-[#f8fbff] p-4"
                        >
                          <div className="flex flex-col gap-4">
                            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${event.attendanceGate.canCheckIn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                              {event.attendanceGate.message}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-lg font-black text-[#132b57]">Điểm danh sự kiện</h3>
                              {isCheckedIn ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Đã điểm danh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                  <Clock3 className="h-4 w-4" />
                                  Chờ điểm danh
                                </span>
                              )}
                            </div>

                            <div className="grid gap-3">
                              <div className="rounded-2xl border border-[#dce8f5] bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">ĐIỂM DANH (GPS + QR)</p>
                                <p className="mt-2 text-sm text-slate-600">Nhập mã QR do sự kiện cung cấp. Hệ thống sẽ tự động lấy vị trí GPS để xác minh bạn đang ở sự kiện.</p>
                                <div className="mt-3 flex flex-col gap-3">
                                  <input
                                    value={qrInput}
                                    onChange={(inputEvent) => setQrInput(inputEvent.target.value)}
                                    placeholder="Nhập mã QR..."
                                    className="w-full rounded-xl border border-[#dce8f5] bg-[#f8fbff] px-3 py-2 text-sm outline-none focus:border-[#1f5dcc]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleQRCheckIn(event)}
                                    disabled={isCheckingGps}
                                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-70 flex justify-center items-center gap-2"
                                  >
                                    {isCheckingGps ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Navigation className="h-4 w-4" />}
                                    {isCheckingGps ? 'Đang điểm danh...' : 'Điểm danh ngay'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isCheckedIn && (
                              <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Hoàn tất điểm danh lúc {new Date(checkinState.checkedInAt).toLocaleString('vi-VN')}
                              </p>
                            )}
                            {!isCheckedIn && (
                              <p className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                                <XCircle className="h-4 w-4" />
                                Cần hoàn thành đủ 2 bước GPS + QR để điểm danh thành công.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}

              {visibleEvents.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[28px] border border-dashed border-[#c6d7ea] bg-white px-6 py-10 text-center text-slate-500"
                >
                  Không tìm thấy sự kiện phù hợp với bộ lọc hiện tại.
                </motion.div>
              )}
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="mt-6 rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]"
                >
                  <Filter className="h-6 w-6" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-black text-[#132b57]">Lưu ý khi tham gia hoạt động</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    <li>Đăng ký thành công không đồng nghĩa với hoàn thành hoạt động. Bạn vẫn cần điểm danh theo hướng dẫn.</li>
                    <li>Nếu sự kiện yêu cầu minh chứng, hãy nộp đúng hạn để được cộng điểm rèn luyện.</li>
                    <li>Các sự kiện đã gần diễn ra có thể bị khóa chức năng hủy đăng ký theo quy định của đơn vị tổ chức.</li>
                  </ul>
                </div>
              </div>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
}
