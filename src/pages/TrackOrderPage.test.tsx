import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import TrackOrderPage from './TrackOrderPage';

vi.mock('@/contexts/AuthContext', () => ({
  useAuthUser: () => null,
  useAuthLoading: () => false,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('TrackOrderPage', () => {
  it('requires sign-in before looking up orders', () => {
    render(
      <MemoryRouter initialEntries={['/track-order']}>
        <TrackOrderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in to track orders/i })).toBeInTheDocument();
    expect(screen.queryByText(/no sign-in is needed/i)).not.toBeInTheDocument();
  });
});
