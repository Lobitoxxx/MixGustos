import { create } from 'zustand';
import { api } from '../api/client.js';

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem('mg_user') || 'null');
  } catch {
    return null;
  }
}

export const useAuth = create((set) => ({
  token: localStorage.getItem('mg_token'),
  user: loadUser(),
  loading: false,

  async login(usuario, password) {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { usuario, password });
      localStorage.setItem('mg_token', res.token);
      localStorage.setItem('mg_user', JSON.stringify(res.user));
      set({ token: res.token, user: res.user });
      return res.user;
    } finally {
      set({ loading: false });
    }
  },

  async refresh() {
    try {
      const { user } = await api.get('/auth/me');
      localStorage.setItem('mg_user', JSON.stringify(user));
      set({ user });
      return user;
    } catch {
      return null;
    }
  },

  async updateProfile(patch) {
    const res = await api.put('/perfil', patch);
    localStorage.setItem('mg_user', JSON.stringify(res));
    set({ user: res });
    return res;
  },

  logout() {
    localStorage.removeItem('mg_token');
    localStorage.removeItem('mg_user');
    set({ token: null, user: null });
  },

  has(permiso) {
    const { user } = useAuth.getState();
    if (!user) return false;
    if (user.rol === 'ADMINISTRADOR') return true;
    return user.permisos?.includes(permiso) || false;
  },
}));
