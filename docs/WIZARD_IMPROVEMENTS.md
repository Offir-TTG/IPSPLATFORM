# Enrollment Wizard Improvements

## Current Issues
1. ❌ No back button - users cannot go back to edit previous steps
2. ❌ No visual completion indicators - can't see which steps are done
3. ❌ Steps jump around - after payment, sometimes goes back to DocuSign
4. ❌ Page refresh loses state - returns to contact information

## Proposed Solutions

### 1. Step Navigation Component
Create a visual step indicator showing all steps with:
- ✓ Completed steps (green checkmark)
- → Current step (highlighted)
- ○ Future steps (grayed out)
- Clickable to go back to completed steps

### 2. Back/Forward Navigation
- Add "Back" button to all steps (except first)
- Add "Next" / "Continue" button for forward movement
- Disable forward button until step validation passes
- Allow free backward navigation to edit completed steps

### 3. Improved State Management
Store wizard state in database (`wizard_status` JSONB field):
```json
{
  "currentStep": "profile|signature|payment|complete",
  "stepsCompleted": {
    "profile": true|false,
    "signature": true|false,
    "payment": true|false
  },
  "lastUpdated": "2025-12-11T20:30:00Z"
}
```

### 4. Step Progression Logic
Clear linear flow:
1. **Profile** (new users only) → Mark complete when all fields valid
2. **Signature** (if required) → Mark complete when DocuSign completed
3. **Payment** (if required) → Mark complete when payment succeeded
4. **Complete** → Final confirmation screen

Rules:
- Can only move forward if current step is complete
- Can always move backward to edit previous steps
- Refresh loads from database state
- No jumping steps

### 5. Visual Design

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Profile    Step 2: Sign      Step 3: Pay      │
│     ✓ Complete          ✓ Complete         → Current    │
│  ─────────────────  ─────────────────  ─────────────── │
└─────────────────────────────────────────────────────────┘

                    [← Back]    [Continue →]
```

## Implementation Plan

### Phase 1: Add Step Indicators Component
- Create `WizardStepIndicator` component
- Show all steps horizontally
- Visual states: completed, current, pending
- Click handler to navigate to previous steps

### Phase 2: Add Navigation Buttons
- Back button: Always visible except on first step
- Forward button: Disabled until step valid
- Handle navigation logic

### Phase 3: Database State Persistence
- Update `wizard_status` on every step completion
- Load state on page mount
- Restore correct step after refresh

### Phase 4: Fix Step Jumping
- Remove automatic step determination on every render
- Only change step on explicit navigation
- Handle DocuSign return properly

## Database Schema

Existing `enrollments` table already has:
```sql
wizard_status JSONB -- Store step progress
```

Update format to:
```json
{
  "currentStep": "payment",
  "completedSteps": ["profile", "signature"],
  "stepData": {
    "profile": { "completedAt": "2025-12-11T20:00:00Z" },
    "signature": { "completedAt": "2025-12-11T20:15:00Z", "envelopeId": "xxx" },
    "payment": { "inProgress": true }
  }
}
```

## Benefits
✅ Better UX - users can go back and edit
✅ Clear progress - visual indicators show what's done
✅ No confusion - stable navigation, no jumping
✅ Reliable - state persists across refreshes
✅ Professional - modern step wizard UI
