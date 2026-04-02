import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Resume Editor — ATS-Optimized Resumes in Seconds",
  description:
    "Upload your resume, paste a job description, and let AI tailor your resume for maximum ATS score and job relevance.",
  keywords: ["resume editor", "ATS optimization", "AI resume", "job application"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
