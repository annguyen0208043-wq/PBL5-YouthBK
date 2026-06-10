import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    blue: 'bg-[#f4f8ff] text-[#1747a6]',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[24px] border border-[#dce8f5] bg-white p-5 flex flex-col justify-between">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-3 ${colorStyles[color] || colorStyles.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <h3 className="mt-1 text-3xl font-black text-[#132b57]">{value}</h3>
      </div>
    </motion.div>
  );
}
