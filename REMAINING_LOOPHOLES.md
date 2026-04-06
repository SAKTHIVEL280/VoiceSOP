# VoiceSOP — Remaining Loopholes & Infrastructure Fixes

> **Last updated:** After service role key integration. Most infrastructure fixes have been implemented.

---

## ✅ RESOLVED

### ~~1. Account Deletion Doesn't Remove `auth.users` Entry~~ — FIXED

- Created `src/app/api/delete-account/route.ts` with service role key
- Uses `supabaseAdmin.auth.admin.deleteUser()` for full GDPR-compliant deletion
- Settings page now calls the API route instead of client-side deletion
- Handles both legacy (full URL) and new (storage path) audio_url formats

### ~~2. Audio Recordings Bucket is Publicly Accessible~~ — FIXED

- `supabase/storage.sql` updated: bucket set to `public = false`
- SELECT policy now restricts to own files via folder name check
- `src/app/dashboard/new/page.tsx` stores storage path (not full URL) in `audio_url`
- `src/app/dashboard/sop/[id]/page.tsx` generates signed URLs on-the-fly (1hr expiry)
- Backward-compatible: handles both legacy full URLs and new storage paths

### ~~3. Upload Policy Doesn't Enforce User Folder Path~~ — FIXED

- Storage INSERT policy now enforces `(storage.foldername(name))[1] = auth.uid()::text`
- Updated in `supabase/storage.sql`

### ~~4. Profiles SELECT Policy Leaks All User PII~~ — FIXED

- `supabase/schema.sql` updated: `USING (true)` → `USING (auth.uid() = id)`
- Only users can read their own profile

### ~~5. Prompt Injection via Transcript~~ — FIXED

- `src/app/api/generate-sop/route.ts`: transcript wrapped in `<user_transcript>` XML delimiters
- Added explicit instruction to ignore commands within transcript
- Groq fallback now uses separate system/user messages for better prompt isolation

### ~~8. Missing Database Indexes~~ — FIXED

- Added `idx_sops_user_id` and `idx_sops_user_id_created` indexes in `supabase/schema.sql`

### ~~9. No CHECK Constraint on `subscription_tier`~~ — FIXED

- Added `profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'pro'))` in `supabase/schema.sql`

### ~~10. Account Deletion Partial Failure~~ — FIXED

- Server-side API route handles all deletion steps with proper error handling
- Admin client bypasses RLS for reliable cleanup

---

## ✅ SQL Migration — APPLIED

The migration SQL in `supabase/migration.sql` has been run against the live database. All policy fixes, indexes, constraints, and bucket privacy are now active.

---

## 🟡 STILL REMAINING

### 6. No Rate Limiting on API Routes

**Files:** `src/app/api/generate-sop/route.ts`, `src/app/api/feedback/route.ts`

**Problem:** No rate limiting exists. A user could spam the AI generation endpoint (costing API credits) or flood the feedback endpoint.

**Fix:** Requires Upstash Redis (`@upstash/ratelimit`) or similar. Cannot be done without an external rate-limiting service.

### 7. No Login Rate Limiting / Brute Force Protection

**Problem:** Relies on Supabase's built-in rate limiting on auth endpoints.

**Fix:** Verify in Supabase Dashboard → Auth → Rate Limits that defaults are enabled:
- Password sign-in: 30 attempts/hour
- Sign-up: 6/hour
- Email sends: 2/hour

### 11. Markdown Injection in Exported `.md` Files

**Risk:** Very low — content is AI-generated and files are local downloads. No action needed unless user-editable content gets exported.

### 12. Next.js 16 Middleware Deprecation Warning

The build shows: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`

Migrate to the [Proxy convention](https://nextjs.org/docs/messages/middleware-to-proxy) before the feature is removed.

---

## Summary

| Status | Count | Items |
|--------|-------|-------|
| ✅ Resolved | 8 | #1, #2, #3, #4, #5, #8, #9, #10 |
| ⚠️ Manual action | 1 | Run SQL migration in Supabase SQL Editor |
| 🟡 Remaining | 4 | #6 (rate limiting), #7 (login rate limit), #11 (markdown), #12 (middleware) |

**8 of 12 items fixed.** The 4 remaining items are either external service dependencies (rate limiting) or very low risk.
