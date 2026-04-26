import React, { useState } from 'react';
import { BellRing, MailPlus, Send } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { adminNotifications } from '../../shared/admin/adminData';

function statusTone(status) {
  return status === 'Đã gửi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
}

export default function AdminNotificationsPage() {
  const [notice, setNotice] = useState('');

  return (
    <AdminLayout
      currentPath="/admin/notifications"
      title="Thông báo hệ thống"
      subtitle="Quản trị viên gửi nhắc việc, thông báo nghiệp vụ và điều phối thông tin đến các nhóm người dùng."
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
              <MailPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#132b57]">Tạo thông báo mới</h2>
              <p className="text-sm text-slate-500">Dùng cho thông báo hệ thống, email nội bộ hoặc nhắc đơn vị bổ sung hồ sơ.</p>
            </div>
          </div>

          {notice && <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề thông báo</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nhập tiêu đề thông báo" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nhóm nhận</span>
              <select className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]">
                <option>Sinh viên toàn trường</option>
                <option>Liên chi Đoàn</option>
                <option>Cán bộ Đoàn - Hội</option>
                <option>Tài khoản quản trị</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nội dung</span>
              <textarea rows="6" className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nhập nội dung cần gửi..." />
            </label>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setNotice('Đã lưu lịch gửi thông báo thành công.')} className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
                <Send className="h-5 w-5" />
                Gửi thông báo
              </button>
              <button type="button" className="rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
                Lưu bản nháp
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {adminNotifications.map((item) => (
            <motion.div key={item.id} whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-[#132b57]">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.audience}</p>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(item.status)}`}>{item.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-[#f6faff] px-3 py-1 font-semibold text-[#1747a6]">{item.channel}</span>
                <span>{item.sentAt}</span>
              </div>
            </motion.div>
          ))}

          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <BellRing className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Lưu ý vận hành</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Ưu tiên thông báo theo nhóm đối tượng rõ ràng để tránh trùng lặp và giúp cán bộ dễ theo dõi xử lý nghiệp vụ.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
