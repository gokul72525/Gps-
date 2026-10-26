import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { QuizLibrary } from './components/TeacherDashboard/QuizLibrary';
import { QuizGeneratorModal } from './components/TeacherDashboard/QuizGeneratorModal';
import { LiveHostRoom } from './components/TeacherDashboard/LiveHostRoom';
import { PodiumModal } from './components/PodiumModal';
import { StudentJoin } from './components/StudentArena/StudentJoin';
import { StudentLobby } from './components/StudentArena/StudentLobby';
import { StudentLiveQuestion } from './components/StudentArena/StudentLiveQuestion';
import { StudentResultScreen } from './components/StudentArena/StudentResultScreen';
import { useQuizSocket } from './hooks/useQuizSocket';
import { PREBUILT_QUIZZES } from './data/prebuiltQuizzes';
import type { QuizTemplate } from './types/quiz';
import { sounds } from './services/soundEffects';

export default function App() {
  const [currentView, setCurrentView] = useState<'teacher' | 'student'>('teacher');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('classpulse_saved_quizzes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const prebuiltIds = new Set(PREBUILT_QUIZZES.map((q) => q.id));
          const customQuizzes = parsed.filter((q: QuizTemplate) => !prebuiltIds.has(q.id));
          return [...PREBUILT_QUIZZES, ...customQuizzes];
        }
      }
    } catch (e) {}
    return PREBUILT_QUIZZES;
  });

  const [initialPin, setInitialPin] = useState<string>('');

  const {
    isConnected,
    room,
    studentId,
    currentStudent,
    error,
    countdown,
    lastEndedData,
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
  } = useQuizSocket();

  // Parse URL queries on mount (e.g. ?pin=123456&role=student)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pinParam = params.get('pin');
      const roleParam = params.get('role');

      if (pinParam) {
        setInitialPin(pinParam);
      }

      if (roleParam === 'student' || pinParam) {
        setCurrentView('student');
      } else if (roleParam === 'teacher') {
        setCurrentView('teacher');
      }
    } catch (e) {}
  }, []);

  // Save quizzes to localStorage
  const handleSaveQuizzes = (newQuizzes: QuizTemplate[]) => {
    setQuizzes(newQuizzes);
    try {
      localStorage.setItem('classpulse_saved_quizzes', JSON.stringify(newQuizzes));
    } catch (e) {}
  };

  const handleQuizCreated = (quiz: QuizTemplate, launchDirectly?: boolean) => {
    const updated = [quiz, ...quizzes];
    handleSaveQuizzes(updated);

    if (launchDirectly) {
      createRoom(quiz);
      setCurrentView('teacher');
    }
  };

  const handleDeleteQuiz = (id: string) => {
    const updated = quizzes.filter((q) => q.id !== id);
    handleSaveQuizzes(updated);
    sounds.playClick();
  };

  const handleStartHosting = (quiz: QuizTemplate) => {
    createRoom(quiz);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onSwitchView={(v) => {
          sounds.playClick();
          setCurrentView(v);
        }}
        isConnected={isConnected}
        activePin={room?.pin}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === 'teacher' ? (
          /* TEACHER VIEW */
          room ? (
            <>
              <LiveHostRoom
                room={room}
                countdown={countdown}
                onStartCountdown={() => startCountdown(room.pin)}
                onNextQuestion={() => nextQuestion(room.pin)}
                onRevealAnswer={() => revealAnswer(room.pin)}
                onShowLeaderboard={() => showLeaderboard(room.pin)}
                onFinishQuiz={() => finishQuiz(room.pin)}
                onKickStudent={(id) => kickStudent(room.pin, id)}
                onLeaveRoom={leaveRoom}
              />

              {/* Final Podium Ceremony when finished */}
              {room.state === 'finished' && (
                <PodiumModal
                  room={room}
                  finalPodium={finalPodium}
                  onRestart={leaveRoom}
                />
              )}
            </>
          ) : (
            <>
              <QuizLibrary
                quizzes={quizzes}
                onSelectHostQuiz={handleStartHosting}
                onOpenAIGenerator={() => setIsGeneratorOpen(true)}
                onDeleteQuiz={handleDeleteQuiz}
              />

              <QuizGeneratorModal
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                onQuizCreated={handleQuizCreated}
              />
            </>
          )
        ) : (
          /* STUDENT VIEW */
          !studentId || !room ? (
            <StudentJoin
              initialPin={initialPin}
              onJoin={joinRoom}
              error={error}
            />
          ) : room.state === 'lobby' || room.state === 'countdown' ? (
            <StudentLobby
              room={room}
              student={currentStudent || {
                id: studentId,
                name: 'Student',
                avatar: '🎓',
                score: 0,
                streak: 0,
                connected: true,
                answers: {},
              }}
              countdown={countdown}
            />
          ) : room.state === 'question_active' || room.state === 'question_ended' ? (
            <StudentLiveQuestion
              room={room}
              student={currentStudent || {
                id: studentId,
                name: 'Student',
                avatar: '🎓',
                score: 0,
                streak: 0,
                connected: true,
                answers: {},
              }}
              onSubmitAnswer={(optIdx, timeSpent) => submitAnswer(room.pin, room.currentQuestionIndex, optIdx, timeSpent)}
              lastEndedData={lastEndedData}
            />
          ) : room.state === 'leaderboard' ? (
            <div className="max-w-xl mx-auto py-12 text-center text-white space-y-4">
              <div className="text-5xl animate-bounce">🏆</div>
              <h2 className="text-2xl font-bold">कक्षा लीडरबोर्ड स्क्रीन पर है!</h2>
              <p className="text-slate-400 text-sm">
                शिक्षक की मुख्य स्क्रीन देखें। आपका वर्तमान स्कोर:{' '}
                <span className="text-amber-400 font-bold font-mono">
                  {currentStudent?.score || 0} pts
                </span>
              </p>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-xs text-indigo-300">
                  अगला प्रश्न शीघ्र ही शुरू होगा...
                </p>
              </div>
            </div>
          ) : room.state === 'finished' ? (
            <StudentResultScreen
              room={room}
              student={currentStudent || {
                id: studentId,
                name: 'Student',
                avatar: '🎓',
                score: 0,
                streak: 0,
                connected: true,
                answers: {},
              }}
              onLeave={leaveRoom}
            />
          ) : null
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>ClassPulse — एक ही समय पर स्कूल के बच्चों के लिए लाइव परीक्षा एवं बहुविकल्पीय प्रश्न (MCQ) प्रणाली</p>
      </footer>
    </div>
  );
}
