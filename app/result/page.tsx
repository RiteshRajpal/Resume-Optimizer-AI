"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ResumeResult {
  original: string;
  edited: string;
  keywordScore: number;
  fileName: string;
  demoMode?: boolean;
  providerUsed?: string;
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [activeTab, setActiveTab] = useState<"split" | "original" | "edited">("split");
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfPrepError, setPdfPrepError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("resumeResult");
    if (!stored) {
      router.push("/dashboard");
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      router.push("/dashboard");
    }
  }, [router]);

  const downloadFileName = result
    ? `${result.fileName.replace(/\.[^.]+$/, "")}_optimized.pdf`
    : "optimized-resume.pdf";

  const triggerBlobDownload = useCallback((url: string) => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [result, downloadFileName]);

  useEffect(() => {
    if (!result?.edited) return;
    setPdfPrepError(null);
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: result.edited,
            fileName: result.fileName,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || "PDF preparation failed");
        }
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (e: any) {
        if (!cancelled) setPdfPrepError(e?.message || "Could not prepare PDF");
      }
    })();

    return () => {
      cancelled = true;
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [result]);

  const handleDownloadPdf = useCallback(async () => {
    if (!result) return;
    setIsDownloading(true);
    setError(null);

    try {
      if (pdfBlobUrl) {
        triggerBlobDownload(pdfBlobUrl);
        return;
      }

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: result.edited,
          fileName: result.fileName,
        }),
      });

      if (!res.ok) {
        const msg = await res
          .json()
          .then((d: { error?: string }) => d.error)
          .catch(() => undefined);
        throw new Error(msg || "PDF generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      triggerBlobDownload(url);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  }, [result, pdfBlobUrl, triggerBlobDownload]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.edited);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    return "Needs Work";
  };

  const getReadabilityGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    return "B";
  };

  const getImpactLevel = (score: number) => {
    if (score >= 85) return "High";
    if (score >= 70) return "Medium";
    return "Low";
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Nav ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#060810]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <Link href="/" className="font-display text-lg font-bold text-white">
          résumé<span className="gradient-text">.ai</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <Link href="/dashboard" className="text-white">Editor</Link>
          <Link href="#" className="hover:text-white transition-colors">Templates</Link>
          <Link href="#" className="hover:text-white transition-colors">How it Works</Link>
        </div>

        <Link href="/dashboard" className="glow-btn px-5 py-2 text-sm rounded-lg">
          Build My Resume
        </Link>
      </nav>

      {/* ─── Result Header ──────────────────────────────────────── */}
      <div className="px-6 md:px-8 pt-8 pb-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 text-xs font-medium tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ANALYSIS COMPLETE
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              Your Optimized <em className="not-italic gradient-text">Professional Identity</em>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
              Our AI has restructured your experience to highlight impact-driven
              results and industry-relevant keywords.
            </p>
            {result.demoMode && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200/95 leading-relaxed max-w-lg">
                <strong className="text-amber-100">Demo / fallback mode.</strong>{" "}
                Full AI rewriting was skipped (API credits or keys). Your original resume is preserved with a keyword alignment section added. For a real rewrite, add a free{" "}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-amber-100 hover:text-white"
                >
                  Groq API key
                </a>{" "}
                to <code className="text-amber-100/90">.env.local</code> as{" "}
                <code className="text-amber-100/90">GROQ_API_KEY</code>.
              </div>
            )}
          </div>

          <div className="flex flex-col items-stretch md:items-end gap-2 flex-shrink-0 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <Link
                href="/dashboard"
                className="outline-btn px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                ← Edit Again
              </Link>
              <button
                onClick={handleCopy}
                className="outline-btn px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                {copied ? "✓ Copied!" : "Copy Text"}
              </button>
              {pdfBlobUrl ? (
                <a
                  href={pdfBlobUrl}
                  download={downloadFileName}
                  className="glow-btn px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  ⬇ DOWNLOAD PDF
                </a>
              ) : (
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="glow-btn px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  {isDownloading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "⬇ DOWNLOAD PDF"
                  )}
                </button>
              )}
            </div>
            {pdfPrepError && (
              <p className="text-xs text-amber-400/90 text-right max-w-md">
                PDF link unavailable: {pdfPrepError}. Try the download button or copy the text.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 md:mx-8 max-w-7xl glass-card flex items-center gap-2 rounded-xl p-3 text-sm text-red-400">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-slate-500 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── View toggle ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 md:px-8 pt-4 pb-3 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/[0.04]">
          {(["split", "original", "edited"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all uppercase tracking-wider ${
                activeTab === tab
                  ? "bg-accent text-[#060810]"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {tab === "split" ? "Split View" : tab === "original" ? "Original Draft" : "AI Enhanced"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 text-[10px] uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-500/30 border border-emerald-500/50" /> Edits
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-sm bg-cyan-500/30 border border-cyan-500/50" /> Improved
          </span>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────────── */}
      <div className="flex-1 px-6 md:px-8 pb-6 max-w-7xl mx-auto w-full">
        {activeTab === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <ResumePanel title="Original Draft" text={result.original} variant="original" />
            <ResumePanel title="AI Enhanced Version" text={result.edited} variant="edited" highlight />
          </div>
        )}
        {activeTab === "original" && (
          <ResumePanel title="Original Draft" text={result.original} variant="original" fullHeight />
        )}
        {activeTab === "edited" && (
          <ResumePanel title="AI Enhanced Resume" text={result.edited} variant="edited" highlight fullHeight />
        )}
      </div>

      {/* ─── Score Cards ────────────────────────────────────────── */}
      <div className="px-6 md:px-8 pb-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Readability Score
            </div>
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {getReadabilityGrade(result.keywordScore)}
            </div>
            <div className="text-xs text-slate-500">Optimized for clarity</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Keyword Density
            </div>
            <div className="text-3xl font-bold gradient-text mb-1">
              {result.keywordScore}%
            </div>
            <div className="text-xs text-slate-500">Industry-relevant terms</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Impact Score
            </div>
            <div className={`text-3xl font-bold mb-1 ${result.keywordScore >= 85 ? "text-emerald-400" : result.keywordScore >= 70 ? "text-amber-400" : "text-red-400"}`}>
              {getImpactLevel(result.keywordScore)}
            </div>
            <div className="text-xs text-slate-500">Achievement-driven content</div>
          </div>
        </div>
      </div>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
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
            <Link href="#" className="hover:text-slate-300 transition-colors">Career Advice</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Resume Panel Component ───────────────────────────────────
function ResumePanel({
  title,
  text,
  variant,
  highlight = false,
  fullHeight = false,
}: {
  title: string;
  text: string;
  variant: "original" | "edited";
  highlight?: boolean;
  fullHeight?: boolean;
}) {
  const lines = text.split("\n");

  return (
    <div
      className={`glass-card rounded-xl flex flex-col overflow-hidden ${
        variant === "edited" ? "border-accent/20" : ""
      } ${fullHeight ? "min-h-[600px]" : ""}`}
    >
      <div
        className={`px-5 py-3 border-b text-xs font-semibold flex items-center gap-2 uppercase tracking-wider ${
          variant === "edited"
            ? "border-accent/10 bg-accent/[0.04] text-accent"
            : "border-white/[0.04] text-slate-500"
        }`}
      >
        {variant === "edited" ? "◆" : "○"} {title}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="font-sans text-sm leading-7 text-slate-300 whitespace-pre-wrap resume-prose">
          {highlight
            ? lines.map((line, i) => <HighlightedLine key={i} line={line} />)
            : text}
        </div>
      </div>
    </div>
  );
}

// ─── Highlighted Line ─────────────────────────────────────────
function HighlightedLine({ line }: { line: string }) {
  const isEmpty = !line.trim();
  if (isEmpty) return <br />;

  const isSectionHeader =
    line.match(/^[A-Z][A-Z\s&]+$/) ||
    line.match(
      /^(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROJECTS|CERTIFICATIONS)/i
    );
  const isBullet = line.startsWith("•") || line.startsWith("-");
  const hasMetric = line.match(
    /\d+%|\d+x|\$\d+|\d+\+|\d{4}|\d+ (million|billion|k\b)/i
  );
  const hasActionVerb = line.match(
    /^[•\-*]?\s*(Led|Built|Designed|Engineered|Delivered|Launched|Architected|Scaled|Grew|Improved|Reduced|Increased|Developed|Created|Managed|Drove|Accelerated|Optimized|Implemented)/i
  );

  if (isSectionHeader) {
    return (
      <div className="font-bold text-accent uppercase tracking-widest text-xs mt-4 mb-1">
        {line}
      </div>
    );
  }

  if (isBullet && (hasMetric || hasActionVerb)) {
    return (
      <div className="diff-added rounded-sm my-0.5 py-0.5">
        {line}
      </div>
    );
  }

  if (hasMetric) {
    return (
      <div className="diff-improved rounded-sm my-0.5 py-0.5">
        {line}
      </div>
    );
  }

  return <div>{line}</div>;
}
