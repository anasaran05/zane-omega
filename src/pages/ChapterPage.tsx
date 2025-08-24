import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import { PrimaryButton } from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { fetchTasks, organizeTasks, Course, Chapter, calculateProgress, getCompletedTasks } from '@/lib/csv';
import { isLessonUnlocked, getLessonUnlockDate, getDaysUntilUnlock } from '@/lib/lessonUnlock';
import { fetchTopics, organizeTopics, getTopicsForLesson } from '@/lib/learning';
import { BookOpen, ChevronRight, Award, Clock, Lock, Calendar } from 'lucide-react';

const CSV_URL = import.meta.env.VITE_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrzHdNL8FRSooYojNPyBU2f66Tgr-DgwA6xB_HAK-azRx_s8PvbKUwzO5OzjzVdPGw-qeNOl68Asx6/pub?output=csv';

export default function ChapterPageWithUnlock() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate] = useState(new Date()); // For testability
  const [tick, setTick] = useState(0); // used to force rerender when storage updates
  const [lessonHasLearning, setLessonHasLearning] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadChapter();
  }, [courseId, chapterId]);

  // re-run when storage updates (tick changes), ensures UI refreshes after localStorage writes
  useEffect(() => {
    const handleStorage = () => setTick(t => t + 1);
    const handleCustom = () => setTick(t => t + 1);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('progress:updated', handleCustom as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('progress:updated', handleCustom as EventListener);
    };
  }, []);

  // Check which lessons have learning content
  useEffect(() => {
    if (chapter) {
      const checkLearningContent = async () => {
        try {
          const topicRows = await fetchTopics().catch(() => []);
          if (topicRows.length > 0) {
            const topics = organizeTopics(topicRows);
            const learningMap: {[key: string]: boolean} = {};
            
            chapter.lessons.forEach(lesson => {
              const lessonTopics = getTopicsForLesson(topics, lesson.id);
              learningMap[lesson.id] = lessonTopics.length > 0;
            });
            
            setLessonHasLearning(learningMap);
          }
        } catch (error) {
          console.error('Error checking learning content:', error);
        }
      };
      
      checkLearningContent();
    }
  }, [chapter]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const tasks = await fetchTasks(CSV_URL);
      const courses = organizeTasks(tasks);
      const foundCourse = courses.find(c => c.id === courseId);
      
      if (!foundCourse) {
        setError('Course not found');
        return;
      }
      
      const foundChapter = foundCourse.chapters.find(ch => ch.id === chapterId);
      if (!foundChapter) {
        setError('Chapter not found');
        return;
      }
      
      setCourse(foundCourse);
      setChapter(foundChapter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapter');
      console.error('Error loading chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLessonCompletedTasks = (lesson: any): string[] => {
    // Unify task completion by reading from localStorage (primary) and sessionStorage (fallback)
    const localStorageKey = `course_${courseId}_completed_tasks`;
    const localStorageTasks = JSON.parse(localStorage.getItem(localStorageKey) || '[]') as string[];
    
    // Also check sessionStorage for backward compatibility
    const sessionStorageTasks = getCompletedTasks(courseId!);
    
    // Merge both sources
    const allCompletedTasks = [...new Set([...localStorageTasks, ...sessionStorageTasks])];
    
    const lessonTaskIds = lesson.tasks.map((task: any) => task.id);
    return allCompletedTasks.filter((taskId: string) => lessonTaskIds.includes(taskId));
  };

  const getCompletedLessonsList = (): string[] => {
    return JSON.parse(localStorage.getItem(`course_${courseId}_completed_lessons`) || '[]') as string[];
  };

  const isLessonLearningDone = (lessonId: string): boolean => {
    return localStorage.getItem(`lesson_${lessonId}_learningDone`) === 'true';
  };

  // ✅ FIXED: Updated lesson-level completion logic
  const computeLessonLevelCompletion = () => {
    if (!chapter) return { completedLessonCount: 0, totalLessonCount: 0, percentage: 0 };

    const completedLessonsSet = new Set(getCompletedLessonsList());
    let completedLessonCount = 0;
    const totalLessonCount = chapter.lessons.length;

    for (const lesson of chapter.lessons) {
      const hasTasks = Array.isArray(lesson.tasks) && lesson.tasks.length > 0;
      const completedLessonsList = getCompletedLessonsList();
      const learningDone = isLessonLearningDone(lesson.id) || completedLessonsList.includes(lesson.id);
      const hasLearning = lessonHasLearning[lesson.id] || learningDone;
      
      let isComplete = false;
      
      if (hasTasks && hasLearning) {
        // Mixed lesson: complete if EITHER learning OR tasks are done
        const completedTasks = getLessonCompletedTasks(lesson);
        const tasksComplete = completedTasks.length === lesson.tasks.length && lesson.tasks.length > 0;
        const learningComplete = completedLessonsSet.has(lesson.id);
        isComplete = tasksComplete || learningComplete;
      } else if (hasTasks) {
        // Task-only lesson
        const completedTasks = getLessonCompletedTasks(lesson);
        isComplete = completedTasks.length === lesson.tasks.length && lesson.tasks.length > 0;
      } else if (hasLearning) {
        // Learning-only lesson
        isComplete = completedLessonsSet.has(lesson.id);
      }
      
      if (isComplete) {
        completedLessonCount++;
      }
    }

    const percentage = totalLessonCount === 0 ? 0 : (completedLessonCount / totalLessonCount) * 100;
    return { completedLessonCount, totalLessonCount, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        <Header />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '0s', animationDuration: '3s'}} />
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-40" style={{animationDelay: '1s', animationDuration: '4s'}} />
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce opacity-50" style={{animationDelay: '2s', animationDuration: '3.5s'}} />
          <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-bounce opacity-45" style={{animationDelay: '0.5s', animationDuration: '2.8s'}} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-8 border-muted opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500 border-r-pink-500 animate-spin"></div>
              <div className="absolute inset-4 rounded-full border-6 border-transparent border-b-purple-500 border-l-yellow-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}} />
              <div className="absolute inset-8 rounded-full border-4 border-transparent border-t-green-500 animate-spin" style={{animationDuration: '0.8s'}} />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground mb-2 animate-pulse">Loading your courses...</p>
              <p className="text-sm text-muted-foreground animate-bounce">🎌 Preparing your anime learning adventure!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course || !chapter) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-destructive-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Chapter Not Found</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link to="/courses">
                <PrimaryButton>Back to Courses</PrimaryButton>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // recalc dynamic pieces (tick ensures latest localStorage state)
  const completedTaskIds = getCompletedTasks(courseId!);
  const allChapterTasks = chapter.lessons.flatMap((l: any) => l.tasks);
  const chapterProgress = calculateProgress(allChapterTasks, completedTaskIds);
  const { completedLessonCount, totalLessonCount, percentage: lessonLevelPercentage } = computeLessonLevelCompletion();

  // Calculate unlock status for chapter
  const unlockedLessons = chapter.lessons.filter((lesson: any) => isLessonUnlocked(lesson.id, currentDate));
  const hasUnlockedLessons = unlockedLessons.length > 0;
  const nextLockedLesson = chapter.lessons.find((lesson: any) => !isLessonUnlocked(lesson.id, currentDate));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/courses/${courseId}`} className="hover:text-foreground transition-colors">{course.name}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{chapter.name}</span>
          </div>
        </nav>

        {/* Chapter Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-heading font-bold text-foreground mb-4">{chapter.name}</h1>
              <p className="text-xl text-muted-foreground mb-6">Complete all lessons in this chapter to advance your healthcare administration skills.</p>
              
              <div className="max-w-md">
                {/* Use lesson-level percentage (lessons completed) for the header progress */}
                <ProgressBar
                  value={Math.round(lessonLevelPercentage)}
                  label={`Chapter Progress — ${completedLessonCount}/${totalLessonCount} lessons`}
                />
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">{chapterProgress.earnedXP}</div>
              <div className="text-sm text-muted-foreground">/ {chapterProgress.totalXP} XP</div>
            </div>
          </div>

          {/* Unlock Status Banner */}
          {!hasUnlockedLessons && (
            <Card className="mb-6 border-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-warning" />
                  <div>
                    <h3 className="font-semibold text-foreground">Chapter Locked</h3>
                    <p className="text-sm text-muted-foreground">
                      Lessons in this chapter will unlock based on the course schedule starting September 1st, 2025.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {nextLockedLesson && hasUnlockedLessons && (
            <Card className="mb-6 border-blue-200 bg-black-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-foreground">Next Lesson Unlocks</h3>
                    <p className="text-sm text-muted-foreground">
                      "{nextLockedLesson.name}" unlocks on{' '}
                      {getLessonUnlockDate(nextLockedLesson.id)?.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {getDaysUntilUnlock(nextLockedLesson.id, currentDate) > 0 && (
                        <span className="ml-1">({getDaysUntilUnlock(nextLockedLesson.id, currentDate)} days)</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chapter Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{chapter.lessons.length}</div>
              <div className="text-sm text-muted-foreground">Total Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{unlockedLessons.length}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{chapterProgress.completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{Math.round(lessonLevelPercentage)}%</div>
              <div className="text-sm text-muted-foreground">Lesson Completion</div>
            </div>
          </div>
        </div>

        {/* Lessons */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-6">Lessons</h2>
          
          <div className="grid gap-6">
            {chapter.lessons.map((lesson: any, index: number) => {
              const lessonCompletedTasks = getLessonCompletedTasks(lesson);
              const lessonProgress = calculateProgress(lesson.tasks, lessonCompletedTasks);
              const lessonUnlocked = isLessonUnlocked(lesson.id, currentDate);
              const unlockDate = getLessonUnlockDate(lesson.id);
              const daysUntilUnlock = getDaysUntilUnlock(lesson.id, currentDate);

              const hasTasks = Array.isArray(lesson.tasks) && lesson.tasks.length > 0;
const completedLessonsList = getCompletedLessonsList();
const learningDone = isLessonLearningDone(lesson.id) || completedLessonsList.includes(lesson.id);

// ✅ unify detection
const hasLearning = lessonHasLearning[lesson.id] || learningDone;


              
              // ✅ FIXED: Updated lesson completion logic
              const isLessonFullyComplete = (() => {
              if (hasTasks && hasLearning) {
               const tasksComplete = lessonProgress.completedTasks === lesson.tasks.length && lesson.tasks.length > 0;
               const learningComplete = learningDone;
              return tasksComplete || learningComplete; // Changed from AND to OR
               } else if (hasTasks) {
                  // Task-only lesson
                  return lessonProgress.completedTasks === lesson.tasks.length && lesson.tasks.length > 0;
                } else if (hasLearning) {
                  // Learning-only lesson
                  return completedLessonsList.includes(lesson.id) || learningDone;
                } else {
                  // No content (shouldn't happen)
                  return false;
                }
              })();

              const displayProgressValue = (() => {
                if (hasTasks && hasLearning) {
                  // Mixed lesson: calculate combined progress
                  const taskPercentage = lessonProgress.completionPercentage;
                  const learningPercentage = (completedLessonsList.includes(lesson.id) || learningDone) ? 100 : 0;
                  return Math.round((taskPercentage + learningPercentage) / 2);
                } else if (hasTasks) {
                  return lessonProgress.completionPercentage;
                } else {
                  return isLessonFullyComplete ? 100 : 0;
                }
              })();

              return (
                <Card 
                  key={lesson.id}
                  variant={lessonUnlocked ? "interactive" : "default"}
                  className={`animate-fade-in ${!lessonUnlocked ? 'opacity-75' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                          ${isLessonFullyComplete
                            ? 'bg-success text-success-foreground' 
                            : lessonUnlocked
                              ? 'bg-surface text-muted-foreground'
                              : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          {!lessonUnlocked ? (
                            <Lock className="w-5 h-5" />
                          ) : isLessonFullyComplete ? (
                            '✓'
                          ) : (
                            index + 1
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{lesson.name}</CardTitle>
                            {!lessonUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                            {hasLearning && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📚 Learning</span>}
                            {hasTasks && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">⚙️ Tasks</span>}
                          </div>
                          
                          <p className="text-muted-foreground mb-4">
                            {hasLearning && hasTasks && `Learning + ${lesson.tasks.length} tasks`}
                            {hasLearning && !hasTasks && `Learning content only`}
                            {!hasLearning && hasTasks && `${lesson.tasks.length} tasks`}
                            {lesson.tasks.length > 0 && ` • ${lesson.tasks.reduce((sum: number, task: any) => sum + (task.xp || 0), 0)} XP`}
                            {!lessonUnlocked && unlockDate && (
                              <span className="ml-2 text-warning">• Unlocks {unlockDate.toLocaleDateString()}</span>
                            )}
                          </p>
                          
                          {lessonUnlocked ? (
                            <div className="max-w-md mb-4">
                              <ProgressBar value={displayProgressValue} label="Lesson Progress" size="sm" />
                            </div>
                          ) : (
                            <div className="bg-surface p-3 rounded-lg mb-4 max-w-md">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {daysUntilUnlock === 0 ? <span className="text-success">Available today!</span> : daysUntilUnlock === 1 ? <span>Unlocks tomorrow</span> : <span>Unlocks in {daysUntilUnlock} days</span>}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              <span>{lessonProgress.earnedXP}/{lessonProgress.totalXP} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>~{(hasLearning ? 20 : 0) + (lesson.tasks.length * 15)} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {lessonUnlocked ? (
                          <Link to={`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`}>
                            <PrimaryButton>
                              {isLessonFullyComplete ? 'Review Lesson' : (lessonProgress.completedTasks > 0 || learningDone ? 'Continue Lesson' : 'Start Lesson')}
                            </PrimaryButton>
                          </Link>
                        ) : (
                          <PrimaryButton disabled className="cursor-not-allowed">
                            <Lock className="w-4 h-4 mr-2" />
                            Locked
                          </PrimaryButton>
                        )}
                        
                        {isLessonFullyComplete && (
                          <span className="text-xs text-success-foreground bg-success/10 px-2 py-1 rounded-full">Completed</span>
                        )}
                        
                        {!lessonUnlocked && daysUntilUnlock > 0 && (
                          <span className="text-xs text-muted-foreground bg-surface px-2 py-1 rounded-full">{daysUntilUnlock} day{daysUntilUnlock !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Summary Card for locked lessons */}
        {chapter.lessons.length > unlockedLessons.length && (
          <Card className="mt-8 border-blue-200 bg-black-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {chapter.lessons.length - unlockedLessons.length} lesson{chapter.lessons.length - unlockedLessons.length !== 1 ? 's' : ''} will unlock automatically based on the course schedule.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapter.lessons
                  .filter((lesson: any) => !isLessonUnlocked(lesson.id, currentDate))
                  .slice(0, 4)
                  .map((lesson: any) => {
                    const unlockDate = getLessonUnlockDate(lesson.id);
                    const daysUntil = getDaysUntilUnlock(lesson.id, currentDate);
                    return (
                      <div key={lesson.id} className="flex justify-between items-center text-sm">
                        <span className="text-foreground">{lesson.name}</span>
                        <span className="text-muted-foreground">{daysUntil === 0 ? 'Today' : `${daysUntil} days`}</span>
                      </div>
                    );
                  })}
              </div>
              {chapter.lessons.filter((lesson: any) => !isLessonUnlocked(lesson.id, currentDate)).length > 4 && (
                <p className="text-xs text-muted-foreground mt-4">...and {chapter.lessons.filter((lesson: any) => !isLessonUnlocked(lesson.id, currentDate)).length - 4} more lessons</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}