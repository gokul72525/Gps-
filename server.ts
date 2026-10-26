import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import type { Question, QuizTemplate, RoomData, RoomSettings, StudentInfo, SocketMessage } from './src/types/quiz.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Setup Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface RoomInternal {
  pin: string;
  quiz: QuizTemplate;
  settings: RoomSettings;
  state: RoomData['state'];
  currentQuestionIndex: number;
  questionStartTime?: number;
  questionEndTime?: number;
  countdownTimer?: NodeJS.Timeout;
  questionTimeout?: NodeJS.Timeout;
  students: Map<string, StudentInfo>;
  teacherWs?: WebSocket;
  clientSockets: Map<string, WebSocket>; // studentId -> ws
}

const activeRooms = new Map<string, RoomInternal>();

// Generate 6-digit numeric room pin
function generateRoomPin(): string {
  let pin = '';
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (activeRooms.has(pin));
  return pin;
}

// Convert room internal to public RoomData
function getPublicRoomData(room: RoomInternal, forStudent = false): RoomData {
  const currentQ = room.quiz.questions[room.currentQuestionIndex];
  let safeQuestion: Question | undefined = undefined;

  if (currentQ) {
    if (forStudent && room.state === 'question_active') {
      // Hide correct option from student while question is active to prevent cheating
      safeQuestion = {
        ...currentQ,
        correctOptionIndex: -1,
      };
    } else {
      safeQuestion = currentQ;
    }
  }

  // Calculate answer distribution for current question
  const distribution: [number, number, number, number] = [0, 0, 0, 0];
  let answeredCount = 0;
  room.students.forEach((s) => {
    const ans = s.answers[room.currentQuestionIndex];
    if (ans !== undefined) {
      answeredCount++;
      if (ans.selectedIndex >= 0 && ans.selectedIndex < 4) {
        distribution[ans.selectedIndex]++;
      }
    }
  });

  const studentsObj: Record<string, StudentInfo> = {};
  room.students.forEach((student, id) => {
    studentsObj[id] = { ...student };
  });

  return {
    pin: room.pin,
    title: room.quiz.title,
    subject: room.quiz.subject,
    targetClass: room.quiz.targetClass,
    language: room.quiz.language,
    state: room.state,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.quiz.questions.length,
    currentQuestion: safeQuestion,
    questionStartTime: room.questionStartTime,
    questionEndTime: room.questionEndTime,
    studentsCount: room.students.size,
    answeredCount,
    students: studentsObj,
    settings: room.settings,
    answerDistribution: distribution,
  };
}

// Broadcast to all participants in a room
function broadcastToRoom(pin: string, message: SocketMessage) {
  const room = activeRooms.get(pin);
  if (!room) return;

  const serialized = JSON.stringify(message);

  // Send to teacher
  if (room.teacherWs && room.teacherWs.readyState === WebSocket.OPEN) {
    room.teacherWs.send(serialized);
  }

  // Send to students
  room.clientSockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serialized);
    }
  });
}

// Broadcast room state sync with appropriate question data masking for students
function broadcastRoomSync(pin: string) {
  const room = activeRooms.get(pin);
  if (!room) return;

  const teacherData = getPublicRoomData(room, false);
  const studentData = getPublicRoomData(room, true);

  if (room.teacherWs && room.teacherWs.readyState === WebSocket.OPEN) {
    room.teacherWs.send(JSON.stringify({ type: 'ROOM_STATE_SYNC', payload: teacherData }));
  }

  const studentPayload = JSON.stringify({ type: 'ROOM_STATE_SYNC', payload: studentData });
  room.clientSockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(studentPayload);
    }
  });
}

function handleEndQuestion(pin: string) {
  const room = activeRooms.get(pin);
  if (!room || room.state !== 'question_active') return;

  if (room.questionTimeout) {
    clearTimeout(room.questionTimeout);
    room.questionTimeout = undefined;
  }

  room.state = 'question_ended';

  const q = room.quiz.questions[room.currentQuestionIndex];
  const distribution: [number, number, number, number] = [0, 0, 0, 0];
  room.students.forEach((s) => {
    const ans = s.answers[room.currentQuestionIndex];
    if (ans && ans.selectedIndex >= 0 && ans.selectedIndex < 4) {
      distribution[ans.selectedIndex]++;
    }
  });

  const sortedStudents = Array.from(room.students.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s, idx) => ({ name: s.name, score: s.score, rank: idx + 1 }));

  broadcastToRoom(pin, {
    type: 'QUESTION_ENDED',
    payload: {
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      distribution,
      topStudents: sortedStudents,
    },
  });

  broadcastRoomSync(pin);
}

// Gemini AI MCQ Generation API
app.post('/api/generate-mcq', async (req, res) => {
  try {
    const {
      topic = 'General Science',
      grade = 'Class 8',
      count = 5,
      difficulty = 'medium',
      language = 'hi', // 'hi', 'en', or 'bilingual'
      additionalInstructions = '',
    } = req.body;

    const numQuestions = Math.min(Math.max(parseInt(count) || 5, 1), 25);

    let languagePrompt = 'Questions and options must be in Hindi (Devanagari script), clear and natural for Indian school students.';
    if (language === 'en') {
      languagePrompt = 'Questions and options must be in clear English suitable for school students.';
    } else if (language === 'bilingual') {
      languagePrompt = 'Questions and options must be bilingual: write the question in Hindi followed by English in parentheses, and options similarly clear for bilingual Hindi/English students.';
    }

    const isPrimary = /कक्षा [1-5]|Class [1-5]|Primary/i.test(grade);
    const primaryGuideline = isPrimary
      ? `\nCRITICAL PRIMARY SCHOOL (कक्षा 1 से 5 - प्राथमिक स्तर) GUIDELINES:
- These questions are specifically for young primary school children (Classes 1-5, Primary School in Uttarakhand / India).
- Use very simple, child-friendly, natural Hindi (सरल बाल-सुलभ भाषा) with short, clear sentences.
- For Class 1-2: Focus on basic identification, counting (1-20), common birds/animals, fruits, colors, shapes, simple addition/subtraction.
- For Class 3-5: Focus on Environmental Studies (EVS / हमारा परिवेश), basic math (गिनती, पहाड़े, दैनिक जोड़-घटाव), plants/trees, water, cleanliness, and local context (Uttarakhand state symbols like ब्रह्मकमल, कस्तूरी मृग, हिमालय, नदियाँ).
- Options must be distinct, short and easy for primary kids to read.
- Explanations must be warm, encouraging and joyful (जैसे: "शाबाश! कस्तूरी मृग उत्तराखंड का राज्य पशु है।").\n`
      : '';

    const systemPrompt = `You are an expert school teacher and exam board question creator with deep expertise in primary and elementary education.
Generate high quality Multiple Choice Questions (MCQs) for school tests.
Grade Level: ${grade}
Topic / Chapter: ${topic}
Difficulty: ${difficulty}
Count: ${numQuestions} questions.
Language requirement: ${languagePrompt}
${primaryGuideline}
Additional instructions: ${additionalInstructions || 'Ensure questions test conceptual understanding, clarity, no ambiguity.'}

Each question MUST have:
1. "question": The question text.
2. "options": Array of exactly 4 choices [A, B, C, D].
3. "correctOptionIndex": Integer 0, 1, 2, or 3 representing which option is correct.
4. "explanation": Brief, encouraging explanation for school students explaining why the answer is correct.
5. "timeLimitSeconds": Integer between 20 and 45 seconds suitable for this question.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate ${numQuestions} MCQs on the topic "${topic}" for ${grade}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 4 distinct multiple choice options',
              },
              correctOptionIndex: {
                type: Type.INTEGER,
                description: 'Index of correct option: 0, 1, 2, or 3',
              },
              explanation: {
                type: Type.STRING,
                description: 'Clear educational explanation',
              },
              timeLimitSeconds: {
                type: Type.INTEGER,
                description: 'Time limit in seconds (e.g. 25, 30, 45)',
              },
            },
            required: ['question', 'options', 'correctOptionIndex', 'explanation'],
          },
        },
      },
    });

    const text = response.text || '[]';
    const parsedQuestions = JSON.parse(text);

    // Format questions with unique IDs
    const formattedQuestions: Question[] = parsedQuestions.map((q: any, i: number) => ({
      id: `q_${Date.now()}_${i}`,
      question: q.question,
      options: [
        q.options?.[0] || 'Option A',
        q.options?.[1] || 'Option B',
        q.options?.[2] || 'Option C',
        q.options?.[3] || 'Option D',
      ] as [string, string, string, string],
      correctOptionIndex: typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0 && q.correctOptionIndex <= 3 ? q.correctOptionIndex : 0,
      explanation: q.explanation || 'सही उत्तर को ध्यान से याद रखें।',
      timeLimitSeconds: q.timeLimitSeconds && q.timeLimitSeconds >= 10 ? q.timeLimitSeconds : 30,
      topic,
    }));

    res.json({
      success: true,
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error('Error generating MCQs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate questions with AI',
    });
  }
});

// Room check endpoint
app.get('/api/rooms/:pin', (req, res) => {
  const { pin } = req.params;
  const room = activeRooms.get(pin);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({
    pin: room.pin,
    title: room.quiz.title,
    state: room.state,
    studentsCount: room.students.size,
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  let clientRole: 'teacher' | 'student' | null = null;
  let currentPin: string | null = null;
  let currentStudentId: string | null = null;

  ws.on('message', (rawData) => {
    try {
      const msg: SocketMessage = JSON.parse(rawData.toString());

      switch (msg.type) {
        // Teacher creates a new live quiz room
        case 'TEACHER_CREATE_ROOM': {
          const { quiz, settings } = msg.payload;
          const pin = generateRoomPin();

          const newRoom: RoomInternal = {
            pin,
            quiz,
            settings: {
              timePerQuestion: settings?.timePerQuestion || 30,
              showLeaderboardAfterEach: settings?.showLeaderboardAfterEach ?? true,
              shuffleQuestions: settings?.shuffleQuestions ?? false,
              pointsMultiplier: settings?.pointsMultiplier || 1,
            },
            state: 'lobby',
            currentQuestionIndex: 0,
            students: new Map(),
            teacherWs: ws,
            clientSockets: new Map(),
          };

          activeRooms.set(pin, newRoom);
          clientRole = 'teacher';
          currentPin = pin;

          const publicData = getPublicRoomData(newRoom, false);
          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            payload: { pin, room: publicData },
          }));
          break;
        }

        // Student joins a room
        case 'STUDENT_JOIN_ROOM': {
          const { pin, name, rollNo, avatar } = msg.payload;
          const cleanPin = pin.trim().replace(/\s+/g, '');
          const room = activeRooms.get(cleanPin);

          if (!room) {
            ws.send(JSON.stringify({
              type: 'STUDENT_JOIN_ERROR',
              payload: { message: 'कमरा पिन (Room PIN) अमान्य है या सत्र समाप्त हो चुका है।' },
            }));
            return;
          }

          if (room.state === 'finished') {
            ws.send(JSON.stringify({
              type: 'STUDENT_JOIN_ERROR',
              payload: { message: 'यह परीक्षा/क्विज समाप्त हो चुकी है।' },
            }));
            return;
          }

          const studentId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const student: StudentInfo = {
            id: studentId,
            name: name.trim() || 'Student',
            rollNo: rollNo?.trim() || '',
            avatar: avatar || '🎓',
            score: 0,
            streak: 0,
            connected: true,
            answers: {},
          };

          room.students.set(studentId, student);
          room.clientSockets.set(studentId, ws);

          clientRole = 'student';
          currentPin = cleanPin;
          currentStudentId = studentId;

          const publicData = getPublicRoomData(room, true);
          ws.send(JSON.stringify({
            type: 'STUDENT_JOIN_SUCCESS',
            payload: { studentId, room: publicData },
          }));

          // Notify everyone about new student joining
          broadcastRoomSync(cleanPin);
          break;
        }

        // Student reconnects
        case 'STUDENT_RECONNECT': {
          const { pin, studentId } = msg.payload;
          const cleanPin = pin.trim().replace(/\s+/g, '');
          const room = activeRooms.get(cleanPin);

          if (room && room.students.has(studentId)) {
            const student = room.students.get(studentId)!;
            student.connected = true;
            room.clientSockets.set(studentId, ws);

            clientRole = 'student';
            currentPin = cleanPin;
            currentStudentId = studentId;

            const publicData = getPublicRoomData(room, true);
            ws.send(JSON.stringify({
              type: 'STUDENT_JOIN_SUCCESS',
              payload: { studentId, room: publicData },
            }));

            broadcastRoomSync(cleanPin);
          }
          break;
        }

        // Teacher starts countdown before Question 1
        case 'TEACHER_START_COUNTDOWN': {
          const { pin } = msg.payload;
          const room = activeRooms.get(pin);
          if (!room) return;

          room.state = 'countdown';
          let countdown = 3;

          broadcastToRoom(pin, {
            type: 'COUNTDOWN_TICK',
            payload: { secondsRemaining: countdown },
          });
          broadcastRoomSync(pin);

          const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              broadcastToRoom(pin, {
                type: 'COUNTDOWN_TICK',
                payload: { secondsRemaining: countdown },
              });
            } else {
              clearInterval(interval);
              // Launch question 0
              room.currentQuestionIndex = 0;
              startQuestion(room);
            }
          }, 1000);

          room.countdownTimer = interval;
          break;
        }

        // Teacher moves to next question
        case 'TEACHER_NEXT_QUESTION': {
          const { pin, questionIndex } = msg.payload;
          const room = activeRooms.get(pin);
          if (!room) return;

          if (questionIndex !== undefined) {
            room.currentQuestionIndex = questionIndex;
          } else {
            room.currentQuestionIndex += 1;
          }

          if (room.currentQuestionIndex >= room.quiz.questions.length) {
            // End of quiz
            finishQuiz(room);
          } else {
            startQuestion(room);
          }
          break;
        }

        // Student submits answer
        case 'STUDENT_SUBMIT_ANSWER': {
          const { pin, studentId, questionIndex, optionIndex, timeSpentMs } = msg.payload;
          const room = activeRooms.get(pin);
          if (!room || room.state !== 'question_active') return;
          if (room.currentQuestionIndex !== questionIndex) return;

          const student = room.students.get(studentId);
          if (!student) return;

          // Guard against multiple submissions for the same question
          if (student.answers[questionIndex] !== undefined) return;

          const currentQ = room.quiz.questions[questionIndex];
          const isCorrect = optionIndex === currentQ.correctOptionIndex;

          const totalTimeMs = (currentQ.timeLimitSeconds || 30) * 1000;
          const timeLeftRatio = Math.max(0, (totalTimeMs - timeSpentMs) / totalTimeMs);

          // Kahoot-style scoring: Up to 1000 points (500 base for correct + 500 * time fraction)
          let points = 0;
          if (isCorrect) {
            points = Math.round((500 + 500 * timeLeftRatio) * room.settings.pointsMultiplier);
            student.streak = (student.streak || 0) + 1;
            // Streak bonus
            if (student.streak > 1) {
              points += Math.min(student.streak * 50, 250);
            }
          } else {
            student.streak = 0;
          }

          student.score += points;
          student.answers[questionIndex] = {
            selectedIndex: optionIndex,
            isCorrect,
            timeSpentMs,
            scoreAwarded: points,
          };

          // Count answers
          let totalAnswered = 0;
          room.students.forEach((s) => {
            if (s.answers[questionIndex] !== undefined) totalAnswered++;
          });

          broadcastToRoom(pin, {
            type: 'ANSWER_COUNT_UPDATE',
            payload: {
              answeredCount: totalAnswered,
              totalStudents: room.students.size,
            },
          });

          // If all active students have answered, auto-end question!
          let allAnswered = true;
          room.students.forEach((s) => {
            if (s.connected && s.answers[questionIndex] === undefined) {
              allAnswered = false;
            }
          });

          if (allAnswered && room.students.size > 0) {
            setTimeout(() => {
              handleEndQuestion(pin);
            }, 600);
          }
          break;
        }

        // Teacher reveals answer
        case 'TEACHER_REVEAL_ANSWER': {
          const { pin } = msg.payload;
          handleEndQuestion(pin);
          break;
        }

        // Teacher shows leaderboard
        case 'TEACHER_SHOW_LEADERBOARD': {
          const { pin } = msg.payload;
          const room = activeRooms.get(pin);
          if (!room) return;

          room.state = 'leaderboard';
          const leaderboard = Array.from(room.students.values())
            .sort((a, b) => b.score - a.score)
            .map((s, idx) => ({
              id: s.id,
              name: s.name,
              avatar: s.avatar,
              score: s.score,
              streak: s.streak,
              rank: idx + 1,
            }));

          broadcastToRoom(pin, {
            type: 'LEADERBOARD_UPDATE',
            payload: { leaderboard },
          });
          broadcastRoomSync(pin);
          break;
        }

        // Teacher finishes quiz
        case 'TEACHER_FINISH_QUIZ': {
          const { pin } = msg.payload;
          const room = activeRooms.get(pin);
          if (!room) return;
          finishQuiz(room);
          break;
        }

        // Teacher kicks student
        case 'TEACHER_KICK_STUDENT': {
          const { pin, studentId } = msg.payload;
          const room = activeRooms.get(pin);
          if (room) {
            room.students.delete(studentId);
            const clientWs = room.clientSockets.get(studentId);
            if (clientWs && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'ERROR',
                payload: { message: 'आपको शिक्षक द्वारा सत्र से हटा दिया गया है।' },
              }));
              clientWs.close();
            }
            room.clientSockets.delete(studentId);
            broadcastRoomSync(pin);
          }
          break;
        }
      }
    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  ws.on('close', () => {
    if (clientRole === 'teacher' && currentPin) {
      // Room teacher disconnected, keep room temporarily or mark
    } else if (clientRole === 'student' && currentPin && currentStudentId) {
      const room = activeRooms.get(currentPin);
      if (room) {
        const student = room.students.get(currentStudentId);
        if (student) {
          student.connected = false;
          broadcastRoomSync(currentPin);
        }
      }
    }
  });
});

function startQuestion(room: RoomInternal) {
  if (room.questionTimeout) clearTimeout(room.questionTimeout);

  room.state = 'question_active';
  const q = room.quiz.questions[room.currentQuestionIndex];
  const timeLimit = q.timeLimitSeconds || room.settings.timePerQuestion || 30;

  const now = Date.now();
  room.questionStartTime = now;
  room.questionEndTime = now + timeLimit * 1000;

  // Broadcast question started to all
  broadcastToRoom(room.pin, {
    type: 'QUESTION_STARTED',
    payload: {
      question: {
        id: q.id,
        question: q.question,
        options: q.options,
        timeLimitSeconds: timeLimit,
        topic: q.topic,
      },
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
      timeLimitSeconds: timeLimit,
      endTime: room.questionEndTime,
    },
  });

  broadcastRoomSync(room.pin);

  // Set server timeout to end question automatically when timer expires
  room.questionTimeout = setTimeout(() => {
    handleEndQuestion(room.pin);
  }, timeLimit * 1000 + 400); // 400ms buffer for network sync
}

function finishQuiz(room: RoomInternal) {
  if (room.questionTimeout) clearTimeout(room.questionTimeout);
  if (room.countdownTimer) clearInterval(room.countdownTimer);

  room.state = 'finished';

  const totalQuestions = room.quiz.questions.length;
  const finalLeaderboard = Array.from(room.students.values())
    .map((s) => {
      let totalCorrect = 0;
      Object.values(s.answers).forEach((a) => {
        if (a.isCorrect) totalCorrect++;
      });
      return {
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        avatar: s.avatar,
        score: s.score,
        totalCorrect,
        rank: 0,
      };
    })
    .sort((a, b) => b.score - a.score || b.totalCorrect - a.totalCorrect)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  broadcastToRoom(room.pin, {
    type: 'QUIZ_FINISHED',
    payload: { finalLeaderboard },
  });

  broadcastRoomSync(room.pin);
}

// Development Vite middleware vs Production static serving
const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ClassPulse Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
