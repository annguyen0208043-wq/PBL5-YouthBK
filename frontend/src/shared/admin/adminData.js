export const adminSummaryCards = [
  {
    id: 'pending-events',
    label: 'Sự kiện chờ duyệt',
    value: '12',
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'active-accounts',
    label: 'Tài khoản đang hoạt động',
    value: '1,284',
    tone: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'today-notices',
    label: 'Thông báo hôm nay',
    value: '08',
    tone: 'bg-blue-100 text-blue-700',
  },
];

export const pendingEvents = [
  {
    id: 'lc-cntt-01',
    title: 'Ngày hội Kỹ năng số cho sinh viên năm nhất',
    unit: 'Liên chi Đoàn Khoa Công nghệ thông tin',
    time: '08:00 - 11:30, 06/04/2026',
    location: 'Hội trường F',
    status: 'Chờ duyệt',
    category: 'Kỹ năng',
    description: 'Chương trình tập huấn kỹ năng số, an toàn thông tin cơ bản và cộng tác trực tuyến cho sinh viên năm nhất.',
    plan: 'Có kế hoạch tổ chức, poster truyền thông và timeline chi tiết.',
  },
  {
    id: 'lc-co-khi-02',
    title: 'Hành trình xanh làm sạch khuôn viên',
    unit: 'Liên chi Đoàn Khoa Cơ khí',
    time: '07:00 - 10:30, 09/04/2026',
    location: 'Khu B - sân trung tâm',
    status: 'Chờ duyệt',
    category: 'Tình nguyện',
    description: 'Hoạt động vệ sinh khuôn viên, phân loại rác và tuyên truyền bảo vệ môi trường cho sinh viên.',
    plan: 'Có phân công đầu việc theo ca, khu vực phụ trách và phương án truyền thông.',
  },
  {
    id: 'lc-dien-03',
    title: 'Diễn đàn sáng tạo trẻ Bách Khoa',
    unit: 'Liên chi Đoàn Khoa Điện',
    time: '18:30 - 21:00, 12/04/2026',
    location: 'Phòng hội thảo A3',
    status: 'Chờ duyệt',
    category: 'Học thuật',
    description: 'Diễn đàn chia sẻ ý tưởng sáng tạo, mô hình nghiên cứu và kết nối sinh viên đam mê công nghệ.',
    plan: 'Đã đính kèm kịch bản chương trình, danh sách diễn giả và dự toán kinh phí.',
  },
];

export const userAccounts = [
  {
    id: 'u001',
    fullName: 'Nguyễn Đỗ Thắng',
    email: 'nguyendothang@sv.dut.udn.vn',
    studentId: '102230046',
    role: 'Sinh viên',
    faculty: 'CNTT',
    status: 'Hoạt động',
  },
  {
    id: 'u002',
    fullName: 'Trần Minh Quân',
    email: 'tranminhquan@sv.dut.udn.vn',
    studentId: '102220115',
    role: 'Liên chi Đoàn',
    faculty: 'Cơ khí',
    status: 'Hoạt động',
  },
  {
    id: 'u003',
    fullName: 'Lê Thu Hà',
    email: 'lethuha@dut.udn.vn',
    studentId: 'CB001',
    role: 'Đoàn trường',
    faculty: 'Văn phòng Đoàn',
    status: 'Hoạt động',
  },
  {
    id: 'u004',
    fullName: 'Phạm Gia Hưng',
    email: 'phamgiahung@sv.dut.udn.vn',
    studentId: '102210087',
    role: 'Sinh viên',
    faculty: 'Điện',
    status: 'Tạm khóa',
  },
];

export const adminNotifications = [
  {
    id: 'noti-01',
    title: 'Nhắc bổ sung hồ sơ sự kiện',
    audience: 'Liên chi Đoàn Khoa Cơ khí',
    channel: 'Thông báo hệ thống',
    sentAt: '14/04/2026 08:30',
    status: 'Đã gửi',
  },
  {
    id: 'noti-02',
    title: 'Cập nhật lịch kiểm tra điểm danh QR',
    audience: 'Toàn bộ cán bộ Đoàn - Hội',
    channel: 'Email nội bộ',
    sentAt: '14/04/2026 10:00',
    status: 'Đã lên lịch',
  },
  {
    id: 'noti-03',
    title: 'Mở đợt đánh giá sự kiện tháng 4',
    audience: 'Sinh viên toàn trường',
    channel: 'Thông báo hệ thống',
    sentAt: '14/04/2026 11:20',
    status: 'Đã gửi',
  },
];

export const systemSettings = [
  {
    id: 'semester',
    label: 'Học kỳ đang áp dụng',
    value: 'Học kỳ 2 năm học 2025 - 2026',
    description: 'Dùng để gắn dữ liệu điểm rèn luyện, lịch đăng ký và báo cáo thống kê.',
  },
  {
    id: 'event-window',
    label: 'Khoảng mở đăng ký sự kiện',
    value: 'Từ 7 ngày trước khi sự kiện diễn ra',
    description: 'Giới hạn thời điểm sinh viên được phép nhìn thấy và đăng ký hoạt động.',
  },
  {
    id: 'attendance-radius',
    label: 'Bán kính điểm danh QR',
    value: '150 mét',
    description: 'Áp dụng cho hoạt động yêu cầu định vị khi check-in.',
  },
  {
    id: 'evidence-deadline',
    label: 'Hạn nộp minh chứng',
    value: '48 giờ sau khi sự kiện kết thúc',
    description: 'Quy định thời hạn hệ thống cho phép nộp minh chứng tham gia.',
  },
];

export const auditLogs = [
  {
    id: 'log-01',
    actor: 'Lê Thu Hà',
    role: 'Đoàn trường',
    action: 'Duyệt sự kiện "Ngày hội Kỹ năng số cho sinh viên năm nhất"',
    time: '14/04/2026 09:05',
    level: 'Cao',
  },
  {
    id: 'log-02',
    actor: 'Lê Thu Hà',
    role: 'Đoàn trường',
    action: 'Cấp quyền Liên chi Đoàn cho tài khoản Trần Minh Quân',
    time: '14/04/2026 09:30',
    level: 'Cao',
  },
  {
    id: 'log-03',
    actor: 'Nguyễn Văn Dũng',
    role: 'Quản trị viên',
    action: 'Cập nhật cấu hình hạn nộp minh chứng',
    time: '14/04/2026 10:15',
    level: 'Trung bình',
  },
];
