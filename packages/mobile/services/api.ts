import * as SecureStore from 'expo-secure-store';

const API_BASE = 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';

// Token management
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    console.log('Error retrieving token:', e);
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (e) {
    console.log('Error storing token:', e);
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {
    console.log('Error removing token:', e);
  }
}

// API wrapper with authorization
async function fetchApi(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      await removeToken();
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Auth endpoints
export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: any }> {
  const data = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    await setToken(data.token);
  }
  return data;
}

// Profile endpoints
export async function getMyProfile(): Promise<any> {
  return fetchApi('/volunteers/me', { method: 'GET' });
}

export async function updateProfile(data: any): Promise<any> {
  return fetchApi('/volunteers/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Assignments endpoints
export async function getMyAssignments(): Promise<any[]> {
  return fetchApi('/assignments/me', { method: 'GET' });
}

// Hours endpoints
export async function getMyHours(): Promise<any[]> {
  return fetchApi('/hours/me', { method: 'GET' });
}

export async function logHours(data: {
  date: string;
  hours: number;
  department: string;
  description?: string;
}): Promise<any> {
  return fetchApi('/hours', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Broadcasts endpoints
export async function getMyBroadcasts(): Promise<any[]> {
  return fetchApi('/broadcasts/me', { method: 'GET' });
}

export async function respondToBroadcast(
  broadcastId: string,
  response: 'ACCEPTED' | 'TENTATIVE' | 'DECLINED'
): Promise<any> {
  return fetchApi(`/broadcasts/${broadcastId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  });
}

// Notifications endpoints
export async function getNotifications(): Promise<any[]> {
  return fetchApi('/notifications', { method: 'GET' });
}

// Availability endpoints
export async function updateAvailability(data: any): Promise<any> {
  return fetchApi('/volunteers/me/availability', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
