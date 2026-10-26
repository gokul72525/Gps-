import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, Flame, Trophy, Sparkles, Check } from 'lucide-react';
import type { RoomData, StudentInfo } from '../../types/quiz';
import { sounds } from '../../services/soundEffects';

interface StudentLiveQuestionProps {
  room: RoomData;
  student: StudentInfo;
  onSubmitAnswer: (optionIndex: number, timeSpentMs: number) => void;
  lastEndedData?: {
    correctOptionIndex: number;
    explanation?: string;
    distribution: [number, number, number, number];
  } | null;
}

export const StudentLiveQuestion: React.FC<StudentLiveQuestionProps> = ({
  room,
  student,
  onSubmitAnswer,
  lastEndedData,
}) => {
  const currentQ = room.currentQuestion;
  const currentQIndex = room.currentQuestionIndex;

  const myAnswer = student.answers[currentQIndex];
  const [selectedOption, setSelectedOption] = useState<number | null>(
    myAnswer !== undefined ? myAnswer.selectedIndex : null
  );

  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [totalTime, setTotalTime] = useState<number>(30);
  const startTimeRef = useRef<number>(Date.now());

  // Reset selected option when question index changes
  useEffect(() => {
    startTimeRef.current = Date.now();
    if (student.answers[currentQIndex] !== undefined) {
      setSelectedOption(student.answers[currentQIndex].selectedIndex);
    } else {
      setSelectedOption(null);
    }
  }, [currentQIndex]);

  // Synchronized countdown timer
  useEffect(() => {
    if (room.state !== 'question_active' || !room.questionEndTime) return;

    const initialTotal = currentQ?.timeLimitSeconds || room.settings.timePerQuestion || 30;
    setTotalTime(initialTotal);

    const updateTimer = () => {
      const remainingMs = Math.max(0, (room.questionEndTime || 0) - Date.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimeLeft(remainingSec);

      if (remainingSec <= 5 && remainingSec > 0 && selectedOption === null) {
        sounds.playTick(remainingSec === 1);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [room.state, room.questionEndTime, currentQ, selectedOption]);

  const handleSelect = (idx: number) => {
    if (selectedOption !== null || room.state !== 'question_active') return;

    setSelectedOption(idx);
    sounds.playClick();

    const timeSpent = Date.now() - (room.questionStartTime || startTimeRef.current);
    onSubmitAnswer(idx, Math.max(100, timeSpent));
  };

  if (!currentQ) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-slate-400">
        प्रश्न लोड हो रहा है...
      </div>
    );
  }

  const isQuestionEnded = room.state === 'question_ended';
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  // Shape indicators & styling for high engagement Kahoot style
  const shapes = [
    { label: '▲', color: 'bg-rose-600 hover:bg-rose-500 border-rose-500', name: 'Option A' },
    { label: '◆', color: 'bg-blue-600 hover:bg-blue-500 border-blue-500', name: 'Option B' },
    { label: '●', color: 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950', name: 'Option C' },
    { label: '■', color: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500', name: 'Option D' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4 space-y-5">
      {/* Top Header: Score, Streak, Question Index */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex items-center justify-between gap-3 shadow-lg">
        {/* Student Avatar & Name */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{student.avatar}</span>
          <div>
            <span className="font-bold text-sm block leading-tight">{student.name}</span>
            <span className="text-[11px] text-slate-400">
              प्रश्न {currentQIndex + 1} / {room.totalQuestions}
            </span>
          </div>
        </div>

        {/* Live Timer or Ended Status */}
        <div className="flex items-center space-x-4">
          {room.state === 'question_active' ? (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl font-mono font-bold text-sm border ${
                timeLeft <= 5
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          ) : (
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700">
              राउंड समाप्त
            </span>
          )}

          {/* Current Score */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-sm text-amber-400">
              {student.score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Synchronized Progress Timer Bar */}
      {room.state === 'question_active' && (
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 rounded-full ${
              timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-center leading-relaxed">
          {currentQ.question}
        </h2>

        {/* 4 Interactive Answer Pads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const shape = shapes[idx];

            let buttonClass = 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-white';

            if (isSelected) {
              buttonClass = 'bg-indigo-600 border-indigo-400 ring-4 ring-indigo-500/30 text-white';
            }

            if (isQuestionEnded) {
              const isCorrect = currentQ.correctOptionIndex === idx;
              if (isCorrect) {
                buttonClass = 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/40 text-white';
              } else if (isSelected && !isCorrect) {
                buttonClass = 'bg-rose-600/60 border-rose-500 opacity-80 text-white';
              } else {
                buttonClass = 'bg-slate-900/60 border-slate-800 opacity-40 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={selectedOption !== null || isQuestionEnded}
                onClick={() => handleSelect(idx)}
                className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group disabled:cursor-not-allowed ${buttonClass}`}
              >
                <div className="flex items-center space-x-3.5">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md border ${shape.color}`}
                  >
                    {shape.label}
                  </span>
                  <span className="text-sm sm:text-base font-bold">
                    {opt}
                  </span>
                </div>

                {isSelected && !isQuestionEnded && (
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-bold text-white flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>चयनित</span>
                  </span>
                )}

                {isQuestionEnded && currentQ.correctOptionIndex === idx && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                )}

                {isQuestionEnded && isSelected && currentQ.correctOptionIndex !== idx && (
                  <XCircle className="w-5 h-5 text-rose-200" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected / Locked Message */}
        {selectedOption !== null && !isQuestionEnded && (
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-center space-y-1">
            <p className="text-sm font-bold text-indigo-300">
              ✓ आपका उत्तर दर्ज कर लिया गया है! (Answer Locked)
            </p>
            <p className="text-xs text-slate-400">
              समय समाप्त होने पर सही उत्तर और आपका स्कोर तुरंत दिखाया जाएगा।
            </p>
          </div>
        )}

        {/* Post-Question Outcome Feedback */}
        {isQuestionEnded && (
          <div className="space-y-4 pt-2">
            {myAnswer ? (
              myAnswer.isCorrect ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="font-extrabold text-base">शाबाश! बिल्कुल सही उत्तर! 🎉</h3>
                      <p className="text-xs text-emerald-300">
                        आपने तेजी से सही उत्तर दिया
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xl font-black text-emerald-300 block">
                      +{myAnswer.scoreAwarded} pts
                    </span>
                    {student.streak > 1 && (
                      <span className="text-[11px] font-bold text-orange-400 flex items-center justify-end space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>{student.streak} Streak!</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                    <div>
                      <h3 className="font-extrabold text-base">ओह! गलत उत्तर</h3>
                      <p className="text-xs text-rose-300">
                        सही उत्तर: {currentQ.options[currentQ.correctOptionIndex]}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-rose-300">
                    +0 pts
                  </span>
                </div>
              )
            ) : (
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-300 flex items-center space-x-3">
                <Clock className="w-6 h-6 text-slate-500" />
                <div>
                  <h3 className="font-bold text-sm">समय समाप्त हो गया था (Time Out)</h3>
                  <p className="text-xs text-slate-400">
                    सही उत्तर: {currentQ.options[currentQ.correctOptionIndex]}
                  </p>
                </div>
              </div>
            )}

            {/* Educational Explanation */}
            {currentQ.explanation && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-300 space-y-1">
                <span className="font-bold text-indigo-300 flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>व्याख्या (Explanation):</span>
                </span>
                <p className="leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 animate-pulse">
                शिक्षक के अगले प्रश्न पर जाने की प्रतीक्षा करें... (Waiting for next question)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
