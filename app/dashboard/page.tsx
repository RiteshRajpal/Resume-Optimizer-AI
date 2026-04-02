"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Stage = "idle" | "uploading" | "ready" | "optimizing" | "done" | "error";

const SAMPLE_JD = `Senior Software Engineer - Full Stack

We are looking for a Senior Software Engineer to join our product team.

Requirements:
- 5+ years of experience with React, TypeScript, and Node.js
- Experience with cloud infrastructure (AWS/GCP/Azure)
- Strong knowledge of database design (PostgreSQL, Redis)
- Experience with CI/CD pipelines and DevOps practices
- Excellent communication and collaboration skills

Nice to have:
- Experience with microservices architecture
- Kubernetes and Docker experience
- GraphQL API development

Responsibilities:
- Design and build scalable web applications
- Lead technical discussions and mentor junior engineers
- Drive improvements to development processes
- Collaborate closely with product and design teams`;

const CAPABILITIES = [
  {
    icon: "⚡",
    title: "ATS Score Prediction",
    desc: "Instantly analyzes your resume against job requirements and predicts your ATS score.",
  },
  {
    icon: "🎯",
    title: "Precision Tailoring",
    desc: "Rewrites bullet points with domain-specific keywords from your target job description.",
  },
  {
    icon: "🔗",
    title: "Action Verb Integration",
    desc: "Upgrades generic verbs to powerful, industry-recognized action verbs automatically.",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // ── File handling ────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExt = [".pdf", ".docx", ".doc"];
    const hasValidType =
      allowed.includes(file.type) || allowedExt.some((ext) => file.name.endsWith(ext));

    if (!hasValidType) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    setStage("uploading");
    setError(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResumeText(data.text);
      setStage("ready");
    } catch (err: any) {
      setError(err.message);
      setStage("idle");
      setFileName(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Optimize ─────────────────────────────────────────────────
  const handleOptimize = async () => {
    if (!resumeText || !jobDescription.trim()) {
      setError("Please provide both a resume and a job description.");
      return;
    }

    setStage("optimizing");
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 88));
    }, 600);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, fileName }),
      });

      clearInterval(progressInterval);
      const raw = await res.text();
      let data: {
        error?: string;
        editedResume?: string;
        keywordScore?: number;
        demoMode?: boolean;
        providerUsed?: string | null;
      };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Invalid response from server. Check the dev console.");
      }
      if (!res.ok) throw new Error(data.error || "Optimization failed");

      setProgress(100);
      sessionStorage.setItem(
        "resumeResult",
        JSON.stringify({
          original: resumeText,
          edited: data.editedResume,
          keywordScore: data.keywordScore,
          fileName: fileName || "resume",
          demoMode: !!data.demoMode,
          providerUsed: data.providerUsed ?? undefined,
        })
      );

      setTimeout(() => router.push("/result"), 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
      setStage("ready");
      setProgress(0);
    }
  };

  const isOptimizing = stage === "optimizing";
  const canOptimize = stage === "ready" && jobDescription.trim().length > 50;

  return (
    <div className="min-h-screen">
      {/* ─── Nav ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#060810]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <Link href="/" className="font-display text-lg font-bold text-white">
          résumé<span className="gradient-text">.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <Link href="/" className="text-white">Editor</Link>
          <Link href="#" className="hover:text-white transition-colors">Templates</Link>
          <Link href="#" className="hover:text-white transition-colors">How it Works</Link>
        </div>
        <Link href="/dashboard" className="glow-btn px-5 py-2 text-sm rounded-lg">
          Build My Resume
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12">
        {/* ─── Header ───────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-accent/20 bg-accent/[0.06] text-accent text-xs font-medium tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            AI-POWERED OPTIMIZATION
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
            Sculpt Your <em className="not-italic gradient-text">Career Narrative</em>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            Our engine reads from your resume, analyzes job descriptions and professional standards to
            create a high-impact document that resonates with both human recruiters and ATS algorithms.
          </p>
        </div>

        {/* ─── Error banner ─────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 glass-card rounded-xl p-4 text-sm text-red-400 border-red-500/20">
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-slate-500 hover:text-white transition-colors">✕</button>
          </div>
        )}

        {/* ─── Two-column layout ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left Panel: Upload ──────────────────────────────── */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-accent text-sm">①</span>
                <h2 className="font-semibold text-white text-sm">Professional Foundation</h2>
              </div>
              {stage === "ready" && (
                <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase">
                  ✓ Parsed
                </span>
              )}
            </div>

            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4">Drag & drop your resume document</p>
              <div
                onClick={() => !isOptimizing && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`relative border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragging ? "border-accent bg-accent/[0.04]" : "border-white/[0.08] hover:border-accent/40 hover:bg-white/[0.01]"}
                  ${stage === "uploading" ? "pointer-events-none opacity-70" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {stage === "uploading" ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Parsing file...</span>
                  </div>
                ) : stage === "ready" ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent text-2xl">
                      📄
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{fileName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {resumeText.length.toLocaleString()} characters extracted
                      </div>
                    </div>
                    <button
                      className="text-xs text-accent hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStage("idle");
                        setFileName(null);
                        setResumeText("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Upload different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-3xl">📁</div>
                    <div>
                      <div className="font-medium text-white text-sm">
                        Drop your resume here
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        PDF or DOCX · Supported (Max 10MB)
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-slate-400">
                      Browse files
                    </span>
                  </div>
                )}
              </div>

              {/* Preview */}
              {resumeText && (
                <div className="mt-4">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Preview</div>
                  <pre className="text-xs text-slate-400 bg-white/[0.02] rounded-lg p-4 h-32 overflow-y-auto font-sans leading-relaxed whitespace-pre-wrap border border-white/[0.04]">
                    {resumeText.slice(0, 600)}...
                  </pre>
                </div>
              )}

              {/* Expert tip */}
              <div className="mt-4 p-3 rounded-lg bg-accent/[0.04] border border-accent/10">
                <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Expert Tip</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a comprehensive resume. Our AI works best with detailed experience sections and quantified achievements.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Panel: Job Description ────────────────────── */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-accent text-sm">②</span>
                <h2 className="font-semibold text-white text-sm">Target Destination</h2>
              </div>
              {jobDescription.length > 50 && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {jobDescription.length.toLocaleString()} chars
                </span>
              )}
            </div>

            <div className="p-6 flex flex-col" style={{ minHeight: "400px" }}>
              <p className="text-xs text-slate-500 mb-4">
                Paste the full job posting. Include requirements, responsibilities, and keywords.
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isOptimizing}
                placeholder="Paste the full job description here...&#10;&#10;Include requirements, responsibilities, and any keywords from the posting for best results."
                className="flex-1 w-full resize-none text-sm text-slate-200 placeholder:text-slate-600 bg-white/[0.02] rounded-xl p-4 border border-white/[0.06] focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all leading-relaxed min-h-[200px] disabled:opacity-60"
              />

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setJobDescription(SAMPLE_JD)}
                  className="text-xs text-accent hover:underline"
                  disabled={isOptimizing}
                >
                  Use sample JD
                </button>
                {jobDescription && (
                  <>
                    <span className="text-slate-700">·</span>
                    <button
                      onClick={() => setJobDescription("")}
                      className="text-xs text-slate-500 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Optimize Button + Progress ───────────────────────── */}
        <div className="mt-10 flex flex-col items-center gap-5">
          {isOptimizing && (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Processing your resume...</span>
                <span className="font-mono text-accent">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #14b8a6, #06b6d4)",
                  }}
                />
              </div>
              <div className="text-center text-xs text-slate-600 mt-3">
                Matching keywords · Enhancing bullet points · Quantifying achievements...
              </div>
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={!canOptimize || isOptimizing}
            className={`group px-10 py-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300
              ${
                canOptimize && !isOptimizing
                  ? "glow-btn"
                  : "bg-white/[0.04] text-slate-600 cursor-not-allowed border border-white/[0.04]"
              }`}
          >
            {isOptimizing ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                Optimize Resume
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </>
            )}
          </button>

          {!canOptimize && !isOptimizing && (
            <p className="text-xs text-slate-600">
              {stage === "idle" && "Upload a resume to get started"}
              {stage === "ready" &&
                jobDescription.length <= 50 &&
                "Add a job description (min. 50 characters)"}
            </p>
          )}
        </div>

        {/* ─── Capabilities Section ─────────────────────────────── */}
        <div className="mt-20">
          <h3 className="font-display text-xl font-bold text-white text-center mb-8">
            System Integration Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CAPABILITIES.map((cap, i) => (
              <div key={i} className="glass-card rounded-xl p-6 group">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-base mb-3 group-hover:bg-accent/20 transition-colors">
                  {cap.icon}
                </div>
                <h4 className="font-semibold text-white text-sm mb-1.5">{cap.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] px-6 md:px-8 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-white text-sm">
              résumé<span className="gradient-text">.ai</span>
            </span>
            <span className="text-xs text-slate-600">© 2024 · Sculpting professional identities</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
