import { redirect } from 'next/navigation';

// Children in coaching are now the "child coaching" filter of the packages list.
export default function CoachingChildrenPage() {
  redirect('/admin/coaching');
}
