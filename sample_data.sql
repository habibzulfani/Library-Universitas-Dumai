-- Sample Data for E-Repository System
-- This file contains demo data for testing and demonstration purposes

USE test_db2;

-- Insert Categories
INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Computer Science', 'Books and papers related to computer science and programming', NOW(), NOW()),
('Mathematics', 'Mathematical concepts, theories, and applications', NOW(), NOW()),
('Physics', 'Physics research and academic materials', NOW(), NOW()),
('Engineering', 'Engineering disciplines and technical studies', NOW(), NOW()),
('Literature', 'Literary works and analysis', NOW(), NOW()),
('Business', 'Business administration and management studies', NOW(), NOW()),
('Psychology', 'Psychological research and behavioral studies', NOW(), NOW()),
('Biology', 'Biological sciences and life sciences', NOW(), NOW());

-- Insert Demo Users (passwords are hashed for 'password123')
INSERT INTO users (name, email, password, role, nim, jurusan, address, created_at, updated_at) VALUES
('Demo Admin', 'admin@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ADM001', 'Computer Science', 'Universitas Dumai Campus', NOW(), NOW()),
('Demo User', 'user@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'USR001', 'Information Technology', 'Dumai, Riau', NOW(), NOW()),
('John Smith', 'john.smith@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '12345001', 'Computer Science', 'Pekanbaru, Riau', NOW(), NOW()),
('Sarah Johnson', 'sarah.johnson@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '12345002', 'Mathematics', 'Dumai, Riau', NOW(), NOW()),
('Dr. Ahmad Rahman', 'ahmad.rahman@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', NULL, 'Computer Science', 'Universitas Dumai', NOW(), NOW());

-- Insert Sample Books (matching actual table structure)
INSERT INTO books (title, author, publisher, published_year, isbn, subject, language, pages, summary, file_url, created_at, updated_at) VALUES
('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 'MIT Press', 2009, '978-0262033848', 'Computer Science', 'English', 1312, 'A comprehensive textbook covering algorithmic techniques and data structures used in computer science.', '/uploads/books/intro_algorithms.pdf', NOW(), NOW()),
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', 2008, '978-0132350884', 'Computer Science', 'English', 464, 'Best practices for writing clean, maintainable, and efficient code.', '/uploads/books/clean_code.pdf', NOW(), NOW()),
('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Addison-Wesley', 1994, '978-0201633610', 'Computer Science', 'English', 395, 'Classic book on software design patterns for object-oriented programming.', '/uploads/books/design_patterns.pdf', NOW(), NOW()),
('Calculus: Early Transcendentals', 'James Stewart', 'Cengage Learning', 2015, '978-1285741550', 'Mathematics', 'English', 1344, 'Comprehensive calculus textbook with practical applications.', '/uploads/books/calculus_stewart.pdf', NOW(), NOW()),
('Linear Algebra and Its Applications', 'David C. Lay', 'Pearson', 2015, '978-0321982384', 'Mathematics', 'English', 528, 'Introduction to linear algebra with real-world applications.', '/uploads/books/linear_algebra_lay.pdf', NOW(), NOW()),
('Physics for Scientists and Engineers', 'Raymond A. Serway, John W. Jewett', 'Cengage Learning', 2018, '978-1337553278', 'Physics', 'English', 1280, 'Comprehensive physics textbook covering mechanics, thermodynamics, and electromagnetism.', '/uploads/books/physics_serway.pdf', NOW(), NOW()),
('Database System Concepts', 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', 'McGraw-Hill', 2019, '978-0078022159', 'Computer Science', 'English', 1376, 'Fundamental concepts of database systems and management.', '/uploads/books/database_concepts.pdf', NOW(), NOW()),
('Software Engineering: A Practitioner''s Approach', 'Roger S. Pressman', 'McGraw-Hill', 2014, '978-0078022128', 'Computer Science', 'English', 976, 'Comprehensive guide to software engineering principles and practices.', '/uploads/books/software_engineering.pdf', NOW(), NOW());

-- Insert Sample Papers (matching actual table structure)
INSERT INTO papers (title, author, advisor, university, department, year, issn, abstract, keywords, file_url, created_at, updated_at) VALUES
('Machine Learning Applications in Academic Performance Prediction', 'John Smith', 'Dr. Ahmad Rahman', 'Universitas Dumai', 'Computer Science', 2023, NULL, 'This research explores the application of machine learning algorithms in predicting student academic performance. The study compares various ML models including decision trees, neural networks, and support vector machines to identify students at risk of academic failure.', 'machine learning, academic performance, prediction, neural networks, education technology', '/uploads/papers/ml_academic_prediction.pdf', NOW(), NOW()),
('Optimization of Database Query Performance in Large-Scale Systems', 'Sarah Johnson', 'Dr. Ahmad Rahman', 'Universitas Dumai', 'Computer Science', 2023, NULL, 'An investigation into query optimization techniques for large-scale database systems. This paper presents novel indexing strategies and query execution plans that significantly improve performance in big data environments.', 'database optimization, query performance, big data, indexing, SQL optimization', '/uploads/papers/db_optimization.pdf', NOW(), NOW()),
('Blockchain Technology Implementation in Supply Chain Management', 'Michael Chen', 'Dr. Lisa Wong', 'Universitas Dumai', 'Computer Science', 2022, NULL, 'This study examines the potential of blockchain technology in revolutionizing supply chain management. The research proposes a framework for implementing blockchain solutions to enhance transparency and traceability.', 'blockchain, supply chain, transparency, traceability, distributed systems', '/uploads/papers/blockchain_supply_chain.pdf', NOW(), NOW()),
('Statistical Analysis of Economic Growth Factors in Developing Countries', 'Maria Rodriguez', 'Dr. David Kim', 'Universitas Dumai', 'Mathematics', 2023, NULL, 'A comprehensive statistical analysis examining the correlation between various economic indicators and growth rates in developing nations. The study uses advanced statistical methods to identify key growth factors.', 'statistics, economic growth, developing countries, correlation analysis, econometrics', '/uploads/papers/economic_growth_analysis.pdf', NOW(), NOW()),
('Renewable Energy Integration in Smart Grid Systems', 'Alex Thompson', 'Dr. Jennifer Lee', 'Universitas Dumai', 'Engineering', 2022, NULL, 'This research focuses on the challenges and solutions for integrating renewable energy sources into existing smart grid infrastructure. The study proposes optimization algorithms for energy distribution.', 'renewable energy, smart grid, optimization, energy distribution, sustainability', '/uploads/papers/renewable_energy_grid.pdf', NOW(), NOW()),
('Natural Language Processing for Indonesian Text Classification', 'Rina Sari', 'Dr. Ahmad Rahman', 'Universitas Dumai', 'Computer Science', 2023, NULL, 'Development of NLP techniques specifically designed for Indonesian language text classification. The research addresses unique challenges in processing Indonesian text and proposes novel preprocessing methods.', 'natural language processing, Indonesian language, text classification, machine learning, computational linguistics', '/uploads/papers/nlp_indonesian.pdf', NOW(), NOW()),
('Quantum Computing Applications in Cryptography', 'Robert Wilson', 'Dr. Susan Brown', 'Universitas Dumai', 'Computer Science', 2022, NULL, 'An exploration of quantum computing potential in cryptographic applications. The study examines both the opportunities and threats that quantum computing poses to current encryption methods.', 'quantum computing, cryptography, security, encryption, quantum algorithms', '/uploads/papers/quantum_crypto.pdf', NOW(), NOW()),
('Mathematical Modeling of Population Dynamics in Urban Areas', 'Lisa Garcia', 'Dr. Mark Johnson', 'Universitas Dumai', 'Mathematics', 2023, NULL, 'Mathematical models for understanding population growth and migration patterns in urban environments. The research develops predictive models using differential equations and statistical analysis.', 'mathematical modeling, population dynamics, urban planning, differential equations, demographics', '/uploads/papers/population_dynamics.pdf', NOW(), NOW());

-- Insert Book Authors relationships
INSERT INTO book_authors (book_id, author_name) VALUES
(1, 'Thomas H. Cormen'),
(1, 'Charles E. Leiserson'),
(1, 'Ronald L. Rivest'),
(1, 'Clifford Stein'),
(2, 'Robert C. Martin'),
(3, 'Erich Gamma'),
(3, 'Richard Helm'),
(3, 'Ralph Johnson'),
(3, 'John Vlissides'),
(4, 'James Stewart'),
(5, 'David C. Lay'),
(6, 'Raymond A. Serway'),
(6, 'John W. Jewett'),
(7, 'Abraham Silberschatz'),
(7, 'Henry F. Korth'),
(7, 'S. Sudarshan'),
(8, 'Roger S. Pressman');

-- Insert Paper Authors relationships
INSERT INTO paper_authors (paper_id, author_name) VALUES
(1, 'John Smith'),
(2, 'Sarah Johnson'),
(3, 'Michael Chen'),
(4, 'Maria Rodriguez'),
(5, 'Alex Thompson'),
(6, 'Rina Sari'),
(7, 'Robert Wilson'),
(8, 'Lisa Garcia');

-- Insert Book Categories relationships
INSERT INTO book_categories (book_id, category_id) VALUES
(1, 1), (2, 1), (3, 1), (7, 1), (8, 1),  -- Computer Science books
(4, 2), (5, 2),  -- Mathematics books
(6, 3);  -- Physics books

-- Insert Paper Categories relationships
INSERT INTO paper_categories (paper_id, category_id) VALUES
(1, 1), (2, 1), (3, 1), (6, 1), (7, 1),  -- Computer Science papers
(4, 2), (8, 2),  -- Mathematics papers
(5, 4);  -- Engineering papers

-- Insert User-Book relationships (favorites/bookmarks)
INSERT INTO user_books (user_id, book_id, created_at) VALUES
(2, 1, NOW()),
(2, 2, NOW()),
(2, 7, NOW()),
(3, 1, NOW()),
(3, 3, NOW()),
(4, 4, NOW()),
(4, 5, NOW()),
(5, 1, NOW()),
(5, 8, NOW());

-- Insert User-Paper relationships
INSERT INTO user_papers (user_id, paper_id, created_at) VALUES
(2, 1, NOW()),
(2, 6, NOW()),
(3, 1, NOW()),
(4, 4, NOW()),
(4, 8, NOW()),
(5, 2, NOW()),
(5, 7, NOW());

-- Insert Activity Logs
INSERT INTO activity_logs (user_id, action, target_type, target_id, created_at) VALUES
(2, 'view', 'book', 1, NOW() - INTERVAL 1 DAY),
(2, 'download', 'book', 1, NOW() - INTERVAL 1 DAY),
(2, 'view', 'paper', 1, NOW() - INTERVAL 2 HOUR),
(3, 'view', 'book', 3, NOW() - INTERVAL 3 HOUR),
(3, 'view', 'paper', 1, NOW() - INTERVAL 1 HOUR),
(4, 'view', 'book', 4, NOW() - INTERVAL 5 HOUR),
(4, 'download', 'paper', 4, NOW() - INTERVAL 2 HOUR),
(5, 'view', 'book', 8, NOW() - INTERVAL 6 HOUR),
(5, 'view', 'paper', 2, NOW() - INTERVAL 30 MINUTE);

-- Insert Download Records
INSERT INTO downloads (user_id, target_type, target_id, created_at) VALUES
(2, 'book', 1, NOW() - INTERVAL 1 DAY),
(2, 'paper', 1, NOW() - INTERVAL 3 HOUR),
(3, 'book', 3, NOW() - INTERVAL 5 HOUR),
(4, 'paper', 4, NOW() - INTERVAL 2 HOUR),
(5, 'book', 8, NOW() - INTERVAL 4 HOUR);

-- Insert some file upload records
INSERT INTO file_uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by, created_at) VALUES
('intro_algorithms.pdf', 'Introduction to Algorithms.pdf', '/uploads/books/intro_algorithms.pdf', 15728640, 'application/pdf', 1, NOW()),
('clean_code.pdf', 'Clean Code.pdf', '/uploads/books/clean_code.pdf', 8388608, 'application/pdf', 1, NOW()),
('ml_academic_prediction.pdf', 'Machine Learning Applications in Academic Performance Prediction.pdf', '/uploads/papers/ml_academic_prediction.pdf', 5242880, 'application/pdf', 3, NOW()),
('db_optimization.pdf', 'Database Query Optimization.pdf', '/uploads/papers/db_optimization.pdf', 7340032, 'application/pdf', 4, NOW());

-- Add some recent activity for better demo
INSERT INTO activity_logs (user_id, action, target_type, target_id, created_at) VALUES
(2, 'search', 'book', NULL, NOW() - INTERVAL 10 MINUTE),
(3, 'search', 'paper', NULL, NOW() - INTERVAL 5 MINUTE),
(4, 'login', NULL, NULL, NOW() - INTERVAL 15 MINUTE),
(5, 'view', 'book', 1, NOW() - INTERVAL 2 MINUTE);

COMMIT; 