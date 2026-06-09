import { useEffect, useRef } from 'react';
import { connectSocket } from '../shared/student/socket';

const useSocket = (onNewNotification, onNotificationRead) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket();
    socketRef.current = socket;

    if (onNewNotification) {
      socket.on('new_notification', onNewNotification);
    }

    if (onNotificationRead) {
      socket.on('notification_read', onNotificationRead);
    }

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error', err.message);
    });

    return () => {
      if (onNewNotification) {
        socket.off('new_notification', onNewNotification);
      }
      if (onNotificationRead) {
        socket.off('notification_read', onNotificationRead);
      }
      // Do not disconnect the global socket here!
    };
  }, [onNewNotification, onNotificationRead]);

  const emit = (event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  };

  return { emit, socket: socketRef.current };
};

export default useSocket;
