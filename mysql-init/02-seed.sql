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
    email_verified,
    is_approved
) VALUES (
    'admin@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt hash of 'admin123'
    'System Administrator',
    'admin',
    'lecturer',
    'ADMIN001',
    'Fakultas Ilmu Komputer',
    TRUE,
    TRUE
); 