const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Definimos un tipo para las solicitudes para mayor claridad
export interface UserRequest {
  id: number;
  customer_code: string;
  customer_role: string;
  contact_email: string;
  notes?: string;
  status: string;
  created_at: string;
  created_by_username?: string;
  attachments: {
    id: number;
    file_url: string;
    original_filename?: string;
  }[];
  history: {
    id: number;
    action: string;
    changed_at: string;
    changed_by_username?: string;
    changed_from_ip?: string;
  }[];
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

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, code }),
  });
  if (!response.ok) {
    throw new Error('Failed to verify 2FA code');
  }
  return response.json();
};


/**
 * Obtiene la lista de todas las solicitudes de usuario.
 * @param token - El token de autenticación (actualmente simulado).
 * @param params - Optional URLSearchParams for pagination and filtering.
 */
export const getRequests = async (token: string, params?: URLSearchParams): Promise<PaginatedRequests> => {
  const url = new URL(`${API_BASE_URL}/api/requests/`);
  if (params) {
    url.search = params.toString();
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener las solicitudes');
  }
  
  const data = await response.json();
  
  // Adapt the response to the expected format if necessary
  return {
    items: data.items || data,
    total_pages: data.total_pages || 1,
    current_page: data.current_page || 1,
    total_items: data.total_items || (data.items || data).length,
  };
};

/**
 * Crea una nueva solicitud de usuario.
 * @param data - Un objeto FormData que contiene los datos de la solicitud y el archivo.
 * @param token - El token de autenticación (actualmente simulado).
 */
export const createRequest = async (data: FormData, token: string): Promise<UserRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/requests/`, {
    method: 'POST',
    headers: {
      // 'Content-Type' es establecido automáticamente por el navegador cuando se usa FormData.
      'Authorization': `Bearer ${token}`,
    },
    body: data,
  });

  if (!response.ok) {
    // Intenta leer el cuerpo del error para más detalles
    const errorBody = await response.json().catch(() => ({ detail: 'Error al crear la solicitud' }));
    throw new Error(errorBody.detail || 'Error desconocido');
  }
  return response.json();
};

/**
 * Gets a single user request by its ID.
 * @param id - The ID of the request to retrieve.
 * @param token - The authentication token.
 */
export const getRequestById = async (id: number, token: string): Promise<UserRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener la solicitud');
  }
  return response.json();
};

/**
 * Updates the status of a user request.
 * @param id - The ID of the request to update.
 * @param status - The new status.
 * @param token - The authentication token.
 */
export const updateRequestStatus = async (id: number, status: 'Completado' | 'Rechazado', token: string): Promise<UserRequest> => {
  const formData = new FormData();
  formData.append('status', status);

  const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Error al actualizar la solicitud' }));
    throw new Error(errorBody.detail || 'Error desconocido');
  }
  return response.json();
};

/**
 * Deletes a user request (soft delete).
 * @param id - The ID of the request to delete.
 * @param token - The authentication token.
 */
export const deleteRequest = async (id: number, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status !== 204) {
    const errorBody = await response.json().catch(() => ({ detail: 'Error al eliminar la solicitud' }));
    throw new Error(errorBody.detail || 'Error desconocido');
  }
};

/**
 * Updates a user request.
 * @param id - The ID of the request to update.
 * @param data - The FormData object with the data to update.
 * @param token - The authentication token.
 */
export const updateRequest = async (id: number, data: FormData, token: string): Promise<UserRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
    method: 'PUT',
    headers: {
      // Content-Type is automatically set by the browser with the correct boundary when using FormData
      'Authorization': `Bearer ${token}`,
    },
    body: data,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Error al actualizar la solicitud' }));
    throw new Error(errorBody.detail || 'Error desconocido');
  }
  return response.json();
};

/**
 * Obtiene las estadísticas de las solicitudes.
 * @param token - El token de autenticación.
 */
export const getStats = async (token: string): Promise<Stats> => {
  const response = await fetch(`${API_BASE_URL}/api/requests/stats/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener las estadísticas');
  }
  return response.json();
};

export async function getRequestDetails(id: string, token?: string) {
  const res = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('No se pudo obtener la solicitud');
  }

  return res.json();
}