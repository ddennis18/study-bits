import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, 
  HelpCircle, ChevronDown, Award, ArrowLeft, 
  BookOpen, Check, X, ShieldAlert 
} from "lucide-react";
import { StudyPlan, StudyBit } from "../types";

interface BitViewProps {
  plan: StudyPlan;
  initialDayNumber: number;
  onMarkBitDone: (dayNumber: number) => void;
  onClose: () => void;
}

export default function BitView({
  plan,
  initialDayNumber,
  onMarkBitDone,
  onClose,
}: BitViewProps) {
  const [currentDay, setCurrentDay] = useState(initialDayNumber);
  const activeBit = plan.bits.find((b) => b.dayNumber === currentDay) || plan.bits[0];

  // Quiz interactive state
  // key of map: questionIndex, value: selectedOptionIndex
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Reset quiz states when day shifts
  useEffect(() => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [currentDay]);

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: oIdx,
    }));
  };

  const handleCheckQuiz = () => {
    if (!activeBit.quiz) return;
    let score = 0;
    activeBit.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const navigateDay = (direction: "prev" | "next") => {
    if (direction === "prev" && currentDay > 1) {
      setCurrentDay((prev) => prev - 1);
    } else if (direction === "next" && currentDay < plan.totalBits) {
      setCurrentDay((prev) => prev + 1);
    }
  };

  const handleMarkDone = () => {
    onMarkBitDone(activeBit.dayNumber);
  };

  const allQuestionsAnswered = activeBit.quiz 
    ? Object.keys(selectedAnswers).length === activeBit.quiz.length
    : true;

  return (
  <div id="bit_view_container" className="max-w-6xl mx-auto px-6 py-10 selection:bg-stone-800 font-sans text-stone-200">
    
    {/* Header Navigation Controls */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-white/5">
      <button
        onClick={onClose}
        className="group text-stone-450 hover:text-stone-100 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors py-1.5 px-3 rounded-xl hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.2] transition-transform group-hover:-translate-x-0.5" />
        Back to Timeline
      </button>

      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
        <button
          onClick={() => navigateDay("prev")}
          disabled={currentDay === 1}
          className="p-2 rounded-xl border border-white/5 bg-stone-950/20 hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent text-stone-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 stroke-[2]" />
        </button>
        
        <span className="text-xs font-bold font-mono text-stone-200 bg-stone-950/20 border border-white/10 px-4 py-2 rounded-xl">
          Portion {currentDay} of {plan.totalBits}
        </span>

        <button
          onClick={() => navigateDay("next")}
          disabled={currentDay === plan.totalBits}
          className="p-2 rounded-xl border border-white/5 bg-stone-950/20 hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent text-stone-300 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 stroke-[2]" />
        </button>
      </div>
    </div>

    {/* Main Reading and Assessment Grid Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left/Center Column: Lesson Content Panel */}
      <div className="lg:col-span-2 space-y-6 min-w-0">
        <div className="bg-stone-900/10 border border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur-sm min-w-0">
          
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold font-mono text-stone-500 uppercase tracking-widest block truncate max-w-[200px] sm:max-w-none">
              {plan.title}
            </span>
            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide border ${
              activeBit.completed 
                ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/20" 
                : "bg-amber-950/20 text-amber-400 border-amber-900/20"
            }`}>
              {activeBit.completed ? "Portion Mastered" : "Active Portion"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
            {activeBit.title}
          </h1>

          {/* Reading notes formatted carefully in tailored container for mobile layout responsiveness */}
          <div className="mt-8 prose prose-sm md:prose-base prose-invert w-full max-w-full break-words overflow-x-hidden text-stone-300 leading-relaxed font-sans space-y-4">
            <Markdown>{activeBit.summary}</Markdown>
          </div>
        </div>
      </div>

      {/* Right side column: Takeaways card, interactive quiz panel, and complete trigger */}
      <div className="space-y-8">
        
        {/* A. REVIEWS & TAKEAWAYS */}
        <div className="bg-stone-900/10 border border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <h3 className="text-xs font-bold text-stone-400 tracking-wider uppercase mb-5 flex items-center gap-2 border-b border-white/5 pb-3">
            <BookOpen className="h-4 w-4 text-stone-400 stroke-[1.8]" />
            Core Portional Takeaways
          </h3>

          <div className="space-y-3">
            {activeBit.keyTakeaways.map((takeaway, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-stone-950/20 border border-white/5 text-xs text-stone-300 leading-relaxed font-semibold">
                <span className="h-5.5 w-5.5 rounded-lg bg-stone-900 text-stone-300 text-[10px] font-bold font-mono flex items-center justify-center shrink-0 border border-white/10">
                  {idx + 1}
                </span>
                <div className="pt-0.5">{takeaway}</div>
              </div>
            ))}
          </div>
        </div>

        {/* B. MULTIPLE CHOICE QUIZ PANEL */}
        {activeBit.quiz && activeBit.quiz.length > 0 && (
          <div className="bg-stone-900/10 border border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur-sm space-y-5 text-stone-100">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold text-stone-400 tracking-wider uppercase flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-stone-400 stroke-[1.8]" />
                Portion Assessment Quiz
              </h3>
              <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">Solve all questions to activate unit completion.</p>
            </div>

            {/* Questions Loop */}
            <div className="space-y-6">
              {activeBit.quiz.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3 border-b border-dashed border-white/5 pb-5 last:border-b-0 last:pb-0">
                  <p className="text-xs font-bold text-stone-200 leading-relaxed">
                    {qIdx + 1}. {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((option, oIdx) => {
                      const isSelected = selectedAnswers[qIdx] === oIdx;
                      const isCorrect = q.correctAnswerIndex === oIdx;

                      let cardStyle = "bg-stone-950/20 border-white/5 text-stone-300";
                      if (quizSubmitted) {
                        if (isCorrect) {
                          cardStyle = "bg-emerald-950/20 border-emerald-900/20 text-emerald-400 font-semibold";
                        } else if (isSelected) {
                          cardStyle = "bg-red-950/20 border-red-900/20 text-red-400";
                        } else {
                          cardStyle = "opacity-25 border-transparent text-stone-500";
                        }
                      } else if (isSelected) {
                        cardStyle = "bg-stone-100 border-stone-100 text-[#0c0a09] font-bold";
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={quizSubmitted}
                          onClick={() => handleSelectOption(qIdx, oIdx)}
                          className={`w-full p-3 rounded-xl border text-left text-xs leading-relaxed transition-all flex items-center justify-between ${
                            !quizSubmitted ? "hover:bg-white/5 cursor-pointer active:scale-[0.99]" : ""
                          } ${cardStyle}`}
                        >
                          <span>{option}</span>
                          {quizSubmitted && (
                            <span className="shrink-0 ml-2">
                              {isCorrect && <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />}
                              {isSelected && !isCorrect && <X className="h-4 w-4 text-red-500 stroke-[3]" />}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quiz Controller submission buttons */}
            <div className="pt-2">
              {!quizSubmitted ? (
                <button
                  disabled={!allQuestionsAnswered}
                  onClick={handleCheckQuiz}
                  className="w-full py-3 bg-stone-100 text-stone-950 rounded-xl text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-900 disabled:text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check My Answers
                </button>
              ) : (
                <div className="text-center p-4 rounded-2xl bg-stone-950/20 border border-white/5">
                  <span className="text-[10px] font-bold text-stone-500 tracking-widest uppercase block">
                    Your Portion Score
                  </span>
                  <span className="text-2xl font-bold font-mono text-white mt-1.5 block">
                    {quizScore} / {activeBit.quiz.length} Correct
                  </span>
                  <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">
                    {quizScore === activeBit.quiz.length 
                      ? "Flawless work! Perfect understanding." 
                      : "Good try! Review the keys and proceed."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* C. FINAL COMPLETION PROGRESS ATTACH */}
        <div className="pt-2">
          {activeBit.completed ? (
            <div className="w-full py-4 bg-emerald-950/20 border border-emerald-900/20 text-emerald-400 rounded-2xl text-center font-bold text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-transparent shrink-0" />
              <span>Portion Completed & Logged</span>
            </div>
          ) : (
            <button
              disabled={activeBit.quiz && activeBit.quiz.length > 0 && !quizSubmitted}
              onClick={handleMarkDone}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-stone-900 disabled:text-stone-600 text-white rounded-2xl font-bold text-xs tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:shadow-none disabled:cursor-not-allowed border border-transparent disabled:border-white/5 disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>Mark Today's Bit Completed</span>
            </button>
          )}
          {activeBit.quiz && activeBit.quiz.length > 0 && !quizSubmitted && (
            <p className="text-[10px] text-stone-500 text-center mt-3 leading-relaxed">
              * Submit the portion assessment quiz first to enable compilation tracking.
            </p>
          )}
        </div>

      </div>

    </div>

  </div>
);
}
