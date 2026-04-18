// Fraud Detection Engine - Rule-based heuristic scoring for order risk analysis

export interface FraudSignal {
  id: string;
  label: string;
  description: string;
  points: number;
  icon: 'address' | 'phone' | 'name' | 'repeat' | 'cancel' | 'amount';
}

export interface FraudAnalysis {
  score: number;
  level: 'low' | 'medium' | 'high';
  signals: FraudSignal[];
  recommendation: string;
}

export interface OrderProfile {
  full_name: string | null;
  phone: string | null;
}

// --- Heuristic functions ---

/**
 * Detects gibberish text by analyzing character patterns:
 * - High ratio of consonant clusters (3+ consonants in a row)
 * - Repeated characters (3+ same char)
 * - Very low vowel-to-consonant ratio
 */
export function isGibberishText(text: string): { isGibberish: boolean; reason: string } {
  if (!text || text.trim().length < 3) {
    return { isGibberish: false, reason: '' };
  }

  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length < 3) {
    return { isGibberish: false, reason: '' };
  }

  const vowels = cleaned.replace(/[^aeiou]/g, '').length;
  const vowelRatio = vowels / cleaned.length;

  // Check for repeated characters (e.g., "aaaaaa", "bbbbb")
  const repeatedMatch = cleaned.match(/(.)\1{2,}/g);
  if (repeatedMatch && repeatedMatch.some(m => m.length >= 3)) {
    return { isGibberish: true, reason: `Repeated characters detected: "${repeatedMatch[0]}"` };
  }

  // Check for consonant clusters (3+ consonants with no vowels)
  const consonantClusters = cleaned.match(/[^aeiou]{4,}/g);
  if (consonantClusters && consonantClusters.length >= 2) {
    return { isGibberish: true, reason: `Multiple consonant clusters: "${consonantClusters.join('", "')}"` };
  }

  // Very low vowel ratio suggests random typing
  if (vowelRatio < 0.15 && cleaned.length > 5) {
    return { isGibberish: true, reason: `Very low vowel ratio (${(vowelRatio * 100).toFixed(0)}%)` };
  }

  return { isGibberish: false, reason: '' };
}

/**
 * Validates Bangladesh phone format: 01XXXXXXXXX (11 digits starting with 01)
 */
export function isValidBDPhone(phone: string): { isValid: boolean; reason: string } {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, reason: 'No phone number provided' };
  }

  // Strip spaces, dashes, plus signs
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');

  // Bangladesh format: 01XXXXXXXXX (11 digits)
  // Also accept +880 prefix
  const bdPattern = /^(?:880|0)1[3-9]\d{8}$/;

  if (!bdPattern.test(cleaned)) {
    return { isValid: false, reason: `Invalid format: "${phone}"` };
  }

  return { isValid: true, reason: '' };
}

/**
 * Parses shipping address string to extract name, phone, and address parts.
 * Common format: "Name, Phone, Address Line 1, City, District, Division"
 */
export function parseShippingAddress(address: string | null): {
  name: string;
  phone: string;
  addressParts: string[];
} {
  if (!address) return { name: '', phone: '', addressParts: [] };

  const parts = address.split(',').map(p => p.trim());

  // First part is typically the name
  const name = parts[0] || '';

  // Look for phone number in the parts
  const phonePattern = /^[\d\+\-\s\(\)]{7,15}$/;
  let phone = '';
  let addressStartIdx = 1;

  for (let i = 1; i < Math.min(parts.length, 3); i++) {
    if (phonePattern.test(parts[i]?.trim())) {
      phone = parts[i].trim();
      addressStartIdx = i + 1;
      break;
    }
  }

  const addressParts = parts.slice(addressStartIdx);

  return { name, phone, addressParts };
}

/**
 * Checks for name mismatch between shipping name and profile name.
 * Uses simple word overlap comparison.
 */
export function checkNameMismatch(
  shippingName: string,
  profileName: string | null
): { isMismatch: boolean; reason: string } {
  if (!profileName || !shippingName) {
    return { isMismatch: false, reason: '' };
  }

  const normalize = (name: string) =>
    name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/);

  const shippingWords = normalize(shippingName);
  const profileWords = normalize(profileName);

  if (shippingWords.length === 0 || profileWords.length === 0) {
    return { isMismatch: false, reason: '' };
  }

  // Check if any word overlaps
  const hasOverlap = shippingWords.some(w => profileWords.includes(w));

  if (!hasOverlap) {
    return {
      isMismatch: true,
      reason: `Shipping name "${shippingName}" doesn't match profile name "${profileName}"`,
    };
  }

  return { isMismatch: false, reason: '' };
}

/**
 * Checks if the same user placed another order within 1 hour of this one.
 */
export function checkRapidOrders(
  userOrders: Array<{ id: string; created_at: string; items: any; shipping_address: string | null }>,
  currentOrder: { id: string; created_at: string }
): { isRapid: boolean; reason: string } {
  if (userOrders.length < 2) {
    return { isRapid: false, reason: '' };
  }

  const currentTime = new Date(currentOrder.created_at).getTime();
  const oneHour = 60 * 60 * 1000;

  const nearbyOrders = userOrders.filter(o => {
    if (o.id === currentOrder.id) return false;
    const orderTime = new Date(o.created_at).getTime();
    return Math.abs(currentTime - orderTime) < oneHour;
  });

  if (nearbyOrders.length > 0) {
    return {
      isRapid: true,
      reason: `${nearbyOrders.length} other order(s) placed within 1 hour`,
    };
  }

  return { isRapid: false, reason: '' };
}

/**
 * Calculates historical cancellation/rejection rate for a user's orders.
 */
export function checkCancellationRate(
  userOrders: Array<{ status: string | null }>
): { isHigh: boolean; rate: number; reason: string } {
  if (userOrders.length < 2) {
    return { isHigh: false, rate: 0, reason: '' };
  }

  const cancelled = userOrders.filter(
    o => o.status === 'cancelled' || o.status === 'rejected'
  ).length;
  const rate = cancelled / userOrders.length;

  if (rate > 0.5) {
    return {
      isHigh: true,
      rate,
      reason: `${(rate * 100).toFixed(0)}% of orders cancelled/rejected (${cancelled}/${userOrders.length})`,
    };
  }

  return { isHigh: false, rate, reason: '' };
}

/**
 * Checks if address parts are suspiciously short.
 */
function checkShortAddressParts(addressParts: string[]): { isShort: boolean; reason: string } {
  if (addressParts.length === 0) return { isShort: false, reason: '' };

  const shortParts = addressParts.filter(p => p.length > 0 && p.length < 3);
  if (shortParts.length >= 2) {
    return {
      isShort: true,
      reason: `Multiple very short address fields: "${shortParts.join('", "')}"`,
    };
  }

  return { isShort: false, reason: '' };
}

// --- Main analysis function ---

export function analyzeFraudRisk(
  order: {
    id: string;
    user_id: string;
    shipping_address: string | null;
    total_amount: number;
    created_at: string;
    status: string | null;
    items: any;
  },
  profile: OrderProfile | null,
  userOrders: Array<{
    id: string;
    user_id: string;
    created_at: string;
    status: string | null;
    total_amount: number;
    shipping_address: string | null;
    items: any;
  }>
): FraudAnalysis {
  let score = 0;
  const signals: FraudSignal[] = [];

  const parsed = parseShippingAddress(order.shipping_address);

  // 1. Gibberish address check (+30)
  const allAddressText = [...parsed.addressParts, parsed.name].join(' ');
  const gibberishCheck = isGibberishText(allAddressText);
  if (gibberishCheck.isGibberish) {
    score += 30;
    signals.push({
      id: 'gibberish_address',
      label: 'Gibberish Address',
      description: gibberishCheck.reason,
      points: 30,
      icon: 'address',
    });
  }

  // 2. Invalid phone (+25)
  const phoneCheck = isValidBDPhone(parsed.phone);
  if (!phoneCheck.isValid && parsed.phone) {
    score += 25;
    signals.push({
      id: 'invalid_phone',
      label: 'Invalid Phone Number',
      description: phoneCheck.reason,
      points: 25,
      icon: 'phone',
    });
  }

  // 3. Name mismatch (+15)
  if (profile) {
    const nameCheck = checkNameMismatch(parsed.name, profile.full_name);
    if (nameCheck.isMismatch) {
      score += 15;
      signals.push({
        id: 'name_mismatch',
        label: 'Name Mismatch',
        description: nameCheck.reason,
        points: 15,
        icon: 'name',
      });
    }
  }

  // 4. Rapid repeat orders (+20)
  const rapidCheck = checkRapidOrders(userOrders, order);
  if (rapidCheck.isRapid) {
    score += 20;
    signals.push({
      id: 'rapid_orders',
      label: 'Rapid Repeat Order',
      description: rapidCheck.reason,
      points: 20,
      icon: 'repeat',
    });
  }

  // 5. High cancellation rate (+15)
  const cancelCheck = checkCancellationRate(userOrders);
  if (cancelCheck.isHigh) {
    score += 15;
    signals.push({
      id: 'high_cancellation',
      label: 'High Cancellation Rate',
      description: cancelCheck.reason,
      points: 15,
      icon: 'cancel',
    });
  }

  // 6. Suspicious short address parts (+20)
  const shortCheck = checkShortAddressParts(parsed.addressParts);
  if (shortCheck.isShort) {
    score += 20;
    signals.push({
      id: 'short_address',
      label: 'Suspicious Address Length',
      description: shortCheck.reason,
      points: 20,
      icon: 'address',
    });
  }

  // 7. Very high first order (+10)
  const isFirstOrder = userOrders.length <= 1;
  if (isFirstOrder && order.total_amount > 5000) {
    score += 10;
    signals.push({
      id: 'high_first_order',
      label: 'High Value First Order',
      description: `First order with ৳${order.total_amount} (threshold: ৳5,000)`,
      points: 10,
      icon: 'amount',
    });
  }

  // Determine risk level
  let level: 'low' | 'medium' | 'high';
  let recommendation: string;

  if (score >= 40) {
    level = 'high';
    recommendation = 'This order has multiple fraud indicators. Consider rejecting or verifying with the customer before processing.';
  } else if (score >= 20) {
    level = 'medium';
    recommendation = 'This order has some suspicious signals. Review the details carefully before accepting.';
  } else {
    level = 'low';
    recommendation = 'This order appears normal. No significant fraud indicators detected.';
  }

  return { score, level, signals, recommendation };
}
