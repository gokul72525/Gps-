import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  ArrowRight,
  Trophy,
  Clock,
  Sparkles,
  ExternalLink,
  UserX,
  Flame,
  Award,
  BarChart3,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import type { RoomData, StudentInfo } from '../../types/quiz';
import { sounds } from '../../services/soundEffects';

interface LiveHostRoomProps {
  room: RoomData;
  countdown: number | null;
  onStartCountdown: () => void;
  onNextQuestion: () => void;
  onRevealAnswer: () => void;
  onShowLeaderboard: () => void;
  onFinishQuiz: () => void;
  onKickStudent: (studentId: string) => void;
  onLeaveRoom: () => void;
}

export const LiveHostRoom: React.FC<LiveHostRoomProps> = ({
  room,
  countdown,
  onStartCountdown,
  onNextQuestion,
  onRevealAnswer,
  onShowLeaderboard,
  onFinishQuiz,
  onKickStudent,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  const studentsList: StudentInfo[] = Object.values(room.students || {});

  // Synchronized timer calculation
  useEffect(() => {
    if (room.state !== 'question_active' || !room.questionEndTime) {
      return;
    }

    const updateTimer = () => {
      const remainingMs = Math.max(0, (room.questionEndTime || 0) - Date.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimeLeft(remainingSec);

      // Play tick on last 5 seconds
      if (remainingSec <= 5 && remainingSec > 0) {
        sounds.playTick(remainingSec === 1);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [room.state, room.questionEndTime]);

  const copyPin = () => {
    navigator.clipboard.writeText(room.pin);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const copyJoinLink = () => {
    const url = `${window.location.origin}/?pin=${room.pin}&role=student`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const openStudentPreview = () => {
    const url = `${window.location.origin}/?pin=${room.pin}&role=student`;
    window.open(url, '_blank');
  };

  const currentQ = room.currentQuestion;

  return (
    <div className="space-y-6">
      {/* Top Session Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl text-white">
              {room.title}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="text-indigo-400 font-semibold">{room.subject}</span>
              <span>•</span>
              <span>{room.targetClass}</span>
              <span>•</span>
              <span>कुल {room.totalQuestions} प्रश्न</span>
            </div>
          </div>
        </div>

        {/* Big Room PIN display */}
        <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              कमरा कोड (ROOM PIN)
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-widest">
              {room.pin.slice(0, 3)} {room.pin.slice(3)}
            </span>
          </div>

          <div className="flex flex-col space-y-1">
            <button
              onClick={copyPin}
              title="पिन कॉपी करें"
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={openStudentPreview}
              title="छात्र दृश्य नई विंडो में खोलें"
              className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3.. 2.. 1.. Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="text-center animate-bounce">
            <span className="text-8xl sm:text-9xl font-black text-amber-400 font-mono drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]">
              {countdown}
            </span>
            <p className="text-xl sm:text-2xl text-white font-bold mt-4">
              तैयार हो जाएं! प्रश्न आ रहा है...
            </p>
          </div>
        </div>
      )}

      {/* STATE 1: LOBBY (WAITING FOR STUDENTS TO JOIN) */}
      {room.state === 'lobby' && (
        <div className="space-y-6">
          {/* Main Stage Card */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-5">
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>लाइव लॉबी चालू है (Live Room Ready)</span>
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold">
                छात्र अपने लैपटॉप पर शामिल होने के लिए यह PIN दर्ज करें:
              </h2>

              <div className="inline-block bg-slate-950/80 border-2 border-amber-500/50 px-8 py-4 rounded-2xl shadow-2xl">
                <span className="font-mono text-4xl sm:text-6xl font-black tracking-widest text-amber-300">
                  {room.pin}
                </span>
              </div>

              <p className="text-slate-300 text-sm">
                सभी छात्र अपने कंप्यूटर ब्राउज़र पर ऐप खोलकर <strong>छात्र मोड</strong> चुनें और यह पिन डालें।
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={copyJoinLink}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2 transition-colors"
                >
                  <Copy className="w-4 h-4 text-indigo-400" />
                  <span>{copied ? 'लिंक कॉपी हो गया!' : 'छात्रों के लिए डायरेक्ट जॉइन लिंक कॉपी करें'}</span>
                </button>
                <button
                  onClick={openStudentPreview}
                  className="px-4 py-2 bg-indigo-900/40 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-300" />
                  <span>परीक्षण छात्र विंडो खोलें (Test Student Tab)</span>
                </button>
              </div>

              {/* Start Quiz Button */}
              <div className="pt-6">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onStartCountdown();
                  }}
                  disabled={studentsList.length === 0}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-900/50 flex items-center space-x-3 mx-auto transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>
                    {studentsList.length === 0
                      ? 'छात्रों के जुड़ने की प्रतीक्षा है...'
                      : `क्विज शुरू करें (${studentsList.length} छात्र जुड़े हैं)`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Joined Students Live Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>जुड़े हुए विद्यार्थी ({studentsList.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                जैसे ही बच्चे अपना नाम दर्ज करेंगे, वे तुरंत यहाँ दिखाई देंगे
              </span>
            </div>

            {studentsList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Users className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <p className="text-sm">अभी कोई छात्र नहीं जुड़ा है।</p>
                <p className="text-xs">परीक्षण के लिए ऊपर दिए गए "परीक्षण छात्र विंडो खोलें" बटन पर क्लिक करके देख सकते हैं!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {studentsList.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between group hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-2xl shrink-0">{student.avatar}</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {student.name}
                        </p>
                        {student.rollNo && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {student.rollNo}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onKickStudent(student.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="सत्र से निकालें"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 2: QUESTION ACTIVE & STATE 3: QUESTION ENDED */}
      {(room.state === 'question_active' || room.state === 'question_ended') && currentQ && (
        <div className="space-y-6">
          {/* Question Header & Live Progress */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold">
                प्रश्न {room.currentQuestionIndex + 1} / {room.totalQuestions}
              </span>
              {currentQ.topic && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  विषय: {currentQ.topic}
                </span>
              )}
            </div>

            {/* Answered Counter & Timer */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs sm:text-sm font-semibold">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>
                  {room.answeredCount} / {room.studentsCount} ने उत्तर दिया
                </span>
              </div>

              {room.state === 'question_active' ? (
                <div
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
                    timeLeft <= 5
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{timeLeft}s</span>
                </div>
              ) : (
                <span className="px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold">
                  समय समाप्त / राउंड समाप्त
                </span>
              )}
            </div>
          </div>

          {/* Question Presentation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl space-y-8">
            <h2 className="text-xl sm:text-3xl font-extrabold text-center leading-snug max-w-4xl mx-auto">
              {currentQ.question}
            </h2>

            {/* Options Grid (with distribution if question ended) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {currentQ.options.map((opt, idx) => {
                const isCorrect = currentQ.correctOptionIndex === idx;
                const showResults = room.state === 'question_ended';
                const countChose = room.answerDistribution ? room.answerDistribution[idx] : 0;
                const percentChose =
                  room.answeredCount > 0
                    ? Math.round((countChose / room.answeredCount) * 100)
                    : 0;

                const shapeIcons = ['▲', '◆', '●', '■'];
                const shapeColors = [
                  'bg-rose-600 border-rose-500',
                  'bg-blue-600 border-blue-500',
                  'bg-amber-500 border-amber-400 text-slate-950',
                  'bg-emerald-600 border-emerald-500',
                ];

                return (
                  <div
                    key={idx}
                    className={`relative overflow-hidden p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      showResults
                        ? isCorrect
                          ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40'
                          : 'bg-slate-900/60 border-slate-800 opacity-60'
                        : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 z-10">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md border ${shapeColors[idx]}`}
                      >
                        {shapeIcons[idx]}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white">
                        {opt}
                      </span>
                    </div>

                    {/* Result Distribution pill */}
                    {showResults && (
                      <div className="z-10 flex items-center space-x-2">
                        {isCorrect && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[11px] font-bold">
                            सही उत्तर ✓
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-slate-300 font-mono">
                          {countChose} ({percentChose}%)
                        </span>
                      </div>
                    )}

                    {/* Distribution Background Bar */}
                    {showResults && (
                      <div
                        className={`absolute left-0 bottom-0 top-0 opacity-20 pointer-events-none transition-all ${
                          isCorrect ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${percentChose}%` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation box on Question Ended */}
            {room.state === 'question_ended' && currentQ.explanation && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl max-w-4xl mx-auto text-sm text-indigo-200 space-y-1">
                <span className="font-bold flex items-center space-x-1 text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                  <span>अवधारणा एवं व्याख्या (Explanation):</span>
                </span>
                <p className="text-slate-300 leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Teacher Control Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              {room.state === 'question_active' ? (
                <button
                  onClick={() => {
                    sounds.playClick();
                    onRevealAnswer();
                  }}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-900/40 transition-colors"
                >
                  समय पूरा होने से पहले उत्तर प्रकट करें
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onShowLeaderboard();
                    }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-indigo-900/40 flex items-center space-x-2 transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>लीडरबोर्ड देखें (Leaderboard)</span>
                  </button>

                  {room.currentQuestionIndex + 1 < room.totalQuestions ? (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onNextQuestion();
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-emerald-950 flex items-center space-x-2 transition-colors"
                    >
                      <span>अगला प्रश्न →</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onFinishQuiz();
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-pink-950 flex items-center space-x-2 transition-colors"
                    >
                      <Award className="w-5 h-5 text-amber-300" />
                      <span>अंतिम परिणाम देखें (Finish & Podium)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: LEADERBOARD */}
      {room.state === 'leaderboard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-white shadow-2xl space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Trophy className="w-4 h-4" />
              <span>कक्षा स्कोरबोर्ड (Live Class Standings)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              शीर्ष विद्यार्थी (Top Students)
            </h2>
          </div>

          <div className="space-y-2.5">
            {studentsList
              .sort((a, b) => b.score - a.score)
              .slice(0, 8)
              .map((student, idx) => {
                const rankColors = [
                  'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black',
                  'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black',
                  'bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold',
                ];

                return (
                  <div
                    key={student.id}
                    className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between text-white shadow-md hover:border-indigo-500/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow ${
                          rankColors[idx] || 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-2xl">{student.avatar}</span>
                      <div>
                        <p className="font-bold text-sm sm:text-base">{student.name}</p>
                        {student.rollNo && (
                          <p className="text-[11px] text-slate-400">{student.rollNo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {student.streak > 1 && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{student.streak} Streak</span>
                        </span>
                      )}
                      <span className="font-mono font-extrabold text-base sm:text-lg text-amber-400">
                        {student.score.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Action to proceed */}
          <div className="pt-4 flex justify-center">
            {room.currentQuestionIndex + 1 < room.totalQuestions ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  onNextQuestion();
                }}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 text-white font-bold rounded-xl text-base shadow-xl shadow-indigo-900/50 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <span>अगले प्रश्न पर जाएं (Question {room.currentQuestionIndex + 2})</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick();
                  onFinishQuiz();
                }}
                className="px-8 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-bold rounded-xl text-base shadow-xl shadow-pink-900/50 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <Award className="w-5 h-5 text-amber-300" />
                <span>अंतिम विजेता पोडियम देखें (Podium Ceremony)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
