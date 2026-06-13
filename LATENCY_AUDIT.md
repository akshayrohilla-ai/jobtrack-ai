# Latency Audit — AI Features (Evaluate JD · Tailor CV · Interview Prep)

**Date:** 2026-06-13 · **Scope:** the three credit-consuming AI features reported at 20–30s end-to-end.
**Status:** diagnosis only. Timing instrumentation added to the three routers (request_id + per-step durations, logged to Render); no performance changes implemented.

---

## 1. Request flow per feature

All three share the same shape: **one buffered (non-streaming) Sonnet 4.6 call**, then parse → DB → return. The frontend shows a spinner and renders only after the full JSON arrives.

### Evaluate JD
```
JDEvaluator.jsx (fetch, await full JSON, spinner until done)
  → POST /api/evaluate/evaluate-jd
    → get_current_user (JWT verify)         [pre-LLM]
    → require_credits RPC (spend_credits)   [pre-LLM]
    → build prompt (cv_skills/title from payload — no refetch)
    → client.messages.create(sonnet-4-6, max_tokens=1500, BUFFERED)   [LLM ← dominant]
    → json.loads(strip fences)              [parse]
    → supabase insert jd_evaluations        [DB]
    → return full JSON
```
Files: `frontend/src/components/JDEvaluator.jsx`, `backend/routers/evaluate.py`

### Tailor CV
```
CVTailor.jsx (axios tailorCV, await full JSON, spinner until done)
  → POST /api/tailor/tailor-cv
    → get_current_user                      [pre-LLM]
    → require_credits RPC                    [pre-LLM]
    → build prompt (profile + up to 12k chars CV from props — no refetch/re-parse)
    → client.messages.create(sonnet-4-6, max_tokens=3000, BUFFERED)   [LLM ← dominant, largest]
    → json.loads                            [parse]
    → supabase insert cv_tailoring_log       [DB]
    → return full JSON
```
Files: `frontend/src/components/CVTailor.jsx`, `backend/routers/tailor.py`, `frontend/src/lib/api.js`

### Interview Prep
```
InterviewPrep.jsx (axios prepareInterview, await full JSON, spinner until done)
  → POST /api/interview/prep
    → get_current_user                      [pre-LLM]
    → require_credits RPC                    [pre-LLM]
    → build prompt (raw_cv + jd from props)
    → client.messages.create(sonnet-4-6, max_tokens=2000, BUFFERED)   [LLM ← dominant]
    → regex strip + json.loads              [parse]
    → return full JSON (no DB write)
```
Files: `frontend/src/components/InterviewPrep.jsx`, `backend/routers/interview.py`, `frontend/src/lib/api.js`

Cross-cutting: `api.js` axios interceptor runs `supabase.auth.getSession()` before every request; the Anthropic client is **re-instantiated per request**; the sync SDK call runs inside an `async def` (blocks the event loop).

---

## 2. Timing breakdown (estimated — confirm with the added instrumentation)

Estimates assume Sonnet 4.6 output at ~40–80 tok/s and a warm Render instance. Live per-step numbers will appear in Render logs as `[rid] <feature> | pre-LLM=… LLM=… parse=… db=… total=… out_tokens=…`.

| Phase | Evaluate JD | Tailor CV | Interview Prep | Notes |
|---|---|---|---|---|
| pre-LLM (auth + credits + prompt) | ~0.3–1.0s | ~0.3–1.0s | ~0.3–1.0s | getSession + RPC + client init |
| **LLM call (buffered)** | **~20–25s** | **~30–40s** | **~25–30s** | **dominant — full generation before any return** |
| parse (JSON) | <0.05s | <0.05s | <0.05s | negligible |
| DB insert | ~0.1–0.4s | ~0.1–0.4s | 0 (none) | non-blocking-ish, small |
| **Total (warm)** | **~21–26s** | **~31–41s** | **~26–31s** | matches reported 20–30s+ |
| Cold-start penalty (intermittent) | +30–50s | +30–50s | +30–50s | only if Render spun down |

**~90%+ of wall-clock time is the buffered LLM generation.** Everything else is sub-second.

---

## 3. Root causes ranked by impact

| # | Root cause | Impact | Evidence |
|---|---|---|---|
| 1 | **Buffered (non-streaming) responses** — user waits for the *entire* generation; large `max_tokens` (1500/3000/2000) means many output tokens | 🔴 Critical | `messages.create()` with no `stream=True` in all 3 routers |
| 2 | **Frontend renders nothing until full JSON arrives** (spinner only) | 🔴 Critical (perceived) | `setLoading→await→setResult` in all 3 components; no progressive UI |
| 3 | **Sync SDK call blocks the async event loop** under concurrency; client re-instantiated per request | 🟠 High (under load) | `anthropic.Anthropic(...).messages.create()` inside `async def`, no threadpool |
| 4 | **Cold-start exposure** (Render free tier, ~15-min spin-down) | 🟡 Medium (intermittent) | free plan; cron keep-alive mitigates but can lapse |
| 5 | **Per-request pre-LLM overhead** (getSession every call, client init) | 🟢 Low | `api.js:12` interceptor; client built per request |

**Ruled out (verified non-issues):** no sequential LLM calls, no retries/polling, no resume/profile refetch per call (passed as props/payload), prompt caching already enabled (input is not the bottleneck).

---

## 4. Proposed fixes ranked by impact / effort

> Nothing below is implemented. Ranking favors high impact ÷ low effort first.

| Rank | Fix | Impact | Effort | Expected improvement | Risk | Files touched |
|---|---|---|---|---|---|---|
| 1 | **Stream the LLM response (SSE) + progress UI** | 🔴 Highest | Medium | Time-to-first-feedback **~1–2s** (from 20–30s blank). Final structured render still needs full JSON, but perceived wait drops drastically + removes 60s timeout risk | Medium | `evaluate.py`, `tailor.py`, `interview.py`, 3 components, `api.js` |
| 2 | **Reuse a module-level Anthropic client** (stop per-request init) | 🟢 Low | Trivial | ~50–200ms/request; cleaner connection reuse | None | 3 routers (or new `services/anthropic_client.py`) |
| 3 | **Offload sync call via `AsyncAnthropic` or `run_in_threadpool`** | 🟠 High (concurrency) | Low | No single-request speedup, but unblocks the event loop → stable latency under load, responsive `/health` | Low | 3 routers |
| 4 | **Render paid plan (no spin-down)** | 🟡 Medium | Trivial ($7/mo) | Eliminates the +30–50s cold-start outliers | None | none (infra) |
| 5 | **Tighten prompts / lower `max_tokens` to actual need** | 🟡 Medium | Low | Fewer output tokens = proportionally faster (e.g. if tailor truly needs ~1800 not 3000, ~30–40% faster). **Confirm typical `out_tokens` from instrumentation first** | Medium (output completeness/quality) | 3 routers (prompt + max_tokens) |
| 6 | **Drop the per-request `getSession()` round-trip** (cache session/token client-side) | 🟢 Low | Low | ~100–500ms/request on token-refresh hits | Low | `api.js`, components |
| 7 | **Use Haiku 4.5 for the least-nuanced feature** (e.g. interview prep) | 🟠 High (that feature) | Trivial | Haiku is materially faster than Sonnet → could cut that feature's generation time substantially | Med–High (quality regression; was deliberately Sonnet) | one router |

### Detail & sequencing notes

- **Fix #1 (streaming)** is the real answer to the complaint, but note the **JSON nuance**: the output is one structured JSON object, so you can't render *half* of it as UI. Streaming primarily (a) shows live progress so the user knows it's working, and (b) eliminates the all-or-nothing 20–30s blank + timeout risk. To get *true* progressive section-by-section rendering, the output would need restructuring (stream discrete sections), which is additional effort beyond basic SSE.
- **Quick-win bundle (#2 + #3 + #4)** is low-risk and can ship together: reuse the client, offload the blocking call, remove cold starts. Doesn't cut single-request generation time but stabilizes latency and kills the worst outliers.
- **Fix #5** depends on data: deploy the instrumentation, read typical `out_tokens` from Render logs. If actual output is near the ceiling, prompts are verbose and trimming helps; if well under, lowering `max_tokens` won't help (model already stops early).
- **Fix #7** trades quality for speed — only consider for a feature where Sonnet-level nuance isn't essential, and A/B the output first.

### Suggested order
1. Deploy instrumentation → capture real `pre-LLM / LLM / out_tokens` per feature.
2. Ship the low-risk quick-win bundle (#2, #3, #4).
3. Implement streaming + progress UI (#1) — the headline UX fix.
4. Use the `out_tokens` data to decide on #5 (prompt/token trimming) and whether #7 is worth testing.

---

## 5. Out of scope / not changed
No code behavior was modified during the diagnosis. The only change made during diagnosis is **timing instrumentation** (logging) in `evaluate.py`, `tailor.py`, `interview.py` — safe to deploy to capture live numbers, and trivially removable.

---

## 6. Implementation log — Fix #1 (streaming)

### 2026-06-13 — Fix #1 applied to **JD Evaluation** (pilot)
**Change:** transport only — buffered `messages.create` → SSE `messages.stream` (`AsyncAnthropic`). Model, prompt, `max_tokens=1500`, `temperature=0`, and the final JSON are **unchanged** (output verified identical in shape). Frontend (`JDEvaluator.jsx`) now consumes the SSE stream and flips the button to "Analyzing your fit…" on first token. Tailor CV and Interview Prep **not yet changed** (still buffered).

**Files:** `backend/routers/evaluate.py`, `frontend/src/components/JDEvaluator.jsx`

**Measured (live Anthropic API, Sonnet 4.6, real evaluation prompt, warm prompt-cache):**

| Metric | Before (buffered) | After (streamed) | Change |
|---|---|---|---|
| Time to **first feedback** | 23.7s (blank) | **1.3s** | **−94%** ⬇ |
| Time to **complete result** | 23.7s | 23.2s | ~unchanged (expected) |
| Output tokens (actual) | 1,132 | 1,132 | identical |

**Interpretation:** exactly as predicted — perceived wait collapses from ~24s of blank screen to ~1.3s to first feedback, while the complete-result time is unchanged (same tokens at the same generation rate). The user now gets near-immediate confirmation the system is working instead of staring at a frozen spinner for 24s.

**Bonus data point:** actual output is **1,132 tokens** vs the 1,500 ceiling — so Fix #5 (lowering `max_tokens`) would yield little for JD evaluation; the model already stops well under the cap.

**Caveat:** measured at the LLM layer (the dominant phase and the only thing Fix #1 changes). Full end-to-end HTTP timing requires the deployed authed flow — confirm via the per-request Render log line `[rid] evaluate-jd(stream) | … TTFT=… total=…` after deploy.

**Status:** committed + deployed (pilot). Tailor CV + Interview Prep pending (same pattern).

### 2026-06-13 — Progressive section rendering added to JD Evaluation
**Why:** the initial pilot only flipped the button label to "Analyzing…" — too subtle; the perceived-latency win didn't land. Upgraded to true section-by-section build-up.

**Change:** backend `delta` events now stream the actual text chunks (`{t: <chunk>}`). Frontend (`JDEvaluator.jsx`) accumulates the text and runs a **tolerant partial-JSON parser** (`parsePartialJSON`) on each chunk, calling `onResultChange(partial)` so sections render as their keys complete in the stream. The results block now renders during streaming (gate loosened from `result && gc` to `result`), with the grade hero showing a skeleton until the grade arrives. Export/"evaluate another" actions hidden until generation completes. The `done` event still delivers the authoritative complete object — partial-parse misses only affect intermediate frames. Output unchanged.

**Validation:** frontend builds clean; `parsePartialJSON` unit-tested against 6 partial fragments (code fences, incomplete strings/arrays, dangling keys) — all produce correct partial objects. Full SSE round-trip needs verification on deploy.

**Files:** `backend/routers/evaluate.py`, `frontend/src/components/JDEvaluator.jsx`
