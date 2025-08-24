/**
 * learning.ts
 *
 * Learning lesson utilities for fetching and organizing topics and quiz data
 * Handles CSV data from Google Sheets for dynamic learning content
 */

export interface TopicRow {
  courseId: string;
  chapterId: string;
  lessonId: string;
  topicId: string;
  topicTitle: string;
  videoUrl: string;
  description: string;
  order: number;
}

export interface Topic {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
  order: number;
  lessonId: string;
  chapterId: string;
  courseId: string;
  youtubeId?: string | null;
}

export interface QuizRow {
  courseId: string;
  chapterId: string;
  lessonId: string;
  topicId: string;
  questionId: string;
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  options?: string; // optional pipe-separated options field
  correctOption?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  lessonId: string;
  topicId: string;
}

const TOPICS_CACHE_KEY = 'learning_topics_data';
const QUIZ_CACHE_KEY = 'learning_quiz_data';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Default CSV URLs (fallback for development)
const TOPICS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQY0i2Sx-BZjlA9e0jwY15h-4JT4Q3tvPFbTM2yqgqG2dTzRGqewryeZjRv-MCSvkD6Dx8JCuXj8ZxS/pub?output=csv';
const QUIZ_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQe58NeZ7swOYrjuXOfTNit7st2UaEjX6c1jHIJQMUGqt7-qQdhHRALvjCJzTI27fNRYAMzc3542eYa/pub?output=csv';

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // direct id
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Robust CSV parser that correctly handles:
 * - quoted fields (")
 * - escaped quotes ("")
 * - commas inside quoted fields
 * - newlines inside quoted fields
 *
 * Returns an array of rows, each row is array of strings (fields).
 */
function parseCSV(csvText: string): string[][] {
  if (!csvText) return [];

  // Remove BOM if present
  csvText = csvText.replace(/^\uFEFF/, '');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      // Escaped double-quote inside a quoted field -> append a single quote and skip next
      currentField += '"';
      i++; // skip the second quote
      continue;
    }

    if (char === '"') {
      // Toggle insideQuotes
      insideQuotes = !insideQuotes;
      continue; // don't append the quote to the field content
    }

    // Comma delimiter (only when not inside quotes)
    if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    // Newline or CR (only when not inside quotes)
    if ((char === '\n' || char === '\r') && !insideQuotes) {
      // If it's CRLF, skip the LF after CR
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      // Push current field & row
      currentRow.push(currentField);
      currentField = '';

      // Only push non-empty row OR allow empty rows? We'll push row even if empty but trim later.
      rows.push(currentRow.map(f => f.trim()));
      currentRow = [];
      continue;
    }

    // Normal character
    currentField += char;
  }

  // End of file: push last field/row (if any)
  currentRow.push(currentField);
  // If last row is not entirely empty, add it
  if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
    rows.push(currentRow.map(f => f.trim()));
  }

  // Trim trailing empty rows
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  // Normalize: if header row exists but some rows shorter than header, fill with ''
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return rows.map(r => {
    if (r.length < maxCols) {
      return r.concat(Array(maxCols - r.length).fill(''));
    }
    return r;
  });
}

/**
 * Convert raw CSV rows to typed TopicRow objects
 */
function parseTopicRows(csvData: string[][]): TopicRow[] {
  if (!csvData || csvData.length === 0) return [];

  const headers = csvData[0].map(h => h.trim());
  const rows = csvData.slice(1);

  const result: TopicRow[] = rows
    .filter(r => r.some(cell => cell !== '')) // skip all-empty rows
    .map(row => {
      const topic: any = {};
      headers.forEach((header, idx) => {
        const key = header;
        let value = row[idx] ?? '';
        // If numeric 'order' ensure number
        if (key.toLowerCase() === 'order') {
          topic[key] = parseInt(value as string, 10) || 0;
        } else {
          topic[key] = (value as string).trim();
        }
      });

      // ensure minimal shape
      return {
        courseId: topic.courseId ?? '',
        chapterId: topic.chapterId ?? '',
        lessonId: topic.lessonId ?? '',
        topicId: topic.topicId ?? '',
        topicTitle: topic.topicTitle ?? topic.title ?? '',
        videoUrl: topic.videoUrl ?? '',
        description: topic.description ?? '',
        order: Number(topic.order ?? 0)
      } as TopicRow;
    });

  return result;
}

/**
 * Convert raw CSV rows to typed QuizRow objects
 */
function parseQuizRows(csvData: string[][]): QuizRow[] {
  if (!csvData || csvData.length === 0) return [];

  const headers = csvData[0].map(h => h.trim());
  const rows = csvData.slice(1);

  const quizRows: QuizRow[] = rows
    .filter(r => r.some(cell => cell !== '')) // skip empty rows
    .map(row => {
      const obj: any = {};
      headers.forEach((header, idx) => {
        const key = header;
        const value = row[idx] ?? '';
        obj[key] = (value as string).trim();
      });

      return {
        courseId: obj.courseId ?? '',
        chapterId: obj.chapterId ?? '',
        lessonId: obj.lessonId ?? '',
        topicId: obj.topicId ?? '',
        questionId: obj.questionId ?? obj.id ?? '',
        question: obj.question ?? '',
        optionA: obj.optionA ?? obj['A'] ?? '',
        optionB: obj.optionB ?? obj['B'] ?? '',
        optionC: obj.optionC ?? obj['C'] ?? '',
        optionD: obj.optionD ?? obj['D'] ?? '',
        options: obj.options ?? '',
        correctOption: (obj.correctOption ?? obj.correct ?? obj.answer ?? '').toString()
      } as QuizRow;
    });

  return quizRows;
}

/**
 * Fetch and parse topics CSV data
 */
export async function fetchTopics(): Promise<TopicRow[]> {
  try {
    const cached = sessionStorage.getItem(TOPICS_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('📊 Using cached topics data');
        return data;
      }
    }

    console.log('🔄 Fetching topics data from CSV');

    const response = await fetch(TOPICS_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch topics CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const csvData = parseCSV(csvText);
    const topics = parseTopicRows(csvData);

    sessionStorage.setItem(
      TOPICS_CACHE_KEY,
      JSON.stringify({
        data: topics,
        timestamp: Date.now()
      })
    );

    console.log(`✅ Loaded ${topics.length} topics from CSV`);
    return topics;
  } catch (error) {
    console.error('❌ Error fetching topics data:', error);
    throw error;
  }
}

/**
 * Fetch and parse quiz CSV data
 */
export async function fetchQuiz(): Promise<QuizRow[]> {
  try {
    const cached = sessionStorage.getItem(QUIZ_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('📊 Using cached quiz data');
        return data;
      }
    }

    console.log('🔄 Fetching quiz data from CSV');

    const response = await fetch(QUIZ_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const csvData = parseCSV(csvText);
    const quiz = parseQuizRows(csvData);

    sessionStorage.setItem(
      QUIZ_CACHE_KEY,
      JSON.stringify({
        data: quiz,
        timestamp: Date.now()
      })
    );

    console.log(`✅ Loaded ${quiz.length} quiz rows from CSV`);
    return quiz;
  } catch (error) {
    console.error('❌ Error fetching quiz data:', error);
    throw error;
  }
}

/**
 * Transform topic rows into organized Topic objects
 */
export function organizeTopics(topicRows: TopicRow[]): Topic[] {
  return topicRows
    .map(row => ({
      id: row.topicId,
      title: row.topicTitle,
      videoUrl: row.videoUrl,
      description: row.description,
      order: row.order,
      lessonId: row.lessonId,
      chapterId: row.chapterId,
      courseId: row.courseId,
      youtubeId: extractYouTubeId(row.videoUrl)
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Transform quiz rows into organized QuizQuestion objects
 */
export function organizeQuiz(quizRows: QuizRow[]): QuizQuestion[] {
  const seenIds = new Set<string>();
  const duplicates: string[] = [];

  const questions = quizRows.map(row => {
    let options: string[] = [];

    // Prefer a single "options" column (pipe-separated)
    if (row.options && typeof row.options === 'string' && row.options.trim() !== '') {
      options = row.options
        .replace(/\r?\n|\r/g, ' ') // collapse newlines into spaces
        .split('|')
        .map(opt => opt.trim().replace(/^([A-D]\)|[A-D]\.)\s*/i, ''))
        .filter(Boolean);
    } else {
      // Fallback to individual option columns (supports blank ones)
      options = [row.optionA ?? '', row.optionB ?? '', row.optionC ?? '', row.optionD ?? '']
        .map(opt => (opt ?? '').trim())
        .filter(Boolean);
    }

    const correctLetter = (row.correctOption ?? '').toString().trim().toUpperCase();
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

    // Add duplicate detection
    if (row.questionId) {
      if (seenIds.has(row.questionId)) {
        duplicates.push(row.questionId);
      } else {
        seenIds.add(row.questionId);
      }
    }

    return {
      id: row.questionId || `${row.lessonId || 'lesson'}_${Math.random().toString(36).slice(2, 9)}`,
      question: row.question ?? '',
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      lessonId: row.lessonId ?? '',
      topicId: row.topicId ?? ''
    } as QuizQuestion;
  });

  if (duplicates.length) {
    // Log unique duplicates
    const uniq = Array.from(new Set(duplicates));
    console.warn(`⚠️ Duplicate questionId(s) found in quiz CSV: ${uniq.join(', ')}. Consider giving each question a unique questionId.`);
  }

  return questions;
}

/**
 * Get topics for a specific lesson
 */
export function getTopicsForLesson(topics: Topic[], lessonId: string): Topic[] {
  return topics.filter(topic => topic.lessonId === lessonId);
}

/**
 * Get quiz questions for a specific lesson
 */
export function getQuizForLesson(quiz: QuizQuestion[], lessonId: string): QuizQuestion[] {
  return quiz.filter(question => question.lessonId === lessonId);
}

/**
 * Progress tracking utilities - updated to use lesson terminology
 */
export function getWatchedTopics(lessonId: string): string[] {
  const key = `lesson_${lessonId}_watchedTopics`;
  const watched = localStorage.getItem(key); // ✅ switched to localStorage
  return watched ? JSON.parse(watched) : [];
}

export function markTopicWatched(lessonId: string, topicId: string): void {
  const watched = getWatchedTopics(lessonId);
  if (!watched.includes(topicId)) {
    watched.push(topicId);
    const key = `lesson_${lessonId}_watchedTopics`;
    localStorage.setItem(key, JSON.stringify(watched)); // ✅ switched to localStorage
  }
}

export function getQuizScore(lessonId: string): number | null {
  const key = `lesson_${lessonId}_quizScore`;
  const score = localStorage.getItem(key); // ✅ switched
  return score ? parseInt(score) : null;
}

export function setQuizScore(lessonId: string, score: number): void {
  const key = `lesson_${lessonId}_quizScore`;
  localStorage.setItem(key, score.toString()); // ✅ switched
}

export function isQuizPassed(lessonId: string): boolean {
  const key = `lesson_${lessonId}_quizPassed`;
  return localStorage.getItem(key) === 'true'; // ✅ switched
}

export function setQuizPassed(lessonId: string, passed: boolean): void {
  const key = `lesson_${lessonId}_quizPassed`;
  localStorage.setItem(key, passed.toString()); // ✅ switched
}


/**
 * Clear learning cache (useful for development)
 */
export function clearLearningCache(): void {
  sessionStorage.removeItem(TOPICS_CACHE_KEY);
  sessionStorage.removeItem(QUIZ_CACHE_KEY);
  console.log('🧹 Learning cache cleared');
}

