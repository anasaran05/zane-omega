/**
 * CSV data fetching and parsing utilities for Google Sheets integration
 * Handles caching and type-safe parsing of course/chapter/lesson/task data
 * Robust CSV parser: supports quoted fields (with commas/newlines inside)
 */

export interface TaskRow {
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterName: string;
  lessonId: string;
  lessonName: string;
  taskId: string;
  taskTitle: string;
  scenario: string;
  pdfUrls: string; // comma/semicolon-separated URLs
  tallyUrls: string; // comma/semicolon-separated URLs
  answerKeyUrl: string;
  xp: number;
  instructions?: string; // may contain real newlines or \n escapes
}

export interface Course {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  courseId: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  name: string;
  chapterId: string;
  courseId: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  scenario: string;
  lessonId: string;
  chapterId: string;
  courseId: string;
  resources: {
    pdfs: string[];
    forms: string[];
    answerKey: string;
  };
  xp: number;
  instructions?: string;
}

const CACHE_KEY = 'zane_omega_csv_data';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Robust CSV parser that supports:
 * - quoted fields with commas and newlines inside
 * - escaped quotes ("")
 * Returns array of rows, each row is array of fields (unquoted)
 */
function parseCSV(csvText: string): string[][] {
  // strip BOM
  if (csvText.charCodeAt(0) === 0xfeff) {
    csvText = csvText.slice(1);
  }

  const rows: string[][] = [];
  let curField = '';
  let curRow: string[] = [];
  let inQuotes = false;
  const len = csvText.length;

  for (let i = 0; i < len; i++) {
    const ch = csvText[i];

    if (ch === '"') {
      // if it's a double double-quote, it's an escaped quote
      if (inQuotes && i + 1 < len && csvText[i + 1] === '"') {
        curField += '"';
        i++; // skip the escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes) {
      if (ch === ',') {
        curRow.push(curField);
        curField = '';
        continue;
      }

      if (ch === '\r') {
        // push field and row; skip optional \n
        curRow.push(curField);
        curField = '';
        rows.push(curRow);
        curRow = [];
        if (i + 1 < len && csvText[i + 1] === '\n') i++;
        continue;
      }

      if (ch === '\n') {
        curRow.push(curField);
        curField = '';
        rows.push(curRow);
        curRow = [];
        continue;
      }
    }

    // default: append char to current field
    curField += ch;
  }

  // push leftover
  if (curField !== '' || curRow.length > 0) {
    curRow.push(curField);
    rows.push(curRow);
  }

  // Trim trailing empty row (some CSV exports end with newline)
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return rows;
}

/**
 * Convert raw CSV rows to typed TaskRow objects
 * Uses headers from first row (trimmed)
 */
function parseTaskRows(csvData: string[][]): TaskRow[] {
  if (csvData.length === 0) return [];

  const rawHeaders = csvData[0].map(h => (h || '').trim());
  const rows = csvData.slice(1);

  return rows.map(row => {
    const task: any = {};
    rawHeaders.forEach((header, index) => {
      const value = row[index] ?? '';
      if (header === 'xp') {
        task[header] = parseInt(value as string) || 0;
      } else {
        task[header] = value;
      }
    });

    // ensure instructions exists as empty string if not present
    if (!('instructions' in task)) task.instructions = '';

    return task as TaskRow;
  });
}

/**
 * Fetch and parse CSV data from a Google Sheets published URL
 */
export async function fetchTasks(csvUrl: string): Promise<TaskRow[]> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('📊 Using cached CSV data');
        return data;
      }
    }

    console.log('🔄 Fetching CSV data from:', csvUrl);

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const csvData = parseCSV(csvText);
    const tasks = parseTaskRows(csvData);

    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data: tasks,
      timestamp: Date.now()
    }));

    console.log(`✅ Loaded ${tasks.length} tasks from CSV`);
    return tasks;

  } catch (error) {
    console.error('❌ Error fetching CSV data:', error);
    throw error;
  }
}

/**
 * Transform flat task list into hierarchical course/chapter/lesson structure
 * Also converts pdfUrls/tallyUrls into arrays (accepts semicolon or comma)
 */
export function organizeTasks(tasks: TaskRow[]): Course[] {
  const courseMap = new Map<string, Course>();
  const chapterMap = new Map<string, Chapter>();
  const lessonMap = new Map<string, Lesson>();

  tasks.forEach(taskRow => {
    // Create or get course
    if (!courseMap.has(taskRow.courseId)) {
      courseMap.set(taskRow.courseId, {
        id: taskRow.courseId,
        name: taskRow.courseName,
        chapters: []
      });
    }

    // Create or get chapter
    const chapterKey = `${taskRow.courseId}-${taskRow.chapterId}`;
    if (!chapterMap.has(chapterKey)) {
      const chapter: Chapter = {
        id: taskRow.chapterId,
        name: taskRow.chapterName,
        courseId: taskRow.courseId,
        lessons: []
      };
      chapterMap.set(chapterKey, chapter);
      courseMap.get(taskRow.courseId)!.chapters.push(chapter);
    }

    // Create or get lesson
    const lessonKey = `${taskRow.courseId}-${taskRow.chapterId}-${taskRow.lessonId}`;
    if (!lessonMap.has(lessonKey)) {
      const lesson: Lesson = {
        id: taskRow.lessonId,
        name: taskRow.lessonName,
        chapterId: taskRow.chapterId,
        courseId: taskRow.courseId,
        tasks: []
      };
      lessonMap.set(lessonKey, lesson);
      chapterMap.get(chapterKey)!.lessons.push(lesson);
    }

    const splitUrls = (s?: string) => {
      if (!s) return [];
      return String(s).split(/[;|,]/).map(url => url.trim()).filter(Boolean);
    };

    const task: Task = {
      id: taskRow.taskId,
      title: taskRow.taskTitle,
      scenario: taskRow.scenario,
      lessonId: taskRow.lessonId,
      chapterId: taskRow.chapterId,
      courseId: taskRow.courseId,
      resources: {
        pdfs: splitUrls(taskRow.pdfUrls),
        forms: splitUrls(taskRow.tallyUrls),
        answerKey: taskRow.answerKeyUrl || ''
      },
      xp: taskRow.xp,
      instructions: taskRow.instructions ? String(taskRow.instructions).replace(/\\n/g, '\n') : undefined
    };

    lessonMap.get(lessonKey)!.tasks.push(task);
  });

  return Array.from(courseMap.values());
}

/**
 * Get a specific chapter by IDs
 */
export function findChapter(courses: Course[], courseId: string, chapterId: string): Chapter | null {
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  return course.chapters.find(ch => ch.id === chapterId) || null;
}

/**
 * Get a specific lesson by IDs
 */
export function findLesson(courses: Course[], courseId: string, chapterId: string, lessonId: string): Lesson | null {
  const chapter = findChapter(courses, courseId, chapterId);
  if (!chapter) return null;

  return chapter.lessons.find(l => l.id === lessonId) || null;
}

/**
 * Get a specific task by IDs
 */
export function findTask(courses: Course[], courseId: string, chapterId: string, taskId: string): Task | null {
  const chapter = findChapter(courses, courseId, chapterId);
  if (!chapter) return null;

  for (const lesson of chapter.lessons) {
    const task = lesson.tasks.find(t => t.id === taskId);
    if (task) return task;
  }

  return null;
}

/**
 * Calculate progress statistics - FIXED VERSION
 * Now correctly counts only the completed tasks that belong to the given task list
 */
export function calculateProgress(tasks: Task[], completedTaskIds: string[]) {
  const totalTasks = tasks.length;
  const totalXP = tasks.reduce((sum, task) => sum + task.xp, 0);
  
  // ✅ FIXED: Only count completed tasks that are in the given tasks array
  const completedTasksInThisSet = tasks.filter(task => completedTaskIds.includes(task.id));
  const completedTasks = completedTasksInThisSet.length;
  
  // ✅ FIXED: Only calculate XP from tasks that are actually in this set
  const earnedXP = completedTasksInThisSet.reduce((sum, task) => sum + task.xp, 0);

  return {
    totalTasks,
    completedTasks,
    completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    totalXP,
    earnedXP,
    xpPercentage: totalXP > 0 ? (earnedXP / totalXP) * 100 : 0
  };
}

/**
 * Helper functions for managing completed tasks in sessionStorage
 */
export function getCompletedTasks(courseId: string): string[] {
  const completedKey = `course_${courseId}_completed_tasks`;
  const completed = sessionStorage.getItem(completedKey);
  return completed ? JSON.parse(completed) : [];
}

export function markTaskCompleted(courseId: string, taskId: string): void {
  const completedKey = `course_${courseId}_completed_tasks`;
  const existing = sessionStorage.getItem(completedKey);
  const completedTasks = existing ? JSON.parse(existing) : [];
  
  if (!completedTasks.includes(taskId)) {
    completedTasks.push(taskId);
    sessionStorage.setItem(completedKey, JSON.stringify(completedTasks));
  }
}

export function isTaskCompleted(courseId: string, taskId: string): boolean {
  const completedTasks = getCompletedTasks(courseId);
  return completedTasks.includes(taskId);
}

/**
 * Clear cached data (useful for development)
 */
export function clearCache() {
  sessionStorage.removeItem(CACHE_KEY);
  console.log('🧹 CSV cache cleared');
}