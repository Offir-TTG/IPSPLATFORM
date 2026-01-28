# Payment Disputes Testing Guide

Complete guide to test the payment disputes feature implementation.

## Prerequisites

1. **Database Migration Applied**
   - Run the migration SQL in Supabase SQL Editor:
   - File: `supabase/migrations/20260127000001_create_payment_disputes_clean.sql`
   - Or copy/paste from the migration file

2. **Translation Cache Updated**
   - Cache version incremented to 27
   - Translations will load automatically

3. **Stripe Account Access**
   - Stripe Dashboard access
   - Stripe CLI installed (optional, for webhook testing)

---

## Test Plan

### Phase 1: Database & Infrastructure Tests

#### 1.1 Verify Table Creation
```bash
npx tsx scripts/check-disputes-table.ts
```

**Expected Result:**
- ✅ Table exists and is accessible
- Shows current dispute count (0 initially)
- Confirms table structure is ready

#### 1.2 Run Full Feature Tests
```bash
npx tsx scripts/test-disputes-feature.ts
```

**Tests Performed:**
- Table exists ✅
- Insert dispute record ✅
- Query disputes ✅
- Update dispute status ✅
- API endpoint accessible ✅
- RLS policies configured ✅
- Database indexes created ✅

**Expected Result:**
- 7/7 tests pass
- 100% success rate
- Test data cleaned up automatically

---

### Phase 2: Webhook Handler Tests

#### 2.1 Simulate Dispute Creation
```bash
npx tsx scripts/simulate-dispute-webhook.ts
```

**What It Does:**
- Creates a realistic test dispute
- Links to existing payment (if available)
- Simulates `charge.dispute.created` webhook event
- Creates admin notification
- Tests database queries with joins

**Expected Result:**
- ✅ Dispute created successfully
- ✅ Notification created
- ✅ Can query dispute with user/product info
- Provides dispute ID for further testing

#### 2.2 Test with Stripe CLI (Real Webhooks)

**Setup:**
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local dev
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Trigger Test Events:**
```bash
# Create a dispute
stripe trigger charge.dispute.created

# Update a dispute
stripe trigger charge.dispute.updated

# Close a dispute
stripe trigger charge.dispute.closed
```

**Expected Results:**
- Webhooks received at local endpoint
- Disputes created in database
- Console logs show webhook processing
- Disputes appear in admin UI

---

### Phase 3: API Endpoint Tests

#### 3.1 Test Disputes List API

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments/disputes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Test Cases:**

1. **Get all disputes:**
   ```
   GET /api/admin/payments/disputes
   ```

2. **Filter by status:**
   ```
   GET /api/admin/payments/disputes?status=needs_response
   GET /api/admin/payments/disputes?status=won
   GET /api/admin/payments/disputes?status=lost
   ```

3. **Search by user:**
   ```
   GET /api/admin/payments/disputes?search=john
   GET /api/admin/payments/disputes?search=user@example.com
   ```

4. **Search by dispute ID:**
   ```
   GET /api/admin/payments/disputes?search=dp_
   ```

**Expected Response:**
```json
{
  "success": true,
  "disputes": [
    {
      "id": "uuid",
      "disputeId": "dp_xxx",
      "chargeId": "ch_xxx",
      "amount": 99.99,
      "currency": "USD",
      "reason": "fraudulent",
      "status": "needs_response",
      "created": "2026-01-27T...",
      "evidenceDue": "2026-02-03T...",
      "evidenceSubmitted": false,
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "product": {
        "id": "uuid",
        "name": "Course Name"
      },
      "transactionId": "pi_xxx"
    }
  ]
}
```

#### 3.2 Test Evidence Submission API

**Request:**
```bash
curl -X POST "http://localhost:3000/api/admin/payments/disputes/DISPUTE_ID/evidence" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPurchaseIp": "192.168.1.1",
    "receiptUrl": "https://example.com/receipt",
    "productDescription": "Online course access",
    "customerCommunication": "Email exchange showing delivery"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Evidence submitted successfully"
}
```

**Verify:**
- Check Stripe dashboard for submitted evidence
- Dispute status updated to `evidence_submitted: true`
- `evidence_submitted_at` timestamp set

---

### Phase 4: UI Tests

#### 4.1 Access Disputes Page
1. Navigate to: `/admin/payments/disputes`
2. Log in as admin

**Check:**
- ✅ Page loads without errors
- ✅ Hebrew translations display correctly
- ✅ Summary cards show correct counts
- ✅ Table displays disputes (if any exist)

#### 4.2 Test Filters
1. **Status filter:**
   - Select "Needs Response"
   - Verify only disputes with status `needs_response` show
   - Test all status options

2. **Search:**
   - Search by user name
   - Search by email
   - Search by dispute ID
   - Verify results filter correctly

3. **Refresh:**
   - Click refresh button
   - Verify data reloads

#### 4.3 Test Dispute Details Dialog
1. Click on a dispute row
2. Verify dialog opens
3. Check all fields display:
   - Dispute ID
   - User info
   - Product info
   - Amount
   - Reason
   - Created date
   - Evidence due date
   - Transaction ID

4. Click "Open in Stripe"
5. Verify Stripe dashboard opens

#### 4.4 Test Evidence Submission
1. Click "Submit Evidence" on dispute with `needs_response` status
2. Fill in evidence form:
   - Customer Name
   - Customer Email
   - Customer Purchase IP
   - Receipt URL
   - Product Description
   - Customer Communication

3. Submit form
4. Verify:
   - Success toast appears
   - Evidence submitted flag updates
   - Stripe receives evidence

#### 4.5 Test Urgent Alerts
1. Create test dispute with past evidence deadline:
   ```sql
   UPDATE payment_disputes
   SET evidence_due_date = NOW() - INTERVAL '1 day'
   WHERE id = 'dispute_id';
   ```

2. Refresh disputes page
3. Verify urgent alert appears:
   - Red alert banner
   - Shows count of overdue disputes
   - "OVERDUE" badge on dispute row

---

### Phase 5: Translation Tests

#### 5.1 Verify Hebrew Translations
1. Switch language to Hebrew (if language switcher available)
2. Navigate to disputes page
3. Verify all UI elements in Hebrew:
   - Page title: "תביעות תשלום"
   - Summary cards
   - Filter labels
   - Table headers
   - Status badges
   - Dialog text
   - Button labels

#### 5.2 Test Translation Keys
Run translation check:
```bash
npx tsx scripts/verify-disputes-translations.ts
```

**Create verification script:**
```typescript
// scripts/verify-disputes-translations.ts
import { createClient } from '@supabase/supabase-js';

const requiredKeys = [
  'admin.payments.disputes.title',
  'admin.payments.disputes.totalDisputes',
  'admin.payments.disputes.needsResponse',
  'admin.payments.disputes.status.needsResponse',
  'admin.payments.disputes.evidence.title',
  // ... all 62 keys
];

// Check each key exists in both EN and HE
```

---

### Phase 6: Integration Tests

#### 6.1 Full Dispute Lifecycle Test

**Scenario:** Simulate complete dispute from creation to resolution

1. **Create Dispute (via webhook simulation):**
   ```bash
   npx tsx scripts/simulate-dispute-webhook.ts
   ```

2. **Admin Reviews:**
   - Access `/admin/payments/disputes`
   - Verify dispute appears with status "Needs Response"
   - Evidence deadline shows 7 days from creation

3. **Submit Evidence:**
   - Click "Submit Evidence"
   - Fill form with complete information
   - Submit

4. **Update Status (simulate Stripe update):**
   ```sql
   UPDATE payment_disputes
   SET status = 'under_review',
       updated_at = NOW()
   WHERE stripe_dispute_id = 'dp_test_xxx';
   ```

5. **Verify Status Update:**
   - Refresh page
   - Status badge shows "Under Review"

6. **Resolve Dispute (simulate webhook):**
   ```sql
   UPDATE payment_disputes
   SET status = 'won',
       updated_at = NOW()
   WHERE stripe_dispute_id = 'dp_test_xxx';
   ```

7. **Verify Resolution:**
   - Status shows "Won"
   - Summary cards update
   - Notification created

---

### Phase 7: Error Handling Tests

#### 7.1 Test Missing Evidence Deadline
1. Try to submit evidence for dispute with past deadline
2. Verify error: "Evidence deadline has passed"

#### 7.2 Test Invalid Dispute ID
```bash
curl -X POST "http://localhost:3000/api/admin/payments/disputes/invalid-id/evidence"
```
Expected: 404 Not Found

#### 7.3 Test Unauthorized Access
1. Log out
2. Try to access `/admin/payments/disputes`
3. Verify redirect to login

#### 7.4 Test RLS Policies
1. Create dispute for Tenant A
2. Log in as admin for Tenant B
3. Verify dispute is NOT visible
4. Confirms tenant isolation working

---

## Test Data Cleanup

### Remove All Test Disputes
```sql
-- Delete test disputes (marked with test metadata)
DELETE FROM payment_disputes
WHERE metadata->>'test' = 'true';

-- Or delete all disputes (careful!)
DELETE FROM payment_disputes;

-- Reset auto-increment (if needed)
-- N/A for UUID primary keys
```

### Remove Test Notifications
```sql
DELETE FROM notifications
WHERE type IN ('payment_dispute_created', 'payment_dispute_closed')
AND data->>'dispute_id' LIKE 'dp_test_%';
```

---

## Success Criteria

### ✅ All Tests Pass
- [ ] Database table created
- [ ] All 7 infrastructure tests pass
- [ ] Webhook simulation successful
- [ ] API endpoints return correct data
- [ ] UI loads and displays correctly
- [ ] Hebrew translations work
- [ ] Evidence submission works
- [ ] Filters and search work
- [ ] Status updates reflect in UI
- [ ] RLS policies enforce tenant isolation

### ✅ Ready for Production
- [ ] Stripe webhook configured in dashboard
- [ ] Real webhook events create disputes
- [ ] Evidence submits to Stripe successfully
- [ ] Dispute lifecycle complete (created → review → resolved)
- [ ] Notifications created for admins
- [ ] No console errors
- [ ] Responsive design works on mobile

---

## Troubleshooting

### Issue: Table doesn't exist
**Solution:** Run migration SQL in Supabase SQL Editor

### Issue: Translations not showing
**Solution:**
- Clear browser cache
- Verify cache version is 27
- Run translation script again

### Issue: API returns 403
**Solution:**
- Verify admin role
- Check RLS policies
- Verify tenant ID matches

### Issue: Webhook not received
**Solution:**
- Check Stripe webhook configuration
- Verify webhook secret
- Check server logs
- Use Stripe CLI for local testing

---

## Additional Testing Tools

### Stripe Dashboard
- View actual disputes: https://dashboard.stripe.com/test/disputes
- Create test disputes manually
- View evidence submitted
- Check webhook logs

### Supabase Dashboard
- View table data: Tables → payment_disputes
- Check RLS policies: Authentication → Policies
- View logs: Logs → API
- Run SQL queries: SQL Editor

---

## Next Steps After Testing

1. **Monitor Production:**
   - Set up alerts for new disputes
   - Track dispute win/loss rate
   - Monitor evidence submission deadlines

2. **Improve Evidence Collection:**
   - Add file upload for receipts
   - Integrate email communication history
   - Auto-populate customer info

3. **Analytics:**
   - Track dispute reasons
   - Measure response times
   - Calculate financial impact

4. **Automation:**
   - Auto-submit evidence for certain dispute types
   - Send reminders before evidence deadline
   - Auto-escalate high-value disputes
