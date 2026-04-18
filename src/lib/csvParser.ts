import { z } from 'zod';

// Zod schema for product validation - prevents XSS and ensures data integrity
export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .regex(/^[^<>]*$/, 'Name cannot contain < or > characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .regex(/^[^<>]*$/, 'Description cannot contain < or > characters')
    .optional()
    .nullable(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(9999999, 'Price must be less than 10,000,000'),
  category: z.enum(['Pet', 'Farm'], { 
    errorMap: () => ({ message: 'Category must be "Pet" or "Farm"' }) 
  }),
  product_type: z
    .string()
    .max(100, 'Product type must be less than 100 characters')
    .regex(/^[^<>]*$/, 'Product type cannot contain < or > characters')
    .optional()
    .nullable(),
  stock: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock must be less than 1,000,000')
    .optional()
    .default(100),
  badge: z
    .string()
    .max(50, 'Badge must be less than 50 characters')
    .regex(/^[^<>]*$/, 'Badge cannot contain < or > characters')
    .optional()
    .nullable(),
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url('Image URL must be a valid URL')
    .optional()
    .nullable(),
});

export type ProductCSVRow = z.infer<typeof productSchema>;

export interface ParseResult {
  success: boolean;
  data: ProductCSVRow[];
  errors: { row: number; message: string }[];
}

// Sanitize string to prevent XSS - removes potential script injection
function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

export function parseCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split('\n');
  const errors: { row: number; message: string }[] = [];
  const data: ProductCSVRow[] = [];

  if (lines.length < 2) {
    return { success: false, data: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }] };
  }

  // Limit total rows to prevent DoS
  const MAX_ROWS = 1000;
  if (lines.length > MAX_ROWS + 1) {
    return { 
      success: false, 
      data: [], 
      errors: [{ row: 0, message: `CSV cannot have more than ${MAX_ROWS} rows` }] 
    };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

  // Validate required headers
  const requiredHeaders = ['name', 'price', 'category'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    return { 
      success: false, 
      data: [], 
      errors: [{ row: 0, message: `Missing required columns: ${missingHeaders.join(', ')}` }] 
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Parse and sanitize values
    const rawProduct = {
      name: sanitizeString(row.name || ''),
      description: row.description?.trim() ? sanitizeString(row.description) : undefined,
      price: parseFloat(row.price) || 0,
      category: row.category?.trim() as 'Pet' | 'Farm',
      product_type: row.product_type?.trim() ? sanitizeString(row.product_type) : undefined,
      stock: row.stock?.trim() ? parseInt(row.stock) : undefined,
      badge: row.badge?.trim() ? sanitizeString(row.badge) : undefined,
      discount: row.discount?.trim() ? parseFloat(row.discount) : undefined,
      image_url: row.image_url?.trim() || undefined,
    };

    // Validate with Zod schema
    const result = productSchema.safeParse(rawProduct);

    if (!result.success) {
      const errorMessages = result.error.errors.map(e => e.message).join('; ');
      errors.push({ row: i + 1, message: errorMessages });
      continue;
    }

    data.push(result.data);
  }

  return {
    success: errors.length === 0 && data.length > 0,
    data,
    errors,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function generateCSVTemplate(): string {
  const headers = ['name', 'description', 'price', 'category', 'product_type', 'stock', 'badge', 'discount', 'image_url'];
  const exampleRow = ['Dog Food Premium', 'High quality dog food', '500', 'Pet', 'Food', '100', 'New', '10', 'https://example.com/image.jpg'];
  
  return [headers.join(','), exampleRow.join(',')].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
