/**
 * Every event an automatic reminder can start from: its area, the client's
 * settings group it belongs to, when it counts from, what stops it, the
 * details a message can include, the button it can carry, and the messages
 * a new reminder starts with. The admin screen and the engine both read it.
 *
 * Pure data, safe on the client.
 */

import type { MessageCategory } from './categories';

export type Area = 'meetings' | 'coaching' | 'payments' | 'enrollment' | 'assignments' | 'team' | 'system';
/** לפני שקורה / כשקורה / כשלא קורה */
export type Timing = 'before' | 'on' | 'missing';
/**
 * poll:     the engine finds the cases itself, every few minutes
 * event:    the place in the system where it happens starts it
 * external: sent elsewhere (price changes, system emails); the screen shows
 *           it and edits what applies
 */
export type Source = 'poll' | 'event' | 'external';

export interface Bi {
  he: string;
  en: string;
}

export interface Placeholder {
  key: string;
  he: string;
  en: string;
  /** For test sends and the preview. */
  sample: Bi;
}

export interface StopOption {
  key: string;
  he: string;
  en: string;
  /** Always on; can't be turned off. */
  locked?: boolean;
}

export interface ActionOption {
  key: string;
  he: string;
  en: string;
}

export interface DefaultStep {
  offset: number;
  sendEmail?: boolean;
  adminCopy?: boolean;
  action?: string;
  title: Bi;
  body: Bi;
}

export interface SystemRow {
  /** Minutes from the anchor. */
  offset: number;
  he: string;
  en: string;
  /** Shown in amber: happens after something it should come before. */
  warn?: Bi;
}

export interface CatalogEvent {
  key: string;
  area: Area;
  category: MessageCategory;
  timing: Timing;
  source: Source;
  audience: 'client' | 'team';
  name: Bi;
  /** One line under the name: what starts it. */
  when: Bi;
  /** What the step offsets count from ("מהרגע שהתשלום לא עבר"). */
  anchor: Bi;
  /** Messages tied to a time are never emailed late. */
  timeSensitive?: boolean;
  stops: StopOption[];
  placeholders: Placeholder[];
  actions: ActionOption[];
  steps: DefaultStep[];
  /** What the system does by itself along the way (grey rows). */
  systemRows?: SystemRow[];
  /** Seeded on first use, and its status then. */
  seed?: 'active' | 'draft' | 'off';
  /** The old email trigger it replaces; turned off when this is turned on. */
  replacesTrigger?: string;
  /** Can be switched off, never deleted, and its words edited only. */
  locked?: boolean;
}

const MIN = 1;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// --- details a message can include ---------------------------------------
const P = {
  name: { key: 'name', he: 'שם', en: 'name', sample: { he: 'דנה', en: 'Dana' } },
  lesson: { key: 'lesson', he: 'שם המפגש', en: 'meeting', sample: { he: 'גבולות באהבה', en: 'Loving limits' } },
  course: { key: 'course', he: 'קורס', en: 'course', sample: { he: 'הורות בגובה העיניים', en: 'Parenting at eye level' } },
  date: { key: 'date', he: 'תאריך', en: 'date', sample: { he: '26.11', en: '11/26' } },
  time: { key: 'time', he: 'שעה', en: 'time', sample: { he: '19:00', en: '19:00' } },
  amount: { key: 'amount', he: 'סכום', en: 'amount', sample: { he: '$175.00', en: '$175.00' } },
  product: { key: 'product', he: 'מוצר', en: 'product', sample: { he: 'ליווי הורי', en: 'Parent coaching' } },
  paymentNo: { key: 'payment_no', he: 'מספר תשלום', en: 'payment number', sample: { he: '4 מתוך 12', en: '4 of 12' } },
  nextRetry: { key: 'next_retry', he: 'תאריך הניסיון הבא', en: 'next try', sample: { he: '25.11', en: '11/25' } },
  blockDate: { key: 'block_date', he: 'תאריך החסימה', en: 'block date', sample: { he: '28.11', en: '11/28' } },
  child: { key: 'child', he: 'שם הילד', en: 'child', sample: { he: 'נועה', en: 'Noa' } },
  when: { key: 'when', he: 'מועד', en: 'when', sample: { he: 'יום שלישי, 26.11 בשעה 17:00', en: 'Tuesday, 11/26 at 17:00' } },
  assignment: { key: 'assignment', he: 'מטלה', en: 'assignment', sample: { he: 'יומן רגשות', en: 'Feelings journal' } },
  session: { key: 'session', he: 'המפגש', en: 'the session', sample: { he: 'המפגש של נועה', en: "Noa's session" } },
  count: { key: 'count', he: 'מספר מפגשים', en: 'number of sessions', sample: { he: '4', en: '4' } },
  change: { key: 'change', he: 'מה השתנה', en: 'what changed', sample: { he: 'הוזז ל-26.11 בשעה 19:00', en: 'moved to 11/26 at 19:00' } },
  oldPrice: { key: 'old_price', he: 'מחיר קודם', en: 'old price', sample: { he: '$29.99', en: '$29.99' } },
  newPrice: { key: 'new_price', he: 'מחיר חדש', en: 'new price', sample: { he: '$34.99', en: '$34.99' } },
  client: { key: 'client', he: 'לקוח', en: 'client', sample: { he: 'דנה לוי', en: 'Dana Levi' } },
} satisfies Record<string, Placeholder>;

// --- buttons --------------------------------------------------------------
const A = {
  updateCard: { key: 'update_card', he: 'עדכון כרטיס', en: 'Update card' },
  billing: { key: 'billing', he: 'לפרטי התשלום', en: 'Payment details' },
  join: { key: 'join', he: 'כניסה למפגש', en: 'Join the meeting' },
  recording: { key: 'recording', he: 'לצפייה בהקלטה', en: 'Watch the recording' },
  coaching: { key: 'coaching', he: 'לפרטי המפגש', en: 'Session details' },
  offer: { key: 'offer', he: 'לאישור', en: 'Review and approve' },
  enroll: { key: 'enroll', he: 'להשלמת ההרשמה', en: 'Finish enrolling' },
  intake: { key: 'intake', he: 'למילוי השאלון', en: 'Fill in the questionnaire' },
  assignment: { key: 'assignment', he: 'למטלה', en: 'Open the assignment' },
  certificate: { key: 'certificate', he: 'לתעודה', en: 'View certificate' },
  portal: { key: 'portal', he: 'לאזור האישי', en: 'Go to my account' },
  admin: { key: 'admin', he: 'לפרטים', en: 'Open' },
} satisfies Record<string, ActionOption>;

const STOP_CANCELLED: StopOption = { key: 'enrollment_cancelled', he: 'ההרשמה בוטלה', en: 'The enrollment was cancelled' };
const STOP_MANUAL: StopOption = { key: 'manual', he: 'עצרתי ידנית ללקוח הזה', en: 'I stopped it for this client', locked: true };

export const CATALOG: CatalogEvent[] = [
  // ======================= Meetings =======================
  {
    key: 'lesson.before',
    area: 'meetings',
    category: 'lesson',
    timing: 'before',
    source: 'poll',
    audience: 'client',
    name: { he: 'תזכורת לפני מפגש חי', en: 'Before a live meeting' },
    when: { he: 'זמן קבוע לפני כל מפגש, עם קישור כניסה.', en: 'A set time before each meeting, with the join link.' },
    anchor: { he: 'לפני תחילת המפגש', en: 'before the meeting starts' },
    timeSensitive: true,
    stops: [
      { key: 'lesson_moved', he: 'המפגש הוזז או בוטל', en: 'The meeting was moved or cancelled', locked: true },
      STOP_CANCELLED,
      STOP_MANUAL,
    ],
    placeholders: [P.name, P.lesson, P.course, P.date, P.time],
    actions: [A.join, A.portal],
    steps: [
      {
        offset: -DAY,
        action: 'join',
        title: { he: 'מחר: {שם המפגש}', en: 'Tomorrow: {meeting}' },
        body: { he: '<p>שלום {שם},</p><p>תזכורת: מחר ב-{שעה} נפגשים ב{שם המפגש}.</p>', en: '<p>Hi {name},</p><p>A reminder: tomorrow at {time} we meet for {meeting}.</p>' },
      },
      {
        offset: -30 * MIN,
        action: 'join',
        title: { he: 'עוד 30 דקות: {שם המפגש}', en: 'In 30 minutes: {meeting}' },
        body: { he: '<p>שלום {שם},</p><p>{שם המפגש} מתחיל בעוד חצי שעה. הקישור כאן:</p>', en: '<p>Hi {name},</p><p>{meeting} starts in half an hour. Here is the link:</p>' },
      },
    ],
    systemRows: [{ offset: 0, he: 'המפגש מתחיל', en: 'The meeting starts' }],
    seed: 'draft',
    replacesTrigger: 'lesson.reminder',
  },
  {
    key: 'lesson.changed',
    area: 'meetings',
    category: 'lesson',
    timing: 'on',
    source: 'event',
    audience: 'client',
    name: { he: 'מפגש בוטל או הוזז', en: 'Meeting cancelled or moved' },
    when: { he: 'מיד כשמשנים מועד או מבטלים.', en: 'As soon as a meeting is moved or cancelled.' },
    anchor: { he: 'מהרגע שהמפגש השתנה', en: 'from the change' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.lesson, P.course, P.change, P.date, P.time],
    actions: [A.join, A.portal],
    steps: [
      {
        offset: 0,
        action: 'portal',
        title: { he: 'שינוי במפגש: {שם המפגש}', en: 'Change to {meeting}' },
        body: { he: '<p>שלום {שם},</p><p>המפגש {שם המפגש} {מה השתנה}.</p>', en: '<p>Hi {name},</p><p>{meeting} was {what changed}.</p>' },
      },
    ],
    seed: 'draft',
  },
  {
    key: 'lesson.recording',
    area: 'meetings',
    category: 'lesson',
    timing: 'on',
    source: 'event',
    audience: 'client',
    name: { he: 'ההקלטה עלתה', en: 'Recording is ready' },
    when: { he: 'כשהקלטת המפגש מוכנה לצפייה.', en: 'When the meeting recording is ready to watch.' },
    anchor: { he: 'מהרגע שההקלטה עלתה', en: 'from when the recording is ready' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.lesson, P.course],
    actions: [A.recording],
    steps: [
      {
        offset: 0,
        action: 'recording',
        title: { he: 'ההקלטה של {שם המפגש} עלתה', en: 'The recording of {meeting} is ready' },
        body: { he: '<p>שלום {שם},</p><p>ההקלטה של {שם המפגש} מחכה לך באזור האישי.</p>', en: '<p>Hi {name},</p><p>The recording of {meeting} is waiting for you in your account.</p>' },
      },
    ],
    seed: 'draft',
    replacesTrigger: 'recording.ready',
  },
  {
    key: 'lesson.absent',
    area: 'meetings',
    category: 'lesson',
    timing: 'on',
    source: 'poll',
    audience: 'client',
    name: { he: 'לא הגיע למפגש', en: 'Missed a meeting' },
    when: { he: 'אחרי מפגש שסומן בו חיסור.', en: 'After a meeting marked as missed.' },
    anchor: { he: 'מיום המפגש', en: 'from the meeting day' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.lesson, P.course, P.date],
    actions: [A.recording],
    steps: [
      {
        offset: DAY,
        action: 'recording',
        title: { he: 'התגעגענו במפגש {שם המפגש}', en: 'We missed you at {meeting}' },
        body: { he: '<p>שלום {שם},</p><p>ראינו שלא יכולת להגיע ל{שם המפגש}. אפשר לצפות בהקלטה באזור האישי.</p>', en: "<p>Hi {name},</p><p>We saw you couldn't make it to {meeting}. You can watch the recording in your account.</p>" },
      },
    ],
    seed: 'off',
  },

  // ======================= Coaching =======================
  {
    key: 'coaching.before',
    area: 'coaching',
    category: 'lesson',
    timing: 'before',
    source: 'poll',
    audience: 'client',
    name: { he: 'תזכורת לפני מפגש ליווי', en: 'Before a coaching session' },
    when: { he: 'זמן קבוע לפני כל מפגש עם המלווה.', en: 'A set time before each session with the coach.' },
    anchor: { he: 'לפני תחילת המפגש', en: 'before the session starts' },
    timeSensitive: true,
    stops: [{ key: 'session_changed', he: 'המפגש הוזז או בוטל', en: 'The session was moved or cancelled', locked: true }, STOP_MANUAL],
    placeholders: [P.name, P.child, P.when, P.time],
    actions: [A.coaching],
    steps: [
      {
        offset: -DAY,
        action: 'coaching',
        title: { he: 'מחר: מפגש ליווי', en: 'Tomorrow: coaching session' },
        body: { he: '<p>שלום {שם},</p><p>תזכורת: מפגש הליווי נקבע ל{מועד}.</p>', en: '<p>Hi {name},</p><p>A reminder: your coaching session is on {when}.</p>' },
      },
      {
        offset: -2 * HOUR,
        action: 'coaching',
        title: { he: 'בעוד שעתיים: מפגש ליווי', en: 'In two hours: coaching session' },
        body: { he: '<p>שלום {שם},</p><p>מפגש הליווי מתחיל ב-{שעה}.</p>', en: '<p>Hi {name},</p><p>Your coaching session starts at {time}.</p>' },
      },
    ],
    systemRows: [{ offset: 0, he: 'המפגש מתחיל', en: 'The session starts' }],
    seed: 'draft',
  },
  {
    key: 'coaching.changed',
    area: 'coaching',
    category: 'lesson',
    timing: 'on',
    source: 'event',
    audience: 'client',
    name: { he: 'מפגש ליווי נקבע, הוזז או בוטל', en: 'Coaching session booked, moved or cancelled' },
    when: { he: 'כשהצוות או ההורה משנים מפגש.', en: 'When the team or the parent changes a session.' },
    anchor: { he: 'מהרגע שהמפגש השתנה', en: 'from the change' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.session, P.change, P.child, P.when],
    actions: [A.coaching],
    steps: [
      {
        offset: 0,
        sendEmail: false,
        action: 'coaching',
        title: { he: '{המפגש} {מה השתנה}', en: '{the session} was {what changed}' },
        body: { he: '<p>{המפגש} {מה השתנה}.</p>', en: '<p>{the session} was {what changed}.</p>' },
      },
    ],
    seed: 'active',
  },
  {
    key: 'coaching.offer',
    area: 'coaching',
    category: 'lesson',
    timing: 'on',
    source: 'event',
    audience: 'client',
    name: { he: 'הוצעו מפגשים נוספים', en: 'More sessions offered' },
    when: { he: 'כשהצוות מציע חבילה נוספת.', en: 'When the team offers more sessions.' },
    anchor: { he: 'מהרגע שההצעה נשלחה', en: 'from the offer' },
    stops: [{ key: 'offer_answered', he: 'ההורה אישר או ההצעה בוטלה', en: 'The parent answered or the offer was withdrawn', locked: true }, STOP_MANUAL],
    placeholders: [P.name, P.child, P.count],
    actions: [A.offer],
    steps: [
      {
        offset: 0,
        sendEmail: false,
        action: 'offer',
        title: { he: 'הוצעו {מספר מפגשים} מפגשים נוספים', en: '{number of sessions} more sessions are offered' },
        body: { he: '<p>לא נגבה כלום באישור. כל מפגש נגבה רק כשהוא מתקיים, ואין צורך לחתום שוב.</p>', en: "<p>Nothing is charged when you approve. Each session is charged only when it takes place, and there's nothing to sign again.</p>" },
      },
    ],
    seed: 'active',
  },

  // ======================= Payments =======================
  {
    key: 'payment.failed',
    area: 'payments',
    category: 'payment',
    timing: 'on',
    source: 'poll',
    audience: 'client',
    name: { he: 'התשלום לא עבר', en: "Payment didn't go through" },
    when: { he: 'הכרטיס נדחה, פג תוקף או שהבנק חסם.', en: 'The card was declined, expired or blocked by the bank.' },
    anchor: { he: 'מהרגע שהתשלום לא עבר', en: 'from the failed payment' },
    stops: [
      { key: 'paid', he: 'התשלום עבר, או שעודכן כרטיס', en: 'The payment went through, or the card was updated', locked: true },
      STOP_CANCELLED,
      STOP_MANUAL,
    ],
    placeholders: [P.name, P.amount, P.product, P.paymentNo, P.nextRetry, P.blockDate],
    actions: [A.updateCard, A.billing],
    steps: [
      {
        offset: 0,
        action: 'update_card',
        title: { he: 'התשלום שלך לא עבר', en: "Your payment didn't go through" },
        body: {
          he: '<p>שלום {שם},</p><p>החיוב של {סכום} עבור {מוצר} לא עבר. ננסה שוב ב-{תאריך הניסיון הבא}.</p><p>אפשר לעדכן כרטיס כאן:</p>',
          en: "<p>Hi {name},</p><p>The charge of {amount} for {product} didn't go through. We'll try again on {next try}.</p><p>You can update your card here:</p>",
        },
      },
      {
        offset: 3 * DAY,
        action: 'update_card',
        title: { he: 'תזכורת: צריך לעדכן כרטיס', en: 'Reminder: please update your card' },
        body: {
          he: '<p>שלום {שם},</p><p>החיוב של {סכום} עבור {מוצר} עדיין לא עבר.</p><p>כדי שהכול ימשיך בלי הפסקה, כדאי לעדכן כרטיס עד {תאריך החסימה}. זה לוקח דקה:</p>',
          en: "<p>Hi {name},</p><p>The charge of {amount} for {product} still hasn't gone through.</p><p>To keep everything going, please update your card by {block date}. It takes a minute:</p>",
        },
      },
      {
        offset: 6 * DAY,
        adminCopy: true,
        action: 'update_card',
        title: { he: 'אזהרה אחרונה: מחר הגישה תיחסם', en: 'Last notice: access is paused tomorrow' },
        body: {
          he: '<p>שלום {שם},</p><p>אם התשלום לא יוסדר עד מחר, הגישה ל{מוצר} תיחסם עד שיוסדר.</p>',
          en: "<p>Hi {name},</p><p>If the payment isn't settled by tomorrow, access to {product} will be paused until it is.</p>",
        },
      },
    ],
    systemRows: [
      { offset: DAY, he: 'המערכת מנסה לחייב שוב (ניסיון 1 מתוך 3)', en: 'The system tries the charge again (1 of 3)' },
      { offset: 4 * DAY, he: 'ניסיון חיוב 2 מתוך 3', en: 'Charge attempt 2 of 3' },
      { offset: 7 * DAY, he: "הגישה נחסמת (השעיה). אם התזכורת 'ההרשמה הושעתה' דולקת, היא תתחיל עכשיו.", en: "Access is paused (suspension). If 'Enrollment suspended' is on, it starts now." },
      { offset: 11 * DAY, he: 'ניסיון חיוב 3, האחרון', en: 'Charge attempt 3, the last', warn: { he: 'מגיע אחרי החסימה', en: 'Comes after the suspension' } },
    ],
    seed: 'draft',
  },
  {
    key: 'payment.upcoming',
    area: 'payments',
    category: 'payment',
    timing: 'before',
    source: 'poll',
    audience: 'client',
    name: { he: 'תשלום מתקרב', en: 'Payment coming up' },
    when: { he: 'כמה ימים לפני כל תשלום מתוכנן.', en: 'A few days before each scheduled payment.' },
    anchor: { he: 'לפני מועד החיוב', en: 'before the charge date' },
    stops: [{ key: 'paid', he: 'התשלום כבר עבר', en: 'Already paid', locked: true }, STOP_CANCELLED, STOP_MANUAL],
    placeholders: [P.name, P.amount, P.product, P.date, P.paymentNo],
    actions: [A.billing, A.updateCard],
    steps: [
      {
        offset: -3 * DAY,
        action: 'billing',
        title: { he: 'ב-{תאריך} יחויב {סכום}', en: '{amount} will be charged on {date}' },
        body: { he: '<p>שלום {שם},</p><p>ב-{תאריך} יחויב {סכום} עבור {מוצר}, תשלום {מספר תשלום}.</p>', en: '<p>Hi {name},</p><p>On {date}, {amount} will be charged for {product}, payment {payment number}.</p>' },
      },
    ],
    seed: 'draft',
  },
  {
    key: 'payment.card_expiring',
    area: 'payments',
    category: 'payment',
    timing: 'before',
    source: 'poll',
    audience: 'client',
    name: { he: 'הכרטיס עומד לפוג', en: 'Card about to expire' },
    when: { he: 'לפני שתוקף הכרטיס השמור נגמר.', en: 'Before the saved card expires.' },
    anchor: { he: 'לפני שתוקף הכרטיס נגמר', en: 'before the card expires' },
    stops: [{ key: 'card_updated', he: 'עודכן כרטיס', en: 'The card was updated', locked: true }, STOP_CANCELLED, STOP_MANUAL],
    placeholders: [P.name, P.product, P.date],
    actions: [A.updateCard],
    steps: [
      {
        offset: -30 * DAY,
        action: 'update_card',
        title: { he: 'הכרטיס השמור שלך עומד לפוג', en: 'Your saved card is about to expire' },
        body: { he: '<p>שלום {שם},</p><p>תוקף הכרטיס השמור נגמר ב-{תאריך}. כדי שהתשלומים הבאים יעברו, כדאי לעדכן אותו:</p>', en: '<p>Hi {name},</p><p>Your saved card expires on {date}. To keep the next payments going, please update it:</p>' },
      },
      {
        offset: -7 * DAY,
        action: 'update_card',
        title: { he: 'עוד שבוע תוקף הכרטיס נגמר', en: 'Your card expires in a week' },
        body: { he: '<p>שלום {שם},</p><p>תוקף הכרטיס נגמר ב-{תאריך}. עדכון לוקח דקה:</p>', en: '<p>Hi {name},</p><p>Your card expires on {date}. Updating takes a minute:</p>' },
      },
    ],
    seed: 'draft',
  },
  {
    key: 'payment.before_block',
    area: 'payments',
    category: 'payment',
    timing: 'before',
    source: 'poll',
    audience: 'client',
    name: { he: 'לפני שהגישה נחסמת', en: 'Before access is paused' },
    when: { he: 'יום או יומיים לפני השעיה.', en: 'A day or two before a suspension.' },
    anchor: { he: 'לפני מועד החסימה', en: 'before the suspension date' },
    stops: [{ key: 'paid', he: 'התשלום עבר, או שעודכן כרטיס', en: 'The payment went through, or the card was updated', locked: true }, STOP_CANCELLED, STOP_MANUAL],
    placeholders: [P.name, P.amount, P.product, P.blockDate],
    actions: [A.updateCard],
    steps: [
      {
        offset: -DAY,
        adminCopy: true,
        action: 'update_card',
        title: { he: 'מחר הגישה ל{מוצר} תיחסם', en: 'Access to {product} is paused tomorrow' },
        body: { he: '<p>שלום {שם},</p><p>החיוב של {סכום} עדיין לא עבר. אם לא יוסדר עד מחר, הגישה תיחסם עד שיוסדר.</p>', en: "<p>Hi {name},</p><p>The charge of {amount} still hasn't gone through. If it isn't settled by tomorrow, access is paused until it is.</p>" },
      },
    ],
    seed: 'off',
  },
  {
    key: 'enrollment.suspended',
    area: 'payments',
    category: 'payment',
    timing: 'on',
    source: 'event',
    audience: 'client',
    name: { he: 'ההרשמה הושעתה', en: 'Enrollment suspended' },
    when: { he: 'כשהגישה נחסמה בגלל תשלום.', en: 'When access was paused because of a payment.' },
    anchor: { he: 'מהרגע שהגישה נחסמה', en: 'from the suspension' },
    stops: [{ key: 'reactivated', he: 'ההרשמה חזרה לפעול', en: 'The enrollment is active again', locked: true }, STOP_MANUAL],
    placeholders: [P.name, P.product],
    actions: [A.updateCard],
    steps: [
      {
        offset: 0,
        action: 'update_card',
        title: { he: 'הגישה ל{מוצר} נחסמה', en: 'Access to {product} is paused' },
        body: { he: '<p>שלום {שם},</p><p>בגלל תשלום שלא עבר, הגישה ל{מוצר} נחסמה. ברגע שהתשלום יוסדר, הכול חוזר לפעול.</p>', en: "<p>Hi {name},</p><p>Because a payment didn't go through, access to {product} is paused. As soon as the payment is settled, everything is back.</p>" },
      },
    ],
    seed: 'off',
    replacesTrigger: 'enrollment.suspended',
  },
  {
    key: 'payment.recovered',
    area: 'payments',
    category: 'payment',
    timing: 'on',
    source: 'poll',
    audience: 'client',
    name: { he: 'התשלום הוסדר', en: 'Payment settled' },
    when: { he: 'תודה אחרי שתשלום שנכשל עבר.', en: 'A thank-you after a failed payment goes through.' },
    anchor: { he: 'מהרגע שהתשלום עבר', en: 'from the payment' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.amount, P.product],
    actions: [A.billing],
    steps: [
      {
        offset: 0,
        action: 'billing',
        title: { he: 'תודה, התשלום עבר', en: 'Thank you, the payment went through' },
        body: { he: '<p>שלום {שם},</p><p>החיוב של {סכום} עבור {מוצר} עבר. הכול ממשיך כרגיל.</p>', en: '<p>Hi {name},</p><p>The charge of {amount} for {product} went through. Everything carries on as usual.</p>' },
      },
    ],
    seed: 'off',
  },
  {
    key: 'payment.received',
    area: 'payments',
    category: 'payment',
    timing: 'on',
    source: 'poll',
    audience: 'client',
    name: { he: 'התשלום התקבל', en: 'Payment received' },
    when: { he: 'אחרי כל חיוב שעבר, עם קבלה.', en: 'After each successful charge, with a receipt.' },
    anchor: { he: 'מהרגע שהתשלום עבר', en: 'from the payment' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.amount, P.product, P.paymentNo],
    actions: [A.billing],
    steps: [
      {
        offset: 0,
        action: 'billing',
        title: { he: 'קיבלנו את התשלום, תודה', en: 'Payment received, thank you' },
        body: { he: '<p>שלום {שם},</p><p>קיבלנו {סכום} עבור {מוצר}. הקבלה מחכה באזור האישי.</p>', en: '<p>Hi {name},</p><p>We received {amount} for {product}. The receipt is in your account.</p>' },
      },
    ],
    seed: 'draft',
  },
  {
    key: 'price.changing',
    area: 'payments',
    category: 'payment',
    timing: 'before',
    source: 'external',
    audience: 'client',
    name: { he: 'המחיר של המנוי משתנה', en: 'Membership price changes' },
    when: { he: 'לפני מועד שינוי מחיר שנקבע במוצר.', en: 'Before a price change set on the product.' },
    anchor: { he: 'לפני מועד השינוי, לפי מה שהוגדר בשינוי המחיר', en: 'before the change, as set on the price change' },
    stops: [{ key: 'change_cancelled', he: 'שינוי המחיר בוטל', en: 'The price change was cancelled', locked: true }],
    placeholders: [P.name, P.product, P.oldPrice, P.newPrice, P.date],
    actions: [A.billing, A.portal],
    steps: [
      {
        offset: 0,
        action: 'billing',
        title: { he: 'עדכון מחיר המנוי ב{מוצר}', en: 'Your {product} membership price is changing' },
        body: {
          he: '<p>שלום {שם},</p><p>רצינו לעדכן מראש: מחיר המנוי ב{מוצר} משתנה מ-{מחיר קודם} ל-{מחיר חדש}.</p><p>המחיר החדש יחול מהחיוב שלך ב-{תאריך}. עד אז הכול נשאר כרגיל. אפשר להפסיק את המנוי בכל עת לפני כן באזור האישי.</p>',
          en: "<p>Hi {name},</p><p>A heads-up: the membership price for {product} is changing from {old price} to {new price}.</p><p>The new price applies from your charge on {date}. Until then nothing changes. You can stop your membership any time before then in your account.</p>",
        },
      },
    ],
    seed: 'active',
  },
  {
    key: 'price.cancelled',
    area: 'payments',
    category: 'payment',
    timing: 'on',
    source: 'external',
    audience: 'client',
    name: { he: 'שינוי המחיר בוטל', en: 'Price change cancelled' },
    when: { he: 'כשמבטלים שינוי שכבר הודיעו עליו.', en: 'When a price change already announced is cancelled.' },
    anchor: { he: 'מהרגע שהשינוי בוטל', en: 'from the cancellation' },
    stops: [],
    placeholders: [P.name, P.product, P.oldPrice],
    actions: [A.portal],
    steps: [
      {
        offset: 0,
        title: { he: 'מחיר המנוי ב{מוצר} לא משתנה', en: 'Your {product} membership price stays the same' },
        body: { he: '<p>שלום {שם},</p><p>שינוי המחיר שהודענו עליו בוטל. המנוי שלך ב{מוצר} נשאר ב-{מחיר קודם}.</p>', en: '<p>Hi {name},</p><p>The price change we told you about has been cancelled. Your {product} membership stays at {old price}.</p>' },
      },
    ],
    seed: 'active',
  },

  // ======================= Enrollment =======================
  {
    key: 'enrollment.incomplete',
    area: 'enrollment',
    category: 'enrollment',
    timing: 'missing',
    source: 'poll',
    audience: 'client',
    name: { he: 'ההרשמה לא הושלמה', en: "Enrollment wasn't finished" },
    when: { he: 'קישור הרשמה נשלח ולא מולא עד הסוף.', en: "An enrollment link was sent and wasn't finished." },
    anchor: { he: 'מהרגע שקישור ההרשמה נשלח', en: 'from when the link was sent' },
    stops: [{ key: 'enrolled', he: 'ההרשמה הושלמה', en: 'The enrollment was finished', locked: true }, STOP_CANCELLED, STOP_MANUAL],
    placeholders: [P.name, P.product],
    actions: [A.enroll],
    steps: [
      {
        offset: 2 * DAY,
        action: 'enroll',
        title: { he: 'נשאר רק לסיים את ההרשמה ל{מוצר}', en: 'Just one step left to enroll in {product}' },
        body: { he: '<p>שלום {שם},</p><p>התחלנו את ההרשמה ל{מוצר}, ונשאר רק לסיים. הקישור האישי כאן:</p>', en: "<p>Hi {name},</p><p>Your enrollment in {product} is started and just needs finishing. Here's your personal link:</p>" },
      },
      {
        offset: 5 * DAY,
        action: 'enroll',
        title: { he: 'תזכורת: ההרשמה ל{מוצר}', en: 'Reminder: your {product} enrollment' },
        body: { he: '<p>שלום {שם},</p><p>ההרשמה ל{מוצר} עדיין מחכה. אם יש שאלה, אפשר פשוט להשיב למייל הזה.</p>', en: '<p>Hi {name},</p><p>Your enrollment in {product} is still waiting. If you have a question, just reply to this email.</p>' },
      },
    ],
    seed: 'draft',
  },
  {
    key: 'enrollment.contract',
    area: 'enrollment',
    category: 'enrollment',
    timing: 'missing',
    source: 'poll',
    audience: 'client',
    name: { he: 'החוזה לא נחתם', en: "Contract wasn't signed" },
    when: { he: 'החוזה נשלח ועדיין לא נחתם.', en: "The contract was sent and isn't signed yet." },
    anchor: { he: 'מהרגע שהחוזה נשלח', en: 'from when the contract was sent' },
    stops: [{ key: 'signed', he: 'החוזה נחתם', en: 'The contract was signed', locked: true }, STOP_CANCELLED, STOP_MANUAL],
    placeholders: [P.name, P.product],
    actions: [A.enroll],
    steps: [
      {
        offset: 2 * DAY,
        action: 'enroll',
        title: { he: 'החוזה ל{מוצר} מחכה לחתימה', en: 'Your {product} contract is waiting for a signature' },
        body: { he: '<p>שלום {שם},</p><p>החוזה ל{מוצר} נשלח ועדיין לא נחתם. אפשר לחתום כאן:</p>', en: "<p>Hi {name},</p><p>The contract for {product} was sent and isn't signed yet. You can sign it here:</p>" },
      },
      {
        offset: 5 * DAY,
        action: 'enroll',
        title: { he: 'תזכורת: חתימה על החוזה', en: 'Reminder: signing the contract' },
        body: { he: '<p>שלום {שם},</p><p>כדי שנוכל להתחיל, נשאר רק לחתום על החוזה.</p>', en: '<p>Hi {name},</p><p>To get started, only the contract signature is left.</p>' },
      },
    ],
    seed: 'draft',
  },
  {
    key: 'enrollment.intake',
    area: 'enrollment',
    category: 'enrollment',
    timing: 'missing',
    source: 'poll',
    audience: 'client',
    name: { he: 'שאלון הפתיחה לא מולא', en: "Intake questionnaire isn't filled" },
    when: { he: 'לפני המפגש הראשון, כשהשאלון ריק.', en: 'Before the first session, when the questionnaire is empty.' },
    anchor: { he: 'לפני המפגש הראשון', en: 'before the first session' },
    stops: [{ key: 'intake_filled', he: 'השאלון מולא', en: 'The questionnaire was filled', locked: true }, STOP_MANUAL],
    placeholders: [P.name, P.child, P.when],
    actions: [A.intake],
    steps: [
      {
        offset: -3 * DAY,
        action: 'intake',
        title: { he: 'לפני המפגש הראשון: שאלון קצר', en: 'Before the first session: a short questionnaire' },
        body: { he: '<p>שלום {שם},</p><p>המפגש הראשון נקבע ל{מועד}. כדי שהמלווה יגיע מוכן, כדאי למלא את שאלון הפתיחה:</p>', en: '<p>Hi {name},</p><p>The first session is on {when}. So the coach comes prepared, please fill in the intake questionnaire:</p>' },
      },
    ],
    seed: 'off',
  },
  {
    key: 'enrollment.completed',
    area: 'enrollment',
    category: 'enrollment',
    timing: 'on',
    source: 'poll',
    audience: 'client',
    name: { he: 'ההרשמה הושלמה', en: 'Enrollment finished' },
    when: { he: 'ברוכים הבאים, מיד בסוף ההרשמה.', en: 'A welcome, right after enrolling.' },
    anchor: { he: 'מהרגע שההרשמה הושלמה', en: 'from the enrollment' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.product],
    actions: [A.portal],
    steps: [
      {
        offset: 0,
        action: 'portal',
        title: { he: 'ברוכים הבאים ל{מוצר}', en: 'Welcome to {product}' },
        body: { he: '<p>שלום {שם},</p><p>ההרשמה ל{מוצר} הושלמה. כל מה שצריך מחכה באזור האישי.</p>', en: '<p>Hi {name},</p><p>Your enrollment in {product} is complete. Everything you need is in your account.</p>' },
      },
    ],
    seed: 'draft',
  },

  // ======================= Assignments and achievements =======================
  {
    key: 'assignment.due',
    area: 'assignments',
    category: 'assignment',
    timing: 'before',
    source: 'poll',
    audience: 'client',
    name: { he: 'מועד הגשה מתקרב', en: 'Due date coming up' },
    when: { he: 'לפני מועד ההגשה, אם עוד לא הוגש.', en: "Before the due date, if it isn't handed in yet." },
    anchor: { he: 'לפני מועד ההגשה', en: 'before the due date' },
    timeSensitive: true,
    stops: [{ key: 'submitted', he: 'המטלה הוגשה', en: 'The assignment was handed in', locked: true }, STOP_MANUAL],
    placeholders: [P.name, P.assignment, P.course, P.date, P.time],
    actions: [A.assignment],
    steps: [
      {
        offset: -DAY,
        action: 'assignment',
        title: { he: 'מחר מגישים: {מטלה}', en: 'Due tomorrow: {assignment}' },
        body: { he: '<p>שלום {שם},</p><p>תזכורת: את המטלה {מטלה} מגישים עד מחר ב-{שעה}.</p>', en: '<p>Hi {name},</p><p>A reminder: {assignment} is due tomorrow at {time}.</p>' },
      },
    ],
    seed: 'off',
  },
  {
    key: 'assignment.feedback',
    area: 'assignments',
    category: 'assignment',
    timing: 'on',
    source: 'poll',
    audience: 'client',
    name: { he: 'יש משוב על מטלה', en: 'Feedback on an assignment' },
    when: { he: 'כשהמנחה מפרסם ציון או משוב.', en: 'When the instructor publishes a grade or feedback.' },
    anchor: { he: 'מהרגע שהמשוב פורסם', en: 'from the feedback' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.assignment, P.course],
    actions: [A.assignment],
    steps: [
      {
        offset: 0,
        action: 'assignment',
        title: { he: 'יש משוב על {מטלה}', en: 'There is feedback on {assignment}' },
        body: { he: '<p>שלום {שם},</p><p>המנחה פרסם משוב על {מטלה}.</p>', en: '<p>Hi {name},</p><p>Your instructor published feedback on {assignment}.</p>' },
      },
    ],
    seed: 'off',
  },
  {
    key: 'certificate.ready',
    area: 'assignments',
    category: 'achievement',
    timing: 'on',
    source: 'poll',
    audience: 'client',
    name: { he: 'התעודה מוכנה', en: 'Certificate ready' },
    when: { he: 'כשמסיימים קורס ומונפקת תעודה.', en: 'When a course is finished and a certificate is issued.' },
    anchor: { he: 'מהרגע שהתעודה הונפקה', en: 'from when it was issued' },
    stops: [STOP_MANUAL],
    placeholders: [P.name, P.course],
    actions: [A.certificate],
    steps: [
      {
        offset: 0,
        action: 'certificate',
        title: { he: 'כל הכבוד! התעודה מוכנה', en: 'Well done! Your certificate is ready' },
        body: { he: '<p>שלום {שם},</p><p>סיימת את {קורס}, והתעודה מחכה לך באזור האישי.</p>', en: '<p>Hi {name},</p><p>You finished {course}, and your certificate is waiting in your account.</p>' },
      },
    ],
    seed: 'off',
  },

  // ======================= Team alerts =======================
  {
    key: 'team.payment',
    area: 'team',
    category: 'system',
    timing: 'on',
    source: 'external',
    audience: 'team',
    name: { he: 'החזר כספי או מחלוקת על חיוב', en: 'Refund or charge dispute' },
    when: { he: 'כשיש החזר, או כשלקוח פותח מחלוקת מול הבנק.', en: 'When there is a refund, or a client disputes a charge with the bank.' },
    anchor: { he: 'מיד', en: 'right away' },
    stops: [],
    placeholders: [P.client, P.amount, P.product],
    actions: [A.admin],
    steps: [
      {
        offset: 0,
        action: 'admin',
        title: { he: 'מחלוקת על חיוב: {לקוח}', en: 'Charge dispute: {client}' },
        body: { he: '<p>נפתחה מחלוקת על חיוב של {סכום} של {לקוח}. יש כמה ימים להגיב.</p>', en: '<p>{client} disputed a charge of {amount}. There are a few days to respond.</p>' },
      },
    ],
    seed: 'active',
    locked: true,
  },
  {
    key: 'team.contract',
    area: 'team',
    category: 'system',
    timing: 'on',
    source: 'external',
    audience: 'team',
    name: { he: 'חוזה נחתם או נדחה', en: 'Contract signed or declined' },
    when: { he: 'כשלקוח חותם על החוזה או דוחה אותו.', en: 'When a client signs or declines the contract.' },
    anchor: { he: 'מיד', en: 'right away' },
    stops: [],
    placeholders: [P.client, P.product],
    actions: [A.admin],
    steps: [
      {
        offset: 0,
        action: 'admin',
        title: { he: 'החוזה של {לקוח} נחתם', en: "{client}'s contract was signed" },
        body: { he: '<p>ההרשמה: {מוצר}. אפשר להמשיך בהרשמה.</p>', en: '<p>Enrollment: {product}. The enrollment can go ahead.</p>' },
      },
    ],
    seed: 'active',
    locked: true,
  },

  // ======================= System =======================
  {
    key: 'system.invitation',
    area: 'system',
    category: 'system',
    timing: 'on',
    source: 'external',
    audience: 'client',
    name: { he: 'הזמנה לפורטל', en: 'Portal invitation' },
    when: { he: 'כשמוסיפים לקוח או משתמש חדש.', en: 'When a client or user is added.' },
    anchor: { he: 'מיד', en: 'right away' },
    stops: [],
    placeholders: [P.name],
    actions: [],
    steps: [],
    seed: 'active',
    locked: true,
  },
  {
    key: 'system.enrollment_link',
    area: 'system',
    category: 'system',
    timing: 'on',
    source: 'external',
    audience: 'client',
    name: { he: 'קישור הרשמה', en: 'Enrollment link' },
    when: { he: 'כשהצוות שולח או שולח שוב קישור הרשמה.', en: 'When the team sends or resends an enrollment link.' },
    anchor: { he: 'מיד', en: 'right away' },
    stops: [],
    placeholders: [P.name, P.product],
    actions: [],
    steps: [],
    seed: 'active',
    locked: true,
  },
  {
    key: 'system.password_reset',
    area: 'system',
    category: 'system',
    timing: 'on',
    source: 'external',
    audience: 'client',
    name: { he: 'איפוס סיסמה', en: 'Password reset' },
    when: { he: 'כשהלקוח או הצוות מבקשים איפוס.', en: 'When the client or the team asks for a reset.' },
    anchor: { he: 'מיד', en: 'right away' },
    stops: [],
    placeholders: [P.name],
    actions: [],
    steps: [],
    seed: 'active',
    locked: true,
  },
];

export const CATALOG_BY_KEY: Record<string, CatalogEvent> = Object.fromEntries(CATALOG.map((e) => [e.key, e]));

export const AREA_ORDER: Area[] = ['meetings', 'coaching', 'payments', 'enrollment', 'assignments', 'team', 'system'];

export const AREA_LABEL: Record<Area, Bi> = {
  meetings: { he: 'מפגשים והקלטות', en: 'Meetings and recordings' },
  coaching: { he: 'ליווי הורים וילדים', en: 'Parent and child coaching' },
  payments: { he: 'תשלומים ומנויים', en: 'Payments and memberships' },
  enrollment: { he: 'הרשמה', en: 'Enrollment' },
  assignments: { he: 'מטלות והישגים', en: 'Assignments and achievements' },
  team: { he: 'התראות לניהול', en: 'Team alerts' },
  system: { he: 'הודעות מערכת', en: 'System messages' },
};

/** Short pill labels for the area filter. */
export const AREA_PILL: Record<Area, Bi> = {
  meetings: { he: 'מפגשים', en: 'Meetings' },
  coaching: { he: 'ליווי', en: 'Coaching' },
  payments: { he: 'תשלומים', en: 'Payments' },
  enrollment: { he: 'הרשמה', en: 'Enrollment' },
  assignments: { he: 'מטלות', en: 'Assignments' },
  team: { he: 'לניהול', en: 'Team' },
  system: { he: 'מערכת', en: 'System' },
};

export const TIMING_LABEL: Record<Timing, Bi> = {
  before: { he: 'לפני שקורה', en: 'Before it happens' },
  on: { he: 'כשקורה', en: 'When it happens' },
  missing: { he: 'כשלא קורה', en: "When it doesn't happen" },
};

/** Fills {placeholders} in either language's form: {שם} or {name}. */
export function fillPlaceholders(text: string, event: CatalogEvent | undefined, values: Record<string, string | null | undefined>): string {
  if (!text) return '';
  const list = event?.placeholders ?? [];
  return text.replace(/\{([^{}]{1,40})\}/g, (whole, label: string) => {
    const t = label.trim();
    const p = list.find((x) => x.he === t || x.en === t || x.key === t);
    if (!p) return whole;
    const v = values[p.key];
    return v == null ? '' : String(v);
  });
}

/** Sample values for test sends and previews. */
export function sampleValues(event: CatalogEvent | undefined, lang: 'he' | 'en'): Record<string, string> {
  return Object.fromEntries((event?.placeholders ?? []).map((p) => [p.key, p.sample[lang]]));
}

/** "מיד", "אחרי 3 ימים", "24 שעות לפני". */
export function offsetLabel(offset: number, lang: 'he' | 'en'): string {
  const he = lang === 'he';
  if (offset === 0) return he ? 'מיד' : 'Right away';
  const abs = Math.abs(offset);
  let amount: string;
  if (abs % DAY === 0) {
    const d = abs / DAY;
    amount = he ? (d === 1 ? 'יום' : d === 2 ? 'יומיים' : `${d} ימים`) : d === 1 ? '1 day' : `${d} days`;
  } else if (abs % HOUR === 0) {
    const h = abs / HOUR;
    amount = he ? (h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`) : h === 1 ? '1 hour' : `${h} hours`;
  } else {
    amount = he ? `${abs} דקות` : `${abs} minutes`;
  }
  if (offset < 0) return he ? `${amount} לפני` : `${amount} before`;
  return he ? `אחרי ${amount}` : `After ${amount}`;
}

export const OFFSET_UNITS = { MIN, HOUR, DAY };
