DROP DATABASE IF EXISTS `pbl5_db`;
CREATE DATABASE `pbl5_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pbl5_db`;

SET NAMES utf8mb4;
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','lienchi','student') NOT NULL DEFAULT 'student',
  `phone` VARCHAR(255) NULL,
  `avatar` VARCHAR(255) NULL,
  `studentId` VARCHAR(255) NULL UNIQUE,
  `department` VARCHAR(255) NULL,
  `faculty` VARCHAR(255) NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `status` VARCHAR(255) DEFAULT 'Hoạt động',
  `communityPoints` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NULL,
  `plannedStartDate` DATETIME NOT NULL,
  `plannedEndDate` DATETIME NOT NULL,
  `actualStartDate` DATETIME NULL,
  `actualEndDate` DATETIME NULL,
  `registrationDeadline` DATETIME NULL,
  `revisionDeadline` DATETIME NULL,
  `locationName` VARCHAR(255) NOT NULL,
  `locationLat` DECIMAL(10,7) NULL,
  `locationLng` DECIMAL(10,7) NULL,
  `attendanceRadius` INT NULL,
  `minParticipants` INT NULL,
  `maxParticipants` INT NULL,
  `currentSlots` INT NOT NULL DEFAULT 0,
  `status` ENUM('draft','pending','revision_required','open_registration','below_minimum','ongoing','ended','completed','cancelled') NOT NULL DEFAULT 'draft',
  `belowMinAction` ENUM('proceed','cancel') NULL,
  `belowMinNote` TEXT NULL,
  `createdBy` INT NOT NULL,
  `createdByRole` ENUM('admin','lienchi') NOT NULL DEFAULT 'lienchi',
  `revisionMessage` TEXT NULL,
  `rejectionReason` TEXT NULL,
  `qrCode` VARCHAR(255) NULL,
  `qrActive` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_createdBy` (`createdBy`),
  CONSTRAINT `fk_events_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_images` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventId` INT NOT NULL,
  `imageUrl` VARCHAR(500) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `isCover` TINYINT(1) NOT NULL DEFAULT 0,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_images_eventId` (`eventId`),
  CONSTRAINT `fk_event_images_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventId` INT NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `fileUrl` VARCHAR(500) NOT NULL,
  `fileType` VARCHAR(50) NULL,
  `fileSize` BIGINT NULL,
  `uploadedBy` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_event_documents_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_documents_user` FOREIGN KEY (`uploadedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_timelines` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NOT NULL,
  `description` TEXT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_event_timelines_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_timeline_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `timelineId` INT NOT NULL,
  `eventId` INT NOT NULL,
  `dateTime` DATETIME NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_etd_timeline` FOREIGN KEY (`timelineId`) REFERENCES `event_timelines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_etd_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_approvals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventId` INT NOT NULL,
  `approvedBy` INT NOT NULL,
  `status` ENUM('approved','rejected','revision_requested') NOT NULL,
  `note` TEXT NULL,
  `revisionDeadline` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_event_approvals_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_approvals_user` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_registrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventId` INT NOT NULL,
  `userId` INT NOT NULL,
  `registrationDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('registered','attended','confirmed','absent','cancelled') NOT NULL DEFAULT 'registered',
  `attendedAt` DATETIME NULL,
  `attendanceLat` DECIMAL(10,7) NULL,
  `attendanceLng` DECIMAL(10,7) NULL,
  `confirmedBy` INT NULL,
  `confirmedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registration` (`eventId`,`userId`),
  CONSTRAINT `fk_er_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_er_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_er_confirmedBy` FOREIGN KEY (`confirmedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_feedbacks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventId` INT NOT NULL,
  `userId` INT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feedback` (`eventId`,`userId`),
  CONSTRAINT `fk_feedback_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `certificates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `eventId` INT NULL,
  `registrationId` INT NULL,
  `activityTitle` VARCHAR(255) NOT NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approvedBy` INT NULL,
  `approvedAt` DATETIME NULL,
  `approverName` VARCHAR(255) NULL,
  `stampCode` VARCHAR(100) NULL UNIQUE,
  `note` TEXT NULL,
  `certificateUrl` VARCHAR(500) NULL,
  `isBulk` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cert_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_event` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_registration` FOREIGN KEY (`registrationId`) REFERENCES `event_registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_approvedBy` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

SET @demo_password = '$2a$10$RAUU.ZbZiPuYTsEJnab5Ne7Y70Nb6NiLuKXvoU.zHq0GdLfTom3Ki';

INSERT INTO `users` (`id`,`name`,`email`,`password`,`role`,`phone`,`avatar`,`studentId`,`department`,`faculty`,`status`,`isActive`,`communityPoints`,`createdAt`,`updatedAt`) VALUES
(1,'Đoàn trường Đại học Bách khoa','demo.admin@dut.udn.vn',@demo_password,'admin','02363842308',NULL,NULL,'Văn phòng Đoàn trường','Đoàn trường','Hoạt động',1,0,NOW(),NOW()),
(2,'Liên chi Đoàn Khoa Công nghệ thông tin','demo.lienchi.cntt@dut.udn.vn',@demo_password,'lienchi','0905123456',NULL,NULL,'Liên chi Đoàn CNTT','Công nghệ thông tin','Hoạt động',1,0,NOW(),NOW()),
(3,'Liên chi Đoàn Khoa Cơ khí','demo.lienchi.cokhi@dut.udn.vn',@demo_password,'lienchi','0915234567',NULL,NULL,'Liên chi Đoàn Cơ khí','Cơ khí','Hoạt động',1,0,NOW(),NOW()),
(4,'Nguyễn Minh Anh','minhanh.23it@sv.dut.udn.vn',@demo_password,'student','0901000001',NULL,'102230101','23T_Nhat1','Công nghệ thông tin','Hoạt động',1,42,NOW(),NOW()),
(5,'Trần Quốc Bảo','quocbao.23kt@sv.dut.udn.vn',@demo_password,'student','0901000002',NULL,'102230102','23KTD1','Kinh tế xây dựng','Hoạt động',1,25,NOW(),NOW()),
(6,'Lê Hoàng Vy','hoangvy.22ck@sv.dut.udn.vn',@demo_password,'student','0901000003',NULL,'102220201','22C1A','Cơ khí','Hoạt động',1,68,NOW(),NOW()),
(7,'Phạm Gia Huy','giahuy.24dt@sv.dut.udn.vn',@demo_password,'student','0901000004',NULL,'102240301','24DTCLC1','Điện tử viễn thông','Hoạt động',1,10,NOW(),NOW()),
(8,'Võ Khánh Linh','khanhlinh.23mt@sv.dut.udn.vn',@demo_password,'student','0901000005',NULL,'102230401','23MT1','Môi trường','Hoạt động',1,35,NOW(),NOW());

INSERT INTO `events` (`id`,`title`,`description`,`category`,`plannedStartDate`,`plannedEndDate`,`actualStartDate`,`actualEndDate`,`registrationDeadline`,`revisionDeadline`,`locationName`,`locationLat`,`locationLng`,`attendanceRadius`,`minParticipants`,`maxParticipants`,`currentSlots`,`status`,`belowMinAction`,`belowMinNote`,`createdBy`,`createdByRole`,`revisionMessage`,`rejectionReason`,`qrCode`,`qrActive`,`createdAt`,`updatedAt`) VALUES
(101,'Chủ nhật xanh BK: Làm sạch tuyến đường Nguyễn Lương Bằng','Ra quân vệ sinh, bóc gỡ quảng cáo sai quy định và phân loại rác tại khu vực trước cổng trường. Sinh viên mang nón, bình nước cá nhân và có mặt đúng giờ để nhận dụng cụ.','Tình nguyện','2026-06-21 07:00:00','2026-06-21 11:00:00','2026-06-21 07:00:00','2026-06-21 11:00:00','2026-06-18 23:59:00',NULL,'Cổng chính Đại học Bách khoa, 54 Nguyễn Lương Bằng, Đà Nẵng',16.0730150,108.1498030,120,30,120,4,'open_registration',NULL,NULL,2,'lienchi',NULL,NULL,'BKYOUTH-GREEN26',1,'2026-06-01 09:00:00',NOW()),
(102,'Ngày hội Việc làm Công nghệ 2026','Kết nối sinh viên với doanh nghiệp công nghệ tại Đà Nẵng, gồm talkshow định hướng nghề nghiệp, gian hàng tuyển dụng và phỏng vấn thử CV.','Hướng nghiệp','2026-07-05 08:00:00','2026-07-05 16:30:00','2026-07-05 08:00:00','2026-07-05 16:30:00','2026-07-02 23:59:00',NULL,'Hội trường F, Đại học Bách khoa Đà Nẵng',16.0741030,108.1505510,80,80,300,3,'open_registration',NULL,NULL,2,'lienchi',NULL,NULL,NULL,0,'2026-06-03 14:20:00',NOW()),
(103,'Hiến máu tình nguyện BK lần 2 năm 2026','Chương trình hiến máu phối hợp với Bệnh viện Đà Nẵng. Người tham gia ăn sáng nhẹ, mang CCCD/thẻ sinh viên và không thức khuya trước ngày hiến máu.','Sức khỏe cộng đồng','2026-06-14 07:30:00','2026-06-14 11:30:00','2026-06-14 07:30:00','2026-06-14 11:30:00','2026-06-12 20:00:00',NULL,'Sảnh khu A, Đại học Bách khoa Đà Nẵng',16.0735660,108.1491120,100,50,180,2,'open_registration',NULL,NULL,1,'admin',NULL,NULL,'BKYOUTH-BLOOD2',0,'2026-05-29 08:30:00',NOW()),
(104,'Workshop AI thực chiến: Từ ý tưởng đến prototype','Workshop hướng dẫn sinh viên xây dựng prototype ứng dụng AI phục vụ học tập và hoạt động Đoàn - Hội.','Học thuật','2026-06-28 13:30:00','2026-06-28 17:00:00',NULL,NULL,'2026-06-25 23:59:00','2026-06-15 17:00:00','Phòng Lab Innovation, Khoa Công nghệ thông tin',16.0745100,108.1502200,60,20,60,0,'pending',NULL,NULL,2,'lienchi',NULL,NULL,NULL,0,'2026-06-07 10:15:00',NOW()),
(105,'Chiến dịch Mùa hè xanh: Lớp học số cho em','Đội hình sinh viên tình nguyện hỗ trợ học sinh xã Hòa Bắc làm quen tin học cơ bản, an toàn Internet và kỹ năng học trực tuyến.','Chiến dịch','2026-08-01 06:30:00','2026-08-07 18:00:00','2026-08-01 06:30:00','2026-08-07 18:00:00','2026-07-20 23:59:00',NULL,'Xã Hòa Bắc, huyện Hòa Vang, Đà Nẵng',16.1285600,108.0588100,200,25,45,3,'open_registration',NULL,NULL,3,'lienchi',NULL,NULL,NULL,0,'2026-06-05 16:45:00',NOW());

INSERT INTO `event_images` (`eventId`,`imageUrl`,`caption`,`isCover`,`sortOrder`,`createdAt`,`updatedAt`) VALUES
(101,'/uploads/events/seed-green-sunday.svg','Sinh viên ra quân dọn vệ sinh khu vực cổng trường',1,0,NOW(),NOW()),
(101,'/uploads/events/seed-green-sunday-2.svg','Phân loại rác sau hoạt động',0,1,NOW(),NOW()),
(102,'/uploads/events/seed-career-day.svg','Không gian gian hàng tuyển dụng tại hội trường F',1,0,NOW(),NOW()),
(103,'/uploads/events/seed-blood-donation.svg','Khu vực tiếp nhận sinh viên hiến máu',1,0,NOW(),NOW()),
(104,'/uploads/events/seed-ai-workshop.svg','Sinh viên thực hành prototype AI theo nhóm',1,0,NOW(),NOW()),
(105,'/uploads/events/seed-summer-campaign.svg','Đội hình tình nguyện chuẩn bị lớp học số',1,0,NOW(),NOW());

INSERT INTO `event_documents` (`eventId`,`fileName`,`fileUrl`,`fileType`,`fileSize`,`uploadedBy`,`createdAt`,`updatedAt`) VALUES
(101,'Ke-hoach-Chu-nhat-xanh.pdf','/uploads/events/seed-plan-green-sunday.pdf','pdf',245760,2,NOW(),NOW()),
(102,'Danh-sach-doanh-nghiep-tham-du.pdf','/uploads/events/seed-career-companies.pdf','pdf',312400,2,NOW(),NOW()),
(105,'De-cuong-Mua-he-xanh.docx','/uploads/events/seed-summer-campaign-plan.docx','docx',184320,3,NOW(),NOW());

INSERT INTO `event_timelines` (`id`,`eventId`,`title`,`startDate`,`endDate`,`description`,`sortOrder`,`createdAt`,`updatedAt`) VALUES
(201,101,'Tập trung và chia đội','2026-06-21 07:00:00','2026-06-21 07:30:00','Điểm danh, phát áo đội hình và phân công khu vực.',0,NOW(),NOW()),
(202,101,'Ra quân vệ sinh','2026-06-21 07:30:00','2026-06-21 10:30:00','Dọn rác, bóc gỡ quảng cáo, phân loại và bàn giao khu vực.',1,NOW(),NOW()),
(203,102,'Talkshow nghề nghiệp','2026-07-05 08:30:00','2026-07-05 10:00:00','Diễn giả chia sẻ lộ trình fresher, intern và cách chuẩn bị portfolio.',0,NOW(),NOW()),
(204,102,'Gian hàng tuyển dụng','2026-07-05 10:00:00','2026-07-05 16:00:00','Sinh viên gặp doanh nghiệp, nộp CV và phỏng vấn thử.',1,NOW(),NOW()),
(205,103,'Khám sàng lọc','2026-06-14 07:30:00','2026-06-14 09:00:00','Kiểm tra sức khỏe, huyết áp và tư vấn trước khi hiến máu.',0,NOW(),NOW()),
(206,104,'Thực hành prototype','2026-06-28 14:15:00','2026-06-28 16:30:00','Các nhóm xây dựng demo ngắn và nhận phản hồi từ mentor.',0,NOW(),NOW()),
(207,105,'Tập huấn đội hình','2026-08-01 08:30:00','2026-08-01 11:30:00','Tập huấn giáo án, phân nhóm phụ trách lớp và quy trình báo cáo.',0,NOW(),NOW());

INSERT INTO `event_timeline_details` (`timelineId`,`eventId`,`dateTime`,`title`,`content`,`sortOrder`,`createdAt`,`updatedAt`) VALUES
(201,101,'2026-06-21 07:00:00','Điểm danh QR','Ban tổ chức mở QR tại cổng chính, sinh viên điểm danh theo lớp.',0,NOW(),NOW()),
(201,101,'2026-06-21 07:20:00','Nhận dụng cụ','Mỗi nhóm nhận bao tay, kẹp rác, túi phân loại và sơ đồ khu vực.',1,NOW(),NOW()),
(202,101,'2026-06-21 10:30:00','Tổng kết nhanh','Tập trung chụp ảnh, cân rác phân loại và ghi nhận đội hình.',0,NOW(),NOW()),
(203,102,'2026-07-05 08:45:00','CV của sinh viên năm 3 cần gì?','Chuyên viên tuyển dụng góp ý cấu trúc CV và portfolio.',0,NOW(),NOW()),
(204,102,'2026-07-05 13:30:00','Mock interview','Sinh viên đăng ký phỏng vấn thử tại bàn doanh nghiệp.',0,NOW(),NOW()),
(205,103,'2026-06-14 08:15:00','Tư vấn trước hiến máu','Bác sĩ kiểm tra điều kiện sức khỏe và hướng dẫn sau khi hiến máu.',0,NOW(),NOW()),
(206,104,'2026-06-28 16:30:00','Demo 3 phút','Mỗi nhóm trình bày vấn đề, giải pháp và hướng phát triển.',0,NOW(),NOW()),
(207,105,'2026-08-01 10:00:00','Phân công lớp học','Chia đội phụ trách tin học cơ bản, an toàn Internet và truyền thông.',0,NOW(),NOW());

INSERT INTO `event_approvals` (`eventId`,`approvedBy`,`status`,`note`,`revisionDeadline`,`createdAt`,`updatedAt`) VALUES
(101,1,'approved','Kế hoạch phù hợp, lưu ý đảm bảo an toàn giao thông khi hoạt động ngoài cổng trường.',NULL,'2026-06-02 09:30:00',NOW()),
(102,1,'approved','Đề nghị bổ sung khu vực check-in riêng cho doanh nghiệp trước giờ khai mạc.',NULL,'2026-06-04 08:15:00',NOW()),
(104,1,'revision_requested','Cần bổ sung danh sách mentor và tiêu chí chọn nhóm tham gia.','2026-06-15 17:00:00','2026-06-08 15:00:00',NOW()),
(105,1,'approved','Thống nhất chủ trương, Liên chi cập nhật danh sách tình nguyện viên trước 25/07.',NULL,'2026-06-06 10:00:00',NOW());

INSERT INTO `event_registrations` (`eventId`,`userId`,`registrationDate`,`status`,`attendedAt`,`attendanceLat`,`attendanceLng`,`confirmedBy`,`confirmedAt`,`createdAt`,`updatedAt`) VALUES
(101,4,'2026-06-08 09:15:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(101,5,'2026-06-08 10:20:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(101,7,'2026-06-09 08:05:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(101,8,'2026-06-09 08:40:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(102,4,'2026-06-09 11:30:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(102,5,'2026-06-09 13:00:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(102,6,'2026-06-09 14:10:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(103,6,'2026-06-05 08:45:00','attended','2026-06-14 07:52:00',16.0735600,108.1491000,NULL,NULL,NOW(),NOW()),
(103,8,'2026-06-06 19:30:00','confirmed','2026-06-14 08:05:00',16.0735900,108.1491300,1,'2026-06-14 11:10:00',NOW(),NOW()),
(105,4,'2026-06-07 20:10:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(105,6,'2026-06-08 21:05:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW()),
(105,8,'2026-06-09 09:50:00','registered',NULL,NULL,NULL,NULL,NULL,NOW(),NOW());

INSERT INTO `event_feedbacks` (`eventId`,`userId`,`rating`,`comment`,`createdAt`,`updatedAt`) VALUES
(103,6,5,'Quy trình rõ ràng, có khu vực nghỉ sau hiến máu và đội hỗ trợ rất chu đáo.','2026-06-14 15:30:00',NOW()),
(103,8,4,'Chương trình ý nghĩa, lần sau nên mở thêm khung giờ buổi chiều cho sinh viên bận học sáng.','2026-06-14 16:10:00',NOW());

INSERT INTO `certificates` (`id`,`userId`,`eventId`,`registrationId`,`activityTitle`,`status`,`approvedBy`,`approvedAt`,`approverName`,`stampCode`,`note`,`certificateUrl`,`isBulk`,`createdAt`,`updatedAt`)
SELECT 301,8,103,er.id,'Hiến máu tình nguyện BK lần 2 năm 2026','approved',1,'2026-06-14 11:20:00','Đoàn trường Đại học Bách khoa','CERT-BK-2026-0001','Đã xác nhận tham gia và hoàn tất hiến máu.','/uploads/events/seed-cert-blood-9108.pdf',0,NOW(),NOW()
FROM `event_registrations` er WHERE er.eventId = 103 AND er.userId = 8 LIMIT 1;

SELECT COUNT(*) AS total_users FROM `users`;
SELECT COUNT(*) AS total_events FROM `events`;
SELECT `id`, `title`, `status` FROM `events`;
