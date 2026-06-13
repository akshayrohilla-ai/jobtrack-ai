// Best-effort parse of an incomplete JSON object streamed from the API.
// Returns the largest valid object parseable so far, or null. The `done` event
// always carries the authoritative complete object, so a missed intermediate
// frame here is harmless — the UI just waits for the next chunk.
export function parsePartialJSON(s) {
  if (!s) return null
  const start = s.indexOf('{')
  if (start === -1) return null
  const str = s.slice(start)
  try { return JSON.parse(str) } catch {}
  const stack = []
  let inStr = false, esc = false, out = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (inStr) {
      out += ch
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    out += ch
    if (ch === '"') inStr = true
    else if (ch === '{' || ch === '[') stack.push(ch)
    else if (ch === '}' || ch === ']') stack.pop()
  }
  if (inStr) out += '"'                                   // close an open string
  out = out.replace(/,\s*"[^"]*"\s*:?\s*$/, '')           // drop a dangling key
         .replace(/\{\s*"[^"]*"\s*:?\s*$/, '{')           // ...or a dangling key right after {
         .replace(/[:,]\s*$/, '')                         // drop trailing colon/comma
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === '{' ? '}' : ']'
  out = out.replace(/,(\s*[}\]])/g, '$1')                 // remove trailing commas before closers
  try { return JSON.parse(out) } catch { return null }
}
