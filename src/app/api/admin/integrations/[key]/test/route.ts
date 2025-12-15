import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
// import { DocuSignClient } from '@/lib/docusign/client';
// import { ZoomClient } from '@/lib/zoom/client';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Helper function to decrypt credentials (placeholder)
function decryptCredentials(credentials: Record<string, any>): Record<string, any> {
  // In production, use proper decryption
  return credentials;
}

// POST /api/admin/integrations/[key]/test - Test integration connection
export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch integration credentials
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', params.key)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Allow testing even if integration is not enabled
    // Users need to test credentials before enabling
    const credentials = decryptCredentials(integration.credentials || {});

    // Test connection based on integration type
    let testResult = { success: false, message: '' };

    switch (params.key) {
      case 'docusign':
        testResult = await testDocuSignConnection(credentials);
        break;

      case 'stripe':
        testResult = await testStripeConnection(credentials);
        break;

      case 'zoom':
        testResult = await testZoomConnection(credentials);
        break;

      case 'sendgrid':
        testResult = await testSendGridConnection(credentials);
        break;

      case 'twilio':
        testResult = await testTwilioConnection(credentials);
        break;

      case 'keap':
        testResult = await testKeapConnection(credentials);
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported integration type' },
          { status: 400 }
        );
    }

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: testResult.message || 'Connection successful'
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: testResult.message || 'Connection failed'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error(`Error testing ${params.key} connection:`, error);
    return NextResponse.json(
      { error: 'Connection test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Test DocuSign connection
async function testDocuSignConnection(credentials: Record<string, any>) {
  try {
    // Validate required fields
    const requiredFields = ['account_id', 'integration_key', 'user_id', 'private_key', 'oauth_base_path', 'base_path'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Test JWT authentication with DocuSign
    try {
      const jwt = require('jsonwebtoken');

      // Validate and format private key
      let privateKey = credentials.private_key.trim();

      // Ensure proper line breaks in private key
      if (!privateKey.includes('\n')) {
        // If the key is all on one line, try to fix it
        privateKey = privateKey
          .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '-----BEGIN RSA PRIVATE KEY-----\n')
          .replace(/-----END RSA PRIVATE KEY-----/g, '\n-----END RSA PRIVATE KEY-----')
          .replace(/(.{64})/g, '$1\n')
          .replace(/\n\n/g, '\n');
      }

      // Verify key format
      if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----') &&
          !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        return {
          success: false,
          message: 'Invalid private key format. Key must start with "-----BEGIN RSA PRIVATE KEY-----" or "-----BEGIN PRIVATE KEY-----"'
        };
      }

      // Create JWT token
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: credentials.integration_key,
        sub: credentials.user_id,
        aud: credentials.oauth_base_path.replace('https://', ''),
        iat: now,
        exp: now + 3600,
        scope: 'signature impersonation'
      };

      // Sign the JWT with RSA private key
      let token;
      try {
        token = jwt.sign(jwtPayload, privateKey, {
          algorithm: 'RS256',
          header: {
            alg: 'RS256',
            typ: 'JWT'
          }
        });
      } catch (jwtError: any) {
        return {
          success: false,
          message: `Failed to create JWT token: ${jwtError.message}. Please ensure your private key is in the correct PEM format.`
        };
      }

      // Request access token from DocuSign
      console.log('[DocuSign Test] Requesting token with:', {
        oauth_base_path: credentials.oauth_base_path,
        integration_key: credentials.integration_key,
        user_id: credentials.user_id,
        key_starts_with: privateKey.substring(0, 50)
      });

      const tokenResponse = await fetch(`${credentials.oauth_base_path}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: token
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        const errorMsg = errorData.error_description || errorData.error || 'Unknown error';

        console.log('[DocuSign Test] Token request failed:', errorData);

        // Provide helpful messages for common errors
        if (errorMsg.includes('no_valid_keys_or_signatures')) {
          return {
            success: false,
            message: `DocuSign authentication failed: Invalid RSA key pair.

TROUBLESHOOTING STEPS:
1. Go to DocuSign Admin → Apps and Keys → Find your app
2. Delete existing RSA keypairs (Actions → Delete RSA Keypairs)
3. Generate a new RSA keypair (Generate RSA button)
4. Download the new private key file
5. Copy the Integration Key from the SAME app
6. Paste BOTH in IPS Platform and try again

Integration Key entered: ${credentials.integration_key.substring(0, 8)}...`
          };
        }

        if (errorMsg.includes('consent_required')) {
          const consentUrl = `${credentials.oauth_base_path}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${credentials.integration_key}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/config/integrations`;

          return {
            success: false,
            message: `DocuSign authentication failed: Consent required.

GRANT CONSENT:
Click this link to grant consent: ${consentUrl}

Or manually visit DocuSign and grant consent for this integration.`
          };
        }

        return {
          success: false,
          message: `DocuSign authentication failed: ${errorMsg}\n\nFull error: ${JSON.stringify(errorData, null, 2)}`
        };
      }

      const tokenData = await tokenResponse.json();

      // Test API access by getting user info
      const userInfoResponse = await fetch(`${credentials.oauth_base_path}/oauth/userinfo`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      if (!userInfoResponse.ok) {
        return {
          success: false,
          message: 'DocuSign authentication succeeded but failed to retrieve user info'
        };
      }

      const userInfo = await userInfoResponse.json();

      return {
        success: true,
        message: `DocuSign connection successful! Connected as: ${userInfo.name || userInfo.email || 'User'}`
      };

    } catch (authError: any) {
      // Check for specific JWT errors
      if (authError.message?.includes('PEM')) {
        return {
          success: false,
          message: 'Invalid RSA private key format. Please ensure you copied the complete private key including BEGIN/END lines.'
        };
      }

      return {
        success: false,
        message: `DocuSign authentication failed: ${authError.message || 'Unknown error'}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'DocuSign connection failed'
    };
  }
}

// Test Stripe connection
async function testStripeConnection(credentials: Record<string, any>) {
  try {
    if (!credentials.secret_key) {
      return {
        success: false,
        message: 'Stripe secret key is missing'
      };
    }

    const stripe = new Stripe(credentials.secret_key, {
      apiVersion: '2023-10-16',
    });

    // Try to retrieve account details
    const account = await stripe.accounts.retrieve();

    if (account) {
      return {
        success: true,
        message: `Connected to Stripe account: ${account.email || account.id}`
      };
    } else {
      return {
        success: false,
        message: 'Failed to retrieve Stripe account'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Stripe connection failed'
    };
  }
}

// Test Zoom connection
async function testZoomConnection(credentials: Record<string, any>) {
  try {
    // Validate required fields
    const requiredFields = ['account_id', 'client_id', 'client_secret'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Test Server-to-Server OAuth with Zoom
    try {
      // Get access token
      const tokenResponse = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'account_credentials',
          account_id: credentials.account_id
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        const errorMsg = errorData.reason || errorData.error || 'Authentication failed';

        return {
          success: false,
          message: `Zoom authentication failed: ${errorMsg}. Please verify your Account ID, Client ID, and Client Secret.`
        };
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Test API access by listing users (works with user:read:admin scope)
      const usersResponse = await fetch('https://api.zoom.us/v2/users?page_size=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();

        // Provide helpful error message about scopes
        if (errorData.message && errorData.message.includes('scope')) {
          return {
            success: false,
            message: `Zoom API test failed: Missing required scopes. Please ensure your Zoom app has these scopes enabled in the Zoom Marketplace:\n\n✓ user:read:admin\n✓ meeting:write:admin\n✓ meeting:read:admin\n✓ recording:write:admin\n✓ recording:read:admin\n\nAfter adding scopes, you may need to wait a few minutes and try again.`
          };
        }

        return {
          success: false,
          message: `Zoom API test failed: ${errorData.message || 'Could not access Zoom API'}`
        };
      }

      const usersData = await usersResponse.json();
      const accountInfo = usersData.users && usersData.users.length > 0 ? usersData.users[0] : null;

      if (accountInfo) {
        return {
          success: true,
          message: `Connected to Zoom successfully! Account: ${accountInfo.first_name} ${accountInfo.last_name} (${accountInfo.email})`
        };
      } else {
        return {
          success: true,
          message: `Connected to Zoom successfully! Authentication verified.`
        };
      }

    } catch (authError: any) {
      return {
        success: false,
        message: `Zoom connection test failed: ${authError.message || 'Unknown error'}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Zoom connection failed'
    };
  }
}

// Test SendGrid connection
async function testSendGridConnection(credentials: Record<string, any>) {
  try {
    if (!credentials.api_key) {
      return {
        success: false,
        message: 'SendGrid API key is missing'
      };
    }

    // Test SendGrid API connection
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Connected to SendGrid account: ${data.email || 'Success'}`
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'Invalid SendGrid API key'
      };
    } else {
      return {
        success: false,
        message: `SendGrid API error: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'SendGrid connection failed'
    };
  }
}

// Test Twilio connection
async function testTwilioConnection(credentials: Record<string, any>) {
  try {
    if (!credentials.account_sid || !credentials.auth_token) {
      return {
        success: false,
        message: 'Twilio account SID or auth token is missing'
      };
    }

    // Test Twilio API connection
    const authString = Buffer.from(
      `${credentials.account_sid}:${credentials.auth_token}`
    ).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${credentials.account_sid}.json`,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Connected to Twilio account: ${data.friendly_name || credentials.account_sid}`
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'Invalid Twilio credentials'
      };
    } else {
      return {
        success: false,
        message: `Twilio API error: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Twilio connection failed'
    };
  }
}

// Test Keap connection
async function testKeapConnection(credentials: Record<string, any>) {
  try {
    // Validate required fields
    const requiredFields = ['client_id', 'client_secret'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Check if we have tokens already
    if (!credentials.access_token || !credentials.refresh_token) {
      // Generate OAuth authorization URL
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/config/integrations`;
      const authUrl = `https://signin.infusionsoft.com/app/oauth/authorize?client_id=${credentials.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=full`;

      return {
        success: false,
        message: `Keap requires OAuth authorization.

AUTHORIZATION REQUIRED:
1. Click this link to authorize: ${authUrl}
2. After authorization, you'll receive an access token and refresh token
3. The system will automatically save these tokens

Note: This is a one-time setup. After authorization, the tokens will auto-refresh.`
      };
    }

    // Test with existing access token or refresh it
    try {
      // Try to get account info with current access token
      const accountResponse = await fetch('https://api.infusionsoft.com/crm/rest/v1/account/profile', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        return {
          success: true,
          message: `Connected to Keap account: ${accountData.company_name || accountData.email || 'Success'}`
        };
      }

      // If access token is expired, try to refresh it
      if (accountResponse.status === 401 && credentials.refresh_token) {
        const authString = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');

        const refreshResponse = await fetch('https://api.infusionsoft.com/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: credentials.refresh_token
          })
        });

        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json();
          return {
            success: false,
            message: `Failed to refresh Keap token: ${errorData.error_description || errorData.error || 'Token refresh failed'}. You may need to re-authorize the application.`
          };
        }

        const tokenData = await refreshResponse.json();

        // Update credentials with new tokens
        const supabase = await createClient();
        await supabase
          .from('integrations')
          .update({
            credentials: {
              ...credentials,
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token
            }
          })
          .eq('integration_key', 'keap');

        // Test again with new token
        const retryResponse = await fetch('https://api.infusionsoft.com/crm/rest/v1/account/profile', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (retryResponse.ok) {
          const accountData = await retryResponse.json();
          return {
            success: true,
            message: `Connected to Keap account: ${accountData.company_name || accountData.email || 'Success'} (token refreshed)`
          };
        }
      }

      return {
        success: false,
        message: `Keap API error: ${accountResponse.statusText}. Status: ${accountResponse.status}`
      };

    } catch (apiError: any) {
      return {
        success: false,
        message: `Keap API test failed: ${apiError.message || 'Unknown error'}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Keap connection failed'
    };
  }
}