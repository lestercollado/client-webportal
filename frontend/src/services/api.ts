const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- Tipos de Datos ---
export interface Attachment {
  id: number;
  file_url: string;
  original_filename: string;
}

export interface RequestHistory {
    id: number;
    action: string;
    changed_at: string;
    changed_by_username?: string;
    changed_from_ip?: string;
}

export interface AuthorizedPerson {
    id: number;
    name: string;
    position: string;
    phone: string;
    email?: string;
    informational: boolean;
    operational: boolean;
    associated_with: string;
}

export interface UserRequest {
  id: number;
  status: string;
  created_at: string;
  attachments: Attachment[];
  history: RequestHistory[];
  note_reject?: string;
  notes?: string;
  authorized_persons: AuthorizedPerson[];
  created_by_username?: string;
  created_from_ip: string;
  customer_code: string;
  customer_role: string[];
  different: boolean;
  // Fields from backend schema
  company_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  tax_id: string;

  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
}

export interface PaginatedRequests {
  items: UserRequest[];
  total_pages: number;
  current_page: number;
  total_items: number;
}

export interface Stats {
  pending: number;
  completed: number;
  rejected: number;
  total: number;
}

// --- Custom Error Class ---
export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// --- Wrapper de Fetch para Autenticación ---

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Obtener el token desde localStorage
  const storedAuth = localStorage.getItem('auth');
  const token = storedAuth ? JSON.parse(storedAuth).token : null;

  const headers = new Headers(options.headers || {});
  
  // Añadir token si existe
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  // El navegador establece el Content-Type automáticamente para FormData
  if (!(options.body instanceof FormData)) {
      headers.append('Content-Type', 'application/json');
  }

  options.headers = headers;

  const response = await fetch(url, options);

  if (response.status === 401) {
    // Token inválido o expirado
    localStorage.removeItem('auth');
    // Forzar recarga para que el AuthProvider redirija a /login
    window.location.reload(); 
    // Lanzar un error para detener la ejecución actual
    throw new ApiError('Sesión expirada. Por favor, inicie sesión de nuevo.', response.status, null);
  }

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, use status text
      errorData = { message: response.statusText || 'Error desconocido del servidor' };
    }
    throw new ApiError(errorData.message || 'Error desconocido', response.status, errorData);
  }

  return response;
}

// --- Endpoints de la API ---

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Failed to login');
  }
  return response.json();
};

export const verify2FA = async (username, code) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-2fa/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, code }),
  });
  if (!response.ok) {
    throw new Error('Failed to verify 2FA code');
  }
  return response.json();
};

export const getRequests = async (params?: URLSearchParams): Promise<PaginatedRequests> => {
  const url = new URL(`${API_BASE_URL}/api/requests/`);
  if (params) {
    url.search = params.toString();
  }

  const response = await fetchWithAuth(url.toString());
  
  const data = await response.json();
  
  return {
    items: data.items || data,
    total_pages: data.total_pages || 1,
    current_page: data.current_page || 1,
    total_items: data.total_items || (data.items || data).length,
  };
};

export const createRequest = async (data: FormData): Promise<UserRequest> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/`, {
    method: 'POST',
    body: data,
  });
  return response.json();
};

export const getRequestById = async (id: number): Promise<UserRequest> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/${id}`);
  return response.json();
};

export const updateRequestDetails = async (id: number, data: { note_reject?: string; customer_code?: string; customer_role?: string[]; status?: string }): Promise<UserRequest> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
  });
  return response.json();
};

export const approveRequest = async (id: number): Promise<UserRequest> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/${id}/approve`, {
    method: 'POST',
  });
  return response.json();
};

export const rejectRequest = async (id: number): Promise<UserRequest> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/${id}/reject`, {
    method: 'POST',
  });
  return response.json();
};

export const deleteRequest = async (id: number): Promise<void> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/${id}`, {
    method: 'DELETE',
  });

  if (response.status !== 204) {
    // ApiError will be thrown by fetchWithAuth if response.ok is false
    // For 204, we just return void if successful
  }
};

export const updateRequest = async (id: number, data: FormData): Promise<UserRequest> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/${id}`, {
    method: 'PUT',
    body: data,
  });
  return response.json();
};

export const getStats = async (): Promise<Stats> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/requests/stats/`);
  return response.json();
};

export async function getRequestDetails(id: number) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/requests/${id}`, {
    cache: 'no-store',
  });
  return res.json();
}
