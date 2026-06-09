import React, { useMemo, useState } from 'react';
import { CheckCheck, ShieldCheck, Stamp, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminLayout from '../../components/admin/AdminLayout';
import { getStoredUserProfile } from '../../shared/user/session';
import { getCertificateRequests, saveCertificateRequests } from '../../shared/student/certificateStore';

function statusTone(status) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

function statusLabel(status) {
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'rejected') return 'Từ chối';
  return 'Chờ duyệt';
}

export default function AdminCertificateApprovalPage() {
  const currentAdmin = getStoredUserProfile();
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch certificates from API
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/certificates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Không thể tải danh sách chứng nhận');
        const data = await response.json();
        setRequests(data.certificates || []);
        if (data.certificates && data.certificates.length > 0) {
          setSelectedRequestId(data.certificates[0].id);
        }
      } catch (err) {
        setNotice(`❌ Lỗi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const selectedRequest = useMemo(() => requests.find((item) => item.id === selectedRequestId) ?? requests[0], [requests, selectedRequestId]);

  const updateRequestStatus = async (nextStatus) => {
    if (!selectedRequest) return;
    try {
      const token = localStorage.getItem('token');
      const action = nextStatus === 'approved' ? 'approve' : 'reject';
      const response = await fetch(`/api/certificates/${selectedRequest.id}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Lỗi cập nhật');
      }

      const data = await response.json();
      
      const updatedRequests = requests.map((item) =>
        item.id !== selectedRequest.id
          ? item
          : { ...item, ...data.certificate }
      );

      setRequests(updatedRequests);
      setNotice(nextStatus === 'approved' ? '✅ Đã duyệt chứng nhận và cộng điểm.' : '❌ Đã từ chối hồ sơ chứng nhận.');
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/certificates"
      title="Duyệt chứng nhận"
      subtitle="Duyệt yêu cầu nhận giấy chứng nhận của sinh viên. Hồ sơ được duyệt sẽ có dấu mộc đỏ."
    >
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
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
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-[#132b57]">{request.activityTitle}</h3>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(request.status)}`}>{statusLabel(request.status)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Yêu cầu: {new Date(request.requestedAt).toLocaleString('vi-VN')}</p>
            </motion.button>
          ))}
        </section>

        <section className="rounded-[28px] border border-[#dce8f5] bg-white p-6">
          {selectedRequest && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e7eff8] pb-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1f5dcc]">Hồ sơ chứng nhận</p>
                  <h2 className="mt-2 text-3xl font-black text-[#132b57]">{selectedRequest.activityTitle}</h2>
                </div>
                <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${statusTone(selectedRequest.status)}`}>{statusLabel(selectedRequest.status)}</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-[#f6faff] p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thời điểm yêu cầu</p>
                  <p className="mt-2 font-semibold text-slate-700">{new Date(selectedRequest.requestedAt).toLocaleString('vi-VN')}</p>
                </div>
                <div className="rounded-[24px] bg-[#f6faff] p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Người duyệt gần nhất</p>
                  <p className="mt-2 font-semibold text-slate-700">{selectedRequest.approverName || 'Chưa duyệt'}</p>
                </div>
                <div className="rounded-[24px] bg-[#f0fdf4] p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-600">Điểm cộng đồng</p>
                  <p className="mt-2 font-semibold text-emerald-700">
                    {selectedRequest.status === 'approved' 
                      ? (selectedRequest.earnedPoints > 0 ? `+${selectedRequest.earnedPoints} điểm` : '0 điểm') 
                      : (selectedRequest.Event?.communityPoints > 0 ? `Dự kiến: +${selectedRequest.Event.communityPoints} điểm` : '0 điểm')}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-[#f3d2d2] bg-[#fff7f7] p-4">
                <div className="flex items-center gap-2">
                  <Stamp className="h-5 w-5 text-[#b12020]" />
                  <p className="font-bold text-[#8b1f1f]">Dấu mộc đỏ điện tử</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedRequest.status === 'approved'
                    ? `Mộc: ${selectedRequest.stampCode} • Thời điểm đóng dấu: ${new Date(selectedRequest.approvedAt).toLocaleString('vi-VN')}`
                    : 'Chỉ hiển thị mộc đỏ sau khi duyệt thành công.'}
                </p>
              </div>

              <p className="mt-4 rounded-[24px] bg-[#f8fbff] p-4 text-sm leading-6 text-slate-600">{selectedRequest.note || 'Chưa có ghi chú xử lý.'}</p>

              {notice && <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateRequestStatus('approved')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8]"
                >
                  <CheckCheck className="h-5 w-5" />
                  Duyệt & đóng dấu
                </button>
                <button
                  type="button"
                  onClick={() => updateRequestStatus('rejected')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff]"
                >
                  <XCircle className="h-5 w-5" />
                  Từ chối
                </button>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Đảm bảo minh bạch phê duyệt
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
