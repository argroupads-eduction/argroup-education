import axios, { AxiosInstance } from 'axios';
import { getApiBaseUrl } from '@/lib/apiBase';
import { ApiResponse, PaginatedResponse, BlogPost, University, Country } from '@/types';

const API_URL = getApiBaseUrl();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Blog Services
export const blogService = {
  async getBlogs(page = 1, limit = 10, category?: string) {
    try {
      const params = { page, limit, ...(category && { category }) };
      const { data } = await apiClient.get<PaginatedResponse<BlogPost>>(
        '/api/blogs',
        { params }
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getBlogBySlug(slug: string) {
    try {
      const { data } = await apiClient.get<ApiResponse<BlogPost>>(
        `/api/blogs/${slug}`
      );
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async getRelatedBlogs(slug: string, limit = 3) {
    try {
      const { data } = await apiClient.get<PaginatedResponse<BlogPost>>(
        `/api/blogs/${slug}/related`,
        { params: { limit } }
      );
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async searchBlogs(query: string) {
    try {
      const { data } = await apiClient.get<PaginatedResponse<BlogPost>>(
        '/api/blogs/search',
        { params: { q: query } }
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getCategories() {
    try {
      const { data } = await apiClient.get('/api/blogs/categories');
      return data;
    } catch (error) {
      throw error;
    }
  },
};

// Country Services
export const countryService = {
  async getCountries() {
    try {
      const { data } = await apiClient.get<ApiResponse<Country[]>>(
        '/api/countries'
      );
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async getCountryBySlug(slug: string) {
    try {
      const { data } = await apiClient.get<ApiResponse<Country>>(
        `/api/countries/${slug}`
      );
      return data.data;
    } catch (error) {
      throw error;
    }
  },
};

// University Services
export const universityService = {
  async getUniversities(page = 1, limit = 10, country?: string) {
    try {
      const params = { page, limit, ...(country && { country }) };
      const { data } = await apiClient.get<PaginatedResponse<University>>(
        '/api/universities',
        { params }
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getUniversityBySlug(slug: string) {
    try {
      const { data } = await apiClient.get<ApiResponse<University>>(
        `/api/universities/${slug}`
      );
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async getFeaturedUniversities(limit = 6) {
    try {
      const { data } = await apiClient.get<ApiResponse<University[]>>(
        '/api/universities/featured',
        { params: { limit } }
      );
      return data.data;
    } catch (error) {
      throw error;
    }
  },
};

// Form Services
export const formService = {
  async submitCounsellingForm(formData: any) {
    try {
      const { data } = await apiClient.post<ApiResponse<any>>(
        '/api/forms/counselling',
        formData
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  async submitContactForm(formData: any) {
    try {
      const { data } = await apiClient.post<ApiResponse<any>>(
        '/api/forms/contact',
        formData
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  async subscribeNewsletter(email: string) {
    const url =
      typeof window !== 'undefined'
        ? '/api/newsletter/subscribe'
        : `${getApiBaseUrl()}/api/newsletter/subscribe`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as ApiResponse<unknown>;
    if (!res.ok) throw new Error((data as { message?: string }).message || 'Subscribe failed');
    return data;
  },
};

export default apiClient;
