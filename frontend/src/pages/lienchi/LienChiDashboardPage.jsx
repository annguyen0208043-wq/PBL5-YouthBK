import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, CalendarDays, Percent, Bell, Activity, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

import LienChiLayout from '../../components/lienchi/LienChiLayout';
import StatCard from './components/dashboard/StatCard';
import EventFrequencyChart from './components/dashboard/EventFrequencyChart';
import EventTypeChart from './components/dashboard/EventTypeChart';
import TopEventsList from './components/dashboard/TopEventsList';
import NotificationStats from './components/dashboard/NotificationStats';
import RecentActivity from './components/dashboard/RecentActivity';

export default function LienChiDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/dashboard/lien-chi', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Fetch dashboard error', err);
        setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <LienChiLayout
      currentPath="/lien-chi"
      title="Tổng quan liên chi"
      subtitle="Theo dõi số liệu thống kê chi tiết về sinh viên, sự kiện và hiệu suất hoạt động."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-[#1747a6]" />
          <span className="ml-3 text-slate-500 font-medium">Đang tải dữ liệu...</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      ) : data && (
        <div className="space-y-6">
          {/* Row 1: KPI Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Tổng sinh viên" value={data.kpi.totalStudents} icon={Users} color="blue" />
            <StatCard label="Tổng sự kiện" value={data.kpi.totalEvents} icon={CalendarDays} color="green" />
            <StatCard label="Sự kiện tháng này" value={data.kpi.eventsThisMonth} icon={Activity} color="purple" />
            <StatCard label="Tỷ lệ tham gia" value={`${data.kpi.participationRate}%`} icon={Percent} color="amber" />
            <StatCard label="Tổng thông báo" value={data.kpi.totalNotifications} icon={Bell} color="rose" />
          </div>

          {/* Row 2: Charts */}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <h3 className="mb-6 text-xl font-black text-[#132b57]">Tần suất sự kiện</h3>
              <EventFrequencyChart data={data.charts.eventFrequency} />
            </motion.div>
            
            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <h3 className="mb-6 text-xl font-black text-[#132b57]">Phân loại sự kiện</h3>
              <EventTypeChart data={data.charts.eventTypes} />
            </motion.div>
          </div>

          {/* Row 3 & 4: Top Events, Stats, Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <h3 className="mb-6 text-xl font-black text-[#132b57]">Top Sự Kiện</h3>
              <TopEventsList events={data.topEvents} />
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <h3 className="mb-6 text-xl font-black text-[#132b57]">Hiệu quả thông báo</h3>
              <NotificationStats stats={data.notificationStats} />
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="profile-panel rounded-[28px] border border-[#dce8f5] bg-white p-6">
              <h3 className="mb-6 text-xl font-black text-[#132b57]">Hoạt động gần đây</h3>
              <RecentActivity activities={data.recentActivity} />
            </motion.div>
          </div>
        </div>
      )}
    </LienChiLayout>
  );
}
