import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MapPin,
  PlusSquare,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  XCircle
} from 'lucide-react';

import schoolLogo from './assets/logo-bk.png';
import doanLogo from './assets/logo-doan.png';

const quickStats = [
  { label: 'Sự kiện đang mở đăng ký', value: '12', tone: 'from-blue-500 to-cyan-400' },
  { label: 'Sự kiện chờ duyệt', value: '05', tone: 'from-orange-500 to-amber-400' },
  { label: 'Minh chứng chờ xử lý', value: '18', tone: 'from-emerald-500 to-teal-400' }
];

const studentEvents = [
  {
    title: 'Chiến dịch Chủ nhật xanh tháng 3',
    organizer: 'Liên chi Đoàn Khoa CNTT',
    time: '07:00 - 11:00, 30/03/2026',
    place: 'Khuôn viên KTX phía Tây',
    status: 'Đang mở đăng ký',
    slots: '86 / 120',
    points: '5 điểm rèn luyện',
    tags: ['Tình nguyện', 'Ngoài trời', 'Có điểm danh QR']
  },
  {
    title: 'Tập huấn cán bộ lớp học kỳ II',
    organizer: 'Đoàn trường Bách Khoa',
    time: '18:30 - 20:30, 02/04/2026',
    place: 'Hội trường S',
    status: 'Sắp diễn ra',
    slots: '140 / 200',
    points: '3 điểm rèn luyện',
    tags: ['Kỹ năng', 'Bắt buộc với cán sự', 'Có chứng nhận']
  },
  {
    title: 'Ngày hội hiến máu nhân đạo',
    organizer: 'Đoàn trường phối hợp Hội Chữ thập đỏ',
    time: '07:30 - 16:30, 10/04/2026',
    place: 'Sảnh nhà A',
    status: 'Chờ duyệt minh chứng',
    slots: '220 / 250',
    points: '8 điểm rèn luyện',
    tags: ['Cộng đồng', 'Giấy chứng nhận', 'Ưu tiên sinh viên năm cuối']
  }
];

const pendingEvents = [
  {
    title: 'Talkshow Kỹ năng viết CV và phỏng vấn',
    unit: 'Liên chi Đoàn Khoa Cơ khí',
    submittedAt: '23/03/2026 - 09:15',
    status: 'Chờ duyệt',
    scope: 'Cấp khoa',
    note: 'Cần kiểm tra lại file poster và sức chứa hội trường'
  },
  {
    title: 'Cuộc thi Ý tưởng sáng tạo trẻ',
    unit: 'Liên chi Đoàn Khoa Điện',
    submittedAt: '23/03/2026 - 14:20',
    status: 'Yêu cầu chỉnh sửa',
    scope: 'Cấp trường',
    note: 'Thiếu tiêu chí chấm điểm và timeline vòng sơ loại'
  }
];

const participantRows = [
  { name: 'Nguyễn Văn A', studentId: '102210101', className: '22TCLC_DT1', status: 'Đã xác nhận', proof: 'Đã nộp', attendance: 'Có mặt' },
  { name: 'Trần Thị B', studentId: '102210224', className: '22TCLC_DT2', status: 'Chờ xác nhận', proof: 'Chưa nộp', attendance: 'Chưa điểm danh' },
  { name: 'Lê Minh C', studentId: '102220019', className: '22TCLC_DT3', status: 'Đã xác nhận', proof: 'Đã nộp', attendance: 'Có mặt' },
  { name: 'Phạm Khánh D', studentId: '102230088', className: '23TCLC_DT1', status: 'Đã hủy', proof: 'Không áp dụng', attendance: 'Vắng' }
];

const menuItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'student-events', label: 'Đăng ký sự kiện', icon: CalendarDays },
  { id: 'create-event', label: 'Tạo sự kiện', icon: PlusSquare },
  { id: 'approve-event', label: 'Duyệt sự kiện', icon: ShieldCheck },
  { id: 'manage-participants', label: 'QL người đăng ký', icon: ClipboardList }
];

const statusTone = {
  'Đang mở đăng ký': 'bg-emerald-100 text-emerald-700',
  'Sắp diễn ra': 'bg-blue-100 text-blue-700',
  'Chờ duyệt minh chứng': 'bg-amber-100 text-amber-700',
  'Chờ duyệt': 'bg-orange-100 text-orange-700',
  'Yêu cầu chỉnh sửa': 'bg-rose-100 text-rose-700',
  'Đã xác nhận': 'bg-emerald-100 text-emerald-700',
  'Chờ xác nhận': 'bg-amber-100 text-amber-700',
  'Đã hủy': 'bg-slate-200 text-slate-700',
  'Có mặt': 'bg-emerald-100 text-emerald-700',
  'Chưa điểm danh': 'bg-orange-100 text-orange-700',
  'Vắng': 'bg-rose-100 text-rose-700',
  'Đã nộp': 'bg-blue-100 text-blue-700',
  'Chưa nộp': 'bg-slate-200 text-slate-700',
  'Không áp dụng': 'bg-slate-100 text-slate-500'
};

const StatusPill = ({ value }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[value] || 'bg-slate-100 text-slate-700'}`}>
    {value}
  </span>
);

const AppFrame = ({ activeView, onChangeView, children, title, subtitle, role }) => (
  <div className="min-h-screen bg-[#edf5fb] p-4 sm:p-6">
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe] shadow-[0_24px_60px_rgba(37,99,235,0.12)]">
      <aside className="hidden w-[280px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3">
          <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
          <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
            <p className="text-sm font-semibold">Hệ thống Đoàn - Hội</p>
          </div>
        </div>

        <div className="mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.28em] text-blue-100">Vai trò demo</p>
          <p className="mt-2 text-xl font-bold">{role}</p>
          <p className="mt-2 text-sm text-blue-50/85">Prototype bám theo các use case chính trong SRS v3.6.</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChangeView(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                activeView === id ? 'bg-white text-[#123d94] shadow-lg' : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-semibold">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4">
          <p className="text-sm font-semibold">Các màn nên ưu tiên trước</p>
          <ul className="mt-3 space-y-2 text-sm text-blue-50/90">
            <li>Đăng ký tham gia sự kiện</li>
            <li>Tạo và chỉnh sửa sự kiện</li>
            <li>Duyệt sự kiện</li>
            <li>Quản lý người đăng ký</li>
          </ul>
        </div>
      </aside>

      <main className="flex-1">
        <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Prototype</p>
              <h1 className="mt-2 text-3xl font-black text-[#132b57]">{title}</h1>
              <p className="mt-1 text-slate-500">{subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#dde8f6] bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${item.tone}`} />
                    <span className="text-lg font-black text-[#14356b]">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">{children}</div>
      </main>
    </div>
  </div>
);

export const StudentEventsPage = ({ activeView, onChangeView }) => (
  <AppFrame
    activeView={activeView}
    onChangeView={onChangeView}
    title="Danh sách sự kiện cho sinh viên"
    subtitle="Use case ưu tiên: Đăng ký tham gia sự kiện, hủy đăng ký, xem trạng thái minh chứng."
    role="Sinh viên"
  >
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
      <section>
        <div className="mb-5 flex flex-col gap-3 rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 lg:w-[420px]">
            <Search className="h-5 w-5 text-slate-400" />
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Tìm theo tên sự kiện, chủ đề, đơn vị tổ chức" />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <button className="rounded-full bg-[#1747a6] px-4 py-2 font-semibold text-white">Đang mở đăng ký</button>
            <button className="rounded-full border border-[#dce8f5] bg-white px-4 py-2 font-semibold text-slate-600">Sắp diễn ra</button>
            <button className="rounded-full border border-[#dce8f5] bg-white px-4 py-2 font-semibold text-slate-600">Đã tham gia</button>
          </div>
        </div>

        <div className="space-y-4">
          {studentEvents.map((event) => (
            <article key={event.title} className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill value={event.status} />
                    <span className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-bold text-[#1f5dcc]">{event.points}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-[#132b57]">{event.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-[#1f5dcc]">{event.organizer}</p>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{event.place}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] bg-[#f4f8ff] p-4 lg:w-[220px]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tiến độ đăng ký</p>
                  <p className="mt-2 text-2xl font-black text-[#14356b]">{event.slots}</p>
                  <div className="mt-3 h-3 rounded-full bg-white">
                    <div className="h-3 w-3/4 rounded-full bg-[#1f5dcc]" />
                  </div>
                  <div className="mt-5 grid gap-2">
                    <button className="rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white">Đăng ký ngay</button>
                    <button className="rounded-2xl border border-[#d8e5f2] bg-white px-4 py-3 font-semibold text-slate-600">Xem chi tiết</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Quy trình theo SRS</p>
          <div className="mt-4 space-y-3">
            {[
              'Sinh viên xem danh sách sự kiện đang mở đăng ký',
              'Chọn sự kiện và xem thông tin chi tiết',
              'Xác nhận đăng ký hoặc hủy đăng ký nếu còn hạn',
              'Điểm danh và nộp minh chứng sau khi tham gia'
            ].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-[#f6faff] p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1747a6] text-sm font-bold text-white">{index + 1}</div>
                <p className="text-sm text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Mục kế tiếp nên làm</p>
              <h3 className="mt-2 text-xl font-black text-[#132b57]">Chi tiết sự kiện</h3>
            </div>
            <Sparkles className="h-6 w-6 text-[#1f5dcc]" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Màn chi tiết cần có mô tả đầy đủ, timeline, ảnh bìa, điều kiện tham gia, QR điểm danh và trạng thái minh chứng.
          </p>
        </div>
      </section>
    </div>
  </AppFrame>
);

export const CreateEventPage = ({ activeView, onChangeView }) => (
  <AppFrame
    activeView={activeView}
    onChangeView={onChangeView}
    title="Tạo sự kiện"
    subtitle="Use case UC004: nhập thông tin sự kiện, điều kiện đăng ký, timeline và trạng thái công khai."
    role="Liên chi Đoàn / Đoàn trường"
  >
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Tên sự kiện</span>
            <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nhập tên sự kiện" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Chủ đề</span>
            <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Tình nguyện / Học thuật / Kỹ năng..." />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Thời gian bắt đầu</span>
            <input type="datetime-local" className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Thời gian kết thúc</span>
            <input type="datetime-local" className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Địa điểm</span>
            <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nhập địa điểm tổ chức" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Số lượng tối đa</span>
            <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="200" />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả sự kiện</span>
          <textarea rows="5" className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nêu mục tiêu, nội dung chính, đối tượng tham gia..." />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block rounded-[24px] border border-dashed border-[#9dbce8] bg-[#f7fbff] p-4">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Ảnh bìa sự kiện</span>
            <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500">Kéo ảnh vào đây hoặc chọn tệp tải lên</div>
          </label>
          <label className="block rounded-[24px] border border-dashed border-[#9dbce8] bg-[#f7fbff] p-4">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Tài liệu đính kèm</span>
            <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500">Poster, kế hoạch, quyết định hoặc file minh họa</div>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white">Lưu nháp</button>
          <button className="rounded-2xl bg-[#1f8a4c] px-5 py-3 font-bold text-white">Gửi chờ duyệt</button>
          <button className="rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600">Xem trước</button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-[#132b57]">Điều kiện đăng ký</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <label className="flex items-center gap-3 rounded-2xl bg-[#f5f9ff] p-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <span>Chỉ cho phép sinh viên thuộc khoa đăng ký</span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-[#f5f9ff] p-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              <span>Bắt buộc điểm danh bằng QR tại sự kiện</span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-[#f5f9ff] p-3">
              <input type="checkbox" className="h-4 w-4" />
              <span>Yêu cầu nộp minh chứng sau khi kết thúc</span>
            </label>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-[#132b57]">Timeline sự kiện</h3>
          <div className="mt-4 space-y-3">
            {[
              'Mở đăng ký - 25/03/2026',
              'Đóng đăng ký - 29/03/2026',
              'Điểm danh tại chỗ - 30/03/2026',
              'Mở nộp minh chứng - 31/03/2026'
            ].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl bg-[#f8fbff] p-3 text-sm text-slate-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1747a6] font-bold text-white">{index + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </AppFrame>
);

export const ApproveEventsPage = ({ activeView, onChangeView }) => (
  <AppFrame
    activeView={activeView}
    onChangeView={onChangeView}
    title="Duyệt sự kiện"
    subtitle="Use case UC006: xem các sự kiện chờ duyệt, đọc hồ sơ và phê duyệt hoặc yêu cầu chỉnh sửa."
    role="Đoàn trường"
  >
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-4">
        {pendingEvents.map((event) => (
          <article key={event.title} className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <StatusPill value={event.status} />
              <span className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-bold text-[#1f5dcc]">{event.scope}</span>
            </div>
            <h3 className="mt-4 text-xl font-black text-[#132b57]">{event.title}</h3>
            <p className="mt-2 text-sm font-semibold text-[#1f5dcc]">{event.unit}</p>
            <p className="mt-3 text-sm text-slate-500">Gửi duyệt lúc: {event.submittedAt}</p>
            <p className="mt-3 rounded-2xl bg-[#f8fbff] p-3 text-sm leading-6 text-slate-600">{event.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e8eef5] pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Hồ sơ sự kiện</p>
            <h3 className="mt-2 text-2xl font-black text-[#132b57]">Talkshow Kỹ năng viết CV và phỏng vấn</h3>
            <p className="mt-2 text-sm text-slate-500">Đơn vị gửi: Liên chi Đoàn Khoa Cơ khí</p>
          </div>
          <StatusPill value="Chờ duyệt" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ['Thời gian', '19:00 - 21:00, 05/04/2026'],
            ['Địa điểm', 'Hội trường F'],
            ['Sức chứa', '180 sinh viên'],
            ['Điểm rèn luyện', '3 điểm']
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#f8fbff] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
              <p className="mt-2 font-semibold text-slate-700">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] bg-[#f8fbff] p-4">
          <p className="text-sm font-bold text-[#132b57]">Mô tả tóm tắt</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sự kiện định hướng kỹ năng viết CV, phỏng vấn và chuẩn bị hồ sơ ứng tuyển cho sinh viên năm 3-4.
            Có diễn giả doanh nghiệp, phần hỏi đáp và phát chứng nhận tham gia.
          </p>
        </div>

        <div className="mt-5 rounded-[24px] border border-dashed border-[#b7cce8] bg-white p-4">
          <p className="text-sm font-bold text-[#132b57]">Nhận xét của Đoàn trường</p>
          <textarea rows="5" className="mt-3 w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nhập lý do duyệt hoặc yêu cầu chỉnh sửa..." />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="flex items-center gap-2 rounded-2xl bg-[#1f8a4c] px-5 py-3 font-bold text-white">
            <CheckCircle2 className="h-5 w-5" />
            Duyệt sự kiện
          </button>
          <button className="flex items-center gap-2 rounded-2xl bg-[#e57a1f] px-5 py-3 font-bold text-white">
            <FileText className="h-5 w-5" />
            Yêu cầu chỉnh sửa
          </button>
          <button className="flex items-center gap-2 rounded-2xl bg-[#cf3e4c] px-5 py-3 font-bold text-white">
            <XCircle className="h-5 w-5" />
            Từ chối
          </button>
        </div>
      </section>
    </div>
  </AppFrame>
);

export const ManageParticipantsPage = ({ activeView, onChangeView }) => (
  <AppFrame
    activeView={activeView}
    onChangeView={onChangeView}
    title="Quản lý người đăng ký"
    subtitle="Use case UC013: xem danh sách sinh viên đăng ký, điểm danh, nộp minh chứng và điều chỉnh danh sách."
    role="Cán bộ quản lý sự kiện"
  >
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Sự kiện đang quản lý</p>
            <h3 className="mt-2 text-2xl font-black text-[#132b57]">Chiến dịch Chủ nhật xanh tháng 3</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white">Thêm người đăng ký</button>
            <button className="rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-slate-600">Xuất danh sách</button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[#e4edf7]">
          <table className="min-w-full divide-y divide-[#e4edf7] text-sm">
            <thead className="bg-[#f8fbff] text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Sinh viên</th>
                <th className="px-4 py-3 font-bold">Lớp</th>
                <th className="px-4 py-3 font-bold">Đăng ký</th>
                <th className="px-4 py-3 font-bold">Điểm danh</th>
                <th className="px-4 py-3 font-bold">Minh chứng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3f9] bg-white">
              {participantRows.map((row) => (
                <tr key={row.studentId}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-700">{row.name}</p>
                    <p className="text-xs text-slate-400">{row.studentId}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{row.className}</td>
                  <td className="px-4 py-4"><StatusPill value={row.status} /></td>
                  <td className="px-4 py-4"><StatusPill value={row.attendance} /></td>
                  <td className="px-4 py-4"><StatusPill value={row.proof} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-[#132b57]">Bộ công cụ sự kiện</h3>
          <div className="mt-4 grid gap-3">
            <button className="flex items-center justify-between rounded-2xl bg-[#f5f9ff] px-4 py-4 text-left">
              <div className="flex items-center gap-3">
                <QrCode className="h-5 w-5 text-[#1f5dcc]" />
                <span className="font-semibold text-slate-700">Mở phiên điểm danh QR</span>
              </div>
              <span className="text-sm font-bold text-[#1f5dcc]">03 phút</span>
            </button>
            <button className="flex items-center justify-between rounded-2xl bg-[#f5f9ff] px-4 py-4 text-left">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#1f5dcc]" />
                <span className="font-semibold text-slate-700">Gửi thông báo cho người đăng ký</span>
              </div>
              <span className="text-sm font-bold text-slate-500">Email nội bộ</span>
            </button>
            <button className="flex items-center justify-between rounded-2xl bg-[#f5f9ff] px-4 py-4 text-left">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-[#1f5dcc]" />
                <span className="font-semibold text-slate-700">Khóa danh sách sau khi diễn ra</span>
              </div>
              <span className="text-sm font-bold text-slate-500">Tự động</span>
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#dce8f5] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-[#132b57]">Thống kê nhanh</h3>
          <div className="mt-4 grid gap-3">
            {[
              ['Đã đăng ký', '142 sinh viên'],
              ['Đã điểm danh', '117 sinh viên'],
              ['Đã nộp minh chứng', '96 sinh viên']
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#f8fbff] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-black text-[#14356b]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </AppFrame>
);
