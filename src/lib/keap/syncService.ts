import { getKeapClient } from './client';

export interface StudentData {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface SyncOptions {
  tags?: string[]; // Tag names to apply
  campaign_id?: number; // Campaign ID to add contact to
  create_note?: string; // Note to add to contact
}

/**
 * Sync a student to Keap CRM
 */
export async function syncStudentToKeap(
  student: StudentData,
  options: SyncOptions = {}
): Promise<{ contact: any; tags: any[]; success: boolean }> {
  try {
    const keap = await getKeapClient();

    // 1. Find or create contact
    let contact = await keap.findContactByEmail(student.email);

    if (!contact) {
      contact = await keap.upsertContact({
        given_name: student.first_name,
        family_name: student.last_name,
        email_addresses: [{ email: student.email, field: 'EMAIL1' }],
        ...(student.phone && {
          phone_numbers: [{ number: student.phone, field: 'PHONE1' }]
        })
      });
    }

    if (!contact || !contact.id) {
      throw new Error('Failed to create or find contact in Keap');
    }

    const appliedTags = [];

    // 2. Apply tags (find or create if doesn't exist)
    if (options.tags && options.tags.length > 0) {
      for (const tagName of options.tags) {
        try {
          // Use findOrCreateTag instead of createTag to avoid duplicates
          const tag = await keap.findOrCreateTag(tagName);
          await keap.addTagToContact(contact.id, tag.id);
          appliedTags.push(tag);
        } catch (error) {
          console.error(`Failed to apply tag "${tagName}":`, error);
        }
      }
    }

    // 3. Add to campaign
    if (options.campaign_id) {
      try {
        await keap.addContactToCampaign(contact.id, options.campaign_id);
      } catch (error) {
        console.error(`Failed to add to campaign:`, error);
      }
    }

    // 4. Create note
    if (options.create_note) {
      try {
        await keap.createNote(
          contact.id,
          'LMS Activity',
          options.create_note
        );
      } catch (error) {
        console.error(`Failed to create note:`, error);
      }
    }

    return {
      contact,
      tags: appliedTags,
      success: true
    };
  } catch (error) {
    console.error('Error syncing student to Keap:', error);
    throw error;
  }
}

/**
 * Sync enrollment to Keap
 */
export async function syncEnrollmentToKeap(enrollment: {
  user_email: string;
  user_first_name?: string;
  user_last_name?: string;
  course_title: string;
  program_title?: string;
  enrollment_date: string;
}) {
  const tags = ['LMS Student', `Enrolled - ${enrollment.course_title}`];

  if (enrollment.program_title) {
    tags.push(`Program - ${enrollment.program_title}`);
  }

  const note = `Enrolled in course: ${enrollment.course_title}${
    enrollment.program_title ? ` (Program: ${enrollment.program_title})` : ''
  }\nEnrollment Date: ${new Date(enrollment.enrollment_date).toLocaleDateString()}`;

  return await syncStudentToKeap(
    {
      email: enrollment.user_email,
      first_name: enrollment.user_first_name,
      last_name: enrollment.user_last_name
    },
    {
      tags,
      create_note: note
    }
  );
}

/**
 * Sync course completion to Keap
 */
export async function syncCourseCompletionToKeap(completion: {
  user_email: string;
  user_first_name?: string;
  user_last_name?: string;
  course_title: string;
  completion_date: string;
  certificate_earned: boolean;
  score?: number;
}) {
  const tags = [`Completed - ${completion.course_title}`];

  if (completion.certificate_earned) {
    tags.push(`Certificate - ${completion.course_title}`);
  }

  const note = `Completed course: ${completion.course_title}\nCompletion Date: ${new Date(completion.completion_date).toLocaleDateString()}${
    completion.score ? `\nScore: ${completion.score}%` : ''
  }${completion.certificate_earned ? '\nCertificate Earned: Yes' : ''}`;

  return await syncStudentToKeap(
    {
      email: completion.user_email,
      first_name: completion.user_first_name,
      last_name: completion.user_last_name
    },
    {
      tags,
      create_note: note
    }
  );
}

/**
 * Check if Keap integration is enabled and configured
 */
export async function isKeapEnabled(): Promise<boolean> {
  try {
    const keap = await getKeapClient();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get Keap integration settings from database
 */
export async function getKeapSettings() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'keap')
    .eq('is_enabled', true)
    .single();

  return integration?.settings || {};
}
