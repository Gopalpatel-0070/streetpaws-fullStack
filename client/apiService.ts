// API Service for backend communication
const API_BASE_URL = process.env.API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://streetpaws-backend.vercel.app/api');

interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      profile: any;
      createdAt: string;
    };
    token: string;
  };
}

interface PetResponse {
  success: boolean;
  data: any[];
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

class APIService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private getHeaders(includeAuth = true) {
    const headers: any = {
      "Content-Type": "application/json",
    };

    if (includeAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    return response.json();
  }

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    return response.json();
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    return response.json();
  }

  async logout() {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: this.getHeaders(true),
    });
    this.clearToken();
  }

  async getPets(params: any = {}): Promise<PetResponse> {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/pets${queryString ? `?${queryString}` : ""}`;
    console.log("Fetching pets from:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Pets API error:", response.status, errorData);
      throw new Error(errorData.error || `Failed to fetch pets: ${response.status}`);
    }

    return response.json();
  }

  async getPetById(id: string) {
    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: "GET",
      headers: this.getHeaders(false),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch pet");
    }

    return response.json();
  }

  async createPet(petData: any) {
    console.log("Creating pet with data:", petData);
    
    const response = await fetch(`${API_BASE_URL}/pets`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify(petData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Create pet error:", response.status, errorData);
      throw new Error(errorData.error || errorData.message || `Failed to create pet: ${response.status}`);
    }

    return response.json();
  }

  async updatePet(id: string, petData: any) {
    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: "PUT",
      headers: this.getHeaders(true),
      body: JSON.stringify(petData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update pet");
    }

    return response.json();
  }

  async deletePet(id: string) {
    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete pet");
    }

    return response.json();
  }

  async addComment(petId: string, text: string) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}/comments`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add comment");
    }

    return response.json();
  }

  async toggleCheer(petId: string) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}/cheer`, {
      method: "POST",
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to toggle cheer");
    }

    return response.json();
  }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload image");
    }

    return response.json();
  }
}

export default new APIService();
