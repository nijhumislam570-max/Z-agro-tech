import { useParams } from 'react-router-dom';

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when `value` is a syntactically valid UUID (any version). */
export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value);

/**
 * Reads a route param and validates it as a UUID. Returns the lowercased UUID
 * when valid, or `null` when missing/malformed. Promote this util to every
 * `/<resource>/:id` page so we never fire a Postgres `invalid input syntax for
 * type uuid` query for an obvious typo (`/product/abc`).
 *
 * @example
 *   const id = useUuidParam('id');
 *   if (!id) return <Navigate to="/shop" replace />;
 */
export function useUuidParam(name = 'id'): string | null {
  const params = useParams();
  const raw = params[name];
  return isUuid(raw) ? raw.toLowerCase() : null;
}
