import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Loader, MailPlus, Search, Send, Users } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';

const TARGET_OPTIONS = [
  { value: 'all_students', label: 'Toàn bộ sinh viên' },
  { value: 'faculty', label: 'Liên chi đoàn / khoa cụ thể' },
  { value: 'specific_users', label: 'Tài khoản cụ thể' },
];

function formatDateTime(value) {
  if (!value) {
    return 'Chưa xác định';
  }

  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function audienceLabel(notification) {
  if (notification.targetType === 'all_students') {
    return 'Toàn bộ sinh viên';
  }

  if (notification.targetType === 'faculty') {
    return notification.targetValue ? `Liên chi đoàn / khoa: ${notification.targetValue}` : 'Liên chi đoàn / khoa';
  }

  if (notification.targetType === 'specific_users') {
    return `Nhóm cụ thể (${notification.recipientCount || 0} người nhận)`;
  }

  return notification.targetType || 'Không xác định';
}

function badgeTone(type) {
  if (type === 'all_students') {
    return 'bg-[#eef6ff] text-[#1747a6]';
  }

  if (type === 'faculty') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-emerald-100 text-emerald-700';
}

export default function AdminNotificationsPage() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [recipientResults, setRecipientResults] = useState([]);
  const [selectedRecipientUsers, setSelectedRecipientUsers] = useState([]);
  const [searchingRecipients, setSearchingRecipients] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetType: 'all_students',
    faculty: '',
    recipientUserIds: [],
  });

  const selectedRecipients = useMemo(
    () => selectedRecipientUsers.filter((user) => formData.recipientUserIds.includes(user.id)),
    [formData.recipientUserIds, selectedRecipientUsers]
  );
  const filteredFaculties = useMemo(() => {
    const keyword = formData.faculty.trim().toLowerCase();
    if (!keyword) {
      return faculties;
    }

    return faculties.filter((faculty) => faculty.toLowerCase().includes(keyword));
  }, [faculties, formData.faculty]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [sentResponse, facultiesResponse] = await Promise.all([
        fetch('/api/notifications/sent', { headers }),
        fetch('/api/notifications/faculties', { headers }),
      ]);

      if (!sentResponse.ok) {
        const payload = await sentResponse.json().catch(() => ({}));
        throw new Error(payload.message || 'Không thể tải danh sách thông báo');
      }

      if (!facultiesResponse.ok) {
        const payload = await facultiesResponse.json().catch(() => ({}));
        throw new Error(payload.message || 'Không thể tải danh sách liên chi đoàn');
      }

      const sentData = await sentResponse.json();
      const facultiesData = await facultiesResponse.json();

      setNotifications(sentData.notifications || []);
      setFaculties(facultiesData.faculties || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.targetType !== 'specific_users') {
      setRecipientResults([]);
      return undefined;
    }

    const trimmedQuery = recipientQuery.trim();
    if (!trimmedQuery) {
      setRecipientResults([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchingRecipients(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/notifications/recipients/search?q=${encodeURIComponent(trimmedQuery)}&limit=10`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || 'Không thể tìm người nhận');
        }

        const data = await response.json();
        setRecipientResults(() => {
          const merged = [...(data.users || [])];

          selectedRecipientUsers.forEach((selectedUser) => {
            if (!merged.some((user) => user.id === selectedUser.id)) {
              merged.push(selectedUser);
            }
          });

          return merged;
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setSearchingRecipients(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [formData.targetType, recipientQuery, selectedRecipientUsers]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'targetType' && value !== 'specific_users') {
      setSelectedRecipientUsers([]);
      setRecipientQuery('');
      setRecipientResults([]);
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'targetType'
        ? {
            faculty: value === 'faculty' ? previous.faculty : '',
            recipientUserIds: value === 'specific_users' ? previous.recipientUserIds : [],
          }
        : {}),
    }));
  };

  const handleToggleRecipient = (userId) => {
    const selectedUser = recipientResults.find((user) => user.id === userId);

    setFormData((previous) => {
      const exists = previous.recipientUserIds.includes(userId);

      return {
        ...previous,
        recipientUserIds: exists
          ? previous.recipientUserIds.filter((id) => id !== userId)
          : [...previous.recipientUserIds, userId],
      };
    });

    if (!selectedUser) {
      return;
    }

    setSelectedRecipientUsers((previous) => {
      const exists = previous.some((user) => user.id === userId);

      if (exists) {
        return previous.filter((user) => user.id !== userId);
      }

      return [...previous, selectedUser];
    });
  };

  const handleRemoveRecipient = (userId) => {
    setFormData((previous) => ({
      ...previous,
      recipientUserIds: previous.recipientUserIds.filter((id) => id !== userId),
    }));
    setSelectedRecipientUsers((previous) => previous.filter((user) => user.id !== userId));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      targetType: 'all_students',
      faculty: '',
      recipientUserIds: [],
    });
    setRecipientQuery('');
    setRecipientResults([]);
    setSelectedRecipientUsers([]);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setNotice('');
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo');
      return;
    }

    if (formData.targetType === 'faculty' && !formData.faculty) {
      setNotice('');
      setError('Vui lòng chọn liên chi đoàn / khoa nhận thông báo');
      return;
    }

    if (formData.targetType === 'specific_users' && formData.recipientUserIds.length === 0) {
      setNotice('');
      setError('Vui lòng chọn ít nhất một tài khoản cụ thể');
      return;
    }

    try {
      setSending(true);
      setError('');
      setNotice('');

      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        targetType: formData.targetType,
      };

      if (formData.targetType === 'faculty') {
        payload.faculty = formData.faculty.trim();
      }

      if (formData.targetType === 'specific_users') {
        payload.recipientUserIds = formData.recipientUserIds;
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Gửi thông báo thất bại');
      }

      setNotice(`Đã gửi thông báo thành công tới ${data.recipientCount || 0} người nhận`);
      resetForm();
      await fetchInitialData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/notifications"
      title="Thông báo hệ thống"
      subtitle="Gửi thông báo từ Đoàn trường đến toàn bộ sinh viên, liên chi đoàn hoặc các tài khoản được chọn trực tiếp từ hệ thống."
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1747a6]" />
            <p className="text-slate-600">Đang đồng bộ dữ liệu thông báo từ hệ thống...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <MailPlus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#132b57]">Tạo thông báo mới</h2>
                <p className="text-sm text-slate-500">Dữ liệu người nhận và lịch sử gửi được lấy trực tiếp từ database qua backend.</p>
              </div>
            </div>

            {notice ? (
              <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {notice}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề thông báo</span>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                  placeholder="Nhập tiêu đề thông báo"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nhóm nhận</span>
                <select
                  name="targetType"
                  value={formData.targetType}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]"
                >
                  {TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {formData.targetType === 'faculty' ? (
                <div className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Tìm và chọn liên chi đoàn / khoa</span>
                  <input
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                    placeholder="Nhập tên khoa hoặc liên chi đoàn để tìm kiếm"
                  />
                  <div className="mt-3 space-y-2">
                    {formData.faculty.trim() && filteredFaculties.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#dce8f5] px-4 py-3 text-sm text-slate-500">
                        Không tìm thấy đơn vị trùng khớp. Bạn có thể dùng chính tên đang nhập để gửi thông báo.
                      </div>
                    ) : null}

                    {filteredFaculties.slice(0, 8).map((faculty) => (
                      <button
                        key={faculty}
                        type="button"
                        onClick={() => setFormData((previous) => ({ ...previous, faculty }))}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                          formData.faculty === faculty
                            ? 'border-[#1747a6] bg-[#eef6ff]'
                            : 'border-[#dce8f5] bg-white hover:bg-[#f8fbff]'
                        }`}
                      >
                        <span className="font-semibold text-[#132b57]">{faculty}</span>
                        <span className="text-xs font-bold text-slate-500">Chọn</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {formData.targetType === 'specific_users' ? (
                <div className="rounded-[24px] border border-[#dce8f5] bg-[#fbfdff] p-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 focus-within:border-[#1f5dcc]">
                    <Search className="h-5 w-5 text-slate-400" />
                    <input
                      value={recipientQuery}
                      onChange={(event) => setRecipientQuery(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Tìm theo họ tên, MSSV hoặc email"
                    />
                  </div>

                  {selectedRecipients.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRecipients.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleRemoveRecipient(user.id)}
                          className="rounded-full bg-[#1747a6] px-3 py-1 text-xs font-semibold text-white"
                        >
                          {user.fullName} • {user.studentId || user.email}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    {searchingRecipients ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader className="h-4 w-4 animate-spin" />
                        Đang tìm tài khoản...
                      </div>
                    ) : null}

                    {!searchingRecipients && recipientQuery.trim() && recipientResults.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#dce8f5] px-4 py-3 text-sm text-slate-500">
                        Không tìm thấy tài khoản phù hợp.
                      </div>
                    ) : null}

                    {recipientResults.map((user) => {
                      const selected = formData.recipientUserIds.includes(user.id);

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleToggleRecipient(user.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                            selected
                              ? 'border-[#1747a6] bg-[#eef6ff]'
                              : 'border-[#dce8f5] bg-white hover:bg-[#f8fbff]'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-[#132b57]">{user.fullName}</p>
                            <p className="text-sm text-slate-500">{user.studentId || 'Không có MSSV'} • {user.email}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{selected ? 'Đã chọn' : 'Chọn'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nội dung</span>
                <textarea
                  name="content"
                  rows="6"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                  placeholder="Nhập nội dung cần gửi..."
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={sending}
                  className="rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
                >
                  Làm mới biểu mẫu
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                    <BellRing className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tổng thông báo đã gửi</p>
                    <p className="text-3xl font-black text-[#132b57]">{notifications.length}</p>
                  </div>
                </div>
              </div>

              <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tổng lượt người nhận</p>
                    <p className="text-3xl font-black text-[#132b57]">
                      {notifications.reduce((sum, item) => sum + (item.recipientCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 text-center text-slate-500">
                Chưa có thông báo nào được gửi từ tài khoản này.
              </div>
            ) : (
              notifications.map((item) => (
                <motion.div key={item.id} whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-[#132b57]">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{audienceLabel(item)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeTone(item.targetType)}`}>
                      Đã gửi
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{item.content}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="rounded-full bg-[#f6faff] px-3 py-1 font-semibold text-[#1747a6]">
                      {item.recipientCount || 0} người nhận
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                      {item.readCount || 0} đã đọc
                    </span>
                    <span>{formatDateTime(item.createdAt)}</span>
                  </div>
                </motion.div>
              ))
            )}

            <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                  <BellRing className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#132b57]">Trạng thái đồng bộ</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mọi dữ liệu trên trang này đều được cập nhật trực tiếp từ hệ thống, bao gồm danh sách người nhận, lịch sử gửi và trạng thái đã đọc.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
