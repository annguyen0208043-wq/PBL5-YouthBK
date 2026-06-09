import Event from '../models/Event';

// Chỉ được thao tác khi chưa đến giờ diễn ra
export const isBeforeStart = (event: Event): boolean => {
  const start = new Date(event.actualStartDate || event.plannedStartDate);
  return new Date() < start;
};

// Sinh viên chỉ đăng ký khi sự kiện đang mở đăng ký hoặc đang yêu cầu chỉnh sửa (nhưng trước đó đã được mở đăng ký)
export const isRegistrationOpen = (event: Event): boolean => {
  const now = new Date();
  
  // Hạn đăng ký phải còn hiệu lực
  if (event.registrationDeadline && now >= new Date(event.registrationDeadline)) {
    return false;
  }
  
  // Trạng thái phải là open_registration hoặc revision_required
  return event.status === 'open_registration' || event.status === 'revision_required';
};

// Còn slot trống (bỏ qua nếu không giới hạn)
export const hasSlots = (event: Event): boolean => {
  if (event.maxParticipants === null || event.maxParticipants === undefined) return true;
  return event.currentSlots < event.maxParticipants;
};

// Liên chi chỉ thao tác trên sự kiện của đơn vị mình
export const isOwner = (event: Event, userId: number): boolean => {
  return event.createdBy === userId;
};
