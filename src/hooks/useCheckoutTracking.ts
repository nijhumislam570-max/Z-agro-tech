import { useEffect, useRef, useCallback } from 'react';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import type { CheckoutFormData } from '@/lib/validations';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

/**
 * Tracks abandoned-checkout state by inserting/updating an `incomplete_orders`
 * row as the user fills the form. Uses field-scoped `useWatch` selectors so we
 * don't re-render the whole page on every keystroke and don't rely on the
 * fragile `getValues()`-on-every-render pattern.
 */
export const useCheckoutTracking = (
  control: Control<CheckoutFormData>,
  items: CartItem[],
  totalAmount: number,
  paymentMethod: string
) => {
  const { user } = useAuth();
  const incompleteOrderId = useRef<string | null>(null);
  const hasCreated = useRef(false);
  const isCreating = useRef(false);

  // Field-scoped subscriptions — only this hook re-runs on field change.
  const fullName = useWatch({ control, name: 'fullName' }) || '';
  const phone = useWatch({ control, name: 'phone' }) || '';
  const address = useWatch({ control, name: 'address' }) || '';
  const division = useWatch({ control, name: 'division' }) || '';
  const district = useWatch({ control, name: 'district' }) || '';
  const thana = useWatch({ control, name: 'thana' }) || '';

  // Calculate completeness percentage
  const completeness = (() => {
    let score = 0;
    if (fullName.trim()) score += 20;
    if (phone.trim()) score += 20;
    if (address.trim()) score += 20;
    if (division.trim() && district.trim() && thana.trim()) score += 20;
    if (paymentMethod) score += 20;
    return score;
  })();

  const debouncedCompleteness = useDebounce(completeness, 2000);
  const debouncedName = useDebounce(fullName, 2000);
  const debouncedPhone = useDebounce(phone, 2000);
  const debouncedAddress = useDebounce(address, 2000);
  const debouncedDivision = useDebounce(division, 2000);
  const debouncedDistrict = useDebounce(district, 2000);
  const debouncedThana = useDebounce(thana, 2000);

  // Create initial record only when we have a non-empty cart and a signed-in user.
  // If the cart is emptied (e.g. user removes all items), reset so a new record
  // can be created if items reappear later.
  useEffect(() => {
    if (!user) {
      hasCreated.current = false;
      incompleteOrderId.current = null;
      isCreating.current = false;
      return;
    }

    if (items.length === 0) {
      hasCreated.current = false;
      incompleteOrderId.current = null;
      isCreating.current = false;
      return;
    }

    if (hasCreated.current || isCreating.current) return;

    const createRecord = async () => {
      isCreating.current = true;
      try {
        const { data, error } = await supabase
          .from('incomplete_orders')
          .insert({
            user_id: user.id,
            customer_email: user.email || null,
            items: JSON.parse(JSON.stringify(items)),
            cart_total: totalAmount,
            completeness: 0,
            status: 'incomplete',
          })
          .select('id')
          .single();

        if (!error && data) {
          incompleteOrderId.current = data.id;
          hasCreated.current = true;
        }
      } catch {
        // Silent fail - tracking is non-critical
      } finally {
        isCreating.current = false;
      }
    };

    createRecord();
  }, [items, totalAmount, user]);

  // Update record when debounced field values change.
  useEffect(() => {
    if (!incompleteOrderId.current || !user) return;

    const updateRecord = async () => {
      const shippingParts = [debouncedAddress, debouncedThana, debouncedDistrict, debouncedDivision].filter(Boolean);

      await supabase
        .from('incomplete_orders')
        .update({
          customer_name: debouncedName || null,
          customer_phone: debouncedPhone || null,
          shipping_address: shippingParts.length > 0 ? shippingParts.join(', ') : null,
          division: debouncedDivision || null,
          completeness: debouncedCompleteness,
          cart_total: totalAmount,
          items: JSON.parse(JSON.stringify(items)),
        })
        .eq('id', incompleteOrderId.current);
    };

    updateRecord();
  }, [
    debouncedCompleteness,
    debouncedName,
    debouncedPhone,
    debouncedAddress,
    debouncedDivision,
    debouncedDistrict,
    debouncedThana,
    items,
    totalAmount,
    user,
  ]);

  // Mark as recovered when order completes
  const markRecovered = useCallback(async (orderId: string) => {
    if (!incompleteOrderId.current) return;
    try {
      await supabase
        .from('incomplete_orders')
        .update({
          status: 'recovered',
          recovered_order_id: orderId,
        })
        .eq('id', incompleteOrderId.current);
    } catch {
      // Silent fail
    }
  }, []);

  return { markRecovered, incompleteOrderId: incompleteOrderId.current };
};
