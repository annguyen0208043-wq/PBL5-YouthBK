import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import useSocket from '../../hooks/useSocket';
import Badge from './Badge';

const API_BASE = 'http://localhost:5000/api/notifications';

export default function NotificationTab() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE}/mine`, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleNewNotification = (payload) => {
    // payload expected: {id,title,content,createdAt}
    setNotifications((prev) => [{ ...payload, isRead: false }, ...prev]);
    setUnreadCount((c) => c + 1);
    // simple toast

  };

  const handleNotificationRead = (payload) => {
    const { notificationId } = payload || {};
    if (!notificationId) return;
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const { emit } = useSocket(handleNewNotification, handleNotificationRead);

  const markAsRead = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/${notification.id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      // also notify server via socket
      emit('mark_as_read', { notificationId: notification.id });
    } catch (err) {
      console.error('markAsRead', err.message);
    }
  };

  return (
    <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold">Thông báo</h3>
        <Badge count={unreadCount} />
      </div>

      <ul className="mt-4 space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className={`p-3 border rounded ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{n.title}</div>
                <div className="text-sm text-slate-600">{n.content}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.isRead && (
                <button onClick={() => markAsRead(n)} className="ml-4 rounded bg-[#1f5dcc] px-3 py-1 text-white">Đánh dấu đã đọc</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
