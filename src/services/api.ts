import axios from "axios";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // NestJS backend URL
// const API_BASE_URL = "http://localhost:5000/"; // NestJS backend URL

// Create axios instance with common config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies in requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token from localStorage if available
// No need for Authorization header, rely on cookies

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if this is NOT a login attempt
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      console.log(isLoginRequest);

      if (!isLoginRequest) {
        // Handle unauthorized access for protected routes
        window.location.href = "/login";
      }
      // For login requests, let the component handle the error
    }

    // Enhance error object with better messages
    if (error.response?.data) {
      error.response.data.userMessage = getUserFriendlyErrorMessage(
        error.response.data.message || error.message
      );
    }

    return Promise.reject(error);
  }
);

// Helper function to convert technical errors to user-friendly messages
function getUserFriendlyErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("already exists")
  ) {
    return "This item already exists. Please choose a different name.";
  }

  if (
    lowerMessage.includes("foreign key") ||
    lowerMessage.includes("referenced by other records")
  ) {
    return "Cannot delete this item because it is being used by other records.";
  }

  if (lowerMessage.includes("not found")) {
    return "The requested item was not found.";
  }

  if (
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("forbidden")
  ) {
    return "You do not have permission to perform this action.";
  }

  if (
    lowerMessage.includes("validation") ||
    lowerMessage.includes("required field")
  ) {
    return "Please check all required fields and try again.";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("connection")) {
    return "Network error. Please check your connection and try again.";
  }

  // Return original message if no pattern matches
  return message;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Admin {
  id: string;
  email: string;
  first_name?: string;
  phone?: string;
  address?: string;
  role: "admin" | "superadmin";
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  original_price: number;
  price: number;
  discount?: number;
  ingredients: string[];
  sizes: string[];
  images: string[];
  availability: boolean;
  visibility: boolean;
  is_favourite: boolean;
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  itemId: string;
  name: string;
  price: number;
  description?: string;
  category_type?: string;
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  images: string[];
  start_date: string;
  end_date: string;
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface OperationHour {
  id: string;
  day: string;
  open_time: string;
  close_time: string;
  status: boolean;
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface SpecialsDay {
  id: string;
  day_name: string;
  created_at: string;
  updated_at: string;
}

export interface Special {
  id: string;
  special_type: "daily" | "seasonal" | "latenight";
  specialsDayId?: string;
  name?: string; // Name of the special
  season_name?: string; // Only for seasonal specials
  description?: string;
  image_url?: string;
  image_urls?: string[]; // Support for multiple images
  seasonal_start_datetime?: string; // ISO timestamp for seasonal specials
  seasonal_end_datetime?: string; // ISO timestamp for seasonal specials
  lastEditedByAdminId: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  story_name: string;
  description?: string;
  images: string[]; // Support for up to 5 images
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface WingSauce {
  id: string;
  name: string;
  description?: string;
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

export interface SubstituteSide {
  id: string;
  name: string;
  price: number;
  description?: string;
  lastEditedByAdminId?: string;
  lastEditedByAdmin?: Admin;
  created_at: string;
  updated_at: string;
}

// Task interface for dashboard
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  due_date?: string;
  created_at: string;
  updated_at: string;
}

// Authentication API
export const authService = {
  login: (credentials: {
    email: string;
    password: string;
  }): Promise<{ message: string; admin: Admin }> =>
    api.post("/auth/login", credentials).then((res) => res.data),

  logout: (): Promise<{ message: string }> =>
    api.post("/auth/logout").then((res) => res.data),

  getProfile: (): Promise<Admin> =>
    api.get("/auth/profile").then((res) => res.data),

  updateProfile: (data: {
    first_name?: string;
    phone?: string;
    address?: string;
  }): Promise<Admin> =>
    api.patch("/admins/profile", data).then((res) => res.data),

  uploadAvatar: (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api
      .post("/admins/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data);
  },

  inviteAdmin: (data: { email: string; role: string }): Promise<any> =>
    api.post("/auth/invite-admin", data).then((res) => res.data),

  validateInvitation: (token: string): Promise<any> =>
    api.post("/auth/validate-invitation", { token }).then((res) => res.data),

  setupPassword: (data: {
    token: string;
    password: string;
    first_name?: string;
    phone?: string;
    address?: string;
  }): Promise<any> =>
    api.post("/auth/setup-password", data).then((res) => res.data),
};

// API methods
export const adminService = {
  getAll: (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedResponse<Admin>> =>
    api
      .get("/admins", { params: { page, limit, search } })
      .then((res) => res.data),

  getAllWithFilters: (params: any): Promise<PaginatedResponse<Admin>> =>
    api.get("/admins/filtered", { params }).then((res) => res.data),

  getById: (id: string): Promise<Admin> =>
    api.get(`/admins/${id}`).then((res) => res.data),

  create: (data: Partial<Admin>): Promise<Admin> =>
    api.post("/admins", data).then((res) => res.data),

  update: (id: string, data: Partial<Admin>): Promise<Admin> =>
    api.patch(`/admins/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/admins/${id}`).then((res) => res.data),

  toggleStatus: (id: string): Promise<Admin> =>
    api.patch(`/admins/${id}/toggle-status`).then((res) => res.data),

  getCount: (): Promise<number> =>
    api.get("/admins/count").then((res) => res.data),
};

export const categoryService = {
  getAll: (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedResponse<Category>> =>
    api
      .get("/categories", { params: { page, limit, search } })
      .then((res) => res.data),

  getById: (id: string): Promise<Category> =>
    api.get(`/categories/${id}`).then((res) => res.data),

  create: (data: Partial<Category>): Promise<Category> =>
    api.post("/categories", data).then((res) => res.data),

  update: (id: string, data: Partial<Category>): Promise<Category> =>
    api.patch(`/categories/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/categories/${id}`).then((res) => res.data),
  getCount: (): Promise<number> =>
    api.get("/categories/count").then((res) => res.data),
};

export const itemService = {
  getAll: (
    page = 1,
    limit = 10,
    filters?: any
  ): Promise<PaginatedResponse<Item>> =>
    api
      .get("/items", { params: { page, limit, ...filters } })
      .then((res) => res.data),

  getById: (id: string): Promise<Item> =>
    api.get(`/items/${id}`).then((res) => res.data),

  create: (data: Partial<Item>): Promise<Item> =>
    api.post("/items", data).then((res) => res.data),

  update: (id: string, data: Partial<Item>): Promise<Item> =>
    api.patch(`/items/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/items/${id}`).then((res) => res.data),
  getCount: (): Promise<number> =>
    api.get("/items/count").then((res) => res.data),

  // Image upload and management methods
  uploadImages: (
    files: File[]
  ): Promise<{ signedUrls?: string[]; imageUrls?: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    return api
      .post("/items/upload-images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data);
  },

  deleteImage: (imageUrl: string): Promise<void> => {
    const encodedUrl = encodeURIComponent(imageUrl);
    return api.delete(`/items/images/${encodedUrl}`).then((res) => res.data);
  },
};

export const addonService = {
  getAll: (
    page = 1,
    limit = 10,
    filters?: { [key: string]: any }
  ): Promise<PaginatedResponse<Addon>> => {
    const params: any = { page, limit };
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key] !== "") {
          params[key] = filters[key];
        }
      });
    }
    return api.get("/addons", { params }).then((res) => res.data);
  },

  getById: (id: string): Promise<Addon> =>
    api.get(`/addons/${id}`).then((res) => res.data),

  create: (data: Partial<Addon>): Promise<Addon> =>
    api.post("/addons", data).then((res) => res.data),

  update: (id: string, data: Partial<Addon>): Promise<Addon> =>
    api.patch(`/addons/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/addons/${id}`).then((res) => res.data),

  duplicate: (id: string): Promise<Addon> =>
    api.post(`/addons/${id}/duplicate`).then((res) => res.data),

  getCount: (): Promise<number> =>
    api.get("/addons/count").then((res) => res.data),
};

export const eventService = {
  getAll: (
    page = 1,
    limit = 10,
    dateRange?: { startDate?: string; endDate?: string },
    search?: string
  ): Promise<PaginatedResponse<Event>> =>
    api
      .get("/events", { params: { page, limit, search, ...dateRange } })
      .then((res) => res.data),

  getById: (id: string): Promise<Event> =>
    api.get(`/events/${id}`).then((res) => res.data),

  create: (data: Partial<Event>): Promise<Event> =>
    api.post("/events", data).then((res) => res.data),

  update: (id: string, data: Partial<Event>): Promise<Event> =>
    api.patch(`/events/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/events/${id}`).then((res) => res.data),
  getCount: (): Promise<number> =>
    api.get("/events/count").then((res) => res.data),

  // Image upload and management methods
  uploadImages: (
    files: File[]
  ): Promise<{ signedUrls?: string[]; imageUrls?: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    return api
      .post("/events/upload-images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data);
  },

  deleteImage: (imageUrl: string): Promise<void> => {
    const encodedUrl = encodeURIComponent(imageUrl);
    return api.delete(`/events/images/${encodedUrl}`).then((res) => res.data);
  },
};

export const operationHourService = {
  getAll: (
    page = 1,
    limit = 10,
    day?: string
  ): Promise<PaginatedResponse<OperationHour>> =>
    api
      .get("/operation-hours", { params: { page, limit, day } })
      .then((res) => res.data),

  getById: (id: string): Promise<OperationHour> =>
    api.get(`/operation-hours/${id}`).then((res) => res.data),

  create: (data: Partial<OperationHour>): Promise<OperationHour> =>
    api.post("/operation-hours", data).then((res) => res.data),

  update: (id: string, data: Partial<OperationHour>): Promise<OperationHour> =>
    api.patch(`/operation-hours/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/operation-hours/${id}`).then((res) => res.data),
  getCount: (): Promise<number> =>
    api.get("/operation-hours/count").then((res) => res.data),
};

export const specialsDayService = {
  getAll: (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedResponse<SpecialsDay>> =>
    api
      .get("/specials-day", { params: { page, limit, search } })
      .then((res) => res.data),

  getById: (id: string): Promise<SpecialsDay> =>
    api.get(`/specials-day/${id}`).then((res) => res.data),

  create: (data: Partial<SpecialsDay>): Promise<SpecialsDay> =>
    api.post("/specials-day", data).then((res) => res.data),

  update: (id: string, data: Partial<SpecialsDay>): Promise<SpecialsDay> =>
    api.patch(`/specials-day/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/specials-day/${id}`).then((res) => res.data),
};

export const specialsService = {
  getAll: (
    page = 1,
    limit = 10,
    search?: string,
    specialType?: string
  ): Promise<PaginatedResponse<Special>> =>
    api
      .get("/specials", { params: { page, limit, search, specialType } })
      .then((res) => res.data),

  getById: (id: string): Promise<Special> =>
    api.get(`/specials/${id}`).then((res) => res.data),

  create: (data: Partial<Special>, images?: File[]): Promise<Special> => {
    const formData = new FormData();

    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Add images if provided (up to 5)
    if (images && images.length > 0) {
      const limitedImages = images.slice(0, 5); // Limit to 5 images
      limitedImages.forEach((image) => {
        formData.append("images", image);
      });
    }

    return api
      .post("/specials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  update: (
    id: string,
    data: Partial<Special>,
    images?: File[]
  ): Promise<Special> => {
    const formData = new FormData();

    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle arrays (like removeImages)
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item.toString());
          });
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add images if provided (up to 5)
    if (images && images.length > 0) {
      const limitedImages = images.slice(0, 5); // Limit to 5 images
      limitedImages.forEach((image) => {
        formData.append("images", image);
      });
    }

    return api
      .patch(`/specials/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  uploadImage: (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    return api
      .post("/specials/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  uploadImages: (files: File[]): Promise<{ imageUrls: string[] }> => {
    const formData = new FormData();
    const limitedFiles = files.slice(0, 5); // Limit to 5 images
    limitedFiles.forEach((file) => {
      formData.append("images", file);
    });

    return api
      .post("/specials/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  deleteImage: (imageUrl: string): Promise<void> =>
    api
      .delete(`/specials/images/${encodeURIComponent(imageUrl)}`)
      .then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/specials/${id}`).then((res) => res.data),
};

export const wingSauceService = {
  getAll: (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedResponse<WingSauce>> =>
    api
      .get("/wing-sauces", { params: { page, limit, search } })
      .then((res) => res.data),

  getById: (id: string): Promise<WingSauce> =>
    api.get(`/wing-sauces/${id}`).then((res) => res.data),

  create: (data: Partial<WingSauce>): Promise<WingSauce> =>
    api.post("/wing-sauces", data).then((res) => res.data),

  update: (id: string, data: Partial<WingSauce>): Promise<WingSauce> =>
    api.patch(`/wing-sauces/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/wing-sauces/${id}`).then((res) => res.data),
};

export const substituteSideService = {
  getAll: (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedResponse<SubstituteSide>> =>
    api
      .get("/substitute-sides", { params: { page, limit, search } })
      .then((res) => res.data),

  getById: (id: string): Promise<SubstituteSide> =>
    api.get(`/substitute-sides/${id}`).then((res) => res.data),

  create: (data: Partial<SubstituteSide>): Promise<SubstituteSide> =>
    api.post("/substitute-sides", data).then((res) => res.data),

  update: (
    id: string,
    data: Partial<SubstituteSide>
  ): Promise<SubstituteSide> =>
    api.patch(`/substitute-sides/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/substitute-sides/${id}`).then((res) => res.data),
};

// Task service for dashboard tasks
export const taskService = {
  toggleComplete: (id: string): Promise<Task> =>
    api.patch(`/tasks/${id}/toggle`).then((res) => res.data),
};

export const storiesService = {
  getAll: (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedResponse<Story>> =>
    api
      .get("/stories", { params: { page, limit, search } })
      .then((res) => res.data),

  getById: (id: string): Promise<Story> =>
    api.get(`/stories/${id}`).then((res) => res.data),

  create: (data: Partial<Story>, images?: File[]): Promise<Story> => {
    const formData = new FormData();

    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "images") {
        formData.append(key, value.toString());
      }
    });

    // Add images if provided (up to 5)
    if (images && images.length > 0) {
      const limitedImages = images.slice(0, 5); // Limit to 5 images
      limitedImages.forEach((image) => {
        formData.append("images", image);
      });
    }

    return api
      .post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  update: (
    id: string,
    data: Partial<Story>,
    images?: File[],
    removeImages?: string[]
  ): Promise<Story> => {
    const formData = new FormData();

    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "images") {
        formData.append(key, value.toString());
      }
    });

    // Add remove images if provided
    if (removeImages && removeImages.length > 0) {
      removeImages.forEach((imageUrl) => {
        formData.append("removeImages", imageUrl);
      });
    }

    // Add new images if provided (up to 5)
    if (images && images.length > 0) {
      const limitedImages = images.slice(0, 5); // Limit to 5 images
      limitedImages.forEach((image) => {
        formData.append("images", image);
      });
    }

    return api
      .patch(`/stories/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  uploadImages: (
    id: string,
    files: File[]
  ): Promise<{ imageUrls: string[] }> => {
    const formData = new FormData();
    const limitedFiles = files.slice(0, 5); // Limit to 5 images
    limitedFiles.forEach((file) => {
      formData.append("images", file);
    });

    return api
      .post(`/stories/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  removeImage: (id: string, imageUrl: string): Promise<void> =>
    api
      .delete(`/stories/${id}/images`, {
        data: { imageUrl },
      })
      .then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/stories/${id}`).then((res) => res.data),
};

// Tasks Service
export const tasksService = {
  getAll: (): Promise<Task[]> => api.get("/tasks").then((res) => res.data),

  create: (
    task: Omit<Task, "id" | "created_at" | "updated_at">
  ): Promise<Task> => api.post("/tasks", task).then((res) => res.data),

  update: (id: string, task: Partial<Task>): Promise<Task> =>
    api.put(`/tasks/${id}`, task).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/tasks/${id}`).then((res) => res.data),

  toggleComplete: (id: string): Promise<Task> =>
    api.patch(`/tasks/${id}/toggle`).then((res) => res.data),
};

export default api;
