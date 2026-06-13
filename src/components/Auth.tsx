import React, { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { UserProfile } from "../types";

interface AuthProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // High fidelity mockup database matching
    const mockUser: UserProfile = {
      email,
      name: isSignUp ? name : email.split("@")[0],
      joinedAt: new Date().toISOString(),
      streakDays: 0,
    };

    onLoginSuccess(mockUser);
  };

  const handleDemoLogin = () => {
    const demoUser: UserProfile = {
      email: "jane.scholar@studybits.edu",
      name: "Jane Scholar",
      joinedAt: new Date().toISOString(),
      streakDays: 3, // existing streak
      lastStudiedDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], // studied yesterday
    };
    onLoginSuccess(demoUser);
  };

  return (
    <div id="auth_container" className="min-h-screen bg-[#0c0a09] flex flex-col justify-center items-center px-4 py-12 selection:bg-stone-800">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo and Greeting Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 bg-stone-100 text-stone-950 rounded-xl flex items-center justify-center shadow-md mb-3">
            <GraduationCap className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h1 className="text-2xl font-sans tracking-tight font-semibold text-stone-100">StudyBits</h1>
          <p className="text-sm text-stone-400 mt-1 max-w-xs">
            Kill last-minute cramming. Let AI segment your study material into highly-digestible daily portions.
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-[#171514] border border-stone-850 rounded-3xl p-8 shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
          <div className="flex bg-[#23201e] p-1 rounded-xl mb-6">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                !isSignUp ? "bg-[#332f2c] text-stone-100 shadow-sm" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                isSignUp ? "bg-[#332f2c] text-stone-100 shadow-sm" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 label-span">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-stone-500 stroke-[1.5]" />
                  <input
                    id="auth_name_field"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#12100f] border border-stone-800 focus:border-stone-500 rounded-xl text-sm focus:outline-none focus:bg-[#1c1917] transition-all text-stone-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 label-span">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-500 stroke-[1.5]" />
                <input
                  id="auth_email_field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#12100f] border border-stone-800 focus:border-stone-500 rounded-xl text-sm focus:outline-none focus:bg-[#1c1917] transition-all text-stone-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 label-span">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-stone-500 stroke-[1.5]" />
                <input
                  id="auth_password_field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#12100f] border border-stone-800 focus:border-stone-500 rounded-xl text-sm focus:outline-none focus:bg-[#1c1917] transition-all text-stone-100"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 font-medium bg-red-950/20 p-3 rounded-lg border border-red-900/50"
              >
                {error}
              </motion.div>
            )}

            <button
              id="auth_submit_btn"
              type="submit"
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-950 rounded-xl text-sm font-semibold transition-all duration-250 shadow-sm flex items-center justify-center gap-1.5 mt-2 group"
            >
              <span>{isSignUp ? "Create Account" : "Access StudyBits"}</span>
              <ArrowRight className="h-4 w-4 stroke-[2] transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          {/* Separator line */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
              <span className="bg-[#171514] px-3">or fast track</span>
            </div>
          </div>

          <button
            id="auth_demo_btn"
            onClick={handleDemoLogin}
            className="w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-900/50 text-emerald-300 rounded-xl text-sm font-medium transition-all duration-250 flex items-center justify-center gap-1.5 group select-none cursor-pointer"
          >
            <Sparkles className="h-4 w-4 stroke-[1.5] text-emerald-400 animate-pulse" />
            <span>Try Demo Account</span>
          </button>
        </div>

        {/* Footer info lock */}
        <p className="text-center text-[11px] text-stone-500 mt-8 font-medium">
          StudyBits stores data securely inside your browser's LocalStorage. All API calls are server-proxied.
        </p>
      </motion.div>
    </div>
  );
}
