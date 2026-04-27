import React, { useMemo, useState } from 'react';
import { BadgeCheck, Link2, ShieldAlert, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import { lienChiEvidenceRequests } from '../../shared/lienchi/lienChiData';

function statusTone(status) {
  if (status === 'Đã duyệt') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Cần bổ sung') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

export default function LienChiEvidenceApprovalPage() {
  const [requests, setRequests] = useState(lienChiEvidenceRequests);
  const [selectedRequestId, setSelectedRequestId] = useState(lienChiEvidenceRequests[0]?.id ?? '');
  const [notice, setNotice] = useState('');

  const selectedRequest = useMemo(() => requests.find((item) => item.id === selectedRequestId) ?? requests[0], [requests, selectedRequestId]);

  const updateStatus = (nextStatus, message) => {
    setRequests((current) =>
      current.map((item) => (item.id === selectedRequestId ? { ...item, status: nextStatus, note: message } : item))
    );
    setNotice(message);
  };

  return (
    <LienChiLayout
      currentPath="/lien-chi/evidences"
      title="Duyệt minh chứng"
      subtitle="Liên chi xác minh minh chứng sinh viên thuộc khoa sau khi tham gia sự kiện."
    >
      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="space-y-4">
          {requests.map((request) => (
            <motion.button
              key={request.id}
              type="button"
              whileHover={{ y: -3 }}
              onClick={() => setSelectedRequestId(request.id)}
              className={`w-full rounded-[28px] border p-5 text-left transition-all ${
                selectedRequestId === request.id ? 'border-[#88b2ef] bg-[#eef6ff]' : 'border-[#dce8f5] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-[#132b57]">{request.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{request.eventTitle}</p>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(request.status)}`}>{request.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">Nộp lúc {new Date(request.submittedAt).toLocaleString('vi-VN')}</p>
            </motion.button>
          ))}
        </section>

        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
          {selectedRequest && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7eff8] pb-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Hồ sơ minh chứng</p>
                  <h2 className="mt-2 text-3xl font-black text-[#132b57]">{selectedRequest.fullName}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedRequest.studentId} • {selectedRequest.eventTitle}
                  </p>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedRequest.status)}`}>{selectedRequest.status}</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Loại minh chứng</p>
                  <p className="mt-2 font-semibold text-slate-700">{selectedRequest.evidenceType}</p>
                </div>
                <div className="rounded-[24px] bg-[#f6faff] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thời điểm nộp</p>
                  <p className="mt-2 font-semibold text-slate-700">{new Date(selectedRequest.submittedAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] bg-[#f8fbff] p-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-[#1747a6]" />
                  <p className="font-semibold text-[#132b57]">Giá trị minh chứng</p>
                </div>
                <p className="mt-2 break-all text-sm leading-6 text-slate-600">{selectedRequest.evidenceValue}</p>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nhận xét xử lý</span>
                <textarea rows="5" defaultValue={selectedRequest.note} className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]" />
              </label>

              {notice && <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateStatus('Đã duyệt', 'Đã duyệt minh chứng và ghi nhận sinh viên hoàn thành hoạt động.')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
                >
                  <BadgeCheck className="h-5 w-5" />
                  Duyệt minh chứng
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus('Cần bổ sung', 'Đã trả hồ sơ và yêu cầu sinh viên bổ sung minh chứng hợp lệ.')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition-all hover:bg-rose-100"
                >
                  <XCircle className="h-5 w-5" />
                  Yêu cầu bổ sung
                </button>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  <ShieldAlert className="h-4 w-4" />
                  Kiểm tra định dạng file và hạn nộp trước khi phê duyệt
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </LienChiLayout>
  );
}
