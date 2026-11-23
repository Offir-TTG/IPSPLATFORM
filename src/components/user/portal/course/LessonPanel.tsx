'use client';

import { useEffect, useState } from 'react';
import dynamicImport from 'next/dynamic';
import { toast } from 'sonner';
import { TOPIC_LABEL, canJoin, durationLabel, fileUrlOf, hasLiveMeeting, lessonPlatform, sessionEnded, videoEmbedUrl, type Lesson } from './courseModel';

const Loading = ({ text }: { text: string }) => (
  <div className="grid place-items-center min-h-[320px] rounded-2xl bg-[#1e1230] text-white text-sm">{text}</div>
);
const ZoomMeetingSDK = dynamicImport(() => import('@/components/zoom/ZoomMeetingSDK'), { ssr: false, loading: () => <Loading text="פותחים את המפגש…" /> });
const ZoomRecordingPlayer = dynamicImport(() => import('@/components/zoom/ZoomRecordingPlayer'), { ssr: false, loading: () => <Loading text="טוענים את ההקלטה…" /> });
const DailyMeetingSDK = dynamicImport(() => import('@/components/daily/DailyMeetingSDK'), { ssr: false, loading: () => <Loading text="פותחים את המפגש…" /> });
const DailyRecordingPlayer = dynamicImport(() => import('@/components/daily/DailyRecordingPlayer'), { ssr: false, loading: () => <Loading text="טוענים את ההקלטה…" /> });

const note = 'text-sm text-[#7a4f00] bg-[#fbefd6] px-3.5 py-3 rounded-xl';
const btnOutline = 'self-start border border-[#e3dcef] bg-white text-[#221a2e] font-semibold text-[13.5px] px-3.5 py-2.5 rounded-[11px] hover:bg-[#faf8fd]';

export function LessonPanel({
  lesson,
  where,
  numbering,
  done,
  accent,
  whenLabel,
  onToggle,
  onBack,
  backLabel,
  autoJoin = false,
}: {
  /** Open the live meeting at once, when it can be joined. */
  autoJoin?: boolean;
  lesson: Lesson;
  where: string;
  /** "2.5" — module and lesson numbers, for the topics' "2.5.1". */
  numbering: string;
  done: boolean;
  accent: string;
  whenLabel: (lesson: Lesson) => string | null;
  onToggle: () => void;
  /** Phone: back to the list. */
  onBack: () => void;
  backLabel: string;
}) {
  const live = hasLiveMeeting(lesson);
  const recording = !!lesson.recording_url;
  const ended = sessionEnded(lesson);
  const platform = lessonPlatform(lesson);
  const [mode, setMode] = useState<'live' | 'rec'>(live && !ended ? 'live' : 'rec');
  const [joined, setJoined] = useState(autoJoin && live && canJoin(lesson));
  // The portal's own player could not play the file: our message, not Zoom's page.
  const [streamFailed, setStreamFailed] = useState(false);
  // Whether Zoom still has the video file: checked before showing the player.
  const [stream, setStream] = useState<'checking' | 'ok' | 'gone' | 'unavailable' | 'fallback'>(lesson.recording_stream ? 'checking' : 'fallback');
  useEffect(() => {
    if (!lesson.recording_stream) return setStream('fallback');
    setStream('checking');
    let live = true;
    fetch(`/api/user/lessons/${lesson.id}/recording?check=1`)
      .then((r) => r.json())
      .then((j) => live && setStream(j?.ok ? 'ok' : j?.reason === 'gone' ? 'gone' : 'unavailable'))
      .catch(() => live && setStream('unavailable'));
    return () => {
      live = false;
    };
  }, [lesson.id, lesson.recording_stream]);

  // A different lesson: back to its natural tab, and out of any meeting (unless asked to join it).
  useEffect(() => {
    setMode(live && !sessionEnded(lesson) ? 'live' : 'rec');
    setJoined(autoJoin && live && canJoin(lesson));
    setStreamFailed(false);
    // Only when the lesson changes: a data reload must not drop someone out of a meeting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const when = whenLabel(lesson);
  const meta = [when, durationLabel(lesson.duration), lesson.lesson_topics.length ? `${lesson.lesson_topics.length} תכנים` : null]
    .filter(Boolean)
    .join(' · ');
  const seg = (on: boolean, off = false) =>
    `px-4 py-2 rounded-[10px] font-semibold text-sm ${off ? 'text-[#a79fb8] cursor-default' : on ? 'bg-white text-[#2a1846] shadow-[0_1px_2px_rgba(42,24,70,.15)]' : 'text-[#5f5675]'}`;

  return (
    <section className="bg-white rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col gap-4 min-w-0">
      <button type="button" onClick={onBack} className="lg:hidden self-start text-[#5b3a8e] font-semibold text-[13.5px] px-3.5 py-2 rounded-full bg-[#f3eef9]">
        → {backLabel}
      </button>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] text-[#73698a]">{where}</div>
          <h2 className="m-0 mt-1 font-rubik font-bold text-[22px] lg:text-[26px] leading-[1.2] text-[#221a2e]">{lesson.title}</h2>
          {meta && <div className="text-sm text-[#5f5675] mt-1.5">{meta}</div>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          className={`shrink-0 font-semibold text-sm px-4 py-2.5 rounded-xl ${done ? 'bg-[#e1f4ea] text-[#1a7a50]' : 'border border-[#e3dcef] bg-white text-[#221a2e] hover:bg-[#faf8fd]'}`}
        >
          {done ? 'הושלם ✓' : 'סימון כהושלם'}
        </button>
      </div>
      {lesson.description && <p className="m-0 text-[14.5px] text-[#3b3349] leading-[1.7] whitespace-pre-line">{lesson.description}</p>}

      {lesson.lesson_topics.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline">
            <h3 className="m-0 font-rubik font-semibold text-base text-[#221a2e]">תכנים בשיעור</h3>
            <span className="text-[12.5px] text-[#73698a]">
              {lesson.lesson_topics.length} תכנים
              {lesson.lesson_topics.some((t) => t.is_required) && ` · ${lesson.lesson_topics.filter((t) => t.is_required).length} חובה`}
            </span>
          </div>
          {lesson.lesson_topics.map((topic, i) => (
            <div key={topic.id} className="rounded-2xl bg-[#f8f5fc] p-3.5 flex flex-col gap-2.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="shrink-0 min-w-[52px] text-center text-[11.5px] font-bold px-2 py-1 rounded-lg bg-[#f1ebf8] text-[#5b3a8e]">{TOPIC_LABEL[topic.content_type] ?? 'תוכן'}</span>
                <span className="text-[11.5px] font-semibold text-[#73698a]" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  {numbering}.{i + 1}
                </span>
                <b className="flex-1 min-w-0 text-[14.5px] font-semibold">{topic.title}</b>
                {topic.is_required && <span className="text-[11.5px] font-semibold text-[#5b3a8e] bg-white px-2 py-0.5 rounded-full">חובה</span>}
                {topic.duration_minutes ? <span className="text-[12.5px] text-[#73698a]">{topic.duration_minutes} דק׳</span> : null}
              </div>
              {topic.content && <TopicContent topic={topic} />}
            </div>
          ))}
        </div>
      )}

      {(live || recording) && (
        <div className="flex flex-col gap-3">
          {live && (
            <div role="group" aria-label="מפגש חי או הקלטה" className="inline-flex self-start gap-1 p-1 rounded-[14px] bg-[#f3eef9]">
              <button type="button" disabled={ended} onClick={() => setMode('live')} aria-pressed={mode === 'live'} className={seg(mode === 'live', ended)}>
                מפגש חי
              </button>
              <button type="button" onClick={() => { setMode('rec'); setJoined(false); }} aria-pressed={mode === 'rec'} className={seg(mode === 'rec')}>
                הקלטה
              </button>
            </div>
          )}

          {live && mode === 'live' && (
            <div className="rounded-[18px] p-4 flex flex-col gap-3 bg-gradient-to-br from-[#f3eef9] to-white shadow-[inset_0_0_0_1px_#ebe3f5]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex flex-col gap-0.5">
                  {when && <b className="font-rubik font-semibold text-lg">{when}</b>}
                  <span className="text-[13.5px] text-[#5f5675]">
                    {platform === 'daily' ? 'מפגש וידאו' : 'זום'}
                    {platform === 'zoom' && lesson.zoom_passcode && (
                      <>
                        {' · קוד כניסה '}
                        <b style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>{lesson.zoom_passcode}</b>
                      </>
                    )}
                  </span>
                </span>
                {canJoin(lesson) && !joined && (
                  <button type="button" onClick={() => setJoined(true)} className="border-0 text-white font-semibold text-[15px] px-[22px] py-3 rounded-[13px]" style={{ background: accent }}>
                    הצטרפות למפגש
                  </button>
                )}
              </div>
              {joined && platform === 'zoom' && (
                <div className="w-full rounded-2xl overflow-hidden bg-black">
                  <ZoomMeetingSDK
                    meetingNumber={lesson.zoom_meeting_id!}
                    password={lesson.zoom_passcode || ''}
                    role={0}
                    onMeetingEnd={() => {
                      setJoined(false);
                      toast.success('המפגש הסתיים');
                    }}
                    onError={(error) => {
                      toast.error(error.message);
                      setJoined(false);
                    }}
                  />
                </div>
              )}
              {joined && platform === 'daily' && (
                <div className="w-full rounded-2xl overflow-hidden bg-black">
                  <DailyMeetingSDK
                    lessonId={lesson.id}
                    onError={(error) => {
                      toast.error(error.message);
                      setJoined(false);
                    }}
                  />
                </div>
              )}
              {!canJoin(lesson) && (
                <span className={note}>{ended ? 'המפגש הסתיים. ההקלטה בלשונית "הקלטה".' : 'אפשר להצטרף מחצי שעה לפני תחילת המפגש. הכפתור יופיע כאן.'}</span>
              )}
            </div>
          )}

          {(mode === 'rec' || !live) &&
            (recording ? (
              stream === 'checking' ? (
                <div className="grid place-items-center w-full aspect-video rounded-2xl bg-[#1e1230] text-white text-sm">טוענים את ההקלטה…</div>
              ) : stream === 'gone' ? (
                <span className={note}>ההקלטה של המפגש הזה כבר לא נמצאת בזום, ולכן אי אפשר לצפות בה. אפשר לפנות לצוות.</span>
              ) : stream === 'unavailable' || (stream === 'ok' && streamFailed) ? (
                <span className={note}>לא הצלחנו לטעון את ההקלטה כרגע. נסו שוב מאוחר יותר.</span>
              ) : stream === 'ok' ? (
                // The video file itself, in the browser's own player: no Zoom page, no download button.
                <video
                  key={lesson.id}
                  src={`/api/user/lessons/${lesson.id}/recording`}
                  controls
                  playsInline
                  preload="metadata"
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  onError={() => setStreamFailed(true)}
                  className="w-full aspect-video rounded-2xl bg-black"
                />
              ) : platform === 'daily' ? (
                <DailyRecordingPlayer recordingUrl={lesson.recording_url!} lessonTitle={lesson.title} onError={(error) => toast.error(error.message)} />
              ) : (
                <ZoomRecordingPlayer recordingUrl={lesson.recording_url!} lessonTitle={lesson.title} onError={(error) => toast.error(error.message)} />
              )
            ) : (
              <span className={note}>ההקלטה עוד לא מוכנה. היא תעלה כאן אחרי המפגש.</span>
            ))}
        </div>
      )}

    </section>
  );
}

function TopicContent({ topic }: { topic: Lesson['lesson_topics'][number] }) {
  const c = topic.content;
  switch (topic.content_type) {
    case 'text': {
      const html = typeof c === 'object' && c?.html ? c.html : typeof c === 'string' ? c : null;
      return html ? <div className="prose prose-sm max-w-none text-[#3b3349]" dangerouslySetInnerHTML={{ __html: html }} /> : null;
    }
    case 'video': {
      const src = videoEmbedUrl(c);
      return src ? (
        <div className="aspect-video">
          <iframe src={src} title={topic.title} className="w-full h-full rounded-[14px] border-0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      ) : null;
    }
    case 'embed': {
      const code = typeof c === 'object' ? c?.embed_code || c?.embedCode : null;
      if (code) return <div className="aspect-video [&_iframe]:w-full [&_iframe]:h-full" dangerouslySetInnerHTML={{ __html: code }} />;
      return typeof c === 'object' && c?.url ? (
        <div className="aspect-video">
          <iframe src={c.url} title={topic.title} className="w-full h-full rounded-[14px] border-0" allowFullScreen />
        </div>
      ) : null;
    }
    case 'pdf':
    case 'download': {
      const url = fileUrlOf(c);
      const name = typeof c === 'object' ? c?.filename || c?.fileName : null;
      return url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`${btnOutline} no-underline`}>
          {name || (topic.content_type === 'pdf' ? 'פתיחת ה-PDF' : 'הורדת הקובץ')}
        </a>
      ) : null;
    }
    case 'whiteboard':
      return typeof c === 'object' && c?.url ? (
        <a href={c.url} target="_blank" rel="noopener noreferrer" className={`${btnOutline} no-underline`}>
          פתיחת הלוח
        </a>
      ) : (
        <span className="self-start text-[13.5px] text-[#73698a] border border-dashed border-[#d9cfea] px-3.5 py-2.5 rounded-[11px]">הלוח נפתח בזמן המפגש החי</span>
      );
    default:
      return null;
  }
}
