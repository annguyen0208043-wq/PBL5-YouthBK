SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS event_reviews;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS evidences;
DROP TABLE IF EXISTS training_scores;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS event_timeline;
DROP TABLE IF EXISTS event_images;
DROP TABLE IF EXISTS event_approval;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- ROLES
-- =========================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role_id INT,
    status VARCHAR(20),
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =========================
-- CLASSES
-- =========================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50),
    faculty VARCHAR(100)
);

-- =========================
-- STUDENTS
-- =========================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    student_code VARCHAR(20),
    class_id INT,
    faculty VARCHAR(100),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- =========================
-- EVENTS
-- =========================
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    start_time DATETIME,
    end_time DATETIME,
    max_participants INT,
    created_by INT,
    status VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =========================
-- EVENT APPROVAL
-- =========================
CREATE TABLE event_approval (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    approved_by INT,
    status VARCHAR(20),
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =========================
-- EVENT IMAGES
-- =========================
CREATE TABLE event_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    image_url VARCHAR(255),

    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- =========================
-- EVENT TIMELINE
-- =========================
CREATE TABLE event_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    timeline_time DATETIME,
    description TEXT,

    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- =========================
-- REGISTRATIONS
-- =========================
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    event_id INT,
    status VARCHAR(20),
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- =========================
-- ATTENDANCE
-- =========================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT,
    checkin_time DATETIME,
    latitude DOUBLE,
    longitude DOUBLE,
    status VARCHAR(20),

    FOREIGN KEY (registration_id) REFERENCES registrations(id)
);

-- =========================
-- TRAINING SCORES
-- =========================
CREATE TABLE training_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    event_id INT,
    score INT,
    semester VARCHAR(20),
    updated_by INT,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- =========================
-- EVIDENCES
-- =========================
CREATE TABLE evidences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    event_id INT,
    file_url VARCHAR(255),
    link_url VARCHAR(255),
    status VARCHAR(20),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- =========================
-- CERTIFICATES
-- =========================
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    event_id INT,
    certificate_url VARCHAR(255),
    issued_at DATETIME,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- =========================
-- EVENT REVIEWS
-- =========================
CREATE TABLE event_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    event_id INT,
    rating INT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);