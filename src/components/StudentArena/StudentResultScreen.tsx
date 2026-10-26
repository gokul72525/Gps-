import React from 'react';
import { Trophy, CheckCircle2, XCircle, Award, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import type { RoomData, StudentInfo } from '../../types/quiz';

interface StudentResultScreenProps {
  room: RoomData;
  student: StudentInfo;
  onLeave: () => void;
}

export const StudentResultScreen: React.FC<StudentResultScreenProps> = ({
  room,
  student,
  onLeave,
}) => {
  const allStudents = Object.values(room.students || {}).sort((a, b) => b.score - a.score);
  const myRank = allStudents.findIndex((s) => s.id === student.id) + 1;

  let totalCorrect = 0;
  Object.values(student.answers || {}).forEach((a) => {
    if (a.isCorrect) totalCorrect++;
  });

  const accuracy = room.totalQuestions > 0 ? Math.round((totalCorrect / room.totalQuestions) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Top Hero Result Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/40 rounded-3xl p-6 sm:p-10 text-center text-white shadow-2xl relative overflow-hidden space-y-5">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center mx-auto text-5xl shadow-2xl shadow-amber-500/30">
          {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : student.avatar}
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-2">
            परीक्षा सफलतापूर्वक संपन्न!
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold">{student.name}</h1>
          <p className="text-sm text-slate-300 mt-1">{room.title}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
          {/* Rank */}
          <div className="p-3 sm:p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              कक्षा में स्थान
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">
              #{myRank || 1}
            </span>
            <span className="text-[10px] text-slate-500 block">
              of {allStudents.length} छात्र
            </span>
          </div>

          {/* Points */}
          <div className="p-3 sm:p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              कुल अंक
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-indigo-300">
              {student.score.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block">
              pts
            </span>
          </div>

          {/* Accuracy */}
          <div className="p-3 sm:p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              सटीकता (Accuracy)
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
              {accuracy}%
            </span>
            <span className="text-[10px] text-slate-500 block">
              {totalCorrect}/{room.totalQuestions} सही
            </span>
          </div>
        </div>
      </div>

      {/* Questions Review Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg sm:text-xl font-bold">
            प्रश्नों की समीक्षा एवं सही उत्तर (Review & Explanations)
          </h2>
        </div>

        <div className="space-y-4">
          {room.currentQuestion && (
            <p className="text-xs text-slate-400">
              नीचे प्रत्येक प्रश्न का आपका उत्तर और सही उत्तर की व्याख्या दी गई है:
            </p>
          )}

          {Object.entries(student.answers || {}).map(([qIdxStr, ans]) => {
            const qIdx = parseInt(qIdxStr);
            const questionData = (room as any).quiz?.questions?.[qIdx] || room.currentQuestion;

            return (
              <div
                key={qIdx}
                className={`p-4 rounded-2xl border space-y-3 ${
                  ans.isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        ans.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      प्रश्न {qIdx + 1}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {ans.isCorrect ? (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>सही (+{ans.scoreAwarded} pts)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>गलत</span>
                      </span>
                    )}
                  </div>
                </div>

                {questionData && (
                  <p className="text-sm font-semibold text-white">
                    {questionData.question}
                  </p>
                )}

                {questionData?.explanation && (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    💡 व्याख्या: {questionData.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>होम स्क्रीन पर वापस जाएं</span>
          </button>
        </div>
      </div>
    </div>
  );
};
