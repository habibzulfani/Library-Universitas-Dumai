-- Simple Sample Data for E-Repository System
USE test_db2;

-- Insert Categories
INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Computer Science', 'Books and papers related to computer science and programming', NOW(), NOW()),
('Mathematics', 'Mathematical concepts, theories, and applications', NOW(), NOW()),
('Physics', 'Physics research and academic materials', NOW(), NOW()),
('Engineering', 'Engineering disciplines and technical studies', NOW(), NOW());

-- Insert Demo Users (password: password123)
INSERT INTO users (name, email, password, role, nim, jurusan, address, created_at, updated_at) VALUES
('Demo Admin', 'admin@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ADM001', 'Computer Science', 'Universitas Dumai Campus', NOW(), NOW()),
('Demo User', 'user@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'USR001', 'Information Technology', 'Dumai, Riau', NOW(), NOW()),
('John Smith', 'john.smith@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '12345001', 'Computer Science', 'Pekanbaru, Riau', NOW(), NOW()),
('Sarah Johnson', 'sarah.johnson@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '12345002', 'Mathematics', 'Dumai, Riau', NOW(), NOW());

-- Insert Sample Books
INSERT INTO books (title, author, publisher, published_year, isbn, subject, language, pages, summary, file_url, created_at, updated_at) VALUES
('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 'MIT Press', 2009, '978-0262033848', 'Computer Science', 'English', 1312, 'A comprehensive textbook covering algorithmic techniques and data structures used in computer science.', '/uploads/books/intro_algorithms.pdf', NOW(), NOW()),
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', 2008, '978-0132350884', 'Computer Science', 'English', 464, 'Best practices for writing clean, maintainable, and efficient code.', '/uploads/books/clean_code.pdf', NOW(), NOW()),
('Calculus: Early Transcendentals', 'James Stewart', 'Cengage Learning', 2015, '978-1285741550', 'Mathematics', 'English', 1344, 'Comprehensive calculus textbook with practical applications.', '/uploads/books/calculus_stewart.pdf', NOW(), NOW()),
('Physics for Scientists and Engineers', 'Raymond A. Serway, John W. Jewett', 'Cengage Learning', 2018, '978-1337553278', 'Physics', 'English', 1280, 'Comprehensive physics textbook covering mechanics, thermodynamics, and electromagnetism.', '/uploads/books/physics_serway.pdf', NOW(), NOW()),
('Database System Concepts', 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', 'McGraw-Hill', 2019, '978-0078022159', 'Computer Science', 'English', 1376, 'Fundamental concepts of database systems and management.', '/uploads/books/database_concepts.pdf', NOW(), NOW());

-- Insert Sample Papers
INSERT INTO papers (title, author, advisor, university, department, year, abstract, keywords, file_url, created_at, updated_at) VALUES
('Machine Learning Applications in Academic Performance Prediction', 'John Smith', 'Dr. Ahmad Rahman', 'Universitas Dumai', 'Computer Science', 2023, 'This research explores the application of machine learning algorithms in predicting student academic performance. The study compares various ML models including decision trees, neural networks, and support vector machines to identify students at risk of academic failure.', 'machine learning, academic performance, prediction, neural networks, education technology', '/uploads/papers/ml_academic_prediction.pdf', NOW(), NOW()),
('Optimization of Database Query Performance in Large-Scale Systems', 'Sarah Johnson', 'Dr. Ahmad Rahman', 'Universitas Dumai', 'Computer Science', 2023, 'An investigation into query optimization techniques for large-scale database systems. This paper presents novel indexing strategies and query execution plans that significantly improve performance in big data environments.', 'database optimization, query performance, big data, indexing, SQL optimization', '/uploads/papers/db_optimization.pdf', NOW(), NOW()),
('Statistical Analysis of Economic Growth Factors in Developing Countries', 'Maria Rodriguez', 'Dr. David Kim', 'Universitas Dumai', 'Mathematics', 2023, 'A comprehensive statistical analysis examining the correlation between various economic indicators and growth rates in developing nations. The study uses advanced statistical methods to identify key growth factors.', 'statistics, economic growth, developing countries, correlation analysis, econometrics', '/uploads/papers/economic_growth_analysis.pdf', NOW(), NOW()),
('Renewable Energy Integration in Smart Grid Systems', 'Alex Thompson', 'Dr. Jennifer Lee', 'Universitas Dumai', 'Engineering', 2022, 'This research focuses on the challenges and solutions for integrating renewable energy sources into existing smart grid infrastructure. The study proposes optimization algorithms for energy distribution.', 'renewable energy, smart grid, optimization, energy distribution, sustainability', '/uploads/papers/renewable_energy_grid.pdf', NOW(), NOW());

-- Insert Book Categories relationships
INSERT INTO book_categories (book_id, category_id) VALUES
(1, 1), (2, 1), (5, 1),  -- Computer Science books
(3, 2),  -- Mathematics books  
(4, 3);  -- Physics books

-- Insert Paper Categories relationships
INSERT INTO paper_categories (paper_id, category_id) VALUES
(1, 1), (2, 1),  -- Computer Science papers
(3, 2),  -- Mathematics papers
(4, 4);  -- Engineering papers

COMMIT; 