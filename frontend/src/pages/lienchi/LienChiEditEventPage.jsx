import React, { useState, useEffect } from 'react';
import { CalendarRange, FileImage, Plus, Save, X, MapPin, Users, Tag, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';

export default function LienChiEditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Kỹ năng',
    minParticipants: '',
    maxParticipants: '',
    plannedStartDate: '',
    plannedEndDate: '',
    registrationDeadline: '',
    locationName: '',
    locationLat: '',
    locationLng: '',
    attendanceRadius: '',
    description: ''
  });

  // Timeline phases and milestones state (2-level hierarchy)
  const [phases, setPhases] = useState([]);
  const [newPhase, setNewPhase] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    details: []
  });
  const [newMilestone, setNewMilestone] = useState({
    dateTime: '',
    title: '',
    content: ''
  });
  const [activePhaseIndexForMilestone, setActivePhaseIndexForMilestone] = useState(-1);

  // Files state
  const [imageUploads, setImageUploads] = useState([]); // Array of { file, caption, isCover }
  const [existingImages, setExistingImages] = useState([]); // Array of { id, imageUrl, caption, isCover }
  const [documentUploads, setDocumentUploads] = useState([]); // Array of File
  const [existingDocuments, setExistingDocuments] = useState([]); // Array of { id, fileName }
  
  const [replaceImages, setReplaceImages] = useState(false);
  const [replaceDocuments, setReplaceDocuments] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/events/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Không thể tải thông tin sự kiện');
        const data = await response.json();
        const event = data.event;
        
        // Convert to local datetime string format for input type="datetime-local"
        const formatDateTime = (isoStr) => {
          if (!isoStr) return '';
          const d = new Date(isoStr);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().slice(0, 16);
        };

        const formatDateOnly = (isoStr) => {
          if (!isoStr) return '';
          const d = new Date(isoStr);
          return d.toISOString().slice(0, 10);
        };

        setFormData({
          title: event.title || '',
          category: event.category || 'Kỹ năng',
          minParticipants: event.minParticipants || '',
          maxParticipants: event.maxParticipants || '',
          plannedStartDate: formatDateTime(event.plannedStartDate),
          plannedEndDate: formatDateTime(event.plannedEndDate),
          registrationDeadline: formatDateTime(event.registrationDeadline),
          locationName: event.locationName || '',
          locationLat: event.locationLat || '',
          locationLng: event.locationLng || '',
          attendanceRadius: event.attendanceRadius || '',
          description: event.description || '',
        });

        if (event.timelines) {
          setPhases(event.timelines.map(p => ({
            title: p.title,
            startDate: formatDateOnly(p.startDate),
            endDate: formatDateOnly(p.endDate),
            description: p.description || '',
            details: p.details ? p.details.map(d => ({
              dateTime: formatDateTime(d.dateTime),
              title: d.title,
              content: d.content || ''
            })) : []
          })));
        }
        
        if (event.images) {
          setExistingImages(event.images);
        }

        if (event.documents) {
          setExistingDocuments(event.documents);
        }
      } catch (err) {
        setNotice(`Lỗi tải dữ liệu: ${err.message}`);
      }
    };
    fetchEvent();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Image Upload helpers
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      caption: '',
      isCover: false
    }));
    setImageUploads(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    setImageUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageCaptionChange = (index, val) => {
    setImageUploads(prev => prev.map((img, i) => i === index ? { ...img, caption: val } : img));
  };

  const handleImageCoverChange = (index, val) => {
    setImageUploads(prev => prev.map((img, i) => i === index ? { ...img, isCover: val } : img));
  };

  // Document Upload helpers
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setDocumentUploads(prev => [...prev, ...files]);
  };

  const handleRemoveDocument = (index) => {
    setDocumentUploads(prev => prev.filter((_, i) => i !== index));
  };

  // 2-Level Timeline helpers
  const handleAddPhase = () => {
    if (!newPhase.title || !newPhase.startDate || !newPhase.endDate) {
      setNotice('❌ Vui lòng điền tiêu đề, ngày bắt đầu và kết thúc của giai đoạn');
      return;
    }
    setPhases(prev => [...prev, { ...newPhase }]);
    setNewPhase({
      title: '',
      startDate: '',
      endDate: '',
      description: '',
      details: []
    });
    setNotice('');
  };

  const handleRemovePhase = (index) => {
    setPhases(prev => prev.filter((_, i) => i !== index));
    if (activePhaseIndexForMilestone === index) {
      setActivePhaseIndexForMilestone(-1);
    }
  };

  const handleAddMilestone = (phaseIdx) => {
    if (!newMilestone.title || !newMilestone.dateTime) {
      setNotice('❌ Vui lòng nhập tiêu đề và thời điểm diễn ra của mốc chi tiết');
      return;
    }

    setPhases(prev => prev.map((phase, i) => {
      if (i === phaseIdx) {
        const newDetails = [...phase.details, { ...newMilestone }];
        newDetails.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        return { ...phase, details: newDetails };
      }
      return phase;
    }));

    setNewMilestone({
      dateTime: '',
      title: '',
      content: ''
    });
    setNotice('');
  };

  const handleRemoveMilestone = (phaseIdx, milestoneIdx) => {
    setPhases(prev => prev.map((phase, i) => {
      if (i === phaseIdx) {
        return {
          ...phase,
          details: phase.details.filter((_, j) => j !== milestoneIdx)
        };
      }
      return phase;
    }));
  };

  // Save changes to backend
  const handleSubmitEvent = async () => {
    if (!formData.title || !formData.locationName || !formData.plannedStartDate || !formData.plannedEndDate) {
      setNotice('❌ Vui lòng nhập đủ: Tên sự kiện, Địa điểm, Ngày bắt đầu và Ngày kết thúc dự kiến');
      return;
    }

    if (new Date(formData.plannedStartDate) >= new Date(formData.plannedEndDate)) {
      setNotice('❌ Thời gian bắt đầu dự kiến phải trước thời gian kết thúc');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Append core fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append parsed timeline
      formDataToSend.append('timeline', JSON.stringify(phases));

      // Replace flags
      formDataToSend.append('replaceImages', replaceImages ? 'true' : 'false');
      formDataToSend.append('replaceDocuments', replaceDocuments ? 'true' : 'false');

      // Append new image files and metadata
      const imageCaptions = [];
      const imageIsCovers = [];
      imageUploads.forEach((img) => {
        formDataToSend.append('images', img.file);
        imageCaptions.push(img.caption || '');
        imageIsCovers.push(img.isCover);
      });
      formDataToSend.append('imageCaptions', JSON.stringify(imageCaptions));
      formDataToSend.append('imageIsCovers', JSON.stringify(imageIsCovers));

      // Append new document files
      documentUploads.forEach(file => {
        formDataToSend.append('documents', file);
      });

      // Set submit flag for review
      formDataToSend.append('submit', 'true');

      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi cập nhật sự kiện');
      }

      setNotice(`✅ Cập nhật thành công! Chờ chuyển hướng...`);
      setTimeout(() => {
        navigate('/lien-chi/events/manage');
      }, 1500);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LienChiLayout
      currentPath="/lien-chi/events/manage"
      title="Chỉnh sửa sự kiện"
      subtitle="Cập nhật thông tin chi tiết sự kiện và gửi yêu cầu duyệt lại cho Đoàn trường."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left column: Core details form */}
        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 space-y-4">
          {notice && (
            <div
              className={`rounded-[24px] border px-4 py-3 text-sm font-semibold ${
                notice.startsWith('✓') || notice.startsWith('✅')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {notice}
            </div>
          )}

          <div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên sự kiện *</span>
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc] text-sm"
                placeholder="Nhập tên sự kiện"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Thể loại</span>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-[#dce8f5] bg-white px-4 py-3 outline-none focus:border-[#1f5dcc] text-sm"
              >
                <option>Kỹ năng</option>
                <option>Tình nguyện</option>
                <option>Học thuật</option>
                <option>Cộng đồng</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">SL tối thiểu</span>
              <input
                type="number"
                name="minParticipants"
                value={formData.minParticipants}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc] text-sm"
                placeholder="Ví dụ: 20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">SL tối đa</span>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc] text-sm"
                placeholder="Ví dụ: 100"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Bắt đầu dự kiến *</span>
              <CustomDateTimePicker
                value={formData.plannedStartDate}
                onChange={(val) => setFormData(prev => ({ ...prev, plannedStartDate: val }))}
                placeholder="Ngày giờ bắt đầu"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Kết thúc dự kiến *</span>
              <CustomDateTimePicker
                value={formData.plannedEndDate}
                onChange={(val) => setFormData(prev => ({ ...prev, plannedEndDate: val }))}
                min={formData.plannedStartDate}
                disabled={!formData.plannedStartDate}
                placeholder="Ngày giờ kết thúc"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Hạn đăng ký</span>
              <CustomDateTimePicker
                value={formData.registrationDeadline}
                onChange={(val) => setFormData(prev => ({ ...prev, registrationDeadline: val }))}
                placeholder="Hạn sinh viên đăng ký"
              />
            </label>
          </div>

          <div className="border-t border-[#eaf2fb] pt-4 space-y-3">
            <h4 className="text-sm font-bold text-[#132b57] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#1747a6]" />
              Địa điểm và Cấu hình điểm danh QR GPS
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Tên địa điểm / Phòng tổ chức *</span>
                <input
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#dce8f5] px-3 py-2 outline-none focus:border-[#1f5dcc] text-sm"
                  placeholder="Ví dụ: Hội trường A, Khu F - ĐH Bách Khoa"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Vĩ độ (Latitude)</span>
                <input
                  type="number"
                  step="any"
                  name="locationLat"
                  value={formData.locationLat}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#dce8f5] px-3 py-2 outline-none focus:border-[#1f5dcc] text-sm font-mono"
                  placeholder="Ví dụ: 16.074061"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Kinh độ (Longitude)</span>
                <input
                  type="number"
                  step="any"
                  name="locationLng"
                  value={formData.locationLng}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#dce8f5] px-3 py-2 outline-none focus:border-[#1f5dcc] text-sm font-mono"
                  placeholder="Ví dụ: 108.15072"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Bán kính điểm danh (mét)</span>
                <input
                  type="number"
                  name="attendanceRadius"
                  value={formData.attendanceRadius}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#dce8f5] px-3 py-2 outline-none focus:border-[#1f5dcc] text-sm"
                  placeholder="Ví dụ: 50 (bỏ trống nếu không check GPS)"
                />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả sự kiện</span>
            <textarea
              rows="5"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full rounded-[24px] border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc] text-sm leading-relaxed"
              placeholder="Mô tả mục tiêu, yêu cầu tham gia và giá trị mang lại..."
            />
          </label>
        </section>

        {/* Right column: Media + Timeline Builder */}
        <section className="space-y-5">
          {/* Images & Documents Media Uploads */}
          <motion.div whileHover={{ y: -2 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <FileImage className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#132b57]">Ảnh bìa & Tài liệu đính kèm</h3>
                <p className="text-xs text-slate-500">Quản lý và tải thêm tệp tin đính kèm.</p>
              </div>
            </div>

            {/* Existing images view */}
            {!replaceImages && existingImages.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Ảnh hiện tại ({existingImages.length})</span>
                  <button type="button" onClick={() => setReplaceImages(true)} className="text-xs text-red-500 hover:underline">Xóa tất cả & thay mới</button>
                </div>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {existingImages.map((img, idx) => (
                    <div key={idx} className="shrink-0 relative bg-slate-100 rounded-lg p-1">
                      <img src={img.imageUrl} className="h-12 w-16 object-cover rounded" />
                      {img.isCover === 1 && <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] px-1 rounded">Bìa</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing docs view */}
            {!replaceDocuments && existingDocuments.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Tài liệu hiện tại ({existingDocuments.length})</span>
                  <button type="button" onClick={() => setReplaceDocuments(true)} className="text-xs text-red-500 hover:underline">Thay mới tài liệu</button>
                </div>
                <div className="space-y-1">
                  {existingDocuments.map((doc, idx) => (
                    <div key={idx} className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                      <FileText className="h-3 w-3 text-slate-400" />
                      <span className="truncate">{doc.fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload fields */}
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer rounded-xl border border-dashed border-[#b9d1ee] bg-[#f8fbff] p-4 text-center text-xs text-slate-600 hover:bg-[#edf4fc] transition-all flex flex-col items-center justify-center gap-1">
                <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                <FileImage className="h-5 w-5 text-[#1747a6]" />
                {replaceImages ? 'Upload ảnh mới *' : 'Tải thêm ảnh'}
              </label>
              <label className="cursor-pointer rounded-xl border border-dashed border-[#b9d1ee] bg-[#f8fbff] p-4 text-center text-xs text-slate-600 hover:bg-[#edf4fc] transition-all flex flex-col items-center justify-center gap-1">
                <input type="file" multiple className="hidden" onChange={handleDocumentUpload} accept=".pdf,.doc,.docx" />
                <FileText className="h-5 w-5 text-[#1747a6]" />
                {replaceDocuments ? 'Upload doc mới *' : 'Tải thêm tài liệu'}
              </label>
            </div>

            {/* Render new uploads */}
            {imageUploads.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600">Ảnh mới tải lên ({imageUploads.length})</p>
                {imageUploads.map((item, idx) => (
                  <div key={idx} className="flex gap-3 rounded-xl border p-2 bg-slate-50 relative">
                    <img src={URL.createObjectURL(item.file)} className="h-16 w-16 rounded-lg object-cover bg-white" />
                    <div className="flex-1 space-y-1">
                      <input 
                        type="text" 
                        value={item.caption}
                        onChange={(e) => handleImageCaptionChange(idx, e.target.value)}
                        placeholder="Chú thích ảnh..."
                        className="w-full text-xs rounded border px-2 py-0.5"
                      />
                      <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={item.isCover} 
                          onChange={(e) => handleImageCoverChange(idx, e.target.checked)}
                          className="rounded"
                        />
                        Dùng làm ảnh bìa chính (carousel)
                      </label>
                    </div>
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute right-2 top-2 text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {documentUploads.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600">Tài liệu mới tải lên ({documentUploads.length})</p>
                {documentUploads.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-[#1747a6] shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveDocument(idx)} className="text-slate-400 hover:text-red-500 ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* 2-Level Timeline Builder */}
          <motion.div whileHover={{ y: -2 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef6ff] p-3 text-[#1747a6]">
                <CalendarRange className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#132b57]">Timeline Giai đoạn & Mốc</h3>
                <p className="text-xs text-slate-500">Chỉnh sửa timeline của sự kiện.</p>
              </div>
            </div>

            {/* Phases view */}
            {phases.length > 0 && (
              <div className="space-y-3 pt-2">
                {phases.map((phase, phaseIdx) => (
                  <div key={phaseIdx} className="rounded-2xl border border-[#eef5fc] bg-[#f8fbfd] p-3 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-700 text-sm">GD {phaseIdx + 1}: {phase.title}</span>
                        <p className="text-[10px] text-slate-500">{new Date(phase.startDate).toLocaleDateString('vi-VN')} - {new Date(phase.endDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setActivePhaseIndexForMilestone(activePhaseIndexForMilestone === phaseIdx ? -1 : phaseIdx)}
                          className="text-[#1747a6] font-semibold hover:underline"
                        >
                          {activePhaseIndexForMilestone === phaseIdx ? 'Đóng mốc' : '+ Thêm mốc'}
                        </button>
                        <button type="button" onClick={() => handleRemovePhase(phaseIdx)} className="text-red-500 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {phase.description && <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-100">{phase.description}</p>}

                    {/* Milestones listed inside phase */}
                    {phase.details && phase.details.length > 0 && (
                      <div className="bg-white border rounded-xl p-2 space-y-1.5 shadow-sm">
                        {phase.details.map((mile, mileIdx) => (
                          <div key={mileIdx} className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg">
                            <div>
                              <span className="font-bold text-slate-700">{mile.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-2">({new Date(mile.dateTime).toLocaleString('vi-VN')})</span>
                              {mile.content && <p className="text-slate-500 mt-0.5">{mile.content}</p>}
                            </div>
                            <button type="button" onClick={() => handleRemoveMilestone(phaseIdx, mileIdx)} className="text-slate-400 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Milestone Sub-form */}
                    {activePhaseIndexForMilestone === phaseIdx && (
                      <div className="border-t border-slate-100 pt-2 space-y-2 mt-2">
                        <p className="font-bold text-[#132b57] text-[11px]">Thêm mốc chi tiết vào Giai đoạn:</p>
                        <div className="grid gap-2">
                          <input 
                            type="datetime-local" 
                            value={newMilestone.dateTime}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, dateTime: e.target.value }))}
                            className="rounded border p-1 w-full"
                          />
                          <input 
                            type="text" 
                            placeholder="Tiêu đề mốc (Khai mạc, bế mạc...)"
                            value={newMilestone.title}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                            className="rounded border p-1 w-full"
                          />
                          <textarea 
                            placeholder="Nội dung chi tiết..."
                            value={newMilestone.content}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, content: e.target.value }))}
                            className="rounded border p-1 w-full"
                            rows="2"
                          />
                          <button 
                            type="button" 
                            onClick={() => handleAddMilestone(phaseIdx)}
                            className="bg-[#1747a6] text-white py-1 rounded font-bold hover:bg-[#215cd1]"
                          >
                            Xác nhận thêm mốc
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Phase form */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <p className="font-bold text-[#132b57] text-sm">Thêm Giai đoạn mới</p>
              <div className="grid gap-2">
                <input 
                  type="text" 
                  placeholder="Tiêu đề giai đoạn (Đăng ký, Gây quỹ, Tổ chức...)"
                  value={newPhase.title}
                  onChange={(e) => setNewPhase(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-xl border p-2 text-xs w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[10px] text-slate-500">Bắt đầu giai đoạn</span>
                    <input 
                      type="date" 
                      value={newPhase.startDate}
                      onChange={(e) => setNewPhase(prev => ({ ...prev, startDate: e.target.value }))}
                      className="rounded-xl border p-2 text-xs w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500">Kết thúc giai đoạn</span>
                    <input 
                      type="date" 
                      value={newPhase.endDate}
                      onChange={(e) => setNewPhase(prev => ({ ...prev, endDate: e.target.value }))}
                      className="rounded-xl border p-2 text-xs w-full"
                    />
                  </label>
                </div>
                <textarea 
                  placeholder="Mô tả tổng quan giai đoạn..."
                  value={newPhase.description}
                  onChange={(e) => setNewPhase(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-xl border p-2 text-xs w-full"
                  rows="2"
                />
                <button 
                  type="button" 
                  onClick={handleAddPhase}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce8f5] bg-white py-2 font-semibold text-[#1747a6] text-xs transition-all hover:bg-[#f3f8ff]"
                >
                  <Plus className="h-4 w-4" />
                  Xác nhận Giai đoạn
                </button>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div whileHover={{ y: -2 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <h3 className="text-sm font-bold text-[#132b57]">Cập nhật</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/lien-chi/events/manage')}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitEvent}
                disabled={loading}
                className="rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50 flex-1 justify-center text-center shadow-lg shadow-indigo-100"
              >
                {loading ? 'Đang lưu...' : 'Lưu và gửi duyệt lại'}
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </LienChiLayout>
  );
}
