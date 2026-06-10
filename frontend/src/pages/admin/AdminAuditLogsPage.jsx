import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileClock, Search, Calendar, CheckCircle2, RefreshCw, AlertCircle, User as UserIcon, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const roleLabel = (role) => {
  if (role === 'admin') return 'Đoàn trường';
  if (role === 'lienchi') return 'Liên chi Đoàn';
  return 'Sinh viên';
};

const roleColor = (role) => {
  if (role === 'admin') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (role === 'lienchi') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const getHeaderLabel = (dateKey) => {
  const today = new Date();
  const todayStr = today.toLocaleDateString('vi-VN');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('vi-VN');

  if (dateKey === todayStr) return `Hôm nay — ${todayStr}`;
  if (dateKey === yesterdayStr) return `Hôm qua — ${yesterdayStr}`;
  return `Ngày ${dateKey}`;
};

const formatTime = (isoStr) => {
  const d = new Date(isoStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const getDateKey = (isoStr) => {
  return new Date(isoStr).toLocaleDateString('vi-VN');
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 100;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Không thể tải nhật ký');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach((log) => {
      const key = getDateKey(log.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return groups;
  }, [logs]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedLogs).sort((a, b) => {
      const [d1, m1, y1] = a.split('/');
      const [d2, m2, y2] = b.split('/');
      return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
    });
  }, [groupedLogs]);

  return (
    <AdminLayout
      currentPath="/admin/audit-logs"
      title="Nhật ký hoạt động"
      subtitle="Theo dõi các thao tác quản trị quan trọng được ghi nhận từ cơ sở dữ liệu."
    >
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Search bar + refresh */}
        <div className="flex gap-3 items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 shadow-sm focus-within:border-[#1f5dcc] transition-all">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo hành động, loại đối tượng..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-[#132b57] font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 text-sm font-bold text-[#1747a6] shadow-sm hover:bg-[#f0f4ff] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <p className="text-xs text-slate-500 font-semibold px-1">
            Tìm thấy <span className="text-[#1747a6] font-bold">{total}</span> bản ghi
            {debouncedSearch && <> khớp với từ khóa "<span className="italic">{debouncedSearch}</span>"</>}
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-3 text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Không thể tải nhật ký</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={fetchLogs} className="ml-auto text-xs font-bold underline">Thử lại</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-[24px] border border-[#dce8f5] bg-white p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && logs.length === 0 && (
          <div className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-slate-200 mb-4" />
            <p className="font-bold text-lg text-[#132b57]">Không tìm thấy nhật ký nào</p>
            <p className="text-sm mt-1 text-slate-400">
              {debouncedSearch ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Chưa có hoạt động nào được ghi nhận.'}
            </p>
          </div>
        )}

        {/* Grouped Logs */}
        {!loading && !error && logs.length > 0 && (
          <div className="space-y-8">
            <AnimatePresence>
              {sortedDates.map((dateKey) => (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Date header */}
                  <div className="flex items-center gap-2.5 px-1">
                    <Calendar className="h-4 w-4 text-[#1747a6] shrink-0" />
                    <span className="text-sm font-bold text-[#132b57] tracking-wide">
                      {getHeaderLabel(dateKey)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold bg-[#f0f4f9] px-2.5 py-0.5 rounded-full border border-[#dce8f5]">
                      {groupedLogs[dateKey].length} thao tác
                    </span>
                  </div>

                  {/* Log items */}
                  <div className="space-y-2.5">
                    {groupedLogs[dateKey].map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -2 }}
                        className="profile-panel rounded-[22px] border border-[#dce8f5] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Action */}
                            <p className="text-sm font-bold text-[#132b57] leading-snug">
                              {item.action}
                            </p>

                            {/* Details */}
                            {item.details && (
                              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 font-medium">
                                {item.details}
                              </p>
                            )}

                            {/* Actor + role */}
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                                <UserIcon className="h-3.5 w-3.5 text-[#1747a6]" />
                                <span className="font-bold text-[#1747a6]">
                                  {item.actor?.name || item.actor?.email || `User #${item.userId}`}
                                </span>
                              </div>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleColor(item.actor?.role)}`}>
                                {roleLabel(item.actor?.role)}
                              </span>
                              {item.targetType && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                                  <Tag className="h-3 w-3" />
                                  {item.targetType}
                                  {item.targetId ? ` #${item.targetId}` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Time */}
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                              <FileClock className="h-3.5 w-3.5" />
                              <span>{formatTime(item.createdAt)}</span>
                            </div>
                            {item.ipAddress && (
                              <span className="text-[10px] text-slate-300 font-mono">{item.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-[#dce8f5] bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              ← Trước
            </button>
            <span className="text-sm text-slate-500 font-semibold px-2">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-[#dce8f5] bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              Tiếp →
            </button>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
