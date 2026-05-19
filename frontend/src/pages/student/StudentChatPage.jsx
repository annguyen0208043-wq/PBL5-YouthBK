import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCheck, LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, Paperclip, Search, SendHorizontal, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { studentChatThreads } from '../../shared/student/chatData';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

function ThreadAvatar({ name, accent, size = 'h-12 w-12', rounded = 'rounded-2xl' }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className={`flex ${size} shrink-0 items-center justify-center ${rounded} bg-gradient-to-br ${accent} text-sm font-black text-white shadow-sm`}>
      {initials}
    </div>
  );
}

function MiniSeenAvatar({ person }) {
  const initials = getUserInitials(person.name);

  return (
    <div
      className={`-ml-1 first:ml-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#f8fbff] ${person.avatarColor || 'bg-slate-400'} text-[9px] font-black text-white`}
      title={`${person.name} đã xem`}
    >
      {initials}
    </div>
  );
}

export default function StudentChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const user = getStoredUserProfile();
  const userInitials = getUserInitials(user.fullName);
  const [search, setSearch] = useState('');
  const [activeThreadId, setActiveThreadId] = useState(studentChatThreads[0]?.id ?? '');
  const [draftMessage, setDraftMessage] = useState('');
  const [isThreadListCollapsed, setIsThreadListCollapsed] = useState(false);

  const visibleThreads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return studentChatThreads.filter((thread) => !normalizedSearch || thread.name.toLowerCase().includes(normalizedSearch) || thread.preview.toLowerCase().includes(normalizedSearch));
  }, [search]);

  const activeThread = useMemo(
    () => visibleThreads.find((thread) => thread.id === activeThreadId) ?? visibleThreads[0] ?? studentChatThreads[0],
    [activeThreadId, visibleThreads]
  );

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="app-sidebar hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img src={doanLogo} alt="Logo Đoàn" className="h-12 w-12 rounded-full bg-white object-contain p-1.5" />
            <img src={schoolLogo} alt="Logo Bách Khoa" className="h-12 w-12 rounded-xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">BK-Youth</p>
              <p className="text-sm font-semibold">Không gian sinh viên</p>
            </div>
          </div>

          <div className="profile-user-chip mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="profile-user-avatar h-14 w-14 rounded-2xl border border-white/25 object-cover" />
              ) : (
                <div className="profile-user-avatar flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-black text-white">
                  {userInitials}
                </div>
              )}
              <div className="profile-user-meta">
                <p className="profile-user-name text-base font-bold text-white">{user.fullName}</p>
                <p className="profile-user-subtitle text-sm text-blue-100/85">MSSV: {user.studentId}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <Link to="/sinhvien" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Sự kiện của tôi
            </Link>
            <Link to="/sinhvien/profile" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Hồ sơ cá nhân
            </Link>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Chat sinh viên</div>
            <Link to="/sinhvien/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
          </nav>

          <div className="mt-auto pt-6">
            <button
              onClick={handleLogout}
              className="app-logout-button flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main ref={mainRef} className="app-main flex-1">
          <div className="app-page-header border-b border-[#dce9f6] bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Chat giữa sinh viên</h1>
                <p className="mt-1 text-slate-500">Không gian trao đổi nhanh cho học tập, sự kiện và hồ sơ tham gia hoạt động.</p>
              </div>
              <div
                className="profile-header-user rounded-[24px] border border-[#dce8f5] bg-[#f7fbff] px-4 py-3"
                aria-label="Mở trang chỉnh sửa thông tin cá nhân"
              >
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="profile-user-avatar h-12 w-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="profile-user-avatar flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1747a6,#4ba3ff)] text-sm font-black text-white">
                      {userInitials}
                    </div>
                  )}
                  <div className="profile-user-meta">
                    <p className="profile-user-name font-bold text-[#132b57]">{user.fullName}</p>
                    <p className="profile-user-subtitle text-sm text-slate-500">MSSV: {user.studentId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`grid h-[calc(100%-96px)] gap-0 ${isThreadListCollapsed ? 'xl:grid-cols-[1fr]' : 'xl:grid-cols-[380px_1fr]'}`}>
            {!isThreadListCollapsed && (
            <section className="flex min-h-0 flex-col border-r border-[#e5eef8] bg-white/85 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1f5dcc]">Kênh chat</p>
                  <p className="text-sm text-slate-500">Danh sách nhóm đang tham gia</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsThreadListCollapsed(true)}
                  className="rounded-2xl border border-[#dce8f5] bg-white p-3 text-slate-500 transition-all hover:bg-[#eef6ff] hover:text-[#1747a6]"
                  aria-label="Thu gọn danh sách kênh chat"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 focus-within:border-[#1f5dcc]">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Tìm nhóm chat hoặc tin nhắn"
                />
              </div>

              <div className="chat-thread-list mt-5 space-y-3 pr-1">
                {visibleThreads.map((thread) => (
                  <motion.button
                    key={thread.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full rounded-[22px] border p-4 text-left transition-all ${
                      activeThread?.id === thread.id ? 'border-[#8fb5ea] bg-[#eef6ff] shadow-[0_14px_32px_rgba(37,99,235,0.12)]' : 'border-[#dce8f5] bg-white hover:border-[#bad7f5]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <ThreadAvatar name={thread.name} accent={thread.accent} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-bold text-[#132b57]">{thread.name}</p>
                          <span className="shrink-0 text-xs text-slate-400">{thread.updatedAt}</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5dcc]">{thread.role}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{thread.preview}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {thread.memberCount} thành viên
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="chat-online-dot !h-2 !w-2 !border-0 !shadow-none" />
                            {thread.onlineCount} online
                          </span>
                        </div>
                      </div>
                      {thread.unreadCount > 0 && (
                        <span className="chat-unread-badge ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1747a6] px-2 text-xs font-bold text-white">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
            )}

            <section className="flex min-h-[720px] flex-col bg-[#f8fbff]">
              {activeThread && (
                <>
                  <div className="border-b border-[#e5eef8] bg-white px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ThreadAvatar name={activeThread.name} accent={activeThread.accent} />
                        <div>
                          <p className="font-black text-[#132b57]">{activeThread.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span>{activeThread.role}</span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {activeThread.memberCount} thành viên
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                              <span className="chat-online-dot !h-2.5 !w-2.5 !border-0 !shadow-none" />
                              {activeThread.onlineCount} đang hoạt động
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsThreadListCollapsed((current) => !current)}
                        className="rounded-2xl border border-[#dce8f5] bg-white p-3 text-slate-500 transition-all hover:bg-[#eef6ff] hover:text-[#1747a6]"
                        aria-label={isThreadListCollapsed ? 'Mở danh sách kênh chat' : 'Thu gọn danh sách kênh chat'}
                      >
                        {isThreadListCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="chat-messages-area flex-1 space-y-4 overflow-y-auto px-6 py-6">
                    {activeThread.messages.map((message, index) => {
                      const isMine = message.sender === 'me';
                      const isLastMineMessage = isMine && !activeThread.messages.slice(index + 1).some((item) => item.sender === 'me');

                      return (
                        <div key={message.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {!isMine && <ThreadAvatar name={message.author} accent={activeThread.accent} size="h-8 w-8" rounded="rounded-full" />}
                          <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`chat-bubble px-4 py-3 ${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
                              <p className={`text-xs font-bold ${isMine ? 'text-blue-100' : 'text-[#1f5dcc]'}`}>{message.author}</p>
                              <p className="mt-2 text-sm leading-6">{message.text}</p>
                              <p className={`mt-2 text-xs ${isMine ? 'text-blue-100/80' : 'text-slate-400'}`}>{message.time}</p>
                            </div>

                            {isLastMineMessage && activeThread.seenBy?.length > 0 && (
                              <div className="mt-2 flex items-center gap-2 pr-1 text-xs font-semibold text-slate-400">
                                <CheckCheck className="h-4 w-4 text-[#1f5dcc]" />
                                <span>Đã xem</span>
                                <div className="flex">
                                  {activeThread.seenBy.slice(0, 4).map((person) => (
                                    <MiniSeenAvatar key={person.id} person={person} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#e5eef8] bg-white px-6 py-5">
                    <div className="chat-composer flex items-end gap-3 rounded-[28px] border border-[#dce8f5] bg-[#f8fbff] px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] focus-within:border-[#1f5dcc]">
                      <button type="button" className="shrink-0 rounded-2xl bg-white p-3 text-slate-500 transition-all hover:bg-[#eef6ff] hover:text-[#1747a6]">
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <textarea
                        rows="1"
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        className="min-h-[48px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                        placeholder="Nhập tin nhắn cho nhóm..."
                      />
                      <button type="button" className="shrink-0 rounded-2xl bg-[#1747a6] p-3 text-white transition-all hover:bg-[#205fd8] disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!draftMessage.trim()}>
                        <SendHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!activeThread && (
                <div className="flex h-full items-center justify-center p-10 text-center">
                  <div>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#eef6ff] text-[#1747a6]">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <h2 className="mt-5 text-2xl font-black text-[#132b57]">Chưa có hội thoại được chọn</h2>
                    <p className="mt-2 text-sm text-slate-500">Chọn một nhóm chat ở cột bên trái để bắt đầu trao đổi.</p>
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
