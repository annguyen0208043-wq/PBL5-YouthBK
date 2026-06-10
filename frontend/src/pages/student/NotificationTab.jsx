import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Bell, Clock, User, CheckCircle2, X } from 'lucide-react';
import useSocket from '../../hooks/useSocket';
import Badge from './Badge';

const API_BASE = '/api/notifications';

export default function NotificationTab() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(resp.data.notifications || []);
    } catch (err) {
      console.error('fetchNotifications', err.message);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE}/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(resp.data.unreadCount || 0);
    } catch (err) {
      console.error('fetchUnreadCount', err.message);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchNotifications();
      await fetchUnreadCount();
    })();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleNewNotification = useCallback((payload) => {
    setNotifications((prev) => [{ ...payload, isRead: false }, ...prev]);
    setUnreadCount((c) => c + 1);
  }, []);

  const handleNotificationRead = useCallback((payload) => {
    const { notificationId } = payload || {};
    if (!notificationId) return;
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const { emit } = useSocket(handleNewNotification, handleNotificationRead);

  const markAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/${notification.id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      emit('mark_as_read', { notificationId: notification.id });
    } catch (err) {
      console.error('markAsRead', err.message);
    }
  };

  const handleOpenNotification = (n) => {
    setSelectedNotification(n);
    if (!n.isRead) {
      markAsRead(n);
    }
  };

  const closeModal = () => setSelectedNotification(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
  };

  return (
    <>
      <section className="profile-panel min-h-[600px] rounded-[32px] border border-[#dce8f5] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1747a6]">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#132b57]">Thông báo hệ thống</h3>
              <p className="mt-1 text-sm text-slate-500">Cập nhật các hoạt động mới nhất</p>
            </div>
          </div>
          <Badge count={unreadCount} />
        </div>

        <div className="mt-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                <CheckCircle2 className="h-10 w-10 text-slate-300" />
              </div>
              <p className="mt-4 font-semibold text-slate-600">Chưa có thông báo nào</p>
              <p className="mt-1 text-sm text-slate-400">Bạn đã xem hết tất cả thông báo.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleOpenNotification(n)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                  n.isRead
                    ? 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-md'
                    : 'border-blue-200 bg-[#f8fbff] shadow-sm hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Dấu chấm đỏ báo chưa đọc */}
                {!n.isRead && (
                  <div className="absolute right-5 top-5 h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-50"></div>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`mt-1 hidden shrink-0 sm:block ${n.isRead ? 'text-slate-400' : 'text-[#1f5dcc]'}`}>
                    <Bell className="h-5 w-5" />
                  </div>

                  <div className="flex-1 pr-6">
                    {/* Meta info (Header) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-[#132b57]">{n.sender?.name || 'Hệ thống'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(n.createdAt)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className={`mt-3 line-clamp-1 text-lg transition-colors ${n.isRead ? 'font-bold text-slate-800' : 'font-black text-[#132b57]'}`}>
                      {n.title}
                    </h4>

                    {/* Preview Content */}
                    <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-slate-600">
                      {n.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal / Panel hiển thị chi tiết thông báo */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
              <h3 className="text-xl font-black text-[#132b57]">Chi tiết thông báo</h3>
              <button 
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-[#1f5dcc]">
                  <User className="h-4 w-4" />
                  <span>{selectedNotification.sender?.name || 'Hệ thống'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(selectedNotification.createdAt)}</span>
                </div>
              </div>

              <h2 className="text-2xl font-black leading-tight text-[#132b57]">
                {selectedNotification.title}
              </h2>

              <div className="mt-6 rounded-2xl bg-[#f8fbff] p-5 sm:p-6 border border-[#eef6ff]">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                  {selectedNotification.content}
                </p>
              </div>
            </div>
            
            {/* Footer Modal */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8 flex justify-end">
              <button 
                onClick={closeModal}
                className="rounded-2xl bg-[#1f5dcc] px-6 py-2.5 font-bold text-white transition-all hover:bg-[#132b57] hover:shadow-lg"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
