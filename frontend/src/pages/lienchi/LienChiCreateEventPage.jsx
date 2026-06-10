import React, { useState, useEffect } from 'react';
import { CalendarRange, FileImage, Plus, Save, X, MapPin, Users, Tag, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';
import InlineMapPicker from '../../components/common/InlineMapPicker';
import { uploadFile } from '../../utils/upload';

export default function LienChiCreateEventPage() {
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, type: 'error', message: '' });
  const [errors, setErrors] = useState({});
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(-1);
  const [editingPhaseData, setEditingPhaseData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const setNotice = (msg) => {
    if (!msg) return;
    const type = msg.startsWith('✅') || msg.startsWith('✓') ? 'success' : 'error';
    setAlertModal({ show: true, type, message: msg });
  };

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
    description: '',
    leaderId: '',
    communityPoints: ''
  });

  const [users, setUsers] = useState([]);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);
  const [leaderNameDisplay, setLeaderNameDisplay] = useState('');

  const today = new Date();
  const minPlannedStart = new Date(today.getTime() + 48 * 60 * 60 * 1000).toISOString();
  const minRegDeadline = new Date().toISOString();
  const maxRegDeadline = formData.plannedStartDate
    ? new Date(new Date(formData.plannedStartDate).getTime() - 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const handleSelectSelfAsLeader = () => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const matched = users.find(user => user.email === u.email || user.id === u.id);
        if (matched) {
          setFormData(prev => ({ ...prev, leaderId: matched.id }));
          setLeaderSearch(matched.studentId || matched.email || '');
          setLeaderNameDisplay(matched.fullName || matched.name);
        } else {
          setFormData(prev => ({ ...prev, leaderId: u.id }));
          setLeaderSearch(u.studentId || u.email || '');
          setLeaderNameDisplay(u.name || u.fullName || '');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaderSearchChange = (val) => {
    setLeaderSearch(val);
    // Find matching user by studentId (MSSV) exactly
    const matched = users.find(u => (u.studentId || '').toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setFormData(prev => ({ ...prev, leaderId: matched.id }));
      setLeaderNameDisplay(matched.fullName || matched.name);
      setShowLeaderDropdown(false);
    } else {
      setFormData(prev => ({ ...prev, leaderId: '' }));
      setLeaderNameDisplay('');
      setShowLeaderDropdown(true);
    }
  };

  const handleSelectLeader = (u) => {
    setFormData(prev => ({ ...prev, leaderId: u.id }));
    setLeaderSearch(u.studentId || u.email || '');
    setLeaderNameDisplay(u.fullName || u.name);
    setShowLeaderDropdown(false);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const allUsers = data.users || [];
          setUsers(allUsers);

          // Default creator as leader
          try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
              const curUser = JSON.parse(rawUser);
              const matched = allUsers.find(user => user.id === curUser.id || user.email === curUser.email);
              if (matched) {
                setFormData(prev => ({ ...prev, leaderId: matched.id }));
                setLeaderSearch(matched.studentId || matched.email || '');
                setLeaderNameDisplay(matched.fullName || matched.name);
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách người dùng:', err);
      }
    };
    fetchUsers();
  }, []);

  // Timeline phases and milestones state (2-level hierarchy)
  const [phases, setPhases] = useState([]);
  const [newPhase, setNewPhase] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    details: [] // Milestones inside phase
  });
  const [newMilestone, setNewMilestone] = useState({
    dateTime: '',
    title: '',
    content: ''
  });
  const [activePhaseIndexForMilestone, setActivePhaseIndexForMilestone] = useState(-1);

  // Files state
  const [imageUploads, setImageUploads] = useState([]); // Array of { file, caption, isCover }
  const [documentUploads, setDocumentUploads] = useState([]); // Array of File

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    setErrors((prev) => {
      const next = { ...prev, [name]: '' };
      if (name === 'minParticipants' || name === 'maxParticipants') {
        const minRaw = name === 'minParticipants' ? value : formData.minParticipants;
        const maxRaw = name === 'maxParticipants' ? value : formData.maxParticipants;
        const minVal = minRaw !== '' ? parseInt(minRaw, 10) : null;
        const maxVal = maxRaw !== '' ? parseInt(maxRaw, 10) : null;

        // Validate min
        if (minRaw !== '') {
          if (isNaN(minVal) || minVal <= 5) {
            next.minParticipants = 'Số lượng tối thiểu phải lớn hơn 5 người';
          } else {
            next.minParticipants = '';
          }
        } else {
          next.minParticipants = '';
        }

        // Validate max
        if (maxRaw !== '') {
          if (isNaN(maxVal) || maxVal > 100000) {
            next.maxParticipants = 'Số lượng tối đa không vượt quá 100,000 người';
          } else {
            next.maxParticipants = '';
          }
        } else {
          next.maxParticipants = '';
        }

        // Validate min < max
        if (minVal !== null && maxVal !== null && !isNaN(minVal) && !isNaN(maxVal)) {
          if (maxVal <= minVal) {
            next.maxParticipants = 'Số lượng tối đa phải lớn hơn số lượng tối thiểu';
          }
        }
      } else if (name === 'communityPoints') {
        if (value !== '') {
          const pts = parseInt(value, 10);
          if (isNaN(pts) || pts < 0) {
            next.communityPoints = 'Điểm cộng đồng phải là số không âm';
          }
        }
      } else if (name === 'attendanceRadius') {
        if (value !== '') {
          const rad = parseInt(value, 10);
          if (isNaN(rad) || rad <= 0) {
            next.attendanceRadius = 'Bán kính điểm danh phải là số dương';
          }
        }
      }
      return next;
    });
  };

  // Image Upload helpers
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file, idx) => ({
      file,
      caption: '',
      isCover: imageUploads.length === 0 && idx === 0
    }));
    setImageUploads(prev => {
      const updated = [...prev, ...newImages];
      if (updated.length > 0 && !updated.some(img => img.isCover)) {
        updated[0].isCover = true;
      }
      return updated;
    });
  };

  const handleRemoveImage = (index) => {
    setImageUploads(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some(img => img.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  const handleImageCoverChange = (index) => {
    setImageUploads(prev => prev.map((img, i) => ({
      ...img,
      isCover: i === index
    })));
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
  // Compute min for new phase start: the day after the last existing phase ends (if any), or event start
  const getPhaseStartMin = () => {
    if (!formData.plannedStartDate) return '';
    const eventStart = formData.plannedStartDate.split('T')[0];
    if (phases.length === 0) return eventStart;
    // Latest end date among existing phases
    const lastEnd = phases.reduce((max, p) => p.endDate > max ? p.endDate : max, '');
    if (!lastEnd) return eventStart;
    // Next day after lastEnd
    const d = new Date(lastEnd);
    d.setDate(d.getDate() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    const nextDay = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return nextDay > eventStart ? nextDay : eventStart;
  };

  const handleAddPhase = () => {
    if (!newPhase.title || !newPhase.startDate || !newPhase.endDate) {
      setNotice('❌ Vui lòng điền tiêu đề, ngày bắt đầu và kết thúc của giai đoạn');
      return;
    }
    if (!formData.plannedStartDate || !formData.plannedEndDate) {
      setNotice('❌ Vui lòng chọn thời gian bắt đầu và kết thúc dự kiến của sự kiện trước.');
      return;
    }
    const eventStartDateOnly = formData.plannedStartDate.split('T')[0];
    const eventEndDateOnly = formData.plannedEndDate.split('T')[0];

    if (newPhase.startDate < eventStartDateOnly || newPhase.startDate > eventEndDateOnly) {
      setNotice(`❌ Ngày bắt đầu giai đoạn phải nằm trong khoảng sự kiện (${new Date(formData.plannedStartDate + 'Z').toLocaleDateString('vi-VN')} – ${new Date(formData.plannedEndDate + 'Z').toLocaleDateString('vi-VN')})`);
      return;
    }
    if (newPhase.endDate < eventStartDateOnly || newPhase.endDate > eventEndDateOnly) {
      setNotice(`❌ Ngày kết thúc giai đoạn phải nằm trong khoảng sự kiện (${new Date(formData.plannedStartDate + 'Z').toLocaleDateString('vi-VN')} – ${new Date(formData.plannedEndDate + 'Z').toLocaleDateString('vi-VN')})`);
      return;
    }
    if (newPhase.startDate > newPhase.endDate) {
      setNotice('❌ Ngày bắt đầu giai đoạn phải trước hoặc trùng ngày kết thúc.');
      return;
    }

    // Overlap check: new phase must not overlap any existing phase
    const overlapping = phases.find(p =>
      newPhase.startDate <= p.endDate && newPhase.endDate >= p.startDate
    );
    if (overlapping) {
      setNotice(`❌ Giai đoạn mới bị trùng với giai đoạn "${overlapping.title}" (${new Date(overlapping.startDate + 'T00:00').toLocaleDateString('vi-VN')} – ${new Date(overlapping.endDate + 'T00:00').toLocaleDateString('vi-VN')}). Vui lòng chọn khoảng thời gian không chồng lên nhau.`);
      return;
    }

    setPhases(prev => [...prev, { ...newPhase }]);
    setNewPhase({ title: '', startDate: '', endDate: '', description: '', details: [] });
    setNotice('');
  };

  const handleRemovePhase = (index) => {
    setPhases(prev => prev.filter((_, i) => i !== index));
    if (activePhaseIndexForMilestone === index) {
      setActivePhaseIndexForMilestone(-1);
    }
    if (editingPhaseIndex === index) {
      setEditingPhaseIndex(-1);
    }
  };

  const handleStartEditPhase = (index) => {
    setEditingPhaseIndex(index);
    setEditingPhaseData({
      title: phases[index].title,
      startDate: phases[index].startDate,
      endDate: phases[index].endDate,
      description: phases[index].description || ''
    });
  };

  const handleSaveEditPhase = (index) => {
    if (!editingPhaseData.title || !editingPhaseData.startDate || !editingPhaseData.endDate) {
      setNotice('❌ Vui lòng điền đầy đủ tiêu đề, ngày bắt đầu và kết thúc của giai đoạn');
      return;
    }
    if (!formData.plannedStartDate || !formData.plannedEndDate) {
      setNotice('❌ Vui lòng chọn thời gian bắt đầu và kết thúc dự kiến của sự kiện trước.');
      return;
    }
    const eventStartDateOnly = formData.plannedStartDate.split('T')[0];
    const eventEndDateOnly = formData.plannedEndDate.split('T')[0];

    if (editingPhaseData.startDate < eventStartDateOnly || editingPhaseData.startDate > eventEndDateOnly) {
      setNotice(`❌ Ngày bắt đầu của giai đoạn phải nằm trong khoảng thời gian của sự kiện (${new Date(formData.plannedStartDate).toLocaleDateString('vi-VN')} - ${new Date(formData.plannedEndDate).toLocaleDateString('vi-VN')})`);
      return;
    }
    if (editingPhaseData.endDate < eventStartDateOnly || editingPhaseData.endDate > eventEndDateOnly) {
      setNotice(`❌ Ngày kết thúc của giai đoạn phải nằm trong khoảng thời gian của sự kiện (${new Date(formData.plannedStartDate).toLocaleDateString('vi-VN')} - ${new Date(formData.plannedEndDate).toLocaleDateString('vi-VN')})`);
      return;
    }
    if (editingPhaseData.startDate > editingPhaseData.endDate) {
      setNotice('❌ Ngày bắt đầu của giai đoạn phải trước hoặc trùng ngày kết thúc.');
      return;
    }

    // Overlap check
    const overlapping = phases.find((p, idx) =>
      idx !== index && editingPhaseData.startDate <= p.endDate && editingPhaseData.endDate >= p.startDate
    );
    if (overlapping) {
      setNotice(`❌ Giai đoạn bị trùng với giai đoạn "${overlapping.title}" (${new Date(overlapping.startDate + 'T00:00').toLocaleDateString('vi-VN')} – ${new Date(overlapping.endDate + 'T00:00').toLocaleDateString('vi-VN')}).`);
      return;
    }

    setPhases(prev => prev.map((p, i) => {
      if (i === index) {
        return {
          ...p,
          ...editingPhaseData
        };
      }
      return p;
    }));
    setEditingPhaseIndex(-1);
    setNotice('');
  };

  const handleCancelEditPhase = () => {
    setEditingPhaseIndex(-1);
  };

  const handleAddMilestone = (phaseIdx) => {
    if (!newMilestone.title || !newMilestone.dateTime) {
      setNotice('❌ Vui lòng nhập tiêu đề và thời điểm diễn ra của mốc chi tiết');
      return;
    }

    const phase = phases[phaseIdx];
    const mileDateOnly = newMilestone.dateTime.split('T')[0];
    if (mileDateOnly < phase.startDate || mileDateOnly > phase.endDate) {
      setNotice(`❌ Ngày diễn ra mốc chi tiết phải nằm trong giai đoạn ${phase.title} (${new Date(phase.startDate).toLocaleDateString('vi-VN')} - ${new Date(phase.endDate).toLocaleDateString('vi-VN')})`);
      return;
    }

    setPhases(prev => prev.map((phaseItem, i) => {
      if (i === phaseIdx) {
        const newDetails = [...phaseItem.details, { ...newMilestone }];
        newDetails.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        return { ...phaseItem, details: newDetails };
      }
      return phaseItem;
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

  // Save draft – call backend API, fallback to localStorage
  const handleSaveDraft = async () => {
    if (!formData.title) {
      setNotice('❌ Tên sự kiện là bắt buộc để lưu nháp');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(key => { if (formData[key] !== '') fd.append(key, formData[key]); });
      fd.append('timeline', JSON.stringify(phases));
      imageUploads.forEach(img => fd.append('images', img.file));
      fd.append('imageCaptions', JSON.stringify(imageUploads.map(i => i.caption || '')));
      fd.append('imageIsCovers', JSON.stringify(imageUploads.map(i => i.isCover)));
      documentUploads.forEach(file => fd.append('documents', file));
      // No 'submit' flag → backend creates as status='draft'
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi lưu nháp');
      setNotice(`✅ Đã lưu nháp sự kiện lên server (ID: ${data.event?.id || ''})`);
    } catch (err) {
      // Fallback: save to localStorage
      localStorage.setItem('lienChiEventDraftV2', JSON.stringify({ formData, phases }));
      setNotice('✓ Đã lưu nháp vào bộ nhớ cục bộ (không kết nối được server).');
    } finally {
      setLoading(false);
    }
  };

  // Submit to backend
  const handleSubmitEvent = async () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Tên sự kiện là bắt buộc';
    if (!formData.locationName) newErrors.locationName = 'Tên địa điểm là bắt buộc';
    if (!formData.plannedStartDate) newErrors.plannedStartDate = 'Thời gian bắt đầu dự kiến là bắt buộc';
    if (!formData.plannedEndDate) newErrors.plannedEndDate = 'Thời gian kết thúc dự kiến là bắt buộc';

    // Participant range validation: min > 5, max <= 100000
    if (formData.minParticipants) {
      const minP = parseInt(formData.minParticipants, 10);
      if (isNaN(minP) || minP <= 5) {
        newErrors.minParticipants = 'Số lượng tối thiểu phải lớn hơn 5 người';
      }
    }
    if (formData.maxParticipants) {
      const maxP = parseInt(formData.maxParticipants, 10);
      if (isNaN(maxP) || maxP > 100000) {
        newErrors.maxParticipants = 'Số lượng tối đa không vượt quá 100,000 người';
      }
    }
    if (formData.minParticipants && formData.maxParticipants) {
      const minP = parseInt(formData.minParticipants, 10);
      const maxP = parseInt(formData.maxParticipants, 10);
      if (!isNaN(minP) && !isNaN(maxP) && maxP <= minP) {
        newErrors.maxParticipants = 'Số lượng tối đa phải lớn hơn số lượng tối thiểu';
      }
    }

    if (formData.communityPoints) {
      const pts = parseInt(formData.communityPoints, 10);
      if (isNaN(pts) || pts < 0) {
        newErrors.communityPoints = 'Điểm cộng đồng phải là số không âm';
      }
    }

    if (formData.attendanceRadius) {
      const rad = parseInt(formData.attendanceRadius, 10);
      if (isNaN(rad) || rad <= 0) {
        newErrors.attendanceRadius = 'Bán kính điểm danh phải là số dương';
      }
    }

    const today = new Date();
    if (formData.plannedStartDate) {
      const startDt = new Date(formData.plannedStartDate);
      const minStartDt = new Date(today.getTime() + 48 * 60 * 60 * 1000);
      if (startDt < minStartDt) {
        newErrors.plannedStartDate = 'Thời gian bắt đầu dự kiến phải sau thời điểm hiện tại ít nhất 48 giờ (2 ngày)';
      }
    }

    if (formData.plannedStartDate && formData.plannedEndDate) {
      const startDt = new Date(formData.plannedStartDate);
      const endDt = new Date(formData.plannedEndDate);
      if (startDt >= endDt) {
        newErrors.plannedEndDate = 'Thời gian kết thúc dự kiến phải sau thời gian bắt đầu';
      }
    }

    if (formData.registrationDeadline) {
      const regDeadline = new Date(formData.registrationDeadline);

      if (regDeadline <= today) {
        newErrors.registrationDeadline = 'Hạn đăng ký phải sau thời điểm hiện tại';
      } else if (formData.plannedStartDate) {
        const startDt = new Date(formData.plannedStartDate);
        // Hạn đăng ký phải trước plannedStartDate tối thiểu 24h
        const maxRegDeadlineVal = new Date(startDt.getTime() - 24 * 60 * 60 * 1000);
        if (regDeadline > maxRegDeadlineVal) {
          newErrors.registrationDeadline = 'Hạn đăng ký phải trước thời gian bắt đầu sự kiện tối thiểu 24 giờ';
        }
      }
    }

    if (!formData.locationLat || !formData.locationLng) {
      newErrors.locationCoords = 'Vui lòng chọn tọa độ vị trí sự kiện trên bản đồ';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setNotice('❌ Vui lòng điền và sửa các lỗi nhập liệu bên dưới (các ô viền đỏ).');
      return;
    }

    setLoading(true);
    setNotice('⏳ Đang upload file (nếu có), vui lòng đợi...');
    try {
      // 1. Upload images sequentially
      const uploadedImagesData = [];
      for (let i = 0; i < imageUploads.length; i++) {
        const img = imageUploads[i];
        setNotice(`⏳ Đang upload ảnh ${i + 1}/${imageUploads.length}...`);
        const result = await uploadFile(img.file);
        uploadedImagesData.push({
          url: result.url,
          caption: img.caption || '',
          isCover: img.isCover
        });
      }

      // 2. Upload documents sequentially
      const uploadedDocumentsData = [];
      for (let i = 0; i < documentUploads.length; i++) {
        const doc = documentUploads[i];
        setNotice(`⏳ Đang upload tài liệu ${i + 1}/${documentUploads.length}...`);
        const result = await uploadFile(doc);
        uploadedDocumentsData.push({
          url: result.url,
          fileName: doc.name,
          fileSize: doc.size,
          fileType: doc.name.split('.').pop() || null
        });
      }

      setNotice('⏳ Đang lưu dữ liệu sự kiện...');
      setNotice('⏳ Đang lưu dữ liệu sự kiện...');
      
      const payload = {
        ...formData,
        timeline: phases, // pass as object, backend handles JSON.parse or object
        submit: 'true'
      };

      if (uploadedImagesData.length > 0) {
        payload.uploadedImages = uploadedImagesData;
      }
      if (uploadedDocumentsData.length > 0) {
        payload.uploadedDocuments = uploadedDocumentsData;
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi tạo sự kiện');
      }

      setNotice(`✅ Tạo sự kiện thành công! ID: ${data.event.id}`);

      // Clear Form
      setFormData({
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
        description: '',
        leaderId: '',
        communityPoints: ''
      });
      setLeaderSearch('');
      setLeaderNameDisplay('');
      setPhases([]);
      setImageUploads([]);
      setDocumentUploads([]);
    } catch (err) {
      setNotice(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LienChiLayout
      currentPath="/lien-chi/events/create"
      title="Tạo sự kiện"
      subtitle="Liên chi khởi tạo hồ sơ sự kiện kèm thông tin địa điểm GPS, tài liệu và các giai đoạn chi tiết."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left column: Core details form */}
        <section className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6 space-y-4">

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên sự kiện *</span>
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border px-4 py-3 outline-none text-sm transition-all ${
                  errors.title ? 'border-rose-500 focus:border-rose-500 bg-rose-50/30' : 'border-[#dce8f5] focus:border-[#1f5dcc]'
                }`}
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.title}
                </p>
              )}
            </label>
            <label className="block relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">Người chủ trì (Leader)</span>
                <button
                  type="button"
                  onClick={handleSelectSelfAsLeader}
                  className="text-xs font-bold text-[#1f5dcc] hover:underline"
                >
                  Chọn tôi
                </button>
              </div>
              <input
                type="text"
                value={leaderSearch}
                onChange={(e) => handleLeaderSearchChange(e.target.value)}
                onFocus={() => setShowLeaderDropdown(true)}
                onBlur={() => setTimeout(() => setShowLeaderDropdown(false), 200)}
                className="w-full rounded-2xl border border-[#dce8f5] px-4 py-3 outline-none focus:border-[#1f5dcc] text-sm"
              />
              {leaderNameDisplay && (
                <div className="mt-1 text-xs font-bold text-emerald-600">
                  ✓ Người chủ trì: {leaderNameDisplay}
                </div>
              )}
              {showLeaderDropdown && leaderSearch && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-[#dce8f5] bg-white p-2 shadow-lg">
                  {users.filter(u => 
                    (u.studentId || '').toLowerCase().includes(leaderSearch.toLowerCase()) ||
                    (u.fullName || u.name || '').toLowerCase().includes(leaderSearch.toLowerCase())
                  ).length === 0 ? (
                    <div className="p-3 text-xs text-slate-500">Không tìm thấy người dùng phù hợp</div>
                  ) : (
                    users.filter(u => 
                      (u.studentId || '').toLowerCase().includes(leaderSearch.toLowerCase()) ||
                      (u.fullName || u.name || '').toLowerCase().includes(leaderSearch.toLowerCase())
                    ).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectLeader(u)}
                        className="w-full rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 transition-all font-medium"
                      >
                        <span className="font-bold">{u.studentId || 'N/A'}</span> - {u.fullName || u.name} <span className="text-slate-400">({u.role})</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
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
                className={`w-full rounded-2xl border px-4 py-3 outline-none text-sm transition-all ${
                  errors.minParticipants ? 'border-rose-500 focus:border-rose-500 bg-rose-50/30' : 'border-[#dce8f5] focus:border-[#1f5dcc]'
                }`}
              />
              {errors.minParticipants && (
                <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.minParticipants}
                </p>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">SL tối đa</span>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border px-4 py-3 outline-none text-sm transition-all ${
                  errors.maxParticipants ? 'border-rose-500 focus:border-rose-500 bg-rose-50/30' : 'border-[#dce8f5] focus:border-[#1f5dcc]'
                }`}
              />
              {errors.maxParticipants && (
                <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.maxParticipants}
                </p>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Điểm cộng đồng</span>
              <input
                type="number"
                name="communityPoints"
                value={formData.communityPoints}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border px-4 py-3 outline-none text-sm ${
                  errors.communityPoints ? 'border-rose-500 bg-rose-50/30 focus:border-rose-500' : 'border-[#dce8f5] focus:border-[#1f5dcc]'
                }`}
                placeholder="Ví dụ: 5"
              />
              {errors.communityPoints && (
                <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.communityPoints}
                </p>
              )}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Bắt đầu dự kiến *</span>
              <CustomDateTimePicker
                value={formData.plannedStartDate}
                onChange={(val) => {
                  setFormData(prev => {
                    const nextData = { ...prev, plannedStartDate: val };
                    if (prev.registrationDeadline && val) {
                      const regTime = new Date(prev.registrationDeadline).getTime();
                      const maxRegTime = new Date(val).getTime() - 1 * 24 * 60 * 60 * 1000;
                      if (regTime > maxRegTime) {
                        nextData.registrationDeadline = '';
                      }
                    }
                    return nextData;
                  });
                  if (errors.plannedStartDate) setErrors(prev => ({ ...prev, plannedStartDate: '' }));
                }}
                min={minPlannedStart}
                placeholder="Ngày giờ bắt đầu"
                hasError={!!errors.plannedStartDate}
              />
              {errors.plannedStartDate && (
                <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.plannedStartDate}
                </p>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Kết thúc dự kiến *</span>
              <CustomDateTimePicker
                value={formData.plannedEndDate}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, plannedEndDate: val }));
                  if (errors.plannedEndDate) setErrors(prev => ({ ...prev, plannedEndDate: '' }));
                }}
                min={formData.plannedStartDate}
                disabled={!formData.plannedStartDate}
                placeholder="Ngày giờ kết thúc"
                hasError={!!errors.plannedEndDate}
              />
              {errors.plannedEndDate && (
                <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.plannedEndDate}
                </p>
              )}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Hạn đăng ký</span>
              <CustomDateTimePicker
                value={formData.registrationDeadline}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, registrationDeadline: val }));
                  if (errors.registrationDeadline) setErrors(prev => ({ ...prev, registrationDeadline: '' }));
                }}
                min={minRegDeadline}
                max={maxRegDeadline}
                disabled={!formData.plannedStartDate || !formData.plannedEndDate}
                placeholder="Hạn sinh viên đăng ký"
                hasError={!!errors.registrationDeadline}
              />
              {errors.registrationDeadline && (
                <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <span>⚠</span> {errors.registrationDeadline}
                </p>
              )}
            </label>
            <div className="hidden sm:block"></div>
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
                  className={`w-full rounded-xl border px-3 py-2 outline-none text-sm transition-all ${
                    errors.locationName ? 'border-rose-500 focus:border-rose-500 bg-rose-50/30' : 'border-[#dce8f5] focus:border-[#1f5dcc]'
                  }`}
                />
                {errors.locationName && (
                  <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                    <span>⚠</span> {errors.locationName}
                  </p>
                )}
              </label>
              <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Vĩ độ (Latitude) *</span>
                  <input
                    type="number"
                    step="any"
                    name="locationLat"
                    value={formData.locationLat}
                    readOnly
                    placeholder="Chưa chọn"
                    className="w-full rounded-xl border border-[#dce8f5] bg-slate-50 px-3 py-2 outline-none text-sm font-mono cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Kinh độ (Longitude) *</span>
                  <input
                    type="number"
                    step="any"
                    name="locationLng"
                    value={formData.locationLng}
                    readOnly
                    placeholder="Chưa chọn"
                    className="w-full rounded-xl border border-[#dce8f5] bg-slate-50 px-3 py-2 outline-none text-sm font-mono cursor-not-allowed"
                  />
                </label>
              </div>
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600 font-bold">Bản đồ chọn tọa độ (GPS):</span>
                <InlineMapPicker
                  lat={formData.locationLat}
                  lng={formData.locationLng}
                  onChange={(coords) => {
                    setFormData(prev => ({
                      ...prev,
                      locationLat: coords.lat,
                      locationLng: coords.lng
                    }));
                    if (errors.locationCoords) setErrors(prev => ({ ...prev, locationCoords: '' }));
                  }}
                />
                {errors.locationCoords && (
                  <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                    <span>⚠</span> {errors.locationCoords}
                  </p>
                )}
              </div>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Bán kính điểm danh (mét)</span>
                <input
                  type="number"
                  name="attendanceRadius"
                  value={formData.attendanceRadius}
                  onChange={handleInputChange}
                  className={`w-full rounded-xl border px-3 py-2 outline-none text-sm ${
                    errors.attendanceRadius ? 'border-rose-500 bg-rose-50/30 focus:border-rose-500' : 'border-[#dce8f5] focus:border-[#1f5dcc]'
                  }`}
                />
                {errors.attendanceRadius && (
                  <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">
                    <span>⚠</span> {errors.attendanceRadius}
                  </p>
                )}
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
                <p className="text-xs text-slate-500">Nhiều ảnh bìa (carousel) và các file kế hoạch PDF/Word.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer rounded-xl border border-dashed border-[#b9d1ee] bg-[#f8fbff] p-4 text-center text-xs text-slate-600 hover:bg-[#edf4fc] transition-all flex flex-col items-center justify-center gap-1">
                <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                <FileImage className="h-5 w-5 text-[#1747a6]" />
                Tải ảnh bìa
              </label>
              <label className="cursor-pointer rounded-xl border border-dashed border-[#b9d1ee] bg-[#f8fbff] p-4 text-center text-xs text-slate-600 hover:bg-[#edf4fc] transition-all flex flex-col items-center justify-center gap-1">
                <input type="file" multiple className="hidden" onChange={handleDocumentUpload} accept=".pdf,.doc,.docx" />
                <FileText className="h-5 w-5 text-[#1747a6]" />
                Đính kèm tài liệu
              </label>
            </div>

            {/* Render uploaded image previews & cover config */}
            {imageUploads.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600">Danh sách ảnh ({imageUploads.length})</p>
                {imageUploads.map((item, idx) => (
                  <div key={idx} className="flex gap-3 rounded-xl border p-2 bg-slate-50 relative items-center">
                    <img src={URL.createObjectURL(item.file)} className="h-16 w-16 rounded-lg object-cover bg-white" />
                    <div className="flex-1 space-y-1">
                      <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer font-semibold">
                        <input 
                          type="radio" 
                          name="coverImage"
                          checked={item.isCover} 
                          onChange={() => handleImageCoverChange(idx)}
                          className="text-[#1747a6] focus:ring-[#1747a6]"
                        />
                        Chọn làm ảnh bìa chính (carousel)
                      </label>
                    </div>
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute right-2 top-2 text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Render uploaded document list */}
            {documentUploads.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600">Danh sách tài liệu ({documentUploads.length})</p>
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
                <p className="text-xs text-slate-500">Xây dựng timeline 2 cấp: Giai đoạn lớn và các mốc chi tiết bên trong.</p>
              </div>
            </div>

            {/* Phases view */}
            {phases.length > 0 && (
              <div className="space-y-3 pt-2">
                {phases.map((phase, phaseIdx) => (
                  <div key={phaseIdx} className="rounded-2xl border border-[#eef5fc] bg-[#f8fbfd] p-3 text-xs space-y-2">
                    {editingPhaseIndex === phaseIdx ? (
                      <div className="bg-white rounded-xl border p-3 space-y-3 shadow-inner">
                        <p className="font-bold text-slate-700 text-xs">Chỉnh sửa Giai đoạn {phaseIdx + 1}</p>
                        <div className="space-y-2">
                          <label className="block">
                            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Tiêu đề *</span>
                            <input 
                              type="text" 
                              value={editingPhaseData.title}
                              onChange={(e) => setEditingPhaseData(prev => ({ ...prev, title: e.target.value }))}
                              className="rounded-xl border border-[#dce8f5] px-3 py-1.5 text-xs w-full outline-none focus:border-[#1f5dcc]"
                            />
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Bắt đầu</span>
                              <CustomDateTimePicker
                                dateOnly
                                value={editingPhaseData.startDate}
                                onChange={(val) => setEditingPhaseData(prev => ({ ...prev, startDate: val }))}
                                min={formData.plannedStartDate ? formData.plannedStartDate.split('T')[0] : undefined}
                                max={editingPhaseData.endDate || (formData.plannedEndDate ? formData.plannedEndDate.split('T')[0] : undefined)}
                                placeholder="Ngày bắt đầu"
                              />
                            </label>
                            <label className="block">
                              <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Kết thúc</span>
                              <CustomDateTimePicker
                                dateOnly
                                value={editingPhaseData.endDate}
                                onChange={(val) => setEditingPhaseData(prev => ({ ...prev, endDate: val }))}
                                min={editingPhaseData.startDate || (formData.plannedStartDate ? formData.plannedStartDate.split('T')[0] : undefined)}
                                max={formData.plannedEndDate ? formData.plannedEndDate.split('T')[0] : undefined}
                                placeholder="Ngày kết thúc"
                              />
                            </label>
                          </div>
                          <label className="block">
                            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Mô tả</span>
                            <textarea 
                              value={editingPhaseData.description}
                              onChange={(e) => setEditingPhaseData(prev => ({ ...prev, description: e.target.value }))}
                              className="rounded-xl border border-[#dce8f5] px-3 py-1.5 text-xs w-full outline-none focus:border-[#1f5dcc]"
                              rows="2"
                            />
                          </label>
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleSaveEditPhase(phaseIdx)}
                              className="flex-1 rounded-xl bg-[#1747a6] py-1.5 text-white font-bold hover:bg-[#1f5dcc] transition-colors"
                            >
                              Lưu GD
                            </button>
                            <button 
                              type="button" 
                              onClick={handleCancelEditPhase}
                              className="rounded-xl border border-[#dce8f5] bg-white px-4 py-1.5 font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-700 text-sm">GD {phaseIdx + 1}: {phase.title}</span>
                            <p className="text-[10px] text-slate-500">{new Date(phase.startDate).toLocaleDateString('vi-VN')} - {new Date(phase.endDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleStartEditPhase(phaseIdx)}
                              className="text-xs font-bold text-[#1f5dcc] hover:underline"
                            >
                              Sửa
                            </button>
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
                      </>
                    )}

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
                      <div className="border-t border-slate-100 pt-3 space-y-2 mt-2">
                        <p className="font-bold text-[#132b57] text-[11px]">Thêm mốc chi tiết vào: <span className="text-[#1747a6]">{phases[phaseIdx]?.title}</span></p>
                        <p className="text-[10px] text-slate-400">Chọn thời gian trong khoảng {new Date(phases[phaseIdx]?.startDate + 'T00:00').toLocaleDateString('vi-VN')} – {new Date(phases[phaseIdx]?.endDate + 'T00:00').toLocaleDateString('vi-VN')}</p>
                        <div className="grid gap-2">
                          <label className="block">
                            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Thời gian diễn ra mốc *</span>
                            <CustomDateTimePicker
                              value={newMilestone.dateTime}
                              onChange={(val) => setNewMilestone(prev => ({ ...prev, dateTime: val }))}
                              min={phases[phaseIdx] ? `${phases[phaseIdx].startDate}T00:00` : ''}
                              max={phases[phaseIdx] ? `${phases[phaseIdx].endDate}T23:59` : ''}
                              placeholder="Chọn thời điểm mốc"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Tiêu đề mốc *</span>
                            <input 
                              type="text" 
                              value={newMilestone.title}
                              onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                              className="rounded-xl border border-[#dce8f5] px-3 py-2 text-xs w-full outline-none focus:border-[#1f5dcc]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Nội dung chi tiết mốc</span>
                            <textarea 
                              value={newMilestone.content}
                              onChange={(e) => setNewMilestone(prev => ({ ...prev, content: e.target.value }))}
                              className="rounded-xl border border-[#dce8f5] px-3 py-2 text-xs w-full outline-none focus:border-[#1f5dcc]"
                              rows="2"
                            />
                          </label>
                          <button 
                            type="button" 
                            onClick={() => handleAddMilestone(phaseIdx)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1747a6] py-2 text-white text-xs font-bold hover:bg-[#215cd1] transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Xác nhận thêm mốc
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
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#132b57] text-sm">Thêm Giai đoạn mới</p>
                {!formData.plannedStartDate || !formData.plannedEndDate ? (
                  <span className="text-[10px] text-amber-500 font-semibold">⚠ Chọn ngày sự kiện trước</span>
                ) : (
                  <span className="text-[10px] text-slate-400">Trong khoảng: {new Date(formData.plannedStartDate).toLocaleDateString('vi-VN')} – {new Date(formData.plannedEndDate).toLocaleDateString('vi-VN')}</span>
                )}
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Tiêu đề giai đoạn *</span>
                  <input 
                    type="text" 
                    value={newPhase.title}
                    onChange={(e) => setNewPhase(prev => ({ ...prev, title: e.target.value }))}
                    className="rounded-xl border border-[#dce8f5] px-3 py-2 text-xs w-full outline-none focus:border-[#1f5dcc]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Bắt đầu giai đoạn *</span>
                    <CustomDateTimePicker
                      dateOnly
                      value={newPhase.startDate}
                      onChange={(val) => setNewPhase(prev => ({
                        ...prev,
                        startDate: val,
                        // Auto-clear endDate if it's before the new startDate
                        endDate: prev.endDate && prev.endDate < val ? '' : prev.endDate
                      }))}
                      min={getPhaseStartMin()}
                      max={newPhase.endDate || (formData.plannedEndDate ? formData.plannedEndDate.split('T')[0] : '')}
                      disabled={!formData.plannedStartDate || !formData.plannedEndDate}
                      placeholder="Ngày bắt đầu"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Kết thúc giai đoạn *</span>
                    <CustomDateTimePicker
                      dateOnly
                      value={newPhase.endDate}
                      onChange={(val) => setNewPhase(prev => ({ ...prev, endDate: val }))}
                      min={newPhase.startDate || getPhaseStartMin()}
                      max={formData.plannedEndDate ? formData.plannedEndDate.split('T')[0] : ''}
                      disabled={!formData.plannedStartDate || !formData.plannedEndDate}
                      placeholder="Ngày kết thúc"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Mô tả tổng quan giai đoạn</span>
                  <textarea 
                    value={newPhase.description}
                    onChange={(e) => setNewPhase(prev => ({ ...prev, description: e.target.value }))}
                    className="rounded-xl border border-[#dce8f5] px-3 py-2 text-xs w-full outline-none focus:border-[#1f5dcc]"
                    rows="2"
                  />
                </label>
                <button 
                  type="button" 
                  onClick={handleAddPhase}
                  disabled={!formData.plannedStartDate || !formData.plannedEndDate}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce8f5] bg-white py-2.5 font-semibold text-[#1747a6] text-xs transition-all hover:bg-[#f3f8ff] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  Xác nhận thêm Giai đoạn
                </button>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div whileHover={{ y: -2 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-5">
            <h3 className="text-sm font-bold text-[#132b57]">Lưu hoặc Gửi duyệt</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dce8f5] bg-white px-5 py-3 font-semibold text-slate-600 transition-all hover:bg-[#f3f8ff] disabled:opacity-50"
              >
                <Save className="h-5 w-5 text-[#1747a6]" />
                Lưu nháp
              </button>
              <button
                type="button"
                onClick={handleSubmitEvent}
                disabled={loading}
                className="rounded-2xl bg-[#1747a6] px-5 py-3 font-bold text-white transition-all hover:bg-[#205fd8] disabled:opacity-50 flex-1 justify-center text-center shadow-lg shadow-indigo-100"
              >
                {loading ? 'Đang gửi...' : 'Gửi duyệt ngay'}
              </button>
            </div>
          </motion.div>
        </section>
      </div>
      {/* Custom Alert Modal popup overlay */}
      {alertModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
              alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
            }`}>
              {alertModal.type === 'success' ? '✓' : '⚠️'}
            </div>
            <h3 className="text-lg font-black text-[#132b57]">
              {alertModal.type === 'success' ? 'Thành công' : 'Thông báo'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {alertModal.message}
            </p>
            <button
              type="button"
              onClick={() => setAlertModal({ show: false, type: 'error', message: '' })}
              className="w-full rounded-xl bg-[#1747a6] py-3 text-sm font-bold text-white shadow-md hover:bg-[#205fd8] transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </LienChiLayout>
  );
}
