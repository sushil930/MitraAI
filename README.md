# Gentle AI Greet – Project Overview

## Table of Contents
- [Project Description](#project-description)
- [Features](#features)
- [Architecture](#architecture)
- [Backend (Flask)](#backend-flask)
- [Frontend (React + Vite)](#frontend-react--vite)
- [Key Components](#key-components)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Custom Domain & Deployment](#custom-domain--deployment)

---

## Project Description
Gentle AI Greet is a full-stack AI-powered assistant web application. It enables users to chat with an AI, analyze documents and images, translate text, convert images to PDF, and more. The project is built with a modern React frontend (TypeScript, Vite, Tailwind CSS) and a Python Flask backend leveraging Google Gemini AI, Google Translate, and various document/image processing libraries.

## Features
- **Conversational AI Assistant** (Gemini-powered)
- **Document Analysis** (PDF text extraction)
- **Image Analysis & Search** (AI-powered keyword extraction, Google Images search)
- **Image to PDF Conversion** (multi-image upload, high-quality PDF output)
- **Text Translation** (Google Translate API)
- **Weather Information** (AccuWeather integration)
- **Conversation History & Management**
- **User Preferences** (language, gender, name)
- **Modern UI/UX** (responsive, accessible, shadcn-ui, Tailwind CSS)

## Architecture
- **Backend:** Python Flask REST API (in `backend/main.py`), with endpoints for AI chat, document/image upload, translation, weather, and PDF generation.
- **Frontend:** React SPA (in `src/`), with modular components for chat, file upload, modals, and tool integrations.
- **State Management:** React hooks and localStorage for user preferences and conversation history.

## Backend (Flask)
- **Main File:** `backend/main.py`
  - Endpoints:
    - `/search`: Conversational AI (Gemini)
    - `/search-image`: AI-powered image keyword extraction & Google Images search
    - `/upload-doc`: PDF document text extraction
    - `/images-to-pdf`: Converts up to 10 images to a high-quality PDF (uses Pillow & ReportLab)
    - `/get-weather`: Fetches weather data from AccuWeather
    - `/translate`: Text translation via Google Translate
  - **Technologies:** Flask, flask-cors, google-generativeai, Pillow, ReportLab, PyPDF2, pdfplumber, pytesseract, python-docx, PyMuPDF, dotenv
  - **Requirements:** See `backend/requirements.txt` for all dependencies
  - **Environment:** Requires `.env` with API keys (Gemini, AccuWeather, Google Cloud credentials)

## Frontend (React + Vite)
- **Entry Point:** `src/App.tsx` (sets up routing, providers, and main layout)
- **Key Utilities:**
  - `src/utils/apiService.ts`: Handles all API calls to the backend (AI, document/image upload, translation, weather, PDF conversion)
  - `src/utils/assistantUtils.ts`: Provides greeting logic, placeholder text, file size formatting, and assistant name selection
- **Main Components:**
  - `AIAssistant.tsx`: Core chat interface, manages conversation, file uploads, and tool modals
  - `FileUpload.tsx`: Handles file/image uploads and displays previews
  - `ImageToPdfModal.tsx`: Modal for selecting images and converting them to PDF
  - Other modals: `NameModal`, `SettingsModal`, `TranslationModal`, `WeatherModel`, `QrScannerModal`
- **Styling:** Tailwind CSS (`src/App.css` for custom styles)
- **UI Library:** shadcn-ui

## Key Components
- **AIAssistant.tsx:** Main chat logic, integrates all tools, manages state, and interacts with backend via `apiService`.
- **FileUpload.tsx:** Drag-and-drop or select files, preview images, remove files, and trigger image search.
- **ImageToPdfModal.tsx:** Select up to 10 images, convert to PDF using backend, download result.
- **apiService.ts:** Centralized API handler for all backend endpoints, with error handling and response validation.
- **assistantUtils.ts:** Utility functions for greetings, placeholders, file size formatting, and assistant name selection.

## Setup & Installation
### Prerequisites
- Node.js & npm (for frontend)
- Python 3.8+ (for backend)
- API keys for Gemini, AccuWeather, and Google Cloud Translate

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
# Set up .env with required API keys
python main.py
```
