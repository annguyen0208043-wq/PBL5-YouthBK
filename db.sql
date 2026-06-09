-- ============================================================
-- PBL5 - Schema thiết kế lại: Chức năng Quản lý Sự kiện
-- Ngày:    2026-06-09
-- ============================================================
-- Quyết định thiết kế:
--   1. Ảnh bìa: nhiều ảnh, dùng isCover trên event_images (bỏ coverImage trên events)
--   2. belowMinAction: khi hủy do không đủ SL → ghi lý do (belowMinNote) cho Đoàn trường biết
--   3. attendanceRadius: dùng INT (linh hoạt)
--   4. Giữ bảng event_feedbacks
--   5. Không cần cancelledBy/cancelledAt
--   6. Khi revision_required trong lúc open_registration → SV vẫn ĐK bình thường
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `event_feedbacks`;
DROP TABLE IF EXISTS `event_timeline_details`;
DROP TABLE IF EXISTS `event_timelines`;
DROP TABLE IF EXISTS `event_documents`;
DROP TABLE IF EXISTS `event_images`;
DROP TABLE IF EXISTS `event_approvals`;
DROP TABLE IF EXISTS `event_registrations`;
DROP TABLE IF EXISTS `certificates`;
DROP TABLE IF EXISTS `events`;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- BẢNG events
-- ============================================================
CREATE TABLE `events` (
  `id`                    INT          NOT NULL AUTO_INCREMENT,
  `title`                 VARCHAR(255) NOT NULL COMMENT 'Tên sự kiện',
  `description`           TEXT                  COMMENT 'Mô tả sự kiện',
  `category`              VARCHAR(100)          COMMENT 'Thể loại (Cộng đồng, Kỹ năng, ...)',

  -- Thời gian (dự kiến khi tạo, xác nhận sau duyệt)
  `plannedStartDate`      DATETIME     NOT NULL COMMENT 'Thời gian dự kiến bắt đầu',
  `plannedEndDate`        DATETIME     NOT NULL COMMENT 'Thời gian dự kiến kết thúc',
  `actualStartDate`       DATETIME              COMMENT 'Thời gian chính thức bắt đầu (sau duyệt, mặc định = planned)',
  `actualEndDate`         DATETIME              COMMENT 'Thời gian chính thức kết thúc (sau duyệt, mặc định = planned)',
  `registrationDeadline`  DATETIME              COMMENT 'Hạn đăng ký tham gia',
  `revisionDeadline`      DATETIME              COMMENT 'Hạn Đoàn trường yêu cầu chỉnh sửa (phải trước ngày diễn ra)',

  -- Địa điểm
  `locationName`          VARCHAR(255) NOT NULL COMMENT 'Tên/địa chỉ nhập tay',
  `locationLat`           DECIMAL(10,7)         COMMENT 'Vĩ độ (Google Maps pin)',
  `locationLng`           DECIMAL(10,7)         COMMENT 'Kinh độ (Google Maps pin)',
  `attendanceRadius`      INT                   COMMENT 'Phạm vi điểm danh QR (mét), người dùng tự nhập',

  -- Số lượng
  `minParticipants`       INT                   COMMENT 'Số lượng tham gia tối thiểu để sự kiện diễn ra',
  `maxParticipants`       INT                   COMMENT 'Số lượng tham gia tối đa',
  `currentSlots`          INT          NOT NULL DEFAULT 0 COMMENT 'Số đăng ký hiện tại',

  -- Trạng thái vòng đời
  -- draft              : Đang soạn thảo (chưa gửi)
  -- pending            : Đã gửi, chờ Đoàn trường duyệt lần đầu
  -- revision_required  : Đoàn trường yêu cầu chỉnh sửa (kèm revisionDeadline)
  --                      * Nếu đang open_registration → SV vẫn ĐK bình thường
  --                      * Liên chi có thể sửa & gửi lại hoặc không → sự kiện tiếp tục
  -- open_registration  : Đã duyệt, đang mở đăng ký
  -- below_minimum      : Hết hạn đăng ký, chưa đủ tối thiểu → chờ quyết định Liên chi
  -- ongoing            : Đang diễn ra
  -- ended              : Đã kết thúc (chưa hoàn tất xác nhận)
  -- completed          : Hoàn tất (đã cấp minh chứng)
  -- cancelled          : Đã hủy
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

  -- Quyết định khi không đủ tối thiểu
  `belowMinAction`        ENUM('proceed','cancel')  COMMENT 'Liên chi quyết định: tiếp tục hay hủy',
  `belowMinNote`          TEXT                       COMMENT 'Lý do hủy/tiếp tục (Đoàn trường xem được, không cần duyệt lại)',

  -- Người tạo
  `createdBy`             INT          NOT NULL COMMENT 'FK → users.id (lienchi)',
  `createdByRole`         ENUM('admin','lienchi') NOT NULL DEFAULT 'lienchi',

  -- Nội dung revision / rejection
  `revisionMessage`       TEXT                  COMMENT 'Nội dung yêu cầu chỉnh sửa từ Đoàn trường',
  `rejectionReason`       TEXT                  COMMENT 'Lý do từ chối',

  `createdAt`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_events_status`       (`status`),
  KEY `idx_events_createdBy`    (`createdBy`),
  KEY `idx_events_planned`      (`plannedStartDate`, `plannedEndDate`),
  KEY `idx_events_regDeadline`  (`registrationDeadline`),
  CONSTRAINT `fk_events_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng sự kiện – vòng đời đầy đủ từ soạn thảo đến hoàn tất';


-- ============================================================
-- BẢNG event_images  (ảnh sự kiện – bao gồm ảnh bìa carousel)
-- ============================================================
-- Ảnh bìa: isCover = 1, có thể nhiều ảnh bìa → hiển thị dạng carousel
-- Ảnh phụ: isCover = 0
-- ============================================================
CREATE TABLE `event_images` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `eventId`   INT          NOT NULL,
  `imageUrl`  VARCHAR(500) NOT NULL COMMENT 'URL ảnh',
  `caption`   VARCHAR(255)          COMMENT 'Chú thích ảnh (tuỳ chọn)',
  `isCover`   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = ảnh bìa (carousel), 0 = ảnh phụ',
  `sortOrder` INT          NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  `createdAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_images_eventId` (`eventId`),
  KEY `idx_event_images_cover`   (`eventId`, `isCover`),
  CONSTRAINT `fk_event_images_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ảnh sự kiện: ảnh bìa (isCover=1, carousel) và ảnh phụ (isCover=0)';


-- ============================================================
-- BẢNG event_documents  (tài liệu đính kèm: PDF, Word, ...)
-- ============================================================
CREATE TABLE `event_documents` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `eventId`      INT          NOT NULL,
  `fileName`     VARCHAR(255) NOT NULL COMMENT 'Tên file hiển thị',
  `fileUrl`      VARCHAR(500) NOT NULL COMMENT 'URL lưu trữ file',
  `fileType`     VARCHAR(50)           COMMENT 'Loại file: pdf, docx, doc, ...',
  `fileSize`     BIGINT                COMMENT 'Kích thước file (bytes)',
  `uploadedBy`   INT          NOT NULL COMMENT 'FK → users.id',
  `createdAt`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_documents_eventId`    (`eventId`),
  KEY `idx_event_documents_uploadedBy` (`uploadedBy`),
  CONSTRAINT `fk_event_documents_event` FOREIGN KEY (`eventId`)    REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_documents_user`  FOREIGN KEY (`uploadedBy`) REFERENCES `users`  (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tài liệu đính kèm sự kiện (PDF, Word, ...)';


-- ============================================================
-- BẢNG event_timelines  (các GIAI ĐOẠN của sự kiện)
-- ============================================================
-- Mỗi sự kiện có nhiều giai đoạn, ví dụ:
--   Giai đoạn 1: Đăng ký  (01/05 → 10/05)
--   Giai đoạn 2: Gây quỹ  (05/05 → 15/05)
--   Giai đoạn 3: Tổ chức  (20/05 → 22/05)
-- ============================================================
CREATE TABLE `event_timelines` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `eventId`     INT          NOT NULL,
  `title`       VARCHAR(255) NOT NULL COMMENT 'Tên giai đoạn, vd: Gây quỹ, Tổ chức',
  `startDate`   DATETIME     NOT NULL COMMENT 'Ngày bắt đầu giai đoạn',
  `endDate`     DATETIME     NOT NULL COMMENT 'Ngày kết thúc giai đoạn',
  `description` TEXT                  COMMENT 'Mô tả tổng quan giai đoạn',
  `sortOrder`   INT          NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  `createdAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_timelines_eventId` (`eventId`),
  CONSTRAINT `fk_event_timelines_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Giai đoạn (phase) của sự kiện';


-- ============================================================
-- BẢNG event_timeline_details  (các MỐC chi tiết trong giai đoạn)
-- ============================================================
-- Mỗi giai đoạn có nhiều mốc, ví dụ giai đoạn "Tổ chức":
--   Mốc 1: 07:00 – Khai mạc
--   Mốc 2: 08:00 – Thi đấu vòng bảng
--   Mốc 3: 17:00 – Bế mạc, trao giải
-- ============================================================
CREATE TABLE `event_timeline_details` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `timelineId`  INT          NOT NULL COMMENT 'FK → event_timelines.id',
  `eventId`     INT          NOT NULL COMMENT 'FK → events.id (denorm để query nhanh)',
  `dateTime`    DATETIME     NOT NULL COMMENT 'Thời điểm cụ thể (nằm trong startDate–endDate của timeline)',
  `title`       VARCHAR(255) NOT NULL COMMENT 'Tiêu đề mốc, vd: Khai mạc, Thi đấu vòng bảng',
  `content`     TEXT                  COMMENT 'Nội dung chi tiết do người dùng nhập',
  `sortOrder`   INT          NOT NULL DEFAULT 0 COMMENT 'Thứ tự trong giai đoạn',
  `createdAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_etd_timelineId` (`timelineId`),
  KEY `idx_etd_eventId`    (`eventId`),
  CONSTRAINT `fk_etd_timeline` FOREIGN KEY (`timelineId`) REFERENCES `event_timelines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_etd_event`    FOREIGN KEY (`eventId`)    REFERENCES `events`           (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mốc thời gian chi tiết bên trong mỗi giai đoạn timeline';


-- ============================================================
-- BẢNG event_approvals  (lịch sử duyệt)
-- ============================================================
CREATE TABLE `event_approvals` (
  `id`               INT      NOT NULL AUTO_INCREMENT,
  `eventId`          INT      NOT NULL,
  `approvedBy`       INT      NOT NULL COMMENT 'FK → users.id (admin/Đoàn trường)',
  `status`           ENUM('approved','rejected','revision_requested') NOT NULL,
  `note`             TEXT              COMMENT 'Ghi chú / lý do',
  `revisionDeadline` DATETIME          COMMENT 'Hạn chỉnh sửa khi status = revision_requested',
  `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_event_approvals_eventId`    (`eventId`),
  KEY `idx_event_approvals_approvedBy` (`approvedBy`),
  CONSTRAINT `fk_event_approvals_event` FOREIGN KEY (`eventId`)    REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_approvals_user`  FOREIGN KEY (`approvedBy`) REFERENCES `users`  (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lịch sử duyệt sự kiện (có thể nhiều vòng)';


-- ============================================================
-- BẢNG event_registrations  (đăng ký tham gia + điểm danh QR)
-- ============================================================
CREATE TABLE `event_registrations` (
  `id`               INT      NOT NULL AUTO_INCREMENT,
  `eventId`          INT      NOT NULL,
  `userId`           INT      NOT NULL,
  `registrationDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- registered : đã đăng ký, chờ sự kiện
  -- attended   : đã điểm danh QR (có trong phạm vi)
  -- confirmed  : Liên chi xác nhận tham gia thực tế
  -- absent     : vắng mặt
  -- cancelled  : huỷ đăng ký
  `status`           ENUM('registered','attended','confirmed','absent','cancelled')
                     NOT NULL DEFAULT 'registered',
  `attendedAt`       DATETIME          COMMENT 'Thời điểm quét QR điểm danh',
  `attendanceLat`    DECIMAL(10,7)     COMMENT 'Vĩ độ thiết bị khi điểm danh',
  `attendanceLng`    DECIMAL(10,7)     COMMENT 'Kinh độ thiết bị khi điểm danh',
  `confirmedBy`      INT               COMMENT 'FK → users.id (Liên chi xác nhận)',
  `confirmedAt`      DATETIME          COMMENT 'Thời điểm Liên chi xác nhận',
  `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registration` (`eventId`, `userId`),
  KEY `idx_er_eventId`     (`eventId`),
  KEY `idx_er_userId`      (`userId`),
  KEY `idx_er_confirmedBy` (`confirmedBy`),
  CONSTRAINT `fk_er_event`       FOREIGN KEY (`eventId`)     REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_er_user`        FOREIGN KEY (`userId`)      REFERENCES `users`  (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_er_confirmedBy` FOREIGN KEY (`confirmedBy`) REFERENCES `users`  (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đăng ký tham gia sự kiện – tích hợp điểm danh QR và xác nhận';


-- ============================================================
-- BẢNG certificates  (minh chứng tham gia)
-- ============================================================
CREATE TABLE `certificates` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `userId`          INT          NOT NULL COMMENT 'Sinh viên được cấp',
  `eventId`         INT                   COMMENT 'FK → events.id',
  `registrationId`  INT                   COMMENT 'FK → event_registrations.id',
  `activityTitle`   VARCHAR(255) NOT NULL COMMENT 'Tên hoạt động trên minh chứng',
  `status`          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approvedBy`      INT                   COMMENT 'FK → users.id',
  `approvedAt`      DATETIME,
  `approverName`    VARCHAR(255),
  `stampCode`       VARCHAR(100)          COMMENT 'Mã đóng dấu xác nhận (duy nhất)',
  `note`            TEXT,
  `certificateUrl`  VARCHAR(500)          COMMENT 'URL file minh chứng đã tạo',
  `isBulk`          TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = cấp hàng loạt, 0 = cấp đơn lẻ',
  `createdAt`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cert_stampCode`  (`stampCode`),
  KEY `idx_cert_userId`           (`userId`),
  KEY `idx_cert_eventId`          (`eventId`),
  KEY `idx_cert_registrationId`   (`registrationId`),
  KEY `idx_cert_approvedBy`       (`approvedBy`),
  CONSTRAINT `fk_cert_user`         FOREIGN KEY (`userId`)         REFERENCES `users`               (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_event`        FOREIGN KEY (`eventId`)        REFERENCES `events`              (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_registration` FOREIGN KEY (`registrationId`) REFERENCES `event_registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_approvedBy`   FOREIGN KEY (`approvedBy`)     REFERENCES `users`               (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Minh chứng tham gia sự kiện (cấp đơn lẻ và hàng loạt)';


-- ============================================================
-- BẢNG event_feedbacks  (đánh giá sự kiện sau khi kết thúc)
-- ============================================================
CREATE TABLE `event_feedbacks` (
  `id`        INT      NOT NULL AUTO_INCREMENT,
  `eventId`   INT      NOT NULL,
  `userId`    INT      NOT NULL COMMENT 'Sinh viên đánh giá',
  `rating`    INT      NOT NULL COMMENT 'Điểm đánh giá (1-5)',
  `comment`   TEXT              COMMENT 'Nhận xét',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feedback` (`eventId`, `userId`),
  KEY `idx_feedback_eventId` (`eventId`),
  KEY `idx_feedback_userId`  (`userId`),
  CONSTRAINT `fk_feedback_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_user`  FOREIGN KEY (`userId`)  REFERENCES `users`  (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đánh giá sự kiện sau khi kết thúc (mỗi SV đánh giá 1 lần)';
