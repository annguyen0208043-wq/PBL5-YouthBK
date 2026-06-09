-- ============================================================
-- PBL5 - SCHEMA CƠ SỞ DỮ LIỆU ĐẦY ĐỦ (ĐỒNG BỘ SEQUELIZE MODELS)
-- Tác giả: Antigravity / Claude
-- Ngày cập nhật: 2026-06-09
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `event_feedbacks`;
DROP TABLE IF EXISTS `certificates`;
DROP TABLE IF EXISTS `event_registrations`;
DROP TABLE IF EXISTS `event_approvals`;
DROP TABLE IF EXISTS `event_timeline_details`;
DROP TABLE IF EXISTS `event_timelines`;
DROP TABLE IF EXISTS `event_documents`;
DROP TABLE IF EXISTS `event_images`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `notification_recipients`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `chat_invitations`;
DROP TABLE IF EXISTS `conversation_members`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. BẢNG users (Người dùng)
-- ============================================================
CREATE TABLE `users` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(255) NOT NULL COMMENT 'Tên hiển thị',
  `email`           VARCHAR(255) NOT NULL COMMENT 'Email đăng nhập',
  `password`        VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã mã hóa',
  `role`            ENUM('admin', 'lienchi', 'student') NOT NULL DEFAULT 'student' COMMENT 'Vai trò hệ thống',
  `phone`           VARCHAR(255)          COMMENT 'Số điện thoại',
  `avatar`          VARCHAR(255)          COMMENT 'Đường dẫn ảnh đại diện',
  `studentId`       VARCHAR(255)          COMMENT 'Mã số sinh viên',
  `department`      VARCHAR(255)          COMMENT 'Khoa trực thuộc/Ngành học',
  `faculty`         VARCHAR(255)          COMMENT 'Liên chi khoa/Khoa',
  `status`          VARCHAR(255)          DEFAULT 'Hoạt động' COMMENT 'Trạng thái hoạt động',
  `isActive`        TINYINT(1)            DEFAULT 1 COMMENT '1 = Kích hoạt, 0 = Khóa',
  `communityPoints` INT                   DEFAULT 0 COMMENT 'Điểm rèn luyện / điểm cộng đồng',
  `createdAt`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `studentId` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. BẢNG audit_logs (Nhật ký hệ thống)
-- ============================================================
CREATE TABLE `audit_logs` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `userId`     INT          NOT NULL,
  `action`     VARCHAR(255) NOT NULL COMMENT 'Hành động thực hiện',
  `targetType` VARCHAR(255)          COMMENT 'Loại đối tượng tác động',
  `targetId`   INT                   COMMENT 'ID của đối tượng tác động',
  `details`    TEXT                  COMMENT 'Chi tiết hành động',
  `ipAddress`  VARCHAR(255)          COMMENT 'Địa chỉ IP thực hiện',
  `createdAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. BẢNG conversations (Cuộc trò chuyện nhóm/cá nhân)
-- ============================================================
CREATE TABLE `conversations` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(255) NOT NULL COMMENT 'Tên nhóm chat',
  `type`      ENUM('direct', 'group') NOT NULL DEFAULT 'group' COMMENT 'Trò chuyện cá nhân (direct) hoặc nhóm (group)',
  `directKey` VARCHAR(255)          COMMENT 'Key duy nhất xác định chat 1-1 (Ví dụ: id1:id2)',
  `createdBy` INT          NOT NULL,
  `createdAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `directKey` (`directKey`),
  KEY `idx_conversations_type` (`type`),
  KEY `idx_conversations_updatedAt` (`updatedAt`),
  CONSTRAINT `fk_conversations_creator` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. BẢNG conversation_members (Thành viên cuộc trò chuyện)
-- ============================================================
CREATE TABLE `conversation_members` (
  `id`                INT      NOT NULL AUTO_INCREMENT,
  `conversationId`    INT      NOT NULL,
  `userId`            INT      NOT NULL,
  `role`              ENUM('owner', 'member') NOT NULL DEFAULT 'member' COMMENT 'Vai trò trong nhóm chat',
  `joinedAt`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastReadMessageId` INT               COMMENT 'ID tin nhắn cuối cùng đã đọc',
  `createdAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conversation_member` (`conversationId`, `userId`),
  KEY `idx_conv_members_userId` (`userId`),
  CONSTRAINT `fk_conv_members_conversation` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conv_members_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. BẢNG chat_invitations (Lời mời vào cuộc trò chuyện)
-- ============================================================
CREATE TABLE `chat_invitations` (
  `id`             INT      NOT NULL AUTO_INCREMENT,
  `conversationId` INT      NOT NULL,
  `invitedBy`      INT      NOT NULL COMMENT 'Người gửi lời mời',
  `invitedUserId`  INT      NOT NULL COMMENT 'Người được mời',
  `status`         ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  `message`        VARCHAR(255)      COMMENT 'Lời nhắn đi kèm',
  `respondedAt`    DATETIME          COMMENT 'Thời gian phản hồi',
  `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_chat_inv_recipient_status` (`invitedUserId`, `status`),
  KEY `idx_chat_inv_conversation` (`conversationId`),
  CONSTRAINT `fk_chat_inv_conversation` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_inv_inviter` FOREIGN KEY (`invitedBy`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_inv_invitee` FOREIGN KEY (`invitedUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. BẢNG messages (Tin nhắn)
-- ============================================================
CREATE TABLE `messages` (
  `id`             INT      NOT NULL AUTO_INCREMENT,
  `conversationId` INT      NOT NULL,
  `senderId`       INT      NOT NULL,
  `content`        TEXT     NOT NULL COMMENT 'Nội dung tin nhắn',
  `attachments`    JSON              COMMENT 'Mảng các tệp đính kèm chứa url, tên file...',
  `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation` (`conversationId`),
  KEY `idx_messages_sender` (`senderId`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. BẢNG notifications (Thông báo hệ thống chung)
-- ============================================================
CREATE TABLE `notifications` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `title`          VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo',
  `message`        TEXT                  COMMENT 'Mô tả ngắn',
  `content`        TEXT                  COMMENT 'Nội dung chi tiết thông báo',
  `type`           VARCHAR(255)          COMMENT 'Loại thông báo (Hệ thống, Sự kiện, ...)',
  `targetType`     VARCHAR(255)          COMMENT 'Loại đối tượng điều hướng (event, chat...)',
  `targetValue`    VARCHAR(255)          COMMENT 'Giá trị đối tượng điều hướng (ID)',
  `senderId`       INT                   COMMENT 'Người gửi (nếu có)',
  `isRead`         TINYINT(1)            DEFAULT 0 COMMENT 'Đánh dấu đã đọc chung',
  `recipientCount` INT                   DEFAULT 0 COMMENT 'Số lượng người nhận',
  `readCount`      INT                   DEFAULT 0 COMMENT 'Số lượng người đã đọc',
  `createdAt`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4;


-- ============================================================
-- 8. BẢNG notification_recipients (Chi tiết người nhận thông báo)
-- ============================================================
CREATE TABLE `notification_recipients` (
  `id`             INT      NOT NULL AUTO_INCREMENT,
  `notificationId` INT      NOT NULL,
  `userId`         INT      NOT NULL,
  `isRead`         TINYINT(1)        DEFAULT 0 COMMENT '1 = đã đọc, 0 = chưa đọc',
  `readAt`         DATETIME          COMMENT 'Thời gian đọc thông báo',
  `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_notif_rec_notif` (`notificationId`),
  KEY `idx_notif_rec_user` (`userId`),
  CONSTRAINT `fk_notif_rec_notif` FOREIGN KEY (`notificationId`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notif_rec_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. BẢNG events (Sự kiện - Quản lý vòng đời đầy đủ)
-- ============================================================
CREATE TABLE `events` (
  `id`                    INT          NOT NULL AUTO_INCREMENT,
  `title`                 VARCHAR(255) NOT NULL COMMENT 'Tên sự kiện',
  `description`           TEXT                  COMMENT 'Mô tả chi tiết',
  `category`              VARCHAR(100)          COMMENT 'Thể loại (Cộng đồng, Kỹ năng, Học thuật...)',

  -- Thời gian dự kiến (dùng khi tạo đề xuất) và thời gian chính thức (sau duyệt)
  `plannedStartDate`      DATETIME     NOT NULL COMMENT 'Ngày bắt đầu dự kiến',
  `plannedEndDate`        DATETIME     NOT NULL COMMENT 'Ngày kết thúc dự kiến',
  `actualStartDate`       DATETIME              COMMENT 'Ngày bắt đầu chính thức (mặc định = planned)',
  `actualEndDate`         DATETIME              COMMENT 'Ngày kết thúc chính thức (mặc định = planned)',
  `registrationDeadline`  DATETIME              COMMENT 'Hạn cuối đăng ký tham gia',
  `revisionDeadline`      DATETIME              COMMENT 'Hạn chót Đoàn trường yêu cầu chỉnh sửa xong',

  -- Địa điểm và Điểm danh GPS
  `locationName`          VARCHAR(255) NOT NULL COMMENT 'Tên địa điểm diễn ra',
  `locationLat`           DECIMAL(10,7)         COMMENT 'Vĩ độ vị trí sự kiện',
  `locationLng`           DECIMAL(10,7)         COMMENT 'Kinh độ vị trí sự kiện',
  `attendanceRadius`      INT                   COMMENT 'Bán kính hợp lệ để quét mã điểm danh (mét)',

  -- Số lượng thành viên tham gia
  `minParticipants`       INT                   COMMENT 'Số lượng tối thiểu để duy trì sự kiện',
  `maxParticipants`       INT                   COMMENT 'Số lượng đăng ký tối đa',
  `currentSlots`          INT          NOT NULL DEFAULT 0 COMMENT 'Số lượng đã đăng ký hiện tại',

  -- Trạng thái vòng đời sự kiện:
  --   draft: Đang soạn thảo
  --   pending: Chờ Đoàn trường duyệt lần đầu
  --   revision_required: Yêu cầu sửa đổi (sinh viên vẫn có thể đăng ký bình thường nếu đã mở đăng ký trước đó)
  --   open_registration: Đã duyệt & đang mở đăng ký
  --   below_minimum: Hết hạn đăng ký nhưng không đủ số lượng tối thiểu -> Chờ quyết định tiếp tục/hủy của Liên chi
  --   ongoing: Đang diễn ra
  --   ended: Đã kết thúc (chưa xác nhận tham gia chính thức)
  --   completed: Đã hoàn tất (đã cấp chứng nhận)
  --   cancelled: Đã hủy bỏ
  `status`                ENUM(
                            'draft',
                            'pending',
                            'revision_required',
                            'open_registration',
                            'below_minimum',
                            'ongoing',
                            'ended',
                            'completed',
                            'cancelled'
                          ) NOT NULL DEFAULT 'draft',

  -- Quyết định khi sự kiện rơi vào below_minimum
  `belowMinAction`        ENUM('proceed', 'cancel') COMMENT 'Quyết định: proceed (tiếp tục) hoặc cancel (hủy)',
  `belowMinNote`          TEXT                      COMMENT 'Lý do quyết định tiếp tục/hủy sự kiện',

  -- Người tạo
  `createdBy`             INT          NOT NULL,
  `createdByRole`         ENUM('admin', 'lienchi') NOT NULL DEFAULT 'lienchi',

  -- Phản hồi từ Đoàn trường
  `revisionMessage`       TEXT                  COMMENT 'Nội dung phản hồi yêu cầu sửa đổi',
  `rejectionReason`       TEXT                  COMMENT 'Lý do từ chối sự kiện',

  -- Điểm danh QR
  `qrCode`                VARCHAR(255)          COMMENT 'Mã QR dùng để điểm danh',
  `qrActive`              TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = Bật quét QR điểm danh, 0 = Tắt',
  `leader`                VARCHAR(255)          COMMENT 'Tên người chủ trì sự kiện',

  `createdAt`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_createdBy` (`createdBy`),
  KEY `idx_events_planned` (`plannedStartDate`, `plannedEndDate`),
  KEY `idx_events_regDeadline` (`registrationDeadline`),
  CONSTRAINT `fk_events_creator` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. BẢNG event_images (Bộ sưu tập hình ảnh sự kiện)
-- ============================================================
CREATE TABLE `event_images` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `eventId`   INT          NOT NULL,
  `imageUrl`  VARCHAR(500) NOT NULL COMMENT 'Đường dẫn ảnh',
  `caption`   VARCHAR(255)          COMMENT 'Mô tả ảnh',
  `isCover`   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = Ảnh bìa (carousel), 0 = Ảnh phụ',
  `sortOrder` INT          NOT NULL DEFAULT 0 COMMENT 'Thứ tự sắp xếp hiển thị',
  `createdAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_images_event` (`eventId`),
  KEY `idx_event_images_cover` (`eventId`, `isCover`),
  CONSTRAINT `fk_event_images_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. BẢNG event_documents (Tài liệu đính kèm sự kiện)
-- ============================================================
CREATE TABLE `event_documents` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `eventId`    INT          NOT NULL,
  `fileName`   VARCHAR(255) NOT NULL COMMENT 'Tên file hiển thị',
  `fileUrl`    VARCHAR(500) NOT NULL COMMENT 'Đường dẫn file trên server/cloud',
  `fileType`   VARCHAR(50)           COMMENT 'Định dạng file (pdf, docx, xlsx...)',
  `fileSize`   BIGINT                COMMENT 'Kích thước file (bytes)',
  `uploadedBy` INT          NOT NULL,
  `createdAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_docs_event` (`eventId`),
  CONSTRAINT `fk_event_docs_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_docs_uploader` FOREIGN KEY (`uploadedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. BẢNG event_timelines (Giai đoạn của sự kiện)
-- ============================================================
CREATE TABLE `event_timelines` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `eventId`     INT          NOT NULL,
  `title`       VARCHAR(255) NOT NULL COMMENT 'Tên giai đoạn (Ví dụ: Chuẩn bị, Gây quỹ...)',
  `startDate`   DATETIME     NOT NULL COMMENT 'Ngày bắt đầu giai đoạn',
  `endDate`     DATETIME     NOT NULL COMMENT 'Ngày kết thúc giai đoạn',
  `description` TEXT                  COMMENT 'Mô tả giai đoạn',
  `sortOrder`   INT          NOT NULL DEFAULT 0,
  `createdAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_timelines_event` (`eventId`),
  CONSTRAINT `fk_event_timelines_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. BẢNG event_timeline_details (Mốc thời gian chi tiết trong giai đoạn)
-- ============================================================
CREATE TABLE `event_timeline_details` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `timelineId` INT          NOT NULL COMMENT 'Thuộc giai đoạn nào',
  `eventId`    INT          NOT NULL COMMENT 'Thuộc sự kiện nào',
  `dateTime`   DATETIME     NOT NULL COMMENT 'Thời điểm chính xác',
  `title`      VARCHAR(255) NOT NULL COMMENT 'Tiêu đề mốc chi tiết (Ví dụ: Đón khách, Khai mạc...)',
  `content`    TEXT                  COMMENT 'Chi tiết nội dung mốc thời gian',
  `sortOrder`  INT          NOT NULL DEFAULT 0,
  `createdAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_etd_timeline` (`timelineId`),
  KEY `idx_etd_event` (`eventId`),
  CONSTRAINT `fk_etd_timeline` FOREIGN KEY (`timelineId`) REFERENCES `event_timelines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_etd_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 14. BẢNG event_approvals (Lịch sử xét duyệt sự kiện)
-- ============================================================
CREATE TABLE `event_approvals` (
  `id`               INT      NOT NULL AUTO_INCREMENT,
  `eventId`          INT      NOT NULL,
  `approvedBy`       INT      NOT NULL COMMENT 'Đoàn trường duyệt',
  `status`           ENUM('approved', 'rejected', 'revision_requested') NOT NULL COMMENT 'Trạng thái quyết định',
  `note`             TEXT              COMMENT 'Ghi chú phê duyệt/lý do yêu cầu sửa',
  `revisionDeadline` DATETIME          COMMENT 'Hạn chót cần hoàn thành sửa đổi',
  `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_appr_event` (`eventId`),
  KEY `idx_event_appr_approver` (`approvedBy`),
  CONSTRAINT `fk_event_approvals_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_approvals_approver` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 15. BẢNG event_registrations (Đăng ký tham gia + Điểm danh QR)
-- ============================================================
CREATE TABLE `event_registrations` (
  `id`               INT      NOT NULL AUTO_INCREMENT,
  `eventId`          INT      NOT NULL,
  `userId`           INT      NOT NULL COMMENT 'Sinh viên đăng ký',
  `registrationDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày đăng ký',
  `status`           ENUM('registered', 'attended', 'confirmed', 'absent', 'cancelled') NOT NULL DEFAULT 'registered' COMMENT 'Trạng thái tham gia',
  `attendedAt`       DATETIME          COMMENT 'Thời gian điểm danh thành công qua QR',
  `attendanceLat`    DECIMAL(10,7)     COMMENT 'Vĩ độ khi điểm danh thực tế',
  `attendanceLng`    DECIMAL(10,7)     COMMENT 'Kinh độ khi điểm danh thực tế',
  `confirmedBy`      INT               COMMENT 'Liên chi đoàn xác nhận tham gia thực tế',
  `confirmedAt`      DATETIME          COMMENT 'Thời gian xác nhận tham gia thực tế',
  `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registration` (`eventId`, `userId`),
  KEY `idx_er_event` (`eventId`),
  KEY `idx_er_user` (`userId`),
  CONSTRAINT `fk_er_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_er_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_er_confirmer` FOREIGN KEY (`confirmedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 16. BẢNG certificates (Minh chứng tham gia hoạt động)
-- ============================================================
CREATE TABLE `certificates` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `userId`         INT          NOT NULL COMMENT 'Sinh viên nhận minh chứng',
  `eventId`        INT                   COMMENT 'Sự kiện liên quan',
  `registrationId` INT                   COMMENT 'Đăng ký liên quan',
  `activityTitle`  VARCHAR(255) NOT NULL COMMENT 'Tên hoạt động in trên chứng chỉ',
  `status`         ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái minh chứng',
  `approvedBy`     INT                   COMMENT 'Đoàn trường duyệt cấp',
  `approvedAt`     DATETIME,
  `approverName`   VARCHAR(255)          COMMENT 'Tên người ký duyệt chứng chỉ',
  `stampCode`      VARCHAR(100)          COMMENT 'Mã đóng dấu chứng chỉ duy nhất',
  `note`           TEXT,
  `certificateUrl` VARCHAR(500)          COMMENT 'Đường dẫn tải file minh chứng',
  `isBulk`         TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = Cấp hàng loạt, 0 = Cấp đơn lẻ',
  `createdAt`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cert_stampCode` (`stampCode`),
  KEY `idx_cert_user` (`userId`),
  KEY `idx_cert_event` (`eventId`),
  KEY `idx_cert_reg` (`registrationId`),
  CONSTRAINT `fk_cert_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_reg` FOREIGN KEY (`registrationId`) REFERENCES `event_registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_approver` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 17. BẢNG event_feedbacks (Đánh giá sự kiện)
-- ============================================================
CREATE TABLE `event_feedbacks` (
  `id`        INT      NOT NULL AUTO_INCREMENT,
  `eventId`   INT      NOT NULL,
  `userId`    INT      NOT NULL COMMENT 'Sinh viên đánh giá',
  `rating`    INT      NOT NULL COMMENT 'Điểm đánh giá (1-5 sao)',
  `comment`   TEXT              COMMENT 'Nhận xét chi tiết',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feedback` (`eventId`, `userId`),
  KEY `idx_feedback_event` (`eventId`),
  CONSTRAINT `fk_feedback_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
