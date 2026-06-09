import React, { useState, useEffect, useRef } from 'react';
import { Search, Navigation } from 'lucide-react';

export default function InlineMapPicker({ lat, lng, onChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  const currentLat = lat || '16.074061';
  const currentLng = lng || '108.15072';

  // Load Leaflet dynamically
  useEffect(() => {
    // Load Leaflet CSS
    let link = document.querySelector('link[href*="leaflet.css"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const loadMap = () => {
      const L = window.L;
      const startLat = parseFloat(currentLat) || 16.074061;
      const startLng = parseFloat(currentLng) || 108.15072;

      // Fix marker icon loading path issue
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = L.map('leaflet-inline-map').setView([startLat, startLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);

      const updateCoords = (newLat, newLng) => {
        marker.setLatLng([newLat, newLng]);
        onChange({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
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

    if (window.L) {
      loadMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = loadMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  // Sync coords from props (e.g. if updated externally)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const latVal = parseFloat(currentLat);
      const lngVal = parseFloat(currentLng);
      const currentMarkerLatLng = markerRef.current.getLatLng();
      if (
        Math.abs(currentMarkerLatLng.lat - latVal) > 0.0001 ||
        Math.abs(currentMarkerLatLng.lng - lngVal) > 0.0001
      ) {
        markerRef.current.setLatLng([latVal, lngVal]);
        mapRef.current.panTo([latVal, lngVal]);
      }
    }
  }, [lat, lng]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const latVal = parseFloat(first.lat);
        const lngVal = parseFloat(first.lon);
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latVal, lngVal], 16);
          markerRef.current.setLatLng([latVal, lngVal]);
          onChange({ lat: latVal.toFixed(6), lng: lngVal.toFixed(6) });
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

  return (
    <div className="w-full space-y-3 mt-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nhập tên trường, đường phố, địa danh để tìm kiếm nhanh..."
          className="flex-1 rounded-2xl border border-[#dce8f5] px-4 py-2.5 text-xs outline-none focus:border-[#1f5dcc]"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="flex items-center gap-1.5 bg-[#1747a6] text-white px-4 py-2 rounded-2xl text-xs font-bold hover:bg-[#205fd8] transition-colors disabled:bg-slate-400 shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
          {searching ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </div>

      <div className="relative border border-[#dce8f5] rounded-[24px] overflow-hidden bg-slate-50">
        <div id="leaflet-inline-map" className="h-[280px] w-full z-10" />
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-4">
          <span className="text-xs font-bold text-slate-700 font-mono">Vĩ độ (Lat): {currentLat}</span>
          <span className="text-xs font-bold text-slate-700 font-mono">Kinh độ (Lng): {currentLng}</span>
        </div>
      </div>
    </div>
  );
}
