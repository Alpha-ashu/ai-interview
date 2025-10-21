
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { Page, Session, Question, Report } from './types';
import { LogoIcon, PlayIcon, ArrowRightIcon, MicIcon, TargetIcon, SearchIcon, ChartIcon, DashboardIcon, BookIcon, BuildingIcon, ReportIcon, SettingsIcon, ChevronDownIcon } from './components/Icons';

// Add this for TypeScript to recognize the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Helper functions for audio decoding
const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
};


// Page Components defined outside the main App component to prevent re-rendering issues.

interface HomePageProps {
  navigateToDashboard: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigateToDashboard }) => {
  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-50">
      <div className="gradient-bg">
        {/* Header */}
        <header className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LogoIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-50">First Round AI</h1>
          </div>
          <nav className="space-x-6">
            <a href="#" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Testimonials</a>
            <button onClick={navigateToDashboard} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md transition-colors">
              Sign In
            </button>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 text-center pt-24 pb-16">
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-50">
            Your AI Interview Coach
          </h2>
          <p className="text-5xl md:text-6xl font-extrabold leading-tight text-cyan-400 text-glow mb-6">
            Practice. Analyze. Improve.
          </p>
          <p className="max-w-3xl mx-auto text-lg text-slate-300 mb-10">
            Realistic mock interviews powered by advanced AI — prepare like a pro before the real one.
          </p>
          <div className="flex justify-center items-center space-x-4">
            <button onClick={navigateToDashboard} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 glow">
              Start Free Mock Interview
            </button>
            <button className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
              <PlayIcon className="w-6 h-6 text-cyan-400" />
              <span>Watch Demo</span>
            </button>
          </div>
        </main>
      </div>

      {/* Feature Highlights */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl">
            <TargetIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">AI-Generated Questions</h3>
            <p className="text-slate-400">Get tailored questions for your target role and level.</p>
          </div>
          <div className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl">
            <SearchIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Real-Time Feedback</h3>
            <p className="text-slate-400">Receive instant analysis on clarity, relevance, and STAR framework usage.</p>
          </div>
          <div className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl">
            <ChartIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Detailed Reports</h3>
            <p className="text-slate-400">Track your progress and identify areas for improvement over time.</p>
          </div>
        </div>
      </section>

      {/* Call-to-Action Footer */}
      <section className="py-24 text-center">
        <h3 className="text-4xl font-bold mb-4">Ready to impress your next interviewer?</h3>
        <button onClick={navigateToDashboard} className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 glow">
          Start Your Free Session
        </button>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-6 border-t border-slate-800 flex justify-between items-center text-slate-400">
        <div className="flex items-center space-x-2">
          <LogoIcon className="w-5 h-5" />
          <span>© 2024 First Round AI</span>
        </div>
        <div className="space-x-4">
          <a href="#" className="hover:text-cyan-400">About</a>
          <a href="#" className="hover:text-cyan-400">Privacy</a>
          <a href="#" className="hover:text-cyan-400">Terms</a>
        </div>
      </footer>
    </div>
  );
};

interface RoleSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (role: string) => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose, onStart }) => {
    const [selectedRole, setSelectedRole] = useState('');
    const jobRoles = ["Frontend Developer", "Backend Developer", "Product Manager", "QA Engineer", "Data Scientist"];

    if (!isOpen) return null;

    const handleStart = () => {
        if (selectedRole) {
            onStart(selectedRole);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md m-4 transform transition-all">
                <h2 className="text-2xl font-bold mb-2">Start New Mock Interview</h2>
                <p className="text-slate-400 mb-6">Select a role to begin your practice session.</p>

                <div className="mb-6">
                    <label htmlFor="role-select" className="block text-sm font-medium text-slate-300 mb-2">Job Role</label>
                    <select
                        id="role-select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                        <option value="" disabled>Choose a role...</option>
                        {jobRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={!selectedRole}
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-all disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed glow"
                    >
                        Start Interview
                    </button>
                </div>
            </div>
        </div>
    );
};

// Resume ATS Checker Component
interface AtsResult {
    score: number;
    summary: string;
    suggestions: string[];
}

const ResumeAtsChecker: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [result, setResult] = useState<AtsResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setError(null);
        const file = event.dataTransfer.files[0];
        if (file) {
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    setResumeText(text);
                };
                reader.readAsText(file);
            } else {
                setError("Unsupported file type. Please drop a .txt file or paste content directly.");
            }
        }
    };

    const handleAnalyze = async () => {
        if (!jobDescription.trim() || !resumeText.trim()) {
            setError("Please provide both a job description and your resume.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Analyze the following resume against the provided job description. Act as an expert ATS and hiring manager. Provide a detailed analysis including a compatibility score, a summary of strengths and weaknesses, and specific suggestions for improvement. The resume should be tailored to match the keywords and requirements in the job description.

Job Description:
---
${jobDescription}
---

Resume:
---
${resumeText}
---

Provide the output in a JSON format.
`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER, description: "Compatibility score out of 100" },
                            summary: { type: Type.STRING, description: "A brief summary of the resume's fit for the role." },
                            suggestions: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "Actionable suggestions to improve the resume."
                            }
                        },
                        required: ["score", "summary", "suggestions"],
                    },
                },
            });

            const jsonResponse = JSON.parse(response.text);
            setResult(jsonResponse);
        } catch (e) {
            console.error(e);
            setError("Failed to analyze the resume. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl mt-8">
            <h3 className="text-xl font-bold mb-4">Resume ATS Checker</h3>
            <p className="text-slate-400 mb-6">Paste your resume and a job description to see how well you match. The AI will give you a score and suggestions for improvement.</p>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Job Description</label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        className="w-full h-48 bg-slate-700/50 border border-slate-600 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Resume</label>
                     <div onDrop={handleFileDrop} onDragOver={(e) => e.preventDefault()} className="relative w-full h-48 bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-md flex items-center justify-center text-center p-3">
                         <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Drag & drop a .txt file or paste your resume text here..."
                            className="absolute inset-0 w-full h-full bg-transparent p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none z-10"
                            disabled={isLoading}
                        />
                        {!resumeText && (
                            <div className="text-slate-500 pointer-events-none">
                                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <p className="mt-2 text-sm">Upload a .txt file</p>
                                <p className="text-xs text-slate-600">(Or paste content directly)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-end items-center">
                {error && <p className="text-red-400 mr-4 text-sm">{error}</p>}
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-2 px-6 rounded-lg transition-all disabled:bg-slate-600 disabled:cursor-wait glow flex items-center"
                >
                    {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                </button>
            </div>

            {result && !isLoading && (
                <div className="mt-8 border-t border-slate-700 pt-6 animate-fade-in">
                    <h4 className="text-lg font-bold mb-4">Analysis Result</h4>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-800 p-6 rounded-lg">
                            <p className="text-slate-400 mb-2">Compatibility Score</p>
                            <div className={`text-6xl font-bold ${result.score > 75 ? 'text-green-400' : result.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{result.score}</div>
                            <p className="text-slate-400">/ 100</p>
                        </div>
                        <div className="md:col-span-2 bg-slate-800 p-6 rounded-lg">
                            <h5 className="font-bold text-cyan-400 mb-2">Summary</h5>
                            <p className="text-slate-300 text-sm mb-4">{result.summary}</p>
                            <h5 className="font-bold text-cyan-400 mb-2">Suggestions for Improvement</h5>
                            <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </section>
    );
};

interface DashboardPageProps {
  onStartInterview: (role: string) => void;
  navigateToHome: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onStartInterview, navigateToHome }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const recentSessions: Session[] = [
        { id: '1', role: 'QA Engineer', date: '2024-07-20', aiEngine: 'Gemini', score: 8.7, status: 'Completed' },
        { id: '2', role: 'Product Manager', date: '2024-07-18', aiEngine: 'Gemini', score: 9.1, status: 'Completed' },
        { id: '3', role: 'Frontend Developer', date: '2024-07-15', aiEngine: 'Gemini', score: 7.9, status: 'Completed' },
    ];

    const getRoleColor = (role: string) => {
        const colors = ['bg-blue-500/20 text-blue-300', 'bg-purple-500/20 text-purple-300', 'bg-green-500/20 text-green-300', 'bg-yellow-500/20 text-yellow-300'];
        let hash = 0;
        for (let i = 0; i < role.length; i++) {
            hash = role.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const handleStartClick = () => {
        setIsModalOpen(true);
    };

    const handleStartFromModal = (role: string) => {
        setIsModalOpen(false);
        onStartInterview(role);
    };

    return (
        <div className="flex h-screen bg-slate-900 text-slate-50">
            <RoleSelectionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onStart={handleStartFromModal}
            />

            {/* Sidebar */}
            <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center space-x-2 mb-10 px-2 cursor-pointer" onClick={navigateToHome}>
                        <LogoIcon className="w-8 h-8 text-cyan-400"/>
                        <h1 className="text-xl font-bold text-slate-50 hidden lg:block">First Round AI</h1>
                    </div>
                    <nav className="space-y-2">
                        <a href="#" className="flex items-center space-x-3 px-2 py-3 rounded-md bg-slate-800 text-cyan-400">
                            <DashboardIcon className="w-6 h-6" />
                            <span className="font-semibold hidden lg:block">Dashboard</span>
                        </a>
                         <a href="#" className="flex items-center space-x-3 px-2 py-3 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-50 transition-colors">
                            <MicIcon className="w-6 h-6" />
                            <span className="font-semibold hidden lg:block">Mock Interview</span>
                        </a>
                         <a href="#" className="flex items-center space-x-3 px-2 py-3 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-50 transition-colors">
                            <BookIcon className="w-6 h-6" />
                            <span className="font-semibold hidden lg:block">Study Plan</span>
                        </a>
                         <a href="#" className="flex items-center space-x-3 px-2 py-3 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-50 transition-colors">
                            <BuildingIcon className="w-6 h-6" />
                            <span className="font-semibold hidden lg:block">Company Brief</span>
                        </a>
                         <a href="#" className="flex items-center space-x-3 px-2 py-3 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-50 transition-colors">
                            <ReportIcon className="w-6 h-6" />
                            <span className="font-semibold hidden lg:block">Reports</span>
                        </a>
                    </nav>
                </div>
                 <div>
                    <a href="#" className="flex items-center space-x-3 px-2 py-3 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-50 transition-colors">
                        <SettingsIcon className="w-6 h-6" />
                        <span className="font-semibold hidden lg:block">Settings</span>
                    </a>
                </div>
            </aside>

            {/* Main Panel */}
            <main className="flex-1 p-8 overflow-y-auto relative">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold">Welcome back, Alex!</h2>
                        <p className="text-slate-400">Let's continue your journey to interview mastery.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <img src="https://picsum.photos/40/40" alt="User Avatar" className="w-10 h-10 rounded-full"/>
                        <ChevronDownIcon className="w-5 h-5 text-slate-400"/>
                    </div>
                </header>

                {/* Metrics Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl transition-transform hover:scale-105">
                        <h4 className="text-slate-400 mb-1">Avg. Clarity Score</h4>
                        <p className="text-3xl font-bold text-cyan-400">8.2</p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl transition-transform hover:scale-105">
                        <h4 className="text-slate-400 mb-1">Avg. Relevance Score</h4>
                        <p className="text-3xl font-bold text-blue-400">8.6</p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl transition-transform hover:scale-105">
                        <h4 className="text-slate-400 mb-1">Completed Interviews</h4>
                        <p className="text-3xl font-bold">12</p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl transition-transform hover:scale-105">
                        <h4 className="text-slate-400 mb-1">Hours Practiced</h4>
                        <p className="text-3xl font-bold">6.4h</p>
                    </div>
                </section>

                {/* Quick Actions */}
                 <section className="flex space-x-4 mb-8">
                    <button onClick={handleStartClick} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 glow">Start New Mock Interview</button>
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-lg transition-colors">View My Reports</button>
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-lg transition-colors">Generate Study Plan</button>
                </section>

                {/* Recent Sessions */}
                <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-4">Recent Sessions</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">AI Engine</th>
                                    <th className="p-3">Score</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSessions.map(session => (
                                    <tr key={session.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                        <td className="p-3 font-semibold"><span className={`px-2 py-1 rounded-full text-sm ${getRoleColor(session.role)}`}>{session.role}</span></td>
                                        <td className="p-3 text-slate-400">{session.date}</td>
                                        <td className="p-3 text-slate-400">{session.aiEngine}</td>
                                        <td className="p-3 font-semibold text-cyan-400">{session.score}</td>
                                        <td className="p-3"><span className="text-green-400">{session.status}</span></td>
                                        <td className="p-3 text-right">
                                            <button className="text-cyan-400 hover:text-cyan-300 font-semibold">View Report</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                
                <ResumeAtsChecker />

                <button onClick={handleStartClick} className="fixed bottom-8 right-8 bg-cyan-500 rounded-full p-4 shadow-lg hover:bg-cyan-600 transition-all duration-300 transform hover:scale-110 glow">
                    <MicIcon className="w-8 h-8 text-slate-900"/>
                </button>
            </main>
        </div>
    );
};

interface PreCheckPageProps {
  navigateToDashboard: () => void;
  onChecksPassed: () => void;
  role: string;
  userStream: MediaStream | null;
}

const PreCheckPage: React.FC<PreCheckPageProps> = ({ navigateToDashboard, onChecksPassed, role, userStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'setup' | 'checking' | 'success' | 'error'>('setup');
    const [errorMsg, setErrorMsg] = useState('');
    const [multiTabDetected, setMultiTabDetected] = useState(false);

    useEffect(() => {
        const channel = new BroadcastChannel('first_round_ai_proctor_check');

        const handleIncomingMessage = () => {
            setMultiTabDetected(true);
            channel.postMessage('presence_acknowledged');
        };

        channel.onmessage = handleIncomingMessage;

        const checkTabs = () => {
            setMultiTabDetected(false);
            channel.postMessage('ping');
        };

        checkTabs();
        window.addEventListener('focus', checkTabs);

        return () => {
            window.removeEventListener('focus', checkTabs);
            channel.close();
        };
    }, []);

    useEffect(() => {
        if (userStream && videoRef.current) {
            videoRef.current.srcObject = userStream;
        } else {
            setErrorMsg("Camera access denied. Please go back to the dashboard and try again.");
            setStatus('error');
        }
    }, [userStream]);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]);
                } else {
                    reject(new Error('Failed to convert blob to base64.'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleCheckEnvironment = async () => {
        if (!videoRef.current || !canvasRef.current || !userStream || multiTabDetected) return;
        setStatus('checking');
        setErrorMsg('');

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setErrorMsg('Could not capture frame from camera.');
                setStatus('error');
                return;
            }
            try {
                const base64Data = await blobToBase64(blob);
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: {
                        parts: [
                            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                            { text: "Analyze the image and count the number of people visible. Respond with a single integer number only. For example: 1" }
                        ]
                    }
                });

                const personCount = parseInt(response.text.trim(), 10);
                if (isNaN(personCount)) {
                     setErrorMsg('AI could not determine the number of people. Please try again.');
                     setStatus('error');
                } else if (personCount === 1) {
                    setStatus('success');
                } else if (personCount > 1) {
                    setErrorMsg('Multiple people detected. Please ensure you are alone for the interview.');
                    setStatus('error');
                } else {
                    setErrorMsg('No person detected. Please make sure you are clearly visible in the camera frame.');
                    setStatus('error');
                }
            } catch (err) {
                console.error('AI check failed:', err);
                setErrorMsg('An error occurred during the AI check. Please try again.');
                setStatus('error');
            }
        }, 'image/jpeg');
    };
    
    const handleStartInterview = () => {
        if (userStream && !multiTabDetected) {
            onChecksPassed();
        }
    };

    const canStart = status === 'success' && !multiTabDetected;

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-50 p-6 items-center justify-center">
            <div className="w-full max-w-3xl text-center">
                <h1 className="text-3xl font-bold mb-2">Interview Pre-Check</h1>
                <p className="text-slate-400 mb-6">Let's make sure your camera and environment are ready for the interview for <span className="text-cyan-400 font-semibold">{role}</span>.</p>

                <div className="relative aspect-video w-full max-w-2xl mx-auto bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 mb-6">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                
                <div className="mb-6 h-12 flex items-center justify-center">
                    {multiTabDetected ? (
                        <p className="text-lg text-red-400">❌ Multiple application tabs detected. Please close other tabs to continue.</p>
                    ) : (
                        <>
                            {status === 'setup' && <p className="text-lg text-slate-300">Click "Check Environment" to begin.</p>}
                            {status === 'checking' && <p className="text-lg text-yellow-400 animate-pulse">Checking environment using AI...</p>}
                            {status === 'success' && <p className="text-lg text-green-400">✅ All checks passed! You can now start the interview.</p>}
                            {status === 'error' && <p className="text-lg text-red-400">❌ {errorMsg}</p>}
                        </>
                    )}
                </div>

                <div className="flex justify-center space-x-4">
                    <button onClick={navigateToDashboard} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-lg transition-colors">
                        Back to Dashboard
                    </button>
                    {status !== 'success' && (
                        <button onClick={handleCheckEnvironment} disabled={status === 'checking' || multiTabDetected} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all glow disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {status === 'checking' ? 'Checking...' : 'Check Environment'}
                        </button>
                    )}
                    {status === 'success' && (
                         <button onClick={handleStartInterview} disabled={!canStart} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all glow disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                           Start Interview
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ReportPageProps {
    report: Report | null;
    navigateToDashboard: () => void;
    role: string;
}

const ReportPage: React.FC<ReportPageProps> = ({ report, navigateToDashboard, role }) => {
    if (!report) {
        return (
            <div className="flex flex-col h-screen bg-slate-900 text-slate-50 p-6 items-center justify-center">
                <h1 className="text-3xl font-bold mb-4">Generating Report...</h1>
                <p className="text-slate-400">Please wait a moment.</p>
            </div>
        );
    }

    const { summary, metrics, items } = report;

    const ScoreCircle: React.FC<{ score: number, label: string, color: string }> = ({ score, label, color }) => (
        <div className="flex flex-col items-center justify-center bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 mb-2">{label}</p>
            <div className={`text-6xl font-bold ${color}`}>{score.toFixed(1)}</div>
            <p className="text-slate-400">/ 10</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <div className="container mx-auto px-6 py-12">
                <header className="mb-12">
                    <p className="text-cyan-400 font-semibold">Interview Report</p>
                    <h1 className="text-4xl font-extrabold mt-1">Mock Interview Analysis for {role}</h1>
                </header>

                <section className="mb-12 p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-4 text-cyan-400">Overall Summary</h2>
                    <p className="text-slate-300 leading-relaxed">{summary}</p>
                </section>

                <section className="grid md:grid-cols-3 gap-8 mb-12">
                    <ScoreCircle score={metrics.avgClarity} label="Avg. Clarity" color="text-green-400" />
                    <ScoreCircle score={metrics.avgRelevance} label="Avg. Relevance" color="text-blue-400" />
                     <div className="flex flex-col items-center justify-center bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <p className="text-slate-400 mb-2">Session Duration</p>
                        <div className="text-5xl font-bold">{(metrics.durationSec / 60).toFixed(1)}</div>
                        <p className="text-slate-400">minutes</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-3xl font-bold mb-6">Detailed Feedback</h2>
                    <div className="space-y-8">
                        {items.map((item, index) => (
                            <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                                <h3 className="text-xl font-bold mb-3">Q{index + 1}: <span className="text-slate-300 font-normal">"{item.question}"</span></h3>
                                
                                {item.feedback.starMethodAnalysis && (
                                    <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                                        <h4 className="font-bold text-cyan-400 mb-2">STAR Method Analysis</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                            <p><strong className="text-slate-400">Situation:</strong> {item.feedback.starMethodAnalysis.situation}</p>
                                            <p><strong className="text-slate-400">Task:</strong> {item.feedback.starMethodAnalysis.task}</p>
                                            <p><strong className="text-slate-400">Action:</strong> {item.feedback.starMethodAnalysis.action}</p>
                                            <p><strong className="text-slate-400">Result:</strong> {item.feedback.starMethodAnalysis.result}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-800 p-3 rounded-lg">
                                        <div className="flex justify-between items-baseline">
                                            <h5 className="font-semibold text-slate-300">Clarity</h5>
                                            <span className="font-bold text-lg text-green-400">{item.feedback.clarity.score}/10</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">{item.feedback.clarity.feedback}</p>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded-lg">
                                        <div className="flex justify-between items-baseline">
                                            <h5 className="font-semibold text-slate-300">Relevance</h5>
                                            <span className="font-bold text-lg text-blue-400">{item.feedback.relevance.score}/10</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">{item.feedback.relevance.feedback}</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <h4 className="font-bold text-yellow-300 mb-1">Suggestion for Improvement</h4>
                                    <p className="text-yellow-200 text-sm">{item.feedback.overallSuggestion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                <footer className="text-center mt-16">
                    <button onClick={navigateToDashboard} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 glow">
                        Back to Dashboard
                    </button>
                </footer>
            </div>
        </div>
    );
};


interface InterviewPageProps {
  onFinish: () => void;
  role: string;
  userStream: MediaStream | null;
  questions: Question[];
  sessionId: string;
}

const AudioVisualizer = () => {
    return (
        <div className="flex justify-center items-center space-x-2 h-24">
            {Array.from({ length: 40 }).map((_, i) => (
                <div
                    key={i}
                    className="w-1.5 bg-cyan-500/50 rounded-full"
                    style={{
                        height: `${Math.sin(i * 0.4) * 30 + 40}%`,
                        animation: `wave 1.2s ease-in-out ${i * 0.05}s infinite alternate`,
                    }}
                ></div>
            ))}
            <style>{`
                @keyframes wave {
                    from { transform: scaleY(0.5); opacity: 0.5; }
                    to { transform: scaleY(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const StrikeIndicator: React.FC<{ strikes: number }> = ({ strikes }) => {
    const icons = ['⚪️', '🔴', '🟠', '🔴'];
    const strikeDisplay = Array.from({ length: 3 }).map((_, i) => {
        if (i < strikes) {
            return <span key={i}>{icons[i + 1]}</span>;
        }
        return <span key={i} className="opacity-30">{icons[0]}</span>;
    });

    return (
        <div className="flex items-center space-x-2 text-sm font-semibold">
            <div className="flex space-x-1">{strikeDisplay}</div>
            <span className={strikes > 0 ? 'text-yellow-300' : 'text-slate-400'}>
                {strikes}/3 Warnings
            </span>
        </div>
    );
};

const ProctorModeBadge = () => (
    <div className="fixed bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm text-cyan-400 text-xs font-bold py-1 px-3 rounded-full border border-slate-700">
        Proctor Mode Active
    </div>
);

const SessionEndedOverlay: React.FC<{ onAcknowledge: () => void }> = ({ onAcknowledge }) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col justify-center items-center z-50">
        <div className="text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-4">Session Terminated</h2>
            <p className="text-slate-300 mb-8">You have exceeded the maximum number of warnings.</p>
            <button onClick={onAcknowledge} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 glow">
                View Report
            </button>
        </div>
    </div>
);

const ReadyModal: React.FC<{ onReady: () => void }> = ({ onReady }) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col justify-center items-center z-40">
        <div className="text-center p-8">
            <h2 className="text-4xl font-extrabold text-slate-100 mb-4">Ready for your interview?</h2>
            <p className="text-slate-300 max-w-md mx-auto mb-8">The session will be recorded for analysis and feedback. The recording will start once you click "I'm Ready".</p>
            <button onClick={onReady} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 glow">
                I'm Ready
            </button>
        </div>
    </div>
);


const InterviewPage: React.FC<InterviewPageProps> = ({ onFinish, role, userStream, questions, sessionId }) => {
    const [warning, setWarning] = useState<string | null>(null);
    const [strikes, setStrikes] = useState(0);
    const [isSessionEnded, setIsSessionEnded] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [answers, setAnswers] = useState<string[]>([]);
    
    const [isLoadingTTS, setIsLoadingTTS] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isReadyModalOpen, setIsReadyModalOpen] = useState(true);

    // New state for speech recognition
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [isCapturingAnswer, setIsCapturingAnswer] = useState(false);
    const [statusText, setStatusText] = useState("Getting ready...");
    const answerTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const finalTranscriptRef = useRef('');


    const fullscreenRef = React.useRef(!!document.fullscreenElement);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const currentQuestion = questions[currentQuestionIndex];

    const handleEndSession = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        onFinish();
    }, [onFinish]);

    const speakQuestion = useCallback(async (questionText: string) => {
        setIsLoadingTTS(true);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const audioResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: questionText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });

            const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                if (!audioContextRef.current) {
                    console.error("AudioContext not initialized. Cannot play audio.");
                    setIsSpeaking(false);
                    return;
                }
                const ctx = audioContextRef.current;
                
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }

                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                
                audioSourceRef.current?.stop();
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                audioSourceRef.current = source;
                setIsSpeaking(true);
                source.start();
                source.onended = () => {
                    setIsSpeaking(false);
                    setIsCapturingAnswer(false);
                    finalTranscriptRef.current = '';
                };
            } else {
                setIsSpeaking(false);
            }
        } catch (error) {
            console.error("Failed to get TTS audio:", error);
            setIsSpeaking(false);
        } finally {
            setIsLoadingTTS(false);
        }
    }, []);

    // Proctoring logic
    useEffect(() => {
        if (isSessionEnded || isReadyModalOpen) return;

        const handleWarning = (message: string) => {
            setStrikes(prevStrikes => {
                if (prevStrikes >= 2) { // 3rd strike ends session
                    setIsSessionEnded(true);
                    return prevStrikes + 1;
                }
                const newStrikes = prevStrikes + 1;
                setWarning(`${message} — Warning ${newStrikes}/3.`);
                setTimeout(() => setWarning(null), 4000);
                return newStrikes;
            });
        };

        const handleVisibilityChange = () => {
            if (document.hidden) handleWarning("Tab switch detected");
        };

        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;
            if (fullscreenRef.current && !isFullscreen) handleWarning("Fullscreen exit detected");
            fullscreenRef.current = isFullscreen;
        };
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [isSessionEnded, isReadyModalOpen]);

    // Question TTS Trigger
    useEffect(() => {
        if (isSessionEnded || !currentQuestion || isReadyModalOpen) return;
        speakQuestion(currentQuestion.question);
    }, [isSessionEnded, currentQuestion, isReadyModalOpen, speakQuestion]);


    useEffect(() => {
        if (strikes >= 3) {
            setIsSessionEnded(true);
        }
    }, [strikes]);
    
    const handleNextQuestion = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsCapturingAnswer(false);

        setAnswers(prev => [...prev, currentAnswer]);
        setCurrentAnswer('');
        finalTranscriptRef.current = '';

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleEndSession();
        }
    }, [currentAnswer, currentQuestionIndex, questions.length, handleEndSession]);
    
    // Speech Recognition Effect
    useEffect(() => {
        if (isSessionEnded || isReadyModalOpen || isSpeaking || isLoadingTTS) {
             if (recognitionRef.current) {
                recognitionRef.current.stop();
             }
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatusText("Browser doesn't support speech recognition.");
            return;
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
        }
        
        const recognition = recognitionRef.current;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            if (!isSessionEnded && !isReadyModalOpen && !isSpeaking && !isLoadingTTS) {
                 setTimeout(() => {
                    try {
                        recognitionRef.current?.start();
                    } catch(e) {
                        // Silently catch error if recognition is already starting
                    }
                 }, 100);
            }
        };
        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return; // Ignore common, non-critical errors
            }
            console.error("Speech recognition error:", event.error);
        };
        
        recognition.onresult = (event: any) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            finalTranscriptRef.current = fullTranscript;

            const transcriptLower = fullTranscript.toLowerCase();
            
            if (!isCapturingAnswer && transcriptLower.includes('my answer')) {
                setIsCapturingAnswer(true);
            } else if (isCapturingAnswer) {
                const answerStartIndex = transcriptLower.lastIndexOf('my answer') + 'my answer'.length;
                let answer = fullTranscript.substring(answerStartIndex).trim();

                if (answer.toLowerCase().includes('this is my answer')) {
                    const endPhraseIndex = answer.toLowerCase().lastIndexOf('this is my answer');
                    answer = answer.substring(0, endPhraseIndex).trim();
                    setCurrentAnswer(answer);
                    // use timeout to ensure state update before moving on
                    setTimeout(() => handleNextQuestion(), 200);
                } else {
                    setCurrentAnswer(answer);
                }
            }
        };

        if (!isListening) {
             try {
                recognition.start();
            } catch(e) {
                console.log("Could not start recognition", e);
            }
        }
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onstart = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
            }
        };

    }, [isSpeaking, isLoadingTTS, isReadyModalOpen, isSessionEnded, isCapturingAnswer, handleNextQuestion]);

     useEffect(() => {
        if (isListening) {
            if (isCapturingAnswer) {
                setStatusText("Listening... Say 'This is my answer' to finish.");
            } else {
                setStatusText("Say 'My answer' to begin responding.");
            }
        } else if (isSpeaking) {
            setStatusText("AI is speaking...");
        } else {
            setStatusText("Initializing...");
        }
    }, [isListening, isCapturingAnswer, isSpeaking]);

    useEffect(() => {
        if (answerTextAreaRef.current) {
            answerTextAreaRef.current.style.height = 'auto';
            const scrollHeight = answerTextAreaRef.current.scrollHeight;
            answerTextAreaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [currentAnswer]);

    const handleReady = () => {
        if (!userStream) {
            alert("Camera/Mic stream not available.");
            handleEndSession();
            return;
        }

        // Initialize AudioContext on user gesture to comply with autoplay policies
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        setIsReadyModalOpen(false);
        
        try {
            mediaRecorderRef.current = new MediaRecorder(userStream, { mimeType: 'video/webm' });
            recordedChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                console.log("Video recorded and ready for upload:", videoBlob);
                const url = URL.createObjectURL(videoBlob);
                console.log("Download URL:", url);
            };
            mediaRecorderRef.current.start();
        } catch (e) {
            console.error("Error starting MediaRecorder:", e);
            alert(`Could not start video recording. Error: ${e.message}`);
        }
    };
    
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="flex flex-col h-screen bg-black text-slate-50 p-6 relative">
             {isReadyModalOpen && <ReadyModal onReady={handleReady} />}
             {isSessionEnded && <SessionEndedOverlay onAcknowledge={handleEndSession} />}

             <header className="flex justify-between items-center w-full mb-8">
                <button onClick={handleEndSession} className="text-slate-400 hover:text-slate-50 transition-colors" disabled={isSessionEnded}>
                    &larr; End Session
                </button>
                <div className="text-center">
                    <div className="text-slate-400 text-sm">Interview for:</div>
                    <div className="font-semibold text-lg text-cyan-400">{role}</div>
                </div>
                <div className="text-slate-400">AI Engine: <span className="font-semibold text-cyan-400">Gemini</span></div>
            </header>

            <div className="w-full absolute top-20 left-0 px-6 flex justify-center">
                 <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-1.5">
                    <StrikeIndicator strikes={strikes} />
                </div>
            </div>

            <main className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-full max-w-4xl p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl min-h-[9rem] flex items-center justify-center">
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                        {isLoadingTTS ? '...' : `"${currentQuestion?.question}"`}
                    </h1>
                </div>

                <div className="my-8 w-full">
                   {isSpeaking ? <AudioVisualizer /> : (
                       <div className="w-full max-w-4xl mx-auto text-center">
                          <p className="text-slate-400 mb-2 h-6">{statusText}</p>
                           <textarea
                                ref={answerTextAreaRef}
                                value={currentAnswer}
                                readOnly
                                placeholder="Your answer will appear here..."
                                className="w-full min-h-[6rem] bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                            />
                       </div>
                   )}
                </div>
            </main>

            <footer className="w-full flex justify-center items-center space-x-8">
                <button onClick={() => speakQuestion(currentQuestion.question)} className="bg-slate-800 p-4 rounded-full text-slate-400 hover:text-white transition-colors" disabled={isSessionEnded || isLoadingTTS || isSpeaking}>Replay Question</button>
                <button className={`bg-red-600 p-8 rounded-full text-white transition-all ${isListening ? 'animate-pulse' : ''}`} style={{boxShadow: '0 0 15px #EF4444'}} disabled>
                    <MicIcon className="w-10 h-10" />
                </button>
                 <button onClick={handleNextQuestion} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-4 px-8 rounded-full transition-colors glow" disabled={isSessionEnded || isLoadingTTS || isSpeaking || !currentAnswer.trim()}>
                    {isLastQuestion ? "Finish & View Report" : "Next Question"}
                </button>
            </footer>

            <ProctorModeBadge />

             {warning && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400/20 border border-yellow-500 text-yellow-300 px-6 py-3 rounded-lg text-sm animate-fade-in-out z-20">
                    {warning}
                </div>
            )}
             <style>{`
                @keyframes fade-in-out {
                    0%, 100% { opacity: 0; transform: translateY(10px) translateX(-50%); }
                    10%, 90% { opacity: 1; transform: translateY(0) translateX(-50%); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 4s ease-in-out;
                }
            `}</style>
        </div>
    );
};

// --- MOCK API LAYER ---
const mockApi = {
    createSession: (role: string): Promise<{ sessionId: string, questions: Question[] }> => {
        console.log(`[Mock API] Creating session for role: ${role}`);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    sessionId: `sess_mock_${Date.now()}`,
                    questions: [
                        { id: "q_mock_1", type: "behavioral", question: `Tell me about a time you had to deal with a difficult stakeholder as a ${role}.` },
                        { id: "q_mock_2", type: "technical", question: `What are the core principles of accessibility you apply in your work as a ${role}?` },
                        { id: "q_mock_3", type: "scenario", question: `Imagine you're tasked with a project with a tight deadline and unclear requirements. How would you approach this as a ${role}?` }
                    ]
                });
            }, 800);
        });
    },
    finishSession: (sessionId: string, role: string): Promise<Report> => {
         console.log(`[Mock API] Finishing session: ${sessionId}`);
         return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    reportId: `rep_mock_${Date.now()}`,
                    summary: "Solid performance overall. You demonstrated clear communication and provided relevant examples. To improve, focus on structuring your behavioral answers more consistently using the STAR method and providing more quantifiable results.",
                    metrics: { avgClarity: 8.7, avgRelevance: 9.0, durationSec: 542 },
                    items: [
                        {
                            question: `Tell me about a time you had to deal with a difficult stakeholder as a ${role}.`,
                            answerText: "I explained the technical constraints and we found a compromise.",
                            feedback: {
                                clarity: { score: 8, feedback: "Your explanation was clear and easy to follow." },
                                relevance: { score: 9, feedback: "The example was highly relevant to the question." },
                                starMethodAnalysis: {
                                    situation: "A stakeholder wanted a feature that was technically complex and would delay the project.",
                                    task: "To align on a feasible solution without compromising the deadline.",
                                    action: "I created a simplified prototype, presented data on the engineering cost, and proposed a phased approach.",
                                    result: "The stakeholder agreed to the phased approach, and we delivered the core feature on time."
                                },
                                overallSuggestion: "Excellent use of the STAR method. You clearly articulated the situation and the positive outcome."
                            }
                        },
                        {
                            question: `What are the core principles of accessibility you apply in your work as a ${role}?`,
                            answerText: "I use semantic HTML, ARIA attributes, and ensure keyboard navigation.",
                            feedback: {
                                clarity: { score: 9, feedback: "You listed key principles concisely." },
                                relevance: { score: 10, feedback: "Directly answered the technical question with accurate information." },
                                overallSuggestion: "Great answer. You could enhance it by mentioning WCAG guidelines or specific tools you use for testing."
                            }
                        },
                        {
                            question: `Imagine you're tasked with a project with a tight deadline and unclear requirements. How would you approach this as a ${role}?`,
                            answerText: "I would ask for clarification and start with the most important features.",
                            feedback: {
                                clarity: { score: 9, feedback: "Your approach is logical and well-stated." },
                                relevance: { score: 8, feedback: "You addressed the core challenges of the scenario." },
                                overallSuggestion: "Strong response. Consider mentioning specific agile practices like creating user stories or building an MVP to make your process more concrete."
                            }
                        }
                    ]
                });
            }, 1200);
        });
    }
}


function App() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  
  // New state for the backend-driven flow
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reportData, setReportData] = useState<Report | null>(null);


  const resetState = () => {
    userStream?.getTracks().forEach(track => track.stop());
    setUserStream(null);
    setSelectedRole(null);
    setSessionId(null);
    setQuestions([]);
    setReportData(null);
  };

  const navigateToDashboard = () => {
    resetState();
    setCurrentPage(Page.Dashboard)
  };
  const navigateToHome = () => {
    resetState();
    setCurrentPage(Page.Home);
  }

  const handleStartInterviewFlow = async (role: string) => {
    setSelectedRole(role);
    try {
        // 1. Get media permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setUserStream(stream);

        // 2. Create session with the backend
        const { sessionId, questions } = await mockApi.createSession(role);
        setSessionId(sessionId);
        setQuestions(questions);

        // 3. Proceed to pre-check
        setCurrentPage(Page.PreCheck);
    } catch (err) {
        console.error("Error starting interview flow:", err);
        alert("Could not start interview. Please ensure camera and microphone access is allowed and try again.");
    }
  };

  const handlePreCheckSuccess = () => {
    setCurrentPage(Page.Interview);
  };
  
  const handleFinishInterview = async () => {
    if (!sessionId || !selectedRole) {
        console.error("Cannot finish interview without a session ID and role.");
        navigateToDashboard();
        return;
    }
    const report = await mockApi.finishSession(sessionId, selectedRole);
    setReportData(report);
    setCurrentPage(Page.Report);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return <HomePage navigateToDashboard={navigateToDashboard} />;
      case Page.Dashboard:
        return <DashboardPage onStartInterview={handleStartInterviewFlow} navigateToHome={navigateToHome} />;
      case Page.PreCheck:
        return <PreCheckPage navigateToDashboard={navigateToDashboard} onChecksPassed={handlePreCheckSuccess} role={selectedRole!} userStream={userStream} />;
      case Page.Interview:
        return <InterviewPage onFinish={handleFinishInterview} role={selectedRole!} userStream={userStream} questions={questions} sessionId={sessionId!} />;
      case Page.Report:
        return <ReportPage report={reportData} navigateToDashboard={navigateToDashboard} role={selectedRole!} />;
      default:
        return <HomePage navigateToDashboard={navigateToDashboard} />;
    }
  };

  return (
    <div className="bg-slate-900">
      {renderPage()}
    </div>
  );
}

export default App;
