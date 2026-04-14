import React, { useState } from 'react';
import { CalendarRange, FileImage, Plus, Save } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminCreateEventPage() {
  const [notice, setNotice] = useState('');

  return (
    <AdminLayout
      currentPath="/admin/events/create"
      title="Tạo sự kiện"
      subtitle="Đoàn trường khởi tạo sự kiện mới, thiết lập thông tin, timeline và điều kiện tham gia theo đúng luồng UC004."
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
          {notice && <div className="mb-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên sự kiện</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nhập tên sự kiện" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Chủ đề</span>
                <select className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]">
                  <option>Kỹ năng</option>
                  <option>Tình nguyện</option>
                  <option>Học thuật</option>
                  <option>Cộng đồng</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Chỉ tiêu tham gia</span>
                <input type="number" className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Ví dụ: 200" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Thời gian bắt đầu</span>
                <input type="datetime-local" className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Thời gian kết thúc</span>
                <input type="datetime-local" className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Địa điểm</span>
              <input className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Nhập địa điểm tổ chức" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả sự kiện</span>
              <textarea rows="6" className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" placeholder="Mô tả mục tiêu, nội dung và giá trị của sự kiện..." />
            </label>
          </div>
        </section>

        <section className="space-y-5">
          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <FileImage className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Ảnh bìa và tài liệu</h3>
                <p className="text-sm text-slate-500">Đính kèm poster, kế hoạch tổ chức và các tệp phục vụ duyệt sự kiện.</p>
              </div>
            </div>
            <div className="mt-4 rounded-[24px] border border-dashed border-[#b9d1ee] bg-[#f8fbff] px-4 py-8 text-center text-sm text-slate-500">
              Kéo thả ảnh `.jpg`, `.png` hoặc tài liệu kế hoạch vào đây
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <CalendarRange className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Timeline sự kiện</h3>
                <p className="text-sm text-slate-500">Thêm các mốc quan trọng để hệ thống và người tham gia theo dõi.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {[
                '07:30 - Check-in và ổn định lực lượng',
                '08:00 - Khai mạc chương trình',
                '10:30 - Tổng kết và giao nhiệm vụ tiếp theo',
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#f6faff] px-4 py-3 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </div>

            <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]">
              <Plus className="h-5 w-5" />
              Thêm mốc thời gian
            </button>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <h3 className="text-xl font-black text-[#132b57]">Thao tác</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => setNotice('Đã lưu nháp sự kiện mới.')} className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
                <Save className="h-5 w-5 text-[#1747a6]" />
                Lưu nháp
              </button>
              <button onClick={() => setNotice('Đã gửi hồ sơ sự kiện sang bước phê duyệt.')} className="rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
                Gửi duyệt sự kiện
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </AdminLayout>
  );
}
