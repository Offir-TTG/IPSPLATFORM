/**
 * Puts the rows of translation migration files into the database: every
 * ('lang', 'key', value) row in an `INSERT INTO translations … VALUES …` block
 * that isn't there yet (global rows: tenant_id null). Existing translations
 * are never changed, same as the SQL files themselves. Prints no secrets.
 *
 *   npx tsx scripts/apply-translations.ts supabase/migrations/20261124_x_translations.sql [more files…]
 *   npx tsx scripts/apply-translations.ts --since 20261123     (every *translations*.sql from that date on)
 *
 * Understands the forms these files use: 'text', U&'\05D0…' (with \XXXX and
 * \+XXXXXX escapes), '' for a quote, and an optional 4th value for context.
 */
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true } as any);

type Row = { lang: string; key: string; value: string; context: string | null };

/** Reads SQL string literals ('…' and U&'…') from one VALUES tuple. */
function readLiterals(tuple: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < tuple.length) {
    const unicode = /^U&'/i.test(tuple.slice(i, i + 3));
    if (unicode || tuple[i] === "'") {
      i += unicode ? 3 : 1;
      let s = '';
      while (i < tuple.length) {
        if (tuple[i] === "'" && tuple[i + 1] === "'") {
          s += "'";
          i += 2;
        } else if (tuple[i] === "'") {
          i += 1;
          break;
        } else {
          s += tuple[i++];
        }
      }
      if (unicode) {
        s = s
          .replace(/\\\+([0-9A-Fa-f]{6})/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/\\([0-9A-Fa-f]{4})/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/\\\\/g, '\\');
      }
      out.push(s);
    } else {
      i += 1;
    }
  }
  return out;
}

function rowsOf(sql: string, file: string): Row[] {
  const rows: Row[] = [];
  const blocks = sql.split(/INSERT\s+INTO\s+(?:public\.)?translations/i).slice(1);
  for (const block of blocks) {
    const ctxMatch = block.match(/SELECT\s+NULL\s*,\s*v\.lang\s*,\s*v\.key\s*,\s*v\.value\s*,\s*(?:'([^']*)'|v\.(\w+))/i);
    const fixedContext = ctxMatch?.[1] ?? null;
    const valuesStart = block.search(/FROM\s*\(\s*VALUES/i);
    if (valuesStart < 0) continue;
    const body = block.slice(valuesStart);
    // Each tuple starts with "(" + a quoted language code.
    const re = /\(\s*'(he|en|es|ar|ru|fr)'\s*,/g;
    const starts: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) starts.push(m.index);
    for (let k = 0; k < starts.length; k++) {
      const chunk = body.slice(starts[k], k + 1 < starts.length ? starts[k + 1] : body.indexOf(') AS v', starts[k]));
      const lit = readLiterals(chunk);
      if (lit.length < 3) {
        console.warn(`  skipped a row in ${path.basename(file)}: ${chunk.slice(0, 60).replace(/\s+/g, ' ')}`);
        continue;
      }
      rows.push({ lang: lit[0], key: lit[1], value: lit[2], context: lit[3] ?? fixedContext ?? null });
    }
  }
  return rows;
}

async function main() {
  const args = process.argv.slice(2);
  let files: string[] = [];
  const sinceAt = args.indexOf('--since');
  if (sinceAt >= 0) {
    const since = args[sinceAt + 1];
    const dir = path.resolve(process.cwd(), 'supabase/migrations');
    files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql') && f.slice(0, 8) >= since && /translation/i.test(f))
      .sort()
      .map((f) => path.join(dir, f));
    args.splice(sinceAt, 2);
  }
  files.push(...args.map((f) => path.resolve(process.cwd(), f)));
  if (!files.length) throw new Error('Give translation .sql files, or --since YYYYMMDD');

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  let total = 0;
  for (const file of files) {
    const rows = rowsOf(fs.readFileSync(file, 'utf8'), file);
    if (!rows.length) {
      console.log(`${path.basename(file)}: no translation rows found`);
      continue;
    }
    const keys = [...new Set(rows.map((r) => r.key))];
    const have = new Set<string>();
    for (let i = 0; i < keys.length; i += 200) {
      const { data, error } = await db.from('translations').select('translation_key, language_code').is('tenant_id', null).in('translation_key', keys.slice(i, i + 200));
      if (error) throw error;
      for (const r of data ?? []) have.add(`${r.language_code}|${r.translation_key}`);
    }
    const now = new Date().toISOString();
    const seen = new Set<string>();
    const missing = rows
      .filter((r) => {
        const id = `${r.lang}|${r.key}`;
        if (have.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((r) => ({ tenant_id: null, language_code: r.lang, translation_key: r.key, translation_value: r.value, context: r.context ?? 'admin', created_at: now, updated_at: now }));
    for (let i = 0; i < missing.length; i += 500) {
      const { error } = await db.from('translations').insert(missing.slice(i, i + 500));
      if (error) throw new Error(`${path.basename(file)}: ${error.message}`);
    }
    total += missing.length;
    console.log(`${path.basename(file)}: ${rows.length} rows, ${missing.length} added`);
  }
  console.log(`done: ${total} added`);
}

main().catch((e) => {
  console.error('failed:', e?.message ?? e);
  process.exit(1);
});
