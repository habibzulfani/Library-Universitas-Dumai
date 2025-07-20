import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper function to get full URL for files
const getFullUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  // If it's a static file (starts with /uploads/), just prepend API_BASE_URL
  if (url.startsWith('/uploads/')) {
    return `${API_BASE_URL}${url}`;
  }
  // Otherwise, treat as API endpoint
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `${API_BASE_URL}/api/v1/${cleanUrl}`;
};

export { getFullUrl };

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      hasToken: !!token,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    if (error.response?.status === 401) {
      // Only redirect to login if not on profile endpoint
      if (!error.config.url?.includes('/profile')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  nim_nidn?: string;
  faculty?: 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum';
  department_id?: number;
  department?: { id: number; name: string; faculty: string } | string;
  user_type: 'student' | 'lecturer';
  role: 'user' | 'admin';
  status: 'pending' | 'active' | 'inactive';
  email_verified: boolean;
  is_approved: boolean;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
  address?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  authors: Array<{
    id: number;
    author_name: string;
  }>;
  publisher?: string;
  published_year?: number;
  isbn?: string;
  subject?: string;
  language?: string;
  pages?: string;
  summary?: string;
  file_url?: string;
  cover_image_url?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

export interface Paper {
  id: number;
  title: string;
  author: string;
  authors: Array<{
    id: number;
    author_name: string;
  }>;
  abstract?: string;
  keywords?: string;
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: string;
  year?: number;
  doi?: string;
  issn?: string;
  language?: string;
  file_url?: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  advisor?: string;
  university?: string;
  department?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  type: 'book' | 'paper' | 'both';
  created_at: string;
  updated_at: string;
}

export interface SearchParams {
  query?: string;
  type?: 'book' | 'paper' | 'both';
  category?: string;
  year?: number;
  isbn?: string;
  issn?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: T[];
}

// Auth types
export interface LoginData {
  email?: string;
  nim_nidn?: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  user_type: 'student' | 'lecturer';
  nim_nidn: string;
  faculty: 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum';
  department_id: number;
  address?: string;
  profile_picture?: File;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  new_password: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  nim_nidn?: string;
  faculty?: 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum';
  department_id?: number;
  address?: string;
  profile_picture?: File;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Department {
  id: number;
  name: string;
  faculty: string;
}

export interface AdminRegisterData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  user_type: 'student' | 'lecturer';
  nim_nidn: string;
  faculty: 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum';
  department_id: number;
  address?: string;
}

export interface Author {
  name: string;
  bookCount: number;
  paperCount: number;
}

export interface AuthorDetail {
  name: string;
  books: Book[];
  papers: Paper[];
}

// API functions
export const authAPI = {
  // Public endpoints
  register: (data: FormData) => api.post<AuthResponse>('/auth/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  login: (data: LoginData) => api.post<AuthResponse>('/auth/login', data),
  forgotPassword: (data: ForgotPasswordData) =>
    api.post<{ message: string }>('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordData) =>
    api.post<{ message: string }>('/auth/reset-password', data),

  // Protected endpoints (requires authentication)
  getProfile: () => api.get<User>('/profile'),
  updateProfile: (data: FormData) => api.put<User>('/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data: ChangePasswordData) =>
    api.put<{ message: string }>('/profile/password', data),

  // Admin endpoints
  getAllUsers: () => api.get<User[]>('/admin/users'),
  getUser: (id: number) => api.get<User>(`/admin/users/${id}`),
  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  getPendingLecturers: () => api.get<User[]>('/admin/lecturers'),
  approveLecturer: (id: number) => api.post<{ message: string }>(`/admin/lecturers/${id}/approve`),
  adminRegister: (data: FormData) => api.post<User>('/admin/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Public API endpoints
export const publicAPI = {
  getDepartments: (faculty?: string) =>
    api.get<Department[]>('/departments', { params: { faculty } }),
  extractMetadata: (formData: FormData) => api.post('/metadata/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  extractMetadataFromURL: (fileURL: string) => api.post('/metadata/extract-from-url', { file_url: fileURL }),
};

export const booksAPI = {
  // Public endpoints
  getBooks: (params?: SearchParams) =>
    api.get<PaginatedResponse<Book>>('/books', { params }).then(response => ({
      ...response,
      data: {
        ...response.data,
        data: response.data.data.map(book => ({
          ...book,
          file_url: getFullUrl(book.file_url),
          cover_image_url: getFullUrl(book.cover_image_url),
        })),
      },
    })),

  getBook: (id: number) =>
    api.get<Book>(`/books/${id}`).then(response => ({
      ...response.data,
      file_url: getFullUrl(response.data.file_url),
      cover_image_url: getFullUrl(response.data.cover_image_url),
    })),

  // Admin endpoints
  createBook: (data: FormData) => {
    console.log('API: Creating admin book with data:', data);
    return api.post<Book>('/admin/books', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateBook: (id: number, data: FormData) => {
    console.log('API: Updating admin book with data:', data);
    return api.put<Book>(`/admin/books/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteBook: (id: number) => api.delete(`/admin/books/${id}`),

  // User endpoints
  getUserBooks: (params?: SearchParams) =>
    api.get<PaginatedResponse<Book>>('/user/books', { params }).then(response => ({
      ...response,
      data: {
        ...response.data,
        data: (response.data.data ?? []).map(book => ({
          ...book,
          file_url: getFullUrl(book.file_url),
          cover_image_url: getFullUrl(book.cover_image_url),
        })),
      },
    })),

  createUserBook: (data: FormData) => {
    console.log('API: Creating user book with data:', data);
    return api.post<Book>('/user/books', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateUserBook: (id: number, data: FormData) => {
    console.log('API: Updating user book with data:', data);
    return api.put<Book>(`/user/books/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteUserBook: (id: number) => api.delete(`/user/books/${id}`),

  // Common functionality
  downloadBook: async (id: number, title: string, fileUrl?: string) => {
    const response = await api.get(`/user/books/${id}/download`, {
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from Content-Disposition header first
    const contentDisposition = response.headers['content-disposition'];
    let filename = title;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Fallback: extract extension from file_url if available
      if (fileUrl) {
        const extension = fileUrl.split('.').pop();
        filename = extension ? `${title}.${extension}` : title;
      } else {
        // Last resort fallback
        filename = `${title}.pdf`;
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Public download functionality (no authentication required)
  downloadBookPublic: async (id: number, title: string, fileUrl?: string) => {
    const response = await api.get(`/books/${id}/download`, {
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from Content-Disposition header first
    const contentDisposition = response.headers['content-disposition'];
    let filename = title;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Fallback: extract extension from file_url if available
      if (fileUrl) {
        const extension = fileUrl.split('.').pop();
        filename = extension ? `${title}.${extension}` : title;
      } else {
        // Last resort fallback
        filename = `${title}.pdf`;
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  search: (params?: SearchParams) =>
    api.get<PaginatedResponse<Book>>('/books', { params }).then(response => ({
      ...response,
      data: {
        ...response.data,
        data: Array.isArray(response.data.data) ? response.data.data.map(book => ({
          ...book,
          file_url: getFullUrl(book.file_url),
          cover_image_url: getFullUrl(book.cover_image_url),
        })) : [],
      },
    })),
};

export const papersAPI = {
  // Public endpoints
  getPapers: (params?: SearchParams) =>
    api.get<PaginatedResponse<Paper>>('/papers', { params }).then(response => ({
      ...response,
      data: {
        ...response.data,
        data: Array.isArray(response.data.data) ? response.data.data.map(paper => ({
          ...paper,
          file_url: getFullUrl(paper.file_url),
          cover_image_url: getFullUrl(paper.cover_image_url),
        })) : [],
      },
    })),

  getPaper: (id: number) =>
    api.get<Paper>(`/papers/${id}`).then(response => ({
      ...response.data,
      file_url: getFullUrl(response.data.file_url),
      cover_image_url: getFullUrl(response.data.cover_image_url),
    })),

  // Admin endpoints
  createPaper: (data: FormData) => api.post<Paper>('/admin/papers', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  updatePaper: (id: number, data: FormData) =>
    api.put<Paper>(`/admin/papers/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  deletePaper: (id: number) => api.delete(`/admin/papers/${id}`),

  // User endpoints
  getUserPapers: (params?: SearchParams) =>
    api.get<PaginatedResponse<Paper>>('/user/papers', { params }).then(response => ({
      ...response,
      data: {
        ...response.data,
        data: (response.data.data ?? []).map(paper => ({
          ...paper,
          file_url: getFullUrl(paper.file_url),
          cover_image_url: getFullUrl(paper.cover_image_url),
        })),
      },
    })),

  createUserPaper: async (formData: FormData): Promise<Paper> => {
    const response = await api.post<Paper>('/user/papers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateUserPaper: async (id: number, formData: FormData): Promise<Paper> => {
    const response = await api.put<Paper>(`/user/papers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteUserPaper: async (id: number): Promise<void> => {
    const response = await api.delete(`/user/papers/${id}`);
    return response.data;
  },

  // Common functionality
  downloadPaper: async (id: number, title: string, fileUrl?: string) => {
    const response = await api.get(`/user/papers/${id}/download`, {
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from Content-Disposition header first
    const contentDisposition = response.headers['content-disposition'];
    let filename = title;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Fallback: extract extension from file_url if available
      if (fileUrl) {
        const extension = fileUrl.split('.').pop();
        filename = extension ? `${title}.${extension}` : title;
      } else {
        // Last resort fallback
        filename = `${title}.pdf`;
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Public download functionality (no authentication required)
  downloadPaperPublic: async (id: number, title: string, fileUrl?: string) => {
    const response = await api.get(`/papers/${id}/download`, {
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from Content-Disposition header first
    const contentDisposition = response.headers['content-disposition'];
    let filename = title;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Fallback: extract extension from file_url if available
      if (fileUrl) {
        const extension = fileUrl.split('.').pop();
        filename = extension ? `${title}.${extension}` : title;
      } else {
        // Last resort fallback
        filename = `${title}.pdf`;
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  search: (params?: SearchParams) =>
    api.get<PaginatedResponse<Paper>>('/papers', { params }).then(response => ({
      ...response,
      data: {
        ...response.data,
        data: Array.isArray(response.data.data) ? response.data.data.map(paper => ({
          ...paper,
          file_url: getFullUrl(paper.file_url),
          cover_image_url: getFullUrl(paper.cover_image_url),
        })) : [],
      },
    })),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getPendingLecturers: () => api.get<User[]>('/admin/lecturers'),
  approveLecturer: (id: number) => api.post<{ message: string }>(`/admin/lecturers/${id}/approve`),
};

export const categoriesAPI = {
  getCategories: () => api.get<Category[]>('/categories'),
  getCategory: (id: number) => api.get<Category>(`/categories/${id}`),
  createCategory: (data: Partial<Category>) => api.post<Category>('/categories', data),
  updateCategory: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),
};

export const authorsAPI = {
  // Public endpoints
  searchAuthors: (query?: string) =>
    api.get<{ authors: Author[] }>(`/authors/search${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  getAuthorWorks: (name: string) =>
    api.get<AuthorDetail>(`/authors/${encodeURIComponent(name)}/works`),
};

export const getCitationsPerMonth = () => api.get('/citations-per-month');
export const getUserCitationsPerMonth = () => api.get('/user/citations-per-month');
export const getUserStats = () => api.get('/user/stats');
export const getUserProfile = (id: string | number) => api.get(`/users/${id}`);
export const getUserStatsById = (id: string | number) => api.get(`/users/${id}/stats`);
export const getUserCitationsPerMonthById = (id: string | number) => api.get(`/users/${id}/citations-per-month`);
export const getUserDownloadsPerMonthById = (id: string | number) => api.get(`/users/${id}/downloads-per-month`);
export const getBooksByUserId = (id: string | number, page = 1, limit = 8, query?: string) => {
  let url = `/books?created_by=${id}&page=${page}&limit=${limit}`;
  if (query && query.trim()) {
    url += `&query=${encodeURIComponent(query)}`;
  }
  return api.get(url);
};
export const getPapersByUserId = (id: string | number, page = 1, limit = 8, query?: string) => {
  let url = `/papers?created_by=${id}&page=${page}&limit=${limit}`;
  if (query && query.trim()) {
    url += `&query=${encodeURIComponent(query)}`;
  }
  return api.get(url);
};
export const getBookStats = (id: string | number) => api.get(`/books/${id}/stats`);
export const getPaperStats = (id: string | number) => api.get(`/papers/${id}/stats`);
export const getBooksPerMonth = () => api.get('/books-per-month');
export const getPapersPerMonth = () => api.get('/papers-per-month');
export const getUserDownloadsPerMonth = () => api.get('/user/downloads-per-month');

// Metadata extraction
export const extractMetadata = (formData: FormData) => api.post('/metadata/extract', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const extractMetadataFromURL = (fileURL: string) => api.post('/metadata/extract-from-url', { file_url: fileURL }); 