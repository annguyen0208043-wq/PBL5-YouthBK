import React, { useMemo, useState } from 'react';
import { MessageSquare, PanelLeftClose, PanelLeftOpen, Paperclip, Search, SendHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';
import { studentChatThreads } from '../../shared/student/chatData';
import { getStoredUserProfile, getUserInitials } from '../../shared/user/session';

function ThreadAvatar({ name, accent }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-sm font-black text-white`}>
      {initials}
    </div>
  );
}

export default function StudentChatPage() {
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

  return (
    <div className="profile-page p-4 sm:p-6">
      <div className="profile-shell profile-card mx-auto flex w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[#d8e7f5] bg-[#f8fbfe]">
        <aside className="hidden w-[290px] border-r border-[#dce9f6] bg-[linear-gradient(180deg,#113b90_0%,#1958c2_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
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

          <div className="mb-6 rounded-[24px] bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100">Kết nối sinh viên</p>
            <p className="mt-2 text-xl font-bold">Chat nội bộ</p>
            <p className="mt-2 text-sm text-blue-50/85">Trao đổi với bạn cùng lớp, cùng nhóm hoạt động hoặc các nhóm đang tham gia.</p>
          </div>

          <nav className="space-y-2">
            <Link to="/profile" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Hồ sơ cá nhân
            </Link>
            <Link to="/student/events" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Sự kiện của tôi
            </Link>
            <Link to="/student/history" className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Lịch sử hoạt động
            </Link>
            <div className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#123d94] shadow-lg">Chat sinh viên</div>
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-semibold">Gợi ý sử dụng</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-50/90">
              <li>Dùng nhóm chat để phối hợp hoạt động và chia sẻ lịch họp.</li>
              <li>Ưu tiên trao đổi đúng nhóm để tránh bỏ sót thông tin.</li>
              <li>Tách trao đổi hồ sơ và trao đổi sự kiện để dễ theo dõi hơn.</li>
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-[#dce9f6] bg-white/80 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#1f5dcc]">BK-Youth Student</p>
                <h1 className="mt-2 text-3xl font-black text-[#132b57]">Chat giữa sinh viên</h1>
                <p className="mt-1 text-slate-500">Không gian trao đổi nhanh cho học tập, sự kiện và hồ sơ tham gia hoạt động.</p>
              </div>
              <div className="profile-header-user rounded-[24px] border border-[#dce8f5] bg-[#f7fbff] px-4 py-3">
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

          <div className={`grid h-[calc(100%-96px)] gap-0 ${isThreadListCollapsed ? 'xl:grid-cols-[1fr]' : 'xl:grid-cols-[360px_1fr]'}`}>
            {!isThreadListCollapsed && (
            <section className="border-r border-[#e5eef8] bg-white/80 p-5">
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

              <div className="mt-5 space-y-3">
                {visibleThreads.map((thread) => (
                  <motion.button
                    key={thread.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                      activeThread?.id === thread.id ? 'border-[#8fb5ea] bg-[#eef6ff]' : 'border-[#dce8f5] bg-white'
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
                      </div>
                      {thread.unreadCount > 0 && (
                        <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1747a6] px-2 text-xs font-bold text-white">
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
                          <p className="text-sm text-slate-500">{activeThread.role}</p>
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

                  <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                    {activeThread.messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] rounded-[24px] px-4 py-3 ${message.sender === 'me' ? 'bg-[#1747a6] text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                          <p className={`text-xs font-bold ${message.sender === 'me' ? 'text-blue-100' : 'text-[#1f5dcc]'}`}>{message.author}</p>
                          <p className="mt-2 text-sm leading-6">{message.text}</p>
                          <p className={`mt-2 text-xs ${message.sender === 'me' ? 'text-blue-100/80' : 'text-slate-400'}`}>{message.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#e5eef8] bg-white px-6 py-5">
                    <div className="flex items-end gap-3 rounded-[28px] border border-[#dce8f5] bg-[#f8fbff] px-4 py-3">
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
                      <button type="button" className="shrink-0 rounded-2xl bg-[#1747a6] p-3 text-white transition-all hover:bg-[#205fd8]">
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
