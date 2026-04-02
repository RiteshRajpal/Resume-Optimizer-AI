Resume Optimizer AI

Tailor Your Resume for Every Job in Seconds

An AI-powered web application that transforms generic resumes into job-specific, ATS-optimized applications using intelligent analysis of job descriptions.

🌐 Live Demo

👉 Try it here

https://resume-optimizer-ai-8x1o-jy5h56w0g-riteshrajpals-projects.vercel.app/

🧠 Problem Statement

Most candidates are rejected not due to lack of skills, but because their resumes are not aligned with job descriptions or ATS systems.

💡 Solution

Resume Optimizer AI bridges this gap by:

Analyzing job descriptions
Matching them with your resume
Rewriting content to improve ATS score and recruiter appeal
✨ Key Features
📄 Resume Upload (PDF/DOCX)
Upload your resume and extract text automatically
🧠 AI-Powered Resume Optimization
Uses LLMs (Groq / OpenAI / Gemini / Claude)
🎯 Job Description Matching
Aligns skills, keywords, and experience
📊 Keyword Score & ATS Optimization
Improves visibility in hiring systems
⚡ Fast Processing
Generates optimized resumes in seconds
🧩 Multi-Provider AI Fallback System
Ensures reliability across APIs
🎨 Modern SaaS UI
Dark-themed, responsive, and clean interface
🛠️ Tech Stack
Frontend
Next.js (App Router)
React
Tailwind CSS
Backend
Next.js API Routes
AI Integration
Groq API (primary)
OpenAI / Gemini / Anthropic (fallback support)
Database
Supabase
Deployment
Vercel
⚙️ How It Works
Upload your resume
Paste the job description
AI analyzes both inputs
Generates an optimized resume
Download and apply 🚀
📂 Project Structure
app/            # Next.js app router (frontend + API routes)
lib/            # AI logic, env handling, utilities
supabase/       # Database schema/config
🔐 Environment Variables

Create .env.local for local development:

GROQ_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
ANTHROPIC_API_KEY=your_api_key
SUPABASE_SERVICE_ROLE_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_url

👉 In production (Vercel), add these in Environment Variables settings

🚀 Installation & Setup
git clone https://github.com/RiteshRajpal/Resume-Optimizer-AI
npm install
npm run dev
💼 Why This Project Stands Out
Solves a real-world hiring problem
Demonstrates end-to-end full-stack development
Integrates AI into a practical application
Built with scalable SaaS architecture
Handles production-level challenges (env, deployment, API fallback)
🔥 Future Enhancements
📈 Resume scoring dashboard
🧾 Multiple resume templates
🔍 Keyword gap analysis
👤 User authentication & saved resumes
💳 Monetization (subscription model)
👨‍💻 Author

Ritesh Rajpal

Full Stack Developer (AI-focused)
Passionate about building real-world SaaS products
⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!
