/**
 * Reusable client-side join helpers.
 *
 * Used across admin pages where we batch-fetch related rows (typically
 * `profiles` or `user_roles`) by user_id and then attach them to the parent
 * rows. Keeps that pattern fully typed and DRY.
 */

/**
 * Index a list of rows by a single key (e.g. `'user_id'`) into a Map for
 * O(1) lookup. Rows with `null`/`undefined` keys are skipped.
 */
export function indexBy<T, K extends keyof T>(
  rows: readonly T[] | null | undefined,
  key: K,
): Map<NonNullable<T[K]>, T> {
  const map = new Map<NonNullable<T[K]>, T>();
  for (const row of rows ?? []) {
    const k = row[key];
    if (k !== null && k !== undefined) {
      map.set(k as NonNullable<T[K]>, row);
    }
  }
  return map;
}

/**
 * Group rows by a key into a Map of arrays — useful for one-to-many joins
 * (e.g. multiple roles per user).
 */
export function groupBy<T, K extends keyof T>(
  rows: readonly T[] | null | undefined,
  key: K,
): Map<NonNullable<T[K]>, T[]> {
  const map = new Map<NonNullable<T[K]>, T[]>();
  for (const row of rows ?? []) {
    const k = row[key];
    if (k === null || k === undefined) continue;
    const bucket = map.get(k as NonNullable<T[K]>) ?? [];
    bucket.push(row);
    map.set(k as NonNullable<T[K]>, bucket);
  }
  return map;
}

/**
 * Attach a single related row to each parent row by matching on a shared key.
 *
 * @example
 *   const profiles = await supabase.from('profiles').select(...).in('user_id', ids);
 *   const merged = joinByKey(orders, 'user_id', indexBy(profiles, 'user_id'), 'profile');
 */
export function joinByKey<P, R, K extends keyof P>(
  parents: readonly P[],
  parentKey: K,
  lookup: Map<NonNullable<P[K]>, R>,
  attachAs: string,
): Array<P & Record<string, R | null>> {
  return parents.map((p) => {
    const k = p[parentKey];
    const related = k !== null && k !== undefined ? lookup.get(k as NonNullable<P[K]>) ?? null : null;
    return { ...p, [attachAs]: related } as P & Record<string, R | null>;
  });
}

/** Convenience: extract unique non-null values for a key (for `.in(...)` queries). */
export function uniqueKeys<T, K extends keyof T>(
  rows: readonly T[] | null | undefined,
  key: K,
): NonNullable<T[K]>[] {
  const set = new Set<NonNullable<T[K]>>();
  for (const r of rows ?? []) {
    const v = r[key];
    if (v !== null && v !== undefined) set.add(v as NonNullable<T[K]>);
  }
  return Array.from(set);
}
