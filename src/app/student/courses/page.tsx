import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen, Clock, Video } from 'lucide-react';
import Link from 'next/link';

const mockData = {
  user: {
    name: 'Sarah Johnson',
    role: 'student' as const,
  },
  courses: [
    {
      id: '1',
      title: 'Parenting Fundamentals',
      description: 'Essential parenting skills for modern families. Learn evidence-based strategies for raising confident, resilient children.',
      instructor: 'Dr. Emily Chen',
      progress: 45,
      totalLessons: 12,
      completedLessons: 5,
      totalDuration: 720,
      startDate: '2024-01-01',
      status: 'active' as const,
    },
    {
      id: '2',
      title: 'Positive Discipline Techniques',
      description: 'Learn effective discipline without punishment. Build cooperation and teach life skills.',
      instructor: 'Michael Roberts',
      progress: 20,
      totalLessons: 8,
      completedLessons: 2,
      totalDuration: 480,
      startDate: '2024-01-08',
      status: 'active' as const,
    },
    {
      id: '3',
      title: 'Emotional Intelligence for Kids',
      description: 'Help your children develop emotional awareness and regulation skills.',
      instructor: 'Dr. Sarah Martinez',
      progress: 0,
      totalLessons: 10,
      completedLessons: 0,
      totalDuration: 600,
      startDate: '2024-02-01',
      status: 'upcoming' as const,
    },
    {
      id: '4',
      title: 'Communication & Connection',
      description: 'Strengthen your relationship with your child through effective communication.',
      instructor: 'Dr. Emily Chen',
      progress: 100,
      totalLessons: 6,
      completedLessons: 6,
      totalDuration: 360,
      startDate: '2023-12-01',
      status: 'completed' as const,
    },
  ],
};

export default function StudentCoursesPage() {
  const activeCourses = mockData.courses.filter(c => c.status === 'active');
  const upcomingCourses = mockData.courses.filter(c => c.status === 'upcoming');
  const completedCourses = mockData.courses.filter(c => c.status === 'completed');

  return (
    <DashboardLayout
      userRole={mockData.user.role}
      userName={mockData.user.name}
    >
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">My Courses</h1>
          <p className="text-muted-foreground">
            Manage and track your enrolled courses
          </p>
        </div>

        {/* Active Courses */}
        {activeCourses.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Active Courses</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          by {course.instructor}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        In Progress
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center">
                        <Video className="h-4 w-4 mr-1" />
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.floor(course.totalDuration / 60)} hours
                      </span>
                    </div>

                    <Link
                      href={`/student/courses/${course.id}`}
                      className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
                    >
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Courses */}
        {upcomingCourses.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Upcoming Courses</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-card border rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          by {course.instructor}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Upcoming
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center">
                        <Video className="h-4 w-4 mr-1" />
                        {course.totalLessons} lessons
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.floor(course.totalDuration / 60)} hours
                      </span>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-sm mb-4">
                      <p className="text-muted-foreground">
                        Starts on{' '}
                        <span className="font-medium text-foreground">
                          {new Date(course.startDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </p>
                    </div>

                    <Link
                      href={`/student/courses/${course.id}`}
                      className="block w-full text-center px-4 py-2 border rounded-md hover:bg-muted font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {completedCourses.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Completed Courses</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-card border rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          by {course.instructor}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center">
                        <Video className="h-4 w-4 mr-1" />
                        {course.totalLessons} lessons
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.floor(course.totalDuration / 60)} hours
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/student/courses/${course.id}`}
                        className="flex-1 text-center px-4 py-2 border rounded-md hover:bg-muted font-medium"
                      >
                        Review
                      </Link>
                      <Link
                        href={`/student/certificates/${course.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
                      >
                        Certificate
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
