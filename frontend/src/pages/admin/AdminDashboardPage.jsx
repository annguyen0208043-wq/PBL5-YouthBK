import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, CalendarClock, CheckCheck, Loader, ShieldAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';

const summaryIcons = {
  'pending-events': CalendarClock,
  'active-accounts': Users,
  'today-notices': Bell,
};

const summaryUnits = {
  'pending-events': 'sự kiện',
  'active-accounts': 'tài khoản',
  'today-notices': 'thông báo',
};

function formatDateTime(value) {
  if (!value) {
    return 'Chưa xác định';
  }

  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isToday(dateValue) {
  if (!dateValue) {
    return false;
  }

  const current = new Date();
  const target = new Date(dateValue);

  return (
    current.getFullYear() === target.getFullYear() &&
    current.getMonth() === target.getMonth() &&
    current.getDate() === target.getDate()
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [eventsResponse, usersResponse, notificationsResponse] = await Promise.all([
          fetch('/api/events/pending', { headers }),
          fetch('/api/users', { headers }),
          fetch('/api/notifications/sent', { headers }),
        ]);

        if (!eventsResponse.ok) {
          const payload = await eventsResponse.json().catch(() => ({}));
          throw new Error(payload.message || 'Không thể tải danh sách sự kiện chờ duyệt');
        }

        if (!usersResponse.ok) {
          const payload = await usersResponse.json().catch(() => ({}));
          throw new Error(payload.message || 'Không thể tải danh sách tài khoản');
        }

        if (!notificationsResponse.ok) {
          const payload = await notificationsResponse.json().catch(() => ({}));
          throw new Error(payload.message || 'Không thể tải danh sách thông báo');
        }

        const eventsData = await eventsResponse.json();
        const usersData = await usersResponse.json();
        const notificationsData = await notificationsResponse.json();

        setPendingEvents(eventsData.events || []);
        setUsers(usersData.users || []);
        setNotifications(notificationsData.notifications || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const summaryCards = useMemo(() => {
    const activeAccounts = users.filter((item) => item.status === 'Hoạt động').length;
    const todayNotices = notifications.filter((item) => isToday(item.createdAt)).length;

    return [
      {
        id: 'pending-events',
        label: 'Sự kiện chờ duyệt',
        value: pendingEvents.length,
      },
      {
        id: 'active-accounts',
        label: 'Tài khoản đang hoạt động',
        value: activeAccounts,
      },
      {
        id: 'today-notices',
        label: 'Thông báo hôm nay',
        value: todayNotices,
      },
    ];
  }, [notifications, pendingEvents, users]);

  const activeAccounts = useMemo(
    () => users.filter((item) => item.status === 'Hoạt động').length,
    [users]
  );

  const reminders = useMemo(() => {
    const lockedAccounts = users.filter((item) => item.status === 'Tạm khóa').length;
    const unreadHeavyNotices = notifications.filter((item) => (item.recipientCount || 0) > 0 && item.readCount === 0).length;

    return [
      {
        icon: CheckCheck,
        text:
          pendingEvents.length > 0
            ? `Có ${pendingEvents.length} sự kiện đang chờ Đoàn trường duyệt. Ưu tiên xử lý các hồ sơ đến sớm trước.`
            : 'Hiện không có sự kiện nào đang chờ duyệt.',
      },
      {
        icon: ShieldAlert,
        text:
          lockedAccounts > 0
            ? `Có ${lockedAccounts} tài khoản đang ở trạng thái tạm khóa. Kiểm tra lại nếu cần mở quyền truy cập.`
            : 'Không có tài khoản nào đang bị tạm khóa.',
      },
      {
        icon: Bell,
        text:
          unreadHeavyNotices > 0
            ? `Có ${unreadHeavyNotices} thông báo đã gửi nhưng chưa có lượt đọc nào. Nên rà lại nhóm nhận hoặc nội dung gửi.`
            : 'Các thông báo đã gửi đều đã có tương tác đọc hoặc chưa phát sinh cảnh báo.',
      },
    ];
  }, [notifications, pendingEvents, users]);

  return (
    <AdminLayout
      currentPath="/admin"
      title="Tổng quan quản trị"
      subtitle="Theo dõi nhanh các đầu việc quan trọng của Đoàn trường bằng dữ liệu đồng bộ trực tiếp từ hệ thống."
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
            <p className="text-slate-600">Đang tải dữ liệu dashboard từ database...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-5">
            {error ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <motion.div key={card.id} whileHover={{ y: -4 }} className="admin-summary-card profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="admin-summary-icon rounded-2xl bg-[#f4f8ff] p-3 text-[#1747a6]">
                      {(() => {
                        const Icon = summaryIcons[card.id] || Bell;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="admin-summary-label text-sm text-slate-500">{card.label}</p>
                    <div className="mt-3 flex items-end gap-2">
                      <h2 className="text-4xl font-black tracking-tight text-[#132b57]">{card.value}</h2>
                      <span className="pb-1 text-sm font-semibold text-slate-400">{summaryUnits[card.id]}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1f5dcc]">Ưu tiên xử lý</p>
                  <h3 className="mt-2 text-2xl font-black text-[#132b57]">Sự kiện chờ duyệt nổi bật</h3>
                </div>
                <Link to="/admin/event-approvals" className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
                  Mở danh sách
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {pendingEvents.length === 0 ? (
                  <div className="rounded-[24px] bg-[#f6faff] p-4 text-sm text-slate-500">
                    Hiện không có sự kiện nào đang chờ duyệt.
                  </div>
                ) : (
                  pendingEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className="rounded-[24px] bg-[#f6faff] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-lg font-black text-[#132b57]">{event.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{event.creator?.fullName || event.creator?.email || 'Chưa rõ đơn vị tạo'}</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{event.status}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{formatDateTime(event.startTime)} • {event.location}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </section>

          <section className="space-y-5">
            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#132b57]">Quản lý tài khoản</h3>
                  <p className="text-sm text-slate-500">Theo dõi số lượng người dùng và tình trạng vận hành thực tế từ database.</p>
                </div>
              </div>
              <div className="mt-5 rounded-[24px] bg-[#f6faff] p-4">
                <p className="text-sm text-slate-500">Tài khoản hoạt động</p>
                <p className="mt-2 text-3xl font-black text-[#132b57]">{activeAccounts}</p>
              </div>
              <Link to="/admin/users" className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]">
                Mở quản lý tài khoản
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <h3 className="text-xl font-black text-[#132b57]">Nhắc việc cho quản trị viên</h3>
              <div className="mt-4 space-y-3">
                {reminders.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex gap-3 rounded-2xl bg-[#f6faff] p-4">
                    <div className="rounded-2xl bg-white p-3 text-[#1747a6]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
