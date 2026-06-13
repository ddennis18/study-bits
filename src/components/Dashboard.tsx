import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Plus, GraduationCap, Calendar, 
  Clock, Flame, CheckCircle2, Circle, AlertTriangle, 
  ArrowRight, BookOpen, Layers, Trash2
} from "lucide-react";
import { StudyPlan, UserProfile } from "../types";

interface DashboardProps {
  user: UserProfile;
  plans: StudyPlan[];
  selectedPlanId?: string;
  onSelectPlan: (id: string) => void;
  onTriggerNewPlan: () => void;
  onOpenBitDetail: (dayNumber: number) => void;
  onLogout: () => void;
  onDeletePlan: (id: string) => void;
}

export default function Dashboard({
  user,
  plans,
  selectedPlanId,
  onSelectPlan,
  onTriggerNewPlan,
  onOpenBitDetail,
  onLogout,
  onDeletePlan,
}: DashboardProps) {
  const activePlan = plans.find((p) => p.id === selectedPlanId);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Calculate study stats
  const totalCompletedCount = plans.reduce((acc, p) => acc + p.completedBitsCount, 0);

  // Cramometer logic based on active plan creation time
  const getCramometerPace = (): {
    status: "ahead" | "on-pace" | "lagging";
    message: string;
    level: number; // 0 (good) to 100 (cramming)
    color: string;
  } => {
    if (!activePlan) {
      return { status: "on-pace", message: "Create a study plan to activate.", level: 0, color: "text-stone-400" };
    }

    const createdDate = new Date(activePlan.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - createdDate.getTime();
    const daysSinceCreated = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const expectedCompleted = Math.min(activePlan.totalBits, daysSinceCreated);
    const actualCompleted = activePlan.completedBitsCount;

    if (actualCompleted > expectedCompleted) {
      return {
        status: "ahead",
        message: "Cruising Ahead! You have studied more than your standard calendar requires.",
        level: 10,
        color: "text-emerald-400 bg-emerald-950/35 border-emerald-900/50",
      };
    } else if (actualCompleted === expectedCompleted || expectedCompleted <= 1) {
      return {
        status: "on-pace",
        message: "Perfect Alignment. You are on pace for a relaxed, cram-free deadline.",
        level: 30,
        color: "text-emerald-305 bg-emerald-950/20 border-emerald-900/40",
      };
    } else {
      const bitsBehind = expectedCompleted - actualCompleted;
      const severity = Math.min(100, bitsBehind * 25);
      return {
        status: "lagging",
        message: `Lagging by ${bitsBehind} portion${bitsBehind > 1 ? "s" : ""}. Study today's portion to decrease exam-eve cram duration!`,
        level: severity,
        color: "text-amber-400 bg-amber-950/20 border-amber-900/50",
      };
    }
  };

  const pace = getCramometerPace();

  // Find today's ideal bit to study (first incomplete bit, or day N if all done)
  const getTodayBit = () => {
    if (!activePlan) return null;
    const incomplete = activePlan.bits.find((b) => !b.completed);
    if (incomplete) return incomplete;
    return activePlan.bits[activePlan.bits.length - 1]; // fallback if all completed
  };

  const todayBit = getTodayBit();

  return (
    <div id="dashboard_page" className="max-w-6xl mx-auto px-4 py-8 select-none selection:bg-stone-850 text-stone-100">
      
      {/* Top Banner Shell */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-stone-850">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-stone-105 bg-stone-100 text-[#0c0a09] font-mono font-bold tracking-widest px-2 py-0.5 rounded leading-none uppercase">
              STUDYBITS CORE V1.0
            </span>
            {user.streakDays > 0 && (
              <span className="text-[10px] text-amber-300 bg-amber-950/40 font-mono font-bold px-2 py-0.5 rounded leading-none flex items-center gap-0.5 border border-amber-900/50">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-500 animate-pulse" />
                {user.streakDays} DAY STREAK
              </span>
            )}
          </div>
          <h1 className="text-2xl font-sans font-semibold text-stone-101 text-stone-100 tracking-tight mt-1.5">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            No scheduling decisions. Just master the single bit waiting for you below.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerNewPlan}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-[#0c0a09] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer select-none"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            New Course
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 border border-stone-800 hover:bg-stone-900 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-100 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        /* Empty Dashboard state */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#171514] border border-stone-850 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-[0_4px_30px_rgba(0,0,0,0.15)]"
        >
          <div className="h-14 w-14 bg-stone-900 text-stone-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-stone-800">
            <Layers className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-stone-100 tracking-tight">No Active Study Plans</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-2 leading-relaxed">
            Upload custom course materials and set your schedule. StudyBits will divide and structure them into micro portions. Zero cramming, guaranteed.
          </p>
          <button
            id="empty_dashboard_create_btn"
            onClick={onTriggerNewPlan}
            className="mt-6 inline-flex py-3 px-6 bg-stone-100 hover:bg-stone-200 text-stone-950 text-xs font-bold rounded-xl tracking-wide shadow-sm items-center gap-1.5 transition-all group select-none cursor-pointer"
          >
            <Sparkles className="h-4 w-4 stroke-[1.5] text-emerald-500 animate-pulse" />
            <span>Generate Your First Plan</span>
          </button>
        </motion.div>
      ) : (
        /* Active Study App dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main left and center: Daily study workflow & timeline */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. SELECT CORRESPONDING ACTIVE PLAN */}
            <div id="course_tabs_container" className="flex items-center gap-3 bg-[#23201e] p-1.5 rounded-2xl border border-stone-800 overflow-x-auto whitespace-nowrap scrollbar-none">
              {plans.map((p) => (
                <button
                  key={p.id}
                  id={`course_tab_${p.id}`}
                  onClick={() => onSelectPlan(p.id)}
                  className={`course-tab-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    p.id === selectedPlanId
                      ? "course-tab-active bg-[#332f2c] text-stone-100 shadow-sm border border-stone-800"
                      : "course-tab-inactive text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {activePlan ? (
              <>
                {/* 2. TODAY'S FOCUSED PORTION VIEW */}
                <div className="bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-300"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                        PORTION WAITING
                      </span>
                      <h2 className="text-lg font-semibold font-sans tracking-tight text-stone-105 text-stone-100 mt-2">
                        {todayBit ? `Day ${todayBit.dayNumber}: ${todayBit.title}` : "All units complete!"}
                      </h2>
                    </div>

                    {todayBit && (
                      <span className="text-xs font-mono font-medium text-stone-300 bg-[#12100f] px-2.5 py-1 rounded-lg border border-stone-805 border-stone-800 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {todayBit.readingTimeMin} MINS
                      </span>
                    )}
                  </div>

                  {todayBit ? (
                    <>
                      {/* Short review summary */}
                      <p className="text-xs text-stone-300 leading-relaxed max-w-xl line-clamp-3">
                        {todayBit.summary.substring(0, 200)}...
                      </p>

                      {/* Display key review takeaways */}
                      <div className="mt-5 space-y-2 border-l-2 border-stone-800 pl-4 py-1">
                        {todayBit.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                          <div key={idx} className="text-xs font-medium text-stone-300 flex items-start gap-1.5">
                            <span className="text-stone-550 text-stone-500">•</span>
                            <span>{takeaway}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-stone-850 flex items-center justify-between">
                        <span className="text-[10px] text-stone-500 font-mono tracking-wider">
                          Ready to study today's bit?
                        </span>
                        <button
                          id="dashboard_review_btn"
                          onClick={() => onOpenBitDetail(todayBit.dayNumber)}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 select-none hover:gap-2"
                        >
                          <span>Master Portion & Quiz</span>
                          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] transition-all" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 stroke-[1.5]" />
                      <h4 className="text-xs font-bold text-stone-200">You completed this full course!</h4>
                      <p className="text-[11px] text-stone-400 mt-1 max-w-xs mx-auto">Excellent job. You bypassed cramming and have mastered the core definitions safely.</p>
                    </div>
                  )}
                </div>                 {/* 3. VISUAL TIMELINE PORT */}
                <div className="bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-sans">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xs font-bold text-stone-100 tracking-tight uppercase brand-label">
                        Visual Curriculum Timeline
                      </h3>
                      <p className="text-[10px] text-stone-500 mt-0.5 font-sans">
                        Click any segment node to review or dive into today's bit.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-stone-300 bg-[#12100f] p-1 rounded border border-stone-800">
                      {activePlan.completedBitsCount} of {activePlan.totalBits} portion{activePlan.totalBits > 1 ? "s" : ""} done
                    </span>
                  </div>

                  {/* Horizontal Timeline Flex */}
                  <div className="relative py-4 overflow-x-auto scrollbar-none flex gap-8 items-center pl-2">
                    {/* Background Connection line */}
                    <div className="absolute top-1/2 left-4 right-12 h-[2px] bg-stone-800 z-0"></div>

                    {/* Nodes mapping */}
                    {activePlan.bits.map((bit, idx) => {
                      const isCompleted = bit.completed;
                      const isToday = todayBit ? todayBit.dayNumber === bit.dayNumber : false;
                      const isLocked = !isCompleted && !isToday;

                      return (
                        <div key={bit.id} className="relative z-10 flex flex-col items-center select-none shrink-0">
                          <motion.button
                            onClick={() => onOpenBitDetail(bit.dayNumber)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all relative cursor-pointer ${
                              isCompleted
                                ? "bg-emerald-500 text-white shadow-emerald-950/20 shadow-md"
                                : isToday
                                ? "bg-stone-100 text-[#0c0a09] ring-4 ring-stone-800 animate-pulse"
                                : "bg-[#12100f] border border-stone-800 text-stone-500 hover:border-stone-500 hover:text-stone-300"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4.5 w-4.5 stroke-[2.2]" />
                            ) : (
                              <span>{bit.dayNumber}</span>
                            )}
                          </motion.button>
                          
                          <div className="mt-2.5 text-center max-w-[85px]">
                            <span className={`text-[9px] font-medium block truncate ${isToday ? "text-stone-100 font-bold" : "text-stone-400"}`}>
                              {bit.title}
                            </span>
                            <span className="text-[8px] text-stone-500 font-mono tracking-wider block">
                              {bit.readingTimeMin} min
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>          {/* Right column: Stats column & Cram-o-meter */}
          <div className="space-y-8 font-sans">
            
            {/* A. CRAM-O-METER */}
            <div className="bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-stone-100 tracking-tight uppercase brand-label mb-2 pb-2 border-b border-stone-850">
                  Cram-o-Meter Gauge
                </h3>
                <p className="text-[10px] text-stone-400 mt-1 max-w-xs leading-relaxed">
                  StudyBits matches your completed items against days since plan initialization. Any missed day raises cram danger level.
                </p>

                {/* Meter graphic */}
                <div className="my-6">
                  <div className="flex justify-between text-[10px] font-medium text-stone-500 mb-1.5 tracking-wider uppercase">
                    <span>Chill Zone</span>
                    <span className="text-red-400">Cram Alert</span>
                  </div>

                  <div className="h-3 w-full bg-[#12100f] rounded-full overflow-hidden border border-stone-800 relative">
                    {/* Visual gradient bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-20"></div>
                    <motion.div
                      id="cramometer_indicator"
                      initial={{ width: 0 }}
                      animate={{ width: `${pace.level}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full relative rounded-full ${
                        pace.status === "lagging" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-[11px] font-semibold text-stone-300">
                      Pace Level: <span className="font-mono font-bold">{pace.level}%</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${pace.color}`}>
                      {pace.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#12100f] border border-[#23201e]/80 text-[10px] text-stone-400 leading-relaxed font-semibold">
                {pace.message}
              </div>
            </div>

            {/* B. LEARNING PROFILE STATS */}
            <div className="bg-[#171514] border border-stone-850 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] font-sans text-stone-100">
              <h3 className="text-xs font-bold text-stone-100 tracking-tight uppercase brand-label mb-4 pb-2 border-b border-stone-850 font-sans">
                Your Learning Profile
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#12100f] rounded-2xl border border-stone-800">
                  <span className="text-[10px] font-semibold text-stone-505 text-stone-500 tracking-wider uppercase block label-span">
                    Total Units
                  </span>
                  <span className="text-2xl font-bold font-mono text-stone-100 mt-0.5 block leading-none">
                    {plans.reduce((acc, p) => acc + p.totalBits, 0)}
                  </span>
                </div>

                <div className="p-4 bg-[#12100f] rounded-2xl border border-stone-800">
                  <span className="text-[10px] font-semibold text-stone-500 tracking-wider uppercase block label-span">
                    Mastered
                  </span>
                  <span className="text-2xl font-bold font-mono text-stone-100 mt-0.5 block leading-none">
                    {totalCompletedCount}
                  </span>
                </div>
              </div>

              {/* Course detailed brief */}
              {activePlan && (
                <div className="mt-5 space-y-3 font-sans">
                  <div className="flex justify-between text-[11px] font-medium border-b border-stone-850 pb-2">
                    <span className="text-stone-500">Current Course</span>
                    <span className="text-stone-200 font-semibold">{activePlan.title}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-medium border-b border-stone-850 pb-2">
                    <span className="text-stone-500">Category / Subject</span>
                    <span className="text-stone-200 font-semibold">{activePlan.subject}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-medium border-b border-stone-850 pb-2">
                    <span className="text-stone-500">Target Deadline</span>
                    <span className="text-stone-200 font-semibold">{activePlan.deadline}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-stone-500">Daily Study Capacity</span>
                    <span className="text-stone-100 font-mono font-bold">{activePlan.minutesPerDay} min</span>
                  </div>

                  {/* Deletion control */}
                  <div className="pt-2">
                    {deletingPlanId === activePlan.id ? (
                      <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl space-y-2">
                        <span className="text-[10px] text-red-300 font-semibold block leading-tight">
                          Are you sure you want to delete this course and all its study progress? This cannot be undone.
                        </span>
                        <div className="flex gap-2 justify-end">
                          <button
                            id="cancel_delete_course_btn"
                            onClick={() => setDeletingPlanId(null)}
                            className="px-2.5 py-1 rounded bg-[#23201e] hover:bg-[#332f2c] border border-stone-850 text-[10px] font-bold text-stone-300 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            id="confirm_delete_course_btn"
                            onClick={() => {
                              onDeletePlan(activePlan.id);
                              setDeletingPlanId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white transition-colors cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        id="initiate_delete_course_btn"
                        onClick={() => setDeletingPlanId(activePlan.id)}
                        className="w-full py-2 border border-dashed border-red-900/40 hover:border-red-800 hover:bg-red-950/15 text-red-400 hover:text-red-300 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Course</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
