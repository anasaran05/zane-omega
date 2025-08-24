import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import { PrimaryButton } from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import {
  fetchTasks,
  organizeTasks,
  Course,
  Chapter,
  calculateProgress,
} from '@/lib/csv';
import { isLessonUnlocked, getDaysUntilUnlock, isChapterUnlocked } from '@/lib/lessonUnlock';
import { BookOpen, ChevronRight, Lock, Calendar } from 'lucide-react';

const CSV_URL =
  import.meta.env.VITE_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrzHdNL8FRSooYojNPyBU2f66Tgr-DgwA6xB_HAK-azRx_s8PvbKUwzO5OzjzVdPGw-qeNOl68Asx6/pub?output=csv';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate] = useState(new Date()); // For testing, you can set specific dates

  /** Helpers **/
  const completedKey = `course_${courseId}_completed_tasks`;
  const getCompletedTasks = (): string[] => {
    // Read from both localStorage and sessionStorage for backward compatibility
    const localTasks = JSON.parse(localStorage.getItem(completedKey) || '[]');
    const sessionTasks = JSON.parse(sessionStorage.getItem(completedKey) || '[]');
    return [...new Set([...localTasks, ...sessionTasks])];
  };

  const getCompletedLessons = (): string[] => {
    const learningKey = `course_${courseId}_completed_lessons`;
    return JSON.parse(localStorage.getItem(learningKey) || '[]');
  };

  const isLessonFullyComplete = (lesson: any): boolean => {
    const completedTasks = getCompletedTasks();
    const completedLessons = getCompletedLessons();
    
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

  const getChapterProgress = (chapter: Chapter) => {
    const totalLessons = chapter.lessons.length;
    const completedLessons = chapter.lessons.filter(lesson => isLessonFullyComplete(lesson)).length;
    const completionPercentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    
    // Calculate XP based on completed lessons
    const totalXP = chapter.lessons.reduce((sum, lesson) => sum + lesson.tasks.reduce((taskSum, task) => taskSum + task.xp, 0), 0);
    const earnedXP = chapter.lessons
      .filter(lesson => isLessonFullyComplete(lesson))
      .reduce((sum, lesson) => sum + lesson.tasks.reduce((taskSum, task) => taskSum + task.xp, 0), 0);
    
    return {
      totalTasks: totalLessons,
      completedTasks: completedLessons,
      completionPercentage,
      totalXP,
      earnedXP,
      xpPercentage: totalXP === 0 ? 0 : Math.round((earnedXP / totalXP) * 100)
    };
  };

  /** Data fetch **/
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const tasks = await fetchTasks(CSV_URL);
        const courses = organizeTasks(tasks);
        const found = courses.find((c) => c.id === courseId);
        if (!found) throw new Error('Course not found');
        setCourse(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  /** Render states **/
  if (loading) {
    return (
      <PageWrapper>
        <LoadingState />
      </PageWrapper>
    );
  }

  if (error || !course) {
    return (
      <PageWrapper>
        <ErrorState message={error} />
      </PageWrapper>
    );
  }

  /** Progress **/
  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const completedLessons = course.chapters.reduce((sum, ch) => 
    sum + ch.lessons.filter(lesson => isLessonFullyComplete(lesson)).length, 0);
  const overallCompletionPercentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
  
  const totalXP = course.chapters.reduce((sum, ch) => 
    sum + ch.lessons.reduce((lessonSum, lesson) => 
      lessonSum + lesson.tasks.reduce((taskSum, task) => taskSum + task.xp, 0), 0), 0);
  const earnedXP = course.chapters.reduce((sum, ch) =>
    sum + ch.lessons
      .filter(lesson => isLessonFullyComplete(lesson))
      .reduce((lessonSum, lesson) => 
        lessonSum + lesson.tasks.reduce((taskSum, task) => taskSum + task.xp, 0), 0), 0);
  
  const overallProgress = {
    totalTasks: totalLessons,
    completedTasks: completedLessons,
    completionPercentage: overallCompletionPercentage,
    totalXP,
    earnedXP,
    xpPercentage: totalXP === 0 ? 0 : Math.round((earnedXP / totalXP) * 100)
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <Breadcrumb courseName={course.name} />

        {/* Course Header */}
        <div className="mb-12">
          <CourseHeader course={course} progress={overallProgress} />
        </div>

        {/* Chapters */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
            Course Chapters
          </h2>
          {course.chapters.map((chapter, index) => {
            const chapterProgress = getChapterProgress(chapter);
            const chapterUnlocked = isChapterUnlocked(index + 1, chapter.lessons, currentDate);
            
            return (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                courseId={courseId!}
                index={index}
                chapterProgress={chapterProgress}
                completedTaskIds={getCompletedTasks()}
                isUnlocked={chapterUnlocked}
                currentDate={currentDate}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Sub-components **/

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24">{children}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-muted-foreground">Loading course...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <Card className="max-w-md mx-auto text-center">
      <CardContent className="p-8">
        <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-destructive-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Course Not Found
        </h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        <Link to="/courses">
          <PrimaryButton>Back to Courses</PrimaryButton>
        </Link>
      </CardContent>
    </Card>
  );
}

function Breadcrumb({ courseName }: { courseName: string }) {
  return (
    <nav className="mb-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/courses" className="hover:text-foreground transition-colors">
          Courses
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{courseName}</span>
      </div>
    </nav>
  );
}

function CourseHeader({
  course,
  progress,
}: {
  course: Course;
  progress: ReturnType<typeof calculateProgress>;
}) {
  return (
    <>
      <div className="flex items-start gap-6 mb-6">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
            {course.name}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Comprehensive healthcare training with practical simulations and
            expert guidance.
          </p>
          <div className="max-w-md">
            <ProgressBar
              value={progress.completionPercentage}
              label="Overall Progress"
            />
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary mb-1">
            {progress.earnedXP}
          </div>
          <div className="text-sm text-muted-foreground">
            / {progress.totalXP} XP
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Stat value={course.chapters.length} label="Chapters" />
        <Stat value={course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)} label="Total Lessons" />
        <Stat value={progress.completedTasks} label="Completed" />
        <Stat value={`${Math.round(progress.completionPercentage)}%`} label="Progress" />
      </div>
    </>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ChapterCard({
  chapter,
  index,
  courseId,
  chapterProgress,
  completedTaskIds,
  isUnlocked,
  currentDate,
}: {
  chapter: Chapter;
  index: number;
  courseId: string;
  chapterProgress: ReturnType<typeof calculateProgress>;
  completedTaskIds: string[];
  isUnlocked: boolean;
  currentDate: Date;
}) {
  const allTasks = chapter.lessons.flatMap(l => l.tasks);
  
  const getCompletedLessons = (): string[] => {
    const learningKey = `course_${courseId}_completed_lessons`;
    return JSON.parse(localStorage.getItem(learningKey) || '[]');
  };

  const isLessonFullyComplete = (lesson: any): boolean => {
    const completedLessons = getCompletedLessons();
    
    // Check if learning is completed
    const learningComplete = completedLessons.includes(lesson.id);
    
    // Check if all tasks are completed
    const tasksComplete = lesson.tasks.length > 0 && 
      lesson.tasks.every((task: any) => completedTaskIds.includes(task.id));
    
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
  
  return (
    <Card
      variant="elevated"
      className={`animate-fade-in ${!isUnlocked ? 'opacity-75' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">
                Chapter {index + 1}: {chapter.name}
              </CardTitle>
              {!isUnlocked && <Lock className="w-5 h-5 text-muted-foreground" />}
            </div>
            
            <p className="text-muted-foreground mb-4">
              {chapter.lessons.length} lessons • {allTasks.length} tasks •{' '}
              {allTasks.reduce((sum, task) => sum + task.xp, 0)} XP
            </p>
            
            {isUnlocked ? (
              <div className="max-w-md">
                <ProgressBar
                  value={chapterProgress.completionPercentage}
                  label="Chapter Progress"
                  size="sm"
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-surface p-3 rounded-lg">
                <Calendar className="w-4 h-4 inline mr-2" />
                Chapter will unlock when first lesson is available
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {chapterProgress.earnedXP}
              </div>
              <div className="text-xs text-muted-foreground">
                / {chapterProgress.totalXP} XP
              </div>
            </div>
            
            {isUnlocked ? (
              <Link to={`/courses/${courseId}/chapters/${chapter.id}`}>
                <PrimaryButton>
                  {chapterProgress.completedTasks > 0 ? 'Continue' : 'Start Chapter'}
                </PrimaryButton>
              </Link>
            ) : (
              <PrimaryButton disabled>
                <Lock className="w-4 h-4 mr-2" />
                Locked
              </PrimaryButton>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {chapter.lessons.slice(0, 3).map((lesson) => {
            const isCompleted = isLessonFullyComplete(lesson);
            const lessonUnlocked = isLessonUnlocked(lesson.id, currentDate);
            const daysUntilUnlock = getDaysUntilUnlock(lesson.id, currentDate);
            
            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-surface-elevated transition-colors ${
                  !lessonUnlocked ? 'opacity-50' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isCompleted
                      ? 'bg-success text-success-foreground'
                      : lessonUnlocked 
                      ? 'bg-surface text-muted-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {!lessonUnlocked ? (
                    <Lock className="w-3 h-3" />
                  ) : isCompleted ? (
                    '✓'
                  ) : (
                    lesson.tasks.reduce((sum, task) => sum + task.xp, 0)
                  )}
                </div>
                
                <span
                  className={`text-sm flex-1 ${
                    isCompleted
                      ? 'text-success-foreground'
                      : lessonUnlocked
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {lesson.name}
                  {!lessonUnlocked && daysUntilUnlock > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (in {daysUntilUnlock} day{daysUntilUnlock !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {chapter.lessons.length > 3 && (
            <div className="text-center pt-2">
              {isUnlocked ? (
                <Link
                  to={`/courses/${courseId}/chapters/${chapter.id}`}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  View all {chapter.lessons.length} lessons
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {chapter.lessons.length} lessons (locked)
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}