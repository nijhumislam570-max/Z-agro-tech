
-- TRG-2: Notify clinic owner and doctor when appointment is booked
CREATE OR REPLACE FUNCTION public.notify_on_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clinic_owner_id uuid;
  v_doctor_user_id uuid;
  v_clinic_name text;
BEGIN
  -- Get clinic owner
  SELECT owner_user_id, name INTO v_clinic_owner_id, v_clinic_name
  FROM public.clinics WHERE id = NEW.clinic_id;

  -- Notify clinic owner
  IF v_clinic_owner_id IS NOT NULL AND v_clinic_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, target_appointment_id, target_clinic_id)
    VALUES (
      v_clinic_owner_id,
      'appointment',
      '📅 New Appointment Booked',
      'A new appointment for ' || COALESCE(NEW.pet_name, 'a pet') || ' on ' || NEW.appointment_date::text || ' at ' || NEW.appointment_time,
      NEW.id,
      NEW.clinic_id
    );
  END IF;

  -- Notify assigned doctor
  IF NEW.doctor_id IS NOT NULL THEN
    SELECT user_id INTO v_doctor_user_id FROM public.doctors WHERE id = NEW.doctor_id;
    IF v_doctor_user_id IS NOT NULL AND v_doctor_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, target_appointment_id, target_clinic_id)
      VALUES (
        v_doctor_user_id,
        'appointment',
        '📅 New Patient Appointment',
        'You have a new appointment for ' || COALESCE(NEW.pet_name, 'a pet') || ' on ' || NEW.appointment_date::text || ' at ' || NEW.appointment_time,
        NEW.id,
        NEW.clinic_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_appointment();

-- TRG-3: Notify all admins when a new order is placed
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  FOR v_admin_user_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    IF v_admin_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, target_order_id)
      VALUES (
        v_admin_user_id,
        'order',
        '🛒 New Order Received',
        'New order #' || LEFT(NEW.id::text, 8) || ' for ৳' || NEW.total_amount::text,
        NEW.id
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_new_order();

-- TRG-4: Notify user when their order status changes
CREATE OR REPLACE FUNCTION public.notify_user_on_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'accepted' THEN
        v_title := '✅ Order Accepted';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been accepted and is being processed.';
      WHEN 'shipped' THEN
        v_title := '🚚 Order Shipped';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been shipped!';
      WHEN 'delivered' THEN
        v_title := '📦 Order Delivered';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been delivered. Enjoy!';
      WHEN 'rejected' THEN
        v_title := '❌ Order Rejected';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' was rejected.' || COALESCE(' Reason: ' || NEW.rejection_reason, '');
      WHEN 'cancelled' THEN
        v_title := '🚫 Order Cancelled';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been cancelled.';
      ELSE
        v_title := '📋 Order Updated';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' status changed to ' || NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, type, title, message, target_order_id)
    VALUES (NEW.user_id, 'order', v_title, v_message, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_user_on_order_update
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_order_update();
