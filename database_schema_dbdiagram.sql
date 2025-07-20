-- Cleaned version for dbdiagram.io: Only CREATE TABLE, CREATE INDEX, and foreign keys are kept.

-- USER MANAGEMENT TABLES
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty ENUM('Fakultas Ekonomi', 'Fakultas Ilmu Komputer', 'Fakultas Hukum') NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY unique_department_faculty (name, faculty)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- CONTENT MANAGEMENT TABLES
CREATE TABLE IF NOT EXISTS papers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    advisor VARCHAR(255),
    university VARCHAR(255),
    department VARCHAR(255),
    year INT,
    issn VARCHAR(191),
    language VARCHAR(100) DEFAULT 'English',
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

CREATE TABLE IF NOT EXISTS books (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    published_year INT,
    isbn VARCHAR(50),
    subject VARCHAR(255),
    language VARCHAR(100) DEFAULT 'English',
    pages VARCHAR(50),
    summary TEXT,
    file_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    created_by BIGINT UNSIGNED,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB;

-- RELATIONSHIP TABLES
CREATE TABLE IF NOT EXISTS user_books (
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_papers (
    user_id BIGINT UNSIGNED NOT NULL,
    paper_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, paper_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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

-- ACTIVITY TRACKING TABLES
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

CREATE TABLE IF NOT EXISTS counters (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    count BIGINT DEFAULT 0,
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- ADDITIONAL TABLES
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

CREATE TABLE IF NOT EXISTS book_categories (
    book_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (book_id, category_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS paper_categories (
    paper_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (paper_id, category_id),
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS citations (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED,
    item_id BIGINT UNSIGNED NOT NULL,
    item_type ENUM('book', 'paper') NOT NULL,
    cited_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_item (item_id, item_type),
    INDEX idx_cited_at (cited_at)
) ENGINE=InnoDB;

-- INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX idx_books_title ON books(title(100));
CREATE INDEX idx_books_author ON books(author(100));
CREATE INDEX idx_books_subject ON books(subject(100));
CREATE INDEX idx_papers_title ON papers(title(100));
CREATE INDEX idx_papers_author ON papers(author(100));
CREATE INDEX idx_papers_year ON papers(year);
CREATE INDEX idx_papers_department ON papers(department); 