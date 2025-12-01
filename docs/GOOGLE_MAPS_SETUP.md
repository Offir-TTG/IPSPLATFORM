# Google Maps Places Autocomplete Setup

This guide will help you set up Google Maps Places Autocomplete for the location field in user profiles.

## Prerequisites

- A Google Cloud Platform account
- Billing enabled on your Google Cloud Platform account (required for Maps API)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "IPS Platform")
5. Click "Create"

## Step 2: Enable the Places API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Places API"
3. Click on "Places API"
4. Click "Enable"

## Step 3: Enable the Maps JavaScript API

1. In the API Library, search for "Maps JavaScript API"
2. Click on "Maps JavaScript API"
3. Click "Enable"

## Step 4: Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS"
3. Select "API key"
4. Your API key will be created and displayed
5. Click "Edit API key" (recommended for security)

## Step 5: Restrict the API Key (Recommended)

### Application Restrictions
1. Under "Application restrictions", select "HTTP referrers (web sites)"
2. Add your website URLs:
   - For development: `http://localhost:3000/*`
   - For production: `https://yourdomain.com/*`

### API Restrictions
1. Under "API restrictions", select "Restrict key"
2. Select the following APIs:
   - Places API
   - Maps JavaScript API

3. Click "Save"

## Step 6: Add API Key to Your Project

1. Open your `.env.local` file in the project root
2. Find or add the following line:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with your actual API key
4. Save the file

## Step 7: Restart Your Development Server

After adding the API key, you need to restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Verification

1. Navigate to the user profile page
2. Click "Edit Profile"
3. In the Location field, you should see: "✓ Location autocomplete ready - start typing to see suggestions"
4. Start typing a city name and you should see autocomplete suggestions

## Troubleshooting

### "Google Maps API key not configured" Error
- Make sure you've added the API key to `.env.local`
- Make sure the environment variable name is exactly: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Restart your development server after adding the key

### "Failed to load Google Maps" Error
- Check that both Places API and Maps JavaScript API are enabled
- Verify your API key is correct
- Check your internet connection
- Check the browser console for more detailed error messages

### Autocomplete Not Working
1. Open the browser console (F12)
2. Look for `[Google Maps]` prefixed messages
3. Check for any errors related to billing or API restrictions
4. Verify your API key restrictions allow your domain

### Billing Issues
Google Maps Platform requires billing to be enabled, but provides a generous free tier:
- $200 free credit per month
- Places Autocomplete: $2.83 per 1,000 requests (after free credit)

For most small to medium applications, you'll stay within the free tier.

## Cost Estimation

With the free tier ($200/month):
- Approximately 70,000 autocomplete requests per month are free
- That's roughly 2,300 profile edits with location searches per day

## Security Best Practices

1. **Always restrict your API key** by:
   - Adding HTTP referrer restrictions
   - Limiting to only the APIs you need

2. **Monitor usage** in Google Cloud Console to avoid unexpected charges

3. **Don't commit API keys** to version control - always use `.env.local`

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places Autocomplete Documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
