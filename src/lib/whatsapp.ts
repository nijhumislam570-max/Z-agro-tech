/**
 * WhatsApp helpers — generates wa.me links with prefilled enrollment messages.
 */

const DEFAULT_WHATSAPP_NUMBER = '+8801763585500';

/** Strip leading + and any non-digits to satisfy wa.me URL format. */
function normalizeNumber(num?: string | null): string {
  const raw = (num || DEFAULT_WHATSAPP_NUMBER).replace(/[^\d]/g, '');
  return raw;
}

export interface BuildWaUrlOpts {
  number?: string | null;
  courseTitle?: string | null;
  batchName?: string | null;
  customMessage?: string | null;
  contactName?: string | null;
}

export function buildWhatsAppUrl({
  number,
  courseTitle,
  batchName,
  customMessage,
  contactName,
}: BuildWaUrlOpts): string {
  const phone = normalizeNumber(number);

  let text = customMessage?.trim();
  if (!text) {
    const lines: string[] = ['Assalamu Alaikum,', ''];
    lines.push(
      `I'm interested in enrolling${courseTitle ? ` in the "${courseTitle}" course` : ''}${
        batchName ? ` (${batchName})` : ''
      }.`,
    );
    if (contactName) lines.push(`Name: ${contactName}`);
    lines.push('', 'Please share more details. Thank you.');
    text = lines.join('\n');
  } else if (courseTitle || batchName) {
    text = `${text}\n\nCourse: ${courseTitle ?? ''}${batchName ? ` — ${batchName}` : ''}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export { DEFAULT_WHATSAPP_NUMBER };
