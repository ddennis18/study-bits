export interface StudyBit {
  id: string;
  dayNumber: number;
  title: string;
  summary: string;
  keyTakeaways: string[];
  readingTimeMin: number;
  completed: boolean;
  completedAt?: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
  }[];
}

export interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  deadline: string;
  minutesPerDay: number;
  totalBits: number;
  completedBitsCount: number;
  bits: StudyBit[];
  sourceLength: number; // characters or words parsed
}

export interface UserProfile {
  email: string;
  name: string;
  joinedAt: string;
  activePlanId?: string;
  streakDays: number;
  lastStudiedDate?: string; // string representation of date e.g. YYYY-MM-DD
}
