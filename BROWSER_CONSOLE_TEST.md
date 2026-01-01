# Browser Console Test for Email Templates

Open browser DevTools (F12) and paste this code into the Console tab:

```javascript
// Test 1: Check what the page currently sees
console.log('Current templates state:', await (async () => {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    'YOUR_SUPABASE_URL',  // Replace with actual URL
    'YOUR_ANON_KEY'        // Replace with actual anon key
  );

  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    return { error: error.message };
  }

  return {
    count: data.length,
    keys: data.map(t => t.template_key),
    hasNotification: data.some(t => t.template_key === 'notification.generic')
  };
})());
```

## Simpler Alternative

Just check the browser's Network tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the email templates page
4. Look for a request to `email_templates`
5. Click on it and check the Response tab
6. See if `notification.generic` is in the response

If it's in the network response but not showing on the page, it's a React rendering issue.
If it's NOT in the network response, it's an RLS/caching issue.
