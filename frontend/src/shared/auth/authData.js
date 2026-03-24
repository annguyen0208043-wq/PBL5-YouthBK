import { BookOpen, Building2, Flag, GraduationCap, Shield, Users } from 'lucide-react';

import schoolLogo from '../../assets/logo-bk.png';
import doanLogo from '../../assets/logo-doan.png';

export const SCHOOL_LOGO_SRC = schoolLogo;
export const DOAN_LOGO_SRC = doanLogo;

export const authContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const authItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 170, damping: 20 },
  },
};

export const floatingBadges = [
  { label: 'Liên chi', top: '15%', offset: '-30px', color: 'from-sky-400 to-blue-600', delay: 0.1 },
  { label: 'Sự kiện', top: '42%', offset: '-22px', color: 'from-amber-400 to-orange-500', delay: 0.25 },
  { label: 'Đoàn viên', top: '74%', offset: '-18px', color: 'from-rose-400 to-red-500', delay: 0.4 },
  { label: 'Thanh niên', top: '10%', offset: '18px', color: 'from-blue-500 to-indigo-700', delay: 0.15, right: true },
  { label: 'Cộng đồng', top: '35%', offset: '30px', color: 'from-orange-400 to-amber-500', delay: 0.3, right: true },
];

export const studentCards = [
  { icon: Flag, label: 'Phong trào năng động' },
  { icon: BookOpen, label: 'Hồ sơ tập trung' },
  { icon: GraduationCap, label: 'Kết nối sinh viên' },
];

export const authPosterDecor = {
  buildingIcon: Building2,
  footerIcon: Users,
  fallbackLogoIcon: Shield,
};
