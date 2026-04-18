import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'appointment' | 'order' | 'verification' | 'new_appointment' | 'clinic' | 'system';
  title: string;
  message?: string;
  actorPetId?: string;
  targetPostId?: string;
  targetPetId?: string;
  targetOrderId?: string;
  targetAppointmentId?: string;
  targetClinicId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actor_pet_id: params.actorPetId,
        target_post_id: params.targetPostId,
        target_pet_id: params.targetPetId,
        target_order_id: params.targetOrderId,
        target_appointment_id: params.targetAppointmentId,
        target_clinic_id: params.targetClinicId,
      });

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating notification:', error);
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating notification:', error);
    }
  }
};

// Get post owner's user_id for notifications
export const getPostOwnerUserId = async (postId: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
    
    return data?.user_id || null;
  } catch {
    return null;
  }
};

// Get pet owner's user_id for notifications
export const getPetOwnerUserId = async (petId: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single();
    
    return data?.user_id || null;
  } catch {
    return null;
  }
};

// Get clinic owner's user_id for notifications
export const getClinicOwnerUserId = async (clinicId: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('clinics')
      .select('owner_user_id')
      .eq('id', clinicId)
      .single();
    
    return data?.owner_user_id || null;
  } catch {
    return null;
  }
};

// Get all admin user IDs for notifications
export const getAdminUserIds = async (): Promise<string[]> => {
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    
    return data?.map(r => r.user_id) || [];
  } catch {
    return [];
  }
};

// Create appointment status notification
export const createAppointmentNotification = async (params: {
  userId: string;
  appointmentId: string;
  clinicName: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  appointmentDate: string;
  appointmentTime: string;
}) => {
  const titles: Record<string, string> = {
    confirmed: '✅ Appointment Confirmed!',
    cancelled: '❌ Appointment Cancelled',
    completed: '🎉 Appointment Completed'
  };
  
  const messages: Record<string, string> = {
    confirmed: `Your appointment at ${params.clinicName} on ${params.appointmentDate} at ${params.appointmentTime} has been confirmed.`,
    cancelled: `Your appointment at ${params.clinicName} on ${params.appointmentDate} at ${params.appointmentTime} has been cancelled.`,
    completed: `Your appointment at ${params.clinicName} is complete. We hope your pet feels better!`
  };
  
  await createNotification({
    userId: params.userId,
    type: 'appointment',
    title: titles[params.status],
    message: messages[params.status],
    targetAppointmentId: params.appointmentId,
  });
};

// Create order status notification
export const createOrderNotification = async (params: {
  userId: string;
  orderId: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderTotal: number;
}) => {
  const titles: Record<string, string> = {
    processing: '📦 Order Processing',
    shipped: '🚚 Order Shipped!',
    delivered: '✅ Order Delivered!',
    cancelled: '❌ Order Cancelled'
  };
  
  const messages: Record<string, string> = {
    processing: `Your order of ৳${params.orderTotal.toLocaleString()} is being processed and will be shipped soon.`,
    shipped: `Your order of ৳${params.orderTotal.toLocaleString()} has been shipped and is on its way!`,
    delivered: `Your order of ৳${params.orderTotal.toLocaleString()} has been delivered. Enjoy!`,
    cancelled: `Your order of ৳${params.orderTotal.toLocaleString()} has been cancelled.`
  };
  
  await createNotification({
    userId: params.userId,
    type: 'order',
    title: titles[params.status],
    message: messages[params.status],
    targetOrderId: params.orderId,
  });
};

// Create clinic verification status notification (for clinic owners)
export const createClinicVerificationNotification = async (params: {
  userId: string;
  clinicId: string;
  clinicName: string;
  status: 'approved' | 'rejected' | 'blocked' | 'unblocked';
  reason?: string;
}) => {
  const titles: Record<string, string> = {
    approved: '🎉 Clinic Verified!',
    rejected: '❌ Verification Rejected',
    blocked: '🚫 Clinic Blocked',
    unblocked: '✅ Clinic Unblocked'
  };
  
  const messages: Record<string, string> = {
    approved: `Congratulations! Your clinic "${params.clinicName}" has been verified. You now have full access to the clinic management system.`,
    rejected: `Your clinic verification for "${params.clinicName}" was rejected.${params.reason ? ` Reason: ${params.reason}` : ''} Please review and resubmit.`,
    blocked: `Your clinic "${params.clinicName}" has been blocked.${params.reason ? ` Reason: ${params.reason}` : ''}`,
    unblocked: `Your clinic "${params.clinicName}" has been unblocked. You can now access your clinic dashboard.`
  };
  
  await createNotification({
    userId: params.userId,
    type: 'verification',
    title: titles[params.status],
    message: messages[params.status],
    targetClinicId: params.clinicId,
  });
};

// Create new appointment notification (for clinic owners)
export const createNewAppointmentNotification = async (params: {
  clinicOwnerId: string;
  appointmentId: string;
  clinicId: string;
  clinicName: string;
  petName: string;
  petType: string;
  appointmentDate: string;
  appointmentTime: string;
}) => {
  await createNotification({
    userId: params.clinicOwnerId,
    type: 'new_appointment',
    title: '📅 New Appointment Booked!',
    message: `${params.petName} (${params.petType}) has booked an appointment at "${params.clinicName}" on ${params.appointmentDate} at ${params.appointmentTime}.`,
    targetAppointmentId: params.appointmentId,
    targetClinicId: params.clinicId,
  });
};

// Create appointment confirmation notification (for pet parent)
export const createAppointmentConfirmationNotification = async (params: {
  userId: string;
  appointmentId: string;
  clinicName: string;
  appointmentDate: string;
  appointmentTime: string;
}) => {
  await createNotification({
    userId: params.userId,
    type: 'appointment',
    title: '📅 Appointment Booked!',
    message: `Your appointment at "${params.clinicName}" on ${params.appointmentDate} at ${params.appointmentTime} has been successfully booked. We'll notify you when it's confirmed.`,
    targetAppointmentId: params.appointmentId,
  });
};

// Create admin notification (for all admins)
export const createAdminNotification = async (params: {
  type: 'new_order' | 'new_verification' | 'system';
  title: string;
  message: string;
  targetOrderId?: string;
  targetClinicId?: string;
  targetDoctorId?: string;
}) => {
  const adminIds = await getAdminUserIds();
  
  for (const adminId of adminIds) {
    await createNotification({
      userId: adminId,
      type: params.type === 'new_order' ? 'order' : params.type === 'new_verification' ? 'verification' : 'system',
      title: params.title,
      message: params.message,
      targetOrderId: params.targetOrderId,
      targetClinicId: params.targetClinicId,
    });
  }
};

// Notify all admins of new order
export const notifyAdminsOfNewOrder = async (params: {
  orderId: string;
  orderTotal: number;
  itemCount: number;
}) => {
  await createAdminNotification({
    type: 'new_order',
    title: '🛒 New Order Received!',
    message: `New order received: ৳${params.orderTotal.toLocaleString()} (${params.itemCount} item${params.itemCount > 1 ? 's' : ''})`,
    targetOrderId: params.orderId,
  });
};

// Notify all admins of new clinic verification request
export const notifyAdminsOfNewVerification = async (params: {
  clinicId: string;
  clinicName: string;
  ownerName: string;
}) => {
  await createAdminNotification({
    type: 'new_verification',
    title: '🏥 New Verification Request',
    message: `"${params.clinicName}" by ${params.ownerName} has submitted a verification request.`,
    targetClinicId: params.clinicId,
  });
};
