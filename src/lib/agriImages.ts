// Curated Unsplash imagery for agri products & courses (with sensible fallbacks).
// Using `?w=800&q=80&auto=format&fit=crop` for compact, optimized delivery.

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const AGRI_IMAGES = {
  product: {
    seed: u('photo-1574323347407-f5e1ad6d020b'),
    fertilizer: u('photo-1625246333195-78d9c38ad449'),
    pesticide: u('photo-1592982537447-7440770faae9'),
    tool: u('photo-1585320806297-9794b3e4eeae'),
    irrigation: u('photo-1500382017468-9049fed747ef'),
    livestock: u('photo-1500595046743-cd271d694d30'),
    default: u('photo-1500382017468-9049fed747ef'),
  },
  course: {
    plant_doctor: u('photo-1530836369250-ef72a3f5cda8'),
    smart_farming: u('photo-1574943320219-5630bb4c2d7d'),
    organic: u('photo-1464226184884-fa280b87c399'),
    urban_farming: u('photo-1592419044706-39796d40f98c'),
    plant_protection: u('photo-1530507629858-e3759c3030dd'),
    soil_health: u('photo-1416879595882-3373a0480b5b'),
    livestock: u('photo-1605185189453-f7a3a5b69dfd'),
    default: u('photo-1500595046743-cd271d694d30'),
  },
} as const;

const PRODUCT_KEYWORDS: Array<[RegExp, keyof typeof AGRI_IMAGES.product]> = [
  [/seed|বীজ/i, 'seed'],
  [/fertili[sz]er|urea|npk|সার/i, 'fertilizer'],
  [/pestici|insectici|fungici|herbici|কীটনাশক/i, 'pesticide'],
  [/tool|spray|equipment|যন্ত্র/i, 'tool'],
  [/irriga|pump|water|সেচ/i, 'irrigation'],
  [/feed|cattle|poultry|fish|গবাদি|মাছ/i, 'livestock'],
];

const COURSE_KEYWORDS: Array<[RegExp, keyof typeof AGRI_IMAGES.course]> = [
  [/plant.?doctor|disease|pathology|রোগ/i, 'plant_doctor'],
  [/smart|precision|tech|digital/i, 'smart_farming'],
  [/organic|sustain|jaivik/i, 'organic'],
  [/urban|rooftop|hydropon/i, 'urban_farming'],
  [/protect|pest|ipm/i, 'plant_protection'],
  [/soil|fertility|মাটি/i, 'soil_health'],
  [/livestock|poultry|cattle|fish|dairy/i, 'livestock'],
];

export function getProductImage(name?: string | null, category?: string | null): string {
  const haystack = `${category ?? ''} ${name ?? ''}`.toLowerCase();
  for (const [re, key] of PRODUCT_KEYWORDS) {
    if (re.test(haystack)) return AGRI_IMAGES.product[key];
  }
  return AGRI_IMAGES.product.default;
}

export function getCourseImage(title?: string | null, category?: string | null): string {
  const haystack = `${category ?? ''} ${title ?? ''}`.toLowerCase();
  for (const [re, key] of COURSE_KEYWORDS) {
    if (re.test(haystack)) return AGRI_IMAGES.course[key];
  }
  return AGRI_IMAGES.course.default;
}
