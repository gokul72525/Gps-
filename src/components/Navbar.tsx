import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Monitor, Users, ExternalLink, HelpCircle } from 'lucide-react';
import { sounds } from '../services/soundEffects';

interface NavbarProps {
  currentView: 'teacher' | 'student';
  onSwitchView: (view: 'teacher' | 'student') => void;
  isConnected: boolean;
  activePin?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSwitchView,
  isConnected,
  activePin,
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const toggleSound = () => {
    sounds.enabled = !soundOn;
    setSoundOn(!soundOn);
    if (!soundOn) sounds.playClick();
  };

  const openStudentTab = () => {
    const url = activePin ? `${window.location.origin}/?pin=${activePin}&role=student` : `${window.location.origin}/?role=student`;
    window.open(url, '_blank');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSwitchView('teacher')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                  ClassPulse
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  लाइव स्कूल क्विज
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                एक साथ सभी लैपटॉप और कंप्यूटर पर लाइव टेस्ट
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                sounds.playClick();
                onSwitchView('teacher');
              }}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === 'teacher'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>शिक्षक मोड (Teacher)</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onSwitchView('student');
              }}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === 'student'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>छात्र मोड (Student)</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Multi-Device Test Helper */}
            <button
              onClick={openStudentTab}
              title="परीक्षण के लिए नई विंडो में छात्र स्क्रीन खोलें"
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>छात्र विंडो खोलें</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              aria-label={soundOn ? 'ध्वनि बंद करें' : 'ध्वनि चालू करें'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={soundOn ? 'Sound On' : 'Sound Muted'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Help / Guide */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="मदद और निर्देश"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Connection Indicator */}
            <div className="flex items-center space-x-1.5 pl-1 sm:pl-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs text-slate-400 hidden lg:inline">
                {isConnected ? 'लाइव सिंक सक्रिय' : 'पुनः कनेक्ट हो रहा है'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <h3 className="text-xl font-bold mb-3 flex items-center space-x-2 text-indigo-300">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              <span>यह ऐप कैसे काम करता है? (How it works)</span>
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="font-semibold text-indigo-400 block mb-1">1. शिक्षक (Teacher) स्क्रीन:</span>
                AI जनरेटर से किसी भी विषय (विज्ञान, गणित, सामान्य ज्ञान) पर प्रश्न बनाएं या प्री-बिल्ट क्विज चुनें। इसके बाद "लाइव क्लास शुरू करें" पर क्लिक करें।
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="font-semibold text-emerald-400 block mb-1">2. 6-अंकों का पिन (Room PIN):</span>
                स्क्रीन पर एक 6-अंकों का कोड दिखाई देगा (जैसे 492104)। अपने स्कूल के बच्चों को यह कोड बताएं या लिंक साझा करें।
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="font-semibold text-amber-400 block mb-1">3. छात्र (Students) अपने लैपटॉप पर:</span>
                छात्र अपने लैपटॉप/कंप्यूटर पर यह पेज खोलकर "छात्र मोड" में अपना नाम और पिन दर्ज करके जुड़ेंगे।
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="font-semibold text-purple-400 block mb-1">4. एक ही समय पर लाइव टेस्ट:</span>
                शिक्षक के शुरू करते ही सभी बच्चों के लैपटॉप पर एक साथ टाइमर और प्रश्न आएगा! प्रश्न समाप्त होते ही तुरंत स्कोर और क्लास लीडरबोर्ड प्रदर्शित होगा।
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
            >
              समझ गया (Got it)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
