export const STORAGE_REGISTERED_EVENTS_KEY = 'bkYouthRegisteredEvents';
export const STORAGE_ATTENDANCE_CHECKINS_KEY = 'bkYouthAttendanceCheckins';
export const STORAGE_ATTENDANCE_WINDOW_KEY = 'bkYouthAttendanceWindow';
export const STORAGE_CERTIFICATE_REQUESTS_KEY = 'bkYouthCertificateRequests';

export const studentEvents = [
  {
    id: 'cdx-thang-3',
    title: 'Chiến dịch Chủ nhật xanh tháng 3',
    organizer: 'Liên chi Đoàn Khoa Công nghệ thông tin',
    time: '07:00 - 11:00, 30/03/2026',
    location: 'Khuôn viên KTX phía Tây',
    status: 'Đang mở đăng ký',
    category: 'Tình nguyện',
    points: '5 điểm rèn luyện',
    slots: 120,
    registered: 86,
    tags: ['Ngoài trời', 'Điểm danh QR', 'Có minh chứng'],
    attendanceConfig: {
      gpsCenter: { lat: 16.074157, lng: 108.149472 },
      allowedRadiusMeters: 100,
      qrValue: 'BKYOUTH-CDX-THANG-3-2026',
    },
    description: 'Hoạt động vệ sinh khuôn viên, phân loại rác và tuyên truyền bảo vệ môi trường cho sinh viên.',
    accent: 'from-emerald-400 via-cyan-400 to-blue-500',
  },
  {
    id: 'tap-huan-can-bo',
    title: 'Tập huấn cán bộ lớp học kỳ II',
    organizer: 'Đoàn trường Bách Khoa',
    time: '18:30 - 20:30, 02/04/2026',
    location: 'Hội trường S',
    status: 'Đang mở đăng ký',
    category: 'Kỹ năng',
    points: '3 điểm rèn luyện',
    slots: 200,
    registered: 140,
    tags: ['Kỹ năng', 'Có chứng nhận'],
    attendanceConfig: {
      gpsCenter: { lat: 16.075081, lng: 108.150011 },
      allowedRadiusMeters: 100,
      qrValue: 'BKYOUTH-TAP-HUAN-CAN-BO-2026',
    },
    description: 'Tập huấn kỹ năng điều phối lớp, truyền thông nội bộ và quản lý hoạt động tập thể.',
    accent: 'from-blue-500 via-indigo-500 to-violet-500',
  },
  {
    id: 'hien-mau-nhan-dao',
    title: 'Ngày hội hiến máu nhân đạo',
    organizer: 'Đoàn trường phối hợp Hội Chữ thập đỏ',
    time: '07:30 - 16:30, 10/04/2026',
    location: 'Sảnh nhà A',
    status: 'Sắp diễn ra',
    category: 'Cộng đồng',
    points: '8 điểm rèn luyện',
    slots: 250,
    registered: 220,
    tags: ['Giấy chứng nhận', 'Ưu tiên sinh viên năm cuối'],
    attendanceConfig: {
      gpsCenter: { lat: 16.073322, lng: 108.147781 },
      allowedRadiusMeters: 100,
      qrValue: 'BKYOUTH-HIEN-MAU-NHAN-DAO-2026',
    },
    description: 'Chương trình hiến máu định kỳ nhằm lan tỏa tinh thần sẻ chia và trách nhiệm cộng đồng.',
    accent: 'from-rose-400 via-orange-400 to-amber-400',
  },
];

export const defaultRegisteredEventIds = ['tap-huan-can-bo'];

export const activityHistory = [
  {
    id: 'mua-he-xanh-2025',
    title: 'Mùa hè xanh 2025',
    time: '15/07/2025 - 28/07/2025',
    status: 'Hoàn thành',
    result: 'Đã cộng 10 điểm rèn luyện',
    note: 'Bạn đã hoàn thành đầy đủ điểm danh và báo cáo cuối chương trình.',
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'tap-huan-doan-vien',
    title: 'Tập huấn đoàn viên nòng cốt',
    time: '12/11/2025',
    status: 'Đã xác nhận tham gia',
    result: 'Có giấy chứng nhận',
    note: 'Giấy chứng nhận điện tử đã được cập nhật vào hồ sơ cá nhân.',
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'dien-dan-sang-tao',
    title: 'Diễn đàn sinh viên sáng tạo 2026',
    time: '05/04/2026',
    status: 'Đang chờ diễn ra',
    result: 'Chuẩn bị điểm danh QR',
    note: 'Bạn đã đăng ký thành công. Hệ thống sẽ mở mã QR trước 30 phút.',
    accent: 'from-amber-400 to-orange-500',
  },
];

export const defaultCertificateRequests = [
  {
    id: 'cert-mua-he-xanh-2025-102230046',
    activityId: 'mua-he-xanh-2025',
    activityTitle: 'Mùa hè xanh 2025',
    status: 'approved',
    requestedAt: '2025-07-29T03:00:00.000Z',
    approvedAt: '2025-07-30T08:15:00.000Z',
    approverName: 'Lê Thu Hà',
    stampCode: 'BKYOUTH-DOANTRUONG-APPROVED',
    note: 'Đã xác minh điểm danh và minh chứng tham gia.',
  },
  {
    id: 'cert-tap-huan-doan-vien-102230046',
    activityId: 'tap-huan-doan-vien',
    activityTitle: 'Tập huấn đoàn viên nòng cốt',
    status: 'pending',
    requestedAt: '2025-11-13T02:00:00.000Z',
    approvedAt: null,
    approverName: '',
    stampCode: '',
    note: '',
  },
];
