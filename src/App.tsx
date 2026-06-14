import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, LogOut, BookOpen, Clock, Layers, Flame, Sun, Moon } from "lucide-react";
import Auth from "./components/Auth";
import Upload from "./components/Upload";
import Dashboard from "./components/Dashboard";
import BitView from "./components/BitView";
import { UserProfile, StudyPlan } from "./types";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [view, setView] = useState<"login" | "dashboard" | "upload" | "bit-detail">("login");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Load initial theme from LocalStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("studybits_theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);


  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("studybits_theme", nextTheme);
  };

  // 1. Initial State Auto-Load from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("studybits_user_profile");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setView("dashboard");

      // Load plans specific to this user's email
      const storedPlans = localStorage.getItem(`studybits_plans_${parsedUser.email}`);
      if (storedPlans) {
        const parsedPlans = JSON.parse(storedPlans);
        setPlans(parsedPlans);
        if (parsedPlans.length > 0) {
          setSelectedPlanId(parsedPlans[0].id);
        }
      }
    }
  }, []);

  // 2. Clear out login state or update profile
  const handleLoginSuccess = (profile: UserProfile) => {
    localStorage.setItem("studybits_user_profile", JSON.stringify(profile));
    setUser(profile);

    // Load existing plans for this email
    const storedPlans = localStorage.getItem(`studybits_plans_${profile.email}`);
    if (storedPlans) {
      const parsedPlans = JSON.parse(storedPlans);
      setPlans(parsedPlans);
      if (parsedPlans.length > 0) {
        setSelectedPlanId(parsedPlans[0].id);
      } else {
        setSelectedPlanId("");
      }
    } else {
      setPlans([]);
      setSelectedPlanId("");
    }
    setView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("studybits_user_profile");
    setUser(null);
    setPlans([]);
    setSelectedPlanId("");
    setView("login");
  };

  // 3. Save plans to local storage whenever they change
  const savePlans = (updatedPlans: StudyPlan[], customUserEmail?: string) => {
    const targetEmail = customUserEmail || user?.email;
    if (targetEmail) {
      localStorage.setItem(`studybits_plans_${targetEmail}`, JSON.stringify(updatedPlans));
    }
    setPlans(updatedPlans);
  };

  const handlePlanCreated = (newPlan: StudyPlan) => {
    const updatedPlans = [newPlan, ...plans];
    savePlans(updatedPlans);
    setSelectedPlanId(newPlan.id);
    setView("dashboard");
  };

  const handleDeletePlan = (planId: string) => {
    const updatedPlans = plans.filter((p) => p.id !== planId);
    savePlans(updatedPlans);
    if (selectedPlanId === planId) {
      if (updatedPlans.length > 0) {
        setSelectedPlanId(updatedPlans[0].id);
      } else {
        setSelectedPlanId("");
      }
    }
  };

  // 4. Mark daily bit done with Streak Calculations
  const handleMarkBitDone = (dayNumber: number) => {
    if (!user || !selectedPlanId) return;

    const updatedPlans = plans.map((p) => {
      if (p.id !== selectedPlanId) return p;

      const updatedBits = p.bits.map((b) => {
        if (b.dayNumber !== dayNumber) return b;
        return {
          ...b,
          completed: true,
          completedAt: new Date().toISOString(),
        };
      });

      const completedCount = updatedBits.filter((b) => b.completed).length;

      return {
        ...p,
        completedBitsCount: completedCount,
        bits: updatedBits,
      };
    });

    savePlans(updatedPlans);

    // Calculate/Maintain user streak days
    const getLocalTodayStr = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const r = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${r}`;
    };
    const todayStr = getLocalTodayStr();
    let newStreak = user.streakDays;

    if (user.lastStudiedDate) {
      if (user.lastStudiedDate !== todayStr) {
        const lastDateParts = user.lastStudiedDate.split("-");
        const todayDateParts = todayStr.split("-");
        if (lastDateParts.length === 3 && todayDateParts.length === 3) {
          const lastDate = new Date(parseInt(lastDateParts[0], 10), parseInt(lastDateParts[1], 10) - 1, parseInt(lastDateParts[2], 10));
          const todayDate = new Date(parseInt(todayDateParts[0], 10), parseInt(todayDateParts[1], 10) - 1, parseInt(todayDateParts[2], 10));
          const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 1) {
            // kept alive yesterday
            newStreak += 1;
          } else {
            // expired
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }
      }
    } else {
      // First timer
      newStreak = 1;
    }

    const updatedProfile: UserProfile = {
      ...user,
      streakDays: newStreak,
      lastStudiedDate: todayStr,
    };

    localStorage.setItem("studybits_user_profile", JSON.stringify(updatedProfile));
    setUser(updatedProfile);
  };

  const activePlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div id="study_bits_app" className={`min-h-screen flex flex-col font-sans selection:bg-stone-800 transition-colors duration-200 ${theme === "dark"
        ? "bg-[#0c0a09] text-stone-100 theme-dark"
        : "bg-[#faf8f5] text-stone-900 theme-light"
      }`}>

      {/* Floating Theme Toggle when logged out */}
      {!user && (
        <div className="fixed top-4 right-4 z-50">
          <button
            id="floating_theme_toggle_btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="p-2.5 rounded-xl border border-stone-800 bg-[#171514] hover:bg-[#23201e] text-stone-300 hover:text-stone-100 shadow-lg transition-all cursor-pointer flex items-center justify-center"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 stroke-[1.8]" />
            ) : (
              <Moon className="h-4 w-4 text-purple-400 stroke-[1.8]" />
            )}
          </button>
        </div>
      )}

      {/* Universal header bar for logged-in sessions */}
      {user && (
        <header className="bg-stone-950/80 backdrop-blur-md border-b border-stone-800/80 py-3 px-6 shadow-sm shrink-0 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">

            {/* Brand Logo & Title */}
            <div
              onClick={() => setView("dashboard")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="h-8 w-8 bg-stone-100 hover:bg-white text-[#0c0a09] rounded-xl flex items-center justify-center shadow-md transition-all group-hover:scale-105">
                <GraduationCap className="h-4.5 w-4.5 stroke-[2]" />
              </div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-stone-300 transition-colors">
                StudyBits
              </span>
            </div>

            {/* Right Actions Area */}
            <div className="flex items-center gap-4">

              {/* Theme Toggle Button */}
              <button
                id="header_theme_toggle_btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                className="p-2 rounded-xl border border-stone-800/80 bg-stone-900/40 hover:bg-stone-800 text-stone-300 hover:text-stone-100 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400 stroke-[1.8]" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-400 stroke-[1.8]" />
                )}
              </button>

              {/* User Profile display */}
              <div className="hidden sm:flex items-center gap-3 border-r border-stone-800/80 pr-4 select-none">
                <div className="text-right">
                  <span className="block text-[9px] font-bold text-stone-500 tracking-widest uppercase">
                    Profile
                  </span>
                  <span className="block text-xs font-bold text-stone-200 mt-0.5">
                    {user.name}
                  </span>
                </div>
                {/* Subtle Initial-based Avatar for polished look */}
                <div className="h-7 w-7 rounded-lg bg-stone-800 flex items-center justify-center border border-stone-700/50">
                  <span className="text-xs font-mono font-bold text-stone-300 uppercase">
                    {user.name.charAt(0)}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-stone-400 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl hover:bg-red-950/10"
              >
                <LogOut className="h-3.5 w-3.5 stroke-[2]" />
                <span className="hidden sm:inline">Logout</span>
              </button>

            </div>
          </div>
        </header>
      )}

      {/* Main Orchestrator Body switching router with beautiful animations */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === "login" && (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Auth onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}

          {view === "dashboard" && user && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard
                user={user}
                plans={plans}
                selectedPlanId={selectedPlanId}
                onSelectPlan={(id) => setSelectedPlanId(id)}
                onTriggerNewPlan={() => setView("upload")}
                onOpenBitDetail={(dayNum) => {
                  setSelectedDayNumber(dayNum);
                  setView("bit-detail");
                }}
                onLogout={handleLogout}
                onDeletePlan={handleDeletePlan}
              />
            </motion.div>
          )}

          {view === "upload" && user && (
            <motion.div
              key="upload-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Upload
                onPlanCreated={handlePlanCreated}
                onGoBack={() => setView("dashboard")}
              />
            </motion.div>
          )}

          {view === "bit-detail" && user && activePlan && (
            <motion.div
              key="bit-detail-view"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <BitView
                plan={activePlan}
                initialDayNumber={selectedDayNumber}
                onMarkBitDone={handleMarkBitDone}
                onClose={() => setView("dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}