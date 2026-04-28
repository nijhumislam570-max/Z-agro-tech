import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import AuthPage from './AuthPage';

vi.mock('@/contexts/AuthContext', () => ({
  useAuthUser: () => null,
  useAuthLoading: () => false,
  useAuthActions: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const env = import.meta.env as Record<string, string | boolean | undefined>;
const originalSupabaseUrl = env.VITE_SUPABASE_URL;
const originalPublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

describe('AuthPage', () => {
  beforeEach(() => {
    env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    env.VITE_SUPABASE_URL = originalSupabaseUrl;
    env.VITE_SUPABASE_PUBLISHABLE_KEY = originalPublishableKey;
  });

  it('hides OAuth buttons when external providers are disabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ external: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <AuthPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: 'Google' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apple' })).not.toBeInTheDocument();
    expect(screen.queryByText(/or continue with/i)).not.toBeInTheDocument();
  });

  it('shows only the configured OAuth providers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ external: { google: { enabled: true } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <AuthPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('button', { name: 'Google' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Apple' })).not.toBeInTheDocument(),
    );
  });
});
