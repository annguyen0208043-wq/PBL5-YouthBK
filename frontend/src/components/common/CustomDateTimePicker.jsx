import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CustomDateTimePicker
 * Props:
 *   value       – ISO string (YYYY-MM-DDTHH:mm) or YYYY-MM-DD when dateOnly=true
 *   onChange    – (valueStr) => void
 *   min / max   – ISO or YYYY-MM-DD constraint strings
 *   disabled    – bool
 *   placeholder – string
 *   hasError    – bool
 *   dateOnly    – bool  → hides time columns, emits YYYY-MM-DD
 */
export default function CustomDateTimePicker({ value, onChange, min, max, disabled, placeholder, hasError, dateOnly = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const containerRef = useRef(null);
  const calendarRef = useRef(null);

  // Normalise the value to a date-string part
  const parseDateStr = (v) => {
    if (!v) return '';
    return v.includes('T') ? v.split('T')[0] : v;
  };

  const dateObj = value ? new Date(value) : null;
  const [date, setDate] = useState(parseDateStr(value));
  const [hour, setHour] = useState(dateObj && !dateOnly ? dateObj.getHours() : 0);
  const [minute, setMinute] = useState(dateObj && !dateOnly ? dateObj.getMinutes() : 0);

  // Calendar states
  const today = new Date();
  const [calMonth, setCalMonth] = useState(dateObj ? dateObj.getMonth() : today.getMonth());
  const [calYear, setCalYear] = useState(dateObj ? dateObj.getFullYear() : today.getFullYear());

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  useEffect(() => {
    if (value) {
      const dStr = parseDateStr(value);
      setDate(dStr);
      if (!dateOnly) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          setHour(d.getHours());
          setMinute(d.getMinutes());
          setCalMonth(d.getMonth());
          setCalYear(d.getFullYear());
        }
      } else if (dStr) {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          setCalMonth(parseInt(parts[1], 10) - 1);
          setCalYear(parseInt(parts[0], 10));
        }
      }
    } else {
      setDate('');
      if (!dateOnly) { setHour(0); setMinute(0); }
    }
  }, [value, dateOnly]);

  const pad = (num) => {
    if (num === '' || num === null || num === undefined) return '00';
    return String(num).padStart(2, '0');
  };

  const emitChange = (newDate, newHour, newMinute) => {
    if (!newDate) return;
    if (dateOnly) {
      onChange(newDate);
    } else {
      onChange(`${newDate}T${pad(newHour)}:${pad(newMinute)}`);
    }
  };

  const handleHourSelect = (h) => {
    setHour(h);
    emitChange(date, h, minute);
  };

  const handleMinuteSelect = (m) => {
    setMinute(m);
    emitChange(date, hour, m);
  };

  // Handle outside click for main popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplay = () => {
    if (!value) return placeholder || (dateOnly ? 'Chọn ngày...' : 'Chọn thời gian...');
    const d = new Date(dateOnly ? `${value}T00:00` : value);
    if (isNaN(d.getTime())) return placeholder || (dateOnly ? 'Chọn ngày...' : 'Chọn thời gian...');
    if (dateOnly) {
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Parse min / max
  const minDateStr = min ? parseDateStr(min) : '';
  const maxDateStr = max ? parseDateStr(max) : '';

  const minD = min ? new Date(min) : null;
  const maxD = max ? new Date(max) : null;
  const minH = minD ? minD.getHours() : 0;
  const minM = minD ? minD.getMinutes() : 0;
  const maxH = maxD ? maxD.getHours() : 23;
  const maxM = maxD ? maxD.getMinutes() : 59;

  const isHourDisabled = (h) => {
    if (minDateStr && date === minDateStr && h < minH) return true;
    if (maxDateStr && date === maxDateStr && h > maxH) return true;
    return false;
  };

  const isMinuteDisabled = (m) => {
    if (minDateStr && date === minDateStr && hour === minH && m <= minM) return true;
    if (maxDateStr && date === maxDateStr && hour === maxH && m > maxM) return true;
    return false;
  };

  const isValidTime = () => {
    if (!date) return true;
    if (dateOnly) {
      if (minDateStr && date < minDateStr) return false;
      if (maxDateStr && date > maxDateStr) return false;
      return true;
    }
    const h = hour === '' ? 0 : hour;
    const m = minute === '' ? 0 : minute;
    const currentDt = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    if (min) { const minDt = new Date(min); if (currentDt < minDt) return false; }
    if (max) { const maxDt = new Date(max); if (currentDt > maxDt) return false; }
    return true;
  };

  // Calendar logic
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = (e) => {
    e.stopPropagation();
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  const handleDaySelect = (d) => {
    const newDateStr = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
    setDate(newDateStr);
    emitChange(newDateStr, hour, minute);
    setShowCalendar(false);
    // If dateOnly, close the whole popover immediately
    if (dateOnly) setIsOpen(false);
  };

  const isDayDisabled = (d) => {
    const dStr = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
    if (minDateStr && dStr < minDateStr) return true;
    if (maxDateStr && dStr > maxDateStr) return true;
    return false;
  };

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
      const isSelected = date === dStr;
      const disabledDay = isDayDisabled(d);
      days.push(
        <button
          key={d}
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!disabledDay) handleDaySelect(d); }}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${disabledDay
              ? 'text-slate-300 cursor-not-allowed'
              : isSelected
                ? 'bg-[#1f5dcc] text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const displayDate = (() => {
    if (!date) return 'dd/mm/yyyy';
    const parts = date.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return date;
  })();

  // Navigate calendar to the most relevant month when opening
  const navigateCalendarToRelevant = () => {
    // Priority: valid current value > min date > today
    if (date && (!minDateStr || date >= minDateStr) && (!maxDateStr || date <= maxDateStr)) {
      // Current value is valid and selectable
      const parts = date.split('-');
      if (parts.length === 3) {
        setCalMonth(parseInt(parts[1], 10) - 1);
        setCalYear(parseInt(parts[0], 10));
        return;
      }
    }
    if (minDateStr) {
      // Navigate to min date's month (earliest selectable)
      const minParts = minDateStr.split('-');
      if (minParts.length === 3) {
        setCalMonth(parseInt(minParts[1], 10) - 1);
        setCalYear(parseInt(minParts[0], 10));
        return;
      }
    }
    // Fallback: today's month
    setCalMonth(today.getMonth());
    setCalYear(today.getFullYear());
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    if (!isOpen) {
      navigateCalendarToRelevant();
      setIsOpen(true);
      setShowCalendar(true);
    } else {
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Box Trigger */}
      <div
        className={`flex items-center justify-between w-full rounded-2xl border px-4 py-3 cursor-pointer transition-all ${disabled ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-70' : hasError ? 'bg-white border-rose-500 hover:border-rose-500' : 'bg-white border-[#dce8f5] hover:border-[#1f5dcc]'} ${isOpen ? (hasError ? 'border-rose-500 ring-2 ring-rose-50' : 'border-[#1f5dcc] ring-2 ring-[#eef6ff]') : ''}`}
        onClick={handleTriggerClick}
      >
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <Calendar className="w-5 h-5 text-[#1747a6]" />
          {formatDisplay()}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Popover Picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-[320px] bg-white rounded-[24px] border border-[#dce8f5] shadow-xl p-4"
          >
            {/* ── Date Picker ── */}
            <div className={`${dateOnly ? '' : 'mb-4'} relative`} ref={calendarRef}>
              {!dateOnly && (
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Ngày</label>
              )}

              {/* Date trigger row (only shown in datetime mode) */}
              {!dateOnly && (
                <div
                  className={`flex items-center justify-between w-full rounded-xl border px-4 py-3 cursor-pointer transition-colors ${showCalendar ? 'border-[#1f5dcc] ring-2 ring-[#eef6ff] bg-white' : 'border-[#dce8f5] bg-white hover:border-[#1f5dcc]'}`}
                  onClick={() => {
                    if (!showCalendar) {
                      navigateCalendarToRelevant();
                    }
                    setShowCalendar(!showCalendar);
                  }}
                >
                  <span className={`text-sm font-medium ${date ? 'text-slate-700' : 'text-slate-400'}`}>{displayDate}</span>
                  <Calendar className={`w-4 h-4 ${showCalendar ? 'text-[#1f5dcc]' : 'text-slate-500'}`} />
                </div>
              )}

              {/* Calendar grid (shown inline in dateOnly mode, as dropdown in datetime mode) */}
              <AnimatePresence>
                {(dateOnly ? isOpen : showCalendar) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`${dateOnly ? '' : 'mt-2'} w-full bg-slate-50 rounded-xl border border-[#dce8f5] p-3 shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-sm font-bold text-[#1747a6]">{monthNames[calMonth]} {calYear}</div>
                      <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1 place-items-center">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                        <div key={d} className="text-[10px] font-bold text-slate-400 w-8 text-center">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 place-items-center">
                      {renderCalendarDays()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Time Columns (hidden in dateOnly mode) ── */}
            {!dateOnly && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Hour Scroll */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Giờ
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={hour === '' ? '' : hour}
                        onChange={(e) => {
                          let val = e.target.value.replace(/^0+(?=\d)/, '');
                          if (val === '') { handleHourSelect(''); return; }
                          let h = parseInt(val, 10);
                          if (isNaN(h)) return;
                          if (h > 23) h = 23;
                          if (h < 0) h = 0;
                          if (!isHourDisabled(h)) handleHourSelect(h);
                        }}
                        className="w-12 text-center rounded-lg border border-[#dce8f5] py-1 text-sm font-semibold outline-none focus:border-[#1f5dcc]"
                      />
                    </div>
                    <div className="h-36 overflow-y-auto rounded-xl border border-[#dce8f5] bg-slate-50 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {hours.map(h => {
                        const disabledH = isHourDisabled(h);
                        return (
                          <div
                            key={`h-${h}`}
                            onClick={() => !disabledH && handleHourSelect(h)}
                            className={`h-9 flex items-center justify-center transition-all ${disabledH ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-200'} ${hour === h ? 'bg-[#1f5dcc] text-white font-bold text-base rounded-lg mx-1 hover:bg-[#1f5dcc]' : 'text-slate-600 text-sm'}`}
                          >
                            {String(h).padStart(2, '0')}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Minute Scroll */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Phút
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={minute === '' ? '' : minute}
                        onChange={(e) => {
                          let val = e.target.value.replace(/^0+(?=\d)/, '');
                          if (val === '') { handleMinuteSelect(''); return; }
                          let m = parseInt(val, 10);
                          if (isNaN(m)) return;
                          if (m > 59) m = 59;
                          if (m < 0) m = 0;
                          if (!isMinuteDisabled(m)) handleMinuteSelect(m);
                        }}
                        className="w-12 text-center rounded-lg border border-[#dce8f5] py-1 text-sm font-semibold outline-none focus:border-[#1f5dcc]"
                      />
                    </div>
                    <div className="h-36 overflow-y-auto rounded-xl border border-[#dce8f5] bg-slate-50 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {minutes.map(m => {
                        const disabledM = isMinuteDisabled(m);
                        return (
                          <div
                            key={`m-${m}`}
                            onClick={() => !disabledM && handleMinuteSelect(m)}
                            className={`h-9 flex items-center justify-center transition-all ${disabledM ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-200'} ${minute === m ? 'bg-[#1f5dcc] text-white font-bold text-base rounded-lg mx-1 hover:bg-[#1f5dcc]' : 'text-slate-600 text-sm'}`}
                          >
                            {String(m).padStart(2, '0')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-end gap-2">
                  {!isValidTime() && (
                    <span className="text-xs text-red-500 font-medium">Thời gian không hợp lệ với khoảng cho phép</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={!isValidTime()}
                    className={`px-5 py-2 text-white text-sm font-bold rounded-xl transition-all ${isValidTime() ? 'bg-[#1747a6] hover:bg-[#205fd8]' : 'bg-slate-400 cursor-not-allowed'}`}
                  >
                    Xác nhận
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
