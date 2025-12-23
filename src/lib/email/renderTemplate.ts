/**
 * Email Template Rendering Service
 * Renders email templates with variable substitution using Handlebars-like syntax
 */

import { createClient } from '@/lib/supabase/server';

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
    const bodyHtml = renderTemplate(version.body_html, allVariables);
    const bodyText = renderTemplate(version.body_text, allVariables);

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
