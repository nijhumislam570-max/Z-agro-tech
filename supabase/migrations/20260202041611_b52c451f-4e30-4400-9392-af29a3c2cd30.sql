-- Performance indexes for common query patterns

-- Appointments performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date 
ON appointments(clinic_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
ON appointments(doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_user_created 
ON appointments(user_id, created_at DESC);

-- Posts feed performance
CREATE INDEX IF NOT EXISTS idx_posts_pet_created 
ON posts(pet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_created
ON posts(user_id, created_at DESC);

-- Likes performance
CREATE INDEX IF NOT EXISTS idx_likes_user_post 
ON likes(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_likes_post_id
ON likes(post_id);

-- Orders performance
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_created
ON orders(created_at DESC);

-- Doctor search performance
CREATE INDEX IF NOT EXISTS idx_doctors_verified_available 
ON doctors(is_verified, is_available) WHERE is_verified = true AND is_blocked = false;

-- Clinic search performance
CREATE INDEX IF NOT EXISTS idx_clinics_verified_open
ON clinics(is_verified, is_open) WHERE is_verified = true AND is_blocked IS NOT TRUE;

-- Notifications performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON notifications(user_id, is_read, created_at DESC);

-- Messages performance  
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at);

-- Clinic doctors performance
CREATE INDEX IF NOT EXISTS idx_clinic_doctors_clinic_status
ON clinic_doctors(clinic_id, status);

-- Doctor schedules performance
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_clinic_doctor
ON doctor_schedules(clinic_id, doctor_id, day_of_week);