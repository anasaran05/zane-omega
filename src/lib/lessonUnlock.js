class LessonUnlockSystem {
  constructor(courseStartDate = '2025-07-23') {
    this.courseStartDate = new Date(courseStartDate);
    this.unlockSchedule = this.generateUnlockSchedule();
  }

  // Generate lesson IDs matching your CSV format
  generateLessonIds() {
    const lessons = [];
    let lessonIndex = 0;

    // Chapter 1: 9 lessons (les_1_1 to les_1_9)
    for (let i = 1; i <= 9; i++) {
      lessons.push({
        id: `les_1_${i}`,
        chapterNumber: 1,
        lessonNumber: i,
        globalIndex: lessonIndex++
      });
    }

    // Chapters 2-12: 10 lessons each (with chapter 5 having 11)
    for (let chapter = 2; chapter <= 12; chapter++) {
      const lessonsInChapter = chapter === 5 ? 11 : 10;
      
      for (let lesson = 1; lesson <= lessonsInChapter; lesson++) {
        lessons.push({
          id: `les_${chapter}_${lesson}`,
          chapterNumber: chapter,
          lessonNumber: lesson,
          globalIndex: lessonIndex++
        });
      }
    }

    return lessons;
  }

  generateUnlockSchedule() {
    const schedule = {};
    const lessons = this.generateLessonIds();
    let currentDate = new Date(this.courseStartDate);
    
    lessons.forEach((lesson, index) => {
      if (index === 0) {
        // First lesson always unlocked (les_1_1)
        schedule[lesson.id] = {
          ...lesson,
          unlockDate: new Date(this.courseStartDate),
          isFirstLesson: true
        };
      } else {
        // Skip to next non-Sunday
        do {
          currentDate.setDate(currentDate.getDate() + 1);
        } while (currentDate.getDay() === 0); // Skip Sundays
        
        schedule[lesson.id] = {
          ...lesson,
          unlockDate: new Date(currentDate),
          isFirstLesson: false
        };
      }
    });

    return schedule;
  }

  // Check if lesson is unlocked based on lesson ID from your CSV
  isLessonUnlockedById(lessonId, currentDate = new Date()) {
    const lesson = this.unlockSchedule[lessonId];
    
    if (!lesson) {
      // If lesson not found in unlock schedule, assume it's unlocked (fallback)
      console.warn(`Lesson ${lessonId} not found in unlock schedule`);
      return true;
    }

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    
    const unlockDate = new Date(lesson.unlockDate);
    unlockDate.setHours(0, 0, 0, 0);
    
    return today >= unlockDate;
  }

  // Get unlock date for a lesson
  getLessonUnlockDate(lessonId) {
    const lesson = this.unlockSchedule[lessonId];
    return lesson ? lesson.unlockDate : null;
  }

  // Get days until unlock
  getDaysUntilUnlock(lessonId, currentDate = new Date()) {
    const unlockDate = this.getLessonUnlockDate(lessonId);
    if (!unlockDate) return 0;
    
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    
    const unlock = new Date(unlockDate);
    unlock.setHours(0, 0, 0, 0);
    
    const diffTime = unlock - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Check if entire chapter is unlocked (at least one lesson available)
  isChapterUnlocked(chapterNumber, lessons, currentDate = new Date()) {
    // At least one lesson in chapter must be unlocked
    return lessons.some(lesson => this.isLessonUnlockedById(lesson.id, currentDate));
  }

  // Debug: Get all lesson IDs in schedule
  getAllLessonIds() {
    return Object.keys(this.unlockSchedule);
  }

  // Debug: Get complete schedule
  getCompleteSchedule() {
    return this.unlockSchedule;
  }
}

// Create singleton instance
export const lessonUnlockSystem = new LessonUnlockSystem('2025-07-24');

// Export helper functions
export const isLessonUnlocked = (lessonId, currentDate) => 
  lessonUnlockSystem.isLessonUnlockedById(lessonId, currentDate);

export const getLessonUnlockDate = (lessonId) => 
  lessonUnlockSystem.getLessonUnlockDate(lessonId);

export const getDaysUntilUnlock = (lessonId, currentDate) => 
  lessonUnlockSystem.getDaysUntilUnlock(lessonId, currentDate);

export const isChapterUnlocked = (chapterNumber, lessons, currentDate) =>
  lessonUnlockSystem.isChapterUnlocked(chapterNumber, lessons, currentDate);

// Debug helpers
export const getAllLessonIds = () => lessonUnlockSystem.getAllLessonIds();
export const getCompleteSchedule = () => lessonUnlockSystem.getCompleteSchedule();

// For testing - log the schedule
console.log('🔓 Lesson Unlock Schedule Generated:');
console.log('📚 Total lessons:', Object.keys(lessonUnlockSystem.unlockSchedule).length);
console.log('🎯 First lesson:', Object.keys(lessonUnlockSystem.unlockSchedule)[0]);
console.log('🎯 Sample unlock dates:');
Object.entries(lessonUnlockSystem.unlockSchedule).slice(0, 5).forEach(([id, lesson]) => {
  console.log(`  ${id}: ${lesson.unlockDate.toDateString()}`);
});

// Test with current date
const today = new Date();
const unlockedToday = Object.keys(lessonUnlockSystem.unlockSchedule).filter(id => 
  lessonUnlockSystem.isLessonUnlockedById(id, today)
);
console.log(`📅 Lessons unlocked as of today (${today.toDateString()}):`, unlockedToday.length);