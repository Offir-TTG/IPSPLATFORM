import { Repeat } from 'lucide-react';
import type { PlanType } from './planFormat';

/**
 * A tiny picture of how each payment type spreads the payments over time.
 * Used on the plan wizard and the product wizard's custom payment cards.
 */
export function TypePicture({ type }: { type: PlanType | 'free' }) {
  const bar = 'rounded-sm bg-current';
  return (
    <span className="flex h-9 items-end gap-1" aria-hidden>
      {type === 'free' && <i className="h-9 w-16 rounded-sm border-2 border-dashed border-current opacity-60" />}
      {type === 'one_time' && <i className={`${bar} h-9 w-16`} />}
      {type === 'deposit' && (
        <>
          <i className={`${bar} h-9 w-5`} />
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={`${bar} h-4 w-3 opacity-70`} />
          ))}
        </>
      )}
      {type === 'installments' && [0, 1, 2, 3, 4].map((i) => <i key={i} className={`${bar} h-5 w-3 opacity-80`} />)}
      {type === 'subscription' && (
        <>
          {[0, 1, 2].map((i) => (
            <i key={i} className={`${bar} h-5 w-3 opacity-80`} />
          ))}
          <Repeat className="mb-0.5 h-5 w-5" />
        </>
      )}
      {type === 'per_session' && [0, 1, 2].map((i) => <i key={i} className={`${bar} h-6 w-4 ${i === 2 ? 'opacity-30' : 'opacity-90'}`} />)}
    </span>
  );
}
