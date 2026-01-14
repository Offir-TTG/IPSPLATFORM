import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import '@/lib/pdf/fonts'; // Register fonts before importing template
import { EnrollmentInvoiceTemplate } from '@/lib/pdf/EnrollmentInvoiceTemplate';
import { PaymentScheduleTemplate } from '@/lib/pdf/PaymentScheduleTemplate';
import type { PDFBrandingConfig } from '../route';
import React from 'react';
import { PDFDocument } from 'pdf-lib';

export const dynamic = 'force-dynamic';

type DocumentType = 'invoice' | 'schedule' | 'both';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant and verify admin role
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = userData.tenant_id;

    // Get branding config, document type, and language from request
    const body = await request.json();
    const brandingConfig: PDFBrandingConfig = body.branding;
    const documentType: DocumentType = body.documentType || 'invoice';
    const requestedLanguage: 'en' | 'he' = body.language || 'en';

    // Use requested language instead of user's default
    const userLanguage = requestedLanguage;

    // Fetch translations
    const { data: translationsData } = await supabase
      .from('translations')
      .select('translation_key, translation_value')
      .eq('tenant_id', tenantId)
      .eq('language_code', userLanguage)
      .like('translation_key', 'pdf.%');

    // Convert translations to key-value map
    const translations: Record<string, string> = {};
    if (translationsData) {
      translationsData.forEach((t: any) => {
        translations[t.translation_key] = t.translation_value;
      });
    }

    // Helper function to get translation with fallback
    const t = (key: string, fallback: string) => translations[key] || fallback;

    // Generate sample payment plan name (deposit + 4 installments)
    const samplePaymentPlanName = userLanguage === 'he'
      ? 'מקדמה + 4 תשלומים'
      : 'Deposit + 4 Installments';

    // Create sample data for preview
    const sampleData = {
      enrollment: {
        id: 'SAMPLE-001',
        invoice_number: 'INV-2024-001',
        product_name: 'Sample Course Name',
        product_type: 'course',
        enrolled_at: new Date().toISOString(),
        total_amount: 5000,
        paid_amount: 2000,
        remaining_amount: 3000,
        currency: 'ILS',
        payment_plan_name: samplePaymentPlanName,
      },
      user: {
        first_name: 'Sample',
        last_name: 'Student',
        email: 'student@example.com',
        phone: '+1234567890',
        address: '123 Sample Street, Sample City, SC 12345',
      },
      schedules: [
        {
          payment_number: 1,
          payment_type: 'registration',
          scheduled_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paid_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: 1000,
          status: 'paid',
        },
        {
          payment_number: 2,
          payment_type: 'installment',
          scheduled_date: new Date().toISOString().split('T')[0],
          paid_date: new Date().toISOString().split('T')[0],
          amount: 1000,
          status: 'paid',
        },
        {
          payment_number: 3,
          payment_type: 'installment',
          scheduled_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paid_date: null,
          amount: 1000,
          status: 'pending',
        },
        {
          payment_number: 4,
          payment_type: 'installment',
          scheduled_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paid_date: null,
          amount: 1000,
          status: 'pending',
        },
        {
          payment_number: 5,
          payment_type: 'installment',
          scheduled_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paid_date: null,
          amount: 1000,
          status: 'pending',
        },
      ],
      branding: brandingConfig,
      language: userLanguage as 'en' | 'he',
      translations,
      generatedDate: new Date().toISOString(),
    };

    // Generate PDF based on document type
    let pdfBuffer: Buffer;
    let filename: string;

    if (documentType === 'invoice') {
      pdfBuffer = await renderToBuffer(
        <EnrollmentInvoiceTemplate data={sampleData} />
      );
      filename = `invoice-preview-${Date.now()}.pdf`;
    } else if (documentType === 'schedule') {
      pdfBuffer = await renderToBuffer(
        <PaymentScheduleTemplate data={sampleData as any} />
      );
      filename = `payment-schedule-preview-${Date.now()}.pdf`;
    } else {
      // Generate both PDFs and merge them
      const invoiceBuffer = await renderToBuffer(
        <EnrollmentInvoiceTemplate data={sampleData} />
      );
      const scheduleBuffer = await renderToBuffer(
        <PaymentScheduleTemplate data={sampleData as any} />
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
      filename = `combined-preview-${Date.now()}.pdf`;
    }

    // Return PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating preview PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
