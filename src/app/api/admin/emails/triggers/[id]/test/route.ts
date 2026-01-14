import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { testTrigger } from '@/lib/email/triggerEngine';
import { sendEmail } from '@/lib/email/send';
import { renderEmailTemplate } from '@/lib/email/renderTemplate';

// =====================================================
// POST - Test a trigger with sample data
// =====================================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user to verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role, email, first_name, last_name, preferred_language')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify admin role
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = userData.tenant_id;
    const triggerId = params.id;

    // Parse request body
    const body = await request.json();
    const sampleEventData = body.eventData || body.sampleData || {};
    const testEmail = body.testEmail; // Email address to send test to
    const actuallyRun = body.actuallyRun !== false; // Default to true

    console.log('📧 Test trigger request:', {
      triggerId,
      testEmail,
      userEmail: userData.email,
      actuallyRun,
    });

    // Verify trigger exists and belongs to tenant
    const { data: trigger, error: triggerError } = await supabase
      .from('email_triggers')
      .select('id, trigger_name, trigger_event, template_id')
      .eq('id', triggerId)
      .eq('tenant_id', tenantId)
      .single();

    if (triggerError || !trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    // Test the trigger (dry-run validation)
    const testResult = await testTrigger(triggerId, sampleEventData, tenantId);

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error,
          message: 'Trigger test failed',
        },
        { status: 400 }
      );
    }

    // If actuallyRun is true, send an actual test email to the admin
    let emailSent = false;
    let emailResult = null;

    if (actuallyRun && testResult.recipient && testResult.conditionsMet) {
      // Fetch the template to get template_key
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('template_key, template_name')
        .eq('id', trigger.template_id)
        .single();

      console.log('📧 Template fetch result:', { template, templateError, template_id: trigger.template_id });

      if (!templateError && template) {
        // Use recipient's language or default to English
        const lang = testResult.recipient.languageCode || 'en';

        // Render the template using the proper template rendering engine
        const rendered = await renderEmailTemplate({
          templateKey: template.template_key,
          tenantId: tenantId,
          languageCode: lang as 'en' | 'he',
          variables: testResult.templateVariables || {},
        });

        console.log('📧 Rendered template result:', {
          hasRendered: !!rendered,
          templateKey: template.template_key,
          lang
        });

        // Use rendered template or fallback to defaults
        let finalSubject = rendered?.subject || `${template.template_name} - ${lang === 'he' ? 'דוא"ל אוטומטי' : 'Automated Email'}`;
        let finalHtml = rendered?.bodyHtml || `<p>This is an automated email from ${template.template_name}</p>`;
        let finalText = rendered?.bodyText || `This is an automated email from ${template.template_name}`;

        // Add test prefix to subject
        finalSubject = `[TEST] ${finalSubject}`;

        // Add test notice to the email body
        const testNotice = lang === 'he'
          ? `<div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
               <strong>⚠️ אימייל בדיקה</strong><br/>
               אימייל זה נשלח כבדיקה. במצב רגיל, הוא היה נשלח אל: ${testResult.recipient.email}
             </div>`
          : `<div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
               <strong>⚠️ Test Email</strong><br/>
               This is a test email. In production, this would be sent to: ${testResult.recipient.email}
             </div>`;

        finalHtml = testNotice + finalHtml;

        // Determine where to send the test email
        const recipientEmail = testEmail || userData.email;

        console.log('📧 Sending test email:', {
          to: recipientEmail,
          subject: finalSubject,
          tenantId: tenantId,
          templateLang: lang,
        });

        // Send the email to the specified test email or admin
        emailResult = await sendEmail({
          to: recipientEmail,
          subject: finalSubject,
          html: finalHtml,
          text: finalText,
          tenantId: tenantId,
        });

        console.log('📧 Email send result:', emailResult);

        emailSent = emailResult.success;
      }
    }

    // Return test results
    const actualRecipient = testEmail || userData.email;
    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Test email sent to ${actualRecipient}`
        : 'Trigger test completed successfully',
      results: {
        triggerName: trigger.trigger_name,
        triggerEvent: trigger.trigger_event,
        conditionsMet: testResult.conditionsMet,
        recipient: testResult.recipient ? {
          email: testResult.recipient.email,
          name: testResult.recipient.name,
          userId: testResult.recipient.userId,
          languageCode: testResult.recipient.languageCode,
        } : null,
        scheduledFor: testResult.scheduledFor?.toISOString() || null,
        templateVariables: testResult.templateVariables,
        wouldSend: testResult.conditionsMet && testResult.recipient !== null,
        emailSent: emailSent,
        emailSentTo: emailSent ? actualRecipient : null,
        emailResult: emailResult,
      },
    });

  } catch (error: any) {
    console.error('Error testing trigger:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
