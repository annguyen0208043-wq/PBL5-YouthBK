import React from 'react';
import { ArrowRight, Bell, CalendarClock, CheckCheck, ShieldAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { adminSummaryCards, pendingEvents, userAccounts } from '../../shared/admin/adminData';

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

export default function AdminDashboardPage() {
  const activeAccounts = userAccounts.filter((item) => item.status === 'Hoạt động').length;

  return (
    <AdminLayout
      currentPath="/admin"
      title="Tổng quan quản trị"
      subtitle="Theo dõi nhanh các đầu việc quan trọng của Đoàn trường theo đúng luồng nghiệp vụ trong SRS."
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {adminSummaryCards.map((card) => (
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
              {pendingEvents.slice(0, 2).map((event) => (
                <div key={event.id} className="rounded-[24px] bg-[#f6faff] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-black text-[#132b57]">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{event.unit}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{event.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{event.time} • {event.location}</p>
                </div>
              ))}
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
                <p className="text-sm text-slate-500">Theo dõi số lượng người dùng và phân quyền hoạt động.</p>
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
              {[
                { icon: CheckCheck, text: 'Duyệt các sự kiện chờ phản hồi từ Liên chi Đoàn.' },
                { icon: ShieldAlert, text: 'Kiểm tra các tài khoản vừa được cấp quyền quản trị.' },
                { icon: Bell, text: 'Gửi thông báo nhắc đơn vị bổ sung hồ sơ còn thiếu.' },
              ].map(({ icon: Icon, text }) => (
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
    </AdminLayout>
  );
}
