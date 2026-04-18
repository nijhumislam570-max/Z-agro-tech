import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

interface CheckoutFormData {
  fullName: string;
  phone: string;
  address: string;
  division: string;
  district: string;
  thana: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export const useCheckoutTracking = (
  formData: CheckoutFormData,
  items: CartItem[],
  totalAmount: number,
  paymentMethod: string
) => {
  const { user } = useAuth();
  const incompleteOrderId = useRef<string | null>(null);
  const hasCreated = useRef(false);

  // Calculate completeness percentage
  const completeness = (() => {
    let score = 0;
    if (formData.fullName.trim()) score += 20;
    if (formData.phone.trim()) score += 20;
    if (formData.address.trim()) score += 20;
    if (formData.division.trim() && formData.district.trim() && formData.thana.trim()) score += 20;
    if (paymentMethod) score += 20;
    return score;
  })();

  const debouncedCompleteness = useDebounce(completeness, 2000);
  const debouncedName = useDebounce(formData.fullName, 2000);
  const debouncedPhone = useDebounce(formData.phone, 2000);
  const debouncedAddress = useDebounce(formData.address, 2000);
  const debouncedDivision = useDebounce(formData.division, 2000);

  // Create initial record on mount
  useEffect(() => {
    if (!user || items.length === 0 || hasCreated.current) return;

    const createRecord = async () => {
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
      }
    };

    createRecord();
  }, [user, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update record when form changes (debounced)
  useEffect(() => {
    if (!incompleteOrderId.current || !user) return;

    const updateRecord = async () => {
      const shippingParts = [formData.address, formData.thana, formData.district, formData.division].filter(Boolean);
      
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
  }, [debouncedCompleteness, debouncedName, debouncedPhone, debouncedAddress, debouncedDivision, totalAmount]); // eslint-disable-line react-hooks/exhaustive-deps

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
