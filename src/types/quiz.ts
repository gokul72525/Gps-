export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number; // 0, 1, 2, 3
  explanation?: string;
  timeLimitSeconds: number;
  subject?: string;
  topic?: string;
}

export interface QuizTemplate {
  id: string;
  title: string;
  description: string;
  subject: string;
  targetClass: string;
  language: 'hi' | 'en' | 'bilingual';
  questions: Question[];
  createdAt: number;
}

export interface StudentAnswer {
  selectedIndex: number;
  isCorrect: boolean;
  timeSpentMs: number;
  scoreAwarded: number;
}

export interface StudentInfo {
  id: string;
  name: string;
  rollNo?: string;
  avatar: string;
  score: number;
  streak: number;
  connected: boolean;
  answers: Record<number, StudentAnswer>;
  lastAnswerTime?: number;
}

export type RoomState = 
  | 'lobby'
  | 'countdown'
  | 'question_active'
  | 'question_ended'
  | 'leaderboard'
  | 'finished';

export interface RoomSettings {
  timePerQuestion: number; // seconds fallback
  showLeaderboardAfterEach: boolean;
  shuffleQuestions: boolean;
  pointsMultiplier: number;
}

export interface RoomData {
  pin: string;
  title: string;
  subject: string;
  targetClass: string;
  language: 'hi' | 'en' | 'bilingual';
  state: RoomState;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion?: Question; // Note: for students, correctOptionIndex is hidden during question_active
  questionStartTime?: number;
  questionEndTime?: number;
  countdownSeconds?: number;
  studentsCount: number;
  answeredCount: number;
  students: Record<string, StudentInfo>;
  settings: RoomSettings;
  answerDistribution?: [number, number, number, number];
}

export type SocketMessage =
  // Teacher actions
  | { type: 'TEACHER_CREATE_ROOM'; payload: { quiz: QuizTemplate; settings?: Partial<RoomSettings> } }
  | { type: 'TEACHER_START_COUNTDOWN'; payload: { pin: string } }
  | { type: 'TEACHER_NEXT_QUESTION'; payload: { pin: string; questionIndex?: number } }
  | { type: 'TEACHER_REVEAL_ANSWER'; payload: { pin: string } }
  | { type: 'TEACHER_SHOW_LEADERBOARD'; payload: { pin: string } }
  | { type: 'TEACHER_FINISH_QUIZ'; payload: { pin: string } }
  | { type: 'TEACHER_KICK_STUDENT'; payload: { pin: string; studentId: string } }

  // Student actions
  | { type: 'STUDENT_JOIN_ROOM'; payload: { pin: string; name: string; rollNo?: string; avatar: string } }
  | { type: 'STUDENT_SUBMIT_ANSWER'; payload: { pin: string; studentId: string; questionIndex: number; optionIndex: number; timeSpentMs: number } }
  | { type: 'STUDENT_RECONNECT'; payload: { pin: string; studentId: string } }

  // Server broadcasts
  | { type: 'ROOM_CREATED'; payload: { pin: string; room: RoomData } }
  | { type: 'ROOM_STATE_SYNC'; payload: RoomData }
  | { type: 'STUDENT_JOIN_SUCCESS'; payload: { studentId: string; room: RoomData } }
  | { type: 'STUDENT_JOIN_ERROR'; payload: { message: string } }
  | { type: 'COUNTDOWN_TICK'; payload: { secondsRemaining: number } }
  | { type: 'QUESTION_STARTED'; payload: { question: Omit<Question, 'correctOptionIndex'> & { correctOptionIndex?: number }; questionIndex: number; totalQuestions: number; timeLimitSeconds: number; endTime: number } }
  | { type: 'ANSWER_COUNT_UPDATE'; payload: { answeredCount: number; totalStudents: number } }
  | { type: 'QUESTION_ENDED'; payload: { correctOptionIndex: number; explanation?: string; distribution: [number, number, number, number]; topStudents: Array<{ name: string; score: number; rank: number }> } }
  | { type: 'LEADERBOARD_UPDATE'; payload: { leaderboard: Array<{ id: string; name: string; avatar: string; score: number; streak: number; rank: number }> } }
  | { type: 'QUIZ_FINISHED'; payload: { finalLeaderboard: Array<{ id: string; name: string; rollNo?: string; avatar: string; score: number; totalCorrect: number; rank: number }> } }
  | { type: 'ERROR'; payload: { message: string } };
