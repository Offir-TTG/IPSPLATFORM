# Daily.co Setup Guide

This guide will help you set up Daily.co integration alongside your existing Zoom setup.

## 1. Create Daily.co Account

1. Go to [https://www.daily.co/](https://www.daily.co/)
2. Sign up for a free account
3. The free tier includes:
   - Unlimited rooms
   - Up to 10,000 participant minutes/month
   - Cloud recording (additional cost)
   - No credit card required

## 2. Get Your API Key

1. Log in to [Daily.co Dashboard](https://dashboard.daily.co/)
2. Go to "Developers" section
3. Copy your **API Key**
4. Add it to your `.env.local` file:

```env
DAILY_API_KEY=your_api_key_here
```

## 3. Run Database Migration

Execute the SQL migration to add Daily.co support:

```bash
# Option 1: Via Supabase SQL Editor
# Copy contents of: supabase/SQL Scripts/20251219_add_daily_co_support.sql
# Paste into SQL Editor and run

# Option 2: Via Supabase CLI (if available)
supabase db execute --file "supabase/SQL Scripts/20251219_add_daily_co_support.sql"
```

## 4. Test the Integration

### For Administrators:

1. Go to Admin → LMS → Courses
2. Select a course and click on a lesson
3. You'll see a "Create Daily.co Room" button
4. Click it to create a Daily.co room for that lesson

### For Instructors:

1. Go to your course page
2. Click on a lesson with a Daily.co room
3. Click "Join Meeting"
4. You'll automatically join as **Host** (owner role)
5. You have full control: recording, screen sharing, managing participants

### For Students:

1. Go to your enrolled course
2. Click on a lesson with a Daily.co room
3. Click "Join Meeting"
4. You'll automatically join as **Participant**
5. No need to wait for host approval

## 5. Key Differences: Zoom vs Daily.co

| Feature | Zoom | Daily.co |
|---------|------|----------|
| **Host Assignment** | Manual (Alternative Host) or 3am wake-up | ✅ Automatic via tokens |
| **Start Meeting** | Host must be present first | ✅ Anyone can join anytime |
| **Recording Branding** | Zoom branding in player | Can download & self-host (clean) |
| **Cost** | $15-20/host/month | ~$0.0036/min (~$13 for 60hr/month) |
| **Setup Complexity** | OAuth + SDK + Webhooks | Just API key |
| **Instructor Experience** | Must start meeting manually | ✅ Auto-host when joins |

## 6. How Automatic Role Assignment Works

The magic happens in the token generation (`/api/daily/token`):

1. Student/Instructor clicks "Join Meeting"
2. Backend checks: Is this user an instructor for this course?
3. If **YES**: Token generated with `isOwner: true` → **Automatic host**
4. If **NO**: Token generated with `isOwner: false` → Regular participant
5. Token is cryptographically signed - can't be faked
6. User joins with correct permissions - **no manual intervention needed**

## 7. Next Steps

### Immediate Testing:
1. Add `DAILY_API_KEY` to `.env.local`
2. Run the SQL migration
3. Restart your dev server: `npm run dev`
4. Create a Daily.co room for a test lesson
5. Join as instructor - you'll be host automatically
6. Join as student (different account) - you'll be participant

### Production Deployment:
1. Add `DAILY_API_KEY` to your production environment variables
2. Run the SQL migration on production database
3. Deploy the code
4. Test with real instructors and students

## 8. Recordings

Daily.co recordings work similarly to Zoom:
- Only hosts/instructors can start recording
- Recordings are saved to Daily.co cloud
- You can download recordings via API
- Can self-host in Supabase Storage (removes branding)

## 9. Troubleshooting

### "Failed to generate meeting token"
- Check that `DAILY_API_KEY` is set correctly
- Verify the lesson has a Daily.co room created

### "No Daily.co room configured"
- Admin needs to create a Daily.co room for the lesson first
- Use the "Create Daily.co Room" button in admin panel

### "Unauthorized" error
- User must be logged in
- Check that course_instructors table has correct instructor assignments

## 10. Cost Comparison

**Example: 10 instructors, 50 lessons/month, 2 hours each**
- Total: 100 hours = 6,000 minutes
- Daily.co cost: 6,000 min × $0.0036 = **$21.60/month**
- Zoom cost: 10 hosts × $15 = **$150/month**

**Savings: $128.40/month = $1,540/year**

## Support

If you encounter issues:
1. Check browser console for error messages
2. Check server logs for API errors
3. Verify Daily.co dashboard for room status
4. Contact Daily.co support (they're very responsive)
