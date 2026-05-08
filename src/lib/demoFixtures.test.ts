import { buildDemoSession, DEMO_PASSWORD, findDemoOrder, findDemoUserByCredentials, saveDemoOrder } from './demoFixtures';

beforeEach(() => {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    },
  });
});

describe('demoFixtures', () => {
  it('does not accept local demo admin credentials without a real backend session', () => {
    expect(findDemoUserByCredentials('admin@example.com', DEMO_PASSWORD)).toBeNull();
  });

  it('still accepts the local customer demo credentials', () => {
    expect(findDemoUserByCredentials('example@gmail.com', DEMO_PASSWORD)?.role).toBe('user');
  });

  it('saves demo orders with references that the tracking page can resolve', () => {
    const demoUser = findDemoUserByCredentials('example@gmail.com', DEMO_PASSWORD);
    expect(demoUser).not.toBeNull();

    const session = buildDemoSession(demoUser!);
    const order = saveDemoOrder(session.user, {
      items: [
        {
          id: 'product-1',
          name: 'Demo Product',
          price: 100,
          quantity: 1,
          image: '/placeholder.svg',
          category: 'Demo',
        },
      ],
      totalAmount: 160,
      shippingAddress: 'Demo Customer, Dhaka',
      paymentMethod: 'cod',
    });

    expect(findDemoOrder(order.id)?.id).toBe(order.id);
    expect(findDemoOrder(order.tracking_id)?.id).toBe(order.id);
  });
});
