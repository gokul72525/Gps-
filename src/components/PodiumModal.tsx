import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Download, RotateCcw, Award, CheckCircle2, Star, Users } from 'lucide-react';
import type { RoomData } from '../types/quiz';
import { sounds } from '../services/soundEffects';

interface PodiumModalProps {
  room: RoomData;
  finalPodium: Array<{
    id: string;
    name: string;
    rollNo?: string;
    avatar: string;
    score: number;
    totalCorrect: number;
    rank: number;
  }> | null;
  onRestart: () => void;
}

export const PodiumModal: React.FC<PodiumModalProps> = ({
  room,
  finalPodium,
  onRestart,
}) => {
  const students = finalPodium || Object.values(room.students || [])
    .map((s) => {
      let totalCorrect = 0;
      Object.values(s.answers || {}).forEach((a) => {
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
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  const firstPlace = students[0];
  const secondPlace = students[1];
  const thirdPlace = students[2];

  useEffect(() => {
    // Launch celebratory confetti cannon
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const downloadCSV = () => {
    sounds.playClick();
    const headers = ['Rank', 'Student Name', 'Roll Number', 'Score (Points)', 'Correct Answers', 'Total Questions'];
    const rows = students.map((s) => [
      s.rank,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.rollNo || '').replace(/"/g, '""')}"`,
      s.score,
      s.totalCorrect,
      room.totalQuestions,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${room.title.replace(/\s+/g, '_')}_Result.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-b border-slate-800 text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Trophy className="w-4 h-4" />
            <span>अंतिम विजेता पोडियम (Grand Podium)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
            {room.title} - परिणाम
          </h2>
          <p className="text-xs text-slate-400">
            {room.subject} • कुल {room.totalQuestions} प्रश्न • {students.length} छात्र सम्मिलित
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Podium 1st, 2nd, 3rd Standings */}
          {students.length > 0 && (
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-6 pb-2 max-w-xl mx-auto">
              {/* 2nd Place */}
              {secondPlace && (
                <div className="flex flex-col items-center flex-1 space-y-2">
                  <div className="text-3xl sm:text-4xl animate-bounce">
                    🥈
                  </div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-2xl shadow-lg">
                    {secondPlace.avatar}
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-center truncate w-full">
                    {secondPlace.name}
                  </p>
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {secondPlace.score.toLocaleString()} pts
                  </span>
                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-2xl flex items-center justify-center font-black text-xl text-slate-200 shadow-md">
                    #2
                  </div>
                </div>
              )}

              {/* 1st Place (Center and Highest) */}
              {firstPlace && (
                <div className="flex flex-col items-center flex-1 space-y-2 -mt-6">
                  <div className="text-4xl sm:text-5xl animate-bounce">
                    🥇
                  </div>
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20 ring-4 ring-amber-500/30">
                    {firstPlace.avatar}
                  </div>
                  <p className="font-black text-sm sm:text-base text-center truncate w-full text-amber-300">
                    {firstPlace.name}
                  </p>
                  <span className="font-mono text-sm font-extrabold text-amber-400">
                    {firstPlace.score.toLocaleString()} pts
                  </span>
                  <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl flex items-center justify-center font-black text-2xl text-slate-950 shadow-xl">
                    #1
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {thirdPlace && (
                <div className="flex flex-col items-center flex-1 space-y-2">
                  <div className="text-3xl sm:text-4xl animate-bounce">
                    🥉
                  </div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-950/40 border-2 border-amber-700 flex items-center justify-center text-2xl shadow-lg">
                    {thirdPlace.avatar}
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-center truncate w-full">
                    {thirdPlace.name}
                  </p>
                  <span className="font-mono text-xs font-bold text-amber-600">
                    {thirdPlace.score.toLocaleString()} pts
                  </span>
                  <div className="w-full h-18 sm:h-20 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-2xl flex items-center justify-center font-black text-xl text-amber-200 shadow-md">
                    #3
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Classroom Results Table */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>कक्षा परिणाम तालिका (Classroom Scorecard)</span>
              </h3>
              <button
                onClick={downloadCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV रिपोर्ट डाउनलोड करें</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 pl-2">रैंक</th>
                    <th className="pb-2">विद्यार्थी का नाम</th>
                    <th className="pb-2">रोल नंबर</th>
                    <th className="pb-2 text-center">सही उत्तर</th>
                    <th className="pb-2 text-right pr-2">कुल अंक</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 pl-2 font-mono font-bold">
                        {student.rank === 1 ? '🥇 #1' : student.rank === 2 ? '🥈 #2' : student.rank === 3 ? '🥉 #3' : `#${student.rank}`}
                      </td>
                      <td className="py-2.5 font-semibold text-white flex items-center space-x-2">
                        <span>{student.avatar}</span>
                        <span>{student.name}</span>
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {student.rollNo || '-'}
                      </td>
                      <td className="py-2.5 text-center font-mono">
                        <span className="text-emerald-400 font-semibold">{student.totalCorrect}</span>
                        <span className="text-slate-500">/{room.totalQuestions}</span>
                      </td>
                      <td className="py-2.5 text-right pr-2 font-mono font-bold text-amber-400">
                        {student.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Excel / CSV डाउनलोड</span>
          </button>

          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-900/40 flex items-center space-x-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>नई लाइव क्विज शुरू करें</span>
          </button>
        </div>
      </div>
    </div>
  );
};
