import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  LogOut,
  MailPlus,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  SendHorizontal,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import {
  addMembers,
  createDirectConversation,
  createGroupConversation,
  fetchConversations,
  fetchInvitations,
  fetchMessages,
  fetchProfile,
  inviteMember,
  respondInvitation,
  searchChatUsers,
  sendMessage,
  markAsRead,
} from '../../shared/student/chatApi';
import { connectSocket, disconnectSocket, getSocket } from '../../shared/student/socket';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';
import NotificationBell from './NotificationBell';

function Avatar({ name = 'SV', src, size = 'h-11 w-11', rounded = 'rounded-2xl' }) {
  return src ? (
    <img src={src} alt={name} className={`${size} ${rounded} shrink-0 object-cover`} />
  ) : (
    <div className={`${size} ${rounded} flex shrink-0 items-center justify-center bg-[linear-gradient(135deg,#1747a6,#20a4a9)] text-sm font-black text-white shadow-sm`}>
      {getUserInitials(name || 'SV')}
    </div>
  );
}

function normalizeUser(user) {
  return {
    id: user?.id,
    name: user?.name || user?.fullName || 'Sinh viên',
    email: user?.email || '',
    studentId: user?.studentId || '',
    avatar: user?.avatar || user?.avatarUrl || '',
    role: user?.role || '',
  };
}

function getConversationTitle(conversation, currentUserId) {
  if (!conversation) return '';
  if (conversation.type === 'group') return conversation.name;
  const otherMember = conversation.members?.find((member) => member.userId !== currentUserId);
  return otherMember?.user?.name || conversation.name;
}

function getConversationSubtitle(conversation, currentUserId) {
  if (!conversation) return '';
  if (conversation.type === 'group') return `${conversation.members?.length || 0} thành viên`;
  const otherMember = conversation.members?.find((member) => member.userId !== currentUserId);
  const user = otherMember?.user;
  return [user?.studentId, user?.email].filter(Boolean).join(' · ');
}

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export default function StudentChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const messagesEndRef = useRef(null);
  const storedUser = getStoredUserProfile();

  const [currentUser, setCurrentUser] = useState(normalizeUser(storedUser));
  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [search, setSearch] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [draftsByConversation, setDraftsByConversation] = useState({});
  const [isThreadListCollapsed, setIsThreadListCollapsed] = useState(false);
  const [mode, setMode] = useState('chat');
  const [directIdentifier, setDirectIdentifier] = useState('');
  const [groupName, setGroupName] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [activeConversationId, conversations]
  );
  const activeMessages = messagesByConversation[activeConversationId] || [];

  const visibleConversations = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const title = getConversationTitle(conversation, currentUser.id).toLowerCase();
      const subtitle = getConversationSubtitle(conversation, currentUser.id).toLowerCase();
      const preview = conversation.lastMessage?.content?.toLowerCase() || '';
      return !normalized || title.includes(normalized) || subtitle.includes(normalized) || preview.includes(normalized);
    });
  }, [conversations, currentUser.id, search]);

  const isOwner = activeConversation?.members?.some((member) => member.userId === currentUser.id && member.role === 'owner');

  async function loadConversations(keepSelection = true) {
    const data = await fetchConversations();
    setConversations(data);
    if (!keepSelection || !activeConversationId) {
      setActiveConversationId(data[0]?.id || null);
    }
    return data;
  }

  async function loadInvitations() {
    const data = await fetchInvitations();
    setInvitations(data);
  }

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const profile = await fetchProfile();
        if (!mounted) return;
        setCurrentUser(normalizeUser(profile));
        const data = await fetchConversations();
        const invites = await fetchInvitations();
        if (!mounted) return;
        setConversations(data);
        setInvitations(invites);
        setActiveConversationId(data[0]?.id || null);
      } catch (error) {
        setStatusMessage(error.response?.data?.message || 'Không tải được dữ liệu chat');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket();
    const handleMessage = ({ conversationId, message }) => {
      setMessagesByConversation((current) => {
        const list = current[conversationId] || [];
        // if server message already exists, skip
        if (list.some((item) => item.id === message.id)) return current;

        // try to replace a pending optimistic message (match by content + sender)
        const pendingIndex = list.findIndex((item) => item.status === 'pending' && item.senderId === message.senderId && item.content === message.content);
        if (pendingIndex !== -1) {
          const copy = [...list];
          copy[pendingIndex] = message;
          return { ...current, [conversationId]: copy };
        }

        return { ...current, [conversationId]: [...list, message] };
      });
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, lastMessage: message, updatedAt: message.createdAt }
            : conversation
        )
      );
    };
    const handleRead = ({ conversationId, userId, messageId }) => {
      // clear unread badge for that conversation in the UI
      setConversations((current) => current.map((conversation) => (conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation)));

      // mark messages as seen if the other user read them
      setMessagesByConversation((current) => {
        const list = current[conversationId] || [];
        if (!messageId) return current;
        const copy = list.map((m) => {
          if (m.senderId === currentUser.id && m.id && m.id <= messageId) return { ...m, seen: true };
          return m;
        });
        return { ...current, [conversationId]: copy };
      });
    };
    const handleTyping = ({ conversationId, userId, isTyping }) => {
      setTypingUsers((current) => ({ ...current, [`${conversationId}:${userId}`]: isTyping }));
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;

    const socket = getSocket();
    socket.emit('conversation:join', { conversationId: activeConversationId });

    async function loadMessages() {
      try {
        const data = await fetchMessages(activeConversationId);
        setMessagesByConversation((current) => ({ ...current, [activeConversationId]: data }));
      } catch (error) {
        setStatusMessage(error.response?.data?.message || 'Không tải được tin nhắn');
      }
    }

    loadMessages();
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages.length, activeConversationId]);

  useEffect(() => {
    const query = memberSearch.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const data = await searchChatUsers(query);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [memberSearch]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openConversation = async (conversationId) => {
    console.debug('[chat] openConversation', { conversationId });
    setActiveConversationId(conversationId);
    setMode('chat');

    // immediately join and load messages to avoid UI lag/blank state
    try {
      const socket = getSocket();
      if (socket && socket.connected) socket.emit('conversation:join', { conversationId });
    } catch (e) { }

    try {
      const data = await fetchMessages(conversationId);
      setMessagesByConversation((current) => ({ ...current, [conversationId]: data }));
      // ensure updated conversation lastMessage/read status
      setConversations((current) => current.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));

      // mark as read (REST) and notify others with last message id
      try {
        const newest = data[data.length - 1];
        await markAsRead(conversationId);
        const socket = getSocket();
        if (socket && socket.connected) socket.emit('chat:read', { conversationId, messageId: newest?.id || null });
      } catch (e) {
        // ignore
      }

      // scroll to bottom after messages inserted
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    } catch (err) {
      console.warn('[chat] load messages failed', err);
    }
  };



  const startDirectChat = async () => {
    if (!directIdentifier.trim()) return;
    try {
      const conversation = await createDirectConversation(directIdentifier.trim());
      const data = await loadConversations(false);
      setActiveConversationId(conversation.id || data[0]?.id || null);
      setDirectIdentifier('');
      setStatusMessage('Đã mở cuộc trò chuyện cá nhân');
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Không tạo được chat cá nhân');
    }
  };

  const toggleSelectedMember = (user) => {
    setSelectedMembers((current) => {
      if (current.some((item) => item.id === user.id)) return current.filter((item) => item.id !== user.id);
      return [...current, user];
    });
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const conversation = await createGroupConversation({
        name: groupName.trim(),
        memberIds: selectedMembers.map((member) => member.id),
      });
      await loadConversations(false);
      setActiveConversationId(conversation.id);
      setGroupName('');
      setMemberSearch('');
      setSelectedMembers([]);
      setMode('chat');
      setStatusMessage('Đã tạo nhóm chat');
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Không tạo được nhóm');
    }
  };

  const addSelectedMembers = async () => {
    if (!activeConversation || selectedMembers.length === 0) return;
    try {
      const conversation = await addMembers(activeConversation.id, selectedMembers.map((member) => member.id));
      setConversations((current) => current.map((item) => (item.id === conversation.id ? conversation : item)));
      setSelectedMembers([]);
      setMemberSearch('');
      setStatusMessage('Đã thêm thành viên');
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Không thêm được thành viên');
    }
  };

  const sendInvite = async () => {
    if (!activeConversation || !inviteIdentifier.trim()) return;
    try {
      await inviteMember(activeConversation.id, {
        identifier: inviteIdentifier.trim(),
        message: inviteNote.trim(),
      });
      setInviteIdentifier('');
      setInviteNote('');
      setStatusMessage('Đã gửi lời mời tham gia nhóm');
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Không gửi được lời mời');
    }
  };

  const answerInvitation = async (invitationId, action) => {
    try {
      await respondInvitation(invitationId, action);
      await Promise.all([loadInvitations(), loadConversations(false)]);
      setStatusMessage(action === 'accepted' ? 'Đã tham gia nhóm' : 'Đã từ chối lời mời');
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Không phản hồi được lời mời');
    }
  };

  const sendCurrentMessage = async () => {
    const content = draftMessage.trim();
    if (!activeConversationId || !content) return;
    setDraftMessage('');
    const hasFiles = attachments && attachments.length > 0;
    // save draft removal for this conversation
    setDraftsByConversation((cur) => {
      const copy = { ...cur };
      delete copy[activeConversationId];
      try { localStorage.setItem('chat:drafts', JSON.stringify(copy)); } catch { };
      return copy;
    });

    // optimistic message
    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      senderId: currentUser.id,
      sender: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
      content,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (hasFiles) {
      // include simple preview info
      tempMsg.attachments = attachments.map((f) => ({ name: f.name, preview: f.preview || '', size: f.size, type: f.type }));
    }

    setMessagesByConversation((current) => {
      const list = current[activeConversationId] || [];
      return { ...current, [activeConversationId]: [...list, tempMsg] };
    });
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversationId ? { ...conversation, lastMessage: tempMsg, updatedAt: tempMsg.createdAt } : conversation
      )
    );

    const socket = getSocket();
    if (!hasFiles && socket && socket.connected) {
      socket.emit('chat:message', { conversationId: activeConversationId, content }, async (response) => {
        if (response?.ok) {
          const serverMsg = response.message;
          // replace temp
          setMessagesByConversation((current) => {
            const list = current[activeConversationId] || [];
            const copy = list.map((m) => (m.id === tempId ? serverMsg : m));
            return { ...current, [activeConversationId]: copy };
          });
          setConversations((current) => current.map((c) => (c.id === activeConversationId ? { ...c, lastMessage: serverMsg, updatedAt: serverMsg.createdAt } : c)));
        } else {
          // fallback to REST
          try {
            const data = await sendMessage(activeConversationId, content);
            setMessagesByConversation((current) => {
              const list = current[activeConversationId] || [];
              const copy = list.map((m) => (m.id === tempId ? data : m));
              return { ...current, [activeConversationId]: copy };
            });
            setConversations((current) => current.map((c) => (c.id === activeConversationId ? { ...c, lastMessage: data, updatedAt: data.createdAt } : c)));
          } catch (err) {
            // mark failed
            setMessagesByConversation((current) => {
              const list = current[activeConversationId] || [];
              const copy = list.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m));
              return { ...current, [activeConversationId]: copy };
            });
            setStatusMessage(response?.message || 'Không gửi được tin nhắn');
          }
        }
      });
      return;
    }

    // If attachments present, send multipart/form-data to upload endpoint
    if (hasFiles) {
      try {
        const form = new FormData();
        form.append('content', content);
        attachments.forEach((file) => form.append('files', file.raw));
        const serverMsg = await uploadMessage(activeConversationId, form);
        // replace temp
        setMessagesByConversation((current) => {
          const list = current[activeConversationId] || [];
          const copy = list.map((m) => (m.id === tempId ? serverMsg : m));
          return { ...current, [activeConversationId]: copy };
        });
        setConversations((current) => current.map((c) => (c.id === activeConversationId ? { ...c, lastMessage: serverMsg, updatedAt: serverMsg.createdAt } : c)));
        setAttachments([]);
      } catch (err) {
        setMessagesByConversation((current) => {
          const list = current[activeConversationId] || [];
          const copy = list.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m));
          return { ...current, [activeConversationId]: copy };
        });
        setStatusMessage(err.response?.data?.message || 'Gửi file thất bại');
      }
      return;
    }

    // socket not connected -> use REST send
    try {
      const data = await sendMessage(activeConversationId, content);
      setMessagesByConversation((current) => {
        const list = current[activeConversationId] || [];
        const copy = list.map((m) => (m.id === tempId ? data : m));
        return { ...current, [activeConversationId]: copy };
      });
      setConversations((current) => current.map((c) => (c.id === activeConversationId ? { ...c, lastMessage: data, updatedAt: data.createdAt } : c)));
    } catch (err) {
      setMessagesByConversation((current) => {
        const list = current[activeConversationId] || [];
        const copy = list.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m));
        return { ...current, [activeConversationId]: copy };
      });
      setStatusMessage(err.response?.data?.message || 'Socket chưa kết nối, vui lòng thử lại');
    }
  };

  const retryMessage = async (message) => {
    if (!activeConversationId || message.status !== 'failed') return;
    const tempId = message.id;
    // set to pending
    setMessagesByConversation((current) => {
      const list = current[activeConversationId] || [];
      const copy = list.map((m) => (m.id === tempId ? { ...m, status: 'pending' } : m));
      return { ...current, [activeConversationId]: copy };
    });

    try {
      const data = await sendMessage(activeConversationId, message.content);
      setMessagesByConversation((current) => {
        const list = current[activeConversationId] || [];
        const copy = list.map((m) => (m.id === tempId ? data : m));
        return { ...current, [activeConversationId]: copy };
      });
      setConversations((current) => current.map((c) => (c.id === activeConversationId ? { ...c, lastMessage: data, updatedAt: data.createdAt } : c)));
    } catch (err) {
      setMessagesByConversation((current) => {
        const list = current[activeConversationId] || [];
        const copy = list.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m));
        return { ...current, [activeConversationId]: copy };
      });
      setStatusMessage(err.response?.data?.message || 'Gửi lại thất bại');
    }
  };

  const emitTyping = (value) => {
    setDraftMessage(value);
    // persist draft per conversation
    setDraftsByConversation((current) => {
      const copy = { ...current, [activeConversationId]: value };
      try { localStorage.setItem('chat:drafts', JSON.stringify(copy)); } catch { };
      return copy;
    });
    if (!activeConversationId) return;
    getSocket().emit('chat:typing', { conversationId: activeConversationId, isTyping: Boolean(value.trim()) });
  };

  // load drafts from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem('chat:drafts');
      if (raw) setDraftsByConversation(JSON.parse(raw) || {});
    } catch { }
  }, []);

  // when switching conversation, restore draft for it
  useEffect(() => {
    if (!activeConversationId) {
      setDraftMessage('');
      return;
    }
    setDraftMessage(draftsByConversation[activeConversationId] || '');
  }, [activeConversationId, draftsByConversation]);

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[28px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="app-sidebar hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Không gian sinh viên</p>
            </div>
          </div>

          <Link to="/sinhvien/profile" className="profile-user-chip mb-6 rounded-[22px] bg-white/10 p-4 backdrop-blur-md hover:bg-white/15 transition-all block text-white no-underline w-full min-w-0">
            <div className="flex items-center gap-3 w-full min-w-0">
              <Avatar name={currentUser.name} src={currentUser.avatar} size="h-14 w-14" />
              <div className="profile-user-meta">
                <p className="profile-user-name text-base font-bold text-white">{currentUser.name}</p>
                <p className="profile-user-subtitle text-sm text-blue-100/85">MSSV: {currentUser.studentId || '...'}</p>
              </div>
            </div>
          </Link>

          <nav className="space-y-2">
            <Link to="/sinhvien/event" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">Sự kiện của tôi</Link>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Chat sinh viên</div>
            <Link to="/sinhvien/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">Lịch sử hoạt động</Link>
            {['monitor', 'ban cán sự', 'ban can su'].includes(currentUser.role?.toLowerCase()) && (
              <Link to="/sinhvien/class-points" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
                Theo dõi điểm lớp
              </Link>
            )}
            <Link to="/sinhvien/notifications" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">Thông báo</Link>
          </nav>

          <button onClick={handleLogout} className="app-logout-button mt-auto flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all">
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </aside>

        <main ref={mainRef} className="app-main flex-1">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Chat sinh viên</h1>
                <p className="mt-1 text-slate-500">Tin nhắn cá nhân, nhóm học tập và lời mời tham gia nhóm.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setMode('chat')} className={`rounded-2xl px-4 py-3 text-sm font-bold ${mode === 'chat' ? 'bg-[#1747a6] text-white' : 'border border-[#dce8f5] bg-white text-[#132b57]'}`}>Chat</button>
                <button onClick={() => setMode('new')} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${mode === 'new' ? 'bg-[#1747a6] text-white' : 'border border-[#dce8f5] bg-white text-[#132b57]'}`}>
                  <Plus className="h-4 w-4" /> Tạo mới
                </button>
                <button onClick={() => setMode('invites')} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${mode === 'invites' ? 'bg-[#1747a6] text-white' : 'border border-[#dce8f5] bg-white text-[#132b57]'}`}>
                  <MailPlus className="h-4 w-4" /> Lời mời {invitations.length > 0 ? `(${invitations.length})` : ''}
                </button>
                <NotificationBell />
              </div>
            </div>
          </div>

          {statusMessage && (
            <button onClick={() => setStatusMessage('')} className="mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center justify-between rounded-2xl border border-[#bad7f5] bg-[#eef6ff] px-4 py-3 text-left text-sm font-semibold text-[#1747a6] sm:mx-8 sm:w-[calc(100%-4rem)]">
              <span>{statusMessage}</span>
              <X className="h-4 w-4" />
            </button>
          )}

          <div className={`grid h-[calc(100%-112px)] gap-0 ${isThreadListCollapsed ? 'xl:grid-cols-[1fr]' : 'xl:grid-cols-[380px_1fr]'}`}>
            {!isThreadListCollapsed && (
              <section className="flex min-h-0 flex-col border-r border-[#e5eef8] bg-white/85 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1f5dcc]">Hội thoại</p>
                    <p className="text-sm text-slate-500">{conversations.length} cuộc trò chuyện</p>
                  </div>
                  <button type="button" onClick={() => setIsThreadListCollapsed(true)} className="rounded-2xl border border-[#dce8f5] bg-white p-3 text-slate-500 transition-all hover:bg-[#eef6ff] hover:text-[#1747a6]" aria-label="Thu gọn danh sách">
                    <PanelLeftClose className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 focus-within:border-[#1f5dcc]">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Tìm hội thoại" />
                </div>

                <div className="chat-thread-list mt-5 space-y-3 pr-1">
                  {loading && <div className="chat-skeleton h-24" />}
                  {!loading && visibleConversations.map((conversation) => {
                    const title = getConversationTitle(conversation, currentUser.id);
                    const subtitle = getConversationSubtitle(conversation, currentUser.id);
                    const otherMember = conversation.members?.find((member) => member.userId !== currentUser.id);
                    const avatarUser = conversation.type === 'direct' ? otherMember?.user : null;
                    const preview = conversation.lastMessage?.content || 'Chưa có tin nhắn';

                    return (
                      <motion.button
                        key={conversation.id}
                        type="button"
                        whileHover={{ y: -2 }}
                        onClick={() => openConversation(conversation.id)}
                        className={`w-full rounded-[20px] border p-4 text-left transition-all ${activeConversationId === conversation.id ? 'border-[#8fb5ea] bg-[#eef6ff] shadow-[0_14px_32px_rgba(37,99,235,0.12)]' : 'border-[#dce8f5] bg-white hover:border-[#bad7f5]'}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar name={title} src={avatarUser?.avatar} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate font-bold text-[#132b57]">{title}</p>
                              <span className="shrink-0 text-xs text-slate-400">{formatTime(conversation.updatedAt)}</span>
                            </div>
                            <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5dcc]">{conversation.type === 'group' ? 'Nhóm' : 'Cá nhân'} · {subtitle}</p>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{preview}</p>
                          </div>
                          {conversation.unreadCount > 0 && <span className="chat-unread-badge ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1747a6] px-2 text-xs font-bold text-white">{conversation.unreadCount}</span>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="flex min-h-[720px] flex-col bg-[#f8fbff]">
              {mode === 'new' && (
                <div className="grid gap-5 p-6 lg:grid-cols-2">
                  <div className="rounded-[22px] border border-[#dce8f5] bg-white p-5">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-[#1747a6]" />
                      <h2 className="text-lg font-black text-[#132b57]">Chat cá nhân</h2>
                    </div>
                    <input value={directIdentifier} onChange={(event) => setDirectIdentifier(event.target.value)} className="mt-5 w-full rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 text-sm outline-none focus:border-[#1f5dcc]" placeholder="Nhập MSSV hoặc Gmail" />
                    <button onClick={startDirectChat} disabled={!directIdentifier.trim()} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300">
                      <SendHorizontal className="h-4 w-4" /> Mở chat
                    </button>
                  </div>

                  <div className="rounded-[22px] border border-[#dce8f5] bg-white p-5">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#1747a6]" />
                      <h2 className="text-lg font-black text-[#132b57]">Tạo nhóm</h2>
                    </div>
                    <input value={groupName} onChange={(event) => setGroupName(event.target.value)} className="mt-5 w-full rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 text-sm outline-none focus:border-[#1f5dcc]" placeholder="Tên nhóm" />
                    <input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} className="mt-3 w-full rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 text-sm outline-none focus:border-[#1f5dcc]" placeholder="Tìm thành viên bằng tên, MSSV, Gmail" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedMembers.map((member) => <span key={member.id} className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#1747a6]">{member.name}</span>)}
                    </div>
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button key={user.id} onClick={() => toggleSelectedMember(user)} className="flex w-full items-center justify-between rounded-2xl border border-[#e5eef8] px-3 py-2 text-left hover:bg-[#f8fbff]">
                          <span>
                            <span className="block text-sm font-bold text-[#132b57]">{user.name}</span>
                            <span className="text-xs text-slate-500">{user.studentId || user.email}</span>
                          </span>
                          {selectedMembers.some((item) => item.id === user.id) && <Check className="h-4 w-4 text-[#1747a6]" />}
                        </button>
                      ))}
                    </div>
                    <button onClick={createGroup} disabled={!groupName.trim()} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300">
                      <Plus className="h-4 w-4" /> Tạo nhóm
                    </button>
                  </div>
                </div>
              )}

              {mode === 'invites' && (
                <div className="p-6">
                  <h2 className="text-xl font-black text-[#132b57]">Lời mời tham gia nhóm</h2>
                  <div className="mt-5 space-y-3">
                    {invitations.length === 0 && <div className="rounded-[22px] border border-[#dce8f5] bg-white p-6 text-sm font-semibold text-slate-500">Chưa có lời mời mới.</div>}
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex flex-col gap-4 rounded-[22px] border border-[#dce8f5] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black text-[#132b57]">{invitation.conversation?.name}</p>
                          <p className="mt-1 text-sm text-slate-500">Từ {invitation.inviter?.name} · {formatDate(invitation.createdAt)}</p>
                          {invitation.message && <p className="mt-2 text-sm text-slate-600">{invitation.message}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => answerInvitation(invitation.id, 'accepted')} className="rounded-2xl bg-[#1747a6] px-4 py-2 text-sm font-bold text-white">Tham gia</button>
                          <button onClick={() => answerInvitation(invitation.id, 'declined')} className="rounded-2xl border border-[#dce8f5] px-4 py-2 text-sm font-bold text-slate-600">Từ chối</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'chat' && activeConversation && (
                <>
                  <div className="border-b border-[#e5eef8] bg-white px-6 py-5">
                    <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={getConversationTitle(activeConversation, currentUser.id)} />
                        <div>
                          <p className="font-black text-[#132b57]">{getConversationTitle(activeConversation, currentUser.id)}</p>
                          <p className="mt-1 text-sm text-slate-500">{activeConversation.type === 'group' ? 'Nhóm' : 'Cá nhân'} · {getConversationSubtitle(activeConversation, currentUser.id)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {activeConversation.type === 'group' && (
                          <>
                            <input value={inviteIdentifier} onChange={(event) => setInviteIdentifier(event.target.value)} className="min-w-56 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-2 text-sm outline-none focus:border-[#1f5dcc]" placeholder="MSSV/Gmail để mời" />
                            <input value={inviteNote} onChange={(event) => setInviteNote(event.target.value)} className="min-w-56 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-2 text-sm outline-none focus:border-[#1f5dcc]" placeholder="Lời nhắn" />
                            <button onClick={sendInvite} className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-2 text-sm font-bold text-[#1747a6]">
                              <MailPlus className="h-4 w-4" /> Mời
                            </button>
                          </>
                        )}
                        {activeConversation.type === 'group' && isOwner && (
                          <button onClick={addSelectedMembers} disabled={selectedMembers.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-2 text-sm font-bold text-[#1747a6] disabled:text-slate-300">
                            <UserPlus className="h-4 w-4" /> Thêm {selectedMembers.length ? `(${selectedMembers.length})` : ''}
                          </button>
                        )}
                        <button type="button" onClick={() => setIsThreadListCollapsed((current) => !current)} className="rounded-2xl border border-[#dce8f5] bg-white p-3 text-slate-500 transition-all hover:bg-[#eef6ff] hover:text-[#1747a6]" aria-label="Ẩn hiện danh sách">
                          {isThreadListCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    {activeConversation.type === 'group' && isOwner && (
                      <div className="mt-4">
                        <input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} className="w-full rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-2 text-sm outline-none focus:border-[#1f5dcc]" placeholder="Tìm để chọn thành viên thêm trực tiếp" />
                      </div>
                    )}
                  </div>

                  <div className="chat-messages-area flex-1 space-y-4 overflow-y-auto px-6 pt-6 pb-32">
                    {activeMessages.map((message) => {
                      const sender = message.sender || {};
                      const isMine = message.senderId === currentUser.id;
                      const isSystem = typeof message.content === 'string' && /đã tham gia|joined|đã rời|đã vào nhóm/i.test(message.content);

                      if (isSystem) {
                        return (
                          <div key={message.id} className="flex w-full justify-center">
                            <div className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                              <span>{message.content}</span>
                              <span className="ml-2 text-[11px] font-medium text-slate-400">{formatTime(message.createdAt)}</span>
                            </div>
                          </div>
                        );
                      }

                      // compute viewers: members whose lastReadMessageId >= message.id and not the sender
                      const viewers = (activeConversation?.members || []).filter((m) => m.userId !== message.senderId && m.lastReadMessageId && message.id && m.lastReadMessageId >= message.id).map((m) => m.user?.name || '');
                      const viewersInline = viewers.slice(0, 3);
                      const viewersTitle = viewers.join(', ');

                      return (
                        <div key={message.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {!isMine && <Avatar name={sender.name} src={sender.avatar} size="h-8 w-8" rounded="rounded-full" />}
                          <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`chat-bubble px-4 py-3 ${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
                              {!isMine && <p className="text-xs font-bold text-[#1f5dcc]">{sender.name}</p>}
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                              {message.attachments && Array.isArray(message.attachments) && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {message.attachments.map((att, i) => (
                                    <a key={i} href={att.url || att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border bg-white p-2 text-xs">
                                      {att.mimetype && att.mimetype.startsWith('image/') ? <img src={att.url} alt={att.originalname || att.filename} className="h-12 w-12 object-cover" /> : <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-xs">{(att.originalname || att.filename || '').split('.').pop()}</div>}
                                      <span className="max-w-[160px] truncate">{att.originalname || att.filename}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              <p className={`mt-2 text-xs ${isMine ? 'text-blue-100/80' : 'text-slate-400'}`}>{formatTime(message.createdAt)}</p>
                              <div className="mt-1 flex items-center gap-2">
                                {message.status === 'pending' && <span className="text-xs text-slate-400">Đang gửi…</span>}
                                {message.status === 'failed' && (
                                  <button onClick={() => retryMessage(message)} className="text-xs text-red-500">Gửi lại</button>
                                )}
                                {viewers.length > 0 && (
                                  <div title={viewersTitle} className="text-xs text-slate-400">
                                    {isMine ? (
                                      <span>Đã xem bởi {viewersInline.join(', ')}{viewers.length > 3 ? '…' : ''}</span>
                                    ) : (
                                      <span>Đã xem: {viewersInline.join(', ')}{viewers.length > 3 ? '…' : ''}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {Object.entries(typingUsers).some(([key, value]) => key.startsWith(`${activeConversationId}:`) && value) && (
                      <div className="chat-typing-indicator rounded-full bg-white px-4 py-3 shadow-sm"><span /><span /><span /></div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-[#e5eef8] bg-white px-6 py-5 sticky bottom-0 z-20">
                    <div className="chat-composer flex items-end gap-3 rounded-[24px] border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] focus-within:border-[#1f5dcc]">
                      <textarea
                        rows="1"
                        value={draftMessage}
                        onChange={(event) => emitTyping(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            sendCurrentMessage();
                          }
                        }}
                        className="min-h-[48px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                        placeholder="Nhập tin nhắn..."
                      />
                      <div className="flex items-center gap-2">
                        <input id="chat-file-input" type="file" multiple onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const withPreview = files.map((file) => {
                            const obj = { raw: file, name: file.name, size: file.size, type: file.type };
                            if (file.type.startsWith('image/')) {
                              obj.preview = URL.createObjectURL(file);
                            }
                            return obj;
                          });
                          setAttachments((cur) => [...cur, ...withPreview]);
                          e.currentTarget.value = '';
                        }} className="hidden" />
                        <label htmlFor="chat-file-input" className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-3 py-2 text-sm font-semibold text-[#1747a6]">Thêm file</label>
                        <div className="flex gap-2">
                          {attachments.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 rounded-lg border p-2">
                              {file.preview ? <img src={file.preview} alt={file.name} className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-xs">{file.name.split('.').pop()}</div>}
                              <button onClick={() => setAttachments((cur) => cur.filter((_, i) => i !== idx))} className="text-xs text-red-500">X</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={sendCurrentMessage} className="shrink-0 rounded-2xl bg-[#1747a6] p-3 text-white transition-all hover:bg-[#205fd8] disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!draftMessage.trim()}>
                        <SendHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {mode === 'chat' && !activeConversation && (
                <div className="flex h-full items-center justify-center p-10 text-center">
                  <div>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#eef6ff] text-[#1747a6]"><MessageSquare className="h-8 w-8" /></div>
                    <h2 className="mt-5 text-2xl font-black text-[#132b57]">Chưa có hội thoại</h2>
                    <p className="mt-2 text-sm text-slate-500">Tạo chat cá nhân hoặc nhóm để bắt đầu trao đổi.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
