# E-Repository Universitas Dumai

Aplikasi E-Repositori untuk Universitas Dumai yang memungkinkan mahasiswa dan dosen untuk mengunggah, mengelola, dan mengakses karya ilmiah dan buku-buku akademik.

---

## 🚀 VPS Deployment & Management (Production/Cloud)

For production or cloud deployment (e.g., Hostinger VPS):

- Use the automated script: `deploy-root.sh`
- **Full step-by-step guide:** See [`VPS_MANAGEMENT_GUIDE.md`](./VPS_MANAGEMENT_GUIDE.md)
- **Git workflow guide:** See [`GIT_COMMITS_GUIDE.md`](./GIT_COMMITS_GUIDE.md)

### **Quick Workflow**
1. Update your code locally
2. Commit & push to GitHub
3. SSH to your VPS and `cd /opt/erepository`
4. `git pull` to get the latest code
5. Run `./deploy-root.sh` to redeploy (this will reseed the database!)

**To update code without reseeding the database:**
```bash
git pull
docker compose up -d --build
```

> ⚠️ By default, `deploy-root.sh` will reseed (overwrite) your database every time you run it. For production, use the update-without-reseed method above if you want to preserve data.

---

## Fitur Utama

- Manajemen pengguna (mahasiswa, dosen, admin)
- Upload dan manajemen karya ilmiah
- Upload dan manajemen buku
- Pencarian dan filter konten
- Sistem verifikasi email
- Sistem persetujuan dosen (admin approval)
- Statistik dan pelacakan aktivitas
- Manajemen kategori dan departemen
- **Form tambah/edit buku & karya ilmiah ter-unifikasi**
- **Manajemen author yang konsisten dan mudah**

## 🚀 Recent Major Changes (2024)

### 1. Frontend: Admin Page Redesign & UX Improvements
- Complete redesign of the admin page with a modern UI/UX.
- Card-based layout, color-coded tabs, and improved dashboard with real-time stats.
- Advanced universal search and real-time filtering across all content types.
- Redesigned CRUD interfaces for books, papers, and users with visual cards, keyword tags, and avatar system.
- Responsive modal forms, mobile-first design, sticky headers, and improved validation.
- Enhanced error handling with toast notifications and contextual feedback.
- Accessibility improvements: keyboard navigation, focus management, and screen reader support.
- Performance optimizations: client-side filtering, lazy loading, and minimal re-renders.
- Modular, maintainable, and testable frontend codebase.

### 2. Frontend: Unified Book & Paper Forms
- All book and paper forms now use unified custom hooks (`useBookForm`, `usePaperForm`) for state, validation, and author management.
- Consistent validation, error handling, and file upload logic across all forms.
- Centralized logic for adding, editing, and removing authors.
- Forms are now identical in all contexts (modal, dedicated page, dashboard, admin).
- Improved maintainability and reduced code duplication.

### 3. Backend: Comprehensive API Test Suite
- Full unit and integration test coverage for all major API endpoints using MySQL (production-compatible).
- Authentication, books, papers, and middleware handlers all have passing tests.
- Test isolation: each suite gets a fresh database, with proper cleanup.
- Password hashing, JWT validation, and role-based access control are fully tested.
- Documented test setup and troubleshooting guides.
- Known issue: race conditions when running all tests together; workaround is to run suites individually.

### 4. Other Technical/DevOps Improvements
- CI/CD: Automated test suite runs on push and pull request via GitHub Actions.
- Docker Compose setup for backend, frontend, MySQL, and PDF service.
- Cleanup scripts for database migrations.
- Documentation for test setup, completion, and unified form implementation.

## Fitur Author & Form Unifikasi

Form tambah/edit buku dan karya ilmiah kini menggunakan komponen dan hook yang sama (unified form), sehingga:
- Pengelolaan author konsisten di seluruh aplikasi
- Validasi, upload file, dan preview cover seragam
- UX author: tambah, hapus, edit, urutkan author dengan mudah
- Form add/edit di semua halaman (modal, dedicated page, dashboard, admin) kini identik

## Teknologi yang Digunakan

### Backend
- Go (Golang)
- MySQL
- JWT untuk autentikasi
- GORM untuk ORM
- Gin untuk web framework

### Frontend
- Next.js 14
- TypeScript
- Chakra UI
- **Tailwind CSS** (untuk unified forms & komponen baru)
- React Query
- Axios

## Persyaratan Sistem

- Go 1.21 atau lebih baru
- Node.js 18 atau lebih baru
- MySQL 8.0 atau lebih baru
- Git

## Instalasi

1. Clone repository:
```bash
git clone https://github.com/yourusername/e-repository.git
cd e-repository
```

2. Setup database:
```bash
# Masuk ke MySQL
mysql -u root -p

# Di dalam MySQL, jalankan:
source database_schema.sql
# (Opsional) Untuk data contoh/demo:
source sample_data.sql
```

3. Setup backend:
```bash
cd backend
go mod download
go run main.go
```

4. Setup frontend:
```bash
cd frontend
npm install
npm run dev
```

### (Opsional) Jalankan dengan Docker
Jika ingin menjalankan dengan Docker Compose:
```bash
docker-compose up --build
```

**Note**: Docker setup menggunakan port 3307 untuk MySQL (untuk menghindari konflik dengan MySQL lokal). Jika menggunakan Docker, gunakan konfigurasi berikut:

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=erepo_user
DB_PASSWORD=erepo_pass
DB_NAME=e_repository_db
```

## Konfigurasi

### Backend
Buat file `.env` di folder `backend`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=e_repository_db
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Frontend
Buat file `.env.local` di folder `frontend`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Akses Aplikasi

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1

## Default Admin Credentials

Setelah setup database, Anda dapat login sebagai admin dengan kredensial berikut:
- Email: admin@example.com
- Password: admin123

**PENTING**: Pastikan untuk mengganti password admin segera setelah login pertama kali.

## Struktur Database

Database menggunakan MySQL dengan skema yang mencakup:
- Manajemen pengguna (users)
- Karya ilmiah (papers)
- Buku (books)
- Departemen (departments)
- Kategori (categories)
- Pelacakan aktivitas (activity_logs)
- Statistik (counters)
- Dan tabel pendukung lainnya

## API Documentation

API documentation tersedia di `/api/v1/docs` setelah menjalankan backend server.

## API Endpoints

### Public Endpoints
- `GET    /api/v1/health` — Health check
- `POST   /api/v1/auth/register` — User registration
- `POST   /api/v1/auth/login` — User login
- `POST   /api/v1/auth/forgot-password` — Request password reset
- `POST   /api/v1/auth/reset-password` — Reset password
- `GET    /api/v1/auth/verify-email` — Verify email
- `GET    /api/v1/books` — List all books
- `GET    /api/v1/books/:id` — Get book details
- `GET    /api/v1/papers` — List all papers
- `GET    /api/v1/papers/:id` — Get paper details
- `GET    /api/v1/departments` — List departments
- `GET    /api/v1/authors/search` — Search authors
- `GET    /api/v1/authors/:name/works` — Get works by author
- `GET    /api/v1/users/count` — Get user count
- `GET    /api/v1/downloads/count` — Get download count
- `GET    /api/v1/users-per-month` — User registrations per month
- `GET    /api/v1/downloads-per-month` — Downloads per month
- `GET    /api/v1/users/:id` — Get public user profile
- `GET    /api/v1/citations/count` — Get citation count
- `GET    /api/v1/citations-per-month` — Citations per month
- `GET    /api/v1/users/:id/stats` — Get user stats
- `GET    /api/v1/users/:id/citations-per-month` — User citations per month
- `GET    /api/v1/users/:id/downloads-per-month` — User downloads per month
- `GET    /api/v1/books/:id/stats` — Book stats
- `GET    /api/v1/papers/:id/stats` — Paper stats
- `GET    /api/v1/books-per-month` — Books added per month
- `GET    /api/v1/papers-per-month` — Papers added per month
- `GET    /api/v1/books/:id/download` — Download book file
- `POST   /api/v1/books/:id/cite` — Cite a book
- `GET    /api/v1/papers/:id/download` — Download paper file
- `POST   /api/v1/papers/:id/cite` — Cite a paper
- `POST   /api/v1/metadata/extract` — Extract metadata from file
- `POST   /api/v1/metadata/extract-from-url` — Extract metadata from URL

### Protected Endpoints (User, require JWT)
- `GET    /api/v1/profile` — Get own profile
- `PUT    /api/v1/profile` — Update own profile
- `PUT    /api/v1/profile/password` — Change password

#### User Book & Paper Management
- `POST   /api/v1/user/books` — Add a book (user)
- `GET    /api/v1/user/books` — List user's books
- `PUT    /api/v1/user/books/:id` — Update user's book
- `DELETE /api/v1/user/books/:id` — Delete user's book
- `GET    /api/v1/user/books/:id/download` — Download user's book
- `POST   /api/v1/user/books/:id/cite` — Cite user's book
- `POST   /api/v1/user/papers` — Add a paper (user)
- `GET    /api/v1/user/papers` — List user's papers
- `PUT    /api/v1/user/papers/:id` — Update user's paper
- `DELETE /api/v1/user/papers/:id` — Delete user's paper
- `GET    /api/v1/user/papers/:id/download` — Download user's paper
- `POST   /api/v1/user/papers/:id/cite` — Cite user's paper
- `GET    /api/v1/user/citations-per-month` — User's citations per month
- `GET    /api/v1/user/stats` — User's stats
- `GET    /api/v1/user/downloads-per-month` — User's downloads per month

### Admin Endpoints (require admin JWT)
- `GET    /api/v1/admin/users` — List all users
- `GET    /api/v1/admin/users/:id` — Get user by ID
- `PUT    /api/v1/admin/users/:id` — Update user by ID
- `DELETE /api/v1/admin/users/:id` — Delete user by ID
- `POST   /api/v1/admin/users/bulk-delete` — Bulk delete users
- `GET    /api/v1/admin/lecturers` — List pending lecturers
- `POST   /api/v1/admin/lecturers/:id/approve` — Approve lecturer
- `GET    /api/v1/admin/books` — List all books (admin)
- `POST   /api/v1/admin/books` — Add a book (admin)
- `PUT    /api/v1/admin/books/:id` — Update book (admin)
- `DELETE /api/v1/admin/books/:id` — Delete book (admin)
- `GET    /api/v1/admin/papers` — List all papers (admin)
- `POST   /api/v1/admin/papers` — Add a paper (admin)
- `PUT    /api/v1/admin/papers/:id` — Update paper (admin)
- `DELETE /api/v1/admin/papers/:id` — Delete paper (admin)

## Alur Approval Dosen (Lecturer Approval)
- Dosen yang mendaftar akan masuk ke daftar "pending approval" admin
- Admin dapat menyetujui dosen melalui tab "Lecturer Approval"
- Setelah disetujui, dosen hilang dari daftar dan badge notifikasi berkurang
- Data tidak akan muncul lagi setelah refresh/tab switch

## Testing & Pengujian Manual

- **Tambah/Edit Buku & Karya Ilmiah**: Coba tambah dan edit dari berbagai halaman (dashboard, admin, dedicated page)
- **Manajemen Author**: Tambah, hapus, edit, urutkan author di form
- **Upload File**: Pastikan upload file (PDF) dan cover image berjalan baik
- **Approval Dosen**: Daftarkan user dosen, approve dari admin, cek badge & refresh
- **Pencarian & Filter**: Gunakan fitur search dan filter di listing
- **Notifikasi & Validasi**: Pastikan error/success toast muncul sesuai aksi

## Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detailnya.

## Kontak

Habib Zulfani - [@habibzulfani](https://github.com/habibzulfani)

Link Proyek: [https://github.com/habibzulfani/e-repository](https://github.com/habibzulfani/e-repository)

## Footer & Social Media Links

Aplikasi ini dilengkapi dengan footer yang berisi informasi kontak dan media sosial. Berikut adalah placeholder links yang perlu diupdate:

### Social Media Links (Update di `frontend/src/components/layout/Footer.tsx`)
- Facebook: `#` → [https://facebook.com/uniduma](https://facebook.com/uniduma)
- Twitter: `#` → [https://twitter.com/uniduma](https://twitter.com/uniduma)
- Instagram: `#` → [https://instagram.com/uniduma](https://instagram.com/uniduma)
- LinkedIn: `#` → [https://linkedin.com/company/uniduma](https://linkedin.com/company/uniduma)
- YouTube: `#` → [https://youtube.com/@uniduma](https://youtube.com/@uniduma)

### Contact Information (Update di `frontend/src/components/layout/Footer.tsx`)
- Email: `info@uniduma.ac.id` → [mailto:info@uniduma.ac.id](mailto:info@uniduma.ac.id)
- Phone: `+62 765 123456` → [tel:+62765123456](tel:+62765123456)
- Address: `Jl. Lintas Timur, Dumai, Riau` → [Google Maps Link](https://maps.google.com/?q=Universitas+Dumai)

### Footer Links (Update di `frontend/src/components/layout/Footer.tsx`)
- Kebijakan Privasi: `#` → `/privacy-policy`
- Syarat & Ketentuan: `#` → `/terms-of-service`
- Peta Situs: `#` → `/sitemap`

### Cara Update Footer Links
1. Buka file `frontend/src/components/layout/Footer.tsx`
2. Cari array `socialLinks` dan `contactInfo`
3. Update `href` property dengan link yang sesuai
4. Untuk footer links, update href di bagian bottom section 