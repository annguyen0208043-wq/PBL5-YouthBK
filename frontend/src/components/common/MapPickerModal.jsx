import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Navigation } from 'lucide-react';

export default function MapPickerModal({ show, onClose, onConfirm, initialLat, initialLng }) {
  const [tempCoords, setTempCoords] = useState({ lat: '16.074061', lng: '108.15072' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize and sync temp coords
  useEffect(() => {
    if (show) {
      const lat = initialLat ? String(initialLat) : '16.074061';
      const lng = initialLng ? String(initialLng) : '108.15072';
      setTempCoords({ lat, lng });
    }
  }, [show, initialLat, initialLng]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (!show) return;

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
      const startLat = parseFloat(tempCoords.lat) || 16.074061;
      const startLng = parseFloat(tempCoords.lng) || 108.15072;

      // Fix marker icon loading path issue in default Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map('leaflet-map-picker').setView([startLat, startLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);

      const updateCoords = (lat, lng) => {
        marker.setLatLng([lat, lng]);
        setTempCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
      };

      marker.on('dragend', (e) => {
        const pos = marker.getLatLng();
        updateCoords(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        updateCoords(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    };

    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, [show]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
          setTempCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
        }
      } else {
        alert('Không tìm thấy địa điểm này trên bản đồ.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempCoords);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="flex flex-col w-full max-w-2xl bg-white rounded-[32px] border border-[#dce8f5] shadow-2xl p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-[#132b57] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#1f5dcc]" />
                Chọn Tọa độ Bản đồ (GPS)
              </h3>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên trường, đường phố, địa danh để tìm..."
                className="flex-1 rounded-xl border border-[#dce8f5] px-4 py-2 text-sm outline-none focus:border-[#1f5dcc]"
              />
              <button
                type="submit"
                disabled={searching}
                className="flex items-center gap-2 bg-[#1747a6] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#205fd8] transition-colors disabled:bg-slate-400"
              >
                <Search className="h-4 w-4" />
                {searching ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
            </form>

            <div className="relative border border-[#dce8f5] rounded-2xl overflow-hidden mb-4">
              <div id="leaflet-map-picker" className="h-[360px] w-full z-10" />
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#1747a6]" />
                <span className="text-xs font-semibold text-slate-500">Tọa độ đang chọn:</span>
              </div>
              <div className="flex gap-4">
                <span className="text-xs font-bold text-slate-700 font-mono">Vĩ độ: {tempCoords.lat}</span>
                <span className="text-xs font-bold text-slate-700 font-mono">Kinh độ: {tempCoords.lng}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#dce8f5] text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy (Hoàn tác)
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-[#1747a6] text-white text-sm font-bold hover:bg-[#205fd8] transition-colors"
              >
                Xác nhận vị trí
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
