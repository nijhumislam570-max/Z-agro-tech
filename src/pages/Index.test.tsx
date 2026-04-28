import { MemoryRouter } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import Index from './Index';

vi.mock('@/components/home/HeroSection', () => ({
  default: () => <div>HeroSection</div>,
}));
vi.mock('@/components/home/PartnersStrip', () => ({
  default: () => <div>PartnersStrip</div>,
}));
vi.mock('@/components/home/FeaturedProductsGrid', () => ({
  default: () => <div>FeaturedProductsGrid</div>,
}));
vi.mock('@/components/home/CategoriesShowcase', () => ({
  default: () => <div>CategoriesShowcase</div>,
}));
vi.mock('@/components/home/FeaturedCoursesGrid', () => ({
  default: () => <div>FeaturedCoursesGrid</div>,
}));
vi.mock('@/components/home/HowItWorks', () => ({
  default: () => <div>HowItWorks</div>,
}));
vi.mock('@/components/home/Testimonials', () => ({
  default: () => <div>Testimonials</div>,
}));
vi.mock('@/components/home/TrustStatsStrip', () => ({
  default: () => <div>TrustStatsStrip</div>,
}));
vi.mock('@/components/home/NewsletterCTA', () => ({
  default: () => <div>NewsletterCTA</div>,
}));
vi.mock('@/components/home/FAQTeaser', () => ({
  default: () => <div>FAQTeaser</div>,
}));

describe('Index', () => {
  it('sets the home page title without duplicating the site name', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe(
        'Premium Agriculture Supplies & Expert Courses - Z Agro Tech',
      );
    });
  });
});
