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
    <div id="auth_container" className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-6 py-16 selection:bg-stone-800 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo and Greeting Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-14 w-14 bg-stone-100 text-stone-950 rounded-2xl flex items-center justify-center shadow-lg mb-4 hover:scale-105 transition-all">
            <GraduationCap className="h-7 w-7 stroke-[1.8]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">StudyBits</h1>
          <p className="text-sm text-stone-400 mt-2 max-w-xs leading-relaxed">
            Kill last-minute cramming. Let AI segment your study material into highly-digestible daily portions.
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-stone-900/30 border border-stone-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          
          {/* Toggle Login/Sign Up Tab Row */}
          <div className="flex bg-stone-950/50 p-1.5 rounded-xl mb-6 border border-stone-900/50">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-350 cursor-pointer ${
                !isSignUp 
                  ? "bg-stone-850 text-white shadow-md border border-stone-800" 
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-350 cursor-pointer ${
                isSignUp 
                  ? "bg-stone-850 text-white shadow-md border border-stone-800" 
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-[13px] h-4 w-4 text-stone-500 stroke-[1.8]" />
                  <input
                    id="auth_name_field"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 bg-stone-950/40 border border-stone-800 hover:border-stone-700 focus:border-stone-600 focus:ring-1 focus:ring-stone-700 rounded-xl text-xs focus:outline-none focus:bg-stone-950/80 transition-all text-stone-100 font-semibold placeholder-stone-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-[13px] h-4 w-4 text-stone-500 stroke-[1.8]" />
                <input
                  id="auth_email_field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full pl-10 pr-4 py-3 bg-stone-950/40 border border-stone-800 hover:border-stone-700 focus:border-stone-600 focus:ring-1 focus:ring-stone-700 rounded-xl text-xs focus:outline-none focus:bg-stone-950/80 transition-all text-stone-100 font-semibold placeholder-stone-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-[13px] h-4 w-4 text-stone-500 stroke-[1.8]" />
                <input
                  id="auth_password_field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-3 bg-stone-950/40 border border-stone-800 hover:border-stone-700 focus:border-stone-600 focus:ring-1 focus:ring-stone-700 rounded-xl text-xs focus:outline-none focus:bg-stone-950/80 transition-all text-stone-100 font-semibold placeholder-stone-600"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 font-medium bg-red-950/20 p-3.5 rounded-xl border border-red-900/40 leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            <button
              id="auth_submit_btn"
              type="submit"
              className="w-full py-3 bg-stone-100 text-stone-950 rounded-xl text-xs font-bold tracking-wider shadow-md transition-all flex items-center justify-center gap-2 mt-4 group select-none cursor-pointer hover:bg-stone-200 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-lg"
            >
              <span>{isSignUp ? "Create Account" : "Access StudyBits"}</span>
              <ArrowRight className="h-4 w-4 stroke-[2] transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          {/* Separator line */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800/80"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-stone-500 tracking-wider">
              <span className="bg-stone-900/90 px-3 py-0.5 rounded-md border border-stone-800/40">or fast track</span>
            </div>
          </div>

          {/* Try Demo Button */}
          <button
            id="auth_demo_btn"
            onClick={handleDemoLogin}
            className="w-full py-3 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-900/35 text-emerald-400 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 group select-none cursor-pointer hover:shadow-md hover:border-emerald-800/40"
          >
            <Sparkles className="h-4 w-4 stroke-[1.8] text-emerald-400 animate-pulse" />
            <span>Try Demo Account</span>
          </button>
        </div>

        {/* Footer info lock */}
        <p className="text-center text-[11px] text-stone-500 mt-8 font-medium leading-relaxed max-w-sm mx-auto">
          StudyBits stores data securely inside your browser's LocalStorage. All API calls are server-proxied.
        </p>
      </motion.div>
    </div>
  );
}