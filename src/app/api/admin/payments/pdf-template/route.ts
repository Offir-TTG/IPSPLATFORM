import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// PDF Branding Configuration Interface
export interface PDFBrandingConfig {
  organization: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    tax_id?: string;
  };
  branding: {
    logo_url?: string;
    primary_color: string;
    show_logo: boolean;
    show_organization_name: boolean;
  };
  footer: {
    show_contact_info: boolean;
    custom_footer_text?: string;
    show_page_numbers: boolean;
  };
}

/**
 * GET /api/admin/payments/pdf-template
 * Load PDF branding configuration for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const tenantId = userData.tenant_id;

    // Fetch tenant details for defaults
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, logo_url, primary_color')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Try to fetch existing configuration from tenant_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('settings')
      .eq('tenant_id', tenantId)
      .eq('setting_key', 'pdf_branding_config')
      .single();

    // Default configuration
    const defaultConfig: PDFBrandingConfig = {
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

    // Merge saved config with defaults (if exists)
    let config: PDFBrandingConfig = defaultConfig;
    if (settingsData && settingsData.settings) {
      config = {
        organization: {
          ...defaultConfig.organization,
          ...(settingsData.settings as any).organization,
        },
        branding: {
          ...defaultConfig.branding,
          ...(settingsData.settings as any).branding,
        },
        footer: {
          ...defaultConfig.footer,
          ...(settingsData.settings as any).footer,
        },
      };
    }

    return NextResponse.json({
      success: true,
      config,
    });

  } catch (error) {
    console.error('Error fetching PDF branding config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch configuration'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/payments/pdf-template
 * Save PDF branding configuration for the tenant
 */
export async function PUT(request: NextRequest) {
  console.log('[PDF Template API] PUT request started');
  try {
    const supabase = await createClient();

    // Authenticate admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[PDF Template API] Auth result:', { userId: user?.id, authError: authError?.message });
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    console.log('[PDF Template API] User data:', { userData, userError });
    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const tenantId = userData.tenant_id;
    console.log('[PDF Template API] User role:', userData.role, 'Tenant ID:', tenantId);

    // Parse request body
    const body = await request.json();
    const config: PDFBrandingConfig = body.config;
    console.log('[PDF Template API] Received config:', JSON.stringify(config, null, 2));

    // Basic validation
    if (!config || !config.organization || !config.branding || !config.footer) {
      console.log('[PDF Template API] Invalid config format');
      return NextResponse.json(
        { success: false, error: 'Invalid configuration format' },
        { status: 400 }
      );
    }

    // Upsert configuration to tenant_settings
    console.log('[PDF Template API] Attempting upsert with tenant_id:', tenantId);
    const { error: upsertError, data: upsertData } = await supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        setting_key: 'pdf_branding_config',
        settings: config,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,setting_key'
      })
      .select();

    console.log('[PDF Template API] Upsert result:', { data: upsertData, error: upsertError });
    if (upsertError) {
      console.error('[PDF Template API] Error upserting PDF branding config:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save configuration', details: upsertError.message },
        { status: 500 }
      );
    }

    console.log('[PDF Template API] Save successful!');
    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
    });

  } catch (error) {
    console.error('[PDF Template API] Error saving PDF branding config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration'
      },
      { status: 500 }
    );
  }
}
