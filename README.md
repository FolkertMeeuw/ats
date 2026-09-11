# **Applicant Tracking System (ATS)**

The ATS is an intelligent system designed to analyze and compare resumes against job descriptions using local Large Language Models (via Ollama) and hybrid matching techniques. It extracts key skills, calculates match scores, identifies missing requirements, and provides actionable optimization recommendations.

## **Features**

### **1\. Hybrid Keyword & Skill Extraction**

> * **Resume Parsing:** Automatically extracts core technical skills, frameworks, tools, and professional qualifications from uploaded resumes.  
> * **Job Description Parsing:** Extracts critical requirements, soft skills, and job qualifications directly from text input or uploaded documents.

### **2\. Local LLM Matching via Ollama**

> * **Privacy-First Processing:** Runs entirely locally using local LLM models (e.g., Llama 3\) via Ollama.  
> * **Soft Matching & Contextual Scoring:** Evaluates overall alignment between the resume and job requirements to generate a composite fit score.  
> * **Actionable Insights:** Pinpoints missing keywords and exact areas where the resume should be adjusted.

### **3\. Native PDF Extraction & File Processing**

> * Built-in PDF parsing pipeline supporting document analysis without sending data to external cloud APIs.

## **Project Structure**

Plaintext  
.  
├── backend/  
│   ├── config/             \# Backend configuration  
│   ├── routes/             \# API routes (documents, job, match, resume)  
│   ├── services/           \# Extraction, LLM, and matching logic  
│   ├── tests/              \# Test suites  
│   ├── uploads/            \# Temporary file upload directory  
│   └── server.js           \# Express API server entry point  
├── public/                 \# Static assets  
├── scripts/                \# Startup and setup shell scripts  
│   ├── init\_ollama.sh      \# Script to initialize Ollama models  
│   └── start\_backend.sh    \# Script to launch the backend service  
├── src/  
│   ├── components/         \# React components (FileUpload, JobDescription, MatchResult)  
│   ├── pages/              \# Application pages  
│   ├── utils/              \# Frontend utilities (e.g., pdfExtractor)  
│   ├── App.jsx             \# Main React application component  
│   └── index.js            \# Entry point  
├── .gitignore              \# Git ignore configuration  
├── package.json            \# Root React app dependencies  
└── README.md

## **Getting Started**

### **Prerequisites**

Ensure the following tools are installed on your system:

> * **Node.js** (v18 or later recommended)  
> * **npm**  
> * **Ollama** (running locally with models like llama3.2 pulled)

### **Installation**

> 1. Clone the repository:

Bash  
git clone https://github.com/acenji/ats.git  
cd ats

> 2. Install Root (Frontend) Dependencies:

Bash  
npm install

> 3. Install Backend Dependencies:

Bash  
cd backend  
npm install  
cd ..

### **Setup Ollama**

Ensure Ollama is running locally on port 11434:

Bash  
ollama run llama3.2

*(Alternatively, run ./scripts/init\_ollama.sh if provided)*

## **Running the Application**

### **1\. Start the Backend Server**

From the root directory or inside backend/:

Bash  
cd backend  
node server.js

The Express backend server runs on http://localhost:3001 (or http://localhost:5001 depending on configuration).

### **2\. Start the Frontend React App**

From the root directory, start the development server:

Bash  
npm start

The application will open in your browser at http://localhost:3000.

## **How to Use**

> 1. **Upload Resume:** Upload your resume (PDF or TXT format). The application will extract and display your skill profile.  
> 2. **Add Job Description:** Paste the job posting text or upload the job description PDF.  
> 3. **Extract Requirements:** Extract requirements to generate a structured skill profile for the position.  
> 4. **Run Match Analysis:** Click **Match-Analyse Starten** to process the data with Ollama and generate match scores, missing skills, and step-by-step resume optimization tips.

## **Technologies Used**

> * **Frontend:** React.js, PDF.js  
> * **Backend:** Node.js, Express.js, Cors  
> * **AI/LLM Engine:** Ollama (Local LLM API)

## **License**

This project is open-source and licensed under the MIT License. See the LICENSE file for details.