import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen, Calendar, Clock, Video } from 'lucide-react';
import Link from 'next/link';

// This would normally come from the database
const mockData = {
  user: {
    name: 'Sarah Johnson',
    role: 'student' as const,
  },
  upcomingLessons: [
    {
      id: '1',
      title: 'Understanding Child Development',
      courseName: 'Parenting Fundamentals',
      startTime: '2024-01-15T10:00:00',
      duration: 60,
      instructor: 'Dr. Emily Chen',
    },
    {
      id: '2',
      title: 'Effective Communication Strategies',
      courseName: 'Parenting Fundamentals',
      startTime: '2024-01-18T14:00:00',
      duration: 90,
      instructor: 'Dr. Emily Chen',
    },
  ],
  enrolledCourses: [
    {
      id: '1',
      title: 'Parenting Fundamentals',
      description: 'Essential parenting skills for modern families',
      progress: 45,
      totalLessons: 12,
      completedLessons: 5,
      nextLesson: 'Understanding Child Development',
      nextLessonDate: '2024-01-15T10:00:00',
    },
    {
      id: '2',
      title: 'Positive Discipline Techniques',
      description: 'Learn effective discipline without punishment',
      progress: 20,
      totalLessons: 8,
      completedLessons: 2,
      nextLesson: 'Setting Boundaries',
      nextLessonDate: '2024-01-20T15:00:00',
    },
  ],
  recentRecordings: [
    {
      id: '1',
      title: 'Building Strong Parent-Child Relationships',
      courseName: 'Parenting Fundamentals',
      recordedAt: '2024-01-10T10:00:00',
      duration: 85,
    },
  ],
};

export default function StudentDashboardPage() {
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
            Here's what's happening with your courses
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active Courses
              </p>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.enrolledCourses.length}</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Upcoming Lessons
              </p>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.upcomingLessons.length}</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Lessons
              </p>
              <Video className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">
              {mockData.enrolledCourses.reduce(
                (acc, course) => acc + course.completedLessons,
                0
              )}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Hours Learned
              </p>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">24</p>
          </div>
        </div>

        {/* Upcoming Lessons */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Upcoming Lessons</h2>
            <Link
              href="/student/schedule"
              className="text-sm text-primary hover:underline"
            >
              View all
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
                    <span className="text-muted-foreground">
                      {lesson.duration} min
                    </span>
                  </div>
                </div>
                <Link
                  href={`/student/lessons/${lesson.id}`}
                  className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* My Courses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">My Courses</h2>
            <Link
              href="/student/courses"
              className="text-sm text-primary hover:underline"
            >
              View all courses
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockData.enrolledCourses.map((course) => (
              <div key={course.id} className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {course.description}
                </p>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {course.completedLessons} of {course.totalLessons} lessons
                    completed
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-1">Next lesson:</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {course.nextLesson}
                  </p>
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
                  >
                    Continue Learning
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Recordings */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Recordings</h2>
            <Link
              href="/student/recordings"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {mockData.recentRecordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{recording.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {recording.courseName} •{' '}
                      {new Date(recording.recordedAt).toLocaleDateString()} •{' '}
                      {recording.duration} min
                    </p>
                  </div>
                </div>
                <Link
                  href={`/student/recordings/${recording.id}`}
                  className="px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium"
                >
                  Watch
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
