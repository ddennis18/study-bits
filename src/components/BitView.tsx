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
    <div id="bit_view_container" className="max-w-5xl mx-auto px-4 py-8 selection:bg-stone-800 font-sans">
      
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-8 border-b border-stone-850 pb-5">
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 stroke-[1.8]" />
          Back to Timeline
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay("prev")}
            disabled={currentDay === 1}
            className="p-1.5 rounded-lg border border-stone-800 bg-[#12100f] hover:bg-stone-850 disabled:opacity-20 disabled:hover:bg-[#12100f] text-stone-300 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-xs font-bold font-mono text-stone-200 bg-[#171514] border border-stone-850 px-3 py-1 rounded-lg">
            Portion {currentDay} of {plan.totalBits}
          </span>

          <button
            onClick={() => navigateDay("next")}
            disabled={currentDay === plan.totalBits}
            className="p-1.5 rounded-lg border border-stone-800 bg-[#12100f] hover:bg-stone-850 disabled:opacity-20 disabled:hover:bg-[#12100f] text-stone-300 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Center Column: Lesson content and summary text */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#171514] border border-stone-850 rounded-3xl p-8 shadow-[0_4px_25px_rgba(0,0,0,0.15)]">
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">
                {plan.title.substring(0, 30)}
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                activeBit.completed 
                  ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30" 
                  : "bg-amber-950/20 text-amber-400 border border-amber-900/30"
              }`}>
                {activeBit.completed ? "Portion Mastered" : "Active Portion"}
              </span>
            </div>

            <h1 className="text-2xl font-sans font-bold text-stone-100 tracking-tight leading-snug">
              {activeBit.title}
            </h1>

            {/* Reading notes formatted carefully in tailored container for markdown-body */}
            <div className="mt-6 prose prose-invert max-w-none text-xs text-stone-300/90 leading-relaxed font-sans space-y-4 markdown-body">
              <Markdown>{activeBit.summary}</Markdown>
            </div>
          </div>
        </div>

        {/* Right side column: Takeaways card, interactive quiz panel, and complete trigger */}
        <div className="space-y-6">
          
          {/* A. REVIEWS & TAKEAWAYS */}
          <div className="bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-sans">
            <h3 className="text-xs font-bold text-stone-100 tracking-tight uppercase brand-label mb-3 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-stone-500 stroke-[1.8]" />
              Core Portional Takeaways
            </h3>

            <div className="space-y-3.5 mt-2">
              {activeBit.keyTakeaways.map((takeaway, idx) => (
                <div key={idx} className="flex gap-2.5 items-start p-2.5 rounded-xl bg-[#12100f] border border-stone-800 text-[11px] text-stone-300 leading-relaxed font-semibold">
                  <span className="h-5 w-5 rounded-full bg-stone-800/80 text-stone-200 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>{takeaway}</div>
                </div>
              ))}
            </div>
          </div>

          {/* B. MULTIPLE CHOICE QUIZ PANEL */}
          {activeBit.quiz && activeBit.quiz.length > 0 && (
            <div className="bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] space-y-4 font-sans text-stone-100">
              <div className="border-b border-stone-800 pb-2.5">
                <h3 className="text-xs font-bold text-stone-100 tracking-tight uppercase brand-label flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-stone-500 stroke-[1.8]" />
                  Portion Assessment Quiz
                </h3>
                <p className="text-[9px] text-stone-500 mt-0.5">Solve all questions to activate unit completion.</p>
              </div>

              {/* Questions Loop */}
              <div className="space-y-5">
                {activeBit.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2 border-b border-dashed border-stone-800 pb-4 last:border-b-0 last:pb-0">
                    <p className="text-[11px] font-semibold text-stone-200 leading-snug">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-1.5">
                      {q.options.map((option, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === oIdx;
                        const isCorrect = q.correctAnswerIndex === oIdx;

                        let cardStyle = "bg-[#12100f] border border-stone-800 text-stone-300";
                        if (quizSubmitted) {
                          if (isCorrect) {
                            cardStyle = "bg-emerald-950/20 border-emerald-800/50 text-emerald-400 font-semibold";
                          } else if (isSelected) {
                            cardStyle = "bg-red-950/20 border-red-800/50 text-red-400";
                          } else {
                            cardStyle = "opacity-35 border-stone-900 text-stone-500";
                          }
                        } else if (isSelected) {
                          cardStyle = "bg-stone-100 border-stone-100 text-[#0c0a09] font-bold";
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectOption(qIdx, oIdx)}
                            className={`w-full p-2.5 rounded-xl border text-left text-[11px] leading-snug transition-all flex items-center justify-between ${
                              !quizSubmitted ? "hover:bg-stone-100 active:scale-[0.99] cursor-pointer" : ""
                            } ${cardStyle}`}
                          >
                            <span>{option}</span>
                            {quizSubmitted && (
                              <span>
                                {isCorrect && <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />}
                                {isSelected && !isCorrect && <X className="h-3.5 w-3.5 text-red-600 stroke-[3]" />}
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
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 disabled:bg-[#12100f] disabled:text-stone-605 disabled:text-stone-600 text-[#0c0a09] border border-transparent disabled:border-stone-850 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Check My Answers
                  </button>
                ) : (
                  <div className="text-center p-3 rounded-2xl bg-[#12100f] border border-stone-800">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block label-span">
                      Your Portion Score
                    </span>
                    <span className="text-xl font-bold font-mono text-stone-100 mt-1 block">
                      {quizScore} / {activeBit.quiz.length} Correct
                    </span>
                    <p className="text-[10px] text-stone-400 mt-1.5 italic">
                      {quizScore === activeBit.quiz.length 
                        ? "Flawless work! Perfect understanding." 
                        : "Good try! Review and proceed."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. FINAL COMPLETION PROGRESS ATTACH */}
          <div className="pt-2 font-sans-label">
            {activeBit.completed ? (
              <div className="w-full py-3.5 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-3xl text-center font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-transparent shrink-0" />
                <span>Portion Completed & Logged</span>
              </div>
            ) : (
              <button
                disabled={activeBit.quiz && activeBit.quiz.length > 0 && !quizSubmitted}
                onClick={handleMarkDone}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-555 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-[#12100f] disabled:text-stone-600 text-white rounded-3xl font-semibold text-xs tracking-wide transition-all shadow-[0_4px_15px_rgba(16,185,129,0.05)] flex items-center justify-center gap-1.5 cursor-pointer disabled:shadow-none disabled:cursor-not-allowed border border-transparent disabled:border-stone-850"
              >
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <span>Mark Today's Bit Completed</span>
              </button>
            )}
            {activeBit.quiz && activeBit.quiz.length > 0 && !quizSubmitted && (
              <p className="text-[9px] text-[#dacdc5]/60 text-center mt-2 font-medium">
                * Submit the portion assessment quiz first to enable compilation tracking.
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
