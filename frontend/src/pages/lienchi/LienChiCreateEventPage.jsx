import React, { useState } from 'react';
import { CalendarRange, FileImage, Plus, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

import LienChiLayout from '../../components/lienchi/LienChiLayout';

export default function LienChiCreateEventPage() {
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Kỹ năng',
    maxParticipants: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
  });

  const [timelineItems, setTimelineItems] = useState([]);
  const [newTimelineItem, setNewTimelineItem] = useState({
    dateTime: '',
    description: '',
  });
  const [imageFiles, setImageFiles] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTimeline = () => {
    if (!newTimelineItem.dateTime || !newTimelineItem.description.trim()) {
      setNotice('❌ Vui lòng nhập đầy đủ ngày giờ và nội dung timeline');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setNotice('❌ Vui lòng nhập thời gian sự kiện trước');
      return;
    }

    if (newTimelineItem.dateTime < formData.startTime || newTimelineItem.dateTime > formData.endTime) {
      setNotice(`❌ Timeline phải nằm trong khung giờ sự kiện (${formData.startTime} đến ${formData.endTime})`);
      return;
    }

    setTimelineItems((prev) => [...prev, { ...newTimelineItem }]);
    setNewTimelineItem({ dateTime: '', description: '' });
    setNotice('');
  };

  const handleRemoveTimeline = (index) => {
    setTimelineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitEvent = async () => {
    if (!formData.title || !formData.location || !formData.startTime || !formData.endTime) {
      setNotice('❌ Vui lòng điền đủ các trường bắt buộc: Tên sự kiện, Địa điểm, Thời gian');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setNotice('❌ Giờ bắt đầu phải trước giờ kết thúc');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('startTime', formData.startTime);
      formDataToSend.append('endTime', formData.endTime);
      formDataToSend.append('maxParticipants', formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : null);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('timeline', JSON.stringify(timelineItems));

      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi tạo sự kiện');
      }

      const data = await response.json();
      setNotice(`✅ Tạo sự kiện thành công! ID: ${data.event.id}`);

      setFormData({
        title: '',
        category: 'Kỹ năng',
        maxParticipants: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
      });
      setImageFiles([]);
      setTimelineItems([]);
    } catch (error) {
      setNotice(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!formData.title || !formData.location || !formData.startTime || !formData.endTime) {
      setNotice('❌ Vui lòng điền đủ các trường bắt buộc để lưu nháp');
      return;
    }

    localStorage.setItem(
      'lienChiEventDraft',
      JSON.stringify({
        formData,
        timelineItems,
      }),
    );
    setNotice('✓ Đã lưu nháp hồ sơ sự kiện của liên chi.');
  };

  return (
    <LienChiLayout
      currentPath="/lien-chi/events/create"
      title="Tạo sự kiện"
      subtitle="Liên chi khởi tạo hồ sơ sự kiện để gửi Đoàn trường phê duyệt theo UC004."
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
          {notice && (
            <div
              className={`mb-4 rounded-[24px] border px-4 py-3 text-sm font-semibold ${
                notice.startsWith('✓') || notice.startsWith('✅')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {notice}
            </div>
          )}

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên sự kiện *</span>
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                placeholder="Nhập tên sự kiện"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Chủ đề</span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc]"
                >
                  <option>Kỹ năng</option>
                  <option>Tình nguyện</option>
                  <option>Học thuật</option>
                  <option>Cộng đồng</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Số lượng tối đa</span>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                  placeholder="Ví dụ: 200"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Bắt đầu *</span>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Kết thúc *</span>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  min={formData.startTime}
                  disabled={!formData.startTime}
                  className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc] disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                {!formData.startTime && <p className="mt-1 text-xs text-slate-500">Vui lòng chọn thời gian bắt đầu trước</p>}
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Địa điểm *</span>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                placeholder="Nhập địa điểm tổ chức"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả sự kiện</span>
              <textarea
                rows="6"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc]"
                placeholder="Mô tả mục tiêu, nội dung và giá trị của sự kiện..."
              />
            </label>
          </div>
        </section>

        <section className="space-y-5">
          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <FileImage className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Ảnh bìa và minh họa</h3>
                <p className="text-sm text-slate-500">Đính kèm poster, ảnh sự kiện và tài liệu cần thiết để gửi lên Đoàn trường.</p>
              </div>
            </div>
            <label className="mt-4 inline-block w-full cursor-pointer rounded-[24px] border border-dashed border-[#b9d1ee] bg-[#f8fbff] px-4 py-8 text-center text-sm text-slate-500">
              <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
              Chấp nhận file `.jpg`, `.png` hoặc tài liệu kế hoạch
            </label>
            {imageFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {imageFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                    <span className="text-xs text-slate-600">{file.name}</span>
                    <button type="button" onClick={() => handleRemoveFile(idx)} className="text-red-500 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <CalendarRange className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#132b57]">Timeline sự kiện</h3>
                <p className="text-sm text-slate-500">Thêm các mốc thời gian và nội dung tương ứng trước khi gửi duyệt.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {timelineItems.map((item, idx) => (
                <div key={`${item.dateTime}-${idx}`} className="flex items-center justify-between rounded-2xl bg-[#f6faff] px-4 py-3 text-sm text-slate-600">
                  <div>
                    <strong>{new Date(item.dateTime).toLocaleString('vi-VN')}</strong>
                    <p>{item.description}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveTimeline(idx)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Ngày giờ timeline *</span>
                <input
                  type="datetime-local"
                  value={newTimelineItem.dateTime}
                  onChange={(e) => setNewTimelineItem((prev) => ({ ...prev, dateTime: e.target.value }))}
                  min={formData.startTime}
                  max={formData.endTime}
                  className="w-full rounded-2xl border border-[#dce8f5] px-3 py-2 text-sm outline-none focus:border-[#1f5dcc]"
                  disabled={!formData.startTime || !formData.endTime}
                />
                {(!formData.startTime || !formData.endTime) && <p className="mt-1 text-xs text-slate-500">Vui lòng chọn thời gian sự kiện trước</p>}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nội dung *</span>
                <input
                  type="text"
                  value={newTimelineItem.description}
                  onChange={(e) => setNewTimelineItem((prev) => ({ ...prev, description: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTimeline()}
                  className="w-full rounded-2xl border border-[#dce8f5] px-3 py-2 text-sm outline-none focus:border-[#1f5dcc]"
                  placeholder="Ví dụ: Phát biểu khai mạc"
                />
              </label>
              <button
                type="button"
                onClick={handleAddTimeline}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-4 py-2 font-semibold text-[#1747a6] transition-all hover:bg-[#f3f8ff]"
              >
                <Plus className="h-5 w-5" />
                Thêm mốc thời gian
              </button>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <h3 className="text-xl font-black text-[#132b57]">Thao tác</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
              >
                <Save className="h-5 w-5 text-[#1747a6]" />
                Lưu nháp
              </button>
              <button
                onClick={handleSubmitEvent}
                disabled={loading}
                className="rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi duyệt sự kiện'}
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </LienChiLayout>
  );
}
