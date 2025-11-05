import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Video, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

const mockData = {
  user: {
    name: 'Dr. Emily Chen',
    role: 'instructor' as const,
  },
  stats: {
    totalCourses: 3,
    activeStudents: 48,
    upcomingLessons: 5,
    totalHoursTaught: 124,
  },
  upcomingLessons: [
    {
      id: '1',
      title: 'Understanding Child Development',
      courseName: 'Parenting Fundamentals',
      startTime: '2024-01-15T10:00:00',
      duration: 60,
      enrolledStudents: 24,
    },
    {
      id: '2',
      title: 'Effective Communication Strategies',
      courseName: 'Parenting Fundamentals',
      startTime: '2024-01-15T14:00:00',
      duration: 90,
      enrolledStudents: 24,
    },
    {
      id: '3',
      title: 'Setting Healthy Boundaries',
      courseName: 'Positive Discipline Techniques',
      startTime: '2024-01-16T10:00:00',
      duration: 60,
      enrolledStudents: 18,
    },
  ],
  courses: [
    {
      id: '1',
      title: 'Parenting Fundamentals',
      enrolledStudents: 24,
      completionRate: 68,
      nextLesson: 'Understanding Child Development',
      nextLessonDate: '2024-01-15T10:00:00',
    },
    {
      id: '2',
      title: 'Positive Discipline Techniques',
      enrolledStudents: 18,
      completionRate: 52,
      nextLesson: 'Setting Healthy Boundaries',
      nextLessonDate: '2024-01-16T10:00:00',
    },
    {
      id: '3',
      title: 'Communication & Connection',
      enrolledStudents: 6,
      completionRate: 100,
      nextLesson: 'Course completed',
      nextLessonDate: null,
    },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'enrollment',
      message: '3 new students enrolled in Parenting Fundamentals',
      time: '2 hours ago',
    },
    {
      id: '2',
      type: 'question',
      message: 'Sarah J. asked a question in Positive Discipline',
      time: '5 hours ago',
    },
    {
      id: '3',
      type: 'completion',
      message: '5 students completed lesson 4 in Communication & Connection',
      time: '1 day ago',
    },
  ],
};

export default function InstructorDashboardPage() {
  return (
    <DashboardLayout
      userRole={mockData.user.role}
      userName={mockData.user.name}
    >
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {mockData.user.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your teaching activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active Courses
              </p>
              <Video className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.stats.totalCourses}</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active Students
              </p>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.stats.activeStudents}</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Upcoming Lessons
              </p>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.stats.upcomingLessons}</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Hours Taught
              </p>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.stats.totalHoursTaught}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Lessons */}
          <div className="lg:col-span-2 bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Upcoming Lessons</h2>
              <Link
                href="/instructor/schedule"
                className="text-sm text-primary hover:underline"
              >
                View schedule
              </Link>
            </div>
            <div className="space-y-4">
              {mockData.upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {lesson.courseName}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(lesson.startTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(lesson.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        {lesson.enrolledStudents}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/instructor/lessons/${lesson.id}`}
                    className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium whitespace-nowrap"
                  >
                    Start Lesson
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {mockData.recentActivity.map((activity) => (
                <div key={activity.id} className="pb-4 border-b last:border-b-0">
                  <p className="text-sm mb-1">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">My Courses</h2>
            <Link
              href="/instructor/courses"
              className="text-sm text-primary hover:underline"
            >
              View all courses
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockData.courses.map((course) => (
              <div key={course.id} className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{course.title}</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Enrolled Students
                    </span>
                    <span className="font-semibold">{course.enrolledStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Completion Rate
                    </span>
                    <span className="font-semibold">{course.completionRate}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-1">Next lesson:</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {course.nextLesson}
                    {course.nextLessonDate && (
                      <span className="block text-xs mt-1">
                        {new Date(course.nextLessonDate).toLocaleString()}
                      </span>
                    )}
                  </p>
                  <Link
                    href={`/instructor/courses/${course.id}`}
                    className="block w-full text-center px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium"
                  >
                    Manage Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
