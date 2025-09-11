// Local API service for MySQL database connection
const API_BASE_URL = 'http://localhost:3001/api'; // Your local backend URL

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  age: string;
  gender: string;
  date: string;
  diagnosis: string;
  prescription: string;
  imageUrl?: string;
  doctorId: string;
  createdAt: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  error?: string;
}

class APIService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async signIn(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.request('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.token) {
        this.token = response.token;
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      return { error: 'Failed to sign in' };
    }
  }

  async signUp(name: string, username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, username, password }),
      });
      return response;
    } catch (error) {
      return { error: 'Failed to sign up' };
    }
  }

  async signOut(): Promise<void> {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Medical Records
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    try {
      return await this.request('/medical-records');
    } catch (error) {
      console.error('Failed to fetch medical records:', error);
      return [];
    }
  }

  async createMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt'>): Promise<MedicalRecord> {
    return await this.request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async updateMedicalRecord(id: string, record: Partial<MedicalRecord>): Promise<MedicalRecord> {
    return await this.request(`/medical-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    await this.request(`/medical-records/${id}`, {
      method: 'DELETE',
    });
  }

  // Doctor Profiles
  async getDoctorProfiles(): Promise<User[]> {
    return await this.request('/doctors');
  }

  async createDoctorProfile(doctor: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return await this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctor),
    });
  }

  async updateDoctorProfile(id: string, doctor: Partial<User>): Promise<User> {
    return await this.request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctor),
    });
  }

  async deleteDoctorProfile(id: string): Promise<void> {
    await this.request(`/doctors/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit Logs
  async getAuditLogs(): Promise<any[]> {
    return await this.request('/audit-logs');
  }

  async logAuditEvent(event: {
    action: string;
    resource: string;
    details?: string;
  }): Promise<void> {
    await this.request('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // File Upload
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return await response.json();
  }
}

export const apiService = new APIService();