# HealthSense - AI Health Assistant 🩺

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/>
</p>

<p align="center">
  <a href="https://www.kaggle.com/competitions/gemini-3">
    <img src="https://img.shields.io/badge/🏆_Kaggle-Gemini_3_Competition-20BEFF?style=for-the-badge" alt="Kaggle Competition"/>
  </a>
</p>

---

### 🎨 Vibe Coding Project

> **This project was created as part of the [Google DeepMind - Vibe Code with Gemini 3 Pro in AI Studio](https://www.kaggle.com/competitions/gemini-3) competition on Kaggle.**

Built using the power of **vibe coding** — a creative, AI-assisted development approach where developers collaborate with AI to rapidly prototype and build innovative applications.

🔗 **Learn more about the competition:** [https://www.kaggle.com/competitions/gemini-3](https://www.kaggle.com/competitions/gemini-3)

---

You can visit and test the app on [my Google AI Studio](https://ai.studio/apps/drive/1MEdLXshwAW8p5g3b6CQ_g8k8iyZAiK87?fullscreenApplet=true)

HealthSense is a sophisticated, multimodal health companion web application designed to help users understand visible symptoms through AI analysis. It leverages the power of Google's **Gemini 2.5 Flash** model to provide safety-focused guidance, risk assessments, and location-based resources.

> **⚠️ Disclaimer:** HealthSense is an AI tool, not a medical device. It does not provide medical diagnoses. Always consult a licensed healthcare professional for medical concerns.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Privacy & Safety](#-privacy--safety)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Key Features

### 🔬 Multimodal Symptom Analysis

| Feature              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| **Live Camera Scan** | Real-time symptom scanning with a futuristic UI          |
| **Image Upload**     | Analyze existing photos of rashes, swelling, or injuries |
| **Text & Voice**     | Describe symptoms via text or use hands-free Voice Chat  |

### 📊 Smart Risk Assessment

- Automatically categorizes symptoms into **Low**, **Medium**, or **High** risk levels
- Provides structured advice including home care steps and red flags to watch for

### 👥 Personalized Profiles

Create profiles for family members with specific health modes:

| Mode          | Focus Area                                                |
| ------------- | --------------------------------------------------------- |
| **Common**    | Standard adult health advice                              |
| **Child**     | Pediatric focus (gentler, behavior-oriented)              |
| **Pregnancy** | Obstetric focus (maternal/fetal safety)                   |
| **Elderly**   | Geriatric focus (medication interactions, skin fragility) |

> 💡 **Guest Mode:** Use the app without creating a profile

### 🎙️ Voice Integration

- **Text-to-Speech:** The AI reads responses aloud (optional)
- **Voice Chat:** Continuous, conversational loop (Speak → AI Responds → Listen)

### 📍 Location Services

- Find nearby **Hospitals** and **Pharmacies** using Google Maps grounding

### 🛠️ Tools & Utilities

- **PDF Export:** Generate a professional health report for your doctor
- **Dark Mode:** Full dark theme support for low-light usage
- **System Diagnostics:** Built-in self-check for camera, mic, and API connectivity
- **Privacy First:** All chat history and profiles are stored locally in the browser (`localStorage`)

---

## 🛠️ Tech Stack

| Category           | Technology                                                     |
| ------------------ | -------------------------------------------------------------- |
| **Frontend**       | React 19, TypeScript                                           |
| **Build Tool**     | Vite 6.2                                                       |
| **Styling**        | Tailwind CSS                                                   |
| **AI Model**       | Google Gemini API (`gemini-2.5-flash`) via `@google/genai` SDK |
| **Voice**          | Web Speech API (Recognition) & Gemini TTS (Synthesis)          |
| **PDF Generation** | jsPDF                                                          |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/healthsense.git

# Navigate to project directory
cd healthsense

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

---

## 📁 Project Structure

```
healthsense/
├── components/
│   └── MarkdownRenderer.tsx    # Markdown rendering
├── services/
│   └── geminiService.ts   # Gemini API integration
├── App.tsx                     # Main application
├── index.tsx                   # Entry point
├── index.html                  # HTML template
├── types.ts    # TypeScript type definitions
├── vite.config.ts     # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json      # Dependencies and scripts
```

---

## ⚙️ Configuration

### Available Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |

---

## 💡 Usage

1. **Start a new chat** or continue an existing conversation
2. **Choose input method:**
   - Type your symptoms in the text box
   - Use voice input by clicking the microphone icon
   - Upload an image of visible symptoms
   - Use live camera scan for real-time analysis
3. **Review the AI assessment** with risk level and recommendations
4. **Find nearby healthcare** using the location services
5. **Export a PDF report** for your healthcare provider

---

## 🔒 Privacy & Safety

| Feature               | Description                                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| **Local Storage**     | User data stays on the device                                                  |
| **Safety Guardrails** | AI avoids medical diagnosis and prioritizes safety                             |
| **Disclaimers**       | Constant reminders that AI is not a substitute for professional medical advice |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for better health awareness
</p>
