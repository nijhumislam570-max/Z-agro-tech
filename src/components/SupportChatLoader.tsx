import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';

const SupportChatWidget = lazy(() => import('@/components/SupportChatWidget'));

const SupportChatLoader = () => {
  const { pathname } = useLocation();
  
  // Only show on /shop routes
  if (!pathname.startsWith('/shop')) return null;
  
  return (
    <Suspense fallback={null}>
      <SupportChatWidget />
    </Suspense>
  );
};

export default SupportChatLoader;
