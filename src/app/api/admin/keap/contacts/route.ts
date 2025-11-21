import { NextRequest, NextResponse } from 'next/server';
import { getKeapClient } from '@/lib/keap/client';

// GET /api/admin/keap/contacts?email=xxx - Find contact by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const keap = await getKeapClient();
    const contact = await keap.findContactByEmail(email);

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching Keap contact:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contact'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/keap/contacts - Create or update contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, first_name, last_name, phone, tag_ids } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const keap = await getKeapClient();

    const contactData: any = {
      email_addresses: [{ email, field: 'EMAIL1' }]
    };

    if (first_name) contactData.given_name = first_name;
    if (last_name) contactData.family_name = last_name;
    if (phone) contactData.phone_numbers = [{ number: phone, field: 'PHONE1' }];
    if (tag_ids && Array.isArray(tag_ids)) contactData.tag_ids = tag_ids;

    const contact = await keap.upsertContact(contactData);

    return NextResponse.json({
      success: true,
      data: contact,
      message: `Contact ${first_name || email} synced successfully`
    });
  } catch (error) {
    console.error('Error creating/updating Keap contact:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync contact'
      },
      { status: 500 }
    );
  }
}
