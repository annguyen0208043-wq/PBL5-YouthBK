import React from 'react';
import { Mail, CheckCircle2, Send } from 'lucide-react';

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
  });
}

export default function NotificationStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="flex-1 rounded-2xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Send className="h-5 w-5" />
            <span className="font-bold text-sm">Đã gửi</span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-700">{stats.totalNotifications}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-bold text-sm">Tỷ lệ đọc</span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{stats.readRate}%</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Thông báo gần đây</h4>
        <div className="space-y-3">
          {stats.recent && stats.recent.length > 0 ? (
            stats.recent.map(n => (
              <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3">
                <div className="rounded-xl bg-slate-50 p-2 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-semibold text-[#132b57]" title={n.title}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(n.createdAt)} • {n.readCount}/{n.recipientCount} đã đọc</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Chưa có thông báo nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
