import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

// Force refresh translations by clearing Next.js cache
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Revalidate all admin pages to force translation reload
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/lms/programs', 'page');

    // Clear any server-side caches
    if (global.translationsCache) {
      global.translationsCache.clear();
    }

    return NextResponse.json({
      success: true,
      message: 'Translations cache cleared. Please refresh your browser.',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Refresh translations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh translations' },
      { status: 500 }
    );
  }
}