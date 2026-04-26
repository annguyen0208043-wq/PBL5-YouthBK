import React from 'react';
import { ArrowRight, BadgeCheck, CalendarDays, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import { lienChiEvidenceRequests, lienChiEvents, lienChiRegistrations, lienChiSummaryCards } from '../../shared/lienchi/lienChiData';

const summaryIcons = {
  'my-events': CalendarDays,
  'pending-evidences': BadgeCheck,
  'registered-students': ClipboardList,
};

export default function LienChiDashboardPage() {
  const totalRegistrations = Object.values(lienChiRegistrations).reduce((sum, list) => sum + list.length, 0);
  const highlightedEvent = lienChiEvents[0];

  return (
    <LienChiLayout
      currentPath="/lien-chi"
      title="Tổng quan liên chi"
      subtitle="Theo dõi các sự kiện của khoa, số lượng đăng ký và những hồ sơ minh chứng cần xử lý."
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {lienChiSummaryCards.map((card) => {
              const Icon = summaryIcons[card.id] || CalendarDays;
              return (
                <motion.div key={card.id} whileHover={{ y: -4 }} className="admin-summary-card profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="admin-summary-icon rounded-2xl bg-[#f4f8ff] p-3 text-[#1747a6]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="admin-summary-label text-sm text-slate-500">{card.label}</p>
                    <h2 className="mt-3 text-4xl font-black tracking-tight text-[#132b57]">{card.value}</h2>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1f5dcc]">Sự kiện ưu tiên</p>
                <h3 className="mt-2 text-2xl font-black text-[#132b57]">{highlightedEvent.title}</h3>
              </div>
              <Link to="/lien-chi/events/manage" className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-4 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
                Mở chi tiết
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[#f6faff] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Trạng thái</p>
                <p className="mt-2 font-semibold text-[#132b57]">{highlightedEvent.status}</p>
              </div>
              <div className="rounded-[24px] bg-[#f6faff] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Đăng ký hiện tại</p>
                <p className="mt-2 font-semibold text-[#132b57]">
                  {highlightedEvent.registrations}/{highlightedEvent.capacity} sinh viên
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">{highlightedEvent.note}</p>
          </motion.div>
        </section>

        <section className="space-y-5">
          <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
            <h3 className="text-xl font-black text-[#132b57]">Nhắc việc cần xử lý</h3>
            <div className="mt-4 space-y-3">
              {[
                `${lienChiEvidenceRequests.filter((item) => item.status === 'Chờ duyệt').length} minh chứng đang chờ duyệt.`,
                `${lienChiEvents.filter((item) => item.status === 'Cần chỉnh sửa').length} sự kiện bị trả về cần bổ sung hồ sơ.`,
                `${totalRegistrations} lượt đăng ký đang được liên chi theo dõi.`,
              ].map((text) => (
                <div key={text} className="rounded-2xl bg-[#f6faff] p-4 text-sm leading-6 text-slate-600">
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
            <h3 className="text-xl font-black text-[#132b57]">Truy cập nhanh</h3>
            <div className="mt-4 grid gap-3">
              <Link to="/lien-chi/events/create" className="rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]">
                Tạo hồ sơ sự kiện mới
              </Link>
              <Link to="/lien-chi/registrations" className="rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]">
                Quản lý danh sách đăng ký
              </Link>
              <Link to="/lien-chi/evidences" className="rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]">
                Duyệt minh chứng sinh viên
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </LienChiLayout>
  );
}
