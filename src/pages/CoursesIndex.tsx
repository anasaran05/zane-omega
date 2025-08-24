import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import { PrimaryButton } from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { fetchTasks, organizeTasks, Course, calculateProgress } from '@/lib/csv';
import { BookOpen, Clock, Award, Users, Lock, } from 'lucide-react';
import Footer from "../components/Footer";

// Use environment variable or fallback to sample data
const CSV_URL = import.meta.env.VITE_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrzHdNL8FRSooYojNPyBU2f66Tgr-DgwA6xB_HAK-azRx_s8PvbKUwzO5OzjzVdPGw-qeNOl68Asx6/pub?output=csv';

export default function CoursesIndex() {
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
      
      // Filter out dummy courses - you can adjust these conditions based on your data
      const filteredCourses = organizedCourses.filter(course => {
        return (
          course.name && // Has a name
          course.name.trim() !== '' && // Name is not empty
          !course.name.toLowerCase().includes('dummy') && // Doesn't contain 'dummy'
          !course.name.toLowerCase().includes('test') && // Doesn't contain 'test'
          !course.name.toLowerCase().includes('sample') && // Doesn't contain 'sample'
          course.id && course.id.trim() !== '' && // Has a valid ID
          course.chapters && course.chapters.length > 0 // Has actual content
        );
      });
      
      setCourses(filteredCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCompletedTasks = (courseId: string): string[] => {
    const completedKey = `course_${courseId}_completed_tasks`;
    // Read from both localStorage and sessionStorage for backward compatibility
    const localTasks = JSON.parse(localStorage.getItem(completedKey) || '[]');
    const sessionTasks = JSON.parse(sessionStorage.getItem(completedKey) || '[]');
    return [...new Set([...localTasks, ...sessionTasks])];
  };

  const getCompletedLessons = (courseId: string): string[] => {
    const learningKey = `course_${courseId}_completed_lessons`;
    return JSON.parse(localStorage.getItem(learningKey) || '[]');
  };

  const isLessonFullyComplete = (lesson: any, courseId: string): boolean => {
    const completedTasks = getCompletedTasks(courseId);
    const completedLessons = getCompletedLessons(courseId);
    
    // Check if learning is completed
    const learningComplete = completedLessons.includes(lesson.id);
    
    // Check if all tasks are completed
    const tasksComplete = lesson.tasks.length > 0 && 
      lesson.tasks.every((task: any) => completedTasks.includes(task.id));
    
    // For mixed lessons (both learning and tasks), complete if either is done
    // For task-only lessons, complete only if tasks are done
    // For learning-only lessons, complete only if learning is done
    if (lesson.tasks.length > 0 && lesson.hasLearning) {
      return learningComplete || tasksComplete;
    } else if (lesson.tasks.length > 0) {
      return tasksComplete;
    } else {
      return learningComplete;
    }
  };

  const getCourseStats = (course: Course) => {
    const totalLessons = course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
    const completedLessons = course.chapters.reduce((sum, chapter) => 
      sum + chapter.lessons.filter(lesson => isLessonFullyComplete(lesson, course.id)).length, 0);
    const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    
    const totalXP = course.chapters.reduce((sum, chapter) => 
      sum + chapter.lessons.reduce((lessonSum, lesson) => 
        lessonSum + lesson.tasks.reduce((taskSum, task) => taskSum + task.xp, 0), 0), 0);
    const earnedXP = course.chapters.reduce((sum, chapter) =>
      sum + chapter.lessons
        .filter(lesson => isLessonFullyComplete(lesson, course.id))
        .reduce((lessonSum, lesson) => 
          lessonSum + lesson.tasks.reduce((taskSum, task) => taskSum + task.xp, 0), 0), 0);
    
    return {
      totalChapters: course.chapters.length,
      totalLessons,
      totalTasks: totalLessons,
      completedTasks: completedLessons,
      progressPercentage,
      totalXP,
      earnedXP
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
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
        <div className="container mx-auto px-4 py-24">
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
      
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
            Pro-Training Courses
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
              const isUnlocked = course.name.toLowerCase().includes('qa/qc'); // Only unlock QA/QC

              return (
                <Card 
                  key={course.id}
                  variant="interactive"
                  className="h-full animate-fade-in relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Lock overlay for locked courses */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 rounded-xl">
                      <Lock className="w-10 h-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground font-medium">Locked</p>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-primary-foreground" />
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
                          <span className="text-xs">Chapters</span>
                        </div>
                        <div className="font-semibold text-foreground">
                          {stats.totalChapters}
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
                      {isUnlocked ? (
                        <Link to={`/courses/${course.id}`} className="block">
                          <PrimaryButton className="w-full">
                            {stats.completedTasks > 0 ? 'Continue Course' : 'Start Course'}
                          </PrimaryButton>
                        </Link>
                      ) : (
                        <PrimaryButton className="w-full" disabled>
                          Locked
                        </PrimaryButton>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </div>
    </div>
    
  ); 
}