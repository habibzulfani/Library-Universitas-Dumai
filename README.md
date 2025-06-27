# E-Repository Universitas Dumai

Aplikasi E-Repositori untuk Universitas Dumai yang memungkinkan mahasiswa dan dosen untuk mengunggah, mengelola, dan mengakses karya ilmiah dan buku-buku akademik.

## Fitur Utama

- Manajemen pengguna (mahasiswa, dosen, admin)
- Upload dan manajemen karya ilmiah
- Upload dan manajemen buku
- Pencarian dan filter konten
- Sistem verifikasi email
- Sistem persetujuan dosen
- Statistik dan pelacakan aktivitas
- Manajemen kategori dan departemen

## Fitur Author pada Form Edit Buku & Karya Ilmiah

Pada form edit buku dan karya ilmiah, pengguna dapat mengelola daftar penulis (author) dengan fitur berikut:

- **Melihat Daftar Author**: Author pertama akan muncul di field input, sisanya sebagai tag/bubble di bawahnya.
- **Menambah Author**: Ketik nama author di field input, klik tombol "Add" atau tekan Enter untuk menambah ke daftar.
- **Menghapus Author**: Klik ikon "X" pada tag author untuk menghapus author tersebut dari daftar.
- **Mengedit Author**: Klik ikon "Edit" (ikon plus) pada tag author untuk memindahkan nama author ke field input, lalu ubah dan klik "Add" untuk menyimpan perubahan.
- **Mengatur Ulang Author**: Untuk mengganti seluruh daftar author, hapus semua tag dan kosongkan field input, lalu masukkan author baru dan klik "Add".
- **Urutan Author**: Urutan author akan sesuai dengan urutan penambahan (author di field input akan menjadi yang pertama jika tidak diklik "Add").
- **Tidak Perlu Klik Add untuk Author Pertama**: Jika tidak ingin mengubah author pertama, cukup biarkan di field input dan langsung submit form.

Fitur ini berlaku baik untuk form edit buku maupun karya ilmiah (paper).

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