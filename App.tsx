
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Role, DISCLAIMER_TEXT, ChatSessionSummary, Profile, RiskLevel, HealthMode } from './types';
import { sendMessageToGemini, startNewChat, checkConnection, generateSpeech } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';
import { jsPDF } from "jspdf";

// --- Icons ---
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

const MicIcon = ({ listening }: { listening: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={listening ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${listening ? "text-red-500 animate-pulse" : "text-slate-500 dark:text-slate-400"}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
  </svg>
);

const SpeakerIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const ChatBubbleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
);

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const SystemCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
);

const MicrophoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
  </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-400 mb-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-red-400 mb-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

// --- Constants ---
const WELCOME_MSG = "Hello, I'm HealthSense. Please upload a clear photo of your visible symptom (like a rash, bite, or swelling) so I can help you understand what might be going on.\n\nRemember: I am an AI, not a doctor.";
const OLD_STORAGE_KEY = 'hs_chat_history';
const SESSIONS_INDEX_KEY = 'hs_sessions_index';
const PROFILES_KEY = 'hs_profiles';
const SESSION_PREFIX = 'hs_session_';

const AVATAR_COLORS = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];

// --- Audio Helper Functions (Raw PCM) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [view, setView] = useState<'AUTH' | 'CHAT'>('AUTH');
  
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice & Audio States
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const voiceChatActiveRef = useRef(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [scanPhase, setScanPhase] = useState<'SEARCHING' | 'LOCKING' | 'DETECTED'>('SEARCHING');
  const [analysisNodes, setAnalysisNodes] = useState<{x: number, y: number, id: number}[]>([]);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNewProfileMode, setIsNewProfileMode] = useState(false);
  
  // Permissions State
  const [permissionRequest, setPermissionRequest] = useState<'camera' | 'microphone' | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'denied'>('idle');
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);

  // Diagnostics
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, 'PENDING' | 'SUCCESS' | 'FAILURE'>>({});

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('hs_dark_mode') === 'true' || 
               (!('hs_dark_mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Initialization ---
  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('hs_dark_mode', 'true');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('hs_dark_mode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    // 1. Load Profiles
    let loadedProfiles: Profile[] = [];
    try {
        const storedProfiles = localStorage.getItem(PROFILES_KEY);
        if (storedProfiles) {
            loadedProfiles = JSON.parse(storedProfiles);
            loadedProfiles = loadedProfiles.map(p => ({ ...p, mode: p.mode || 'COMMON' }));
        }
    } catch(e) { console.error(e); }
    setProfiles(loadedProfiles);

    // 2. Load Sessions
    let loadedSessions: ChatSessionSummary[] = [];
    try {
        const storedIndex = localStorage.getItem(SESSIONS_INDEX_KEY);
        if (storedIndex) {
            loadedSessions = JSON.parse(storedIndex);
        }
    } catch (e) { console.error(e); }

    setSessions(loadedSessions);

    if (loadedProfiles.length === 0) {
        setIsNewProfileMode(true);
    }

    // Voice Init
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (voiceChatActiveRef.current) {
             // In Voice Chat mode, we send immediately
             setIsListening(false);
             handleSendMessage(transcript);
        } else {
             // In regular mode, we append to text
             setInputText((prev) => prev ? `${prev} ${transcript}` : transcript);
             setIsListening(false);
        }
      };
      recognitionRef.current.onerror = (e: any) => {
          console.error("Speech error", e);
          setIsListening(false);
      };
      recognitionRef.current.onend = () => {
          setIsListening(false);
      };
    }
  }, []);
  
  // Simulated Analysis Animation Loop
  useEffect(() => {
    let interval: any;
    if (isCameraModalOpen && scanPhase !== 'DETECTED') {
        // Occasionally generate random nodes
        interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const newNode = { 
                    x: 20 + Math.random() * 60, // Keep central
                    y: 20 + Math.random() * 60, 
                    id: Date.now() 
                };
                setAnalysisNodes(prev => [...prev.slice(-4), newNode]); // Keep last 5
            }
        }, 800);
        
        // Simulate Locking Logic
        if (scanPhase === 'SEARCHING') {
            setTimeout(() => setScanPhase('LOCKING'), 3000);
        }
        if (scanPhase === 'LOCKING') {
            setTimeout(() => setScanPhase('DETECTED'), 2000);
        }
    }
    return () => clearInterval(interval);
  }, [isCameraModalOpen, scanPhase]);

  // Sync Ref with State for event handlers
  useEffect(() => {
      voiceChatActiveRef.current = isVoiceChatOpen;
      if (!isVoiceChatOpen) {
          stopAudio();
          if (isListening && recognitionRef.current) recognitionRef.current.stop();
      }
  }, [isVoiceChatOpen, isListening]);

  // --- Logic Helpers ---

  const getProfile = (id: string | null) => profiles.find(p => p.id === id);

  const loginProfile = (profileId: string) => {
      setCurrentProfileId(profileId);
      const profileSessions = sessions.filter(s => s.profileId === profileId);
      if (profileSessions.length > 0) {
          loadSession(profileSessions[0].id);
      } else {
          createNewSession(profileId);
      }
      setView('CHAT');
  };

  const continueAsGuest = () => {
      setCurrentProfileId(null);
      createNewSession(null);
      setView('CHAT');
  };

  const logout = () => {
      setCurrentProfileId(null);
      setCurrentSessionId(null);
      setMessages([]);
      setView('AUTH');
      setIsSidebarOpen(false);
      stopAudio();
  };

  const createNewSession = (profileId: string | null = currentProfileId) => {
    const newId = Date.now().toString();
    const initialMessages = [{
        id: 'welcome',
        role: Role.MODEL,
        text: WELCOME_MSG
    }];
    
    setMessages(initialMessages);
    setCurrentSessionId(newId);
    setCurrentProfileId(profileId);
    setInputText('');
    setSelectedImage(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    startNewChat(undefined, getProfile(profileId));
  };

  const loadSession = (sessionId: string) => {
      stopAudio();
      try {
          const sessionMeta = sessions.find(s => s.id === sessionId);
          if(sessionMeta && sessionMeta.profileId) {
             setCurrentProfileId(sessionMeta.profileId);
          } else if (sessionMeta && !sessionMeta.profileId) {
             setCurrentProfileId(null);
          }

          const data = localStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
          if (data) {
              const parsedMessages: ChatMessage[] = JSON.parse(data);
              setMessages(parsedMessages);
              setCurrentSessionId(sessionId);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
              
              const sdkHistory = parsedMessages
                  .filter(m => m.id !== 'welcome' && !m.isError)
                  .map(m => {
                      const parts: any[] = [];
                      if (m.image) {
                          const base64Data = m.image.split(',')[1] || m.image;
                          parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
                      }
                      if (m.text) parts.push({ text: m.text });
                      return { role: m.role, parts };
                  });
              startNewChat(sdkHistory, getProfile(sessionMeta?.profileId || null));
          } else {
              createNewSession(sessionMeta?.profileId || currentProfileId);
          }
      } catch (e) {
          console.error("Failed load", e);
          createNewSession(currentProfileId);
      }
  };

  const updateCurrentSessionData = useCallback((newMessages: ChatMessage[]) => {
      if (!currentSessionId) return;
      try {
          localStorage.setItem(`${SESSION_PREFIX}${currentSessionId}`, JSON.stringify(newMessages));
      } catch (e) { console.warn(e); }

      const userMsg = newMessages.find(m => m.role === Role.USER);
      if (userMsg) {
          setSessions(prevSessions => {
              const sessionIndex = prevSessions.findIndex(s => s.id === currentSessionId);
              const pId = currentProfileId || ""; 
              
              const summaryData = {
                  id: currentSessionId,
                  title: userMsg.text.substring(0, 30) || "Image Analysis",
                  date: Date.now(),
                  preview: userMsg.text.substring(0, 60),
                  profileId: pId
              };

              if (sessionIndex === -1) {
                  const updated = [summaryData, ...prevSessions];
                  localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(updated));
                  return updated;
              } else {
                  const updatedSessions = [...prevSessions];
                  if (!updatedSessions[sessionIndex].title || updatedSessions[sessionIndex].title === "New Chat") {
                    updatedSessions[sessionIndex].title = summaryData.title;
                  }
                  updatedSessions[sessionIndex].preview = summaryData.preview;
                  updatedSessions[sessionIndex].date = Date.now();
                  const [moved] = updatedSessions.splice(sessionIndex, 1);
                  updatedSessions.unshift(moved);
                  
                  localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(updatedSessions));
                  return updatedSessions;
              }
          });
      }
  }, [currentSessionId, currentProfileId]);

  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
        updateCurrentSessionData(messages);
    }
  }, [messages, currentSessionId, updateCurrentSessionData]);

  // --- Audio Logic ---
  const stopAudio = () => {
      if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
      }
      setIsSpeaking(false);
  };

  const playResponseAudio = async (text: string, onEnded?: () => void) => {
      // Clean disclaimer from audio to avoid repetition
      const cleanText = text.replace(/Disclaimer: HealthSense.*/i, '').trim();
      if(!cleanText) {
          if (onEnded) onEnded();
          return;
      }

      stopAudio();
      setIsSpeaking(true);

      const base64Data = await generateSpeech(cleanText);
      if (!base64Data) {
          setIsSpeaking(false);
          if (onEnded) onEnded();
          return;
      }

      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          
          const audioCtx = audioContextRef.current;
          // Decode raw PCM
          const bytes = decode(base64Data);
          const dataInt16 = new Int16Array(bytes.buffer);
          const channelCount = 1;
          const frameCount = dataInt16.length / channelCount;
          
          const buffer = audioCtx.createBuffer(channelCount, frameCount, 24000);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < frameCount; i++) {
               channelData[i] = dataInt16[i] / 32768.0;
          }

          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.onended = () => {
              setIsSpeaking(false);
              if (onEnded) onEnded();
          };
          source.start();
          audioSourceRef.current = source;
      } catch (e) {
          console.error("Audio playback failed", e);
          setIsSpeaking(false);
          if (onEnded) onEnded();
      }
  };

  // --- Permission Request Handling ---
  const requestPermission = (type: 'camera' | 'microphone') => {
      if (type === 'camera' && hasCameraPermission) {
          openCamera();
          return;
      }
      if (type === 'microphone' && hasMicPermission) {
          openVoiceChat();
          return;
      }
      setPermissionRequest(type);
      setPermissionStatus('idle');
  };

  const confirmPermission = async () => {
      if (!permissionRequest) return;
      
      try {
          if (permissionRequest === 'camera') {
             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
             stream.getTracks().forEach(t => t.stop()); 
             setHasCameraPermission(true);
             setPermissionRequest(null);
             openCamera();
          } else {
             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
             stream.getTracks().forEach(t => t.stop());
             setHasMicPermission(true);
             setPermissionRequest(null);
             openVoiceChat();
          }
      } catch (err: any) {
          console.error("Permission denied", err);
          setPermissionStatus('denied');
      }
  };

  const closePermissionModal = () => {
      setPermissionRequest(null);
      setPermissionStatus('idle');
  };

  // --- Voice Logic ---
  const openVoiceChat = () => {
      if (!recognitionRef.current) {
          alert("Voice not supported in this browser.");
          return;
      }
      stopAudio();
      setIsVoiceChatOpen(true);
      setIsListening(true);
      try { recognitionRef.current.start(); } catch(e) {}
  };
  
  const startVoiceChat = () => {
      requestPermission('microphone');
  };
  
  const stopVoiceChat = () => {
      setIsVoiceChatOpen(false);
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudio();
  };

  // --- Action Handlers ---

  const handleSendMessage = async (textOverride?: string | React.SyntheticEvent) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;

    if ((!textToSend.trim() && !selectedImage) || isLoading) return;
    if (textToSend.trim().toLowerCase() === 'exit') {
        logout();
        return;
    }

    // Stop previous audio if user interrupts
    stopAudio();

    const currentImage = selectedImage;
    const currentText = textToSend;
    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
        id: userMsgId, role: Role.USER, text: currentText, image: currentImage || undefined
    }]);

    setIsLoading(true);

    try {
      const { text: responseText, groundingMetadata } = await sendMessageToGemini(currentText, currentImage || undefined);
      
      let riskLevel: RiskLevel | undefined = undefined;
      const riskMatch = responseText.match(/RISK_LEVEL:\s*(LOW|MEDIUM|HIGH)/i);
      let cleanText = responseText;
      
      if (riskMatch) {
          riskLevel = riskMatch[1].toUpperCase() as RiskLevel;
          cleanText = responseText.replace(/RISK_LEVEL:\s*(LOW|MEDIUM|HIGH)/i, '').trim();
      }

      setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: Role.MODEL,
          text: cleanText,
          riskLevel,
          groundingMetadata
      }]);
      
      // Voice Output Logic
      const shouldSpeak = voiceMode || voiceChatActiveRef.current;
      
      if (shouldSpeak) {
          playResponseAudio(cleanText, () => {
              // If in Voice Chat mode, restart listening after AI finishes speaking (loop)
              if (voiceChatActiveRef.current) {
                  setIsListening(true);
                  try { recognitionRef.current.start(); } catch(e) {}
              }
          });
      }

    } catch (error: any) {
      setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), 
          role: Role.MODEL, 
          text: error.message || "I'm sorry, I encountered an unexpected error. Please try again.", 
          isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(newSessions));
    localStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
    if (currentSessionId === sessionId) {
        newSessions.length > 0 ? loadSession(newSessions[0].id) : createNewSession(currentProfileId);
    }
  };

  // --- Profile Management ---
  const saveProfile = (name: string, age: string, details: string, mode: HealthMode) => {
      const newProfile: Profile = {
          id: Date.now().toString(),
          name, age, details,
          avatarColor: AVATAR_COLORS[profiles.length % AVATAR_COLORS.length],
          mode
      };
      const updated = [...profiles, newProfile];
      setProfiles(updated);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
      
      setIsProfileModalOpen(false);
      setIsNewProfileMode(false);
      
      if (view === 'AUTH') {
        loginProfile(newProfile.id);
      }
  };

  const switchProfile = (id: string) => {
      if(window.confirm("Switch to this profile?")) {
        loginProfile(id);
        setIsProfileModalOpen(false);
      }
  };

  // --- Camera Logic ---
  const startCamera = () => {
      requestPermission('camera');
  };

  const openCamera = async () => {
    stopAudio();
    setIsCameraModalOpen(true);
    setScanPhase('SEARCHING');
    setAnalysisNodes([]);
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err: any) {
        console.error("Camera error", err);
        setIsCameraModalOpen(false);
        // Error is handled upstream usually, but safe catch here
        alert("Unable to access camera. It may be in use or blocked.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setSelectedImage(dataUrl);
            stopCamera();
        }
    }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraModalOpen(false);
  };

  // --- Diagnostics Logic ---
  const runDiagnostics = async () => {
      stopAudio();
      setDiagnosticResults({
          browser: 'PENDING',
          storage: 'PENDING',
          media: 'PENDING',
          api: 'PENDING'
      });

      await new Promise(r => setTimeout(r, 600)); 
      const browserCheck = !!window.localStorage && !!navigator.mediaDevices;
      setDiagnosticResults(prev => ({ ...prev, browser: browserCheck ? 'SUCCESS' : 'FAILURE' }));

      try {
          localStorage.setItem('hs_test_write', 'ok');
          const val = localStorage.getItem('hs_test_write');
          localStorage.removeItem('hs_test_write');
          if (val === 'ok') {
            setDiagnosticResults(prev => ({ ...prev, storage: 'SUCCESS' }));
          } else {
            throw new Error("Read failed");
          }
      } catch (e) {
          setDiagnosticResults(prev => ({ ...prev, storage: 'FAILURE' }));
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach(t => t.stop());
          setDiagnosticResults(prev => ({ ...prev, media: 'SUCCESS' }));
      } catch (e) {
          setDiagnosticResults(prev => ({ ...prev, media: 'FAILURE' }));
      }

      const apiStatus = await checkConnection();
      setDiagnosticResults(prev => ({ ...prev, api: apiStatus ? 'SUCCESS' : 'FAILURE' }));
  };


  // --- Export Logic (PDF) ---
  const exportReport = () => {
      const currentProfile = getProfile(currentProfileId);
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229);
      doc.text("HealthSense Report", 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      
      // Profile Info
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Profile: ${currentProfile?.name || 'Guest'}`, 20, 45);
      doc.text(`Age: ${currentProfile?.age || 'N/A'}`, 100, 45);
      doc.text(`Mode: ${currentProfile?.mode || 'Common'}`, 150, 45);
      
      if (currentProfile?.details) {
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Notes: ${currentProfile.details}`, 20, 52);
      }
      
      doc.line(20, 58, 190, 58);
      
      let yPos = 70;
      
      messages.forEach((msg) => {
          if (msg.role === 'model' && msg.id === 'welcome') return; // Skip welcome message
          
          if (yPos > 270) {
              doc.addPage();
              yPos = 20;
          }
          
          // Role
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          if (msg.role === Role.USER) {
              doc.setTextColor(79, 70, 229);
              doc.text("User:", 20, yPos);
          } else {
              doc.setTextColor(22, 163, 74); // Green for AI
              doc.text("HealthSense AI:", 20, yPos);
          }
          
          yPos += 5;
          
          // Image?
          if (msg.image) {
               try {
                   // Constrain image size
                   const imgProps = doc.getImageProperties(msg.image);
                   const width = 60;
                   const height = (imgProps.height * width) / imgProps.width;
                   
                   if (yPos + height > 270) {
                       doc.addPage();
                       yPos = 20;
                   }
                   
                   doc.addImage(msg.image, 'JPEG', 20, yPos, width, height);
                   yPos += height + 5;
               } catch (e) {
                   // If image fails, just skip
               }
          }
          
          // Text
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50);
          
          // Clean text
          const cleanText = msg.text.replace(/\*\*/g, '').replace(/__/g, '').replace(/#/g, '');
          const splitText = doc.splitTextToSize(cleanText, 170); // 190 - 20 margin
          
          // check height
          const textHeight = splitText.length * 4; // approx
           if (yPos + textHeight > 270) {
               doc.addPage();
               yPos = 20;
           }
          
          doc.text(splitText, 20, yPos);
          yPos += textHeight + 5;
          
          // Risk Level
          if (msg.riskLevel) {
               doc.setFont("helvetica", "bold");
               if (msg.riskLevel === 'HIGH') doc.setTextColor(220, 38, 38);
               else if (msg.riskLevel === 'MEDIUM') doc.setTextColor(217, 119, 6);
               else doc.setTextColor(5, 150, 105);
               
               doc.text(`Risk Assessment: ${msg.riskLevel}`, 20, yPos);
               yPos += 10;
          } else {
               yPos += 5;
          }
          
          // Divider
          doc.setDrawColor(240);
          doc.line(20, yPos, 190, yPos);
          yPos += 10;
      });
      
      // Footer Disclaimer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const disclaimerLines = doc.splitTextToSize(DISCLAIMER_TEXT, 170);
        doc.text(disclaimerLines, 20, 285);
      }
      
      doc.save(`HealthSense_Report_${Date.now()}.pdf`);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentProfile = getProfile(currentProfileId);

  // --- Login / Auth View ---
  if (view === 'AUTH') {
      return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-800 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden transition-colors">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg transform -rotate-6">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                      </div>
                      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">HealthSense</h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-2">Your Multimodal Health Companion</p>
                  </div>

                  {!isNewProfileMode && profiles.length > 0 ? (
                      <div className="space-y-4">
                          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">Select Profile</p>
                          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                              {profiles.map(p => (
                                  <button key={p.id} onClick={() => loginProfile(p.id)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-all group">
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl text-white font-bold shadow-sm ${p.avatarColor}`}>
                                        {p.name[0].toUpperCase()}
                                      </div>
                                      <div className="text-left flex-1">
                                          <div className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.name}</div>
                                          <div className="text-xs text-slate-400">{p.mode} Mode • {p.age} yrs</div>
                                      </div>
                                      <div className="text-slate-300 group-hover:text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></div>
                                  </button>
                              ))}
                          </div>
                          <button onClick={() => { setIsNewProfileMode(true); }} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all font-medium mt-4 flex items-center justify-center gap-2">
                              <PlusIcon /> Create New Profile
                          </button>
                      </div>
                  ) : (
                      <div className="animate-slide-up-fade">
                          <div className="flex items-center justify-between mb-6">
                              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create Profile</h2>
                              {profiles.length > 0 && <button onClick={() => setIsNewProfileMode(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Cancel</button>}
                          </div>
                          <form onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as any;
                              saveProfile(form.pName.value, form.pAge.value, form.pNotes.value, form.pMode.value);
                          }} className="space-y-4">
                              <div className="grid grid-cols-3 gap-3">
                                  <div className="col-span-2 space-y-1">
                                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Name</label>
                                      <input name="pName" required placeholder="e.g. Sarah" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Age</label>
                                      <input name="pAge" required placeholder="30" type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                  </div>
                              </div>
                              
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Mode</label>
                                  <select name="pMode" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                                      <option value="COMMON">Common (Adult)</option>
                                      <option value="CHILD">Child / Pediatric</option>
                                      <option value="PREGNANCY">Pregnancy</option>
                                      <option value="ELDERLY">Elderly / Geriatric</option>
                                  </select>
                              </div>

                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Medical Notes (Optional)</label>
                                  <input name="pNotes" placeholder="e.g. Diabetic, Allergies" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                              </div>
                              <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-2">Get Started</button>
                          </form>
                      </div>
                  )}

                  {/* Continue as Guest Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button onClick={continueAsGuest} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium transition-colors">
                          Skip & Continue as Guest
                      </button>
                  </div>
                  
                  <div className="mt-4 text-center text-xs text-slate-400">
                      Private • Secure • Local Storage Only
                  </div>
              </div>
          </div>
      );
  }

  // --- Chat View ---
  return (
    <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans transition-colors">
      
      {/* --- Sidebar Overlay --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Sidebar --- */}
      <aside className={`flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 h-full transition-all duration-300 fixed inset-y-0 left-0 w-72 ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'} md:static md:translate-x-0 md:shadow-none ${isSidebarOpen ? 'md:w-72 md:opacity-100' : 'md:w-0 md:opacity-0 md:overflow-hidden md:border-r-0'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-700 dark:text-slate-200">HealthSense</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><CloseIcon /></button>
        </div>

        {/* Profile Card Sidebar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            {currentProfile ? (
                <div className="w-full flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${currentProfile.avatarColor}`}>
                        {currentProfile.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{currentProfile?.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{currentProfile?.mode}</p>
                    </div>
                </div>
            ) : (
                <button onClick={() => setView('AUTH')} className="w-full flex items-center gap-3 p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-300 transition-all text-left bg-slate-50/50 dark:bg-slate-800/50">
                     <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <UserIcon /> 
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Guest User</p>
                        <p className="text-[10px] text-indigo-500 font-medium">Log in to save history</p>
                     </div>
                </button>
            )}
        </div>

        <div className="p-4"><button onClick={() => createNewSession()} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors shadow-sm"><PlusIcon /> New Chat</button></div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-hide">
            <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Recent Chats</p>
            {sessions.filter(s => s.profileId === (currentProfileId || "")).map(session => (
                <div key={session.id} onClick={() => loadSession(session.id)} className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}>
                    <div className={`mt-1 flex-shrink-0 ${currentSessionId === session.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}><ChatBubbleIcon /></div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{session.title}</h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{session.preview}</p>
                    </div>
                    <button onClick={(e) => deleteSession(e, session.id)} className={`absolute right-2 top-3 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><TrashIcon /></button>
                </div>
            ))}
            {sessions.filter(s => s.profileId === (currentProfileId || "")).length === 0 && (
                <p className="text-center text-slate-400 text-xs mt-4">No history yet.</p>
            )}
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button onClick={() => { setIsDiagnosticsOpen(true); runDiagnostics(); }} className="w-full flex items-center justify-start gap-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg text-sm transition-colors">
                <SystemCheckIcon /> System Status
            </button>
            <button onClick={logout} className="w-full flex items-center justify-start gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-lg text-sm transition-colors">
                <LogoutIcon /> {currentProfile ? 'Switch Profile' : 'Login / Register'}
            </button>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative w-full">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow-sm transition-colors">
            <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-3 p-2 -ml-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg"><MenuIcon /></button>
                <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {currentProfile ? `${currentProfile.name}'s Health` : 'HealthSense (Guest)'}
                        {currentProfile && (
                             <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                                currentProfile?.mode === 'CHILD' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                currentProfile?.mode === 'PREGNANCY' ? 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' :
                                currentProfile?.mode === 'ELDERLY' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' :
                                'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}>
                                {currentProfile?.mode}
                            </span>
                        )}
                        {!currentProfile && (
                             <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                Common
                            </span>
                        )}
                    </h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 rounded-full transition-colors">
                  {darkMode ? <SunIcon /> : <MoonIcon />}
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                {isSpeaking ? (
                    <button onClick={stopAudio} className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full transition-colors animate-pulse" title="Stop Audio">
                        <StopIcon />
                    </button>
                ) : (
                    <button onClick={() => setVoiceMode(!voiceMode)} className={`p-2 rounded-full transition-colors ${voiceMode ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title={voiceMode ? "Voice Mode On" : "Voice Mode Off"}>
                        <SpeakerIcon active={voiceMode} />
                    </button>
                )}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <button onClick={exportReport} className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full transition-colors" title="Export Report"><ReportIcon /></button>
                <button onClick={() => { if(window.confirm("Clear conversation?")) { setMessages([{ id: 'welcome', role: Role.MODEL, text: WELCOME_MSG }]); startNewChat(undefined, currentProfile || undefined); stopAudio(); } }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"><TrashIcon /></button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide bg-slate-50/50 dark:bg-slate-950">
            {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[75%] rounded-2xl p-4 shadow-sm relative ${msg.role === Role.USER ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'} ${msg.isError ? 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : ''}`}>
                {msg.image && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-white/20 shadow-sm">
                    <img src={msg.image} alt="User upload" className="max-w-full h-auto max-h-64 object-cover" />
                    </div>
                )}
                
                {msg.role === Role.MODEL && msg.riskLevel && (
                    <div className={`mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase 
                        ${msg.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : 
                          msg.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' : 
                          'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'}`}>
                        <div className={`w-2 h-2 rounded-full ${msg.riskLevel === 'HIGH' ? 'bg-red-500 animate-pulse' : msg.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        Risk: {msg.riskLevel}
                    </div>
                )}

                {msg.role === Role.USER ? <p className="whitespace-pre-wrap">{msg.text}</p> : <MarkdownRenderer content={msg.text} />}
                
                {/* Maps Grounding Rendering */}
                {msg.groundingMetadata?.groundingChunks?.map((chunk: any, idx: number) => {
                    if (chunk.web?.uri) {
                        return <div key={idx} className="mt-2 text-xs border-t dark:border-slate-700 pt-2"><a href={chunk.web.uri} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">Source: {chunk.web.title || "Web Link"}</a></div>
                    }
                    if (chunk.maps?.uri) {
                        return <div key={idx} className="mt-2 text-xs border-t dark:border-slate-700 pt-2"><a href={chunk.maps.uri} target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><MapIcon /> {chunk.maps.title || "View on Google Maps"}</a></div>
                    }
                    return null;
                })}
                </div>
            </div>
            ))}
            
            {isLoading && (
            <div className="flex justify-start w-full">
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </main>

        {/* Footer Input */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30 px-4 py-1 text-center flex-shrink-0 z-10">
            <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium">{DISCLAIMER_TEXT}</p>
        </div>

        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 md:p-4 z-10 transition-colors">
            {selectedImage && (
                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 mb-2 flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-32 h-48 sm:h-32 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-between flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><ImageIcon /> Image Ready</h3>
                    <div className="flex items-center gap-3 mt-4">
                        <button onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg">Cancel</button>
                        <button onClick={() => handleSendMessage()} disabled={isLoading} className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">Send <SendIcon /></button>
                    </div>
                </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto flex flex-col space-y-2">
            <div className="flex items-end space-x-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex-shrink-0" title="Upload Photo">
                    <ImageIcon />
                </button>
                <button onClick={startCamera} className={`p-3 rounded-full transition flex-shrink-0 ${selectedImage ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`} title="Live Scan">
                    <CameraIcon />
                </button>
                <button onClick={startVoiceChat} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex-shrink-0" title="Voice Chat">
                    <MicrophoneIcon />
                </button>
                <div className="relative flex-1 min-w-0">
                    <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} placeholder={`Describe symptoms${currentProfile ? ' for ' + currentProfile.name : ''}...`} className="w-full bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-0 rounded-2xl py-3 pl-4 pr-10 resize-none max-h-32 min-h-[50px] scrollbar-hide text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500" rows={1} />
                    <button onClick={() => { if(!recognitionRef.current) { alert("Voice not supported"); return; } isListening ? recognitionRef.current.stop() : (setIsListening(true), recognitionRef.current.start()); }} className="absolute right-2 bottom-2.5 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"><MicIcon listening={isListening && !isVoiceChatOpen} /></button>
                </div>
                <button onClick={() => handleSendMessage()} disabled={isLoading || (!inputText.trim() && !selectedImage)} className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white transition shadow-sm flex-shrink-0"><SendIcon /></button>
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                 <button onClick={() => handleSendMessage("Find nearest pharmacy")} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"><MapIcon /> Pharmacy</button>
                 <button onClick={() => handleSendMessage("Find nearest hospital")} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"><MapIcon /> Hospital</button>
            </div>
            </div>
        </footer>
      </div>

      {/* --- Permission Modal --- */}
      {permissionRequest && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-6 backdrop-blur-sm animate-slide-up-fade">
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                 
                 <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${permissionStatus === 'denied' ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                    {permissionStatus === 'denied' ? <WarningIcon /> : <LockIcon />}
                 </div>
                 
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                     {permissionStatus === 'denied' 
                        ? "Permission Blocked" 
                        : (permissionRequest === 'camera' ? "Camera Access Required" : "Microphone Access Required")}
                 </h2>
                 
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                     {permissionStatus === 'denied' ? (
                        <>
                           Your browser has blocked access to the {permissionRequest}.<br/><br/>
                           <span className="font-semibold text-slate-700 dark:text-slate-300">To fix this:</span><br/>
                           1. Click the <span className="font-bold">Lock Icon</span> 🔒 in the address bar.<br/>
                           2. Toggle {permissionRequest === 'camera' ? 'Camera' : 'Microphone'} to <span className="text-emerald-600 font-bold">Allow</span>.<br/>
                           3. Refresh the page.
                        </>
                     ) : (
                         permissionRequest === 'camera' 
                            ? "HealthSense needs access to your camera to scan visible symptoms in real-time. Analysis is done securely." 
                            : "HealthSense needs access to your microphone to enable hands-free voice chat interactions."
                     )}
                 </p>
                 
                 <div className="space-y-3">
                     {permissionStatus !== 'denied' ? (
                         <>
                            <button onClick={confirmPermission} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none">
                                Allow Access
                            </button>
                            <button onClick={closePermissionModal} className="w-full py-3 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition">
                                Not Now
                            </button>
                         </>
                     ) : (
                         <button onClick={closePermissionModal} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                             Close
                         </button>
                     )}
                 </div>
             </div>
        </div>
      )}

      {/* --- Voice Chat Modal (Immersive Orb) --- */}
      {isVoiceChatOpen && (
          <div className="fixed inset-0 bg-black/90 z-[70] flex flex-col items-center justify-center p-6 backdrop-blur-md">
               <button onClick={stopVoiceChat} className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
                   <CloseIcon />
               </button>
               
               <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg text-center relative">
                   <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Core Orb */}
                        <div className={`absolute w-32 h-32 rounded-full blur-2xl transition-all duration-500
                            ${isListening ? 'bg-indigo-500 animate-pulse scale-150' : 
                              isLoading ? 'bg-amber-400 animate-spin-slow scale-110' : 
                              isSpeaking ? 'bg-emerald-500 animate-pulse scale-125' : 
                              'bg-slate-600 scale-100'}`} 
                        />
                        
                        <div className={`relative z-10 w-40 h-40 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-300
                            ${isListening ? 'bg-indigo-600/30 ring-4 ring-indigo-500/50' : 
                              isLoading ? 'bg-amber-500/20 ring-4 ring-amber-500/50' : 
                              isSpeaking ? 'bg-emerald-500/30 ring-4 ring-emerald-500/50' : 
                              'bg-slate-800/50 ring-2 ring-slate-500/30'}`}
                        >
                            <div className="text-white transform transition-transform duration-300">
                                {isListening ? <MicrophoneIcon /> : isLoading ? <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : isSpeaking ? <SpeakerIcon active={true} /> : <MicrophoneIcon />}
                            </div>
                        </div>

                        {/* Outer Ripples */}
                        {isListening && (
                            <>
                                <div className="absolute inset-0 border border-indigo-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                <div className="absolute inset-4 border border-indigo-400/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_200ms]" />
                            </>
                        )}
                   </div>
                   
                   <div className="mt-12 space-y-4 animate-slide-up-fade">
                        <h2 className="text-3xl font-light text-white tracking-wide">
                            {isLoading ? "Thinking..." : isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Paused"}
                        </h2>
                        <p className="text-slate-400 text-lg font-medium h-8">
                            {inputText ? `"${inputText}"` : isListening ? "Go ahead, I'm listening." : "..."}
                        </p>
                   </div>
               </div>
               
               <div className="mb-8">
                    <button 
                        onClick={() => {
                            if (isListening) recognitionRef.current.stop();
                            else { setIsListening(true); recognitionRef.current.start(); }
                        }}
                        className={`px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white text-slate-900'}`}
                    >
                        {isListening ? 'Stop Listening' : 'Tap to Speak'}
                    </button>
               </div>
          </div>
      )}

      {/* --- Camera Modal (Futuristic HUD) --- */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-90" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
                
                {/* Scanning Beam (Only if Searching) */}
                {scanPhase === 'SEARCHING' && (
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-[scan-beam_2s_ease-in-out_infinite]"></div>
                )}

                {/* Central Reticle */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out
                    ${scanPhase === 'DETECTED' ? 'w-56 h-56' : 'w-72 h-72'}`}
                >
                    {/* Corners */}
                    <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-500 ${scanPhase === 'DETECTED' ? 'border-emerald-400' : scanPhase === 'LOCKING' ? 'border-amber-400' : 'border-cyan-400'}`} />
                    <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-500 ${scanPhase === 'DETECTED' ? 'border-emerald-400' : scanPhase === 'LOCKING' ? 'border-amber-400' : 'border-cyan-400'}`} />
                    <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-500 ${scanPhase === 'DETECTED' ? 'border-emerald-400' : scanPhase === 'LOCKING' ? 'border-amber-400' : 'border-cyan-400'}`} />
                    <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-xl transition-colors duration-500 ${scanPhase === 'DETECTED' ? 'border-emerald-400' : scanPhase === 'LOCKING' ? 'border-amber-400' : 'border-cyan-400'}`} />
                    
                    {/* Center Crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                         <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${scanPhase === 'DETECTED' ? 'bg-emerald-400' : 'bg-cyan-400/50'}`} />
                    </div>
                </div>

                {/* Analysis Nodes (Random Dots) */}
                {analysisNodes.map(node => (
                    <div key={node.id} 
                        className="absolute w-3 h-3 border border-emerald-400/80 rounded-full flex items-center justify-center animate-ping-slow"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                        <div className="w-0.5 h-0.5 bg-emerald-400 rounded-full" />
                    </div>
                ))}

                {/* Waveform Visualization (Simulated) */}
                <div className="absolute bottom-32 left-0 right-0 h-16 flex items-center justify-center gap-1 opacity-60">
                     {[...Array(20)].map((_, i) => (
                         <div key={i} className={`w-1 bg-gradient-to-t from-cyan-500 to-transparent rounded-full animate-pulse`} 
                              style={{ 
                                  height: `${20 + Math.random() * 60}%`, 
                                  animationDelay: `${i * 0.05}s`,
                                  animationDuration: '0.8s'
                              }} 
                         />
                     ))}
                </div>

                {/* Data Readouts */}
                <div className="absolute top-12 right-6 space-y-2 text-right">
                    <div className={`font-mono text-xs tracking-widest uppercase transition-colors ${scanPhase === 'DETECTED' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {scanPhase === 'DETECTED' ? 'ANALYSIS COMPLETE' : scanPhase === 'LOCKING' ? 'LOCKING TARGET...' : 'SCANNING SURFACE...'}
                    </div>
                    <div className="text-white/60 font-mono text-[10px]">ISO: 800 • EXP: +0.5</div>
                    <div className="text-white/60 font-mono text-[10px]">
                        CONFIDENCE: {scanPhase === 'DETECTED' ? '98.2%' : scanPhase === 'LOCKING' ? '76.4%' : 'CALCULATING...'}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 flex items-center gap-12 pointer-events-auto z-10">
                <button onClick={stopCamera} className="p-4 rounded-full bg-black/60 text-white hover:bg-white/20 backdrop-blur-md border border-white/10 transition"><CloseIcon /></button>
                <button onClick={capturePhoto} className={`w-24 h-24 rounded-full border-4 flex items-center justify-center hover:bg-white/10 backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] ${scanPhase === 'DETECTED' ? 'border-emerald-500 shadow-emerald-900/50' : 'border-white/80'}`}>
                    <div className={`w-18 h-18 rounded-full shadow-inner transition-colors duration-500 ${scanPhase === 'DETECTED' ? 'bg-emerald-500' : 'bg-white'}`} style={{width: 60, height: 60}} />
                </button>
                <button onClick={() => { stopCamera(); fileInputRef.current?.click(); }} className="p-4 rounded-full bg-black/60 text-white hover:bg-white/20 backdrop-blur-md border border-white/10 transition"><ImageIcon /></button>
            </div>
        </div>
      )}

      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onloadend=()=>{setSelectedImage(r.result as string);}; r.readAsDataURL(f); } stopCamera(); }} />

      {/* --- Diagnostics Modal --- */}
      {isDiagnosticsOpen && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
                <button onClick={() => setIsDiagnosticsOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><CloseIcon /></button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><SystemCheckIcon /> System Check</h2>
                
                <div className="space-y-4">
                    {/* Browser Check */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Browser Features</span>
                        {diagnosticResults.browser === 'PENDING' && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                        {diagnosticResults.browser === 'SUCCESS' && <div className="text-emerald-500 font-bold text-xs">OK</div>}
                        {diagnosticResults.browser === 'FAILURE' && <div className="text-red-500 font-bold text-xs">FAIL</div>}
                    </div>
                    {/* Storage Check */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Local Storage</span>
                        {diagnosticResults.storage === 'PENDING' && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                        {diagnosticResults.storage === 'SUCCESS' && <div className="text-emerald-500 font-bold text-xs">OK</div>}
                        {diagnosticResults.storage === 'FAILURE' && <div className="text-red-500 font-bold text-xs">FAIL</div>}
                    </div>
                    {/* Media Check */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Camera / Mic</span>
                        {diagnosticResults.media === 'PENDING' && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                        {diagnosticResults.media === 'SUCCESS' && <div className="text-emerald-500 font-bold text-xs">OK</div>}
                        {diagnosticResults.media === 'FAILURE' && <div className="text-red-500 font-bold text-xs">FAIL</div>}
                    </div>
                    {/* API Check */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gemini Cloud API</span>
                        {diagnosticResults.api === 'PENDING' && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                        {diagnosticResults.api === 'SUCCESS' && <div className="text-emerald-500 font-bold text-xs">ONLINE</div>}
                        {diagnosticResults.api === 'FAILURE' && <div className="text-red-500 font-bold text-xs">OFFLINE</div>}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                     <button onClick={runDiagnostics} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition">Rerun Tests</button>
                </div>
            </div>
        </div>
      )}
      
      <style>{`
        @keyframes scan-beam {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ping-slow {
           0% { transform: scale(1); opacity: 1; }
           100% { transform: scale(3); opacity: 0; }
        }
        .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
