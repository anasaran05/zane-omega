
/**
 * CSV data fetching and parsing utilities for Google Sheets integration
 * Handles caching and type-safe parsing of course/task data
 */

export interface TaskRow {
  courseId: string;
  courseName: string;
  moduleId: string;
  moduleName: string;
  taskId: string;
  taskTitle: string;
  scenario: string;
  pdfUrls: string; // comma-separated URLs
  tallyUrls: string; // comma-separated URLs  
  answerKeyUrl: string;
  xp: number;
}

export interface Course {
  id: string;
  name: string;
  modules: Module[];
}

export interface Module {
  id: string;
  name: string;
  courseId: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  scenario: string;
  moduleId: string;
  courseId: string;
  resources: {
    pdfs: string[];
    forms: string[];
    answerKey: string;
  };
  xp: number;
}

const CACHE_KEY = 'zane_omega_csv_data';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Simple CSV parser - splits by commas and handles basic quoting
 */
function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    // Simple parsing - assumes no commas within quoted fields for now
    // For production, consider using a proper CSV library
    const fields = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
    result.push(fields);
  }
  
  return result;
}

/**
 * Convert raw CSV rows to typed TaskRow objects
 */
function parseTaskRows(csvData: string[][]): TaskRow[] {
  if (csvData.length === 0) return [];
  
  const headers = csvData[0];
  const rows = csvData.slice(1);
  
  return rows.map(row => {
    const task: any = {};
    headers.forEach((header, index) => {
      const value = row[index] || '';
      
      // Handle special field types
      if (header === 'xp') {
        task[header] = parseInt(value) || 0;
      } else {
        task[header] = value;
      }
    });
    
    return task as TaskRow;
  });
}

/**
 * Fetch and parse CSV data from a Google Sheets published URL
 */
export async function fetchTasks(csvUrl: string): Promise<TaskRow[]> {
  try {
    // Check cache first
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
    
    // Cache the result
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
 * Transform flat task list into hierarchical course/module structure
 */
export function organizeTasks(tasks: TaskRow[]): Course[] {
  const courseMap = new Map<string, Course>();
  const moduleMap = new Map<string, Module>();
  
  tasks.forEach(taskRow => {
    // Create or get course
    if (!courseMap.has(taskRow.courseId)) {
      courseMap.set(taskRow.courseId, {
        id: taskRow.courseId,
        name: taskRow.courseName,
        modules: []
      });
    }
    
    // Create or get module
    const moduleKey = `${taskRow.courseId}-${taskRow.moduleId}`;
    if (!moduleMap.has(moduleKey)) {
      const module: Module = {
        id: taskRow.moduleId,
        name: taskRow.moduleName,
        courseId: taskRow.courseId,
        tasks: []
      };
      moduleMap.set(moduleKey, module);
      courseMap.get(taskRow.courseId)!.modules.push(module);
    }
    
    // Create task
    const task: Task = {
      id: taskRow.taskId,
      title: taskRow.taskTitle,
      scenario: taskRow.scenario,
      moduleId: taskRow.moduleId,
      courseId: taskRow.courseId,
      resources: {
        pdfs: taskRow.pdfUrls ? taskRow.pdfUrls.split(',').map(url => url.trim()) : [],
        forms: taskRow.tallyUrls ? taskRow.tallyUrls.split(',').map(url => url.trim()) : [],
        answerKey: taskRow.answerKeyUrl || ''
      },
      xp: taskRow.xp
    };
    
    moduleMap.get(moduleKey)!.tasks.push(task);
  });
  
  return Array.from(courseMap.values());
}

/**
 * Get a specific task by IDs
 */
export function findTask(courses: Course[], courseId: string, taskId: string): Task | null {
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;
  
  for (const module of course.modules) {
    const task = module.tasks.find(t => t.id === taskId);
    if (task) return task;
  }
  
  return null;
}

/**
 * Get a specific module by IDs
 */
export function findModule(courses: Course[], courseId: string, moduleId: string): Module | null {
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;
  
  return course.modules.find(m => m.id === moduleId) || null;
}

/**
 * Calculate progress statistics
 */
export function calculateProgress(tasks: Task[], completedTaskIds: string[]) {
  const totalTasks = tasks.length;
  const completedTasks = completedTaskIds.length;
  const totalXP = tasks.reduce((sum, task) => sum + task.xp, 0);
  const earnedXP = tasks
    .filter(task => completedTaskIds.includes(task.id))
    .reduce((sum, task) => sum + task.xp, 0);
  
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
 * Clear cached data (useful for development)
 */
export function clearCache() {
  sessionStorage.removeItem(CACHE_KEY);
  console.log('🧹 CSV cache cleared');
}
