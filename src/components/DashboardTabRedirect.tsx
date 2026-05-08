import { Navigate } from 'react-router-dom';

interface DashboardTabRedirectProps {
  tab: 'orders' | 'courses' | 'wishlist' | 'profile';
}

const DashboardTabRedirect = ({ tab }: DashboardTabRedirectProps) => (
  <Navigate to={{ pathname: '/dashboard', search: `?tab=${tab}` }} replace />
);

export default DashboardTabRedirect;
