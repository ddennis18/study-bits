import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, UploadCloud, Calendar, Clock, Sparkles,
  BookOpen, AlertCircle, RefreshCw, Layers, ArrowLeft
} from "lucide-react";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { StudyPlan } from "../types";

interface UploadProps {
  onPlanCreated: (plan: StudyPlan) => void;
  onGoBack: () => void;
}

const formatLocalYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

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
    return formatLocalYYYYMMDD(d);
  });
  const [minutesPerDay, setMinutesPerDay] = useState(30);

  // General status
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState("");
  const [errorReqId, setErrorReqId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDaysCount = (): number => {
    if (!deadlineDate) return 0;
    const parts = deadlineDate.split("-");
    if (parts.length !== 3) return 0;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const target = new Date(year, month, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    if (isNaN(diffTime)) return 0;

    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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
    setErrorReqId("");
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

      let data: any = {};
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.warn("[CLIENT] Response body is not valid JSON", jsonErr);
      }

      clearInterval(stepTimer);

      if (!response.ok) {
        const customErr = new Error(data.error || "Server failed to compile plan. Please try again.");
        (customErr as any).requestId = data.requestId;
        throw customErr;
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
      console.error("[CLIENT_ERROR] Failed during Study Plan generation:", err);
      clearInterval(stepTimer);
      setError(err.message || "An error occurred with Gemini during text organization. Please try again.");
      if (err.requestId) {
        setErrorReqId(err.requestId);
      } else {
        setErrorReqId("");
      }
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
          className="group text-stone-400 hover:text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-stone-900/30 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.2] transition-transform group-hover:-translate-x-0.5 relative -top-[0.5px]" />
          <span>Back to Dashboard</span>
        </button>
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
          <div className="flex-1">
            <div className="font-semibold text-red-350">Plan Compilation Failed</div>
            <div className="mt-1 leading-relaxed text-stone-300">{error}</div>
            {errorReqId && (
              <div className="mt-3 pt-2.5 border-t border-red-900/40 text-[10px] text-stone-400 font-mono tracking-wide">
                <div>Vercel Log Trace Request ID: <strong className="text-red-300 font-bold bg-red-950/40 px-1 py-0.5 rounded select-all font-mono">{errorReqId}</strong></div>
                <div className="mt-1 text-stone-500">Copy this ID and search your Vercel Function logs to see the precise reason Gemini failed.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Left 2 cols: Upload / Paste */}
        <div className="md:col-span-2 bg-stone-900/30 border border-stone-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm flex flex-col justify-between font-sans">
          <div>

            {/* Tab Navigation Headers */}
            <div className="flex gap-6 border-b border-stone-800/80 pb-4 mb-6">
              <button
                onClick={() => {
                  setActiveTab("pdf");
                  setError("");
                }}
                className={`flex items-center gap-2 pb-3.5 text-xs font-bold tracking-wide transition-all duration-200 relative -mb-[17px] border-b-2 cursor-pointer ${activeTab === "pdf"
                  ? "text-white border-white"
                  : "text-stone-500 hover:text-stone-300 border-transparent"
                  }`}
              >
                <Layers className="h-4 w-4" />
                Upload PDF Document
              </button>
              <button
                onClick={() => {
                  setActiveTab("text");
                  setError("");
                }}
                className={`flex items-center gap-2 pb-3.5 text-xs font-bold tracking-wide transition-all duration-200 relative -mb-[17px] border-b-2 cursor-pointer ${activeTab === "text"
                  ? "text-white border-white"
                  : "text-stone-500 hover:text-stone-300 border-transparent"
                  }`}
              >
                <FileText className="h-4 w-4" />
                Paste Study Notes/Text
              </button>
            </div>

            {/* PDF Upload Tab Panel */}
            {activeTab === "pdf" ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group ${isDragActive
                  ? "border-emerald-500 bg-emerald-950/15"
                  : "border-stone-800 hover:border-stone-600 bg-stone-950/20 hover:bg-stone-950/40"
                  } ${pdfFile ? "bg-stone-950/30 border-stone-700/50" : ""}`}
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

                <div className="h-14 w-14 rounded-2xl bg-stone-900 border border-stone-800/80 flex items-center justify-center mb-4 text-stone-400 group-hover:text-stone-200 group-hover:scale-105 transition-all shadow-md">
                  <UploadCloud className="h-6 w-6 stroke-[1.8]" />
                </div>

                {pdfParsing ? (
                  <div className="py-2">
                    <h4 className="text-sm font-semibold text-stone-200 animate-pulse">Parsing document...</h4>
                    <p className="text-[11px] text-stone-500 font-mono mt-1.5">{pdfProgress || "Extracting text content"}</p>
                  </div>
                ) : pdfFile ? (
                  <div className="py-2">
                    <h4 className="text-sm font-bold text-white tracking-tight">{pdfFile.name}</h4>
                    <p className="text-[11px] text-stone-400 mt-1.5">
                      {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • {pdfProgress || "Reading complete"}
                    </p>
                    {pdfText && (
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 bg-emerald-950/35 border border-emerald-900/30 text-emerald-300 text-[10px] font-mono rounded-lg tracking-wide uppercase font-bold">
                          {pdfText.split(/\s+/).length.toLocaleString()} words extracted successfully
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2">
                    <h4 className="text-sm font-bold text-stone-200 tracking-tight">Drag and drop your lecture PDF</h4>
                    <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                      Max 50MB. Text is securely parsed client-side inside your browser.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Paste Text Tab Panel */
              <div>
                <textarea
                  id="pasted_material_box"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste textbook chapters, study summaries, or handwritten notes here. Minimum 100 characters..."
                  rows={8}
                  className="w-full bg-stone-950/40 border border-stone-800 hover:border-stone-700 focus:border-stone-600 focus:ring-1 focus:ring-stone-700 rounded-2xl p-5 text-xs focus:outline-none focus:bg-stone-950/80 transition-all text-stone-100 leading-relaxed font-sans shadow-inner placeholder-stone-600"
                />
                <div className="flex justify-end mt-2 text-[10px] text-stone-500 font-mono tracking-wider">
                  {pastedText.length.toLocaleString()} characters • {pastedText.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </div>
              </div>
            )}
          </div>

          {/* Form Metadata Section (Subject and Plan Title) */}
          <div className="mt-8 border-t border-stone-800/85 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2.5">
                Subject Category
              </label>
              <select
                id="subject_select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-stone-950/40 border border-stone-800 hover:border-stone-700 rounded-xl px-4 py-3 text-xs text-stone-200 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-700 transition-all focus:bg-stone-950/80 cursor-pointer"
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
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2.5">
                Plan Title
              </label>
              <input
                id="plan_title_field"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Bio 201 Midterm Prep"
                className="w-full bg-stone-950/40 border border-stone-800 hover:border-stone-700 rounded-xl px-4 py-3 text-xs text-stone-100 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-700 transition-all focus:bg-stone-950/80 font-medium placeholder-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Right col: Calibrate & Portion Limits */}
        <div className="bg-stone-900/30 border border-stone-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm flex flex-col justify-between font-sans">
          <div>
            {/* Header */}
            <h3 className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-5 flex items-center gap-2 border-b border-stone-800/80 pb-3">
              <Clock className="h-4 w-4 text-stone-400 stroke-[1.8]" />
              Schedule Constraint
            </h3>

            {/* 1. Slider portion */}
            <div className="mb-6 pb-2">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-bold text-stone-500 tracking-wider uppercase">Studying Pace</span>
                <span className="text-sm font-bold text-white font-mono flex items-center gap-1 bg-stone-950/40 border border-stone-800/60 px-2 py-0.5 rounded-lg leading-none">
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
                className="w-full accent-emerald-500 h-1.5 bg-stone-950 border border-stone-800/80 rounded-lg cursor-pointer transition-all"
              />
              <div className="text-[10px] text-stone-500 mt-2 leading-relaxed">
                Portion size scales dynamically to fit your daily study routine.
              </div>
            </div>

            {/* 2. Calendar target date */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-bold text-stone-500 tracking-wider uppercase">Pace Deadline</span>
                {getDaysCount() > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-950/30 border border-emerald-900/35 text-emerald-400 px-2 py-0.5 rounded-lg leading-none uppercase tracking-wide">
                    {getDaysCount()} Days
                  </span>
                )}
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-[13px] h-4 w-4 text-stone-500 stroke-[1.8] pointer-events-none" />
                <input
                  id="deadline_picker"
                  type="date"
                  value={deadlineDate}
                  min={formatLocalYYYYMMDD(new Date(Date.now() + 172800000))} // min 2 days
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-950/40 border border-stone-800 hover:border-stone-700 focus:border-stone-600 focus:ring-1 focus:ring-stone-700 rounded-xl text-xs focus:outline-none focus:bg-stone-950/80 text-stone-100 font-semibold transition-all cursor-pointer"
                />
              </div>
              <div className="text-[10px] text-stone-500 mt-2 leading-relaxed">
                Your material will be logically segmented into exactly <span className="font-bold text-stone-300 font-mono">{getDaysCount()} portions</span> (Day 1 to {getDaysCount()}).
              </div>
            </div>
          </div>

          {/* 3. Main Call to Action Button */}
          <button
            id="generator_trigger_btn"
            onClick={handleGenerate}
            disabled={pdfParsing}
            className="w-full py-3.5 bg-stone-100 text-stone-950 rounded-xl text-xs font-bold tracking-wider shadow-md transition-all flex items-center justify-center gap-2 group select-none cursor-pointer hover:bg-stone-200 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-lg disabled:bg-stone-900 disabled:text-stone-600 disabled:opacity-50 disabled:-translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4 stroke-[1.8] text-emerald-500 animate-pulse" />
            <span>Generate StudyBits Plan</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-emerald-950/10 border border-emerald-900/20 p-4 text-xs text-stone-300 max-w-xl mx-auto leading-relaxed flex items-start gap-3.5">
        <BookOpen className="h-5 w-5 text-emerald-400 shrink-0 stroke-[1.8] mt-0.5" />
        <div className="text-left">
          StudyBits will break down your exact study content, so you have exactly one lesson block for each day between now and your selected exam or project target. <span className="font-semibold text-emerald-400">Perfect pace, no clutter.</span>
        </div>
      </div>
    </div>
  );
}
