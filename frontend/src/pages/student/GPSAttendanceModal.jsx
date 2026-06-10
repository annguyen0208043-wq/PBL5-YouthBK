import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const r = 6371e3; // Earth radius in meters
  const phi1 = lat1 * (Math.PI / 180);
  const phi2 = lat2 * (Math.PI / 180);
  const deltaPhi = (lat2 - lat1) * (Math.PI / 180);
  const deltaLambda = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const d = 2 * r * Math.asin(Math.sqrt(a));
  return d;
}

export default function GPSAttendanceModal({ show, onClose, onConfirmCheckIn, event }) {
  const [studentCoords, setStudentCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isInRange, setIsInRange] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const mapRef = useRef(null);
  const studentMarkerRef = useRef(null);

  // Reset states
  useEffect(() => {
    if (show) {
      setStudentCoords(null);
      setDistance(null);
      setIsInRange(false);
      setErrorMsg('');
      setGettingLocation(false);
    }
  }, [show]);

  // Load Leaflet dynamically and render map
  useEffect(() => {
    if (!show || !event) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';

    script.onload = () => {
      const L = window.L;
      const eventLat = parseFloat(event.locationLat);
      const eventLng = parseFloat(event.locationLng);
      const radius = event.attendanceRadius || 100;

      if (isNaN(eventLat) || isNaN(eventLng)) {
        setErrorMsg('Tọa độ sự kiện không hợp lệ, không thể hiển thị bản đồ.');
        return;
      }

      // Initialize map
      const map = L.map('leaflet-attendance-map').setView([eventLat, eventLng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add attendance radius circle (red)
      L.circle([eventLat, eventLng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.12,
        radius: radius,
        weight: 1.5
      }).addTo(map);

      // Add outer center circle (blue, semi-transparent) representing the core pin area
      // radius scales proportionally (e.g. 10% of total radius, minimum 12 meters)
      const centerOuter = L.circle([eventLat, eventLng], {
        color: '#1747a6',
        fillColor: '#1747a6',
        fillOpacity: 0.25,
        radius: Math.max(12, radius * 0.1),
        weight: 2
      }).addTo(map);

      // Add inner center circle (blue, solid) representing the exact coordinate pin
      // radius scales proportionally (e.g. 3.5% of total radius, minimum 4 meters)
      const centerInner = L.circle([eventLat, eventLng], {
        color: '#1747a6',
        fillColor: '#1747a6',
        fillOpacity: 0.9,
        radius: Math.max(4, radius * 0.035),
        weight: 1
      }).addTo(map);

      // Bind popup to the center
      centerOuter.bindPopup(`<b>${event.title}</b><br/>Địa điểm: ${event.location || 'Đang cập nhật'}`).openPopup();

      mapRef.current = map;

      // Automatically request student's location
      requestStudentLocation();
    };

    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      studentMarkerRef.current = null;
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, [show, event]);

  const requestStudentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Thiết bị không hỗ trợ định vị GPS.');
      return;
    }

    setGettingLocation(true);
    setErrorMsg('');

    const eventLat = parseFloat(event.locationLat);
    const eventLng = parseFloat(event.locationLng);
    const radius = event.attendanceRadius || 100;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const studentLat = position.coords.latitude;
        const studentLng = position.coords.longitude;
        setStudentCoords({ lat: studentLat, lng: studentLng });

        const dist = getDistanceFromLatLonInMeters(eventLat, eventLng, studentLat, studentLng);
        setDistance(dist);
        setIsInRange(dist <= radius);

        const L = window.L;
        const map = mapRef.current;

        if (map && L) {
          // Custom green pulsing dot icon for student
          const greenPulsingIcon = L.divIcon({
            className: 'relative flex items-center justify-center h-6 w-6',
            html: `
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-md"></span>
            `
          });

          // Update student marker on map
          if (studentMarkerRef.current) {
            studentMarkerRef.current.remove();
          }
          studentMarkerRef.current = L.marker([studentLat, studentLng], { icon: greenPulsingIcon })
            .addTo(map)
            .bindPopup('Vị trí hiện tại của bạn')
            .openPopup();

          // Fit map view to show both event center and student location
          const bounds = L.latLngBounds([
            [eventLat, eventLng],
            [studentLat, studentLng]
          ]);
          map.fitBounds(bounds, { padding: [60, 60] });
        }
        setGettingLocation(false);
      },
      (error) => {
        console.error('GPS Geolocation error:', error);
        let msg = 'Không lấy được vị trí. Vui lòng bật GPS và cho phép trình duyệt truy cập vị trí thiết bị.';
        if (error.code === 1) {
          msg = 'Quyền vị trí bị từ chối. Vui lòng bật vị trí trong cài đặt trình duyệt để điểm danh.';
        } else if (error.code === 2) {
          msg = 'Không thể định vị được vị trí. Hãy chắc chắn rằng thiết bị đã bật định vị (GPS).';
        } else if (error.code === 3) {
          msg = 'Quá thời gian lấy vị trí GPS (timeout). Vui lòng thử lại.';
        }
        setErrorMsg(msg);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const handleConfirm = () => {
    if (!studentCoords) return;
    onConfirmCheckIn(studentCoords);
  };

  return (
    <AnimatePresence>
      {show && event && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="flex flex-col w-full max-w-2xl bg-white rounded-[32px] border border-[#dce8f5] shadow-2xl p-6 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-[#132b57] flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#1f5dcc]" />
                  Điểm danh GPS sự kiện
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[480px]" title={event.title}>{event.title}</p>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map Container */}
            <div className="relative border border-[#dce8f5] rounded-2xl overflow-hidden mb-4 bg-slate-100">
              <div id="leaflet-attendance-map" className="h-[340px] w-full z-10" />
              {gettingLocation && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] gap-2">
                  <Loader2 className="h-8 w-8 text-[#1f5dcc] animate-spin" />
                  <span className="text-xs font-semibold text-[#1f5dcc]">Đang xác định vị trí của bạn...</span>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="space-y-3 mb-5">
              {/* Range verification status */}
              {studentCoords && distance !== null && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  isInRange 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                    : 'border-rose-200 bg-rose-50/70 text-rose-800'
                }`}>
                  {isInRange ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {isInRange ? 'Hợp lệ: Bạn đang ở trong phạm vi điểm danh!' : 'Không hợp lệ: Vị trí của bạn nằm ngoài phạm vi.'}
                    </p>
                    <p className="text-xs mt-1 opacity-90">
                      Khoảng cách đến tâm sự kiện: <span className="font-mono font-bold">{Math.round(distance)}m</span> 
                      &nbsp;(Bán kính giới hạn: <span className="font-mono font-bold">{event.attendanceRadius || 100}m</span>)
                    </p>
                  </div>
                </div>
              )}

              {/* Geolocation error warnings */}
              {errorMsg && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Lỗi định vị</p>
                    <p className="text-xs mt-1 opacity-90">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={requestStudentLocation}
                      className="mt-2 text-xs font-bold text-rose-900 underline hover:text-rose-950 flex items-center gap-1"
                    >
                      Thử định vị lại
                    </button>
                  </div>
                </div>
              )}

              {/* Default guide helper */}
              {!studentCoords && !errorMsg && !gettingLocation && (
                <div className="p-3.5 rounded-2xl border border-blue-100 bg-blue-50/50 text-blue-800 flex gap-2.5 items-start">
                  <Info className="h-4.5 w-4.5 text-[#1f5dcc] shrink-0 mt-0.5" />
                  <p className="text-xs">
                    Vui lòng cung cấp quyền vị trí cho thiết bị. Tâm điểm danh được biểu diễn bằng <span className="font-bold text-[#1747a6]">dấu chấm xanh dương</span> bao quanh bởi <span className="font-bold text-rose-600">vòng tròn đỏ</span> (phạm vi điểm danh). Vị trí của bạn sẽ hiển thị bằng <span className="font-bold text-emerald-600">chấm xanh lá chớp nháy</span>.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={requestStudentLocation}
                disabled={gettingLocation}
                className="flex items-center gap-1.5 text-[#1f5dcc] hover:text-[#1747a6] text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Navigation className="h-3.5 w-3.5" />
                Lấy lại vị trí hiện tại
              </button>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-[#dce8f5] text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!studentCoords || gettingLocation || !isInRange}
                  className="px-6 py-2.5 rounded-xl bg-[#1747a6] text-white text-sm font-bold hover:bg-[#205fd8] transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-md shadow-[#1747a6]/10"
                >
                  Xác nhận điểm danh
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
