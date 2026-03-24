import React from 'react';
import { motion } from 'framer-motion';

import { authPosterDecor, floatingBadges, studentCards } from '../../shared/auth/authData';

const { buildingIcon: Building2, footerIcon: Users } = authPosterDecor;

function FloatingBadge({ badge }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ duration: 3.6, delay: badge.delay, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute z-30 ${badge.right ? 'right-0' : 'left-0'}`}
      style={{ top: badge.top, transform: `translateX(${badge.offset})` }}
    >
      <div className="relative h-[74px] w-[74px]">
        <div className="absolute inset-0 translate-y-[8px] rounded-[24px] bg-[#b9c9da]" />
        <div className="absolute inset-[3px] rounded-[24px] border border-white/80 bg-white shadow-[0_16px_28px_rgba(15,23,42,0.16)]" />
        <div
          className={`absolute inset-[10px] flex items-center justify-center rounded-[20px] bg-gradient-to-br ${badge.color} px-1 text-[9px] font-black uppercase leading-tight tracking-[0.04em] text-white shadow-inner`}
        >
          {badge.label}
        </div>
        <div className="absolute right-[14px] top-[12px] h-2.5 w-2.5 rounded-full bg-white/60" />
      </div>
    </motion.div>
  );
}

function StudentFeatureCard({ card, index }) {
  const Icon = card.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.12 }}
      className={`relative rounded-[34px] border-4 border-[#1747a6] bg-[#1f5dcc] p-4 text-white shadow-[0_20px_30px_rgba(31,93,204,0.18)] ${
        index === 1 ? 'mt-10' : index === 2 ? 'mt-16' : 'mt-2'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
          <Icon className="h-6 w-6" />
        </div>
        <div className="h-8 w-8 rounded-full bg-[#ffdb4d]" />
      </div>
      <div className="rounded-[22px] bg-white px-3 py-4 text-center text-sm font-bold text-[#17356b] shadow-inner">
        {card.label}
      </div>
    </motion.div>
  );
}

export default function AuthShowcase({ title, subtitle, footerTitle = 'Đồng hành và phát triển' }) {
  return (
    <section className="auth-showcase relative hidden w-[54%] overflow-hidden border-r border-[#d7e7f7] bg-white lg:block">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_54%,#e9f4ff_54%,#e9f4ff_100%)]" />
      <div className="absolute -left-20 bottom-16 h-72 w-72 rounded-full bg-[#2f80ed]" />
      <div className="absolute left-24 top-32 h-72 w-72 rounded-full bg-[#caebff]" />
      <div className="absolute right-[-80px] top-20 h-[420px] w-[420px] rotate-[22deg] rounded-[100px] bg-[#c9f5d8]" />
      <div className="absolute right-14 top-36 h-72 w-72 rounded-[48px] border-[16px] border-[#9bd3ff] opacity-60" />

      {floatingBadges.map((badge) => (
        <FloatingBadge key={badge.label} badge={badge} />
      ))}

      <div className="relative z-10 flex h-full flex-col justify-between px-14 py-10">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-xl"
        >
          <p className="mb-4 inline-flex rounded-full bg-[#eaf4ff] px-4 py-2 text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">
            BK-Youth
          </p>
          <h1 className="text-[42px] font-black uppercase leading-tight tracking-tight text-[#132b57]">
            {title}
          </h1>
          <p className="mt-3 text-lg font-semibold text-[#2f80ed]">{subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative mx-auto my-8 flex w-full max-w-[620px] items-end justify-center"
        >
          <div className="absolute bottom-10 left-8 h-32 w-32 rounded-[28px] bg-white/80 shadow-md" />
          <div className="absolute bottom-24 left-10 flex h-24 w-24 items-center justify-center rounded-[26px] bg-[#2f80ed] text-white shadow-lg">
            <Building2 className="h-12 w-12" />
          </div>
          <div className="absolute bottom-16 right-14 flex h-36 w-28 items-center justify-center rounded-[30px] bg-[#65b8ff] text-white shadow-lg">
            <Building2 className="h-12 w-12" />
          </div>
          <div className="absolute bottom-20 right-40 flex h-44 w-32 items-center justify-center rounded-[34px] bg-[#3794ff] text-white shadow-lg">
            <Building2 className="h-14 w-14" />
          </div>

          <div className="relative z-10 mt-14 grid w-full grid-cols-3 gap-4">
            {studentCards.map((card, index) => (
              <StudentFeatureCard key={card.label} card={card} index={index} />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-[#d9e5f2]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#44a8ff] text-[#1f5dcc]">
                <Users className="h-8 w-8" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f80ed]">Cộng đồng sinh viên</p>
              <p className="mt-1 text-[34px] font-black uppercase leading-tight text-[#132b57]">{footerTitle}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

