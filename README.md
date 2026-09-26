# MedEase: The Missed Dose 💊 (PS-02)

**An intelligent, zero-backend medication safety net designed for elderly accessibility and strict data privacy.**

MedEase was built to solve the silent crisis of fragmented healthcare: missed doses, conflicting prescriptions, and medication confusion among elderly populations. Instead of building a surveillance tool or crossing dangerous clinical boundaries, MedEase acts as an assistive bridge between the doctor's prescription and the patient's daily routine.

## 🚀 Key Features

* **Zero-Backend Edge Privacy:** 100% of patient data, profiles, and scheduled doses are encrypted and stored locally in the browser's edge (`localStorage`). No central database, zero risk of mass data breaches.
* **Autonomous Video Proctoring:** Utilizes WebRTC and real-time computer vision to prevent "notification fatigue." The system verifies physical pill packaging to confirm adherence before dispatching alerts.
* **WhatsApp Caregiver Integration:** Secure, deep-linked WhatsApp notifications instantly alert family members when a dose is verified and taken.
* **"Clinical Neo-Clean" Accessibility:** A high-contrast, zero-navigation WebMD-style light theme designed explicitly for elderly users and those with limited digital literacy. Huge typography and color-coded safety states (Emerald/Amber/Crimson).
* **Strict Clinical Boundaries:** MedEase does not provide medical advice. It extracts OCR data via the Gemini Vision API and flags conflicts, immediately redirecting the patient to consult a pharmacist or doctor.

## 🛠️ Technical Architecture

* **Frontend:** React + TypeScript (Vite)
* **Styling:** Tailwind CSS (Custom Clinical Light Theme)
* **AI Engine:** Google Gemini Pro API (Vision/OCR & Structuring)
* **Hardware Interfacing:** HTML5 `mediaDevices` (Camera) & Canvas API
* **State Management:** Edge-native `localStorage` JSON Ledgers

## 💻 Running the Application Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/MedEase-Healthcare-AI.git](https://github.com/yourusername/MedEase-Healthcare-AI.git)

TEAM:ChaturKridinX,
Teammates
@tejasrtejasr587-dotcom
@vikasmaleyur-prog
@sumanssringeri94-create
