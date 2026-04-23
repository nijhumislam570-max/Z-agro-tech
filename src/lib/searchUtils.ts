/**
 * Escape Postgres LIKE / ILIKE wildcards in user-supplied search input.
 *
 * Without escaping, `%` and `_` are treated as wildcards, which means a
 * user typing `%` matches every row (a cheap DoS via broad LIKE on a
 * large table) and `_` silently changes the result set.
 *
 * Use as: `query.ilike('name', `%${escapeIlikePattern(searchInput)}%`)`
 */
export function escapeIlikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}
