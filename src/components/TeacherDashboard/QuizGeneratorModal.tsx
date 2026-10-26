import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, Clock, Trash2, Plus, ArrowRight, X, AlertCircle } from 'lucide-react';
import type { Question, QuizTemplate } from '../../types/quiz';
import { sounds } from '../../services/soundEffects';

interface QuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated: (quiz: QuizTemplate, launchDirectly?: boolean) => void;
}

const TOPIC_SUGGESTIONS = [
  'पर्यावरण अध्ययन (हमारा परिवेश - EVS)',
  'बुनियादी गणित: जोड़, घटाव एवं पहाड़े (1-5)',
  'उत्तराखंड राज्य ज्ञान: राज्य पुष्प (ब्रह्मकमल), पशु, नदियाँ',
  'पशु, पक्षी और उनके बच्चे एवं बोलियाँ',
  'हिंदी भाषा: विलोम शब्द, पर्यायवाची और सही वर्तनी',
  'पौधे, पेड़ और हमारे फल-फूल',
  'हमारे मददगार (डाकिया, डॉक्टर, शिक्षक, किसान)',
  'आकार, रंग, दिन एवं महीने (Shapes, Colors, Calendar)',
  'दैनिक विज्ञान: जल, वायु और मौसम',
];

export const QuizGeneratorModal: React.FC<QuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  onQuizCreated,
}) => {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('कक्षा 3 (Class 3 - Primary)');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [language, setLanguage] = useState<'hi' | 'en' | 'bilingual'>('hi');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [quizTitle, setQuizTitle] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('कृपया एक विषय या अध्याय का नाम दर्ज करें (Please enter a topic)');
      return;
    }

    setIsLoading(true);
    setError(null);
    sounds.playClick();

    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          grade,
          count,
          difficulty,
          language,
          additionalInstructions,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setGeneratedQuestions(data.questions);
      setQuizTitle(`${topic} - ${grade}`);
      sounds.playCorrect();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'प्रश्न उत्पन्न करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      sounds.playIncorrect();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    if (!generatedQuestions) return;
    const updated = [...generatedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    if (!generatedQuestions) return;
    const updated = [...generatedQuestions];
    const newOptions = [...updated[qIndex].options] as [string, string, string, string];
    newOptions[optIndex] = text;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    setGeneratedQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!generatedQuestions) return;
    if (generatedQuestions.length <= 1) {
      alert('क्विज में कम से कम 1 प्रश्न होना चाहिए।');
      return;
    }
    const updated = generatedQuestions.filter((_, i) => i !== index);
    setGeneratedQuestions(updated);
  };

  const handleAddNewQuestion = () => {
    if (!generatedQuestions) return;
    const newQ: Question = {
      id: `q_custom_${Date.now()}`,
      question: 'नया प्रश्न यहाँ लिखें...',
      options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
      correctOptionIndex: 0,
      explanation: 'सही उत्तर का स्पष्टीकरण यहाँ लिखें।',
      timeLimitSeconds: 30,
      topic,
    };
    setGeneratedQuestions([...generatedQuestions, newQ]);
  };

  const handleSaveAndLaunch = (launchDirectly: boolean) => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;

    const newQuiz: QuizTemplate = {
      id: `quiz_${Date.now()}`,
      title: quizTitle.trim() || `${topic} Quiz`,
      description: `${grade} के लिए ${difficulty} स्तर के वस्तुनिष्ठ प्रश्न`,
      subject: topic,
      targetClass: grade,
      language,
      questions: generatedQuestions,
      createdAt: Date.now(),
    };

    onQuizCreated(newQuiz, launchDirectly);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                {generatedQuestions ? 'उत्पन्न प्रश्नों की समीक्षा एवं संपादन' : 'AI से नए स्कूल MCQ प्रश्न बनाएं'}
              </h2>
              <p className="text-xs text-slate-400">
                {generatedQuestions
                  ? 'आप प्रश्नों, विकल्पों या समय सीमा में कोई भी बदलाव कर सकते हैं'
                  : 'विषय और कक्षा चुनें, Gemini AI सेकंडों में सही उत्तर और व्याख्या सहित प्रश्न तैयार करेगा'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {!generatedQuestions ? (
            /* Generation Form */
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Topic Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  विषय / अध्याय का नाम (Subject or Chapter Topic) *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="उदा. पशु-पक्षी, पहाड़े व गिनती, हमारा परिवेश (EVS), उत्तराखंड ज्ञान, पेड़-पौधे..."
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 outline-none transition-all"
                />

                {/* Topic Suggestions */}
                <div className="mt-3">
                  <span className="text-xs text-slate-400 block mb-2">प्राथमिक स्तर के त्वरित सुझाव (Primary School Topics):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setTopic(item);
                          sounds.playClick();
                        }}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 border border-slate-700/80 rounded-lg transition-colors"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Class & Language & Difficulty Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Grade / Class */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      कक्षा स्तर (Class / Grade)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      कक्षा 1-5 प्राथमिक
                    </span>
                  </div>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <optgroup label="प्राथमिक विद्यालय (Primary School: Class 1 - 5)">
                      <option value="कक्षा 1 (Class 1 - Primary)">कक्षा 1 (Class 1 - बालवाटिका/गिनती/चित्र)</option>
                      <option value="कक्षा 2 (Class 2 - Primary)">कक्षा 2 (Class 2 - प्राथमिक शब्द/जोड़)</option>
                      <option value="कक्षा 3 (Class 3 - Primary)">कक्षा 3 (Class 3 - परिवेश/पहाड़े/हिंदी)</option>
                      <option value="कक्षा 4 (Class 4 - Primary)">कक्षा 4 (Class 4 - गणित/हमारा परिवेश)</option>
                      <option value="कक्षा 5 (Class 5 - Primary)">कक्षा 5 (Class 5 - EVS/बुनियादी विज्ञान)</option>
                    </optgroup>
                    <optgroup label="उच्च प्राथमिक / अन्य (Upper Primary: Class 6 - 10)">
                      <option value="कक्षा 6 (Class 6)">कक्षा 6 (Class 6)</option>
                      <option value="कक्षा 7 (Class 7)">कक्षा 7 (Class 7)</option>
                      <option value="कक्षा 8 (Class 8)">कक्षा 8 (Class 8)</option>
                      <option value="कक्षा 9 (Class 9)">कक्षा 9 (Class 9)</option>
                      <option value="कक्षा 10 (Class 10)">कक्षा 10 (Class 10)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    भाषा (Language)
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="en">English</option>
                    <option value="bilingual">द्विभाषी (Hindi + English)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    कठिनाई स्तर (Difficulty)
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="easy">सरल (Easy - मूलभूत ज्ञान)</option>
                    <option value="medium">मध्यम (Medium - मानक स्तर)</option>
                    <option value="hard">कठिन (Hard - तार्किक/अवधारणात्मक)</option>
                  </select>
                </div>
              </div>

              {/* Number of Questions Slider */}
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-200">
                    प्रश्नों की संख्या (Number of Questions)
                  </label>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm font-bold">
                    {count} प्रश्न
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>3 (त्वरित टेस्ट)</span>
                  <span>5 (आदर्श 5-मिनट क्विज)</span>
                  <span>10 (पूर्ण टेस्ट)</span>
                  <span>15 (विस्तृत परीक्षा)</span>
                </div>
              </div>

              {/* Additional Syllabus Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  अतिरिक्त निर्देश या विशिष्ट अध्याय (वैकल्पिक)
                </label>
                <input
                  type="text"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="उदा. NCERT पैटर्न पर आधारित रखें, संख्यात्मक सवाल शामिल करें..."
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI प्रश्न तैयार कर रहा है... (कृपया कुछ सेकंड प्रतीक्षा करें)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Gemini AI से {count} प्रश्न जनरेट करें</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Review and Edit Questions */
            <div className="space-y-6">
              {/* Quiz Title Bar */}
              <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">क्विज का शीर्षक:</span>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="flex-1 bg-transparent border-b border-indigo-500/50 focus:border-indigo-400 text-sm font-semibold text-white outline-none px-2 py-1"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="p-5 bg-slate-800/50 border border-slate-700/80 rounded-2xl space-y-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">प्रश्न संख्या {qIdx + 1}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <input
                            type="number"
                            min="10"
                            max="120"
                            value={q.timeLimitSeconds}
                            onChange={(e) =>
                              handleQuestionChange(qIdx, 'timeLimitSeconds', parseInt(e.target.value) || 30)
                            }
                            className="w-10 bg-transparent text-right font-mono font-bold text-white outline-none"
                          />
                          <span>सेकंड</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(qIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="यह प्रश्न हटाएं"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Input */}
                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 outline-none"
                    />

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIndex === optIdx;
                        const optionLabels = ['A', 'B', 'C', 'D'];
                        const optionColors = [
                          'bg-rose-500/20 text-rose-300 border-rose-500/40',
                          'bg-blue-500/20 text-blue-300 border-blue-500/40',
                          'bg-amber-500/20 text-amber-300 border-amber-500/40',
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                        ];

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center space-x-2 p-2 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                : 'bg-slate-900/80 border-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-500 text-white border-emerald-400'
                                  : optionColors[optIdx]
                              }`}
                              title={isCorrect ? 'यह सही उत्तर है' : 'इसे सही उत्तर चुनें'}
                            >
                              {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : optionLabels[optIdx]}
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              className="flex-1 bg-transparent text-xs sm:text-sm text-white outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="pt-1">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        💡 व्याख्या (Explanation - प्रश्न समाप्त होने पर छात्रों को दिखाई देगी):
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Question Button */}
              <button
                type="button"
                onClick={handleAddNewQuestion}
                className="w-full py-2.5 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 text-slate-400 hover:text-indigo-300 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>एक और प्रश्न जोड़ें (Add Another Question)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {generatedQuestions ? (
            <>
              <button
                type="button"
                onClick={() => setGeneratedQuestions(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                ← वापस प्रॉम्प्ट बदलें
              </button>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleSaveAndLaunch(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
                >
                  लाइब्रेरी में सहेजें (Save Only)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAndLaunch(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all"
                >
                  <span>⚡ तुरंत लाइव क्लास शुरू करें</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                रद्द करें (Cancel)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
