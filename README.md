# TalentSync – Trusted Student Job & Internship Platform

A secure recruitment platform where only verified companies can hire students, powered by AI, ML, and automated government verification.

## Problem Statement

Many students apply for internships and jobs through platforms like LinkedIn, Internshala, Indeed, and Naukri. However, many fake companies:
* Post fraudulent internships/jobs
* Demand money for certificates or training
* Scam students with fake offers

Students often cannot identify which companies are genuine.

## Solution Overview

TalentSync solves this by creating a fraud-proof verified hiring ecosystem.

### Features

#### 1. Automated Company Verification via Government API
When a company registers, they must enter their Company Name, Government Registration ID, GST/CIN/License Number, and Official Email & Address. The system connects with the Government registration database API to automatically check whether the company exists legally, its registration validity, and license authenticity. If matched, the company gets auto-verified within 1 hour.
- **Benefits:** Faster verification, no fake companies, less manual admin work, scalable system.

#### 2. AI + ML Resume Analysis for Students
A smart Resume Matching System that analyzes skills, education, experience, certifications, and keywords from the uploaded resume. The system automatically recommends only relevant jobs matching the student's profile.
- **Benefits:** Personalized job feed, faster application process, better matching accuracy.

#### 3. Real-Time IT Industry News Feed
Students get live real-time IT news updates (tech layoffs, hiring trends, new company openings, startup funding, emerging technologies) using APIs like TechCrunch, Google News, or NewsAPI.
- **Benefits:** Keeps students industry-aware, helps prepare for interviews, improves career knowledge.

## System Modules

* **Student Panel:** Register/Login, Upload Resume, AI job recommendations, Apply to verified jobs, Get IT news updates.
* **Company Panel:** Register company, Submit government ID, Auto-verification system, Post job openings.
* **Admin Dashboard:** Monitor registrations, Review suspicious companies, Handle fraud reports, Manage disputes.

## Technology Stack

* **Frontend:** React 19 + Vite + React Router + Tailwind CSS (Web App)
* **Backend:** Node.js + Express 5 (REST APIs) with JWT auth
* **Database:** MongoDB (Mongoose ODM; supports in-memory MongoDB for local dev)
* **AI/ML:** Built-in Node TF-IDF matching engine + Python FastAPI microservice (Gemini, scikit-learn); Affinda + local `pdf-parse` resume parsing
* **External APIs:** Government Registration Verification API (mocked), Google Gemini AI, News API

## Innovations & Future Expansions

* **Unique advantages:** Verified companies only, government API integration, AI resume-based job matching, real-time IT news for students, scam prevention model.
* **Future Expansion Ideas:** AI interview preparation chatbot, video interview scheduling, fraud complaint tracker, internship certificate blockchain verification.
* **Revenue Model:** Premium company subscriptions, featured job listings, campus recruitment partnerships, paid verified badges.

---

### Folder Structure

- `/frontend` - Contains the React (Vite) frontend web application.
- `/backend` - Contains the Node.js/Express backend code and REST APIs.
- `/ML_service` - Contains the Python FastAPI microservice and ML utilities for AI matching, parsing, and fraud detection.

