import type { Session, User } from '@supabase/supabase-js';
import type { ProfileRow, ProfileUpdateInput } from '@/hooks/useProfile';
import type { Course } from '@/hooks/useCourses';
import type { CourseBatch } from '@/hooks/useCourseBatches';
import type { CourseNextBatch } from '@/hooks/useCourseNextBatch';
import type { Enrollment } from '@/hooks/useEnrollments';
import type { CartItem } from '@/contexts/CartContext';
import type { UserRoleType } from '@/hooks/useUserRole';

export type DemoRole = 'user';

export const DEMO_CUSTOMER_EMAIL = 'example@gmail.com';
export const DEMO_PASSWORD = 'password123';

export const DEMO_AUTH_STORAGE_KEY = 'zagrotech-demo-auth-session';

const DEMO_PROFILE_KEY_PREFIX = 'zagrotech-demo-profile:';
const DEMO_WISHLIST_KEY_PREFIX = 'zagrotech-demo-wishlist:';
const DEMO_ENROLLMENTS_KEY_PREFIX = 'zagrotech-demo-enrollments:';
const DEMO_ORDERS_KEY_PREFIX = 'zagrotech-demo-orders:';

export const DEMO_USERS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: DEMO_CUSTOMER_EMAIL,
    password: DEMO_PASSWORD,
    role: 'user',
    fullName: 'Demo Farmer',
    phone: '+8801700000001',
  },
] as const;

type DemoUserRecord = typeof DEMO_USERS[number];

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!storageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!storageAvailable()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function isLocalDemoModeEnabled() {
  if (import.meta.env.VITE_ENABLE_DEMO_AUTH === 'false') return false;
  if (typeof window === 'undefined') return import.meta.env.DEV;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

export function findDemoUserByCredentials(email: string, password: string): DemoUserRecord | null {
  if (!isLocalDemoModeEnabled()) return null;
  const normalizedEmail = email.trim().toLowerCase();
  return DEMO_USERS.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password) ?? null;
}

export function getDemoUserRole(user: User | null | undefined): UserRoleType | null {
  if (!isLocalDemoModeEnabled() || !user) return null;
  const demoUser = DEMO_USERS.find((u) => u.id === user.id || u.email.toLowerCase() === user.email?.toLowerCase());
  return demoUser?.role ?? null;
}

export function isDemoAuthUser(user: User | null | undefined) {
  return getDemoUserRole(user) !== null;
}

function buildDemoUser(record: DemoUserRecord): User {
  const now = new Date().toISOString();
  return {
    id: record.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: record.email,
    phone: record.phone,
    app_metadata: {
      provider: 'demo',
      providers: ['demo'],
      role: record.role,
    },
    user_metadata: {
      full_name: record.fullName,
      demo_role: record.role,
    },
    identities: [],
    created_at: now,
    updated_at: now,
    confirmed_at: now,
    email_confirmed_at: now,
    last_sign_in_at: now,
  } as User;
}

export function buildDemoSession(record: DemoUserRecord): Session {
  const expiresIn = 60 * 60 * 24 * 30;
  return {
    access_token: `demo-access-${record.id}`,
    refresh_token: `demo-refresh-${record.id}`,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: 'bearer',
    user: buildDemoUser(record),
  } as Session;
}

export function readStoredDemoSession(): Session | null {
  if (!isLocalDemoModeEnabled()) return null;
  const stored = readJson<Session | null>(DEMO_AUTH_STORAGE_KEY, null);
  if (!stored?.user || !isDemoAuthUser(stored.user)) return null;
  return stored;
}

export function persistDemoSession(session: Session) {
  writeJson(DEMO_AUTH_STORAGE_KEY, session);
}

export function clearDemoSession() {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}

function demoProfileKey(userId: string) {
  return `${DEMO_PROFILE_KEY_PREFIX}${userId}`;
}

export function getDemoProfile(user: User | null | undefined): ProfileRow | null {
  if (!isDemoAuthUser(user)) return null;
  const demoUser = DEMO_USERS.find((u) => u.id === user!.id || u.email.toLowerCase() === user!.email?.toLowerCase());
  if (!demoUser) return null;

  const now = new Date().toISOString();
  const base: ProfileRow = {
    id: `profile-${demoUser.id}`,
    user_id: demoUser.id,
    full_name: demoUser.fullName,
    phone: demoUser.phone,
    address: 'Demo Farm Road 12',
    division: 'Dhaka',
    district: 'Dhaka',
    thana: 'Dhanmondi',
    avatar_url: null,
    created_at: now,
    updated_at: now,
  };

  return { ...base, ...readJson<Partial<ProfileRow>>(demoProfileKey(demoUser.id), {}) };
}

export function saveDemoProfile(user: User, patch: ProfileUpdateInput): ProfileRow {
  const current = getDemoProfile(user);
  if (!current) throw new Error('Demo profile is not available');
  const next: ProfileRow = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeJson(demoProfileKey(user.id), next);
  return next;
}

function demoWishlistKey(userId: string) {
  return `${DEMO_WISHLIST_KEY_PREFIX}${userId}`;
}

export function getDemoWishlistIds(user: User | null | undefined): string[] {
  if (!isDemoAuthUser(user)) return [];
  return readJson<string[]>(demoWishlistKey(user!.id), []);
}

export function saveDemoWishlistIds(user: User, productIds: string[]) {
  writeJson(demoWishlistKey(user.id), productIds);
}

export const DEMO_COURSES: Course[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Smart Farming Foundations',
    description: 'Learn soil preparation, crop planning, irrigation basics, and practical farm record keeping for modern Bangladeshi farms.',
    price: 0,
    thumbnail_url: '/placeholder.svg',
    video_url: null,
    instructor_id: null,
    difficulty: 'beginner',
    is_active: true,
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z',
    category: 'smart_farming',
    duration_label: '4 weeks',
    mode: 'hybrid',
    audience: 'New farmers and agri-entrepreneurs',
    curriculum: [
      'Farm planning and seasonal crop calendars',
      'Soil health, compost, and nutrient basics',
      'Irrigation planning and water-saving techniques',
      'Simple digital records for costs and yields',
    ],
    whatsapp_number: '+8801349219441',
    whatsapp_message: null,
    provides_certificate: true,
    language: 'Bangla',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Plant Protection Masterclass',
    description: 'Identify common crop diseases and pests, then choose safer integrated protection strategies before yield loss spreads.',
    price: 1500,
    thumbnail_url: '/placeholder.svg',
    video_url: null,
    instructor_id: null,
    difficulty: 'intermediate',
    is_active: true,
    created_at: '2026-01-08T00:00:00.000Z',
    updated_at: '2026-01-08T00:00:00.000Z',
    category: 'plant_protection',
    duration_label: '2 weeks',
    mode: 'online',
    audience: 'Growers managing vegetables, fruits, and field crops',
    curriculum: [
      'Early pest and disease diagnosis',
      'Integrated pest management workflow',
      'Safe input selection and application timing',
      'Field scouting checklists',
    ],
    whatsapp_number: '+8801349219441',
    whatsapp_message: null,
    provides_certificate: true,
    language: 'Bangla',
  },
];

export const DEMO_COURSE_BATCHES: CourseBatch[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    course_id: DEMO_COURSES[0].id,
    name: 'May Weekend Cohort',
    start_date: '2026-05-16',
    end_date: '2026-06-06',
    total_seats: 40,
    enrolled_count: 12,
    status: 'open',
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    course_id: DEMO_COURSES[1].id,
    name: 'Plant Clinic Live Batch',
    start_date: '2026-05-20',
    end_date: '2026-06-03',
    total_seats: 30,
    enrolled_count: 21,
    status: 'filling',
    created_at: '2026-01-08T00:00:00.000Z',
    updated_at: '2026-01-08T00:00:00.000Z',
  },
];

export function getDemoCourse(courseId: string | undefined) {
  if (!isLocalDemoModeEnabled() || !courseId) return null;
  return DEMO_COURSES.find((course) => course.id === courseId) ?? null;
}

export function getDemoCourses(category?: Course['category'] | null) {
  if (!isLocalDemoModeEnabled()) return [];
  return category ? DEMO_COURSES.filter((course) => course.category === category) : DEMO_COURSES;
}

export function getDemoCourseBatches(courseId: string | undefined) {
  if (!isLocalDemoModeEnabled() || !courseId) return [];
  return DEMO_COURSE_BATCHES.filter((batch) => batch.course_id === courseId);
}

export function getDemoNextBatches(courseIds: string[]) {
  const map = new Map<string, CourseNextBatch>();
  if (!isLocalDemoModeEnabled()) return map;

  courseIds.forEach((courseId) => {
    const batch = getDemoCourseBatches(courseId).find((b) => b.status === 'open' || b.status === 'filling');
    if (batch) {
      map.set(courseId, {
        course_id: courseId,
        batch_id: batch.id,
        name: batch.name,
        start_date: batch.start_date,
        end_date: batch.end_date,
        status: batch.status,
        total_seats: batch.total_seats,
        enrolled_count: batch.enrolled_count,
      });
    }
  });

  return map;
}

function demoEnrollmentsKey(userId: string) {
  return `${DEMO_ENROLLMENTS_KEY_PREFIX}${userId}`;
}

export function getDemoEnrollments(user: User | null | undefined): Enrollment[] {
  if (!isDemoAuthUser(user)) return [];
  return readJson<Enrollment[]>(demoEnrollmentsKey(user!.id), []);
}

export function getDemoEnrollment(user: User | null | undefined, courseId: string | undefined) {
  if (!courseId) return null;
  return getDemoEnrollments(user).find((enrollment) => enrollment.course_id === courseId) ?? null;
}

export function saveDemoEnrollment(
  user: User,
  payload: { courseId: string; batchId?: string | null; contactPhone?: string | null; notes?: string | null },
) {
  const course = getDemoCourse(payload.courseId);
  const batch = getDemoCourseBatches(payload.courseId).find((b) => b.id === payload.batchId) ?? null;
  const existing = getDemoEnrollments(user).filter((e) => e.course_id !== payload.courseId);
  const enrollment: Enrollment = {
    id: crypto.randomUUID(),
    user_id: user.id,
    course_id: payload.courseId,
    enrolled_at: new Date().toISOString(),
    progress: 0,
    batch_id: payload.batchId ?? null,
    status: 'pending',
    contact_phone: payload.contactPhone ?? null,
    notes: payload.notes ?? null,
    course: course ?? undefined,
    batch,
  };
  const next = [enrollment, ...existing];
  writeJson(demoEnrollmentsKey(user.id), next);
  return enrollment;
}

export interface DemoOrder {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: CartItem[];
  tracking_id: string;
  payment_method: string;
  shipping_address: string;
  consignment_id: string | null;
  rejection_reason: string | null;
  payment_status: string;
}

function demoOrdersKey(userId: string) {
  return `${DEMO_ORDERS_KEY_PREFIX}${userId}`;
}

export function getDemoOrders(user: User | null | undefined): DemoOrder[] {
  if (!isDemoAuthUser(user)) return [];
  return readJson<DemoOrder[]>(demoOrdersKey(user!.id), []);
}

export function saveDemoOrder(
  user: User,
  payload: {
    items: CartItem[];
    totalAmount: number;
    shippingAddress: string;
    paymentMethod: string;
  },
) {
  const orderNumber = Date.now().toString().slice(-6);
  const order: DemoOrder = {
    id: crypto.randomUUID(),
    user_id: user.id,
    status: 'pending',
    total_amount: payload.totalAmount,
    created_at: new Date().toISOString(),
    items: payload.items,
    tracking_id: `ZAGRO-DEMO-${orderNumber}`,
    payment_method: payload.paymentMethod,
    shipping_address: payload.shippingAddress,
    consignment_id: null,
    rejection_reason: null,
    payment_status: payload.paymentMethod === 'cod' ? 'pending' : 'paid',
  };
  writeJson(demoOrdersKey(user.id), [order, ...getDemoOrders(user)]);
  return order;
}

export function findDemoOrder(reference: string) {
  if (!isLocalDemoModeEnabled() || !storageAvailable()) return null;
  const normalized = reference.trim().toLowerCase();
  for (const demoUser of DEMO_USERS) {
    const order = readJson<DemoOrder[]>(demoOrdersKey(demoUser.id), []).find(
      (o) => o.id.toLowerCase() === normalized || o.tracking_id.toLowerCase() === normalized,
    );
    if (order) return order;
  }
  return null;
}
