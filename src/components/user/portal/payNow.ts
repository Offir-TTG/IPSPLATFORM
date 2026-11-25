'use client';

import { loadStripe } from '@stripe/stripe-js';

/**
 * Charges one scheduled payment now with the client's saved card, asking the
 * bank for confirmation (3-D Secure) when it wants it. Used by the billing
 * page and the "update card" page. Hebrew: the portal is Hebrew only.
 */
export async function payScheduleNow(scheduleId: string): Promise<{ ok: boolean; text: string }> {
  try {
    const res = await fetch(`/api/user/payment-schedules/${scheduleId}/pay`, { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, text: json.error === 'The card was declined' ? 'הכרטיס סורב. אפשר להחליף כרטיס ולנסות שוב.' : 'התשלום לא בוצע. נסו שוב או פנו אלינו.' };
    }
    if (json.status === 'requires_action' && json.client_secret) {
      const cfg = await fetch('/api/user/payment-methods/stripe-config').then((r) => r.json());
      const stripe = cfg?.publishableKey ? await loadStripe(cfg.publishableKey) : null;
      if (!stripe) return { ok: false, text: 'לא הצלחנו לפתוח את אישור הבנק. נסו שוב.' };
      const { error } = await stripe.confirmCardPayment(json.client_secret);
      if (error) return { ok: false, text: 'הבנק לא אישר את התשלום.' };
      return { ok: true, text: 'התשלום התקבל, מאשרים מול הבנק…' };
    }
    return { ok: true, text: json.status === 'paid' ? 'שולם, תודה' : 'התשלום התקבל, מאשרים מול הבנק…' };
  } catch {
    return { ok: false, text: 'התשלום לא בוצע. נסו שוב.' };
  }
}
