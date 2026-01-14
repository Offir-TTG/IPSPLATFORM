import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import '@/lib/pdf/fonts'; // Register fonts before importing template
import { EnrollmentInvoiceTemplate } from '@/lib/pdf/EnrollmentInvoiceTemplate';
import { PaymentScheduleTemplate } from '@/lib/pdf/PaymentScheduleTemplate';
import type { PDFBrandingConfig } from '@/app/api/admin/payments/pdf-template/route';
import type { PaymentSchedule } from '@/types/payments';
import { PDFDocument } from 'pdf-lib';
import React from 'react';

export const dynamic = 'force-dynamic';

type DocumentType = 'invoice' | 'schedule' | 'both';

/**
 * POST /api/user/enrollments/[id]/export-pdf
 * Generate and download PDF (invoice, payment schedule, or both) for enrollment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[PDF Export] Starting PDF generation...');
  try {
    const { id } = await params;
    console.log('[PDF Export] Enrollment ID:', id);
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[PDF Export] Auth result:', { user: user?.id, error: authError?.message });
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document type and language from request body
    const body = await request.json();
    const documentType: DocumentType = body.documentType || 'invoice';
    const requestedLanguage: 'en' | 'he' = body.language;

    // Get user's tenant_id
    console.log('[PDF Export] Fetching user data for user ID:', user.id);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, first_name, last_name, email, phone')
      .eq('id', user.id)
      .single();

    console.log('[PDF Export] User data result:', { data: userData, error: userError });
    if (userError || !userData) {
      console.error('[PDF Export] User not found or error:', userError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const tenantId = userData.tenant_id;
    // Use requested language or default to English
    const userLanguage = requestedLanguage || 'en';
    console.log('[PDF Export] Request body:', { documentType: body.documentType, requestedLanguage: body.language });
    console.log('[PDF Export] Using language:', userLanguage);

    // Fetch enrollment and verify ownership
    console.log('[PDF Export] Fetching enrollment:', { id, userId: user.id, tenantId });
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        product_id,
        payment_plan_id,
        total_amount,
        paid_amount,
        payment_status,
        invoice_number
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single();

    console.log('[PDF Export] Enrollment result:', { data: enrollment, error: enrollmentError });
    if (enrollmentError || !enrollment) {
      console.error('[PDF Export] Enrollment not found or error:', enrollmentError);
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Fetch product information
    console.log('[PDF Export] Fetching product for product_id:', enrollment.product_id);
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('title, type, price, currency')
      .eq('id', enrollment.product_id)
      .eq('tenant_id', tenantId)
      .single();
    console.log('[PDF Export] Product result:', { data: product, error: productError });

    if (productError || !product) {
      console.error('[PDF Export] Product not found or error:', productError);
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create admin client early for fetching translations and branding (bypasses RLS)
    const adminClient = createAdminClient();

    // Fetch ALL translations early (for payment plan names AND PDF content)
    // Note: Supabase has a default 1000 row limit, so we fetch specific translations separately
    console.log('[PDF Export] Fetching translations for language:', userLanguage);

    // Fetch general translations
    const { data: generalTranslations } = await adminClient
      .from('translations')
      .select('translation_key, translation_value')
      .eq('tenant_id', tenantId)
      .eq('language_code', userLanguage);

    // Fetch PDF-specific translations separately to ensure they're included
    const { data: pdfTranslationsData } = await adminClient
      .from('translations')
      .select('translation_key, translation_value')
      .eq('tenant_id', tenantId)
      .eq('language_code', userLanguage)
      .like('translation_key', 'pdf.%');

    // Fetch billing translations separately (for payment plan names like "One-Time Payment")
    const { data: billingTranslationsData } = await adminClient
      .from('translations')
      .select('translation_key, translation_value')
      .eq('tenant_id', tenantId)
      .eq('language_code', userLanguage)
      .like('translation_key', 'user.profile.billing%');

    console.log('[PDF Export] General translations fetched:', generalTranslations?.length || 0);
    console.log('[PDF Export] PDF translations fetched:', pdfTranslationsData?.length || 0);
    console.log('[PDF Export] Billing translations fetched:', billingTranslationsData?.length || 0);

    // Merge all sets of translations into key-value map
    const translations: Record<string, string> = {};

    if (generalTranslations) {
      generalTranslations.forEach((t: any) => {
        translations[t.translation_key] = t.translation_value;
      });
    }

    // PDF and billing translations will override any duplicates from general query
    if (pdfTranslationsData) {
      pdfTranslationsData.forEach((t: any) => {
        translations[t.translation_key] = t.translation_value;
      });
    }

    if (billingTranslationsData) {
      billingTranslationsData.forEach((t: any) => {
        translations[t.translation_key] = t.translation_value;
      });
    }

    console.log('[PDF Export] Loaded', Object.keys(translations).length, 'translations total');

    // Debug: Show first 10 PDF translations
    const pdfTranslations = Object.keys(translations).filter(k => k.startsWith('pdf.'));
    console.log('[PDF Export] PDF translations count:', pdfTranslations.length);
    console.log('[PDF Export] First 10 PDF translations:', pdfTranslations.slice(0, 10));
    console.log('[PDF Export] Sample values:', {
      'pdf.invoice.title': translations['pdf.invoice.title'],
      'pdf.invoice.paymentPlan': translations['pdf.invoice.paymentPlan'],
      'pdf.schedule.title': translations['pdf.schedule.title']
    });

    // Helper function to get translation with fallback
    const t = (key: string, fallback: string) => translations[key] || fallback;

    // Fetch payment plan information
    let paymentPlanName = t('user.profile.billing.fullPayment', 'Payment Plan');

    if (enrollment.payment_plan_id) {
      // Using payment plan template
      console.log('[PDF Export] Fetching payment plan template for plan_id:', enrollment.payment_plan_id);
      const { data: paymentPlan, error: planError } = await supabase
        .from('payment_plans')
        .select('plan_name, plan_type, installment_count')
        .eq('id', enrollment.payment_plan_id)
        .eq('tenant_id', tenantId)
        .single();
      console.log('[PDF Export] Payment plan result:', { data: paymentPlan, error: planError });

      if (paymentPlan) {
        // Translate payment plan name based on plan_type
        const planType = paymentPlan.plan_type;
        if (planType === 'one_time') {
          paymentPlanName = t('user.profile.billing.oneTimePayment', 'One-Time Payment');
        } else if (planType === 'deposit' || planType === 'installments') {
          const installments = paymentPlan.installment_count || 1;
          if (userLanguage === 'he') {
            paymentPlanName = `מקדמה + ${installments} תשלומים`;
          } else {
            paymentPlanName = `Deposit + ${installments} Installments`;
          }
        } else if (planType === 'subscription') {
          paymentPlanName = t('user.profile.billing.subscription', 'Subscription');
        } else {
          // Fallback to plan_name if translation not available
          paymentPlanName = paymentPlan.plan_name;
        }
      }
    } else {
      // Using product's embedded payment configuration - derive plan name
      console.log('[PDF Export] Using product embedded payment config');
      const { data: productPaymentInfo } = await supabase
        .from('products')
        .select('payment_model, payment_plan')
        .eq('id', enrollment.product_id)
        .eq('tenant_id', tenantId)
        .single();

      if (productPaymentInfo) {
        const paymentModel = productPaymentInfo.payment_model;
        const paymentConfig = productPaymentInfo.payment_plan || {};

        // Derive plan name from product's payment model using translations
        if (paymentModel === 'one_time') {
          paymentPlanName = t('user.profile.billing.oneTimePayment', 'One-Time Payment');
        } else if (paymentModel === 'deposit_then_plan') {
          const installments = paymentConfig.installments || 1;
          const baseText = t('user.profile.billing.depositPlusInstallments', 'Deposit + Installments');
          // Replace "Installments" with the actual number
          if (userLanguage === 'he') {
            paymentPlanName = `מקדמה + ${installments} תשלומים`;
          } else {
            paymentPlanName = `Deposit + ${installments} Installments`;
          }
        } else if (paymentModel === 'subscription') {
          const interval = paymentConfig.subscription_interval || 'monthly';
          const baseText = t('user.profile.billing.subscription', 'Subscription');
          paymentPlanName = `${baseText} (${interval})`;
        } else if (paymentModel === 'free') {
          paymentPlanName = t('user.profile.billing.free', 'Free');
        }
      }
    }

    console.log('[PDF Export] Using payment plan name:', paymentPlanName);

    // Fetch payment schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', id)
      .eq('tenant_id', tenantId)
      .order('payment_number', { ascending: true });

    if (schedulesError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment schedules' },
        { status: 500 }
      );
    }

    // Fetch PDF branding config using admin client (bypasses RLS)
    console.log('[PDF Export] Fetching PDF branding config for tenant:', tenantId);
    const { data: brandingSettings, error: brandingError } = await adminClient
      .from('tenant_settings')
      .select('settings')
      .eq('tenant_id', tenantId)
      .eq('setting_key', 'pdf_branding_config')
      .single();
    console.log('[PDF Export] Branding settings result:', { data: brandingSettings, error: brandingError });

    // Fetch tenant defaults for fallback
    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .select('name, logo_url, primary_color')
      .eq('id', tenantId)
      .single();
    console.log('[PDF Export] Tenant result:', { data: tenant, error: tenantError });

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Default branding config
    const defaultBranding: PDFBrandingConfig = {
      organization: {
        name: tenant.name || '',
        email: '',
        phone: '',
        address: '',
        website: '',
        tax_id: '',
      },
      branding: {
        logo_url: tenant.logo_url || '',
        primary_color: tenant.primary_color || '#3B82F6',
        show_logo: true,
        show_organization_name: true,
      },
      footer: {
        show_contact_info: true,
        custom_footer_text: '',
        show_page_numbers: true,
      },
    };

    // Merge saved config with defaults
    let branding: PDFBrandingConfig = defaultBranding;
    if (brandingSettings && brandingSettings.settings) {
      branding = {
        organization: {
          ...defaultBranding.organization,
          ...(brandingSettings.settings as any).organization,
        },
        branding: {
          ...defaultBranding.branding,
          ...(brandingSettings.settings as any).branding,
        },
        footer: {
          ...defaultBranding.footer,
          ...(brandingSettings.settings as any).footer,
        },
      };
      console.log('[PDF Export] Using custom branding config from tenant_settings');
    } else {
      console.log('[PDF Export] Using default branding config from tenant table');
    }
    console.log('[PDF Export] Final branding config:', JSON.stringify(branding, null, 2));

    // Calculate remaining amount
    const remainingAmount = enrollment.total_amount - enrollment.paid_amount;

    // Format data for PDF
    const receiptData = {
      enrollment: {
        id: enrollment.id,
        invoice_number: enrollment.invoice_number || enrollment.id.substring(0, 8).toUpperCase(),
        product_name: product.title,
        product_type: product.type,
        enrolled_at: enrollment.enrolled_at,
        total_amount: enrollment.total_amount || product.price,
        paid_amount: enrollment.paid_amount,
        remaining_amount: remainingAmount,
        currency: product.currency,
        payment_plan_name: paymentPlanName,
      },
      user: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone || undefined,
        address: undefined, // Can add if user profile has address field
      },
      schedules: schedules as PaymentSchedule[],
      branding,
      language: userLanguage,
      translations,
      generatedDate: new Date().toISOString(),
    };

    // Generate PDF based on document type
    let pdfBuffer: Buffer;
    let filename: string;

    if (documentType === 'invoice') {
      pdfBuffer = await renderToBuffer(
        <EnrollmentInvoiceTemplate data={receiptData} />
      );
      filename = `invoice-${enrollment.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    } else if (documentType === 'schedule') {
      pdfBuffer = await renderToBuffer(
        <PaymentScheduleTemplate data={receiptData} />
      );
      filename = `payment-schedule-${enrollment.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    } else {
      // Generate both PDFs and merge them
      const invoiceBuffer = await renderToBuffer(
        <EnrollmentInvoiceTemplate data={receiptData} />
      );
      const scheduleBuffer = await renderToBuffer(
        <PaymentScheduleTemplate data={receiptData} />
      );

      // Merge PDFs using pdf-lib
      const mergedPdf = await PDFDocument.create();

      // Load invoice PDF and copy its pages
      const invoicePdf = await PDFDocument.load(invoiceBuffer);
      const invoicePages = await mergedPdf.copyPages(invoicePdf, invoicePdf.getPageIndices());
      invoicePages.forEach((page) => mergedPdf.addPage(page));

      // Load schedule PDF and copy its pages
      const schedulePdf = await PDFDocument.load(scheduleBuffer);
      const schedulePages = await mergedPdf.copyPages(schedulePdf, schedulePdf.getPageIndices());
      schedulePages.forEach((page) => mergedPdf.addPage(page));

      // Save merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      pdfBuffer = Buffer.from(mergedPdfBytes);
      filename = `combined-${enrollment.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    }

    // Return PDF with download headers
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('[PDF Export] Error generating PDF:', error);
    console.error('[PDF Export] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF'
      },
      { status: 500 }
    );
  }
}
