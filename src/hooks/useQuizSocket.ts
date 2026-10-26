import { useState, useEffect, useRef, useCallback } from 'react';
import type { RoomData, SocketMessage, QuizTemplate, StudentInfo } from '../types/quiz';
import { sounds } from '../services/soundEffects';

export function useQuizSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastEndedData, setLastEndedData] = useState<{
    correctOptionIndex: number;
    explanation?: string;
    distribution: [number, number, number, number];
    topStudents: Array<{ name: string; score: number; rank: number }>;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    score: number;
    streak: number;
    rank: number;
  }> | null>(null);
  const [finalPodium, setFinalPodium] = useState<Array<{
    id: string;
    name: string;
    rollNo?: string;
    avatar: string;
    score: number;
    totalCorrect: number;
    rank: number;
  }> | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activePinRef = useRef<string | null>(null);
  const activeStudentIdRef = useRef<string | null>(null);

  useEffect(() => {
    activePinRef.current = room?.pin || null;
    activeStudentIdRef.current = studentId;
  }, [room?.pin, studentId]);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);

      // Attempt student re-identification if we were in a room
      if (activePinRef.current && activeStudentIdRef.current) {
        ws.send(JSON.stringify({
          type: 'STUDENT_RECONNECT',
          payload: {
            pin: activePinRef.current,
            studentId: activeStudentIdRef.current,
          },
        }));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 2 seconds
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg: SocketMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'ROOM_CREATED':
            setRoom(msg.payload.room);
            setRole('teacher');
            setError(null);
            break;

          case 'ROOM_STATE_SYNC':
            setRoom(msg.payload);
            break;

          case 'STUDENT_JOIN_SUCCESS':
            setStudentId(msg.payload.studentId);
            setRoom(msg.payload.room);
            setRole('student');
            setError(null);
            sounds.playClick();
            break;

          case 'STUDENT_JOIN_ERROR':
            setError(msg.payload.message);
            sounds.playIncorrect();
            break;

          case 'COUNTDOWN_TICK':
            setCountdown(msg.payload.secondsRemaining);
            sounds.playTick(msg.payload.secondsRemaining === 1);
            break;

          case 'QUESTION_STARTED':
            setCountdown(null);
            setLastEndedData(null);
            setLeaderboard(null);
            sounds.playQuestionStart();
            break;

          case 'ANSWER_COUNT_UPDATE':
            setRoom((prev) => prev ? { ...prev, answeredCount: msg.payload.answeredCount } : null);
            break;

          case 'QUESTION_ENDED':
            setLastEndedData(msg.payload);
            break;

          case 'LEADERBOARD_UPDATE':
            setLeaderboard(msg.payload.leaderboard);
            break;

          case 'QUIZ_FINISHED':
            setFinalPodium(msg.payload.finalLeaderboard);
            sounds.playFanfare();
            break;

          case 'ERROR':
            setError(msg.payload.message);
            break;
        }
      } catch (err) {
        console.error('Error handling socket message:', err);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Socket is not connected');
    }
  }, []);

  // Teacher actions
  const createRoom = useCallback((quiz: QuizTemplate, settings?: any) => {
    send({
      type: 'TEACHER_CREATE_ROOM',
      payload: { quiz, settings },
    });
  }, [send]);

  const startCountdown = useCallback((pin: string) => {
    send({
      type: 'TEACHER_START_COUNTDOWN',
      payload: { pin },
    });
  }, [send]);

  const nextQuestion = useCallback((pin: string, questionIndex?: number) => {
    send({
      type: 'TEACHER_NEXT_QUESTION',
      payload: { pin, questionIndex },
    });
  }, [send]);

  const revealAnswer = useCallback((pin: string) => {
    send({
      type: 'TEACHER_REVEAL_ANSWER',
      payload: { pin },
    });
  }, [send]);

  const showLeaderboard = useCallback((pin: string) => {
    send({
      type: 'TEACHER_SHOW_LEADERBOARD',
      payload: { pin },
    });
  }, [send]);

  const finishQuiz = useCallback((pin: string) => {
    send({
      type: 'TEACHER_FINISH_QUIZ',
      payload: { pin },
    });
  }, [send]);

  const kickStudent = useCallback((pin: string, studentIdToKick: string) => {
    send({
      type: 'TEACHER_KICK_STUDENT',
      payload: { pin, studentId: studentIdToKick },
    });
  }, [send]);

  // Student actions
  const joinRoom = useCallback((pin: string, name: string, rollNo?: string, avatar: string = '🎓') => {
    setError(null);
    send({
      type: 'STUDENT_JOIN_ROOM',
      payload: { pin, name, rollNo, avatar },
    });
  }, [send]);

  const submitAnswer = useCallback((pin: string, qIndex: number, optionIndex: number, timeSpentMs: number) => {
    if (!studentId) return;
    send({
      type: 'STUDENT_SUBMIT_ANSWER',
      payload: {
        pin,
        studentId,
        questionIndex: qIndex,
        optionIndex,
        timeSpentMs,
      },
    });
  }, [send, studentId]);

  const leaveRoom = useCallback(() => {
    setRoom(null);
    setStudentId(null);
    setRole(null);
    setCountdown(null);
    setLastEndedData(null);
    setLeaderboard(null);
    setFinalPodium(null);
  }, []);

  const currentStudent: StudentInfo | undefined = (studentId && room?.students)
    ? room.students[studentId]
    : undefined;

  return {
    isConnected,
    room,
    studentId,
    currentStudent,
    role,
    error,
    countdown,
    lastEndedData,
    leaderboard,
    finalPodium,
    createRoom,
    startCountdown,
    nextQuestion,
    revealAnswer,
    showLeaderboard,
    finishQuiz,
    kickStudent,
    joinRoom,
    submitAnswer,
    leaveRoom,
    clearError: () => setError(null),
  };
}
