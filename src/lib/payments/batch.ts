/**
 * Runs a job over many items, a few at a time, and stops starting new ones
 * before the serverless time limit. Whatever is left is picked up by the next
 * run (the charger's claim step makes sure nothing is charged twice).
 *
 * At volume this matters: one charge is several Stripe calls (2–4 s), so
 * charging one at a time fit only ~20 payments into a 60-second run.
 */
export async function runInBatches<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  options: { concurrency?: number; budgetMs?: number } = {},
): Promise<{ results: R[]; processed: number; remaining: number }> {
  const concurrency = options.concurrency ?? 5;
  const deadline = Date.now() + (options.budgetMs ?? 45_000);
  const results: R[] = [];
  let next = 0;

  async function lane() {
    while (next < items.length && Date.now() < deadline) {
      const item = items[next++];
      results.push(await worker(item));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return { results, processed: results.length, remaining: items.length - results.length };
}

/**
 * Loads enrollments by id, in chunks. The database has no relationship from
 * payment_schedules to enrollments that queries can join on (a joined query
 * fails with "Could not find a relationship"), so callers read the
 * schedules first and the enrollments with this.
 */
export async function loadEnrollmentsById<T extends { id: string }>(
  supabase: { from: (table: string) => any },
  ids: string[],
  columns: string,
): Promise<{ data: Map<string, T>; error: string | null }> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, T>();
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await supabase
      .from('enrollments')
      .select(columns.includes('id') ? columns : `id, ${columns}`)
      .in('id', unique.slice(i, i + 200));
    if (error) return { data: map, error: error.message };
    for (const row of (data ?? []) as T[]) map.set(row.id, row);
  }
  return { data: map, error: null };
}

/** Reads every row of a query page by page (the database returns at most 1,000 at a time). */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<{ data: T[]; error: string | null }> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { data: all, error: error.message };
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) return { data: all, error: null };
  }
}
