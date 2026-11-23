'use client';

import { useState } from 'react';
import type { ClubOffer } from '@/lib/portal/clubOffers';
import { SpaceHero } from './SpaceHero';
import { EmbeddedWizard, EnrollInline } from './EnrollInline';

/** A club the client hasn't joined: its header, and the enrollment right under it (as with coaching). */
export function ClubJoinView({ offer }: { offer: ClubOffer }) {
  const [wizardUrl, setWizardUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <SpaceHero color={offer.color} kicker="מועדון · מנוי" title={offer.title} sub={offer.tagline} />
      {wizardUrl ? (
        <EmbeddedWizard src={wizardUrl} />
      ) : (
        <EnrollInline
          enrollmentUrl={offer.enrollmentUrl}
          productId={offer.productId}
          offer={offer.invite}
          price={offer.priceAmount ? { amount: offer.priceAmount, per: offer.pricePer } : null}
          upcomingLine={offer.upcomingLine}
          attachPlanId={offer.attachPlanId}
          accent={offer.color}
          onStart={setWizardUrl}
        />
      )}
    </div>
  );
}
