/* Converts the official CSVs into the JSON files the onboarding search uses.

   node scripts/build-reference-data.mjs hecos <hecos.csv>
   node scripts/build-reference-data.mjs providers <providers.csv>

   Columns are found by header name (case-insensitive). If a file uses different headers, name them:
   node scripts/build-reference-data.mjs hecos <file.csv> --code "HECoS code" --name "Label" */
import { readFileSync, writeFileSync } from 'node:fs'

const KINDS = {
  hecos: {
    out: 'src/data/hecos.json',
    codeKey: 'code',
    codeHeaders: ['code', 'hecos code', 'hecos', 'term id'],
    nameHeaders: ['label', 'name', 'term', 'subject'],
    codePattern: /^\d{6}$/,
  },
  providers: {
    out: 'src/data/uk-providers.json',
    codeKey: 'ukprn',
    codeHeaders: ['ukprn'],
    nameHeaders: ['provider name', 'name', 'legal name', 'provider'],
    codePattern: /^1\d{7}$/,
  },
}

// Minimal RFC 4180 parser: quoted fields, doubled quotes, commas and newlines inside quotes
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') field += '"', i++
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') row.push(field), (field = '')
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field), rows.push(row), (row = []), (field = '')
    } else field += ch
  }
  if (field || row.length) row.push(field), rows.push(row)
  return rows.filter((r) => r.some((cell) => cell.trim()))
}

function findColumn(headers, wanted, override) {
  const names = headers.map((h) => h.trim().toLowerCase())
  const candidates = override ? [override.toLowerCase()] : wanted
  for (const candidate of candidates) {
    const index = names.indexOf(candidate)
    if (index !== -1) return index
  }
  throw new Error(`No column named ${candidates.map((c) => `"${c}"`).join(' or ')}. Headers found: ${headers.join(', ')}`)
}

function option(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

const [kindName, csvPath, ...rest] = process.argv.slice(2)
const kind = KINDS[kindName]
if (!kind || !csvPath) {
  console.error('Usage: node scripts/build-reference-data.mjs <hecos|providers> <file.csv> [--code <header>] [--name <header>]')
  process.exit(1)
}

const [headers, ...rows] = parseCsv(readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''))
const codeCol = findColumn(headers, kind.codeHeaders, option(rest, '--code'))
const nameCol = findColumn(headers, kind.nameHeaders, option(rest, '--name'))

const byCode = new Map()
let skipped = 0
for (const row of rows) {
  const code = (row[codeCol] ?? '').trim()
  const name = (row[nameCol] ?? '').trim().replace(/\s+/g, ' ')
  if (!kind.codePattern.test(code) || !name) {
    skipped++
    continue
  }
  byCode.set(code, name)
}

const entries = [...byCode]
  .map(([code, name]) => ({ [kind.codeKey]: code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'))

writeFileSync(kind.out, `[\n${entries.map((e) => `  ${JSON.stringify(e)}`).join(',\n')}\n]\n`)
console.log(`Wrote ${entries.length} entries to ${kind.out}${skipped ? ` (skipped ${skipped} rows without a valid code or name)` : ''}`)
