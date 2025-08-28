import { queryClient } from './queryClient';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function api(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error}`);
  }

  return response.json();
}

export async function apiFormData(endpoint: string, formData: FormData) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error}`);
  }

  return response.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) =>
    api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  logout: () =>
    api('/api/auth/logout', { method: 'POST' }),

  me: () =>
    api('/api/auth/me'),
};

export const medicationsApi = {
  list: () => api('/api/medications'),
  create: (medication: any) =>
    api('/api/medications', {
      method: 'POST',
      body: JSON.stringify(medication),
    }),
  logs: (id: number) => api(`/api/medications/${id}/logs`),
  logDose: (id: number, status: 'taken' | 'missed', taken_at: string) =>
    api(`/api/medications/${id}/logs`, {
      method: 'POST',
      body: JSON.stringify({ status, taken_at }),
    }),
};

export const remindersApi = {
  list: () => api('/api/reminders'),
  create: (reminder: any) =>
    api('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    }),
  update: (id: number, updates: any) =>
    api(`/api/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: number) =>
    api(`/api/reminders/${id}`, { method: 'DELETE' }),
};

export const contactsApi = {
  list: () => api('/api/contacts'),
  create: (formData: FormData) => apiFormData('/api/contacts', formData),
};

export const journalApi = {
  list: () => api('/api/journal'),
  create: (formData: FormData) => apiFormData('/api/journal', formData),
};

export const memoryApi = {
  list: () => api('/api/memory'),
  create: (formData: FormData) => apiFormData('/api/memory', formData),
};

export const locationsApi = {
  list: () => api('/api/locations'),
  logs: () => api('/api/locations/logs'),
  logLocation: (lat: number, lng: number) =>
    api('/api/locations/logs', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    }),
};

export const routinesApi = {
  list: () => api('/api/routines'),
  create: (routine: any) =>
    api('/api/routines', {
      method: 'POST',
      body: JSON.stringify(routine),
    }),
  tasks: (id: number) => api(`/api/routines/${id}/tasks`),
  createTask: (routineId: number, task: any) =>
    api(`/api/routines/${routineId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  updateTask: (taskId: number, updates: any) =>
    api(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

export const gamesApi = {
  getQuiz: () => api('/api/games/quiz'),
};

export const emergencyApi = {
  list: () => api('/api/emergency'),
  trigger: () =>
    api('/api/emergency', { method: 'POST' }),
  resolve: (id: number) =>
    api(`/api/emergency/${id}/resolve`, { method: 'POST' }),
};
