/**
 * Email Template Engine
 * Renders email templates using Handlebars with variable substitution
 */

import Handlebars from 'handlebars';
import type { EmailTemplateVariable } from '@/types/email';

// Register common Handlebars helpers
Handlebars.registerHelper('formatCurrency', function(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
});

Handlebars.registerHelper('formatDate', function(date: string | Date, locale: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
});

Handlebars.registerHelper('formatTime', function(date: string | Date, locale: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale || 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
});

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('gt', function(a: number, b: number) {
  return a > b;
});

Handlebars.registerHelper('lt', function(a: number, b: number) {
  return a < b;
});

Handlebars.registerHelper('or', function(...args: any[]) {
  // Remove the last argument (Handlebars options)
  const values = args.slice(0, -1);
  return values.some(v => !!v);
});

Handlebars.registerHelper('and', function(...args: any[]) {
  // Remove the last argument (Handlebars options)
  const values = args.slice(0, -1);
  return values.every(v => !!v);
});

export interface RenderTemplateOptions {
  template: string;
  variables: Record<string, any>;
  validateVariables?: boolean;
  requiredVariables?: EmailTemplateVariable[];
}

export interface RenderTemplateResult {
  rendered: string;
  missingVariables?: string[];
  error?: string;
}

/**
 * Render an email template with Handlebars
 */
export function renderTemplate(options: RenderTemplateOptions): RenderTemplateResult {
  try {
    const { template, variables, validateVariables, requiredVariables } = options;

    // Validate required variables if needed
    if (validateVariables && requiredVariables) {
      const missingVariables: string[] = [];

      for (const variable of requiredVariables) {
        if (variable.required && !(variable.name in variables)) {
          missingVariables.push(variable.name);
        }
      }

      if (missingVariables.length > 0) {
        return {
          rendered: '',
          missingVariables,
          error: `Missing required variables: ${missingVariables.join(', ')}`,
        };
      }
    }

    // Compile and render template
    const compiledTemplate = Handlebars.compile(template, {
      strict: false, // Don't throw on missing variables
      noEscape: false, // Escape HTML by default for security
    });

    const rendered = compiledTemplate(variables);

    return { rendered };
  } catch (error) {
    console.error('Error rendering template:', error);
    return {
      rendered: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Render both HTML and text versions of a template
 */
export function renderEmailTemplate(
  htmlTemplate: string,
  textTemplate: string,
  variables: Record<string, any>,
  requiredVariables?: EmailTemplateVariable[]
): {
  html: string;
  text: string;
  error?: string;
  missingVariables?: string[];
} {
  // Render HTML version
  const htmlResult = renderTemplate({
    template: htmlTemplate,
    variables,
    validateVariables: true,
    requiredVariables,
  });

  if (htmlResult.error) {
    return {
      html: '',
      text: '',
      error: htmlResult.error,
      missingVariables: htmlResult.missingVariables,
    };
  }

  // Render text version
  const textResult = renderTemplate({
    template: textTemplate,
    variables,
    validateVariables: false, // Already validated in HTML
  });

  return {
    html: htmlResult.rendered,
    text: textResult.rendered,
  };
}

/**
 * Extract variables used in a template
 * Returns array of variable names found in {{variable}} syntax
 */
export function extractTemplateVariables(template: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    // Extract variable name (remove helpers, spaces, etc.)
    const varName = match[1].trim().split(/\s+/)[0];
    // Remove helper names (eq, gt, formatCurrency, etc.)
    if (!['eq', 'gt', 'lt', 'or', 'and', 'formatCurrency', 'formatDate', 'formatTime', 'if', 'unless', 'each', 'with'].includes(varName)) {
      variables.add(varName);
    }
  }

  return Array.from(variables);
}

/**
 * Validate template syntax without rendering
 */
export function validateTemplate(template: string): { valid: boolean; error?: string } {
  try {
    Handlebars.compile(template);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid template syntax',
    };
  }
}

/**
 * Get base HTML email template wrapper
 * Wraps custom content in a professional email layout
 */
export function getEmailWrapper(isRTL: boolean = false): string {
  return `
<!DOCTYPE html>
<html dir="{{#if isRTL}}rtl{{else}}ltr{{/if}}" lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .email-header img {
      max-width: 150px;
      height: auto;
      margin-bottom: 20px;
    }
    .email-content {
      padding: 40px 30px;
    }
    .email-footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 13px;
      background-color: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%);
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      {{#if logoUrl}}
        <img src="{{logoUrl}}" alt="{{organizationName}}">
      {{/if}}
      <h1>{{emailTitle}}</h1>
    </div>
    <div class="email-content">
      {{{content}}}
    </div>
    <div class="email-footer">
      {{#if footerText}}
        <p>{{footerText}}</p>
      {{else}}
        <p>© {{year}} {{organizationName}}. All rights reserved.</p>
      {{/if}}
    </div>
  </div>
</body>
</html>
  `.trim();
}
