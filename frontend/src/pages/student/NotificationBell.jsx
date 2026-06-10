import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import axios from 'axios';
import useSocket from '../../hooks/useSocket';
import Badge from './Badge';

const API_BASE = '/api/notifications';

/**
 * NotificationBell — icon chuông hiển thị ở góc trên bên phải header.
 * Hiển thị badge số thông báo chưa đọc.
 * Click → điều hướng tới /sinhvien/profile?tab=notifications
 */
export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newCount, setNewCount] = useState(0); // dùng cho Badge toast

  // Lấy số thông báo chưa đọc từ API
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE}/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(resp.data.unreadCount || 0);
    } catch (err) {
      console.error('NotificationBell fetchUnreadCount', err.message);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Socket handlers
  const handleNewNotification = useCallback(() => {
    setUnreadCount((c) => c + 1);
    setNewCount((c) => c + 1);
    // Reset toast counter sau 6s
    setTimeout(() => setNewCount(0), 6000);
  }, []);

  const handleNotificationRead = useCallback(() => {
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  useSocket(handleNewNotification, handleNotificationRead);

  return (
    <>
      {/* Badge toast popup — hiệu ứng thông báo mới */}
      <Badge count={newCount} />

      <button
        onClick={() => navigate('/sinhvien/notifications')}
        className="relative flex items-center justify-center rounded-2xl border border-[#dce8f5] bg-[#f7fbff] p-3 transition-all hover:bg-[#eef6ff] hover:shadow-md"
        aria-label="Xem thông báo"
        title="Thông báo"
      >
        <Bell className="h-5 w-5 text-[#1747a6]" />

        {/* Badge đỏ nhỏ hiển thị số chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
