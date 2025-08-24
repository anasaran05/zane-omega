
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import { PrimaryButton } from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { fetchTasks, organizeTasks, Course, Chapter, Lesson, calculateProgress } from '@/lib/csv';
import { fetchTopics, organizeTopics, getTopicsForLesson, getWatchedTopics, isQuizPassed } from '@/lib/learning';
import { BookOpen, ChevronRight, Award, Clock, Play, Lock } from 'lucide-react';

const CSV_URL = import.meta.env.VITE_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrzHdNL8FRSooYojNPyBU2f66Tgr-DgwA6xB_HAK-azRx_s8PvbKUwzO5OzjzVdPGw-qeNOl68Asx6/pub?output=csv';

export default function LessonPage() {
  const { courseId, chapterId, lessonId } = useParams<{ courseId: string; chapterId: string; lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLearningContent, setHasLearningContent] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [courseId, chapterId, lessonId, location.search]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const [tasks, topicRows] = await Promise.all([
        fetchTasks(CSV_URL),
        fetchTopics().catch(() => [])
      ]);
      
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
      
      const foundLesson = foundChapter.lessons.find(l => l.id === lessonId);
      if (!foundLesson) {
        setError('Lesson not found');
        return;
      }
      
      setCourse(foundCourse);
      setChapter(foundChapter);
      setLesson(foundLesson);
      
      // Check for learning content and redirect if found UNLESS the caller explicitly requested tasks view
      if (topicRows.length > 0) {
        const topics = organizeTopics(topicRows);
        const lessonTopics = getTopicsForLesson(topics, lessonId!);
        
        if (lessonTopics.length > 0) {
          setHasLearningContent(true);

          // detect override: either state or query param ?tab=tasks
          const forcedTab = (location.state as any)?.defaultTab
            || new URLSearchParams(location.search).get('tab');

          const forceTasks = forcedTab === 'tasks';

          console.log(`🎓 Found ${lessonTopics.length} topics for lesson ${lessonId}. forceTasks=${forceTasks}`);

          // Only redirect if user did NOT request tasks explicitly
          if (!forceTasks) {
            navigate(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/learning`);
            return;
          }
          // else: do NOT navigate — stay on this page and show tasks list
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

const getCompletedTasks = (): string[] => {
  const completedKey = `course_${courseId}_completed_tasks`;
  const completed = localStorage.getItem(completedKey); // <--- localStorage
  return completed ? JSON.parse(completed) : [];
};


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course || !chapter || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-destructive-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Lesson Not Found</h3>
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

  const completedTaskIds = getCompletedTasks();
  const lessonProgress = calculateProgress(lesson.tasks, completedTaskIds);
  const quizPassed = isQuizPassed(lessonId!);

  // If we reach here, there's no learning content, so show tasks directly
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/courses" className="hover:text-foreground transition-colors">
              Courses
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/courses/${courseId}`} className="hover:text-foreground transition-colors">
              {course.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/courses/${courseId}/chapters/${chapterId}`} className="hover:text-foreground transition-colors">
              {chapter.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{lesson.name}</span>
          </div>
        </nav>

        {/* Lesson Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
                {lesson.name}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Complete all tasks in this lesson to advance your healthcare administration skills.
              </p>
              
              {/* Lesson Progress */}
              <div className="max-w-md">
                <ProgressBar
                  value={lessonProgress.completionPercentage}
                  label="Lesson Progress"
                />
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">
                {lessonProgress.earnedXP}
              </div>
              <div className="text-sm text-muted-foreground">
                / {lessonProgress.totalXP} XP
              </div>
            </div>
          </div>

          {/* Lesson Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{lesson.tasks.length}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{lessonProgress.completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{Math.round(lessonProgress.completionPercentage)}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-6">Lesson Tasks</h2>
          
          <div className="grid gap-6">
            {lesson.tasks.map((task, index) => {
              const isCompleted = completedTaskIds.includes(task.id);
              
              return (
                <Card 
                  key={task.id}
                  variant="interactive"
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                          ${isCompleted 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-surface text-muted-foreground'
                          }
                        `}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {task.title}
                          </CardTitle>
                          <p className="text-muted-foreground mb-4">
                            {task.scenario.substring(0, 150)}...
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              <span>{task.xp} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>~15 min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Link to={`/courses/${courseId}/chapters/${chapterId}/tasks/${task.id}`}>
                          <PrimaryButton>
                            {isCompleted ? 'Review Task' : 'Start Task'}
                          </PrimaryButton>
                        </Link>
                        
                        {isCompleted && (
                          <span className="text-xs text-success-foreground bg-success/10 px-2 py-1 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Button to go to learning content if all tasks are complete and learning content exists */}
          {lessonProgress.completionPercentage === 100 && hasLearningContent && (
            <div className="flex justify-center mt-8">
              <PrimaryButton onClick={() => navigate(`/courses/${courseId}/chapters/${chapterId}`)}>
                Go to Lesson Content <Play className="ml-2 h-5 w-5"/>
              </PrimaryButton>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
