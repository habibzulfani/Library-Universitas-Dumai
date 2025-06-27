-- =====================================================
-- E-REPOSITORI UNIVERSITAS DUMAI DATABASE SCHEMA
-- =====================================================
-- Project: Aplikasi E-Repositori Universitas Dumai
-- Author: Based on thesis by Habib Zulfani (2204016)
-- Database: MySQL
-- Created: 2024
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS e_repository_db;
USE e_repository_db;

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- Departments table - Department management
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty ENUM('Fakultas Ekonomi', 'Fakultas Ilmu Komputer', 'Fakultas Hukum') NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY unique_department_faculty (name, faculty)
) ENGINE=InnoDB;

-- Insert default departments
INSERT INTO departments (name, faculty) VALUES
    ('Manajemen', 'Fakultas Ekonomi'),
    ('Sistem Informasi', 'Fakultas Ilmu Komputer'),
    ('Teknik Informatika', 'Fakultas Ilmu Komputer'),
    ('Rekayasa Perangkat Lunak', 'Fakultas Ilmu Komputer'),
    ('Manajemen Informatika', 'Fakultas Ilmu Komputer'),
    ('Ilmu Hukum', 'Fakultas Hukum');

-- Users table - Core user management
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    user_type ENUM('student', 'lecturer') DEFAULT 'student',
    nim_nidn VARCHAR(50) NOT NULL,
    faculty ENUM('Fakultas Ekonomi', 'Fakultas Ilmu Komputer', 'Fakultas Hukum') NOT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    address VARCHAR(500),
    profile_picture_url VARCHAR(500),
    login_counter INT DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL DEFAULT NULL,
    CONSTRAINT uni_users_email UNIQUE (email),
    CONSTRAINT chk_email CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_nim_nidn CHECK (
        (user_type = 'student' AND nim_nidn REGEXP '^[0-9]{7,}$') OR
        (user_type = 'lecturer' AND nim_nidn REGEXP '^[0-9]{10,}$')
    ),
    INDEX idx_users_role (role),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Insert default admin user
-- Password: admin123 (should be changed on first login)
INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    user_type,
    nim_nidn,
    faculty,
    department_id,
    email_verified,
    is_approved
) VALUES (
    'admin@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt hash of 'admin123'
    'System Administrator',
    'admin',
    'lecturer',
    '0000000001', -- 10-digit NIDN for lecturer
    'Fakultas Ilmu Komputer',
    2, -- Department ID for 'Sistem Informasi'
    TRUE,
    TRUE
);

-- =====================================================
-- CONTENT MANAGEMENT TABLES
-- =====================================================

-- Papers table - Academic papers and journals
CREATE TABLE IF NOT EXISTS papers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    advisor VARCHAR(255),
    university VARCHAR(255),
    department VARCHAR(255),
    year INT,
    issn VARCHAR(191),
    journal VARCHAR(255),
    volume INT,
    issue INT,
    pages VARCHAR(50),
    doi VARCHAR(255),
    abstract TEXT,
    keywords TEXT,
    file_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    created_by BIGINT UNSIGNED,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_department (department),
    INDEX idx_journal (journal(100)),
    INDEX idx_doi (doi(100))
) ENGINE=InnoDB;

-- Books table - Book management
CREATE TABLE IF NOT EXISTS books (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    published_year INT,
    isbn VARCHAR(50),
    subject VARCHAR(255),
    language VARCHAR(100) DEFAULT 'English',
    pages INT,
    summary TEXT,
    file_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    created_by BIGINT UNSIGNED,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB;

-- =====================================================
-- RELATIONSHIP TABLES (Many-to-Many)
-- =====================================================

-- User-Books relationship (for favorites, downloads, etc.)
CREATE TABLE IF NOT EXISTS user_books (
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User-Papers relationship (for favorites, downloads, etc.)
CREATE TABLE IF NOT EXISTS user_papers (
    user_id BIGINT UNSIGNED NOT NULL,
    paper_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (user_id, paper_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Paper authors relationship
CREATE TABLE IF NOT EXISTS paper_authors (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    paper_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED,
    author_name LONGTEXT NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_paper_id (paper_id),
    INDEX idx_user_id (user_id),
    INDEX idx_author_name (author_name(100))
) ENGINE=InnoDB;

-- Book authors relationship
CREATE TABLE IF NOT EXISTS book_authors (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    book_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED,
    author_name LONGTEXT NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_book_id (book_id),
    INDEX idx_user_id (user_id),
    INDEX idx_author_name (author_name(100))
) ENGINE=InnoDB;

-- =====================================================
-- ACTIVITY TRACKING TABLES
-- =====================================================

-- Activity logs for tracking user actions
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED,
    action LONGTEXT NOT NULL,
    item_id BIGINT UNSIGNED,
    item_type ENUM('book', 'paper') NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action(100)),
    INDEX idx_item (item_id, item_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Counters for tracking various metrics
CREATE TABLE IF NOT EXISTS counters (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    count BIGINT DEFAULT 0,
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- =====================================================
-- ADDITIONAL TABLES FOR ENHANCED FUNCTIONALITY
-- =====================================================

-- Categories for better organization
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('book', 'paper', 'both') DEFAULT 'both',
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    INDEX idx_name (name),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- Book-Category relationship
CREATE TABLE IF NOT EXISTS book_categories (
    book_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    
    PRIMARY KEY (book_id, category_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Paper-Category relationship
CREATE TABLE IF NOT EXISTS paper_categories (
    paper_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    
    PRIMARY KEY (paper_id, category_id),
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- File uploads tracking
CREATE TABLE IF NOT EXISTS file_uploads (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path LONGTEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by BIGINT UNSIGNED,
    related_id BIGINT UNSIGNED,
    related_type ENUM('book', 'paper'),
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_related (related_id, related_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Download statistics
CREATE TABLE IF NOT EXISTS downloads (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED,
    item_id BIGINT UNSIGNED NOT NULL,
    item_type ENUM('book', 'paper') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    downloaded_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_item (item_id, item_type),
    INDEX idx_downloaded_at (downloaded_at)
) ENGINE=InnoDB;

-- =====================================================
-- STORED PROCEDURES AND FUNCTIONS
-- =====================================================

DELIMITER //

-- Procedure to increment counters
CREATE PROCEDURE IncrementCounter(IN counter_name VARCHAR(255))
BEGIN
    INSERT INTO counters (name, count) VALUES (counter_name, 1)
    ON DUPLICATE KEY UPDATE count = count + 1;
END //

-- Procedure to log download activity
CREATE PROCEDURE LogDownload(
    IN p_user_id INT,
    IN p_item_id INT,
    IN p_item_type ENUM('book', 'paper'),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    -- Insert download record
    INSERT INTO downloads (user_id, item_id, item_type, ip_address, user_agent)
    VALUES (p_user_id, p_item_id, p_item_type, p_ip_address, p_user_agent);
    
    -- Insert activity log
    INSERT INTO activity_logs (user_id, action, item_id, item_type, ip_address, user_agent)
    VALUES (p_user_id, 'download', p_item_id, p_item_type, p_ip_address, p_user_agent);
    
    -- Increment download counter
    CALL IncrementCounter('total_downloads');
END //

-- Function to get user's download count
CREATE FUNCTION GetUserDownloadCount(p_user_id INT) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE download_count INT DEFAULT 0;
    SELECT COUNT(*) INTO download_count 
    FROM downloads 
    WHERE user_id = p_user_id;
    RETURN download_count;
END //

-- Function to get item's total download count
CREATE FUNCTION GetItemDownloadCount(p_item_id INT, p_item_type ENUM('book', 'paper')) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE download_count INT DEFAULT 0;
    SELECT COUNT(*) INTO download_count 
    FROM downloads 
    WHERE item_id = p_item_id AND item_type = p_item_type;
    RETURN download_count;
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional indexes for better query performance
CREATE INDEX idx_books_title ON books(title(100));
CREATE INDEX idx_books_author ON books(author(100));
CREATE INDEX idx_books_subject ON books(subject(100));
CREATE INDEX idx_papers_title ON papers(title(100));
CREATE INDEX idx_papers_author ON papers(author(100));
CREATE INDEX idx_papers_year ON papers(year);
CREATE INDEX idx_papers_department ON papers(department);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for book statistics
CREATE VIEW book_stats AS
SELECT 
    b.id,
    b.title,
    b.author,
    COUNT(DISTINCT ub.user_id) as favorite_count,
    COUNT(DISTINCT d.id) as download_count
FROM books b
LEFT JOIN user_books ub ON b.id = ub.book_id
LEFT JOIN downloads d ON b.id = d.item_id AND d.item_type = 'book'
GROUP BY b.id, b.title, b.author;

-- View for paper statistics  
CREATE VIEW paper_stats AS
SELECT 
    p.id,
    p.title,
    p.author,
    COUNT(DISTINCT up.user_id) as favorite_count,
    COUNT(DISTINCT d.id) as download_count
FROM papers p
LEFT JOIN user_papers up ON p.id = up.paper_id
LEFT JOIN downloads d ON p.id = d.item_id AND d.item_type = 'paper'
GROUP BY p.id, p.title, p.author;

-- View for user activity summary
CREATE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT al.id) as total_activities,
    COUNT(DISTINCT d.id) as total_downloads,
    COUNT(DISTINCT ub.book_id) as favorite_books,
    COUNT(DISTINCT up.paper_id) as favorite_papers
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id
LEFT JOIN downloads d ON u.id = d.user_id
LEFT JOIN user_books ub ON u.id = ub.user_id
LEFT JOIN user_papers up ON u.id = up.user_id
GROUP BY u.id, u.name, u.email;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC LOGGING
-- =====================================================

-- Trigger to log book downloads
DELIMITER //
CREATE TRIGGER log_book_download 
AFTER INSERT ON downloads
FOR EACH ROW
BEGIN
    IF NEW.item_type = 'book' THEN
        INSERT INTO activity_logs (user_id, action, item_id, item_type, ip_address, user_agent, created_at)
        VALUES (NEW.user_id, 'download', NEW.item_id, NEW.item_type, NEW.ip_address, NEW.user_agent, NEW.downloaded_at);
    END IF;
END //
DELIMITER ;

-- =====================================================
-- SECURITY AND PERMISSIONS
-- =====================================================

-- Note: User creation and permissions should be handled by environment setup
-- CREATE USER 'e_repositori'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON e_repository_db.* TO 'e_repositori'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Query to clean up old activity logs (run periodically)
-- DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Query to clean up old download records (run periodically)
-- DELETE FROM downloads WHERE downloaded_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Optional: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON e_repository_db.* TO 'e_repositori'@'localhost'; 