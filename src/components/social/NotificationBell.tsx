import { Bell, Heart, MessageCircle, UserPlus, Check, Calendar, Package, ShoppingBag, Shield, Building2, Settings, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types/social';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isDoctor, isClinicOwner, isAdmin } = useUserRole();

  if (!user) return null;

  const getIcon = (type: string) => {
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
        return <Bell className="h-4 w-4" />;
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
        return <ShoppingBag className="h-5 w-5 text-orange-500" />;
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

  const handleClick = (notification: Notification) => {
    markAsRead(notification.id);
    
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-11 w-11"
          aria-label={`View notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium" aria-hidden="true">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(notification)}
                  aria-label={`${notification.title}${notification.message ? `: ${notification.message}` : ''}`}
                >
                  <div className="relative">
                    {notification.actor_pet?.avatar_url || notification.type === 'like' || notification.type === 'comment' || notification.type === 'follow' ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.actor_pet?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10">
                          {notification.actor_pet?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`h-10 w-10 rounded-full ${getAvatarBg(notification.type)} flex items-center justify-center`}>
                        {getAvatarIcon(notification.type)}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
