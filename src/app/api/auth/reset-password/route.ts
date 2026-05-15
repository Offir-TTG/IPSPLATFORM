import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { renderEmailTemplate } from '@/lib/email/renderTemplate';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('\n🔷 [RESET PASSWORD] Starting password reset flow...');
    const { email, language = 'en' } = await request.json();
    console.log('📧 Email:', email);
    console.log('🌐 Language:', language);

    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create admin client (bypasses RLS) for database queries
    console.log('🔑 Creating admin client...');
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get current tenant
    console.log('🏢 Fetching tenant...');
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      console.log('❌ Tenant not found');
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }
    console.log('✅ Tenant found:', tenant.id, tenant.name);

    // Find user by email in this tenant (using admin client to bypass RLS)
    console.log('👤 Looking up user by email...');
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single();

    if (userError || !users) {
      console.log('⚠️ User not found or error:', userError?.message);
      // For security, don't reveal if email exists or not
      // Return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent',
      });
    }
    console.log('✅ User found:', users.id, users.first_name);

    // Verify user belongs to this tenant (using admin client to bypass RLS)
    console.log('🔗 Verifying user belongs to tenant...');
    console.log('   Looking for tenant_id:', tenant.id);
    console.log('   Looking for user_id:', users.id);

    const { data: tenantUser, error: tenantUserError } = await supabaseAdmin
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', users.id)
      .single();

    console.log('   Query result:', { data: tenantUser, error: tenantUserError });

    if (tenantUserError || !tenantUser) {
      console.log('⚠️ User does not belong to this tenant');
      console.log('   Error:', tenantUserError);
      // User doesn't belong to this tenant - still return success for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent',
      });
    }
    console.log('✅ User verified in tenant');

    // Generate password reset link without sending email.
    //
    // We deliberately *do not* email Supabase's `action_link` here. That link
    // routes through Supabase's verify endpoint and redirects with a PKCE
    // `?code=` to the browser — but the browser client never created a
    // matching `code_verifier` (the code was minted server-side via the
    // admin API), so `detectSessionInUrl` silently fails and the confirm
    // page sees no auth event. We use `hashed_token` instead and have the
    // confirm page call `verifyOtp` (OTP flow — no code_verifier needed).
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`;
    console.log('🔗 Generating reset link...');
    console.log('   Redirect URL:', redirectUrl);

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (resetError || !resetData) {
      console.error('❌ Error generating password reset link:', resetError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate password reset link' },
        { status: 500 }
      );
    }

    const hashedToken = resetData.properties?.hashed_token;
    if (!hashedToken) {
      console.error('❌ generateLink response missing hashed_token');
      return NextResponse.json(
        { success: false, error: 'Failed to generate password reset link' },
        { status: 500 }
      );
    }
    const resetUrl = `${redirectUrl}?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
    console.log('✅ Reset link generated successfully');
    console.log('   Link preview:', resetUrl.substring(0, 80) + '...');

    // Render custom email template
    console.log('📄 Rendering email template...');
    console.log('   Template key: system.password_reset');
    console.log('   Tenant ID:', tenant.id);
    console.log('   Language:', language);

    const renderedEmail = await renderEmailTemplate({
      templateKey: 'system.password_reset',
      tenantId: tenant.id,
      languageCode: language === 'he' ? 'he' : 'en',
      variables: {
        userName: users.first_name || 'User',
        resetUrl: resetUrl,
        expiresIn: '24',
        organizationName: tenant.name || 'Platform',
      },
    });

    if (!renderedEmail) {
      console.error('❌ Email template rendering failed');
      return NextResponse.json({
        success: false,
        error: 'Failed to render email template',
      }, { status: 500 });
    }
    console.log('✅ Email template rendered successfully');

    // Send custom email
    console.log('📮 Preparing to send email...');
    console.log('   To:', email);
    console.log('   Subject:', renderedEmail.subject);
    console.log('   SMTP Host:', process.env.SMTP_HOST || 'NOT CONFIGURED');
    console.log('   SMTP Port:', process.env.SMTP_PORT || 'NOT CONFIGURED');
    console.log('   SMTP User:', process.env.SMTP_USER || 'NOT CONFIGURED');
    console.log('   SMTP From:', process.env.SMTP_FROM || 'NOT CONFIGURED');

    const emailResult = await sendEmail({
      to: email,
      subject: renderedEmail.subject,
      html: renderedEmail.bodyHtml,
      text: renderedEmail.bodyText,
      tenantId: tenant.id,
    });

    console.log('📬 Email send result:', emailResult);

    if (!emailResult.success) {
      console.error('❌ Failed to send password reset email:', emailResult.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to send password reset email',
      }, { status: 500 });
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('   Message ID:', emailResult.messageId);
    console.log('🔷 [RESET PASSWORD] Flow completed successfully\n');

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while sending reset email' },
      { status: 500 }
    );
  }
}
