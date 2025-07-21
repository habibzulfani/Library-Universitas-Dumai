-- Sample Data for E-Repository System
-- This file contains demo data for testing and demonstration purposes

USE e_repository_db;

-- Insert default departments first (using INSERT IGNORE to skip duplicates)
INSERT IGNORE INTO departments (id, name, faculty) VALUES
    (1, 'Manajemen', 'Fakultas Ekonomi'),
    (2, 'Sistem Informasi', 'Fakultas Ilmu Komputer'),
    (3, 'Teknik Informatika', 'Fakultas Ilmu Komputer'),
    (4, 'Rekayasa Perangkat Lunak', 'Fakultas Ilmu Komputer'),
    (5, 'Manajemen Informatika', 'Fakultas Ilmu Komputer'),
    (6, 'Ilmu Hukum', 'Fakultas Hukum');

-- Insert Demo Users (passwords are hashed for 'password123')
INSERT INTO users (email, password_hash, name, role, user_type, nim_nidn, faculty, department_id, address, email_verified, is_approved, created_at, updated_at) VALUES
('admin@demo.com', '$2a$10$q.wMvyDiKxMo5F/c41bqhuuL/1hUi/Jt4x1e8oYl5ikSZgQ6Zo9eS', 'Admin User', 'admin', 'lecturer', '0000000001', 'Fakultas Ilmu Komputer', 2, 'Jl. Admin No. 1', TRUE, TRUE, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('user@demo.com', '$2a$10$q.wMvyDiKxMo5F/c41bqhuuL/1hUi/Jt4x1e8oYl5ikSZgQ6Zo9eS', 'Regular User', 'user', 'student', '2204001', 'Fakultas Ilmu Komputer', 2, 'Jl. User No. 1', TRUE, TRUE, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('john.smith@demo.com', '$2a$10$q.wMvyDiKxMo5F/c41bqhuuL/1hUi/Jt4x1e8oYl5ikSZgQ6Zo9eS', 'John Smith', 'user', 'student', '2204002', 'Fakultas Ilmu Komputer', 3, 'Jl. John No. 1', TRUE, TRUE, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('sarah.johnson@demo.com', '$2a$10$q.wMvyDiKxMo5F/c41bqhuuL/1hUi/Jt4x1e8oYl5ikSZgQ6Zo9eS', 'Sarah Johnson', 'user', 'student', '2204003', 'Fakultas Ilmu Komputer', 2, 'Jl. Sarah No. 1', TRUE, TRUE, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pending.lecturer1@demo.com', '$2a$10$q.wMvyDiKxMo5F/c41bqhuuL/1hUi/Jt4x1e8oYl5ikSZgQ6Zo9eS', 'Dr. Pending Lecturer 1', 'user', 'lecturer', '0000000002', 'Fakultas Ilmu Komputer', 2, 'Jl. Pending No. 1', TRUE, FALSE, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('pending.lecturer2@demo.com', '$2a$10$q.wMvyDiKxMo5F/c41bqhuuL/1hUi/Jt4x1e8oYl5ikSZgQ6Zo9eS', 'Dr. Pending Lecturer 2', 'user', 'lecturer', '0000000003', 'Fakultas Ekonomi', 1, 'Jl. Pending No. 2', TRUE, FALSE, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Insert Categories
INSERT INTO categories (name, description, type, created_at, updated_at) VALUES
('Computer Science', 'Books and papers related to computer science and programming', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Mathematics', 'Mathematical concepts, theories, and applications', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Physics', 'Physics research and academic materials', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Engineering', 'Engineering disciplines and technical studies', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Literature', 'Literary works and analysis', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Business', 'Business administration and management studies', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Economics', 'Economic research and financial studies', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Environmental Science', 'Environmental research and sustainability studies', 'both', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Insert Sample Books (updated to match actual files)
INSERT INTO books (title, author, publisher, published_year, isbn, subject, language, pages, summary, file_url, cover_image_url, created_by, created_at, updated_at) VALUES
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', 2008, '978-0132350884', 'Computer Science', 'English', 464, 'Best practices for writing clean, maintainable, and efficient code. This book teaches you how to write code that is easy to understand, maintain, and extend.', '/uploads/books/clean_code.pdf', '/uploads/covers/clean_code_cover.jpg', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Calculus: Early Transcendentals', 'James Stewart', 'Cengage Learning', 2015, '978-1285741550', 'Mathematics', 'English', 1344, 'Comprehensive calculus textbook with practical applications. Covers limits, derivatives, integrals, and series with real-world examples.', '/uploads/books/calculus_stewart.pdf', '/uploads/covers/calculus_cover.jpg', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Database System Concepts', 'Abraham Silberschatz', 'McGraw-Hill', 2019, '978-0078022159', 'Computer Science', 'English', 1376, 'Fundamental concepts of database systems and management. Essential reading for understanding database design and implementation.', '/uploads/books/database_concepts.pdf', '/uploads/covers/database_cover.jpg', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Physics for Scientists and Engineers', 'Raymond A. Serway', 'Cengage Learning', 2018, '978-1337553278', 'Physics', 'English', 1280, 'Comprehensive physics textbook covering mechanics, thermodynamics, and electromagnetism with practical applications.', '/uploads/books/physics_serway.pdf', '/uploads/covers/physics_cover.jpg', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Test Book for Development', 'Test Author', 'Test Publisher', 2024, '978-0000000000', 'Computer Science', 'English', 100, 'A test book for development and testing purposes. This book is used to verify the system functionality.', '/uploads/books/test_book.pdf', '/uploads/covers/test_book_cover.jpg', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Insert Sample Papers (updated to match actual files)
INSERT INTO papers (title, author, advisor, university, department, year, issn, journal, volume, issue, pages, doi, abstract, keywords, file_url, cover_image_url, created_by, created_at, updated_at) VALUES
('Database Query Optimization Techniques', 'Sarah Johnson', 'Dr. Emily Davis', 'Universitas Dumai', 'Teknik Informatika', 2023, '2345-6789', 'International Journal of Database Management', 12, 3, '78-92', '10.2345/ijdm.2023.12.3.78', 'Research on advanced techniques for optimizing database queries in large-scale applications. This paper explores various optimization strategies and their impact on performance.', 'database, optimization, query performance, SQL, indexing', '/uploads/papers/db_optimization.pdf', '/uploads/covers/db_optimization_cover.jpg', 2, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Economic Growth Analysis in Developing Countries', 'Michael Chen', 'Dr. Lisa Rodriguez', 'Universitas Dumai', 'Manajemen', 2023, '3456-7890', 'Journal of Economic Development', 15, 2, '45-60', '10.3456/jed.2023.15.2.45', 'Comprehensive analysis of economic growth patterns in developing countries, focusing on factors that contribute to sustainable development.', 'economics, development, growth, sustainability, policy', '/uploads/papers/economic_growth_analysis.pdf', '/uploads/covers/economic_growth_cover.jpg', 2, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Renewable Energy Integration in Smart Grid Systems', 'David Wilson', 'Dr. Sarah Thompson', 'Universitas Dumai', 'Teknik Informatika', 2023, '4567-8901', 'Journal of Energy Systems', 8, 4, '112-128', '10.4567/jes.2023.8.4.112', 'Study on integrating renewable energy sources into smart grid systems for improved efficiency and sustainability.', 'renewable energy, smart grid, sustainability, energy systems, technology', '/uploads/papers/renewable_energy_grid.pdf', '/uploads/covers/renewable_energy_cover.jpg', 2, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('Test Paper for Development', 'Test Researcher', 'Dr. Test Advisor', 'Universitas Dumai', 'Sistem Informasi', 2024, '0000-0000', 'Test Journal', 1, 1, '1-10', '10.0000/tj.2024.1.1.1', 'A test paper for development and testing purposes. This paper is used to verify the system functionality.', 'test, development, research, validation', '/uploads/papers/test_paper.pdf', '/uploads/covers/test_paper_cover.jpg', 2, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Insert Book Authors relationships
INSERT INTO book_authors (book_id, user_id, author_name, created_at, updated_at) VALUES
(1, 1, 'Robert C. Martin', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
(2, 1, 'James Stewart', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
(3, 1, 'Abraham Silberschatz', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
(4, 1, 'Raymond A. Serway', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
(5, 1, 'Test Author', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Insert Paper Authors relationships
INSERT INTO paper_authors (paper_id, user_id, author_name, created_at, updated_at) VALUES
(1, 2, 'Sarah Johnson', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
(2, 2, 'Michael Chen', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
(3, 2, 'David Wilson', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
(4, 2, 'Test Researcher', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Insert Book Categories relationships
INSERT INTO book_categories (book_id, category_id) VALUES
(1, 1),  -- Clean Code -> Computer Science
(2, 2),  -- Calculus -> Mathematics
(3, 1),  -- Database Concepts -> Computer Science
(4, 3),  -- Physics -> Physics
(5, 1);  -- Test Book -> Computer Science

-- Insert Paper Categories relationships
INSERT INTO paper_categories (paper_id, category_id) VALUES
(1, 1),  -- Database Optimization -> Computer Science
(2, 7),  -- Economic Growth -> Economics
(3, 8),  -- Renewable Energy -> Environmental Science
(4, 1);  -- Test Paper -> Computer Science

-- Insert User-Book relationships (favorites/bookmarks)
INSERT INTO user_books (user_id, book_id, created_at) VALUES
(2, 1, CURRENT_TIMESTAMP(3)),
(2, 3, CURRENT_TIMESTAMP(3)),
(3, 1, CURRENT_TIMESTAMP(3)),
(3, 2, CURRENT_TIMESTAMP(3)),
(4, 4, CURRENT_TIMESTAMP(3)),
(2, 5, CURRENT_TIMESTAMP(3));

-- Insert User-Paper relationships
INSERT INTO user_papers (user_id, paper_id, created_at) VALUES
(2, 1, CURRENT_TIMESTAMP(3)),
(3, 1, CURRENT_TIMESTAMP(3)),
(4, 2, CURRENT_TIMESTAMP(3)),
(3, 3, CURRENT_TIMESTAMP(3)),
(2, 4, CURRENT_TIMESTAMP(3));

-- Insert Activity Logs
INSERT INTO activity_logs (user_id, action, item_id, item_type, ip_address, user_agent, created_at) VALUES
(2, 'view', 1, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 1 HOUR)),
(2, 'download', 1, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 1 DAY)),
(2, 'view', 1, 'paper', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 HOUR)),
(3, 'view', 2, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 3 HOUR)),
(3, 'view', 1, 'paper', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 1 HOUR)),
(4, 'view', 4, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 HOUR)),
(4, 'download', 2, 'paper', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 HOUR)),
(2, 'view', 3, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 6 HOUR)),
(3, 'view', 3, 'paper', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE));

-- Insert Download Records
INSERT INTO downloads (user_id, item_id, item_type, ip_address, user_agent, downloaded_at) VALUES
(2, 1, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 1 DAY)),
(2, 1, 'paper', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 3 HOUR)),
(3, 2, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 HOUR)),
(4, 2, 'paper', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 HOUR)),
(2, 3, 'book', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 4 HOUR));

-- Insert File Uploads (updated to match actual files)
INSERT INTO file_uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by, related_id, related_type, created_at) VALUES
('clean_code.pdf', 'Clean Code.pdf', '/uploads/books/clean_code.pdf', 8388608, 'application/pdf', 1, 1, 'book', CURRENT_TIMESTAMP(3)),
('calculus_stewart.pdf', 'Calculus Early Transcendentals.pdf', '/uploads/books/calculus_stewart.pdf', 15728640, 'application/pdf', 1, 2, 'book', CURRENT_TIMESTAMP(3)),
('database_concepts.pdf', 'Database System Concepts.pdf', '/uploads/books/database_concepts.pdf', 12582912, 'application/pdf', 1, 3, 'book', CURRENT_TIMESTAMP(3)),
('physics_serway.pdf', 'Physics for Scientists and Engineers.pdf', '/uploads/books/physics_serway.pdf', 20971520, 'application/pdf', 1, 4, 'book', CURRENT_TIMESTAMP(3)),
('test_book.pdf', 'Test Book.pdf', '/uploads/books/test_book.pdf', 1048576, 'application/pdf', 1, 5, 'book', CURRENT_TIMESTAMP(3)),
('db_optimization.pdf', 'Database Query Optimization.pdf', '/uploads/papers/db_optimization.pdf', 7340032, 'application/pdf', 2, 1, 'paper', CURRENT_TIMESTAMP(3)),
('economic_growth_analysis.pdf', 'Economic Growth Analysis.pdf', '/uploads/papers/economic_growth_analysis.pdf', 5242880, 'application/pdf', 2, 2, 'paper', CURRENT_TIMESTAMP(3)),
('renewable_energy_grid.pdf', 'Renewable Energy Grid.pdf', '/uploads/papers/renewable_energy_grid.pdf', 6291456, 'application/pdf', 2, 3, 'paper', CURRENT_TIMESTAMP(3)),
('test_paper.pdf', 'Test Paper.pdf', '/uploads/papers/test_paper.pdf', 2097152, 'application/pdf', 2, 4, 'paper', CURRENT_TIMESTAMP(3));

COMMIT; 