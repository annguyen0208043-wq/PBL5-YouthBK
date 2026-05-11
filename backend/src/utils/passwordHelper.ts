import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const convertRoleToVietnamese = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'student': 'Sinh viên',
    'lienchi': 'Liên chi đoàn',
    'admin': 'Đoàn trường'
  };
  return roleMap[role.toLowerCase()] || role;
};

export const convertRoleToEnglish = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'sinh viên': 'student',
    'liên chi đoàn': 'lienchi',
    'đoàn trường': 'admin',
    'lien chi doan': 'lienchi',
    'doan truong': 'admin'
  };
  return roleMap[role.toLowerCase()] || role;
};
