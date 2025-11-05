import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Video, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

const mockData = {
  user: {
    name: 'Dr. Emily Chen',
    role: 'instructor' as const,
  },
  courses: [
    {
      id: '1',
      title: 'Parenting Fundamentals',
      description: 'Essential parenting skills for modern families',
      enrolledStudents: 24,
      totalLessons: 12,
      completedLessons: 5,
      startDate: '2024-01-01',
      endDate: '2024-03-01',
      status: 'active' as const,
      nextLesson: {
        title: 'Understanding Child Development',
        date: '2024-01-15T10:00:00',
      },
    },
    {
      id: '2',
      title: 'Positive Discipline Techniques',
      description: 'Learn effective discipline without punishment',
      enrolledStudents: 18,
      totalLessons: 8,
      completedLessons: 2,
      startDate: '2024-01-08',
      endDate: '2024-02-28',
      status: 'active' as const,
      nextLesson: {
        title: 'Setting Healthy Boundaries',
        date: '2024-01-16T10:00:00',
      },
    },
    {
      id: '3',
      title: 'Communication & Connection',
      description: 'Strengthen your relationship with your child',
      enrolledStudents: 6,
      totalLessons: 6,
      completedLessons: 6,
      startDate: '2023-12-01',
      endDate: '2024-01-10',
      status: 'completed' as const,
      nextLesson: null,
    },
  ],
};

export default function InstructorCoursesPage() {
  const activeCourses = mockData.courses.filter((c) => c.status === 'active');
  const completedCourses = mockData.courses.filter((c) => c.status === 'completed');

  return (
    <DashboardLayout
      userRole={mockData.user.role}
      userName={mockData.user.name}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Courses</h1>
            <p className="text-muted-foreground">
              Manage your courses and track student progress
            </p>
          </div>
          <Link
            href="/instructor/courses/new"
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Course
          </Link>
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
                          {new Date(course.startDate).toLocaleDateString()} -{' '}
                          {new Date(course.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xl font-bold">{course.enrolledStudents}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Video className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xl font-bold">{course.totalLessons}</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xl font-bold">{course.completedLessons}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>

                    {course.nextLesson && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium mb-1">Next Lesson:</p>
                        <p className="text-sm text-muted-foreground">
                          {course.nextLesson.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(course.nextLesson.date).toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
                      >
                        Manage
                      </Link>
                      <Link
                        href={`/instructor/courses/${course.id}/students`}
                        className="flex-1 text-center px-4 py-2 border rounded-md hover:bg-muted font-medium"
                      >
                        Students
                      </Link>
                    </div>
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
                          {new Date(course.startDate).toLocaleDateString()} -{' '}
                          {new Date(course.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xl font-bold">{course.enrolledStudents}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Video className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xl font-bold">{course.totalLessons}</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xl font-bold">{course.completedLessons}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="flex-1 text-center px-4 py-2 border rounded-md hover:bg-muted font-medium"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/instructor/courses/${course.id}/analytics`}
                        className="flex-1 text-center px-4 py-2 border rounded-md hover:bg-muted font-medium"
                      >
                        Analytics
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
