# CareerEdge AI: Resume Analyzer & Interviewer

CareerEdge AI is a comprehensive career development suite designed to help job seekers optimize their resumes and master their interview skills using state-of-the-art AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%2019-blue)
![Express](https://img.shields.io/badge/Backend-Express-green)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![Firebase](https://img.shields.io/badge/Database-Firebase-yellow)

## 🚀 Key Features

### 📄 Resume Analyzer (ATS Optimization)
- **ATS Compatibility Scoring:** Get an instant score based on industry-standard applicant tracking systems.
- **Strength & Weakness Detection:** Identify exactly what is working and what needs improvement.
- **Key Skills Extraction:** Automatically detect and highlight your core competencies.
- **Job Description Match:** Compare your resume against specific job descriptions for target roles.

### 🎙️ AI Career Lab (Mock Interviews)
- **Domain-Specific Interviews:** Technical, Behavioral, and Core CS question sets tailored to your profile.
- **Real-Time Facial Monitoring:** Analyzes confidence and engagement during the interview.
- **Speech Evaluation:** Evaluates your answers for knowledge grasp and articulation quality.
- **Coach's Feedback:** Receive a detailed performance report with an accuracy score and actionable tips.

### 📊 Personalized Dashboard
- **History Tracking:** Save and revisit past resume analyses and interview results.
- **Career Compass:** Get AI-driven recommendations for specific career domains and roles based on your background.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Recharts.
- **Backend:** Express.js (Node.js).
- **AI Engine:** Google Gemini (Gemini 3 Flash).
- **Cloud Services:** Firebase Authentication, Firestore Database.

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- A Firebase Project
- A Google AI Studio (Gemini) API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/careeredge-ai.git
   cd careeredge-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following keys (see `.env.example` for reference):
   ```env
   # Gemini API
   API_KEY=your_gemini_api_key

   # Firebase Client Config
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the application:**

   **Development Mode:**
   ```bash
   npm run dev
   ```

   **Production Build:**
   ```bash
   npm run build
   npm start
   ```

## 🔒 Security
This project uses a full-stack architecture. Sensitive API keys (like Gemini) are never exposed to the client-side; all AI processing happens on the secure Express backend.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
*Empowering your career journey with AI intelligence.*
