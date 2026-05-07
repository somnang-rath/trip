import { useAuthStore } from '../../store/auth.store';
import type { User } from '../../types/auth.types';

const MOCK_USER: User = {
  _id: 'u1',
  name: 'Bob',
  email: 'bob@test.com',
  avatar: null,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('starts in unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuth stores user, token, and sets isAuthenticated', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'access-token-abc');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(MOCK_USER);
    expect(state.accessToken).toBe('access-token-abc');
  });

  it('clearAuth resets all fields to initial values', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'access-token-abc');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAccessToken updates token without touching user or isAuthenticated', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'old-token');
    useAuthStore.getState().setAccessToken('new-token');
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-token');
    expect(state.user).toEqual(MOCK_USER);
    expect(state.isAuthenticated).toBe(true);
  });
});
