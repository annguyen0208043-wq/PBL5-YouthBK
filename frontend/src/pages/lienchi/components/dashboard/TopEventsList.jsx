import React from 'react';
import { Trophy, Users } from 'lucide-react';

export default function TopEventsList({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Chưa có sự kiện nào
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={event.id} className="flex items-center justify-between rounded-2xl bg-[#f8fbff] p-4 transition-colors hover:bg-[#eef6ff]">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              {idx === 0 ? <Trophy className="h-4 w-4" /> : idx + 1}
            </div>
            <div>
              <h4 className="font-bold text-[#132b57] line-clamp-1" title={event.title}>{event.title}</h4>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{event.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-blue-100 text-sm font-bold text-[#1f5dcc]">
            <Users className="h-3.5 w-3.5" />
            {event.participants} {event.maxParticipants ? `/ ${event.maxParticipants}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
