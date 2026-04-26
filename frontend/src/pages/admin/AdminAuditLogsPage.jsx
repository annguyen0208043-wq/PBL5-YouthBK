import React from 'react';
import { FileClock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { auditLogs } from '../../shared/admin/adminData';

function levelTone(level) {
  if (level === 'Cao') return 'bg-rose-100 text-rose-700';
  if (level === 'Trung bình') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

export default function AdminAuditLogsPage() {
  return (
    <AdminLayout
      currentPath="/admin/audit-logs"
      title="Nhật ký hoạt động"
      subtitle="Theo dõi các thao tác quản trị quan trọng để kiểm soát thay đổi và phục vụ rà soát nghiệp vụ."
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          {auditLogs.map((item) => (
            <motion.div key={item.id} whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-[#132b57]">{item.action}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.actor} • {item.role}</p>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${levelTone(item.level)}`}>{item.level}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{item.time}</p>
            </motion.div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <FileClock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Mục đích nhật ký</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Ghi nhận các thao tác như duyệt sự kiện, cấp quyền, khóa tài khoản và cập nhật cấu hình để đảm bảo minh bạch.</p>
              </div>
            </div>
          </div>

          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#edfdf3] p-3 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Khuyến nghị sử dụng</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Kiểm tra lại log sau khi phân quyền hoặc thay đổi cấu hình lớn.</li>
                  <li>Ưu tiên rà soát các thao tác có mức ảnh hưởng cao trong ngày.</li>
                  <li>Lưu log để phục vụ đối chiếu khi có khiếu nại hoặc sai lệch dữ liệu.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
