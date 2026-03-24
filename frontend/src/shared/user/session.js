const DEFAULT_USER = {
  fullName: 'Nguyễn Đỗ Thắng',
  email: 'nguyendothang@sv.dut.udn.vn',
  studentId: '102230046',
  className: '23T_Nhat1',
  faculty: 'Khoa Công nghệ thông tin',
  role: 'Sinh viên',
  personalEmail: 'endiezzhang13@gmail.com',
  phone: '0905 123 456',
  address: 'Ký túc xá phía Tây, Đại học Đà Nẵng',
  avatarUrl: '',
};

function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') {
    return DEFAULT_USER;
  }

  return {
    fullName: rawUser.fullName || rawUser.name || DEFAULT_USER.fullName,
    email: rawUser.email || DEFAULT_USER.email,
    studentId: rawUser.studentId || rawUser.studentCode || rawUser.username || DEFAULT_USER.studentId,
    className: rawUser.className || rawUser.class || DEFAULT_USER.className,
    faculty: rawUser.faculty || rawUser.department || DEFAULT_USER.faculty,
    role: rawUser.role || DEFAULT_USER.role,
    personalEmail: rawUser.personalEmail || rawUser.contactEmail || DEFAULT_USER.personalEmail,
    phone: rawUser.phone || rawUser.phoneNumber || DEFAULT_USER.phone,
    address: rawUser.address || DEFAULT_USER.address,
    avatarUrl: rawUser.avatarUrl || rawUser.avatar || '',
  };
}

export function getStoredUserProfile() {
  if (typeof window === 'undefined') {
    return DEFAULT_USER;
  }

  try {
    const rawUser = window.localStorage.getItem('user');
    if (!rawUser) {
      return DEFAULT_USER;
    }

    return normalizeUser(JSON.parse(rawUser));
  } catch {
    return DEFAULT_USER;
  }
}

export function getUserInitials(fullName) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function isAdminRole(role) {
  const normalizedRole = (role || '').trim().toLowerCase();
  return ['đoàn trường', 'doan truong', 'admin', 'quản trị viên', 'quan tri vien'].includes(normalizedRole);
}

export const defaultUserProfile = DEFAULT_USER;
