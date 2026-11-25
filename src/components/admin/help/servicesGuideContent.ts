// Generated content for the "Which service should I create?" guide.
// Each text has its translation key and the English fallback; the Hebrew is
// in supabase/migrations/20261124_services_guide_translations.sql.

export type GuideText = { key: string; en: string };
export type GuideStep = { title: GuideText; where: GuideText; choose: GuideText };
export type GuideService = {
  id: string;
  href: string;
  cover: string;
  progress: number | null;
  name: GuideText;
  tagline: GuideText;
  when: GuideText;
  tip: GuideText;
  kicker: GuideText;
  cardTitle: GuideText;
  cardLine: GuideText;
  sees: GuideText;
  pay: GuideText;
  cta: GuideText;
  first: GuideText;
  badge: GuideText | null;
  steps: GuideStep[];
};

export const GUIDE_SERVICES: GuideService[] = [
  {
    "id": "program",
    "href": "/admin/lms/courses/new",
    "cover": "#5b3a8e",
    "progress": 34,
    "name": {
      "key": "admin.servicesGuide.program.name",
      "en": "Study program"
    },
    "tagline": {
      "key": "admin.servicesGuide.program.tagline",
      "en": "A full track of several courses, with progress"
    },
    "when": {
      "key": "admin.servicesGuide.program.when",
      "en": " there is a long training track with several courses, some required, like the Adler parent-guide program."
    },
    "tip": {
      "key": "admin.servicesGuide.program.tip",
      "en": "The client enrolls in the whole program, not in each course, so you don't create a separate product for each course in it."
    },
    "kicker": {
      "key": "admin.servicesGuide.program.kicker",
      "en": "Program"
    },
    "cardTitle": {
      "key": "admin.servicesGuide.program.cardTitle",
      "en": "Parent guide training program"
    },
    "cardLine": {
      "key": "admin.servicesGuide.program.cardLine",
      "en": "2 of 6 required courses · now: Family development"
    },
    "sees": {
      "key": "admin.servicesGuide.program.sees",
      "en": "A program card with progress. All the program's courses open inside the program page."
    },
    "pay": {
      "key": "admin.servicesGuide.program.pay",
      "en": "By the payment plan: a deposit at enrollment, and the rest is charged automatically from the saved card."
    },
    "cta": {
      "key": "admin.servicesGuide.program.cta",
      "en": "Open a new course"
    },
    "first": {
      "key": "admin.servicesGuide.program.first",
      "en": "the program's courses"
    },
    "badge": null,
    "steps": [
      {
        "title": {
          "key": "admin.servicesGuide.program.step1.title",
          "en": "Create each course in the program"
        },
        "where": {
          "key": "admin.servicesGuide.program.step1.where",
          "en": "Courses → New course"
        },
        "choose": {
          "key": "admin.servicesGuide.program.step1.choose",
          "en": "Type: Course. Add lessons, meetings, recordings and materials to each course."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.program.step2.title",
          "en": "Create the program"
        },
        "where": {
          "key": "admin.servicesGuide.program.step2.where",
          "en": "Programs → New program"
        },
        "choose": {
          "key": "admin.servicesGuide.program.step2.choose",
          "en": "Add the courses, set their order, and mark which are required and which are optional."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.program.step3.title",
          "en": "Create a product to sell"
        },
        "where": {
          "key": "admin.servicesGuide.program.step3.where",
          "en": "Products → New product"
        },
        "choose": {
          "key": "admin.servicesGuide.program.step3.choose",
          "en": "Type: Program, and choose the program. Payment: deposit and installments (for example \"deposit + 5 payments\"). A signed agreement, if needed. Product picture."
        }
      }
    ]
  },
  {
    "id": "course",
    "href": "/admin/lms/courses/new",
    "cover": "#2f6f8f",
    "progress": 38,
    "name": {
      "key": "admin.servicesGuide.course.name",
      "en": "Standalone course"
    },
    "tagline": {
      "key": "admin.servicesGuide.course.tagline",
      "en": "One course with lessons, sold on its own"
    },
    "when": {
      "key": "admin.servicesGuide.course.when",
      "en": " a course is sold by itself, not as part of a track."
    },
    "tip": {
      "key": "admin.servicesGuide.course.tip",
      "en": ""
    },
    "kicker": {
      "key": "admin.servicesGuide.course.kicker",
      "en": "Course"
    },
    "cardTitle": {
      "key": "admin.servicesGuide.course.cardTitle",
      "en": "Attention and focus course"
    },
    "cardLine": {
      "key": "admin.servicesGuide.course.cardLine",
      "en": "3 of 8 lessons"
    },
    "sees": {
      "key": "admin.servicesGuide.course.sees",
      "en": "A course card with progress. Inside: the lessons, the next meeting, recordings and materials."
    },
    "pay": {
      "key": "admin.servicesGuide.course.pay",
      "en": "One payment, installments charged automatically from the saved card, or free."
    },
    "cta": {
      "key": "admin.servicesGuide.course.cta",
      "en": "Open a new course"
    },
    "first": {
      "key": "admin.servicesGuide.course.first",
      "en": "the course"
    },
    "badge": null,
    "steps": [
      {
        "title": {
          "key": "admin.servicesGuide.course.step1.title",
          "en": "Create the course"
        },
        "where": {
          "key": "admin.servicesGuide.course.step1.where",
          "en": "Courses → New course"
        },
        "choose": {
          "key": "admin.servicesGuide.course.step1.choose",
          "en": "Type: Course. Add lessons, meetings, recordings and materials."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.course.step2.title",
          "en": "Create a product to sell"
        },
        "where": {
          "key": "admin.servicesGuide.course.step2.where",
          "en": "Products → New product"
        },
        "choose": {
          "key": "admin.servicesGuide.course.step2.choose",
          "en": "Type: Course, and choose the course. Payment: one-time, installments or free. Product picture."
        }
      }
    ]
  },
  {
    "id": "lecture",
    "href": "/admin/lms/courses/new",
    "cover": "#b0563b",
    "progress": null,
    "name": {
      "key": "admin.servicesGuide.lecture.name",
      "en": "Lecture"
    },
    "tagline": {
      "key": "admin.servicesGuide.lecture.tagline",
      "en": "One live meeting, then a recording"
    },
    "when": {
      "key": "admin.servicesGuide.lecture.when",
      "en": " there is a one-time Zoom lecture, with a recording for those who enrolled."
    },
    "tip": {
      "key": "admin.servicesGuide.lecture.tip",
      "en": "The only difference from a course is the type \"Lecture\": that way the client sees a lecture card, without lessons and progress."
    },
    "kicker": {
      "key": "admin.servicesGuide.lecture.kicker",
      "en": "Lecture"
    },
    "cardTitle": {
      "key": "admin.servicesGuide.lecture.cardTitle",
      "en": "Lecture for children"
    },
    "cardLine": {
      "key": "admin.servicesGuide.lecture.cardLine",
      "en": "Live lecture · Tue 20:00"
    },
    "sees": {
      "key": "admin.servicesGuide.lecture.sees",
      "en": "Before the lecture: the date and the Zoom link. Afterwards the card becomes \"Recorded lecture\" with the recording."
    },
    "pay": {
      "key": "admin.servicesGuide.lecture.pay",
      "en": "One payment at enrollment, or free."
    },
    "cta": {
      "key": "admin.servicesGuide.lecture.cta",
      "en": "Open a new course"
    },
    "first": {
      "key": "admin.servicesGuide.lecture.first",
      "en": "the lecture (a course of type Lecture)"
    },
    "badge": null,
    "steps": [
      {
        "title": {
          "key": "admin.servicesGuide.lecture.step1.title",
          "en": "Create the lecture"
        },
        "where": {
          "key": "admin.servicesGuide.lecture.step1.where",
          "en": "Courses → New course"
        },
        "choose": {
          "key": "admin.servicesGuide.lecture.step1.choose",
          "en": "Type: Lecture. Add the meeting: date, time and link. After the lecture, add the recording."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.lecture.step2.title",
          "en": "Create a product to sell"
        },
        "where": {
          "key": "admin.servicesGuide.lecture.step2.where",
          "en": "Products → New product"
        },
        "choose": {
          "key": "admin.servicesGuide.lecture.step2.choose",
          "en": "Choose the lecture. Payment: one-time or free. Product picture."
        }
      }
    ]
  },
  {
    "id": "club",
    "href": "/admin/lms/courses/new",
    "cover": "#3f7d58",
    "progress": null,
    "name": {
      "key": "admin.servicesGuide.club.name",
      "en": "Club"
    },
    "tagline": {
      "key": "admin.servicesGuide.club.tagline",
      "en": "A monthly membership with regular meetings"
    },
    "when": {
      "key": "admin.servicesGuide.club.when",
      "en": " there is an ongoing community: regular meetings and recordings, paid monthly."
    },
    "tip": {
      "key": "admin.servicesGuide.club.tip",
      "en": "Don't choose the type \"Program\" for a club. After joining it would show as a program, without the club card and membership controls."
    },
    "kicker": {
      "key": "admin.servicesGuide.club.kicker",
      "en": "Club"
    },
    "cardTitle": {
      "key": "admin.servicesGuide.club.cardTitle",
      "en": "Attention experts club"
    },
    "cardLine": {
      "key": "admin.servicesGuide.club.cardLine",
      "en": "Next meeting · Sun 20:30"
    },
    "sees": {
      "key": "admin.servicesGuide.club.sees",
      "en": "Members see the club card with their membership status. Clients who aren't members yet see it as an offer to join."
    },
    "pay": {
      "key": "admin.servicesGuide.club.pay",
      "en": "The card is saved when joining, and the charge repeats every month automatically. The client can stop the membership from the portal."
    },
    "cta": {
      "key": "admin.servicesGuide.club.cta",
      "en": "Open a new course"
    },
    "first": {
      "key": "admin.servicesGuide.club.first",
      "en": "the club course"
    },
    "badge": {
      "key": "admin.servicesGuide.club.badge",
      "en": "Active"
    },
    "steps": [
      {
        "title": {
          "key": "admin.servicesGuide.club.step1.title",
          "en": "Create the club course"
        },
        "where": {
          "key": "admin.servicesGuide.club.step1.where",
          "en": "Courses → New course"
        },
        "choose": {
          "key": "admin.servicesGuide.club.step1.choose",
          "en": "Type: Course. Add the club meetings, and later the recordings."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.club.step2.title",
          "en": "Create a product to sell"
        },
        "where": {
          "key": "admin.servicesGuide.club.step2.where",
          "en": "Products → New product"
        },
        "choose": {
          "key": "admin.servicesGuide.club.step2.choose",
          "en": "Type: Club, and choose the club course. The monthly membership payment is set for you; add the monthly price and a product picture."
        }
      }
    ]
  },
  {
    "id": "bundle",
    "href": "/admin/lms/courses/new",
    "cover": "#7a5bab",
    "progress": 4,
    "name": {
      "key": "admin.servicesGuide.bundle.name",
      "en": "Course bundle"
    },
    "tagline": {
      "key": "admin.servicesGuide.bundle.tagline",
      "en": "Several courses for one price"
    },
    "when": {
      "key": "admin.servicesGuide.bundle.when",
      "en": " you want to sell several courses together, without a track or required courses."
    },
    "tip": {
      "key": "admin.servicesGuide.bundle.tip",
      "en": "Need an order, track progress or required courses? That's a program, not a bundle."
    },
    "kicker": {
      "key": "admin.servicesGuide.bundle.kicker",
      "en": "Course"
    },
    "cardTitle": {
      "key": "admin.servicesGuide.bundle.cardTitle",
      "en": "Family development through life"
    },
    "cardLine": {
      "key": "admin.servicesGuide.bundle.cardLine",
      "en": "0 of 6 lessons"
    },
    "sees": {
      "key": "admin.servicesGuide.bundle.sees",
      "en": "Each course in the bundle shows for the client as its own course card, with its own name."
    },
    "pay": {
      "key": "admin.servicesGuide.bundle.pay",
      "en": "One payment or installments, for the whole bundle together."
    },
    "cta": {
      "key": "admin.servicesGuide.bundle.cta",
      "en": "Open a new course"
    },
    "first": {
      "key": "admin.servicesGuide.bundle.first",
      "en": "the bundle's courses"
    },
    "badge": null,
    "steps": [
      {
        "title": {
          "key": "admin.servicesGuide.bundle.step1.title",
          "en": "Create each course"
        },
        "where": {
          "key": "admin.servicesGuide.bundle.step1.where",
          "en": "Courses → New course"
        },
        "choose": {
          "key": "admin.servicesGuide.bundle.step1.choose",
          "en": "Type: Course, for each course in the bundle."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.bundle.step2.title",
          "en": "Create a product to sell"
        },
        "where": {
          "key": "admin.servicesGuide.bundle.step2.where",
          "en": "Products → New product"
        },
        "choose": {
          "key": "admin.servicesGuide.bundle.step2.choose",
          "en": "Type: Bundle, and choose the courses. One price for the whole bundle. Product picture."
        }
      }
    ]
  },
  {
    "id": "coaching",
    "href": "/admin/coaching/coaches",
    "cover": "#8a5a12",
    "progress": null,
    "name": {
      "key": "admin.servicesGuide.coaching.name",
      "en": "Personal guidance"
    },
    "tagline": {
      "key": "admin.servicesGuide.coaching.tagline",
      "en": "One-on-one sessions, paid per session"
    },
    "when": {
      "key": "admin.servicesGuide.coaching.when",
      "en": " a parent needs parent guidance, or a child needs guidance (for example CBT), in personal sessions with a therapist."
    },
    "tip": {
      "key": "admin.servicesGuide.coaching.tip",
      "en": "Guidance doesn't need a course. A client without a portal account can also enroll through the link."
    },
    "kicker": {
      "key": "admin.servicesGuide.coaching.kicker",
      "en": "Guidance"
    },
    "cardTitle": {
      "key": "admin.servicesGuide.coaching.cardTitle",
      "en": "Parent guidance"
    },
    "cardLine": {
      "key": "admin.servicesGuide.coaching.cardLine",
      "en": "Next session · Wed 10:00"
    },
    "sees": {
      "key": "admin.servicesGuide.coaching.sees",
      "en": "The parent books sessions from the therapist's free times, and sees the sessions and payments."
    },
    "pay": {
      "key": "admin.servicesGuide.coaching.pay",
      "en": "The card is saved at enrollment, and each session is charged only after it took place. Nothing is paid upfront."
    },
    "cta": {
      "key": "admin.servicesGuide.coaching.cta",
      "en": "Go to therapists"
    },
    "first": {
      "key": "admin.servicesGuide.coaching.first",
      "en": "the therapists and their hours"
    },
    "badge": null,
    "steps": [
      {
        "title": {
          "key": "admin.servicesGuide.coaching.step1.title",
          "en": "Set up the therapists"
        },
        "where": {
          "key": "admin.servicesGuide.coaching.step1.where",
          "en": "Family guidance → Therapists and hours"
        },
        "choose": {
          "key": "admin.servicesGuide.coaching.step1.choose",
          "en": "A therapist is a user with the instructor role (added on the Users page). Here you set her working hours."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.coaching.step2.title",
          "en": "Create a guidance package"
        },
        "where": {
          "key": "admin.servicesGuide.coaching.step2.where",
          "en": "Products → New product"
        },
        "choose": {
          "key": "admin.servicesGuide.coaching.step2.choose",
          "en": "Type: Session pack. Number of sessions and session length. Payment: per session (for example \"CBT guidance\")."
        }
      },
      {
        "title": {
          "key": "admin.servicesGuide.coaching.step3.title",
          "en": "Open a package for the client"
        },
        "where": {
          "key": "admin.servicesGuide.coaching.step3.where",
          "en": "Family guidance → Open a package"
        },
        "choose": {
          "key": "admin.servicesGuide.coaching.step3.choose",
          "en": "Choose parent guidance or child guidance, the client (and the child), the package and the therapist. The client gets an enrollment link: agreement, intake questionnaire and card. You can also open a package from a request sent from the portal."
        }
      }
    ]
  }
];
