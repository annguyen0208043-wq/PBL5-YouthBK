import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Filter, LogOut, MapPin, Navigation, QrCode, Search, Sparkles, XCircle, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'react-qr-code';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { defaultRegisteredEventIds, STORAGE_ATTENDANCE_CHECKINS_KEY, STORAGE_ATTENDANCE_WINDOW_KEY, STORAGE_REGISTERED_EVENTS_KEY } from '../../shared/student/studentData';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';
import NotificationBell from './NotificationBell';
import GPSAttendanceModal from './GPSAttendanceModal';

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
  if (event.rawStatus !== 'ongoing') {
    return {
      canCheckIn: false,
      message: 'Sự kiện chưa diễn ra hoặc đã kết thúc. Chỉ có thể điểm danh khi sự kiện đang diễn ra.',
    };
  }

  if (!event.qrActive) {
    return {
      canCheckIn: false,
      message: 'Liên chi đoàn chưa mở QR điểm danh cho sự kiện này.',
    };
  }

  return {
    canCheckIn: true,
    message: 'Mã QR điểm danh đang mở, bạn có thể điểm danh ngay!',
  };
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
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

function canCancelRegistration(event) {
  if (['ongoing', 'completed', 'ended'].includes(event.rawStatus)) {
    return { allowed: false, reason: 'Sự kiện đã diễn ra' };
  }
  // Check if registration deadline has passed
  if (event.registrationDeadline) {
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    if (now >= deadline) {
      return { allowed: false, reason: 'Hạn đăng ký đã hết' };
    }
  }
  
  return { allowed: true, reason: '' };
}

export default function StudentEventsPage({ embedded = false } = {}) {
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
  const [isAnonymousFeedback, setIsAnonymousFeedback] = useState(false);
  const [showPublicReviewsModal, setShowPublicReviewsModal] = useState(false);
  const [selectedEventForReviews, setSelectedEventForReviews] = useState(null);
  const [publicFeedbacks, setPublicFeedbacks] = useState([]);
  const [loadingPublicFeedbacks, setLoadingPublicFeedbacks] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [isTogglingEventId, setIsTogglingEventId] = useState(null);
  const [selectedQRCheckInEvent, setSelectedQRCheckInEvent] = useState(null);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [selectedGPSCheckInEvent, setSelectedGPSCheckInEvent] = useState(null);
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
  const displayFilters = ['Tất cả', 'Đang mở đăng ký', 'Đã đăng ký', 'Đang tham gia', 'Đã kết thúc'];
  const normalizedActiveFilter = displayFilters.includes(activeFilter) ? activeFilter : 'Tất cả';

  useEffect(() => {
    const fetchDbEvents = async () => {
      try {
        setIsLoadingEvents(true);
        setEventsError('');
        const token = localStorage.getItem('token') || '';
        const response = await fetch('/api/events', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Không thể tải danh sách sự kiện');
        }

        if (response.ok) {
          const approvedEvents = data.events
            .filter((event) => ['open_registration', 'ongoing', 'ended', 'completed'].includes(event.status))
            .filter((event) => isEventForStudentFaculty(event, studentFaculty));
          
          const newestOpenId = approvedEvents
            .filter((event) => event.status === 'open_registration')
            .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))[0]?.id;

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
            const startIso = e.actualStartDate || e.plannedStartDate || e.startTime || e.startDate;
            const endIso = e.actualEndDate || e.plannedEndDate || e.endTime || e.endDate;
            const timeRange = `${formatDateTime(startIso) || formatTime(startIso)} - ${formatDateTime(endIso) || formatTime(endIso)}`;
            const publicEvent = isPublicEvent(e);
            const coverImage = e.images?.find((image) => image.isCover === 1) || e.images?.[0];

            return {
              id: `db-${e.id}`,
              realId: e.id,
              title: e.title,
              time: timeRange,
              qrActive: Boolean(e.qrActive),
              slots: e.maxSlots || e.maxParticipants || e.capacity || 100,
              registered: e.currentSlots || 0,
              enrolled: e.isRegistered || false,
              organizer: publicEvent ? 'Đoàn trường Bách Khoa' : (e.creator?.name || 'Liên chi Đoàn'),
              organizerFaculty: e.creator?.faculty || '',
              category: e.category || 'Hoạt động',
              startAt: startIso ? new Date(startIso) : null,
              endAt: endIso ? new Date(endIso) : null,
              location: e.locationName || e.location || 'Đang cập nhật',
              locationLat: e.locationLat,
              locationLng: e.locationLng,
              attendanceRadius: e.attendanceRadius,
              points: `+${e.communityPoints || 0} ĐRL`,
              userRegistrationStatus: e.userRegistrationStatus,
              status: getStudentEventStatus(e.status),
              rawStatus: e.status,
              description: e.description || 'Đơn vị tổ chức chưa cập nhật mô tả chi tiết.',
              tags: [publicEvent ? 'Public' : (e.creator?.faculty || user.faculty || 'Theo khoa'), e.category || 'Hoạt động'].filter(Boolean),
              accent: publicEvent ? 'from-blue-500 via-sky-500 to-emerald-400' : 'from-emerald-500 via-teal-500 to-blue-500',
              audienceLabel: publicEvent ? 'Public - mọi khoa' : (e.creator?.faculty || 'Theo khoa'),
              isPublic: publicEvent,
              isNewestOpen: e.id === newestOpenId,
              attendanceConfig: { 
                gpsCenter: { 
                  lat: parseFloat(e.locationLat) || 16.074061, 
                  lng: parseFloat(e.locationLng) || 108.150720 
                }, 
                allowedRadiusMeters: e.attendanceRadius || 100, 
                qrValue: e.qrCode || `BKYOUTH-${e.id}` 
              },
              imageUrl: coverImage?.imageUrl || null,
              communityPoints: e.communityPoints || 0,
              createdAt: e.createdAt,
              registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline) : null,
              registrationDeadlineStr: e.registrationDeadline ? formatDateTime(e.registrationDeadline) : null,
              feedbackSummary: e.feedbackSummary || { averageRating: 0, totalFeedbacks: 0 },
              hasSubmittedFeedback: e.hasSubmittedFeedback || false,
            };
          });
          setDbEvents(formattedEvents.sort((a, b) => {
            if (a.isNewestOpen !== b.isNewestOpen) return a.isNewestOpen ? -1 : 1;
            if (a.rawStatus === 'open_registration' && b.rawStatus !== 'open_registration') return -1;
            if (a.rawStatus !== 'open_registration' && b.rawStatus === 'open_registration') return 1;
            return new Date(b.createdAt || b.startAt || 0) - new Date(a.createdAt || a.startAt || 0);
          }));
        }
      } catch (err) {
        setEventsError(err.message || 'Không thể tải danh sách sự kiện');
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchDbEventsRef.current = fetchDbEvents;
    fetchDbEvents();
  }, [studentFaculty, user.faculty]);

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

  const handleStartGPSCheckIn = (event) => {
    if (!event.locationLat || !event.locationLng) {
      setFeedback('Sự kiện chưa được cấu hình tọa độ định vị GPS.');
      return;
    }
    setSelectedGPSCheckInEvent(event);
    setShowGPSModal(true);
  };

  const handleConfirmGPSCheckIn = async (coords) => {
    if (!selectedGPSCheckInEvent) return;

    setIsCheckingGps(true);
    setFeedback('Đang xác thực tọa độ vị trí và tiến hành điểm danh...');
    setShowGPSModal(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${selectedGPSCheckInEvent.realId}/attendance/gps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedback(data.message || 'Điểm danh thất bại');
      } else {
        setFeedback(`Điểm danh thành công: ${selectedGPSCheckInEvent.title}`);
        setOpenedAttendanceEventId('');
        if (fetchDbEventsRef.current) {
          fetchDbEventsRef.current();
        }
      }
    } catch (error) {
      setFeedback('Lỗi kết nối máy chủ');
    } finally {
      setIsCheckingGps(false);
      setSelectedGPSCheckInEvent(null);
    }
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
          comment: feedbackInput,
          isAnonymous: isAnonymousFeedback
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
        setIsAnonymousFeedback(false);
        if (fetchDbEventsRef.current) {
          fetchDbEventsRef.current();
        }
      }
    } catch (err) {
      setFeedback('Lỗi kết nối máy chủ');
    }
  };

  const handleViewPublicFeedbacks = async (event) => {
    try {
      setSelectedEventForReviews(event);
      setLoadingPublicFeedbacks(true);
      setShowPublicReviewsModal(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${event.realId}/feedbacks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi tải đánh giá');
      }
      setPublicFeedbacks(data.feedbacks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPublicFeedbacks(false);
    }
  };

  const fetchDbEventsRef = useRef(null); // to re-fetch events

  const toggleRegistration = async (eventId, eventTitle, isEnrolled, realId) => {
    // Prevent multiple simultaneous requests
    if (isTogglingEventId === realId) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsTogglingEventId(realId);

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
        // Reset toggle state on error
        setIsTogglingEventId(null);
      } else {
        setFeedback(isEnrolled ? `Bạn đã hủy đăng ký: ${eventTitle}` : `Đăng ký thành công: ${eventTitle}`);
        
        // Don't do optimistic update - only rely on refetch from backend
        // Re-fetch events to get updated slots and registration status
        if (fetchDbEventsRef.current) {
          await fetchDbEventsRef.current();
        }
        
        // Clear toggle state after success
        setIsTogglingEventId(null);
      }
    } catch (err) {
      setFeedback('Lỗi kết nối máy chủ');
      setIsTogglingEventId(null);
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
    <div className={embedded ? 'w-full' : 'profile-page p-4 sm:p-6'}>
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className={embedded ? 'hidden' : 'app-sidebar hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col'}>
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Không gian sinh viên</p>
            </div>
          </div>

          <div className="profile-user-chip mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
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
          </div>

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
            <Link to="/sinhvien/notifications" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Thông báo
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
              <div className="flex items-center gap-3">
                <NotificationBell />
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
                  {displayFilters.map((filter) => (
                    <motion.button
                      key={filter}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        normalizedActiveFilter === filter
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
                const isCheckedIn = ['attended', 'confirmed'].includes(event.userRegistrationStatus) || Boolean(checkinState.gpsVerified && checkinState.qrVerified && checkinState.checkedInAt);
                const showAttendancePanel = openedAttendanceEventId === event.id && !isCheckedIn;
                const isRegistrationDeadlineExpired = event.registrationDeadline && new Date() >= event.registrationDeadline;
                const qrIssued = event.enrolled && (isRegistrationDeadlineExpired || event.rawStatus !== 'open_registration');

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
                          {event.isNewestOpen && displayStatus === 'Đang mở đăng ký' && (
                            <motion.span
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-3 py-1 text-xs font-bold text-white"
                            >
                              <Sparkles className="h-3 w-3" />
                              NEW
                            </motion.span>
                          )}
                          <span className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-bold text-[#1f5dcc]">{event.points}</span>
                          <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-bold text-[#cb6d13]">{event.category}</span>
                          {event.feedbackSummary?.totalFeedbacks > 0 && (
                            <button
                              type="button"
                              onClick={() => handleViewPublicFeedbacks(event)}
                              className="rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span className="text-amber-400 font-bold">★</span>
                              <span>{event.feedbackSummary.averageRating}</span>
                              <span className="text-slate-400 font-normal">({event.feedbackSummary.totalFeedbacks} đánh giá)</span>
                            </button>
                          )}
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
                          {(() => {
                            const isRegistrationDeadlineExpired = event.registrationDeadline && new Date() >= event.registrationDeadline;
                            const cancelCheck = event.enrolled ? canCancelRegistration(event) : { allowed: true };
                            const cannotCancelReason = !cancelCheck.allowed ? cancelCheck.reason : null;
                            
                            return (
                              <>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: event.enrolled && !cannotCancelReason ? 1.02 : 1, y: -1 }}
                                  whileTap={{ scale: event.enrolled && !cannotCancelReason ? 0.97 : 1 }}
                                  onClick={() => {
                                    if (event.enrolled && cannotCancelReason) {
                                      setFeedback(`Không thể hủy: ${cannotCancelReason}`);
                                      return;
                                    }
                                    toggleRegistration(event.id, event.title, event.enrolled, event.realId);
                                  }}
                                  disabled={isTogglingEventId === event.realId || (!event.enrolled && event.registered >= event.slots) || (event.enrolled && cannotCancelReason)}
                                  title={cannotCancelReason ? `Không thể hủy: ${cannotCancelReason}` : ''}
                                  className={`rounded-2xl px-4 py-3 font-bold text-white transition-all ${
                                    event.enrolled
                                      ? (isTogglingEventId === event.realId || cannotCancelReason)
                                        ? 'bg-slate-400 cursor-not-allowed opacity-60'
                                        : 'bg-[#d24c4c] shadow-[0_12px_24px_rgba(210,76,76,0.24)] hover:bg-[#bf3b3b]'
                                      : (isTogglingEventId === event.realId || event.registered >= event.slots)
                                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                                      : isRegistrationDeadlineExpired
                                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                                      : 'bg-[#1747a6] shadow-[0_12px_24px_rgba(23,71,166,0.24)] hover:bg-[#205fd8]'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {event.enrolled && <CheckCircle2 className="h-4 w-4" />}
                                    {isTogglingEventId === event.realId
                                      ? 'Đang xử lý...'
                                      : event.enrolled 
                                      ? cannotCancelReason 
                                        ? `Không thể hủy (${cannotCancelReason})`
                                        : 'Đã đăng ký (Nhấn để hủy)'
                                      : event.registered >= event.slots
                                      ? 'Đã đầy'
                                      : isRegistrationDeadlineExpired
                                      ? 'Hạn đăng ký hết'
                                      : 'Đăng ký tham gia'
                                    }
                                  </span>
                                </motion.button>
                                {isRegistrationDeadlineExpired && !event.enrolled && (
                                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                    Hạn đăng ký: {event.registrationDeadlineStr || 'Hết hạn'}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleAttendancePanel(event.id)}
                            disabled={!event.enrolled || isCheckedIn}
                            className={`rounded-2xl border px-4 py-3 font-semibold transition-all ${
                              isCheckedIn 
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-not-allowed opacity-90' 
                                : event.enrolled && event.attendanceGate.canCheckIn
                                  ? 'border-transparent bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-[0_12px_24px_rgba(99,102,241,0.24)] hover:brightness-110'
                                  : 'border-[#dce8f5] bg-white text-slate-600 hover:bg-[#f7fbff] disabled:cursor-not-allowed disabled:opacity-70'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {isCheckedIn ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                              {!event.enrolled ? 'Đăng ký trước khi điểm danh' : isCheckedIn ? 'Đã điểm danh thành công' : 'Điểm danh GPS'}
                            </span>
                          </motion.button>

                          {qrIssued && !isCheckedIn && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setSelectedQRCheckInEvent(event);
                              }}
                              className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
                            >
                              <span className="inline-flex items-center gap-2">
                                <QrCode className="h-4 w-4" />
                                Xem QR điểm danh
                              </span>
                            </motion.button>
                          )}
                           {['completed', 'ended', 'Đã kết thúc'].includes(event.status) && isCheckedIn && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: event.hasSubmittedFeedback ? 1 : 1.01 }}
                              whileTap={{ scale: event.hasSubmittedFeedback ? 1 : 0.98 }}
                              onClick={() => {
                                if (event.hasSubmittedFeedback) return;
                                setSelectedEventForFeedback(event);
                                setShowFeedbackModal(true);
                              }}
                              disabled={event.hasSubmittedFeedback}
                              className={`rounded-2xl border px-4 py-3 font-semibold transition-all ${
                                event.hasSubmittedFeedback
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-not-allowed opacity-90'
                                  : 'border-[#1747a6] bg-indigo-50 text-[#1747a6] hover:bg-[#e8f0fe]'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                {event.hasSubmittedFeedback ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Đã đánh giá sự kiện
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4" />
                                    Gửi đánh giá sự kiện
                                  </>
                                )}
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
                              <div className="rounded-2xl border border-[#dce8f5] bg-white p-4 flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Cách 1: Điểm danh bằng vị trí GPS</p>
                                  <p className="mt-2 text-sm text-slate-600">Hệ thống sẽ hiển thị bản đồ định vị thực tế của thiết bị so khớp với phạm vi của sự kiện.</p>
                                  <button
                                    type="button"
                                    onClick={() => handleStartGPSCheckIn(event)}
                                    disabled={isCheckingGps}
                                    className="mt-3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-70 flex justify-center items-center gap-2"
                                  >
                                    <Navigation className="h-4 w-4" />
                                    Mở bản đồ điểm danh GPS
                                  </button>
                                </div>
                                
                                <div className="border-t border-[#dce8f5] md:border-t-0 md:border-l pl-0 md:pl-6 pt-4 md:pt-0 flex flex-col items-center shrink-0">
                                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-2 text-center">Cách 2: Quét mã QR cá nhân</p>
                                  <div className="bg-white p-2.5 rounded-2xl border border-indigo-100 shadow-sm">
                                    {typeof QRCode === 'function' || typeof QRCode === 'object' ? (
                                      React.createElement(QRCode.default || QRCode, { value: `STUDENT-CHECKIN-${event.realId}-${user.id}`, size: 120 })
                                    ) : null}
                                  </div>
                                  <p className="mt-2 text-[10px] text-slate-400 text-center max-w-[150px]">Trình mã này cho Cán bộ Đoàn quét điểm danh trực tiếp</p>
                                </div>
                              </div>
                            </div>

                            {isCheckedIn && (
                              <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Hoàn tất điểm danh lúc {new Date(checkinState.checkedInAt || Date.now()).toLocaleString('vi-VN')}
                              </p>
                            )}
                            {!isCheckedIn && (
                              <p className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                                <XCircle className="h-4 w-4" />
                                Cần cung cấp quyền truy cập vị trí để hoàn thành điểm danh sự kiện.
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

        {/* Student QR Code Modal */}
        <AnimatePresence>
          {selectedQRCheckInEvent && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl relative text-center"
              >
                <button 
                  onClick={() => setSelectedQRCheckInEvent(null)} 
                  className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="w-16 h-16 rounded-2xl bg-[#eef6ff] text-[#1747a6] flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-black text-[#132b57] mb-1">Mã QR Điểm Danh</h3>
                <p className="text-slate-500 text-sm mb-6">{selectedQRCheckInEvent.title}</p>
                
                <div className="bg-white p-4 rounded-3xl border border-indigo-100 shadow-md inline-block mb-6">
                  {typeof QRCode === 'function' || typeof QRCode === 'object' ? (
                    React.createElement(QRCode.default || QRCode, { 
                      value: `STUDENT-CHECKIN-${selectedQRCheckInEvent.realId}-${user.id}`, 
                      size: 200 
                    })
                  ) : null}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 text-xs text-slate-600 space-y-2 mb-6">
                  <p><strong>Họ tên:</strong> {user.fullName}</p>
                  <p><strong>MSSV:</strong> {user.studentId}</p>
                  <p className="border-t border-slate-200 pt-2 text-[#1f5dcc] font-medium leading-relaxed">
                    * Trình mã QR này cho Cán bộ Đoàn để được quét điểm danh trực tiếp. Quét QR điểm danh sẽ tự động bỏ qua kiểm tra GPS.
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={() => setSelectedQRCheckInEvent(null)} 
                  className="w-full rounded-2xl bg-[#1747a6] py-3.5 font-bold text-white hover:bg-[#205fd8] transition-colors shadow-lg shadow-indigo-100"
                >
                  Đóng
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Feedback Modal */}
        <AnimatePresence>
          {showFeedbackModal && selectedEventForFeedback && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowFeedbackModal(false)} 
                  className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-2xl font-black text-[#132b57] mb-2">Đánh giá Sự kiện</h3>
                <p className="text-slate-500 text-sm mb-6">Sự kiện: {selectedEventForFeedback.title}</p>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Đánh giá độ hài lòng:</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="text-3xl focus:outline-none transition-transform active:scale-95 animate-none"
                        >
                          <span className={star <= feedbackRating ? 'text-amber-400' : 'text-slate-200'}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ý kiến đóng góp:</label>
                    <textarea
                      rows="4"
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Hãy chia sẻ trải nghiệm và góp ý của bạn về sự kiện này..."
                      className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc] text-sm focus:shadow-[0_0_0_4px_rgba(31,93,204,0.08)] transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 bg-[#f8faff] p-3.5 rounded-2xl border border-[#e8effa]">
                    <input
                      type="checkbox"
                      id="isAnonymousFeedback"
                      checked={isAnonymousFeedback}
                      onChange={(e) => setIsAnonymousFeedback(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-[#1747a6] focus:ring-[#1f5dcc] cursor-pointer"
                    />
                    <label
                      htmlFor="isAnonymousFeedback"
                      className="text-xs font-semibold text-slate-650 select-none cursor-pointer"
                    >
                      Đánh giá ẩn danh (Thông tin cá nhân của bạn sẽ không được hiển thị công khai)
                    </label>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowFeedbackModal(false)} 
                      className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="button"
                      onClick={handleSubmitFeedback} 
                      className="flex-1 rounded-2xl bg-[#1747a6] py-3 font-bold text-white hover:bg-[#205fd8] transition-colors shadow-lg shadow-indigo-100"
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Public Reviews & Ratings Modal */}
        <AnimatePresence>
          {showPublicReviewsModal && selectedEventForReviews && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] bg-white p-6 md:p-8 shadow-2xl relative scrollbar-hide"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => { setShowPublicReviewsModal(false); setSelectedEventForReviews(null); }} 
                  className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <h3 className="text-2xl font-black text-[#132b57] mb-1">Đánh giá & Nhận xét</h3>
                <p className="text-slate-500 text-sm mb-6">Sự kiện: {selectedEventForReviews.title}</p>

                {/* Statistics Summary Section */}
                {(() => {
                  const summary = selectedEventForReviews.feedbackSummary || { averageRating: 0, totalFeedbacks: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
                  const breakdown = summary.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                  const total = summary.totalFeedbacks || 0;
                  const avg = summary.averageRating || 0;
                  
                  return (
                    <div className="grid gap-6 md:grid-cols-[1fr_1.5fr] bg-[#f8fbff] rounded-3xl p-5 border border-[#e8effa] mb-6">
                      {/* Left: Avg Stars */}
                      <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200/60 pb-5 md:pb-0 md:pr-5">
                        <p className="text-5xl font-black text-[#132b57]">{avg}</p>
                        <div className="flex gap-1 my-2">
                          {[1, 2, 3, 4, 5].map(star => {
                            const isHalf = avg > star - 1 && avg < star;
                            const isFull = avg >= star;
                            return (
                              <span key={star} className={`text-2xl ${isFull ? 'text-amber-400' : isHalf ? 'text-amber-300' : 'text-slate-200'}`}>
                                ★
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{total} đánh giá</p>
                      </div>

                      {/* Right: Stars Breakdown Progress Bars */}
                      <div className="flex flex-col justify-center space-y-2">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const count = breakdown[stars] || 0;
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3 text-xs text-slate-655">
                              <span className="w-10 text-right font-bold">{stars} sao</span>
                              <div className="flex-1 h-3 rounded-full bg-white border border-slate-100 overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="w-12 text-slate-450 font-semibold">{count} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Reviews List */}
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Ý kiến đóng góp ({publicFeedbacks.length})</h4>
                
                {loadingPublicFeedbacks ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader className="h-6 w-6 animate-spin text-[#1747a6]" />
                    <p className="text-xs text-slate-500 mt-2">Đang tải đánh giá...</p>
                  </div>
                ) : publicFeedbacks.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <MessageSquare className="h-8 w-8 text-slate-350 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Chưa có bình luận nào cho sự kiện này.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {publicFeedbacks.map(fb => (
                      <div key={fb.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                          {fb.user?.avatar ? (
                            <img src={fb.user.avatar} className="w-9 h-9 rounded-full object-cover border border-slate-200" alt="Avatar" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {fb.user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-800">{fb.user?.name || 'Người dùng ẩn danh'}</p>
                            <p className="text-[10px] text-slate-450 font-semibold">{new Date(fb.createdAt).toLocaleString('vi-VN')}</p>
                          </div>
                          
                          <div className="ml-auto flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className={`text-base ${star <= fb.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-655 bg-white p-3 rounded-xl border border-slate-100 text-sm leading-relaxed">
                          {fb.comment || 'Không có bình luận đóng góp.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setShowPublicReviewsModal(false); setSelectedEventForReviews(null); }} 
                    className="w-full rounded-2xl border border-slate-205 bg-[#1747a6] text-white py-3.5 font-bold hover:bg-[#205fd8] transition-colors shadow-lg shadow-indigo-100"
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <GPSAttendanceModal
          show={showGPSModal}
          onClose={() => {
            setShowGPSModal(false);
            setSelectedGPSCheckInEvent(null);
          }}
          onConfirmCheckIn={handleConfirmGPSCheckIn}
          event={selectedGPSCheckInEvent}
        />
      </div>
    </div>
  );
}
