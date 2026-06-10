-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: pbl5_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetId` int DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ipAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `eventId` int DEFAULT NULL,
  `activityTitle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approvedBy` int DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `approverName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stampCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `certificateUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `eventId` (`eventId`),
  KEY `approvedBy` (`approvedBy`),
  CONSTRAINT `certificates_ibfk_75` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `certificates_ibfk_76` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `certificates_ibfk_77` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificates`
--

LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_invitations`
--

DROP TABLE IF EXISTS `chat_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversationId` int NOT NULL,
  `invitedBy` int NOT NULL,
  `invitedUserId` int NOT NULL,
  `status` enum('pending','accepted','declined') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `respondedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chat_invitations_invited_user_id_status` (`invitedUserId`,`status`),
  KEY `chat_invitations_conversation_id` (`conversationId`),
  KEY `invitedBy` (`invitedBy`),
  CONSTRAINT `chat_invitations_ibfk_58` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chat_invitations_ibfk_59` FOREIGN KEY (`invitedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chat_invitations_ibfk_60` FOREIGN KEY (`invitedUserId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_invitations`
--

LOCK TABLES `chat_invitations` WRITE;
/*!40000 ALTER TABLE `chat_invitations` DISABLE KEYS */;
INSERT INTO `chat_invitations` VALUES (1,3,10,4,'pending','mời thầy ạ',NULL,'2026-05-25 20:40:31','2026-05-25 20:40:31'),(2,4,10,11,'accepted',NULL,'2026-05-25 21:05:51','2026-05-25 21:05:25','2026-05-25 21:05:51'),(3,4,11,12,'accepted','tham gia nhosm cho vui','2026-05-25 21:07:21','2026-05-25 21:07:11','2026-05-25 21:07:21');
/*!40000 ALTER TABLE `chat_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation_members`
--

DROP TABLE IF EXISTS `conversation_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversationId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','member') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `joinedAt` datetime NOT NULL,
  `lastReadMessageId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversation_members_conversation_id_user_id` (`conversationId`,`userId`),
  KEY `conversation_members_user_id` (`userId`),
  CONSTRAINT `conversation_members_ibfk_39` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `conversation_members_ibfk_40` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation_members`
--

LOCK TABLES `conversation_members` WRITE;
/*!40000 ALTER TABLE `conversation_members` DISABLE KEYS */;
INSERT INTO `conversation_members` VALUES (1,1,11,'owner','2026-05-25 19:51:44',18,'2026-05-25 19:51:44','2026-05-25 21:04:47'),(2,1,10,'member','2026-05-25 19:51:44',18,'2026-05-25 19:51:44','2026-05-25 21:04:36'),(3,2,11,'owner','2026-05-25 19:52:07',NULL,'2026-05-25 19:52:07','2026-05-25 21:04:49'),(4,2,4,'member','2026-05-25 19:52:07',NULL,'2026-05-25 19:52:07','2026-05-25 19:52:07'),(5,3,10,'owner','2026-05-25 20:40:03',19,'2026-05-25 20:40:03','2026-05-25 21:04:37'),(6,3,3,'member','2026-05-25 20:40:03',NULL,'2026-05-25 20:40:03','2026-05-25 20:40:03'),(7,3,6,'member','2026-05-25 20:40:03',NULL,'2026-05-25 20:40:03','2026-05-25 20:40:03'),(8,3,1,'member','2026-05-25 20:40:03',NULL,'2026-05-25 20:40:03','2026-05-25 20:40:03'),(9,3,11,'member','2026-05-25 20:40:03',19,'2026-05-25 20:40:03','2026-05-25 21:04:50'),(10,4,10,'owner','2026-05-25 21:05:25',28,'2026-05-25 21:05:25','2026-06-04 13:01:31'),(11,4,11,'member','2026-05-25 21:05:51',28,'2026-05-25 21:05:51','2026-05-25 21:20:00'),(14,4,12,'member','2026-05-25 21:07:21',28,'2026-05-25 21:07:21','2026-05-25 21:17:12');
/*!40000 ALTER TABLE `conversation_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `type` enum('direct','group') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'group',
  `directKey` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `directKey` (`directKey`),
  UNIQUE KEY `directKey_2` (`directKey`),
  UNIQUE KEY `directKey_3` (`directKey`),
  UNIQUE KEY `directKey_4` (`directKey`),
  UNIQUE KEY `directKey_5` (`directKey`),
  UNIQUE KEY `directKey_6` (`directKey`),
  UNIQUE KEY `directKey_7` (`directKey`),
  UNIQUE KEY `directKey_8` (`directKey`),
  UNIQUE KEY `directKey_9` (`directKey`),
  UNIQUE KEY `directKey_10` (`directKey`),
  UNIQUE KEY `directKey_11` (`directKey`),
  UNIQUE KEY `directKey_12` (`directKey`),
  UNIQUE KEY `directKey_13` (`directKey`),
  UNIQUE KEY `directKey_14` (`directKey`),
  UNIQUE KEY `directKey_15` (`directKey`),
  UNIQUE KEY `directKey_16` (`directKey`),
  UNIQUE KEY `directKey_17` (`directKey`),
  UNIQUE KEY `directKey_18` (`directKey`),
  UNIQUE KEY `directKey_19` (`directKey`),
  UNIQUE KEY `directKey_20` (`directKey`),
  KEY `conversations_type` (`type`),
  KEY `conversations_direct_key` (`directKey`),
  KEY `conversations_updated_at` (`updatedAt`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,'user2@gmail.com - user1',11,'2026-05-25 19:51:44','2026-05-25 19:51:44','direct','10:11'),(2,'user2@gmail.com - LCD CNTT',11,'2026-05-25 19:52:07','2026-05-25 19:52:07','direct','4:11'),(3,'CNPM',10,'2026-05-25 20:40:03','2026-05-25 20:40:03','group',NULL),(4,'troll',10,'2026-05-25 21:05:25','2026-05-25 21:05:25','group',NULL);
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_approvals`
--

DROP TABLE IF EXISTS `event_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `approvedBy` int NOT NULL,
  `status` enum('approved','rejected','revision_requested') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eventId` (`eventId`),
  KEY `approvedBy` (`approvedBy`),
  CONSTRAINT `event_approvals_ibfk_75` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `event_approvals_ibfk_76` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_approvals`
--

LOCK TABLES `event_approvals` WRITE;
/*!40000 ALTER TABLE `event_approvals` DISABLE KEYS */;
INSERT INTO `event_approvals` VALUES (1,1,2,'approved','Ok, đồng ý với sự kiện này','2026-05-15 18:11:16','2026-05-15 18:11:16'),(2,2,2,'revision_requested','chỉnh sửa lại timeline cho hợp lý','2026-05-15 18:33:38','2026-05-15 18:33:38'),(3,3,2,'approved',NULL,'2026-05-18 18:12:19','2026-05-18 18:12:19'),(4,4,2,'revision_requested','sửa lại timeline','2026-05-19 22:58:39','2026-05-19 22:58:39'),(5,4,2,'approved',NULL,'2026-05-19 23:31:06','2026-05-19 23:31:06'),(6,4,2,'approved',NULL,'2026-05-19 23:39:21','2026-05-19 23:39:21'),(7,4,2,'approved',NULL,'2026-05-19 23:51:40','2026-05-19 23:51:40'),(8,5,2,'approved',NULL,'2026-05-19 23:55:11','2026-05-19 23:55:11'),(9,5,2,'approved',NULL,'2026-05-27 23:31:54','2026-05-27 23:31:54');
/*!40000 ALTER TABLE `event_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_images`
--

DROP TABLE IF EXISTS `event_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `imageUrl` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eventId` (`eventId`),
  CONSTRAINT `event_images_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_images`
--

LOCK TABLES `event_images` WRITE;
/*!40000 ALTER TABLE `event_images` DISABLE KEYS */;
INSERT INTO `event_images` VALUES (1,1,'/uploads/events/event-1778516069873-713183191.jpg','2026-05-11 23:14:29','2026-05-11 23:14:29'),(2,2,'/uploads/events/event-1778844768301-600349575.jpg','2026-05-15 18:32:48','2026-05-15 18:32:48'),(3,3,'/uploads/events/event-1779102723387-220556031.jpg','2026-05-18 18:12:03','2026-05-18 18:12:03'),(5,4,'/uploads/events/event-1779209453808-527889476.jpg','2026-05-19 23:50:53','2026-05-19 23:50:53'),(9,5,'/uploads/events/event-1779210065981-846401596.jpg','2026-05-20 00:01:06','2026-05-20 00:01:06'),(10,5,'/uploads/events/event-1779210065981-735831784.jpg','2026-05-20 00:01:06','2026-05-20 00:01:06'),(11,5,'/uploads/events/event-1779210065984-779946046.jpg','2026-05-20 00:01:06','2026-05-20 00:01:06'),(12,6,'/uploads/events/event-1780224246282-370761881.jpg','2026-05-31 17:44:06','2026-05-31 17:44:06');
/*!40000 ALTER TABLE `event_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_registrations`
--

DROP TABLE IF EXISTS `event_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `userId` int NOT NULL,
  `registrationDate` datetime DEFAULT NULL,
  `status` enum('registered','attended','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'registered',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eventId` (`eventId`),
  KEY `userId` (`userId`),
  CONSTRAINT `event_registrations_ibfk_79` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `event_registrations_ibfk_80` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_registrations`
--

LOCK TABLES `event_registrations` WRITE;
/*!40000 ALTER TABLE `event_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_timelines`
--

DROP TABLE IF EXISTS `event_timelines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_timelines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `dateTime` datetime NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eventId` (`eventId`),
  CONSTRAINT `event_timelines_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_timelines`
--

LOCK TABLES `event_timelines` WRITE;
/*!40000 ALTER TABLE `event_timelines` DISABLE KEYS */;
INSERT INTO `event_timelines` VALUES (1,1,'2026-05-10 07:00:00','Khai mạc','2026-05-11 23:14:29','2026-05-11 23:14:29'),(2,1,'2026-05-10 07:30:00','Bàn giao trại','2026-05-11 23:14:29','2026-05-11 23:14:29'),(3,2,'2026-05-20 07:19:00','khai mạc','2026-05-15 18:32:48','2026-05-15 18:32:48'),(4,2,'2026-05-20 08:00:00','Trận 1','2026-05-15 18:32:48','2026-05-15 18:32:48'),(5,2,'2026-05-21 08:00:00','Trận2','2026-05-15 18:32:48','2026-05-15 18:32:48'),(6,2,'2026-05-22 08:30:00','Chung kết','2026-05-15 18:32:48','2026-05-15 18:32:48'),(7,3,'2026-05-17 07:15:00','Khai mạc','2026-05-18 18:12:03','2026-05-18 18:12:03'),(8,3,'2026-05-17 07:30:00','Dọn dẹp','2026-05-18 18:12:03','2026-05-18 18:12:03'),(9,3,'2026-05-17 11:00:00','Nghỉ ngơi','2026-05-18 18:12:03','2026-05-18 18:12:03'),(10,3,'2026-05-18 07:00:00','Dọn lần 2','2026-05-18 18:12:03','2026-05-18 18:12:03'),(11,3,'2026-05-19 07:00:00','Kết thúc','2026-05-18 18:12:03','2026-05-18 18:12:03'),(18,4,'2026-05-20 08:00:00','Bơi ếch','2026-05-19 23:50:53','2026-05-19 23:50:53'),(19,4,'2026-05-20 22:00:00','Bơi cá nhân','2026-05-19 23:50:53','2026-05-19 23:50:53'),(20,4,'2026-05-22 17:00:00','kết thúc','2026-05-19 23:50:53','2026-05-19 23:50:53'),(27,5,'2026-05-20 07:00:00','Khai mạc','2026-05-20 00:01:05','2026-05-20 00:01:05'),(28,5,'2026-05-20 08:00:00','Tiến hành','2026-05-20 00:01:05','2026-05-20 00:01:05'),(29,5,'2026-05-20 11:00:00','kết thúc','2026-05-20 00:01:05','2026-05-20 00:01:05');
/*!40000 ALTER TABLE `event_timelines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `createdBy` int NOT NULL,
  `status` enum('draft','pending','revision_required','approved','update_requested','cancel_requested','postpone_requested','cancelled','postponed','ongoing','ended','completed','revision_requested','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `maxParticipants` int DEFAULT NULL,
  `registrationDeadline` datetime DEFAULT NULL,
  `createdByRole` enum('admin','lienchi') COLLATE utf8mb4_unicode_ci DEFAULT 'lienchi',
  `maxSlots` int DEFAULT NULL,
  `currentSlots` int DEFAULT '0',
  `reviewHistory` json DEFAULT NULL,
  `rejectionReason` text COLLATE utf8mb4_unicode_ci,
  `revisionMessage` text COLLATE utf8mb4_unicode_ci,
  `pendingChanges` json DEFAULT NULL,
  `pendingChangeType` enum('update','cancel','postpone') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pendingChangeReason` text COLLATE utf8mb4_unicode_ci,
  `pendingProposedDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Trại','Nhằm tạo sự đoàn kết, sân chơi,..','Khách sạn Navy','2026-05-10 07:00:00','2026-05-11 10:00:00',2,'ended',NULL,700,'Cộng đồng','2026-05-11 23:14:29','2026-05-31 16:52:00','2026-05-10 07:00:00','2026-05-11 10:00:00',700,NULL,'lienchi',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'Đá bóng','Đá bóng, trau dồi tinh thần đoàn kết, rèn luyện thể chất','sân bóng mikazuki','2026-05-20 07:00:00','2026-05-22 17:00:00',4,'revision_requested',NULL,200,'Kỹ năng','2026-05-15 18:32:48','2026-05-15 18:33:38','2026-05-20 07:00:00','2026-05-22 17:00:00',200,NULL,'lienchi',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'Vệ sinh trường học','Làm sạch vệ sinh môi trường','Cổng trường Bách Khoa','2026-05-17 07:00:00','2026-05-19 07:00:00',2,'ended',NULL,800,'Kỹ năng','2026-05-18 18:12:03','2026-05-31 16:52:00','2026-05-17 07:00:00','2026-05-19 07:00:00',800,NULL,'lienchi',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'[XIN HỦY] Bơi lội','LÝ DO HỦY: Liên chi có cuộc họp mới\r\n\r\n\r\nsự kiện bơi lội\r\n','Bãi biển Mỹ Khê','2026-05-20 07:00:00','2026-05-22 17:00:00',7,'ended',NULL,50,'Kỹ năng','2026-05-19 22:56:43','2026-05-31 16:52:00','2026-05-20 07:00:00','2026-05-22 17:00:00',50,NULL,'lienchi',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'Dâng hương anh hùng liệt sĩ','Tưởng nhớ tinh thần anh hùng dân tộc','Nghĩa trang A','2026-05-20 07:00:00','2026-05-20 11:00:00',7,'ended',NULL,150,'Kỹ năng','2026-05-19 23:53:15','2026-05-31 16:52:00','2026-05-20 07:00:00','2026-05-20 11:00:00',150,NULL,'lienchi',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'Thi tìm hiểu về Đảng','Thi tìm hiểu về thời gian hình thành và phát triển của đảngtìm hiểu về thời gian hình thành và phát triển của đảng','Online msteams','2026-06-04 23:59:00','2026-06-05 22:20:00',2,'ongoing',NULL,500,'Cộng đồng','2026-05-31 17:44:06','2026-06-05 16:23:00','2026-06-04 23:59:00','2026-06-05 22:20:00',500,NULL,'admin',500,0,'[]',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversationId` int NOT NULL,
  `senderId` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `attachments` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conversationId` (`conversationId`),
  KEY `senderId` (`senderId`),
  CONSTRAINT `messages_ibfk_79` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `messages_ibfk_80` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,11,'chào bạn','2026-05-25 20:01:19','2026-05-25 20:01:19',NULL),(2,1,11,'tôi là An, của lớp 23_Nhat1','2026-05-25 20:01:47','2026-05-25 20:01:47',NULL),(3,1,11,'ngày mai có lịch thi OOAD','2026-05-25 20:02:10','2026-05-25 20:02:10',NULL),(4,1,11,'bạn có thi không','2026-05-25 20:02:13','2026-05-25 20:02:13',NULL),(5,1,10,'chào bạn, mình đây','2026-05-25 20:02:34','2026-05-25 20:02:34',NULL),(6,1,10,'Có, mình thi xuất 9h','2026-05-25 20:02:39','2026-05-25 20:02:39',NULL),(7,1,10,'bạn học ai','2026-05-25 20:02:44','2026-05-25 20:02:44',NULL),(8,1,10,'có tài liệu không cho mình xin','2026-05-25 20:02:52','2026-05-25 20:02:52',NULL),(9,1,11,'không','2026-05-25 20:03:45','2026-05-25 20:03:45',NULL),(10,1,11,'cậu lên web tìm thử','2026-05-25 20:25:00','2026-05-25 20:25:00',NULL),(11,1,10,'ok cậu nhé','2026-05-25 20:38:34','2026-05-25 20:38:34',NULL),(12,1,10,'chúc cậu thi tốt','2026-05-25 20:38:38','2026-05-25 20:38:38',NULL),(13,1,11,'ok cậu','2026-05-25 20:39:00','2026-05-25 20:39:00',NULL),(14,1,11,'chúc cậu thi tốt nhé','2026-05-25 20:39:04','2026-05-25 20:39:04',NULL),(15,3,11,'hi','2026-05-25 20:41:17','2026-05-25 20:41:17',NULL),(16,3,10,'hi','2026-05-25 21:02:45','2026-05-25 21:02:45',NULL),(17,1,10,'ok','2026-05-25 21:02:53','2026-05-25 21:02:53',NULL),(18,1,10,'okkkkkkkkk','2026-05-25 21:03:48','2026-05-25 21:03:48',NULL),(19,3,10,'asdf','2026-05-25 21:03:52','2026-05-25 21:03:52',NULL),(20,4,11,'user2@gmail.com đã tham gia nhóm','2026-05-25 21:05:52','2026-05-25 21:05:52',NULL),(21,4,11,'user2@gmail.com đã tham gia nhóm','2026-05-25 21:05:52','2026-05-25 21:05:52',NULL),(22,4,11,'user2@gmail.com đã tham gia nhóm','2026-05-25 21:05:52','2026-05-25 21:05:52',NULL),(23,4,12,'user3 đã tham gia nhóm','2026-05-25 21:07:21','2026-05-25 21:07:21',NULL),(24,4,12,'hahaa','2026-05-25 21:07:26','2026-05-25 21:07:26',NULL),(25,4,12,'troll','2026-05-25 21:07:28','2026-05-25 21:07:28',NULL),(26,4,11,'kk','2026-05-25 21:07:50','2026-05-25 21:07:50',NULL),(27,4,11,'hai i','2026-05-25 21:07:53','2026-05-25 21:07:53',NULL),(28,4,12,'coi bộ này chưa','2026-05-25 21:16:45','2026-05-25 21:16:45',NULL);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_recipients`
--

DROP TABLE IF EXISTS `notification_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notificationId` int NOT NULL,
  `userId` int NOT NULL,
  `isRead` tinyint(1) DEFAULT '0',
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notificationId` (`notificationId`),
  KEY `userId` (`userId`),
  CONSTRAINT `notification_recipients_ibfk_75` FOREIGN KEY (`notificationId`) REFERENCES `notifications` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `notification_recipients_ibfk_76` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_recipients`
--

LOCK TABLES `notification_recipients` WRITE;
/*!40000 ALTER TABLE `notification_recipients` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senderId` int DEFAULT NULL,
  `isRead` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `targetType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetValue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipientCount` int DEFAULT '0',
  `readCount` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `senderId` (`senderId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','lienchi','student') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `studentId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `faculty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Hoạt động',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `studentId` (`studentId`),
  UNIQUE KEY `studentId_2` (`studentId`),
  UNIQUE KEY `studentId_3` (`studentId`),
  UNIQUE KEY `studentId_4` (`studentId`),
  UNIQUE KEY `studentId_5` (`studentId`),
  UNIQUE KEY `studentId_6` (`studentId`),
  UNIQUE KEY `studentId_7` (`studentId`),
  UNIQUE KEY `studentId_8` (`studentId`),
  UNIQUE KEY `studentId_9` (`studentId`),
  UNIQUE KEY `studentId_10` (`studentId`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Nguyễn Văn An','nguyenvanan020804@gmail.com','$2a$10$GUa38hpEdnViCi09fbqZj./rhznaE1Mh85k3Ipkc3b.gsKfER.agy','student','0978684764',NULL,'102230010',NULL,1,'2026-05-11 22:33:52','2026-05-11 22:33:52',NULL,'Hoạt động'),(2,'Đoàn trường ĐH Bách Khoa','admin@dut.udn','$2a$10$Ib5hBwIjoMC2m7UBycRKG.L/l9VB60ISruruQDZCFrC3.9QHGBTO6','admin','0901234567',NULL,NULL,NULL,1,'2026-05-11 22:57:14','2026-06-05 17:18:58','Đoàn trường','Hoạt động'),(3,'Ngô Thế Ngọc A','102230019@sv1.dut.udn.vn','$2a$10$iNebQeTqEtah1xLUt1KbNO7uruFbpGrbaS6S7bDWtl9N7UvvKCeuO','lienchi','0978685745',NULL,'10230019',NULL,1,'2026-05-11 23:16:36','2026-05-15 18:09:50','CNTT','Hoạt động'),(4,'LCD CNTT','CNTT@gmail.com','$2a$10$OFSqdZeQu4dltOU1byc6aODJYjw2o4BGvr.PBgUFABB1OAHgioWkm','lienchi',NULL,NULL,'LC01',NULL,1,'2026-05-15 18:14:11','2026-05-15 18:14:11','CNTT','Hoạt động'),(5,'Nguyễn Anh Huy','Nguyenanhhuy123@gmail.com','$2a$10$UwOjvBOII6ZeQiG7t2MA.Oi8hPGNX.R9r6uC6I6eLtMAi9F78zHbe','student','0978684766',NULL,'102230090',NULL,0,'2026-05-15 18:44:46','2026-06-05 17:15:02','Cơ khí','Tạm khóa'),(6,'Nguyễn An','annguyen020804@gmail.com','$2a$10$/QZSykVU4pSTD9LjkYZwHe9MEnNgIwlYg.tEBguM6oEmbjBxuBgsi','student','0978675643',NULL,'102230001',NULL,1,'2026-05-19 22:46:45','2026-05-19 22:46:45',NULL,'Hoạt động'),(7,'Cán Bộ Liên Chi Khoa Điện','khoadien@pbl5.edu.vn','$2a$10$LyUjpGz6WGNQMpoep1/lUe2aXjIJID3pLO8BOvHD6WA8lsjtf0mXK','lienchi',NULL,NULL,'KD01',NULL,1,'2026-05-19 22:51:03','2026-05-19 22:51:03','Điện','Hoạt động'),(10,'user1','user1@gmail.com','$2a$10$4/p3lqlxK1KOfbIxOusXOuKLdgySyzcXJFFgWI2AOK8B2E5mYLNEW','student','0978684764',NULL,'102230100',NULL,1,'2026-05-25 19:22:22','2026-05-25 19:22:22',NULL,'Hoạt động'),(11,'user2@gmail.com','user2@gmail.com','$2a$10$r7nzqpVOmcXCWpVDXZGz0OsDY3MGJthWyMYr6O5rSUeFBR5LsriUW','student','0978684767',NULL,'102230101',NULL,1,'2026-05-25 19:51:20','2026-05-25 19:51:20',NULL,'Hoạt động'),(12,'user3','user3@gmail.com','$2a$10$3J8BPadP2OJ3pLYi/oqiOujFXaiF2iB4HvoJo39jZ1BXwhlN3JOYS','student','',NULL,'102230111',NULL,1,'2026-05-25 21:06:33','2026-05-25 21:06:33',NULL,'Hoạt động'),(13,'lienchidoancntt','lcd@pbl5.edu.vn','$2a$10$mLTLQv6cLZx8DXw6ULsT..6aqDAenCUnADu8Kfgb1RLs4ebM1kXH6','lienchi','0978687824',NULL,'LCD01',NULL,1,'2026-05-27 23:33:29','2026-05-27 23:33:29','CNTT','Hoạt động'),(14,'khoa điện','lcdkhoadien@pbl5.edu.vn','$2a$10$wyRba89xNFh5nD8naKkT2etJLMc1CN5V/9NmG0GMhjeF/GV9GEkI2','lienchi',NULL,NULL,'KD02',NULL,1,'2026-06-05 17:14:08','2026-06-05 17:14:08','Điện','Hoạt động'),(15,'Nguyễn Văn Admin','admin@dut.udn.vn','$2a$10$Ib5hBwIjoMC2m7UBycRKG.L/l9VB60ISruruQDZCFrC3.9QHGBTO6','admin','0905123456',NULL,NULL,NULL,1,'2026-06-05 17:17:34','2026-06-05 17:17:34',NULL,'Hoạt động'),(16,'Trần Thị LienChi','lienchi@dut.udn.vn','$2a$10$9PFrbDgplTC4qRRwgBi98eW2h3tLLx8/Bvd8ksdlYwnyi5NhdRRUO','lienchi','0915234567',NULL,NULL,NULL,1,'2026-06-05 17:17:34','2026-06-05 17:17:34',NULL,'Hoạt động');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-05 17:26:17
