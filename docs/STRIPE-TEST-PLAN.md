# Stripe test-mode run

A real run of every payment path against Stripe **test mode**, before anyone
pays. Every fix so far was checked against a fake Stripe; this proves the real
thing. About 1½–2 hours. Do it on your machine (`npm run dev`, port 3001).

After each step, run the checker and compare with **Expect**:

```
npx tsx scripts/show-enrollment.ts <test client email>
```

## 0. Setup (once)

1. **Stripe test keys.** In Admin → Integrations → Stripe, use the *test* keys
   (`sk_test_…`, `pk_test_…`). Write down the live keys first so you can put
   them back.
2. **Forward webhooks to your machine.** Install the Stripe CLI, then:
   ```
   stripe login
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```
   It prints a signing secret (`whsec_…`). Paste it into Integrations → Stripe →
   Webhook secret and save. Keep this window open; it shows every event and
   whether the app answered 200.
3. **Products.** Make (or reuse) three test products, each a few dollars:
   - **A** paid in full
   - **B** installment plan: deposit + 3 monthly payments
   - **C** monthly subscription
4. **Test clients.** Use a new email per scenario (Gmail `+` addresses work:
   `you+t1@gmail.com`, `you+t2@gmail.com`, …).
5. **Running the daily jobs by hand.** In a second terminal (Git Bash), using
   the `CRON_SECRET` from `.env.local`:
   ```
   cron() { curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3001/api/cron/$1"; echo; }
   cron create-payment-invoices      # charges payments that are due
   cron retry-failed-payments        # retries failed ones
   cron check-overdue-payments       # suspends overdue enrollments
   ```
6. **Making a future payment "due now".** In the Supabase table editor, set that
   payment's `scheduled_date` in `payment_schedules` to yesterday. Or use Admin
   → Payments → Schedules → Adjust date.

**Test cards** (any future expiry, any CVC, any ZIP):

| Card | Behaviour |
|---|---|
| `4242 4242 4242 4242` | Always succeeds |
| `4000 0000 0000 0002` | Declined at checkout |
| `4000 0000 0000 9995` | Declined: insufficient funds |
| `4000 0025 0000 3155` | Asks for 3-D Secure confirmation |
| `4000 0000 0000 0341` | Saves fine, **declines later charges** (for installments) |

## 1. Pay in full (product A, card 4242)

Enroll through the public page and finish the wizard.

**Expect:** enrollment `active`, `payment_status=paid`, paid = total. One
schedule `#1 full … paid`, one payment `paid`. Stripe CLI window: `payment_intent.succeeded` answered 200. Stripe dashboard: one charge,
and one receipt invoice (not two).

Then press **Pay** again or refresh the last wizard step.
**Expect:** no second charge in Stripe.

## 2. Card declined at checkout (product A, card 0002, then 4242)

**Expect after 0002:** the wizard shows the decline; enrollment not active; no
payment record. **After retrying with 4242:** like step 1, one charge only.

## 3. 3-D Secure (product A, card 3155)

Complete the confirmation pop-up.
**Expect:** like step 1. Cancel the pop-up on a second try: not charged, not active.

## 4. Installment plan (product B, card 4242)

**Expect:** active, `payment_status=partial`, paid = deposit. Schedule: `#1
deposit paid`, `#2–#4 installment pending` with dates a month apart (a 31st
start date lands on the month's last day). Stripe: only the deposit charged.

Make #2 due (setup step 6), run `cron create-payment-invoices`.
**Expect:** #2 `paid` with an `in_…` invoice id, paid amount up by one
installment, one invoice in Stripe charged to the saved card. **Nothing
emailed for the client to pay.** Run the cron again: nothing new charged.

## 5. Installment declines, retry, suspend, restore (product B, card 0341)

Enroll with 0341 (the deposit goes through). Make #2 due, run `cron create-payment-invoices`.
**Expect:** #2 `failed`, `last error` shows the real decline reason, a
`next_retry_date`, retries=1. The client gets a failed-payment email.

Run `cron retry-failed-payments` after setting `next_retry_date` to yesterday.
**Expect:** still `failed`, retries=2, the **same** `in_…` invoice (not a new one).

Set #2's `scheduled_date` 8+ days in the past, run `cron check-overdue-payments`.
**Expect:** enrollment `suspended`, `payment_status=overdue`; the client can't
open the course.

Admin → Payments → Schedules → #2 → **Charge now**, choosing a new card
(add `4242` for this customer in the Stripe dashboard first).
**Expect:** #2 `paid`, enrollment back to `active` automatically, course opens.
Press Charge now twice quickly on another due payment: **one** charge only.

## 6. Subscription renews (product C, card 4242)

**Expect:** active, `#1 subscription paid`.
Set #1's `scheduled_date` back a month and a day, run `cron create-payment-invoices`.
**Expect:** a new `#2 subscription` created and paid in the same run. Run again:
no #3 yet.

## 7. Admin refunds (use the client from step 4)

Admin → Payments → Transactions → the deposit → **Refund** part of it (e.g. $1).
**Expect:** payment `partially_refunded`, refunded=1, paid amount down by 1,
schedule still `paid`. Stripe: one refund.
Press Refund twice quickly with the same amount: one refund only.
Refund **the rest** with "full refund".
**Expect:** payment `refunded`, schedule `refunded`, paid amount down by the deposit.

## 8. Refund from the Stripe dashboard (client from step 1)

Refund part of the charge in Stripe itself.
**Expect (via webhook, within seconds):** payment `partially_refunded`, paid amount reduced.

## 9. Admin cancel with refund (new product-B client, deposit + #2 paid)

Admin → Enrollments → Cancel, with a refund larger than the last payment
(so it spans two payments).
**Expect:** enrollment `cancelled`; #3 and #4 `cancelled`; refund split across
the two payments, newest first; paid amount reduced; payment status `refunded`
if everything was returned. Stripe: two refunds adding up to the amount.
Try to cancel again: "already cancelled". Reopen the client's enrollment link
and try to finish: refused.

Also try a refund **larger than what was paid**: refused before anything changes.

## 10. Restructure (new product-B client with #2 failed, card 0341)

Admin → Payments → Schedules → Restructure into 2 payments.
**Expect:** old #2–#4 `cancelled` (the failed one too), two new installments
whose total equals exactly what was still owed (whole cents), numbered after
the old ones. The old #2's Stripe invoice is **void**.

## 11. Record a cash payment (new product-B client)

Admin → record #2 as paid by bank transfer.
**Expect:** #2 `paid`, payment linked to it, paid amount up; if #2 had a Stripe
invoice it's now void. Run `cron create-payment-invoices`: #2 not charged.

## 12. Change plan after paying

On a product with alternative plans, pay the deposit, then go back in the
wizard and pick another plan.
**Expect:** refused ("payment already started"); schedule unchanged.

## After the run

- Put the **live** Stripe keys and live webhook secret back in Integrations.
- Check the live webhook endpoint in the Stripe dashboard points at
  `https://<your domain>/api/webhooks/stripe`, with these events:
  `payment_intent.succeeded`, `payment_intent.payment_failed`,
  `invoice.payment_succeeded`, `invoice.payment_failed`, `invoice.paid`,
  `invoice.voided`, `invoice.marked_uncollectible`, `invoice.finalized`,
  `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`,
  `charge.dispute.closed`, `checkout.session.completed`.
- Note anything that didn't match **Expect** and send it to me with the
  checker's output.
