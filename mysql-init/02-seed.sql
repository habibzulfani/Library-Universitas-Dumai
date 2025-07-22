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
    '$2a$12$VXBXn4uVVZ/zNmW4OE26YuJ8wDru40dgD.4J6YbP3/eubtasPhmhi', -- bcrypt hash of 'admin123'
    'System Administrator',
    'admin',
    'lecturer',
    'ADMIN001',
    'Fakultas Ilmu Komputer',
    2,
    TRUE,
    TRUE
); 