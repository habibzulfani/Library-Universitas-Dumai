-- =====================================================
-- E-REPOSITORI UNIVERSITAS DUMAI DATABASE SCHEMA
-- =====================================================
-- Project: Aplikasi E-Repositori Universitas Dumai
-- Author: Based on thesis by Habib Zulfani (2204016)
-- Database: MySQL
-- Created: 2024
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS test_db2;
USE test_db2;

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- Users table - Core user management
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    nim VARCHAR(50),
    jurusan VARCHAR(255),
    login_counter INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- CONTENT MANAGEMENT TABLES
-- =====================================================

-- Papers table - Academic papers and journals
CREATE TABLE IF NOT EXISTS papers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    advisor VARCHAR(255),
    university VARCHAR(255),
    department VARCHAR(255),
    year INT,
    issn VARCHAR(191),
    abstract TEXT,
    keywords TEXT,
    file_url VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by)
);

-- Books table - Book management
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by)
);

-- =====================================================
-- RELATIONSHIP TABLES (Many-to-Many)
-- =====================================================

-- User-Books relationship (for favorites, downloads, etc.)
CREATE TABLE user_books (
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User-Papers relationship (for favorites, downloads, etc.)
CREATE TABLE user_papers (
    user_id BIGINT NOT NULL,
    paper_id BIGINT NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (user_id, paper_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Paper authors relationship
CREATE TABLE paper_authors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    paper_id BIGINT NOT NULL,
    user_id BIGINT,
    author_name LONGTEXT NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_paper_id (paper_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- Book authors relationship
CREATE TABLE book_authors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    book_id BIGINT NOT NULL,
    user_id BIGINT,
    author_name LONGTEXT NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_book_id (book_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- ACTIVITY TRACKING TABLES
-- =====================================================

-- Activity logs for tracking user actions
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action LONGTEXT NOT NULL,
    item_id BIGINT,
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
CREATE TABLE counters (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    count BIGINT DEFAULT 0,
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- =====================================================
-- ADDITIONAL TABLES FOR ENHANCED FUNCTIONALITY
-- =====================================================

-- Categories for better organization
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('book', 'paper', 'both') DEFAULT 'both',
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    INDEX idx_name (name),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- Book-Category relationship
CREATE TABLE book_categories (
    book_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    
    PRIMARY KEY (book_id, category_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Paper-Category relationship
CREATE TABLE paper_categories (
    paper_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    
    PRIMARY KEY (paper_id, category_id),
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- File uploads tracking
CREATE TABLE file_uploads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path LONGTEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by BIGINT,
    related_id BIGINT,
    related_type ENUM('book', 'paper'),
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_related (related_id, related_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Download statistics
CREATE TABLE downloads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    item_id BIGINT NOT NULL,
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
-- INITIAL DATA SETUP
-- =====================================================

-- Insert sample users (password is 'password123' for all users)
INSERT INTO users (email, password_hash, name, role, nim, jurusan) VALUES
('admin@demo.com', '$2a$10$rGPOKvbQsOZl6UnPNL.l5.6pCE6JR3.YrLe2QFh3WtZwQ2E8JyIQG', 'Administrator', 'admin', NULL, NULL),
('user@demo.com', '$2a$10$rGPOKvbQsOZl6UnPNL.l5.6pCE6JR3.YrLe2QFh3WtZwQ2E8JyIQG', 'Regular User', 'user', '12345', 'Computer Science'),
('john.smith@demo.com', '$2a$10$rGPOKvbQsOZl6UnPNL.l5.6pCE6JR3.YrLe2QFh3WtZwQ2E8JyIQG', 'John Smith', 'user', '67890', 'Information Technology'),
('jane.doe@demo.com', '$2a$10$rGPOKvbQsOZl6UnPNL.l5.6pCE6JR3.YrLe2QFh3WtZwQ2E8JyIQG', 'Jane Doe', 'user', '54321', 'Data Science'),
('mike.wilson@demo.com', '$2a$10$rGPOKvbQsOZl6UnPNL.l5.6pCE6JR3.YrLe2QFh3WtZwQ2E8JyIQG', 'Mike Wilson', 'user', '98765', 'Software Engineering');

-- Insert sample books
INSERT INTO books (title, author, publisher, published_year, isbn, subject, language, pages, summary) VALUES
('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson', 'MIT Press', 2009, '978-0262033848', 'Computer Science', 'English', 1292, 'A comprehensive textbook on computer algorithms covering design techniques and analysis.'),
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', 2008, '978-0132350884', 'Software Engineering', 'English', 464, 'A guide to writing clean, readable, and maintainable code with practical examples.'),
('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm', 'Addison-Wesley', 1994, '978-0201633610', 'Software Design', 'English', 395, 'The definitive guide to design patterns in object-oriented programming.'),
('Database System Concepts', 'Abraham Silberschatz, Henry F. Korth', 'McGraw-Hill', 2019, '978-0078022159', 'Database Systems', 'English', 1376, 'Comprehensive coverage of database management systems and their applications.'),
('Computer Networks', 'Andrew S. Tanenbaum, David J. Wetherall', 'Pearson', 2010, '978-0132126953', 'Networking', 'English', 960, 'A detailed exploration of computer networking protocols and technologies.'),
('Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', 'Pearson', 2020, '978-0134610993', 'Artificial Intelligence', 'English', 1152, 'The leading textbook in artificial intelligence covering all major topics in the field.'),
('Operating System Concepts', 'Abraham Silberschatz, Peter Galvin', 'Wiley', 2018, '978-1118063330', 'Operating Systems', 'English', 944, 'Essential concepts and principles of modern operating systems.'),
('Data Structures and Algorithms in Java', 'Robert Lafore', 'Sams Publishing', 2017, '978-0672324536', 'Programming', 'English', 800, 'Practical guide to implementing data structures and algorithms in Java.'),
('Machine Learning Yearning', 'Andrew Ng', 'Self-Published', 2018, '978-0999479230', 'Machine Learning', 'English', 118, 'Technical strategy guide for machine learning projects by Andrew Ng.'),
('The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 'Addison-Wesley', 2019, '978-0135957059', 'Software Development', 'English', 352, 'Practical advice for software developers to become more effective programmers.');

-- Insert sample papers
INSERT INTO papers (title, author, advisor, university, department, year, abstract, keywords) VALUES
('Deep Learning Applications in Medical Image Analysis', 'Sarah Johnson', 'Dr. Michael Chen', 'Universitas Dumai', 'Computer Science', 2023, 'This research explores the application of deep learning techniques for automated medical image analysis, focusing on diagnostic accuracy improvements in radiology. The study implements convolutional neural networks for detecting abnormalities in X-ray and MRI scans.', 'deep learning, medical imaging, CNN, radiology, healthcare AI'),
('Blockchain Technology for Supply Chain Management', 'Ahmad Rahman', 'Dr. Lisa Wang', 'Universitas Dumai', 'Information Technology', 2023, 'An investigation into the implementation of blockchain technology for enhancing transparency and traceability in supply chain management systems. The research proposes a decentralized framework for tracking goods from production to delivery.', 'blockchain, supply chain, transparency, traceability, decentralized systems'),
('Natural Language Processing for Sentiment Analysis', 'Maria Garcia', 'Dr. James Wilson', 'Universitas Dumai', 'Data Science', 2022, 'This thesis presents a comprehensive study of natural language processing techniques for sentiment analysis of social media content. The research develops improved algorithms for understanding emotional context in text data.', 'NLP, sentiment analysis, social media, text mining, emotion detection'),
('IoT-Based Smart City Infrastructure', 'David Lee', 'Dr. Rachel Kim', 'Universitas Dumai', 'Software Engineering', 2023, 'Research on the development of Internet of Things (IoT) infrastructure for smart city applications. The study focuses on sensor networks, data collection, and real-time monitoring systems for urban management.', 'IoT, smart city, sensor networks, urban planning, real-time monitoring'),
('Cybersecurity in Cloud Computing Environments', 'Jennifer Brown', 'Dr. Robert Taylor', 'Universitas Dumai', 'Information Security', 2022, 'An analysis of security challenges and solutions in cloud computing environments. The research proposes new security frameworks and protocols for protecting data and applications in cloud infrastructure.', 'cybersecurity, cloud computing, data protection, security frameworks, encryption'),
('Machine Learning for Predictive Maintenance', 'Alex Thompson', 'Dr. Emily Davis', 'Universitas Dumai', 'Industrial Engineering', 2023, 'Investigation of machine learning algorithms for predictive maintenance in manufacturing systems. The study develops models for predicting equipment failures and optimizing maintenance schedules.', 'machine learning, predictive maintenance, manufacturing, optimization, equipment monitoring'),
('Mobile Application Development for E-Learning', 'Lisa Anderson', 'Dr. Mark Johnson', 'Universitas Dumai', 'Computer Science', 2022, 'Development and evaluation of mobile applications for enhanced e-learning experiences. The research focuses on user interface design, engagement metrics, and learning effectiveness in mobile environments.', 'mobile development, e-learning, user experience, educational technology, mobile UI'),
('Big Data Analytics in Healthcare Systems', 'Kevin Zhang', 'Dr. Patricia Miller', 'Universitas Dumai', 'Data Science', 2023, 'Application of big data analytics techniques for improving healthcare delivery and patient outcomes. The study analyzes large-scale medical datasets to identify patterns and predict health trends.', 'big data, healthcare analytics, patient outcomes, medical data, predictive modeling'),
('Augmented Reality in Education Technology', 'Michelle Roberts', 'Dr. Steven Clark', 'Universitas Dumai', 'Educational Technology', 2022, 'Exploration of augmented reality applications in educational settings. The research evaluates the effectiveness of AR technology for enhancing student engagement and learning outcomes.', 'augmented reality, education technology, student engagement, immersive learning, AR applications'),
('Quantum Computing Algorithms and Applications', 'Christopher Lee', 'Dr. Jennifer Liu', 'Universitas Dumai', 'Theoretical Computer Science', 2023, 'Research on quantum computing algorithms and their potential applications in cryptography and optimization problems. The study explores quantum advantage in specific computational tasks.', 'quantum computing, quantum algorithms, cryptography, optimization, quantum advantage');

-- Initialize counters
INSERT INTO counters (name, count) VALUES 
('total_downloads', 0),
('total_users', 1),
('total_books', 0),
('total_papers', 0),
('total_visits', 0);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active books with author information
CREATE VIEW active_books AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.publisher,
    b.published_year,
    b.isbn,
    b.subject,
    b.language,
    b.pages,
    b.summary,
    b.file_url,
    b.created_at,
    b.updated_at,
    GROUP_CONCAT(c.name SEPARATOR ', ') as categories
FROM books b
LEFT JOIN book_categories bc ON b.id = bc.book_id
LEFT JOIN categories c ON bc.category_id = c.id
WHERE b.deleted_at IS NULL
GROUP BY b.id;

-- View for active papers with author information
CREATE VIEW active_papers AS
SELECT 
    p.id,
    p.title,
    p.author,
    p.advisor,
    p.university,
    p.department,
    p.year,
    p.issn,
    p.abstract,
    p.keywords,
    p.file_url,
    p.created_at,
    p.updated_at,
    GROUP_CONCAT(c.name SEPARATOR ', ') as categories
FROM papers p
LEFT JOIN paper_categories pc ON p.id = pc.paper_id
LEFT JOIN categories c ON pc.category_id = c.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- View for download statistics
CREATE VIEW download_stats AS
SELECT 
    item_type,
    item_id,
    COUNT(*) as download_count,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(downloaded_at) as last_download
FROM downloads
GROUP BY item_type, item_id;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to increment counter
CREATE PROCEDURE IncrementCounter(IN counter_name VARCHAR(255))
BEGIN
    INSERT INTO counters (name, count) VALUES (counter_name, 1)
    ON DUPLICATE KEY UPDATE count = count + 1;
END //

-- Procedure to log download activity
CREATE PROCEDURE LogDownload(
    IN p_user_id BIGINT,
    IN p_item_id BIGINT,
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

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger to update counters when new user is created
CREATE TRIGGER after_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
BEGIN
    CALL IncrementCounter('total_users');
END //

-- Trigger to update counters when new book is created
CREATE TRIGGER after_book_insert
    AFTER INSERT ON books
    FOR EACH ROW
BEGIN
    CALL IncrementCounter('total_books');
END //

-- Trigger to update counters when new paper is created
CREATE TRIGGER after_paper_insert
    AFTER INSERT ON papers
    FOR EACH ROW
BEGIN
    CALL IncrementCounter('total_papers');
END //

DELIMITER ;

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Additional indexes for better search performance
CREATE INDEX idx_books_search ON books(title(50), author(50), subject(50));
CREATE INDEX idx_papers_search ON papers(title(50), author(50), department(50));
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at DESC);
CREATE INDEX idx_downloads_date ON downloads(downloaded_at DESC);

-- =====================================================
-- SECURITY SETTINGS
-- =====================================================

-- Create application user with limited privileges
-- CREATE USER 'e_repositori'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON test_db2.* TO 'e_repositori'@'localhost';
-- GRANT EXECUTE ON PROCEDURE test_db2.IncrementCounter TO 'e_repositori'@'localhost';
-- GRANT EXECUTE ON PROCEDURE test_db2.LogDownload TO 'e_repositori'@'localhost';
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