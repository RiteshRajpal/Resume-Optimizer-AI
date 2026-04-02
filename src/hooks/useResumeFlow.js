// src/hooks/useResumeFlow.js
// ─────────────────────────────────────────────────────────────────────────────
// Central state machine for the resume optimization flow
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef } from 'react';
import { optimizeResume, calcKeywordScore } from '../lib/ai';
import { extractFileText } from '../lib/parsers';
import { saveResume, uploadResumeFile } from '../lib/supabase';
import { generateResumePDF } from '../lib/pdfGen';

const PAGES = Object.freeze({ LANDING: 'landing', DASHBOARD: 'dashboard', LOADING: 'loading', RESULT: 'result' });

export function useResumeFlow() {
  const [page, setPage] = useState(PAGES.LANDING);
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [editedText, setEditedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);
  const [savedResumeId, setSavedResumeId] = useState(null);

  const progressTimer = useRef(null);

  // Animate progress bar
  const animateProgress = useCallback((steps = [10, 30, 65, 90], intervalMs = 900) => {
    let idx = 0;
    clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      if (idx < steps.length) { setProgress(steps[idx]); idx++; }
      else clearInterval(progressTimer.current);
    }, intervalMs);
  }, []);

  // Handle file selection + text extraction
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setExtractedText('');
    try {
      const text = await extractFileText(selectedFile);
      setExtractedText(text);
      return { success: true, text };
    } catch (e) {
      setError(e.message);
      return { success: false, error: e.message };
    }
  }, []);

  // Run the full optimization pipeline
  const runOptimization = useCallback(async () => {
    if (!extractedText || !jobDescription.trim()) return;

    setPage(PAGES.LOADING);
    setProgress(0);
    setError(null);
    animateProgress();

    try {
      // Parallel: upload file + start AI optimization
      const [fileUrl, optimized] = await Promise.allSettled([
        file ? uploadResumeFile(file) : Promise.resolve(null),
        optimizeResume(extractedText, jobDescription),
      ]);

      clearInterval(progressTimer.current);
      setProgress(100);

      if (optimized.status === 'rejected') throw new Error(optimized.reason?.message || 'AI optimization failed');
      
      const optimizedText = optimized.value;
      const { score: atsScore } = calcKeywordScore(optimizedText, jobDescription);

      setEditedText(optimizedText);
      setScore(atsScore);

      // Save to Supabase (non-blocking)
      saveResume({
        originalText: extractedText,
        editedText: optimizedText,
        jobDescription,
        fileName: file?.name,
        fileUrl: fileUrl.value || null,
        atsScore,
      }).then(saved => { if (saved) setSavedResumeId(saved.id); });

      setTimeout(() => setPage(PAGES.RESULT), 400);
    } catch (e) {
      clearInterval(progressTimer.current);
      setProgress(0);
      setError(e.message);
      setPage(PAGES.DASHBOARD);
    }
  }, [extractedText, jobDescription, file, animateProgress]);

  // Download the optimized resume as PDF
  const downloadPDF = useCallback(() => {
    if (!editedText) return;
    const filename = file
      ? `optimized-${file.name.replace(/\.(pdf|docx?)$/i, '')}.pdf`
      : 'optimized-resume.pdf';
    generateResumePDF(editedText, filename);
  }, [editedText, file]);

  // Reset to start a new optimization
  const reset = useCallback(() => {
    setPage(PAGES.LANDING);
    setFile(null);
    setExtractedText('');
    setJobDescription('');
    setEditedText('');
    setProgress(0);
    setScore(null);
    setError(null);
    setSavedResumeId(null);
  }, []);

  const goToDashboard = useCallback(() => setPage(PAGES.DASHBOARD), []);

  return {
    // State
    page, file, extractedText, jobDescription, editedText, progress, score, error, savedResumeId,
    // Setters
    setJobDescription,
    // Actions
    handleFileSelect, runOptimization, downloadPDF, reset, goToDashboard,
    // Constants
    PAGES,
  };
}
