import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Calendar, Package, Shield, Building2, Settings } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import type { Notification } from '@/types/social';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const NotificationsPage = () => {
  useDocumentTitle('Notifications');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { isDoctor, isClinicOwner } = useUserRole();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'new_appointment':
        return <Calendar className="h-4 w-4 text-emerald-500" />;
      case 'order':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'verification':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'clinic':
        return <Building2 className="h-4 w-4 text-violet-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getAvatarBg = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-primary/20';
      case 'new_appointment':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'order':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'verification':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'clinic':
        return 'bg-violet-100 dark:bg-violet-900/30';
      case 'system':
        return 'bg-muted';
      default:
        return 'bg-primary/10';
    }
  };

  const getAvatarIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'new_appointment':
        return <Calendar className="h-5 w-5 text-emerald-500" />;
      case 'order':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'verification':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'clinic':
        return <Building2 className="h-5 w-5 text-violet-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type and user role
    if (notification.type === 'verification') {
      if (isDoctor) navigate('/doctor/dashboard');
      else if (isClinicOwner) navigate('/clinic/dashboard');
      else navigate('/admin/clinics');
    } else if (notification.type === 'new_appointment' && notification.target_clinic_id) {
      if (isDoctor) navigate('/doctor/dashboard');
      else navigate('/clinic/dashboard');
    } else if (notification.type === 'clinic' && notification.target_clinic_id) {
      if (isClinicOwner) navigate('/clinic/dashboard');
      else navigate('/admin/clinics');
    } else if (notification.type === 'appointment' || notification.target_appointment_id) {
      if (isDoctor) navigate('/doctor/dashboard');
      else if (isClinicOwner) navigate('/clinic/dashboard');
      else navigate('/profile?tab=appointments');
    } else if (notification.type === 'order' || notification.target_order_id) {
      if (notification.title.includes('New Order') || notification.title.includes('New order')) {
        navigate('/admin/orders');
      } else {
        navigate('/profile?tab=orders');
      }
    } else if (notification.target_post_id) {
      navigate('/feed');
    } else if (notification.target_pet_id) {
      navigate(`/pet/${notification.target_pet_id}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view notifications</h1>
          <p className="text-muted-foreground mb-6">Get updates on likes, comments, and new followers</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <main id="main-content" className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When someone interacts with your pets, you'll see it here
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-muted cursor-pointer active:scale-[0.98] ${
                      !notification.is_read ? 'bg-primary/5' : 'opacity-75'
                    }`}
                  >
                    <div className="relative">
                      {notification.actor_pet?.avatar_url || notification.type === 'like' || notification.type === 'comment' || notification.type === 'follow' ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.actor_pet?.avatar_url || ''} />
                          <AvatarFallback>
                            {notification.actor_pet?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`h-10 w-10 rounded-full ${getAvatarBg(notification.type)} flex items-center justify-center`}>
                          {getAvatarIcon(notification.type)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default NotificationsPage;
