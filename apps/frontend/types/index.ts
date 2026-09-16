// Blog Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  featuredImage: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

// Country Types
export interface Country {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  flag: string;
  medicalSchools: number;
  fees: string;
  duration: string;
  neetScore: string;
  benefits: string[];
  featured: boolean;
}

// University Types
export interface University {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  image: string;
  rating: number;
  fees: string;
  duration: string;
  neetScore: string;
  admission: string;
  affiliations: string[];
  placement: number;
  featured: boolean;
}

// Form Types
export interface CounsellingFormData {
  name: string;
  phone: string;
  email: string;
  course: string;
  neetScore: string;
  countryPreference: string;
}

export interface NewsletterFormData {
  email: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

// SEO Types
export interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  keywords?: string[];
  author?: string;
  robots?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Testimonial Types
export interface Testimonial {
  id: string;
  name: string;
  image: string;
  review: string;
  university: string;
  country: string;
  rating: number;
  course: string;
}

// State Types
export interface IndianState {
  id: string;
  name: string;
  description: string;
  icon: string;
  students: number;
}

// Service Types
export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  link: string;
}

// FAQ Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  featured: boolean;
}

// Gallery Types
export interface GalleryImage {
  id: string;
  title: string;
  image: string;
  category: string;
  description?: string;
}
