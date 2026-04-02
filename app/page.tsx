"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const FEATURES = [
  {
    icon: "⚡",
    title: "Smart ATS Matching",
    desc: "Automatically injects relevant keywords from the job description to pass ATS filters with a 94%+ match rate.",
  },
  {
    icon: "🎯",
    title: "Precision Tailoring",
    desc: "Transforms weak bullet points into powerful achievement statements with strong action verbs and measurable impact.",
  },
  {
    icon: "📊",
    title: "Quantified Impact",
    desc: "AI adds realistic metrics and numbers to make your contributions measurable, memorable, and results-driven.",
  },
  {
    icon: "📄",
    title: "Instant PDF Export",
    desc: "Download your polished, professionally formatted resume as a clean PDF — ready to submit in seconds.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Upload Resume",
    desc: "Drag and drop your PDF or DOCX file. Our parser extracts every detail with precision.",
    icon: "📁",
  },
  {
    num: "02",
    title: "Paste Job Description",
    desc: "Add the target job posting. AI analyzes requirements, keywords, and expectations.",
    icon: "📋",
  },
  {
    num: "03",
    title: "AI Optimizes",
    desc: "Our engine rewrites, enhances, and tailors your resume in seconds — not hours.",
    icon: "✦",
  },
];

export default function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <main className="min-h-screen relative">
      {/* ─── Navigation ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#060810]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <Link href="/" className="font-display text-lg font-bold text-white tracking-tight">
          résumé<span className="gradient-text">.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </div>
        <Link
          href="/dashboard"
          className="glow-btn px-5 py-2 text-sm rounded-lg"
        >
          Build My Resume
        </Link>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 md:px-8">
        {/* Hero ambient glow */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[400px] bg-accent/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[300px] bg-accent-cyan/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-accent/20 bg-accent/[0.06] text-accent text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              AI-POWERED RESUME OPTIMIZATION
            </div>

            <h1 className="font-display text-[3.2rem] md:text-[3.8rem] lg:text-[4.2rem] font-bold leading-[1.08] mb-6 text-white">
              Tailor Your{" "}
              <span className="gradient-text">Resume</span>
              <br />
              with AI in Seconds.
            </h1>

            <p className="text-lg text-slate-400 max-w-lg leading-relaxed mb-8">
              Upload your resume, paste a job description, and watch AI transform
              your experience into the exact story hiring managers want to read.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/dashboard"
                className="glow-btn px-7 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                Get Started — It&apos;s Free
                <span className="text-lg">→</span>
              </Link>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {["🟢", "🔵", "🟣"].map((dot, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-surface-300 border-2 border-[#060810] flex items-center justify-center text-xs">
                      {dot}
                    </div>
                  ))}
                </div>
                <span>4.9★ · 2k+ resumes built</span>
              </div>
            </div>
          </div>

          {/* Right: Mockup card */}
          <div
            className={`hidden lg:block transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative">
              {/* Tilted background card */}
              <div className="absolute inset-0 glass-card rounded-2xl transform rotate-3 scale-95 opacity-50" />
              {/* Main card */}
              <div className="relative glass-card rounded-2xl p-6 border border-white/[0.06]">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                {/* Resume preview lines */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm">✦</div>
                    <div>
                      <div className="h-2.5 bg-white/10 rounded w-32 mb-1.5" />
                      <div className="h-2 bg-white/[0.05] rounded w-20" />
                    </div>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded w-full" />
                  <div className="flex gap-2">
                    <div className="h-2 bg-accent/20 rounded w-3/4 border-l-2 border-accent" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 bg-accent/20 rounded w-5/6 border-l-2 border-accent" />
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded w-2/3 mt-4" />
                  <div className="flex gap-2">
                    <div className="h-2 bg-cyan-400/15 rounded w-full border-l-2 border-cyan-400" />
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded w-4/5" />
                  <div className="flex gap-2">
                    <div className="h-2 bg-accent/20 rounded w-3/5 border-l-2 border-accent" />
                  </div>
                  {/* Score badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent rounded-md border border-accent/20">
                      94% ATS Match
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 rounded-md border border-green-500/20">
                      Optimized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ───────────────────────────────────── */}
      <section id="features" className="py-24 px-6 md:px-8 relative">
        <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase block mb-3">
              So You Can
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Built for Success
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              AI-powered tools purpose-built to give you an unfair advantage in your job search.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-7 group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg mb-4 group-hover:bg-accent/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 md:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase block mb-3">
              How It Works
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Architect Your Future
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-7 relative overflow-hidden group">
                {/* Step number watermark */}
                <div className="absolute -top-2 -right-2 text-6xl font-bold text-white/[0.03] font-mono select-none">
                  {s.num}
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg mb-5 group-hover:bg-accent/20 transition-colors">
                    {s.icon}
                  </div>
                  <div className="text-accent font-mono text-xs font-bold tracking-wider mb-2">
                    STEP {s.num}
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center relative">
          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/[0.06] rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-accent text-xl mb-4">◆</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to stand out?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              Join thousands of job seekers who&apos;ve transformed their careers with
              AI-powered resume optimization.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/dashboard"
                className="glow-btn px-8 py-3.5 rounded-xl text-sm font-semibold"
              >
                Build My Resume
              </Link>
              <Link
                href="/dashboard"
                className="outline-btn px-8 py-3.5 rounded-xl text-sm font-medium"
              >
                View Full Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] px-6 md:px-8 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display font-bold text-white">
              résumé<span className="gradient-text">.ai</span>
            </span>
            <span className="text-xs text-slate-600">
              © 2024 · Sculpting professional identities
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
