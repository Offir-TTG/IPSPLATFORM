# DocuSign Integration - Complete Setup Guide

## Step-by-Step Setup Instructions

### 1. Create DocuSign Developer Account

1. Go to [DocuSign Developer Center](https://developers.docusign.com/)
2. Click **Get Started for Free**
3. Complete the registration process
4. You'll receive a demo account with sandbox environment

### 2. Create Integration App

1. Log into [DocuSign Admin Console](https://admindemo.docusign.com/)
2. Go to **Settings** → **Apps and Keys**
3. Click **Add App and Integration Key**
4. Fill in:
   - **App Name**: IPS Platform (or your app name)
   - **Description**: Integration for enrollment contract management
5. Click **Create App**
6. **IMPORTANT**: Copy and save the **Integration Key** (GUID format)

### 3. Configure JWT Authentication

1. In your app settings, scroll to **Service Integration**
2. Under **Authentication**, select **JWT (JSON Web Token)**
3. Click **Generate RSA** button
4. A modal will appear with:
   - **Public Key** (shown in the modal)
   - **Download Private Key** button
5. Click **Download Private Key** and save the file
6. **CRITICAL**: Open the private key file and verify it looks like this:

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxyz...
(many lines of base64 characters)
...xyz123==
-----END RSA PRIVATE KEY-----
```

### 4. Add Redirect URI

1. Still in app settings, scroll to **Redirect URIs**
2. Click **Add URI**
3. Add these URLs:
   - Development: `http://localhost:3000/admin/config/integrations`
   - Production: `https://yourdomain.com/admin/config/integrations`
4. Click **Save**

### 5. Get Your User ID

1. In the Admin Console, go to **Users**
2. Click on your username
3. In the URL, you'll see something like:
   ```
   https://admindemo.docusign.com/users/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   ```
4. Copy the GUID (the long string with dashes) - this is your **User ID**

### 6. Get Your Account ID

**Method 1: From API Request**
1. You can find this after successfully authenticating
2. Or check the DocuSign Admin URL - it's in the URL bar

**Method 2: From User Info**
1. After granting consent (step 8), the account ID will be in the response
2. For sandbox, it typically looks like: `12345678-1234-1234-1234-123456789012`

### 7. Configure in IPS Platform

1. Go to your IPS Platform: `http://localhost:3000/admin/config/integrations`
2. Click the **DocuSign** tab
3. Fill in the following fields:

   **Account ID**:
   - Your DocuSign account GUID
   - Example: `12345678-1234-1234-1234-123456789012`

   **Integration Key**:
   - The GUID you copied in Step 2
   - Example: `87654321-4321-4321-4321-210987654321`

   **User ID**:
   - The GUID you copied in Step 5
   - Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

   **RSA Private Key**:
   - Open the private key file you downloaded in Step 3
   - Copy the ENTIRE contents (including BEGIN/END lines)
   - Paste into this field
   - **IMPORTANT**: Make sure you copy ALL lines, including:
     - `-----BEGIN RSA PRIVATE KEY-----`
     - All the middle lines
     - `-----END RSA PRIVATE KEY-----`

   **OAuth Base Path**:
   - Sandbox: `https://account-d.docusign.com`
   - Production: `https://account.docusign.com`

   **API Base Path**:
   - Sandbox: `https://demo.docusign.net/restapi`
   - Production: `https://www.docusign.net/restapi`

4. Click **Save Configuration** (don't enable yet)

### 8. Grant Consent (First Time Only)

1. Click **Test Connection** button
2. You'll see an error: "consent_required"
3. A toast notification will appear with a **clickable link**
4. Click the link - it will open DocuSign's consent page
5. On the DocuSign page:
   - Review the permissions (signature, impersonation)
   - Click **Allow Access**
6. You'll be redirected back to the integrations page
7. Click **Test Connection** again

### 9. Verify Connection

After clicking Test Connection the second time, you should see:
- ✅ **Success**: "DocuSign connection successful! Connected as: [Your Name]"

If you still get errors, see the Troubleshooting section below.

### 10. Enable and Save

1. Toggle the integration to **Enabled**
2. Click **Save Configuration**
3. Your DocuSign integration is now active!

---

## Troubleshooting Common Errors

### Error: "no_valid_keys_or_signatures"

**Cause**: The private key doesn't match the integration key, or the key is malformed.

**Solutions**:
1. **Regenerate the RSA keypair**:
   - Go to DocuSign → Apps and Keys → Your App
   - Click **Actions** → **Delete RSA Keypairs**
   - Click **Generate RSA** again
   - Download the new private key
   - Copy the new key to IPS Platform

2. **Verify the Integration Key**:
   - Make sure the Integration Key in IPS Platform matches the app that owns the RSA keypair
   - Each app has its own keypair - you can't mix keys between apps

3. **Check the private key format**:
   - Open the private key file in a text editor
   - Verify it starts with `-----BEGIN RSA PRIVATE KEY-----`
   - Verify it ends with `-----END RSA PRIVATE KEY-----`
   - Make sure there are no extra spaces or characters
   - Copy the ENTIRE key including begin/end lines

### Error: "consent_required"

**Cause**: You haven't granted consent to the application yet.

**Solution**:
1. Click the consent link in the toast notification
2. Or manually build the consent URL:
   ```
   https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATION_KEY&redirect_uri=http://localhost:3000/admin/config/integrations
   ```
   Replace `YOUR_INTEGRATION_KEY` with your actual integration key
3. Visit the URL and click "Allow Access"

### Error: "Invalid private key format"

**Cause**: The private key is not in the correct PEM format.

**Solution**:
1. Re-download the private key from DocuSign
2. Open it in a text editor (Notepad, VS Code, etc.)
3. Make sure it looks exactly like:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   [multiple lines of base64 text]
   -----END RSA PRIVATE KEY-----
   ```
4. Copy and paste the entire content

### Error: "Missing required fields"

**Cause**: One or more required fields are empty.

**Solution**:
- Fill in all required fields (marked with *)
- All fields should have values before testing

### Connection test passes but sending fails

**Cause**: Might be using sandbox when you need production or vice versa.

**Solution**:
1. Verify you're using the correct OAuth and API base paths for your environment
2. Make sure your templates exist in the same environment you're testing
3. Check that your account has the necessary permissions

---

## Testing Your Integration

Once the connection test succeeds:

1. **Create a Template** (optional for testing):
   - In DocuSign, go to **Templates**
   - Create a new template with signature fields
   - Save and note the Template ID

2. **Test Sending** (when implemented):
   - Go to an enrollment
   - Click "Send Contract"
   - Verify the contract is sent via DocuSign

---

## Security Notes

1. **Private Key Storage**:
   - The private key is stored encrypted in the database
   - Never commit private keys to version control
   - Keep the downloaded private key file secure

2. **Environment Separation**:
   - Use different keys for development and production
   - Sandbox keys cannot be used in production

3. **Token Expiration**:
   - Access tokens expire after 1 hour
   - The system automatically requests new tokens

---

## Next Steps

After successful integration:

1. ✅ Test connection works
2. ✅ Enable the integration
3. ✅ Save configuration
4. 📋 Create DocuSign templates for your contracts
5. 📋 Configure webhook URL in DocuSign Connect
6. 📋 Test sending contracts to students
7. 📋 Verify webhook status updates

---

## Support Resources

- [DocuSign Developer Center](https://developers.docusign.com/)
- [JWT Authentication Guide](https://developers.docusign.com/platform/auth/jwt/)
- [API Reference](https://developers.docusign.com/docs/esign-rest-api/reference/)
- [Community Forums](https://community.docusign.com/)
