import React from 'react';
import { Users, Clock, Flame, Zap, Sparkles } from 'lucide-react';
import type { RoomData, StudentInfo } from '../../types/quiz';

interface StudentLobbyProps {
  room: RoomData;
  student: StudentInfo;
  countdown: number | null;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({
  room,
  student,
  countdown,
}) => {
  const studentsList = Object.values(room.students || {});

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* 3.. 2.. 1.. Countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="text-center animate-bounce">
            <span className="text-8xl sm:text-9xl font-black text-amber-400 font-mono drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]">
              {countdown}
            </span>
            <p className="text-xl sm:text-2xl text-white font-bold mt-4">
              पहला प्रश्न शुरू हो रहा है!
            </p>
          </div>
        </div>
      )}

      {/* Student Badge Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl relative overflow-hidden space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center mx-auto text-4xl shadow-xl shadow-emerald-500/20 animate-pulse">
          {student.avatar}
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
            सफलतापूर्वक जुड़ गए! (Connected)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{student.name}</h1>
          {student.rollNo && (
            <p className="text-sm text-slate-400">{student.rollNo}</p>
          )}
        </div>

        {/* Room Details */}
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>परीक्षा:</span>
            <span className="font-semibold text-white">{room.title}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>विषय / कक्षा:</span>
            <span className="font-semibold text-indigo-300">{room.subject} • {room.targetClass}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>कमरा पिन:</span>
            <span className="font-mono font-bold text-amber-400">{room.pin}</span>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm text-indigo-200 animate-pulse font-medium">
            शिक्षक के क्विज शुरू करने की प्रतीक्षा है... (Waiting for teacher to start)
          </p>
        </div>
      </div>

      {/* Tips & Classmates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Speed Bonus Tip */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>स्पीड बोनस (Speed Bonus):</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            सही उत्तर जितनी जल्दी देंगे, उतने अधिक अंक मिलेंगे (अधिकतम 1000 अंक प्रति प्रश्न)!
          </p>
        </div>

        {/* Streak Tip */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white space-y-2">
          <div className="flex items-center space-x-2 text-orange-400 font-bold text-sm">
            <Flame className="w-4 h-4" />
            <span>लगातार स्ट्रीक (Streak Bonus):</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            लगातार 2 या अधिक सही उत्तर देने पर अतिरिक्त स्ट्रीक बोनस अंक मिलेंगे।
          </p>
        </div>
      </div>

      {/* Classmates in Lobby */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>लॉबी में उपस्थित सहपाठी ({studentsList.length}):</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {studentsList.map((s) => (
            <span
              key={s.id}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 ${
                s.id === student.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
              }`}
            >
              <span>{s.avatar}</span>
              <span>{s.name} {s.id === student.id && '(आप)'}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
