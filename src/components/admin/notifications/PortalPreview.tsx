'use client';

import { Bell, X } from 'lucide-react';
import type { NotificationCategory, NotificationDisplayStyle, NotificationPriority } from '@/types/notifications';
import { CATEGORY_HE, CATEGORY_ICON, PORTAL_TONE, PRIORITY_HE } from './notificationStyle';

/**
 * A small picture of the client portal showing how the notification will
 * look and where it appears, updated as the admin types (like the site
 * picture in the Messages editor). The portal is Hebrew and right to left,
 * so the picture is too. It only draws: nothing is sent from here.
 */
export function PortalPreview({
  title,
  message,
  actionLabel,
  priority,
  category,
  displayStyle = 'list',
}: {
  title: string;
  message: string;
  actionLabel: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  displayStyle?: NotificationDisplayStyle;
}) {
  const tone = PORTAL_TONE[priority];
  const Icon = CATEGORY_ICON[category] ?? Bell;
  const shownTitle = title.trim() || 'כותרת ההתראה';
  const shownMessage = message.trim() || 'כאן יופיע תוכן ההתראה.';
  const label = `${priority === 'high' || priority === 'urgent' ? `${PRIORITY_HE[priority]} · ` : ''}${CATEGORY_HE[category]}`;
  // "Only in the list": important and urgent ones still pop up briefly, as before.
  const legacyPopup = displayStyle === 'list' && (priority === 'high' || priority === 'urgent');

  const card = (compact = false) => (
    <div className={`rounded-2xl border p-3 shadow-sm ${tone.card}`}>
      <div className="flex items-start gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone.tile}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`text-sm font-bold [overflow-wrap:anywhere] ${tone.title}`}>{shownTitle}</p>
            {!compact && <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-[#73698a]">{label}</span>}
          </div>
          <p className={`mt-0.5 whitespace-pre-line text-xs [overflow-wrap:anywhere] ${compact ? 'line-clamp-2' : 'line-clamp-3'} ${tone.text}`}>
            {shownMessage}
          </p>
          {actionLabel.trim() && (
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${tone.button}`}>{actionLabel.trim()}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" lang="he" aria-hidden className="relative overflow-hidden rounded-xl border border-[#e9e3f1] bg-[#f6f3fa]">
      {displayStyle === 'top_bar' && (
        <div className={`flex items-center gap-2 border-b px-3 py-1.5 text-[11px] ${tone.card}`}>
          <Icon className={`h-3.5 w-3.5 shrink-0 ${tone.title}`} />
          <span className={`truncate font-bold ${tone.title}`}>{shownTitle}</span>
          <span className={`hidden truncate sm:inline ${tone.text}`}>{shownMessage}</span>
          <X className={`ms-auto h-3 w-3 shrink-0 ${tone.text}`} />
        </div>
      )}
      <div className="flex items-center justify-between border-b border-[#e9e3f1] bg-white px-3 py-2 text-xs text-[#73698a]">
        <span className="font-extrabold text-[#221a2e]">IPS</span>
        <span className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1.5 -left-2 rounded-full bg-[#c2413a] px-1 text-[9px] leading-4 text-white">3</span>
        </span>
      </div>

      <div className="relative min-h-[230px] p-3">
        {displayStyle === 'home_card' ? (
          <>
            <p className="mb-1.5 text-[10px] font-bold text-[#73698a]">בית</p>
            {card()}
            <div className="mt-2 grid grid-cols-2 gap-2 opacity-50">
              <div className="h-14 rounded-2xl bg-white" />
              <div className="h-14 rounded-2xl bg-white" />
            </div>
          </>
        ) : displayStyle === 'list' ? (
          <>
            <p className="mb-1.5 text-[10px] font-bold text-[#73698a]">הודעות</p>
            {card()}
            <div className="mt-2 space-y-2 opacity-50">
              <div className="h-10 rounded-2xl bg-white" />
              <div className="h-10 rounded-2xl bg-white" />
            </div>
          </>
        ) : (
          <div className="space-y-2 opacity-50">
            <div className="h-16 rounded-2xl bg-white" />
            <div className="h-10 rounded-2xl bg-white" />
            <div className="h-10 rounded-2xl bg-white" />
          </div>
        )}

        {(displayStyle === 'toast' || legacyPopup) && (
          <div className={`absolute bottom-2 left-2 w-[72%] rounded-xl border p-2 shadow-lg ${tone.card}`}>
            <div className="flex items-start gap-1.5">
              <p className={`min-w-0 flex-1 truncate text-[11px] font-bold ${tone.title}`}>{shownTitle}</p>
              <X className={`h-3 w-3 shrink-0 ${tone.text}`} />
            </div>
            <p className={`truncate text-[10px] ${tone.text}`}>{shownMessage}</p>
          </div>
        )}

        {displayStyle === 'modal' && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 p-4">
            <div className="relative w-full max-w-[85%] rounded-2xl bg-white p-1 shadow-xl">
              <X className="absolute left-2.5 top-2.5 z-10 h-3.5 w-3.5 text-[#73698a]" />
              {card(true)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** The tiny picture on each "How it appears" choice. */
export function StyleThumbnail({ style }: { style: NotificationDisplayStyle }) {
  const block = 'rounded-[3px] bg-[#5b3a8e]';
  return (
    <div dir="rtl" aria-hidden className="relative aspect-[16/10] overflow-hidden rounded-lg border border-[#e9e3f1] bg-[#f6f3fa]">
      {style === 'top_bar' && <div className={`h-2 ${block} rounded-none`} />}
      <div className="flex h-3 items-center justify-between bg-white px-1.5">
        <span className="h-1 w-3 rounded bg-[#221a2e]/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#c2413a]" />
      </div>
      <div className="space-y-1 p-1.5">
        {style === 'home_card' && <div className={`h-4 ${block}`} />}
        {style === 'list' && <div className={`h-2.5 ${block}`} />}
        <div className="h-2 rounded-[3px] bg-white" />
        <div className="h-2 rounded-[3px] bg-white" />
        {style !== 'home_card' && <div className="h-2 rounded-[3px] bg-white" />}
      </div>
      {style === 'toast' && <div className={`absolute bottom-1 left-1 h-3 w-2/5 ${block}`} />}
      {style === 'modal' && (
        <div className="absolute inset-0 grid place-items-center bg-black/35">
          <div className={`h-1/2 w-1/2 ${block}`} />
        </div>
      )}
    </div>
  );
}
