import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  nim?: string;
  jurusan?: string;
  address?: string;
  role: 'public' | 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  publisher?: string;
  published_year?: number;
  isbn?: string;
  subject?: string;
  language?: string;
  pages?: number;
  summary?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

export interface Paper {
  id: number;
  title: string;
  author: string;
  advisor?: string;
  university?: string;
  department?: string;
  year?: number;
  issn?: string;
  abstract?: string;
  keywords?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  categories?: Category[];
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
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    name: string;
    password: string;
    nim?: string;
    jurusan?: string;
    address?: string;
  }) => api.post<AuthResponse>('/auth/register', data),
  
  getProfile: () => api.get<User>('/profile'),
  
  updateProfile: (data: {
    name: string;
    nim?: string;
    jurusan?: string;
    address?: string;
  }) => api.put<User>('/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};

export const booksAPI = {
  getBooks: (params?: SearchParams) =>
    api.get<PaginatedResponse<Book>>('/books', { params }),
  
  getBook: (id: number) => api.get<Book>(`/books/${id}`),
  
  createBook: (data: Partial<Book>) => api.post<Book>('/admin/books', data),
  
  updateBook: (id: number, data: Partial<Book>) =>
    api.put<Book>(`/admin/books/${id}`, data),
  
  deleteBook: (id: number) => api.delete(`/admin/books/${id}`),
  
  downloadBook: async (id: number, title: string, fileUrl?: string) => {
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

  // User-specific book management
  createUserBook: (data: FormData) => api.post<Book>('/user/books', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  getUserBooks: (params?: SearchParams) =>
    api.get<PaginatedResponse<Book>>('/user/books', { params }),
  
  updateUserBook: (id: number, data: FormData) =>
    api.put<Book>(`/user/books/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteUserBook: (id: number) => api.delete(`/user/books/${id}`),
};

export const papersAPI = {
  getPapers: (params?: SearchParams) =>
    api.get<PaginatedResponse<Paper>>('/papers', { params }),
  
  getPaper: (id: number) => api.get<Paper>(`/papers/${id}`),
  
  createPaper: (data: Partial<Paper>) => api.post<Paper>('/admin/papers', data),
  
  updatePaper: (id: number, data: Partial<Paper>) =>
    api.put<Paper>(`/admin/papers/${id}`, data),
  
  deletePaper: (id: number) => api.delete(`/admin/papers/${id}`),
  
  downloadPaper: async (id: number, title: string, fileUrl?: string) => {
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

  // User-specific paper management
  createUserPaper: (data: FormData) => api.post<Paper>('/user/papers', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  getUserPapers: (params?: SearchParams) =>
    api.get<PaginatedResponse<Paper>>('/user/papers', { params }),
  
  updateUserPaper: (id: number, data: FormData) =>
    api.put<Paper>(`/user/papers/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteUserPaper: (id: number) => api.delete(`/user/papers/${id}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
}; 