import React, { useState } from 'react';
import { Save, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { systemSettings } from '../../shared/admin/adminData';

export default function AdminSystemSettingsPage() {
  const [notice, setNotice] = useState('');

  return (
    <AdminLayout
      currentPath="/admin/settings"
      title="Cấu hình hệ thống"
      subtitle="Thiết lập học kỳ, quy định đăng ký, điểm danh và hạn nộp minh chứng cho toàn hệ thống."
    >
      <div className="grid gap-5">
        {notice && <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

        <div className="grid gap-5 xl:grid-cols-2">
          {systemSettings.map((item) => (
            <motion.div key={item.id} whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#132b57]">{item.label}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
              <input
                defaultValue={item.value}
                className="mt-4 w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
              />
            </motion.div>
          ))}
        </div>

        <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setNotice('Đã lưu thay đổi cấu hình hệ thống.')} className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]">
              <Save className="h-5 w-5" />
              Lưu cấu hình
            </button>
            <button type="button" className="rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]">
              Khôi phục mặc định
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
