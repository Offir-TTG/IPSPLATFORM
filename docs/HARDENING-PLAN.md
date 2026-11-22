# Hardening plan

Making IPSPlatform safe to take real payments. Worked through in order; each
item is ticked only after it's fixed and checked. Nobody pays through the
platform yet (November 2026).

Each finding is checked against the code again before fixing, because some may
already be handled elsewhere.

## 1. Security holes
- [x] Delete the unused one-off routes: `admin/run-deposit-migration`, `admin/fix-integrations`, `debug/translations` (nothing called them; now 404)
- [x] Require an admin login on `admin/keap/contacts`, `admin/keap/contacts/[id]/tags`, `admin/integrations/keap/oauth-callback`, `admin/clear-cache`, `admin/refresh-translations`, `admin/common-languages` (visitors now get 403)
- [x] Cron jobs refuse to run without `CRON_SECRET` (`process-email-queue`, `schedule-email-sends` dropped their in-code fallback; `lesson-reminders` ran for anyone when it was unset)
- [ ] **Owner:** change `CRON_SECRET` in `.env.local` and on Vercel. The current value was written in the code, so it's in git history.

## 2. Stop wrong charges
- [x] Free enrolment: saving a card finishes enrolment without paying what's due (completion now requires everything due today to be paid; saving a card is refused while a payment is due)
- [x] Installment plans: charged, then enrolment fails (same rule replaces the separate deposit / full-payment checks and the 20-second wait; asks Stripe directly if the webhook is late)
- [x] Changing plan after paying deletes the paid schedule (refused once a payment is paid or processing, checked in Stripe too; open charges are cancelled first)
- [x] The pay page charges a future installment early (page and both charge routes only accept the earliest payment that's due)
- [x] Payment rows saved with a status the database rejects; errors ignored (completion and saved-card charges use one shared, error-checked recorder with status `paid`; paid amount recalculated from the schedules)
- [x] Found while checking: `create-intent` started a new charge when the previous one had succeeded or was processing
- [x] Found while checking: two requests creating schedules at once could return an empty list, which made the pay page skip payment
- Shared rules live in `src/lib/payments/dueSchedules.ts`; 20 scenario checks passed against a fake database and Stripe
- [x] Webhook tells Stripe "received" after failing to save, so Stripe never retries (a failed save of the payment, schedule or totals now answers 500, so Stripe retries)
- [x] The same webhook event is counted twice (repeats are recognised by event id and skipped; invoice payments saved once per invoice; totals recalculated instead of added)
- [x] No idempotency keys on charges: two tabs or a double click can charge twice (`create-intent` and `charge-saved-card` now send keys, and check an earlier charge first)
- [x] Every schedule charged in USD (the schedule builder now requires the currency; all 5 callers pass the product or enrollment currency)
- [x] Webhook reads one Stripe setting for all tenants (the event belongs to whichever tenant's signing secret verifies it; same URL)
- [x] Receipt invoices created in the wrong Stripe account (tenant's own account, item attached to that invoice, once per payment, skipped for charges that already have an invoice)
- Checked: unsigned and forged events are rejected (400, 401). Still to test end to end with Stripe test mode before launch.

## 3. Collect what's owed
- [x] Later installments emailed as invoices instead of charged to the saved card (the daily run now charges each payment on its due date to the saved card; an open invoice from an earlier attempt is paid again, not duplicated; enrollment no longer pre-creates emailed invoices; no saved card is recorded as a failure with spaced retries)
- [x] Found while checking: 2 test installments are stuck at `processing` from the old emailed invoices; the daily run picks up anything stuck for a day and pays its open invoice
- [x] Subscriptions charge only once (the daily run adds the next period once the current one is paid and the new one has started; monthly by default, from the plan or product)
- [x] Failed payments never retried (the retry cron goes through the same charger, which pays the open invoice with the card)
- [x] Paying doesn't restore access after an overdue suspension (any recorded payment restores access when nothing due is unpaid; other suspensions untouched)
- [x] Found while checking: the overdue cron suspended cancelled and completed enrollments too; now only active ones
- [x] Found while checking: course access treated cancelled, refunded and paused payments as overdue, blocking access; now uses the same "owed" rule
- [x] Invoices voided in Stripe leave installments stuck (`invoice.voided` / `marked_uncollectible` mark it failed with no auto-retry, for an admin to decide)
- [x] Month-end dates skip February (31 Jan + 1 month is 28 Feb)
- [x] Payment failure emails now carry the card's real decline reason
- Checked with a fake database: month ends, currency, totals, and access restore rules (7 checks passed). The live charging still needs a Stripe test-mode run.

## 4. Client portal (Hebrew only)
The client portal, including the client's own subscription and payment
management (Stop, Pay now), is handled in a separate session. This plan covers
the core and the admin only. Two portal fixes were made here before the split:
- [x] A client can remove a card that isn't theirs (removal now checks the card belongs to the client's own Stripe customer, otherwise "not found")
- [x] Refunds show as paid in the invoice list (refunds are read from the payment's latest charge, so refunded and partly refunded invoices show as such)

## 6. Security review beyond payments (22 Nov 2026)
- [x] **Critical:** `api/admin/make-admin` made any account an admin with no login at all (a client could promote themselves). Deleted, along with the `/admin-signup` "development only" page that used it (its key was written into the public page).
- [x] `api/lms/lessons/bulk-smart` had no login check and used the service key: anyone could create lessons and Zoom meetings in any course. Now admin-only, limited to the admin's tenant, and the module must belong to the course.
- [x] LMS content routes (`api/lms/*`: courses, modules, lessons, topics, materials, Zoom session) let any signed-in user read and, depending on database rules, change any course. They're used only by admin screens, so all of them now require staff (admin, super admin or instructor). Students read courses through `api/user/courses`, which checks enrollment and payment.
- [x] Instructor bridge links (which open Zoom as host) used a short `Math.random` id or a plain chosen name; now always end in a cryptographically random part.
- [x] `api/enrollments/[id]/complete` (unused) could switch a cancelled enrollment back on; deleted. The link-based completion now refuses cancelled or suspended enrollments.
- Checked, fine: super-admin routes (database `is_super_admin` check), admin uploads (admin-only wrapper), student grade and attendance routes (own records only), public signup (always student), the main student course route (enrollment, payment, and preview only for admins).
- [ ] **Owner decision:** anyone can sign up a new organization on the platform and become its admin (`/signup/organization`). Keep it open, or make it invite-only or super-admin-only?
- [ ] Instructors can change any course in their tenant, not only their own. Fine for now with few instructors; restrict later if needed.
- [ ] Stripe test-mode run: step-by-step in `docs/STRIPE-TEST-PLAN.md`; `scripts/show-enrollment.ts <email>` shows the result of each step.

## 7. Enrollment link (22 Nov 2026)
- [x] Links from the public "Enroll" button were 7 characters from `Math.random`, unique per tenant only, though looked up across all tenants. Now 32 random bytes, like admin-sent links.
- [x] Opening a link (`accept`) reset ANY enrollment to pending: a paid, active student lost course access, and a cancelled one could then be completed again. Now only a fresh invitation moves to pending; finished or cancelled ones are refused.
- [x] Admin "Send link" and "Resend invitation" set the paid amount to 0 and cleared a signed contract, even after the client had paid. Now refused once anything is paid or the enrollment is finished or cancelled; a signed contract is kept (`src/lib/payments/enrollmentLink.ts`).
- [x] `link-user` ignored expiry and status; now the same rules as the other link routes.
- [x] A finished enrollment's link kept working for the rest of the week; now it stops an hour after completion.
- [x] 23 log lines wrote links, names, emails, phones and addresses to the server logs; removed. Deleted a leftover `route.ts.backup`.
- [ ] **Owner decision:** completion creates an already-confirmed account for whatever email was typed in the wizard, which is never verified. Proposal: lock the email to the invited address on admin invites, and send a 6-digit code to the email for public sign-ups.
- [ ] Efficiency, later: completion does everything in one request (account, Stripe, contacts and tags, emails), which is slow and can half-fail. Move the side jobs to the existing outbox. Public sign-up creates payment rows on the first click, and choosing a plan replaces them; create them when the plan is chosen. Abandoned drafts are never cleaned up (16 rows today, not urgent).

## 8. Volume (thousands of transactions) and the real database (22 Nov 2026)
- [x] **Found by running the queries against the live database:** the charging job and subscription renewals joined schedules to enrollments, which this database doesn't support, so the job errored and charged nothing. I introduced that join in step 3, and fake-database tests can't catch it. Record payment (cash) had the same join in the original code, so it never worked. All now read the two tables separately (`loadEnrollmentsById`).
- [x] **Columns that don't exist:** `enrollments.suspended_reason`, so suspending overdue clients never worked; it's now marked with payment status "overdue", and paying lifts it. `payments.updated_at`, so refund updates from the admin, the cancel and the Stripe webhook failed to save; removed. `enrollments.deposit_paid`, removed. `processEnrollment` saved the payment id into a non-existent `metadata` column; now the real column. A live scan now finds missing columns only in dead code (Checkout session handler, old Stripe-subscription handler, the unused `createEnrollment`), to delete later.
- [x] Charging and retry jobs charged one payment at a time inside a 60-second limit (about 20 per run, once a day), so a busy day would fall behind and a cut-off run left a payment stuck. Now 5 at a time, stopping at 45 seconds, oldest first, up to 300 per run; charging runs every 15 minutes and retries twice an hour (about 7,000 charges a day). Abandoned wizard drafts can't crowd out real payments. The claim step means overlapping runs never charge twice.
- [x] Database reads stop at 1,000 rows: subscription renewals and the overdue check now read page by page; suspensions are written in chunks. The renewal scan runs once an hour; plan lookups are cached.
- [x] Overdue check: a payment whose date an admin moved still counted from its original date, so the client was suspended anyway. Now the current date decides, in the job and in course access.
- [x] All cron jobs refuse to run when `CRON_SECRET` is unset (4 accepted "Bearer undefined").
- [x] Enrollment completion and the Stripe webhook get 60 seconds instead of the short default.
- [x] **Owner:** ran `supabase/migrations/20261122_payment_indexes.sql` (indexes for the enrollment link, Stripe payment ids, the due-payments query, retries, webhook duplicate check, integrations), 22 Nov 2026.
- [ ] Later at volume: move completion side jobs (contacts, emails) to the outbox; paginate the admin lists and the client invoice list (the invoice list makes one Stripe call per invoice; that's the portal session's area).

## 9. Membership mechanism for the portal (22 Nov 2026)
Owner decisions: stopping keeps access until the end of the paid period; clients can pause one month; switching monthly/yearly is wanted; messaging is not now. Mechanism only; the Client Portal session builds the screens.
- [x] Pay a due payment now: `payScheduleForClient` (own enrollment only, earliest due payment only, same charger as the daily job, returns `requires_action` + client secret for 3-D Secure).
- [x] Subscription summary: `getSubscriptionSummary` (amount, interval, next charge, paid through, state, what the client may do).
- [x] Stop, resume, one-month pause: `changeSubscription` in `src/lib/payments/clientPayments.ts`. The renewal job skips stopped memberships and moves a renewal out of a pause; an hourly step closes memberships whose end date passed; course access is blocked during a pause and after the end. 21 checks passed with a fake database and Stripe.
- [ ] **Owner:** run `supabase/migrations/20261122_subscription_stop_pause.sql` (adds 3 date columns). Until then, stop and pause answer "not switched on yet"; nothing else is affected.
- [x] Switch monthly/yearly (owner chose a price per plan): `payment_plans.subscription_amount` sets a plan's own price, falling back to the product price when it's empty. It's used for the first charge and every renewal. `changeSubscription(..., 'switch_plan', planId)`: the paid period ends on the old plan; from the next charge the new plan's price and frequency apply; refused while a payment is owed. 11 checks passed.
- [x] Plan price column added (owner ran the SQL) and the admin plan editor now has "Price per period" (מחיר לתקופה) on Subscription plans; it's saved by the plan create and update routes (positive amounts only; empty = product price) and shown in the plans list. Hebrew and English labels added.
- [ ] Admin side: show "ending on" or "paused until" on the admin enrollment screens (not done yet).

## 10. Child coaching mechanism ("הילדים שלי", 22 Nov 2026)
Owner decisions: children are records under the parent (no login); parents book and reschedule themselves; free changes up to 24 hours before; session length per product; the portal shows dates, coach and payments only.
- [x] Database design in `supabase/migrations/20261122_family_coaching.sql`: children; enrollments.child_id and coach_id; products.session_duration_minutes; coaching_sessions (the database refuses two overlapping bookings for one coach); coaching_requests; coach weekly hours and time off. All server-only.
- [x] `src/lib/family/coaching.ts`: children (add, edit, remove), coaching requests, coaching overview (coach, used/total, next session), free slots in the school's time zone (daylight saving handled), book, reschedule, cancel (late cancellations count as used, after a confirmation). 23 checks against a fake database.
- [x] **Owner:** ran `supabase/migrations/20261122_family_coaching.sql`. Checked: 5 tables and the new columns exist; browsers refused.
- [x] Intake (owner: parent fills it after the pack is set up; the team edits the questions; the parent can edit until the first session): `src/lib/family/intake.ts`. A product's own form wins over the school's general form; answers keep the questions as sent; booking waits for the intake; locked once the first session starts. 16 checks passed.
- [ ] **Owner:** run `supabase/migrations/20261122_coaching_intake.sql`.
- [x] Owner ran the intake SQL; admin coaching mockup approved (https://claude.ai/artifact/HpH9F6pJZSMqvVt32uPoWq).
- [x] **Parents with no portal account** (owner requirement): opening a pack goes through the normal enrollment (`POST /api/admin/enrollments` now takes coach_id, child or child_id, coaching_request_id). For a new parent the child's details wait on the enrollment and the child is created under the account when the wizard completes (`src/lib/family/coachingEnrollment.ts`; reuses a child the parent already added). 10 checks passed.
- [x] Admin coaching logic and API: `src/lib/family/adminCoaching.ts` and `/api/admin/coaching/*` (requests, choices, packs, staff booking/moving/cancelling, marking done/no-show, changing coach, coach hours and time off, intake forms). Queries checked against the live database.
- [ ] Admin coaching pages (being built).
- [x] Saved admin menu: one "אימון ילדים" link under לימודים, after Enrollments (applied to the database 22 Nov 2026, with its he/en label; the earlier separate section was removed). `20261122_coaching_admin_menu.sql` does the same for other environments. It 404s until the pages are deployed.
- [ ] **Owner, after deploying:** run the coaching admin translations file (comes with the pages).
- [ ] Session-pack products bought from the public page need a "child details" step in the enrollment wizard.
- [ ] Admin screens (mockup first): coaching requests inbox, create a coaching pack for a child and assign a coach, coach weekly hours and time off, session list per coach. Mark sessions done or no-show.
- [ ] A Zoom link for each session (not created yet).
- [ ] Session length field in the product editor (until then 50 minutes is used).

## Rules from the owner
- Card details are kept only in Stripe, never in our database. Checked: no table or migration stores card numbers, last 4 digits or expiry dates; every screen reads them live from Stripe.
- Keap will be removed, so it is out of scope here.

## 5. Admin and tidy-up
- [x] Cancel: refund with the tenant's key, include processing installments, void open invoices (the refund never ran: it looked for status `completed` and used the account-wide key; a failed refund was hidden and the admin told "cancelled successfully". Now the refund amount is checked first, taken from the tenant's Stripe across paid payments newest first, and a failure is shown to the admin. Failed, overdue and processing payments are cancelled too, unpaid invoices voided and open charges cancelled; a payment the client already paid is left for the webhook. Two clicks can't both cancel and refund.)
- [x] Found while checking: a single refund had no double-click protection, and "full refund" after a partial one asked for more than was left (now one shared refund helper in `src/lib/payments/refunds.ts`, keyed so a repeat returns the same refund)
- [x] Found while checking: refunds made in the Stripe dashboard ignored save errors and only updated the paid amount on full refunds
- [x] "Charge now" and "Retry": only allowed statuses, void the old invoice, idempotency (only owed payments can be charged; an open invoice is paid again instead of voided and replaced; the charger takes the payment only if nobody changed it since it was read, so two clicks or a click during the daily run charge once; a payment the client just paid on the pay page is marked paid instead of charged again; Retry no longer counts each retry twice or turns a cancelled payment into "failed". 8 checks passed with a fake database and Stripe)
- [x] Adjust and restructure leave old invoices live
  - Restructure: failed installments were left in place and also added into the new installments, so the client would pay that money twice. Now the new installments replace exactly the unpaid payments (failed included); their Stripe invoices are voided and open charges cancelled; old rows kept as cancelled instead of deleted; refused while a charge is underway or if one was just paid; whole cents; numbered after every existing payment; month ends kept; subscriptions refused. 12 checks passed with a fake database and Stripe.
  - Adjust date: the open invoice is reused on the new date (same amount), so it's fine. Fixed instead: a payment being charged could be adjusted and charged again; a paused payment was quietly unpaused; the automatic retry could still charge before the new date; a payment with no adjustment history crashed.
- [x] Partial refunds don't reduce the amount paid (the paid amount now subtracts partial refunds, from the admin, the cancel or the Stripe dashboard; a cancelled enrollment keeps "cancelled", or "refunded" once nothing paid is left. 18 checks passed with a fake database and Stripe)
- [x] Found while checking: "Record payment" (cash, transfer) saved the payment without the client, added to the paid amount instead of working it out, could mark a cancelled payment paid, and left its Stripe invoice payable (client could pay twice). Now refused for cancelled, refunded or processing payments; the Stripe invoice is voided or the open charge cancelled; the payment is linked to its schedule; totals are worked out again, which also restores access after an overdue suspension.
- [x] Encrypt saved integration keys. The code is done; three steps for the owner remain (below).
  - Found: an old setup script lets any signed-in user (a client too) read and change every tenant's integration keys from the browser, and the code relied on it (Zoom and Daily read the keys with the student's own login). Now all reads and writes go through `src/lib/integrations/store.ts` on the server, with the tenant filter applied explicitly. The admin screen gets secrets masked (last 4 characters); a masked value sent back keeps the saved one.
  - Found: admin Save and Delete for an integration matched by name only, so they could change or delete every tenant's settings; now limited to the admin's own tenant.
  - Found: Daily.co used the first Daily settings in the database, whoever they belonged to; `getStripeClient` without a tenant picked any tenant's Stripe. Both now require the tenant.
  - Found: the DocuSign webhook accepted unsigned messages, so anyone could fake "contract signed"; now every message must be signed with a saved Connect key (refused if none is saved).
  - Found: a student could ask for a Zoom host signature; only staff can host now.
  - Encryption: AES-256-GCM, switched on by `INTEGRATIONS_ENCRYPTION_KEY`; values saved before still read until encrypted. 13 checks passed (round trip, tampering refused, masking, merge, missing key).
  - Left alone: Keap (being removed) still reads keys directly and refreshes its token across tenants.
- [x] Client Portal session switched `api/user/payment-methods` (3 routes) to `getStripeClient` (22 Nov 2026). A disabled Stripe integration now reads as "not configured" there too.
- [x] **Owner:** lock SQL run and secrets encrypted (22 Nov 2026). Checked: all saved values encrypted (Stripe, DocuSign, Zoom, Daily, SMTP, Keap); browsers get "permission denied" on the table; the app decrypts and Stripe accepts the key. Still to confirm: the same `INTEGRATIONS_ENCRYPTION_KEY` is set on Vercel and the new code is deployed (old code can't read encrypted keys). Keap no longer works, as expected.
- [ ] Add the DocuSign Connect HMAC key under Integrations → DocuSign, or contract-signed updates will be refused.
- [ ] Review database access rules on every table: old scripts also opened email system, audit and help tables to any signed-in user. Needs the live rules (paste the result of `select tablename, policyname, cmd, roles, qual from pg_policies where schemaname='public' order by 1` from the SQL editor), or a database connection string in `.env.local`.
- [x] Set up lint (`.eslintrc.json` with the Next.js rules; `npm run lint` runs without prompting: 0 errors, 130 warnings. Quotes in text and variables named `module` are warnings for now, since they're cosmetic and would otherwise fail the Vercel build. The warnings are mostly missing hook dependencies and plain `<img>` tags, to clean up gradually.)
- [x] Clean production build (passes with lint and type checks, 22 Nov 2026; the only warning comes from the handlebars library and is harmless. `NEXT_DIST_DIR=.next-build npx next build` builds beside a running dev server; afterwards delete `.next-build` and undo the line Next.js adds to `tsconfig.json`.)
