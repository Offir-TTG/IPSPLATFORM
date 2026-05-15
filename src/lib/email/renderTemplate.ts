/**
 * Email Template Rendering Service
 * Renders email templates with variable substitution using Handlebars-like syntax
 */

import { createClient } from '@/lib/supabase/server';
import { renderEmailLayout } from './layout';

export interface RenderTemplateOptions {
  templateKey: string;
  tenantId: string;
  languageCode: 'en' | 'he';
  variables: Record<string, any>;
  brandingColors?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface RenderedEmail {
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

/**
 * Simple Handlebars-like variable replacement
 * Supports: {{variable}}, {{#if variable}}...{{/if}}, and helper functions
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;

  // Replace simple variables {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });

  // Handle {{#if variable}}...{{/if}} blocks
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return variables[key] ? content : '';
  });

  // Handle helper functions
  // {{formatCurrency amount currency}}
  result = result.replace(/\{\{formatCurrency\s+(\w+)\s+(\w+)\}\}/g, (match, amountKey, currencyKey) => {
    const amount = variables[amountKey];
    const currency = variables[currencyKey];
    if (amount === undefined) return match;

    try {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(parseFloat(amount));
      return formatted;
    } catch {
      return `${amount} ${currency || 'USD'}`;
    }
  });

  // {{formatDate date language}}
  result = result.replace(/\{\{formatDate\s+(\w+)\s+(\w+)\}\}/g, (match, dateKey, languageKey) => {
    const date = variables[dateKey];
    const language = variables[languageKey];
    if (!date) return match;

    try {
      const dateObj = new Date(date);
      const locale = language === 'he' ? 'he-IL' : 'en-US';
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(date);
    }
  });

  return result;
}

/**
 * Fetch and render an email template from the database
 */
export async function renderEmailTemplate(options: RenderTemplateOptions): Promise<RenderedEmail | null> {
  try {
    const supabase = await createClient();

    // Fetch tenant branding alongside the template so the master layout
    // can render with the admin's chosen colour / logo / header style /
    // footer text. We also pull the tenant's site-wide `logo_url` and
    // `primary_color` so email-specific fields can *fall back* to the
    // main site branding when an admin leaves them empty — no need to
    // configure a logo twice.
    const { data: tenantBranding } = await supabase
      .from('tenants')
      .select('name, logo_url, primary_color, email_primary_color, email_button_color, email_logo_url, email_footer_text, email_header_style')
      .eq('id', options.tenantId)
      .single();

    // Fetch template from database
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('id, template_key')
      .eq('tenant_id', options.tenantId)
      .eq('template_key', options.templateKey)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error(`Template not found: ${options.templateKey}`, templateError);
      return null;
    }

    // Fetch template version for the specified language
    const { data: version, error: versionError } = await supabase
      .from('email_template_versions')
      .select('subject, body_html, body_text')
      .eq('template_id', template.id)
      .eq('language_code', options.languageCode)
      .eq('is_current', true)
      .single();

    if (versionError || !version) {
      console.error(`Template version not found for language: ${options.languageCode}`, versionError);
      return null;
    }

    // Prepare variables with branding colors
    const allVariables = {
      ...options.variables,
      language: options.languageCode,
      primaryColor: options.brandingColors?.primaryColor || '#667eea',
      secondaryColor: options.brandingColors?.secondaryColor || '#764ba2',
    };

    // Render the template
    const subject = renderTemplate(version.subject, allVariables);
    const innerBodyHtml = renderTemplate(version.body_html, allVariables);
    const bodyText = renderTemplate(version.body_text, allVariables);

    // Wrap the rendered inner body in the master email layout — single
    // source of truth for branding/header/footer/scaffolding.
    //
    // Branding resolution order (first non-empty wins):
    //   1. Email-specific tenant column (admin set it for emails only)
    //   2. Site-wide tenant column (the platform's main branding)
    //   3. Caller-supplied options.brandingColors
    //   4. Layout's hardcoded defaults
    //
    // This means an admin who set `tenants.logo_url` once for the site
    // gets that logo on every email automatically; they only need to
    // touch `email_logo_url` if they want a *different* logo in emails.
    const bodyHtml = renderEmailLayout(innerBodyHtml, {
      language: options.languageCode,
      organizationName:
        options.variables?.organizationName ||
        tenantBranding?.name ||
        undefined,
      primaryColor:
        tenantBranding?.email_primary_color ||
        tenantBranding?.primary_color ||
        options.brandingColors?.primaryColor,
      // Button colour: dedicated setting wins, otherwise inherits the
      // primary colour so the button matches the header by default.
      buttonColor:
        tenantBranding?.email_button_color ||
        tenantBranding?.email_primary_color ||
        tenantBranding?.primary_color ||
        undefined,
      secondaryColor: options.brandingColors?.secondaryColor,
      logoUrl:
        tenantBranding?.email_logo_url ||
        tenantBranding?.logo_url ||
        undefined,
      footerNote: tenantBranding?.email_footer_text || undefined,
      headerStyle: (tenantBranding?.email_header_style as 'logo' | 'text' | 'none' | undefined) || undefined,
    });

    return {
      subject,
      bodyHtml,
      bodyText,
    };
  } catch (error) {
    console.error('Error rendering email template:', error);
    return null;
  }
}
