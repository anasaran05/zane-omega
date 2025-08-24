// LearningPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, BookOpen, Award, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import {
  fetchTopics,
  fetchQuiz,
  organizeTopics,
  organizeQuiz,
  getTopicsForLesson,
  getQuizForLesson,
  getWatchedTopics,
  markTopicWatched,
  getQuizScore,
  setQuizScore,
  isQuizPassed,
  setQuizPassed,
  Topic,
  QuizQuestion,
} from "@/lib/learning";
import { fetchTasks, organizeTasks, findLesson } from "@/lib/csv";

const CSV_URL =
  import.meta.env.VITE_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRrzHdNL8FRSooYojNPyBU2f66Tgr-DgwA6xB_HAK-azRx_s8PvbKUwzO5OzjzVdPGw-qeNOl68Asx6/pub?output=csv";

export default function LearningPage() {
  const { courseId, chapterId, lessonId, topicId } = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
    topicId?: string;
  }>();

  const navigate = useNavigate();
  const { toast } = useToast();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonName, setLessonName] = useState<string>("");

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScoreState] = useState(0);

  useEffect(() => {
    loadLearningData();
  }, [courseId, chapterId, lessonId, topicId]);

  const loadLearningData = async () => {
    if (!courseId || !chapterId || !lessonId) return;

    try {
      setLoading(true);

      const [topicRows, quizRows, taskRows] = await Promise.all([
        fetchTopics(),
        fetchQuiz(),
        fetchTasks(CSV_URL),
      ]);

      const allTopics = organizeTopics(topicRows);
      const allQuiz = organizeQuiz(quizRows);
      const courses = organizeTasks(taskRows);

      const lessonTopics = getTopicsForLesson(allTopics, lessonId);
      const lessonQuiz = getQuizForLesson(allQuiz, lessonId);

      const lesson = findLesson(courses, courseId, chapterId, lessonId);
      if (lesson) setLessonName(lesson.name);

      setTopics(lessonTopics);
      setQuizQuestions(lessonQuiz);

      if (topicId) {
        const topic = lessonTopics.find((t) => t.id === topicId);
        if (topic) {
          setCurrentTopic(topic);
          markTopicWatched(lessonId, topicId);
          window.dispatchEvent(new Event("progress:updated")); // 🔥 notify chapter
        }
      } else if (lessonTopics.length > 0) {
        setCurrentTopic(lessonTopics[0]);
      }

      const existingScore = getQuizScore(lessonId);
      if (existingScore !== null) {
        setQuizScoreState(existingScore);
        setQuizCompleted(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load learning data"
      );
      console.error("Error loading learning data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    setCurrentTopic(topic);

    if (lessonId && topic.id) {
      markTopicWatched(lessonId, topic.id);
      
      // Check if all topics are now watched
      const updatedWatchedTopics = getWatchedTopics(lessonId);
      if (updatedWatchedTopics.length === topics.length && topics.length > 0) {
        // All topics watched - mark learning as completed
        const learningDoneKey = `lesson_${lessonId}_learningDone`;
        localStorage.setItem(learningDoneKey, "true");
        
        // Add to completed lessons list
        if (courseId) {
          const completedLessonsKey = `course_${courseId}_completed_lessons`;
          const completedLessons = JSON.parse(localStorage.getItem(completedLessonsKey) || "[]") as string[];
          if (!completedLessons.includes(lessonId)) {
            completedLessons.push(lessonId);
            localStorage.setItem(completedLessonsKey, JSON.stringify(completedLessons));
          }
        }
      }
      
      window.dispatchEvent(new Event("progress:updated")); // 🔥 notify chapter
    }

    navigate(
      `/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/learning/${topic.id}`
    );
  };

  const handleQuizStart = () => {
    setShowQuiz(true);
    setCurrentQuizQuestion(0);
    setSelectedAnswers([]);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuizQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

const handleNextQuestion = async () => {
  if (currentQuizQuestion < quizQuestions.length - 1) {
    setCurrentQuizQuestion(currentQuizQuestion + 1);
  } else {
    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === quizQuestions[index].correctIndex) correct++;
    });
    const scorePercentage = (correct / quizQuestions.length) * 100;
    const passed = scorePercentage >= 80;

    setQuizScoreState(scorePercentage);
    setQuizScore(lessonId!, scorePercentage);
    setQuizPassed(lessonId!, passed);
    setQuizCompleted(true);

    toast({
      title: passed ? "🎉 Quiz Passed!" : "📚 Quiz Not Passed",
      description: passed
        ? "Congratulations! You can now access the simulation tasks."
        : "You need 80% to pass. You can retake the quiz anytime.",
    });

    try {
      // Mark learning as done (whether passed or not)
      if (lessonId && courseId) {
        const learningDoneKey = `lesson_${lessonId}_learningDone`;
        localStorage.setItem(learningDoneKey, "true");
      }

      // Add completed lesson to the central list (whether passed or not)
      if (courseId && lessonId) {
        const completedLessonsKey = `course_${courseId}_completed_lessons`;
        const completedLessons = JSON.parse(
          localStorage.getItem(completedLessonsKey) || "[]"
        ) as string[];
        
        if (!completedLessons.includes(lessonId)) {
          completedLessons.push(lessonId);
          localStorage.setItem(
            completedLessonsKey,
            JSON.stringify(completedLessons)
          );
        }
      }

      // Notify chapter page to update progress
      window.dispatchEvent(new Event("progress:updated"));
    } catch (err) {
      console.error("Error in quiz completion:", err);
    }
  }
};

  const handleStartSimulation = async () => {
    try {
      const taskRows = await fetchTasks(CSV_URL);
      const courses = organizeTasks(taskRows);
      const lesson = findLesson(courses, courseId!, chapterId!, lessonId!);

      if (lesson && lesson.tasks.length > 0) {
        navigate(
          `/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
          { state: { defaultTab: "tasks", from: "quiz" } }
        );
      } else {
        toast({
          title: "No Tasks Available",
          description: "No simulation tasks found for this lesson.",
        });
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load simulation tasks.",
      });
    }
  };

  const watchedTopics = getWatchedTopics(lessonId || "");
  const isQuizUnlocked =
    topics.length > 0 && watchedTopics.length === topics.length;
  const isPassed = isQuizPassed(lessonId || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading learning content...</p>
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Learning Content Not Found</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link to={`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`}>
                <Button>Back to Lesson</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showQuiz && !quizCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <nav className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/courses" className="hover:text-foreground transition-colors">
                Courses
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/courses/${courseId}`} className="hover:text-foreground transition-colors">
                Course
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/courses/${courseId}/chapters/${chapterId}`} className="hover:text-foreground transition-colors">
                Chapter
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`} className="hover:text-foreground transition-colors">
                {lessonName}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">Quiz</span>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lesson Quiz - {lessonName}</span>
                  <Badge variant="outline">
                    Question {currentQuizQuestion + 1} of {quizQuestions.length}
                  </Badge>
                </CardTitle>
                
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Progress value={((currentQuizQuestion + 1) / quizQuestions.length) * 100} />
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      {quizQuestions[currentQuizQuestion]?.question}
                    </h3>
                    
                    <div className="space-y-2">
                      {quizQuestions[currentQuizQuestion]?.options.map((option, index) => (
                        <Button
                          key={index}
                          variant={selectedAnswers[currentQuizQuestion] === index ? "default" : "outline"}
                          className="w-full justify-start text-left h-auto p-4"
                          onClick={() => handleAnswerSelect(index)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setShowQuiz(false)}
                    >
                      Back to Learning
                    </Button>
                    
                    <Button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswers[currentQuizQuestion] === undefined}
                    >
                      {currentQuizQuestion === quizQuestions.length - 1 ? "Complete Quiz" : "Next Question"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
              Course
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/courses/${courseId}/chapters/${chapterId}`} className="hover:text-foreground transition-colors">
              Chapter
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`} className="hover:text-foreground transition-colors">
              {lessonName}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Learning</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                {currentTopic?.youtubeId ? (
                  <>
                    <div className="aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${currentTopic.youtubeId}`}
                        title={currentTopic.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-t-lg"
                      />
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2">{currentTopic.title}</h2>
                      <p className="text-muted-foreground">{currentTopic.description}</p>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">No video available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Results */}
            {quizCompleted && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Quiz Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Your Score:</span>
                      <Badge variant={isPassed ? "default" : "destructive"}>
                        {quizScore}%
                      </Badge>
                    </div>
                    <Progress value={quizScore} />
                    
                    <div className="space-y-4">
                      {isPassed ? (
                        <>
                          <p className="text-success">Congratulations! You passed the quiz.</p>
                          <Button onClick={handleStartSimulation} className="w-full">
                            Start Workplace Simulation
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-destructive">You need 80% to pass. Try again!</p>
                          <Button onClick={handleQuizStart} variant="outline" className="w-full">
                            Retake Quiz
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Topics List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <Button
                     key={topic.id}
                     variant={currentTopic?.id === topic.id ? "default" : "ghost"}
                      className="w-full justify-start text-left h-auto p-3 whitespace-normal break-words"
                       onClick={() => handleTopicSelect(topic)}
                       >
                    <div className="flex items-start gap-3">
                   {watchedTopics.includes(topic.id) ? (
                     <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    ) : (
                   <Play className="h-4 w-4" />
                     )}
                   <div className="min-w-0">
                 <div className="font-medium break-words">{topic.title}</div>
                     <div className="text-xs text-muted-foreground">
                  Topic {topic.order}
                    </div>
                 </div>
             </div>
                 </Button>

                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Topics Completed</span>
                      <span>{watchedTopics.length}/{topics.length}</span>
                    </div>
                    <Progress value={topics.length > 0 ? (watchedTopics.length / topics.length) * 100 : 0} />
                  </div>

                  {isQuizUnlocked ? (
                    <Button 
                      onClick={handleQuizStart} 
                      className="w-full"
                      disabled={showQuiz}
                    >
                      {quizCompleted ? "Retake Quiz" : "Take Quiz"}
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Complete All Topics to Unlock Quiz
                    </Button>
                  )}

                  {isPassed && (
                    <div className="text-center">
                      <Badge className="mb-2">Quiz Passed!</Badge>
                      <p className="text-sm text-muted-foreground">
                        You can now access simulation tasks
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
