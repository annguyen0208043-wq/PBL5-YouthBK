import React, { useState, useEffect } from 'react';

export default function Badge({ count }) {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setShouldRender(true);
      // Chờ một chút để React render DOM rồi mới chạy hiệu ứng mở (transition)
      const openTimer = setTimeout(() => setVisible(true), 10);

      // Tự động kích hoạt hiệu ứng đóng sau 5 giây (5000ms)
      const closeTimer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
      };
    } else {
      setVisible(false);
    }
  }, [count]);

  // Khi hiệu ứng đóng hoàn tất, chính thức xóa component khỏi DOM
  const handleTransitionEnd = () => {
    if (!visible) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.9)',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Box thông báo chuẩn Style UI BK-Youth */}
      <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl shadow-xl p-4 min-w-[300px]">
        
        {/* Icon Chuông & Badge số lượng màu đỏ */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          
          {/* Badge đè góc nhỏ xinh */}
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white ring-2 ring-white">
            {count}
          </span>
        </div>

        {/* Nội dung text */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-800">Thông báo mới</h4>
          <p className="text-xs text-slate-500 mt-0.5">Bạn có {count} hoạt động chưa xem.</p>
        </div>

        {/* Nút đóng chủ động (X) */}
        <button 
          onClick={() => setVisible(false)} 
          className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

      </div>
    </div>
  );
}