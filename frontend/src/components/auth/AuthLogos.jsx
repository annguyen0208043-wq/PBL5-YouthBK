import React from 'react';

import { authPosterDecor, DOAN_LOGO_SRC, SCHOOL_LOGO_SRC } from '../../shared/auth/authData';

const { fallbackLogoIcon: Shield } = authPosterDecor;

export function BachKhoaLogo() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      {SCHOOL_LOGO_SRC ? (
        <img src={SCHOOL_LOGO_SRC} alt="Logo Trường Bách Khoa" className="h-12 w-12 object-contain" />
      ) : (
        <div className="relative h-12 w-12 overflow-hidden rounded-md border-[3px] border-yellow-400 bg-[#1428bf]">
          <div className="absolute inset-y-0 left-0 w-[38%] bg-white" />
          <div className="absolute left-[5px] top-[2px] text-[7px] font-bold tracking-[0.42em] text-[#1428bf]">Đ</div>
          <div className="absolute left-[5px] top-[14px] text-[7px] font-bold leading-[1.25] tracking-[0.33em] text-[#1428bf]">
            N
            <br />
            Ẵ
            <br />
            N
            <br />
            G
          </div>
          <div className="absolute right-[-6px] top-[-8px] h-[68px] w-[50px] rounded-full border-[9px] border-yellow-300 border-b-transparent border-l-transparent rotate-[18deg]" />
        </div>
      )}
    </div>
  );
}

export function DoanLogo() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
      {DOAN_LOGO_SRC ? (
        <img src={DOAN_LOGO_SRC} alt="Logo Đoàn Thanh niên" className="h-11 w-11 object-contain" />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white">
          <Shield className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

