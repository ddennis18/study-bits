import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, UploadCloud, Calendar, Clock, Sparkles, 
  BookOpen, AlertCircle, RefreshCw, Layers 
} from "lucide-react";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { StudyPlan } from "../types";

interface UploadProps {
  onPlanCreated: (plan: StudyPlan) => void;
  onGoBack: () => void;
}

export default function Upload({ onPlanCreated, onGoBack }: UploadProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [activeTab, setActiveTab] = useState<"pdf" | "text">("pdf");
  
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [pdfText, setPdfText] = useState("");
  
  // Text state
  const [pastedText, setPastedText] = useState("");
  
  // Slider and deadline state
  const [deadlineDate, setDeadlineDate] = useState(() => {
    // Default deadline to 10 days from now
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  });
  const [minutesPerDay, setMinutesPerDay] = useState(30);
  
  // General status
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDaysCount = (): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadlineDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processSelectedPdf(files[0]);
    }
  };

  const processSelectedPdf = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please select a high-fidelity PDF file.");
      return;
    }
    setError("");
    setPdfFile(file);
    setPdfParsing(true);
    setPdfText("");

    try {
      const extracted = await extractTextFromPdf(file, (msg) => {
        setPdfProgress(msg);
      });
      setPdfText(extracted);
      // Auto fill title if empty
      if (!projectTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setProjectTitle(nameWithoutExt);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not extract text from PDF. Try copying and pasting the material content.");
      setPdfFile(null);
    } finally {
      setPdfParsing(false);
    }
  };

  // Drag and Drop support
  const [isDragActive, setIsDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedPdf(e.dataTransfer.files[0]);
    }
  };

  const startGenSteps = () => {
    setGenStep(0);
    const intervals = [
      "Securing connection and initializing model...",
      "Parsing and analyzing raw material structure...",
      "Distilling target study bits based on available daily minutes...",
      "Drafting focused lesson modules with rich learning content...",
      "Compiling tailored multiple-choice interactive quiz challenges...",
      "Calibrating daily pace metrics and final timeline integration..."
    ];

    const timer = setInterval(() => {
      setGenStep((prev) => {
        if (prev >= intervals.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 4500);

    return timer;
  };

  const handleGenerate = async () => {
    setError("");
    const textToProcess = activeTab === "pdf" ? pdfText : pastedText;
    const finalTitle = projectTitle.trim() || `${subject} Master Plan`;
    const days = getDaysCount();

    if (!textToProcess.trim()) {
      setError("Please provide some study material (paste text or upload a valid PDF) to proceed.");
      return;
    }

    if (textToProcess.trim().length < 100) {
      setError("Your study material seems too short to build an AI learning course. Please provide a more complete block of context.");
      return;
    }

    if (days < 2) {
      setError("Please choose a study deadline that is at least 2 days in the future to allow daily portion breakdown.");
      return;
    }

    if (days > 45) {
      setError("To guarantee maximum study focus and stay within API token structures, StudyPlan targets a max of 45 days. Please select a closer target.");
      return;
    }

    setGenerating(true);
    const stepTimer = startGenSteps();

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToProcess,
          durationDays: days,
          minutesPerDay: minutesPerDay,
          subject: subject,
          projectTitle: finalTitle,
        }),
      });

      const data = await response.json();
      clearInterval(stepTimer);

      if (!response.ok) {
        throw new Error(data.error || "Server failed to compile plan. Please try again.");
      }

      // Turn output into high-fidelity local state
      const newPlan: StudyPlan = {
        id: "plan_" + Date.now(),
        title: data.planTitle || finalTitle,
        subject: subject,
        createdAt: new Date().toISOString(),
        deadline: deadlineDate,
        minutesPerDay: minutesPerDay,
        totalBits: data.bits.length,
        completedBitsCount: 0,
        sourceLength: textToProcess.length,
        bits: data.bits.map((b: any) => ({
          ...b,
          id: `bit_${Date.now()}_${b.dayNumber}`,
          completed: false,
        })),
      };

      onPlanCreated(newPlan);
    } catch (err: any) {
      console.error(err);
      clearInterval(stepTimer);
      setError(err.message || "An error occurred with Gemini during text organization. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const stepsText = [
    "Securing connection and initializing model...",
    "Parsing and analyzing raw material structure...",
    "Distilling target study bits based on available daily minutes...",
    "Drafting focused lesson modules with rich learning content...",
    "Compiling tailored multiple-choice interactive quiz challenges...",
    "Calibrating daily pace metrics and final timeline integration..."
  ];

  return (
    <div id="upload_container" className="max-w-4xl mx-auto px-4 py-8 selection:bg-stone-850 text-stone-100">
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {generating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-50 flex flex-col justify-center items-center px-4"
          >
            <div className="text-center max-w-sm">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
                <div className="h-16 w-16 bg-[#171514] text-white rounded-2xl flex items-center justify-center border border-stone-800 shadow-xl relative animate-spin">
                  <RefreshCw className="h-7 w-7 text-emerald-400 stroke-[1.5]" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-stone-100 font-sans tracking-tight">Creating Study Bits</h2>
              
              <div className="h-2 w-full bg-stone-850 rounded-full overflow-hidden mt-6 mb-4">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: `${((genStep + 1) / stepsText.length) * 100}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-emerald-500"
                />
              </div>

              <motion.p 
                key={genStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-stone-400 text-xs font-medium tracking-wide h-8"
              >
                {stepsText[genStep]}
              </motion.p>
              
              <span className="text-[10px] text-stone-500 font-mono tracking-wider block mt-4">
                Powered by Gemini 1.5/3.5 Flash
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={onGoBack}
          className="text-stone-400 hover:text-stone-100 text-xs font-medium flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Dashboard
        </button>
        <span className="text-[11px] font-mono text-stone-500 tracking-wider">NEW STUDY CURRICULUM</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-sans tracking-tight font-semibold text-stone-100">Define Your Study Material</h1>
        <p className="text-sm text-stone-400 mt-2 max-w-md mx-auto">
          Set your schedule constraints, drag in a textbook chapter PDF or copy notes. Gemini will construct your exact daily portions.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 mb-6">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 stroke-[1.8]" />
          <div>{error}</div>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Left 2 cols: Upload / Paste */}
        <div className="md:col-span-2 bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex gap-4 border-b border-stone-850 pb-3 mb-4">
              <button
                onClick={() => {
                  setActiveTab("pdf");
                  setError("");
                }}
                className={`flex items-center gap-1.5 pb-2 text-xs font-semibold ${
                  activeTab === "pdf" ? "text-stone-100 border-b-2 border-stone-100" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Upload PDF Document
              </button>
              <button
                onClick={() => {
                  setActiveTab("text");
                  setError("");
                }}
                className={`flex items-center gap-1.5 pb-2 text-xs font-semibold ${
                  activeTab === "text" ? "text-stone-100 border-b-2 border-stone-100" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Paste Study Notes/Text
              </button>
            </div>

            {activeTab === "pdf" ? (
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragActive ? "border-emerald-500 bg-emerald-950/20" : "border-stone-850 hover:border-stone-600"
                } ${pdfFile ? "bg-[#1f1c1a]" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="application/pdf" 
                  className="hidden" 
                />

                <div className="h-12 w-12 rounded-xl bg-stone-850 flex items-center justify-center mb-3 text-stone-400">
                  <UploadCloud className="h-6 w-6 stroke-[1.5]" />
                </div>

                {pdfParsing ? (
                  <div>
                    <h4 className="text-xs font-semibold text-stone-300 animate-pulse">Parsing file...</h4>
                    <p className="text-[10px] text-stone-500 font-mono mt-1">{pdfProgress || "Extracting pages"}</p>
                  </div>
                ) : pdfFile ? (
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">{pdfFile.name}</h4>
                    <p className="text-[10px] text-stone-500 mt-1">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • {pdfProgress || "Reading complete"}</p>
                    {pdfText && (
                      <span className="inline-block mt-3 px-2 py-0.5 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-[9px] font-mono rounded tracking-wider">
                        {pdfText.split(/\s+/).length} WORDS EXTRACTED Successfully
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs font-semibold text-stone-300">Drag or drop study lecture PDF</h4>
                    <p className="text-[10px] text-stone-500 mt-1">Max 50MB structure. Text is parsed client-side.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  id="pasted_material_box"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste textbook chapters, study summaries, or handwritten notes here. Minimum 100 characters..."
                  rows={8}
                  className="w-full bg-[#12100f] border border-stone-800 hover:border-stone-700 focus:border-stone-500 rounded-2xl p-4 text-xs focus:outline-none focus:bg-[#1a1817] transition-all text-stone-100 leading-relaxed font-sans"
                />
                <div className="flex justify-end mt-1.5 label-span text-[10px] text-stone-500 font-mono">
                  {pastedText.length} characters • {pastedText.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-stone-850 pt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Subject Category</label>
              <select
                id="subject_select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#12100f] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-stone-600 focus:bg-[#1c1917]"
              >
                <option value="Biology">Biology / Anatomy</option>
                <option value="Coding">Computer Science & Algorithms</option>
                <option value="History">History & Humanities</option>
                <option value="Mathematics">Mathematics / STEM</option>
                <option value="Business">Business & Economics</option>
                <option value="General">Custom / General Knowledge</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Plan Title</label>
              <input
                id="plan_title_field"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Bio 201 Midterm Prep"
                className="w-full bg-[#12100f] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-stone-600 focus:bg-[#1c1917] font-medium"
              />
            </div>
          </div>
        </div>

        {/* Right col: Calibrate & Portion Limits */}
        <div className="bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-stone-100 tracking-tight uppercase mb-4 brand-label flex items-center gap-1.5 border-b border-stone-850 pb-2">
              <Clock className="h-3.5 w-3.5 text-stone-400 stroke-[1.5]" />
              Schedule Constraint
            </h3>

            {/* Slider portion */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-stone-450">Studying Pace</span>
                <span className="text-sm font-semibold text-stone-200 font-mono flex items-center gap-0.5">
                  {minutesPerDay} <span className="text-[10px] text-stone-500 font-normal">m/day</span>
                </span>
              </div>
              <input
                id="minutes_slider"
                type="range"
                min="5"
                max="120"
                step="5"
                value={minutesPerDay}
                onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                className="w-full accent-stone-105 h-1.5 bg-stone-800 rounded cursor-pointer"
              />
              <div className="text-[9px] text-stone-550 mt-1 max-w-[210px] leading-snug">
                Portion size scales according to your daily available reading capacity.
              </div>
            </div>

            {/* Calendar target date */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-stone-450">Pace Deadline</span>
                <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded leading-none">
                  {getDaysCount() > 0 ? `${getDaysCount()} Days` : ""}
                </span>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-stone-550 stroke-[1.5]" />
                <input
                  id="deadline_picker"
                  type="date"
                  value={deadlineDate}
                  min={new Date(Date.now() + 172800000).toISOString().split("T")[0]} // min 2 days
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#12100f] border border-stone-800 focus:border-stone-600 rounded-xl text-xs focus:outline-none focus:bg-[#1c1917] text-stone-100 font-medium"
                />
              </div>
              <div className="text-[9px] text-stone-500 mt-1">
                Your material will be logically segmented into exactly <span className="font-semibold text-stone-300 font-mono">{getDaysCount()} portions</span> (Day 1 to {getDaysCount()}).
              </div>
            </div>
          </div>

          <button
            id="generator_trigger_btn"
            onClick={handleGenerate}
            disabled={pdfParsing}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 disabled:bg-stone-800 disabled:text-stone-550 text-stone-950 rounded-xl text-xs font-bold tracking-wide shadow-sm transition-all flex items-center justify-center gap-1.5 group select-none cursor-pointer"
          >
            <Sparkles className="h-4 w-4 stroke-[1.5] text-emerald-500 animate-pulse" />
            <span>Generate StudyBits Plan</span>
          </button>
        </div>
      </div>

      <div className="text-center rounded-2xl bg-[#171514]/40 border border-stone-850 p-4 text-[10px] text-stone-505 text-stone-400 max-w-xl mx-auto leading-relaxed flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 stroke-[1.5]" />
        <div>
          StudyBits will break down your exact study content, so you have exactly one lesson block for each day between now and your selected exam or project target. Perfect pace, no clutter.
        </div>
      </div>
    </div>
  );
}
