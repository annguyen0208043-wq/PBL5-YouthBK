import AuditLog from '../models/AuditLog';

interface AuditOptions {
  userId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  ipAddress?: string;
}

/**
 * Ghi nhật ký hoạt động vào DB. Không block response — lỗi chỉ được log ra console.
 */
export const writeAuditLog = async (opts: AuditOptions): Promise<void> => {
  try {
    await AuditLog.create({
      userId: opts.userId,
      action: opts.action,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
      details: opts.details ?? null,
      ipAddress: opts.ipAddress ?? null,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err);
  }
};

/**
 * Lấy IP từ request (hỗ trợ reverse proxy)
 */
export const getClientIp = (req: any): string | null => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
};
