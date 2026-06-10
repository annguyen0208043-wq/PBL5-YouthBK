import React from 'react';
import { Calendar, Mail, Bell } from 'lucide-react';

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export default function RecentActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Chưa có hoạt động nào
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-4">
      {activities.map((act) => {
        const Icon = act.type === 'event' ? Calendar : act.type === 'notification' ? Mail : Bell;
        const colorClass = act.type === 'event' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600';
        
        return (
          <div key={act.id} className="relative pl-6">
            <div className={`absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white ${colorClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-semibold text-[#132b57]">{act.title}</p>
              <p className="text-xs text-slate-500 mt-1">{formatDateTime(act.time)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
