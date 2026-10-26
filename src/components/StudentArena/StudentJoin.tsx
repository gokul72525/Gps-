import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, User, Hash, AlertCircle } from 'lucide-react';
import { sounds } from '../../services/soundEffects';

interface StudentJoinProps {
  initialPin?: string;
  onJoin: (pin: string, name: string, rollNo?: string, avatar?: string) => void;
  error?: string | null;
}

const AVATARS = ['🎓', '🚀', '🦁', '⚡', '🌟', '🦊', '🦉', '🐼', '🏆', '🎯', '🐯', '🔥'];

export const StudentJoin: React.FC<StudentJoinProps> = ({
  initialPin = '',
  onJoin,
  error,
}) => {
  const [pin, setPin] = useState(initialPin);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎓');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPin) {
      setPin(initialPin);
    }
  }, [initialPin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\s+/g, '');

    if (!cleanPin || cleanPin.length !== 6) {
      setLocalError('कृपया 6 अंकों का कमरा पिन दर्ज करें (Enter 6-digit PIN)');
      sounds.playIncorrect();
      return;
    }

    if (!name.trim()) {
      setLocalError('कृपया अपना नाम दर्ज करें (Enter your name)');
      sounds.playIncorrect();
      return;
    }

    setLocalError(null);
    sounds.playClick();
    onJoin(cleanPin, name.trim(), rollNo.trim(), selectedAvatar);
  };

  const displayError = error || localError;

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 text-3xl">
            {selectedAvatar}
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
            लाइव परीक्षा में शामिल हों
          </h1>
          <p className="text-xs text-slate-400">
            शिक्षक द्वारा दिया गया 6-अंकों का पिन और अपना नाम दर्ज करें
          </p>
        </div>

        {displayError && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-xs sm:text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              कमरा कोड (Room PIN) *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 492104"
              className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-center font-mono text-2xl font-black tracking-widest text-amber-300 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              आपका पूरा नाम (Your Name) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. राहुल शर्मा (Rahul Sharma)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Roll Number or Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              रोल नंबर या सेक्शन (Roll No / Section - वैकल्पिक)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="उदा. Roll 24, 10th-A"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              अपना अवतार चुनें (Choose Avatar):
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(emoji);
                    sounds.playClick();
                  }}
                  className={`w-11 h-11 text-xl rounded-xl border flex items-center justify-center transition-transform hover:scale-110 ${
                    selectedAvatar === emoji
                      ? 'bg-emerald-500/20 border-emerald-400 scale-105 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <span>परीक्षा में शामिल हों (Join Quiz)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
