# VoiceSOP Low Level Design (LLD)

## 1. Purpose
This document defines the implementation-level architecture, components, workflows, data model, API contracts, security controls, and operational practices for the VoiceSOP SaaS application.

Scope includes:
- Frontend app structure and runtime behavior
- Authentication and authorization model
- SOP generation flow (record or upload audio + transcript)
- AI provider routing and fallback logic
- Data persistence model and storage handling
- Rate limiting and abuse prevention
- Export, profile/settings, and account deletion workflows
- Environments, deployment, observability, and release controls

## 2. Technology Stack
- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Auth / DB / Storage: Supabase
- LLM Providers: Google Gemini + Groq
- Rate limiting store: Upstash Redis
- Notifications: Sonner
- Animation: Framer Motion, GSAP
- PDF/MD export: jsPDF + markdown generator

## 3. System Context
### 3.1 Actors
- Anonymous visitor
- Authenticated free user
- Authenticated pro user
- Admin/service role processes (server-side only)

### 3.2 Core capabilities
- User authentication
- Record or upload SOP audio
- Input or edit transcript
- Generate SOP via AI
- View/edit/export SOP
- Manage profile and usage
- Submit feedback
- Delete account and all user data

## 4. Project Structure (Key Modules)
- src/app: Route handlers and pages
- src/app/api: Server endpoints
- src/components: UI and section components
- src/context: UI/global client state
- src/utils/supabase: Supabase clients and middleware helpers
- src/utils: Export generators and helpers
- src/lib/rateLimit.ts: Shared Redis rate-limit utility
- supabase/*.sql: RLS policies, storage policies, schema/migrations

## 5. Data Model
## 5.1 profiles
Key fields:
- id (auth user id)
- full_name
- email
- subscription_tier: free | pro
- created_at / updated_at

Rules:
- User can select/update own profile only
- subscription_tier controls feature access and AI routing

## 5.2 sops
Key fields:
- id
- user_id
- title
- content (JSON)
- audio_url (storage path)
- tags
- created_at / updated_at

Content schema (normalized target):
- purpose
- scope (pro)
- prerequisites (pro)
- roles
- steps[] { title, description, warning, checklist[] }
- glossary[] (pro)

Rules:
- User can read/update/delete own SOPs only
- Pro-only fields are sanitized server-side for free users

## 5.3 storage bucket: audio-recordings
- Private bucket
- user_id prefixed storage paths
- Signed URL used for playback
- Policies enforce owner path access and upload isolation

## 6. Authentication and Authorization
## 6.1 Auth model
- Supabase Auth with cookie-backed session
- Server endpoints verify user with supabase.auth.getUser()

## 6.2 Route protection
- Dashboard routes require authenticated user
- Login route redirects authenticated users to dashboard

## 6.3 Authorization model
- Ownership checks for SOP operations
- RLS enforces data boundary at DB level
- Server checks on sensitive mutations before write

## 7. Feature Access Model
## 7.1 Free user
- 3 SOP generations per month
- Groq generation path only
- Pro-only fields stripped before persistence

## 7.2 Pro user
- Unlimited generation (business-rule configurable)
- Gemini generation primary path
- Groq fallback on Gemini failure
- Access to pro content sections (scope, prerequisites, glossary)

## 8. AI Generation Workflow
## 8.1 Input options
- Record now: in-browser MediaRecorder + speech recognition transcript
- Upload audio: file upload + manual transcript input

## 8.2 SOP generation request flow
1. Client creates draft SOP row with user_id + storage path
2. Client calls /api/generate-sop with sopId + transcript
3. Server validates auth, ownership, monthly limits, and rate limits
4. Server chooses provider based on subscription tier
5. Server parses JSON output and sanitizes pro fields for free users
6. Server updates SOP row content + title + tags
7. Client redirects to SOP detail page

## 8.3 Provider routing
- If tier == pro:
  - try Gemini
  - if Gemini fails -> fallback to Groq
- If tier == free:
  - use Groq directly

## 8.4 Prompt hardening
- Transcript wrapped in XML-like delimiters
- Explicit instruction to ignore malicious instructions inside transcript
- Groq receives separated system/user messages

## 9. SOP Save Workflow
## 9.1 Endpoint
- PATCH /api/save-sop

## 9.2 Behavior
- Auth + ownership validation
- Profile tier lookup
- For free users: remove scope/prerequisites/glossary before save
- Update title/content/tags safely
- Return success/error with explicit status codes

## 10. Audio Input UX and Functional Rules
## 10.1 Recording mode
- Start/stop microphone recording
- Live speech transcript accumulation
- Max duration guard
- Generate button enabled when audio exists and transcript is valid

## 10.2 Upload mode
- Accept audio/* files
- Max file size validation
- User-provided transcript required
- Generate button validates transcript length before calling onComplete

## 10.3 Shared constraints
- 25 MB max audio file
- Transcript minimum length enforced before generation request

## 11. Rate Limiting and Abuse Controls
## 11.1 Utility
- src/lib/rateLimit.ts with Upstash Redis INCR+EXPIRE counters

## 11.2 Protected endpoints
- /api/generate-sop
- /api/feedback
- /api/delete-account
- /api/save-sop

## 11.3 Why distributed Redis
- Multi-instance consistency
- Counters survive process restarts
- Reliable throttling under production traffic

## 12. Error Handling and Resilience
- API routes return normalized error JSON and status codes
- LLM route provides fallback provider
- Client side timeout via AbortController on generation call
- Optimistic delete rollback for dashboard SOP deletion
- Double-delete guard with deletingIds state

## 13. Export Workflows
## 13.1 Markdown export
- Convert SOP JSON to markdown sections
- Include warnings/checklists and glossary where available

## 13.2 PDF export
- Render SOP sections/tables with jsPDF and autoTable
- Preserve structured step formatting and warnings

## 14. Feedback Workflow
1. User submits subject/message/type
2. API validates type and length
3. API auth check + rate limiting
4. HTML escapes all user values
5. Sends email via Resend to FEEDBACK_EMAIL

## 15. Account Deletion Workflow
1. User initiates deletion from settings
2. API validates auth + rate limiting
3. Server removes audio files, SOPs, profile
4. Service role deletes auth user
5. Client signs out and redirects home

## 16. Security Controls
- Supabase RLS on profiles and sops
- Storage policies enforce per-user object path ownership
- Server-side ownership checks in API mutations
- Pro field sanitization for free users on generation and save
- Input validation + output escaping
- Signed URLs for private audio playback
- Distributed rate limiting

## 17. Environment Variables
Required (core):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GEMINI_API_KEY
- GROQ_API_KEY
- RESEND_API_KEY
- FEEDBACK_EMAIL

Required (rate limit):
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Optional:
- RESEND_FROM_EMAIL
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_APP_URL

## 18. Operational Recommendations
- Rotate all leaked/exposed tokens immediately
- Use separate env values for dev/staging/prod
- Configure alerting on endpoint 429 spikes and 5xx rates
- Add structured logs with request id and user id where allowed
- Add API integration tests around auth, ownership, and tier behavior

## 19. Testing Matrix (Minimum)
## 19.1 Auth
- unauthenticated access blocked on protected APIs/pages
- authenticated login redirect behavior

## 19.2 Tier rules
- free user generation path uses Groq
- pro user generation path uses Gemini
- pro fallback to Groq on Gemini failure
- free user cannot persist pro-only fields

## 19.3 Audio paths
- record flow: generate succeeds with valid transcript
- upload flow: generate blocked until transcript provided
- file type/size validation

## 19.4 Data integrity
- ownership checks on read/update/delete
- account deletion removes all user-owned data

## 19.5 Reliability
- rate-limit behavior and Retry-After headers
- generation timeout behavior and user feedback

## 20. Known Gaps / Future Enhancements
- Replace browser confirm for account deletion with step-up verification (password + email confirmation)
- Add billing events synchronization from Razorpay/Stripe webhook into profiles/subscriptions
- Add comprehensive E2E test suite (Playwright)
- Optional: migrate Next middleware convention to proxy file when fully available across all tooling paths

## 21. Razorpay Integration Plan (Recommended)
1. Create plans in Razorpay (free/pro mapping)
2. Add checkout endpoint to create order/subscription
3. Add webhook endpoint for payment.captured / subscription events
4. Verify webhook signatures server-side
5. Update profiles.subscription_tier transactionally based on verified events
6. Add billing status UI in settings page and graceful downgrade path

## 22. Acceptance Criteria for Production Readiness
- Lint/build passes in CI
- All env vars configured in runtime environments
- Tier enforcement verified by integration tests
- Rate limit store configured and observable
- Secrets rotated and not committed
- Error budget and alerting baseline configured
- Rollback strategy documented
