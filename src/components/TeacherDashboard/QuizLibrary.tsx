import React, { useState } from 'react';
import { Sparkles, Play, BookOpen, Clock, FileText, CheckCircle2, Trash2, School, MapPin } from 'lucide-react';
import type { QuizTemplate } from '../../types/quiz';
import { sounds } from '../../services/soundEffects';

interface QuizLibraryProps {
  quizzes: QuizTemplate[];
  onSelectHostQuiz: (quiz: QuizTemplate) => void;
  onOpenAIGenerator: () => void;
  onDeleteQuiz?: (id: string) => void;
}

export const QuizLibrary: React.FC<QuizLibraryProps> = ({
  quizzes,
  onSelectHostQuiz,
  onOpenAIGenerator,
  onDeleteQuiz,
}) => {
  const [filter, setFilter] = useState<'all' | 'primary' | 'uttarakhand' | 'upper'>('all');

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (filter === 'primary') {
      return /कक्षा [1-5]|Class [1-5]|Primary/i.test(quiz.targetClass) || /प्राथमिक/i.test(quiz.title);
    }
    if (filter === 'uttarakhand') {
      return /उत्तराखंड|uttarakhand/i.test(quiz.title) || /उत्तराखंड/i.test(quiz.description);
    }
    if (filter === 'upper') {
      return /कक्षा [6-9]|कक्षा 10|Class [6-9]|Class 10/i.test(quiz.targetClass);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner & Generator CTA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/40 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <School className="w-3.5 h-3.5" />
              <span>प्राथमिक विद्यालय विशेष (Class 1 to 5 Focus)</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>उत्तराखंड प्राथमिक शिक्षा</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            कक्षा 1 से 5 के बच्चों के लिए{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              लाइव क्लासरूम क्विज
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            प्राथमिक स्तर (कक्षा 1-5) के छोटे बच्चों के लिए पर्यावरण अध्ययन (EVS), बुनियादी गिनती व पहाड़े, हिंदी शब्द और उत्तराखंड राज्य ज्ञान पर लाइव टेस्ट आयोजित करें। 
            बच्चे अपने लैपटॉप/कंप्यूटर पर PIN डालकर जुड़ेंगे और एक साथ खेल-खेल में उत्तर देंगे।
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAIGenerator();
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>✨ AI से प्राथमिक स्तर के MCQ बनाएं</span>
            </button>
          </div>
        </div>

        {/* Ambient background blur circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-60 h-60 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setFilter('all');
              sounds.playClick();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/80'
            }`}
          >
            सभी क्विज ({quizzes.length})
          </button>
          <button
            onClick={() => {
              setFilter('primary');
              sounds.playClick();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
              filter === 'primary'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/80'
            }`}
          >
            <span>🎒 प्राथमिक स्तर (कक्षा 1-5)</span>
          </button>
          <button
            onClick={() => {
              setFilter('uttarakhand');
              sounds.playClick();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
              filter === 'uttarakhand'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/80'
            }`}
          >
            <span>🏔️ उत्तराखंड विशेष</span>
          </button>
          <button
            onClick={() => {
              setFilter('upper');
              sounds.playClick();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filter === 'upper'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/80'
            }`}
          >
            उच्च प्राथमिक (Class 6+)
          </button>
        </div>

        <span className="text-xs text-slate-400">
          दिख रहे हैं: {filteredQuizzes.length} क्विज
        </span>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredQuizzes.map((quiz) => {
          const totalTime = quiz.questions.reduce((acc, q) => acc + (q.timeLimitSeconds || 30), 0);
          const isPrimary = /कक्षा [1-5]|Class [1-5]|Primary/i.test(quiz.targetClass) || /प्राथमिक/i.test(quiz.title);

          return (
            <div
              key={quiz.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all group hover:-translate-y-1 ${
                isPrimary ? 'border-emerald-500/40 hover:border-emerald-400' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                      isPrimary
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {quiz.targetClass}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>~{Math.round(totalTime / 60)} मि.</span>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{quiz.questions.length} प्रश्न</span>
                  </div>
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {quiz.description || `${quiz.subject} के महत्वपूर्ण प्रश्न`}
                  </p>
                </div>

                {/* Topic tags */}
                <div className="pt-1 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {quiz.subject}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {quiz.language === 'hi' ? 'हिंदी' : quiz.language === 'en' ? 'English' : 'द्विभाषी'}
                  </span>
                  {isPrimary && (
                    <span className="px-2 py-0.5 text-[11px] bg-emerald-950/60 text-emerald-300 rounded border border-emerald-500/30">
                      बाल-सुलभ (Kid-Friendly)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {onDeleteQuiz && !quiz.id.startsWith('quiz_primary_') && !quiz.id.startsWith('quiz_sci_') && (
                  <button
                    onClick={() => onDeleteQuiz(quiz.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="क्विज हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    sounds.playClick();
                    onSelectHostQuiz(quiz);
                  }}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-950 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>⚡ लाइव टेस्ट शुरू करें</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
