import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (onNewNotification, onNotificationRead) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // console.log('socket connected', socket.id);
    });

    socket.on('new_notification', (payload) => {
      if (onNewNotification) onNewNotification(payload);
    });

    socket.on('notification_read', (payload) => {
      if (onNotificationRead) onNotificationRead(payload);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error', err.message);
    });

    return () => {
      try {
        socket.disconnect();
      } catch (e) {}
    };
  }, [onNewNotification, onNotificationRead]);

  const emit = (event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  };

  return { emit, socket: socketRef.current };
};

export default useSocket;
