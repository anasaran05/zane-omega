import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { PrimaryButton } from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { fetchTasks, organizeTasks, Course, calculateProgress } from '@/lib/csv';
import { BookOpen, Clock, Award, Users } from 'lucide-react';

// Use environment variable or fallback to sample data
const CSV_URL = import.meta.env.VITE_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrzHdNL8FRSooYojNPyBU2f66Tgr-DgwA6xB_HAK-azRx_s8PvbKUwzO5OzjzVdPGw-qeNOl68Asx6/pub?output=csv';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const tasks = await fetchTasks(CSV_URL);
      const organizedCourses = organizeTasks(tasks);
      setCourses(organizedCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedTasks = (courseId: string): string[] => {
    // In a real app, this would come from user progress data
    // For demo, we'll simulate some completed tasks
    const completedKey = `course_${courseId}_completed_tasks`;
    const completed = localStorage.getItem(completedKey);
    return completed ? JSON.parse(completed) : [];
  };

  const getCourseStats = (course: Course) => {
    const allTasks = course.chapters.flatMap(chapter => 
      chapter.lessons.flatMap(lesson => lesson.tasks)
    );
    const completedTaskIds = getCompletedTasks(course.id);
    const progress = calculateProgress(allTasks, completedTaskIds);
    
    return {
      totalLessons: course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0),
      totalTasks: progress.totalTasks,
      completedTasks: progress.completedTasks,
      progressPercentage: progress.completionPercentage,
      totalXP: progress.totalXP,
      earnedXP: progress.earnedXP
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="theme-container py-24">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="theme-container py-24">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-destructive-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Load Courses</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <PrimaryButton onClick={loadCourses}>
                Try Again
              </PrimaryButton>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="theme-container py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
            Training Courses
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose from our comprehensive healthcare training programs
          </p>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Courses Available</h3>
              <p className="text-muted-foreground">
                Check your CSV data source or contact your administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => {
              const stats = getCourseStats(course);
              
              return (
                <Card 
                  key={course.id}
                  variant="interactive"
                  className="h-full animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {stats.earnedXP}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          / {stats.totalXP} XP
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl">
                      {course.name}
                    </CardTitle>
                    
                    <CardDescription>
                      Comprehensive training program covering essential healthcare administration skills.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Progress */}
                    <div>
                      <ProgressBar
                        value={stats.progressPercentage}
                        label="Progress"
                        size="sm"
                      />
                    </div>
                    
                    {/* Course Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-xs">Lessons</span>
                        </div>
                        <div className="font-semibold text-foreground">
                          {stats.totalLessons}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">Tasks</span>
                        </div>
                        <div className="font-semibold text-foreground">
                          {stats.completedTasks}/{stats.totalTasks}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-4">
                      <Link to={`/courses/${course.id}`} className="block">
                        <PrimaryButton className="w-full">
                          {stats.completedTasks > 0 ? 'Continue Course' : 'Start Course'}
                        </PrimaryButton>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-foreground">Expert Instructors</div>
                  <div className="text-sm text-muted-foreground">Industry professionals</div>
                </div>
                <div>
                  <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-foreground">Certification</div>
                  <div className="text-sm text-muted-foreground">Recognized credentials</div>
                </div>
                <div>
                  <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-foreground">Self-Paced</div>
                  <div className="text-sm text-muted-foreground">Learn at your speed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
