import Event from '../models/Event';

// Chỉ được thao tác khi chưa đến giờ diễn ra
export const isBeforeStart = (event: Event): boolean => {
  if (!event.startTime && !event.startDate) return true;
  const start = new Date(event.startTime || event.startDate);
  return new Date() < start;
};

// Sinh viên chỉ đăng ký khi sự kiện đã approved
export const isApproved = (event: Event): boolean => {
  return event.status === 'approved';
};

// Thời gian đăng ký còn hợp lệ
export const isRegistrationOpen = (event: Event): boolean => {
  if (event.registrationDeadline) {
    return new Date() < new Date(event.registrationDeadline);
  }
  return isBeforeStart(event);
};

// Còn slot trống (bỏ qua nếu không giới hạn)
export const hasSlots = (event: Event): boolean => {
  if (event.maxSlots === null || event.maxSlots === undefined) return true;
  return event.currentSlots < event.maxSlots;
};

// Không có request đang chờ duyệt
export const noActiveRequest = (event: Event): boolean => {
  return !['update_requested', 'cancel_requested', 'postpone_requested'].includes(event.status);
};

// Liên chi chỉ thao tác trên sự kiện của đơn vị mình
export const isOwner = (event: Event, userId: number): boolean => {
  return event.createdBy === userId;
};
