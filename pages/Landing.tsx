
import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertTriangle, X, Mail } from 'lucide-react';

interface LandingProps {
  onLoginWithEmail: () => void;
  onSignupWithEmail: () => void;
  onGoogleAuth: () => void;
}

const ROTATING_TEXTS = [
  "improve your grades",
  "raise your GPA",
  "organize your study schedule",
  "master your courses",
  "ace your exams"
];

export const Landing: React.FC<LandingProps> = ({ onLoginWithEmail, onSignupWithEmail, onGoogleAuth }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'use' | null>(null);
  
  // Changed from boolean to enum-like state for managing both modes
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);

  useEffect(() => {
    const currentFullText = ROTATING_TEXTS[textIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (isDeleting) {
      timeout = setTimeout(() => {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        setTypingSpeed(50);
      }, typingSpeed);
    } else {
      timeout = setTimeout(() => {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        setTypingSpeed(100);
      }, typingSpeed);
    }

    if (!isDeleting && displayText === currentFullText) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
      timeout = setTimeout(() => {}, 500);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, textIndex, typingSpeed]);

  const getPolicyContent = () => {
    const contactEmail = "greckoinfor@gmail.com";

    switch(activePolicy) {
      case 'privacy':
        return (
          <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
            <div>
                <p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p>
                <p>At Grecko, your privacy is our priority. This Privacy Policy explains what information we collect from users, how we use it, how we protect it, and your rights regarding your data when using Grecko. By using Grecko, you agree to the practices described in this policy.</p>
            </div>
            
            <div className="w-full h-px bg-slate-100 dark:bg-zinc-800" />
            
            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">1. Information We Collect</h3>
              <p className="mb-2 font-medium">Grecko collects information that is necessary to provide and improve our educational services:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Personal Information Provided by Users:</strong> Name, Email address, Password (stored securely using encryption), School grade and academic GPA.</li>
                  <li><strong>User-Generated Content:</strong> Uploaded assignments, notes, and other study materials, AI-generated study suggestions, summaries, or responses.</li>
              </ul>
              <p className="mt-3 text-sm italic bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg">Note: All information is collected only to provide the educational features of Grecko.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">2. How We Use Your Information</h3>
              <p className="mb-2 font-medium">We use your information strictly to support your learning and account functionality:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Account Creation & Management:</strong> Manage user accounts and allow login securely.</li>
                  <li><strong>AI Learning Assistance:</strong> Generate AI study suggestions and educational content personalized for you.</li>
                  <li><strong>Assignment & Content Storage:</strong> Store and retrieve uploaded assignments, notes, and AI responses.</li>
                  <li><strong>Customer Support:</strong> Respond to inquiries or issues regarding account access, assignments, or app functionality.</li>
                  <li><strong>Security:</strong> Protect accounts from unauthorized access.</li>
              </ul>
              <p className="mt-2 font-medium text-slate-900 dark:text-white">Grecko does not use your data for advertising or sell it to third parties.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">3. How We Store & Protect Data</h3>
              <p className="mb-2 font-medium">Your data is stored securely and handled carefully:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Supabase Database:</strong> All user data, including assignments and AI-generated content, is stored securely in Supabase.</li>
                  <li><strong>Encrypted Passwords:</strong> Passwords are encrypted to prevent unauthorized access.</li>
                  <li><strong>Access Control:</strong> Only authorized systems or personnel can access user data for app functionality or support.</li>
                  <li><strong>Backups & Security Measures:</strong> Regular backups and security updates ensure your information is safe.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">4. Sharing of Data</h3>
              <p className="mb-2 font-medium">We respect your privacy. Your data is only shared in the following limited cases:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Trusted Services:</strong> With Supabase for secure data storage and email services for account notifications.</li>
                  <li><strong>Legal Requirements:</strong> If required by law or legal process.</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user information may be transferred under privacy-compliant procedures.</li>
              </ul>
              <p className="mt-2 font-medium text-slate-900 dark:text-white">We never sell your data to third parties.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">5. User Rights and Choices</h3>
              <p className="mb-2 font-medium">You have the right to control your data:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold.</li>
                  <li><strong>Correction:</strong> Update or correct personal information, including name, email, or GPA.</li>
                  <li><strong>Deletion:</strong> Delete your account and remove all associated data from Grecko.</li>
                  <li><strong>Contact:</strong> Any requests regarding data can be made via <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">6. Data Retention</h3>
              <p>We keep your data only as long as needed to provide our services. Once your account is deleted or your data is no longer necessary, it is securely removed from Supabase.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">7. Changes to This Privacy Policy</h3>
              <p>We may update this Privacy Policy from time to time to reflect changes in our app or legal requirements. Major changes will be communicated in the app. Continued use of Grecko constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">8. Contact Us</h3>
              <p>For any questions, concerns, or requests regarding this Privacy Policy or your data, contact:</p>
              <p className="mt-2 bg-blue-50 dark:bg-blue-900/20 inline-block px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  Email: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline font-medium">{contactEmail}</a>
              </p>
            </section>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
            <div>
                <p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p>
                <p>These Terms of Service (“Terms”) govern your use of the Grecko app and related services. By accessing or using Grecko, you agree to comply with these Terms. Please read them carefully.</p>
            </div>
            
            <div className="w-full h-px bg-slate-100 dark:bg-zinc-800" />
            
            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">1. Acceptance of Terms</h3>
              <p className="mb-2 font-medium">By creating an account or using Grecko, you agree to:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Provide accurate and truthful information, including your name, email address, school grade, and GPA.</li>
                  <li>Comply with these Terms and all applicable laws.</li>
                  <li>Use Grecko in a responsible and respectful manner.</li>
              </ul>
              <p className="mt-2">If you do not agree with these Terms, you may not use Grecko.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">2. User Accounts</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Users must register an account to access the app’s features.</li>
                  <li>Users are responsible for maintaining the confidentiality of their login credentials.</li>
                  <li>Users are responsible for all activity that occurs under their account.</li>
                  <li>Grecko reserves the right to suspend or terminate accounts for violations of these Terms.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">3. User-Generated Content</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Ownership:</strong> Users retain full ownership of all content uploaded to the app, including assignments, notes, and other study materials.</li>
                  <li><strong>License to Grecko:</strong> By uploading content, users grant Grecko a non-exclusive license to store, display, and use such content for app functionality, including AI processing, assignment management, and account display.</li>
                  <li><strong>Prohibited Content:</strong> Content that is illegal, abusive, harmful, or violates any laws may be removed by Grecko at its discretion.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">4. AI-Generated Content</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko provides AI-generated study suggestions, summaries, and recommendations for educational purposes.</li>
                  <li>AI-generated content may not always be accurate, complete, or suitable for all situations. Users are responsible for verifying important information.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">5. Prohibited Activities</h3>
              <p className="mb-2">Users are prohibited from:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Hacking, reverse engineering, or attempting to disrupt the app.</li>
                  <li>Spamming or sending unsolicited messages.</li>
                  <li>Impersonating other users or Grecko staff.</li>
                  <li>Misusing AI features to generate inappropriate or harmful content.</li>
                  <li>Engaging in academic dishonesty, including cheating, plagiarism, or submitting AI-generated content as original work.</li>
              </ul>
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300 font-medium text-sm leading-relaxed">
                      <strong>Important:</strong> Violation of these rules may result in immediate account suspension or permanent termination.
                  </p>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">6. Account Termination</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko may suspend or terminate user accounts that violate these Terms.</li>
                  <li>Users may request deletion of their account, at which point all associated data will be removed from Supabase.</li>
                  <li>Users whose accounts are terminated may not attempt to create new accounts to circumvent suspensions.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">7. Data Collection and Privacy</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko collects user information, including name, email, password (encrypted), GPA, school grade, uploaded assignments, notes, and AI-generated content.</li>
                  <li>Data is stored securely in Supabase and used only for app functionality, AI processing, account management, and customer support.</li>
                  <li>Grecko does not sell user data. For more details, see the Privacy Policy.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">8. Service Availability</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko may experience maintenance, updates, or downtime.</li>
                  <li>While we strive to provide uninterrupted service, Grecko does not guarantee 100% availability.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">9. Limitation of Liability</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>The app and its services are provided “as is” without warranties of any kind.</li>
                  <li>Grecko is not responsible for academic outcomes, data loss, or any damages arising from the use of the app.</li>
                  <li>Users agree to use the app at their own risk.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">10. Changes to Terms</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko may update these Terms from time to time.</li>
                  <li>Major changes will be communicated to users via the app.</li>
                  <li>Continued use of the app after updates constitutes acceptance of the revised Terms.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">11. Governing Law</h3>
              <p>These Terms are governed by the laws of the jurisdiction in which Grecko operates. Users agree that any disputes will be resolved in accordance with those laws.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">12. Contact Information</h3>
              <p>For questions or concerns regarding these Terms, contact:</p>
              <p className="mt-2 bg-blue-50 dark:bg-blue-900/20 inline-block px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  Email: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline font-medium">{contactEmail}</a>
              </p>
            </section>
          </div>
        );
      case 'use':
        return (
          <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
            <div>
                <p className="text-sm text-slate-500 mb-4">Last Updated: 30th November 2025</p>
                <p>Welcome to Grecko, an educational app designed for middle school and above. These Terms of Use explain how you can use the app, what features are available, and what is expected of you as a user. By using Grecko, you agree to follow these rules.</p>
            </div>
            
            <div className="w-full h-px bg-slate-100 dark:bg-zinc-800" />
            
            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">1. Creating Your Account</h3>
              <p className="mb-2 font-medium">To use Grecko:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Sign Up:</strong> Provide your name, email address, school grade, and optionally your GPA. Create a secure password. By signing up, you agree to the Terms of Use and the Privacy Policy.</li>
                  <li><strong>Profile Setup (Optional):</strong> You can add a short bio or learning goals. This helps Grecko provide more personalized AI study suggestions.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">2. Uploading and Managing Content</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>You can upload assignments, notes, and study materials to keep track of your work.</li>
                  <li>All uploaded content is securely stored in Supabase.</li>
                  <li>You own your content, but by uploading it, you allow Grecko to use it for app functionality, like AI suggestions and assignment tracking.</li>
                  <li>You can delete content or your account at any time.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">3. Using AI Study Tools</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko provides AI-generated summaries, suggestions, and study tips.</li>
                  <li>AI tools analyze your uploaded content or learning level to give helpful insights.</li>
                  <li>AI content is educational; it may not always be 100% accurate, so verify important information.</li>
                  <li>Misusing AI (e.g., generating inappropriate content) is prohibited.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">4. Tracking Progress</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko allows you to track assignments, grades, and study progress.</li>
                  <li>You can view past uploads, AI suggestions, and your GPA history.</li>
                  <li>Data is stored securely and used only to enhance your learning experience.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">5. Community Rules</h3>
              <p className="mb-2">To keep Grecko safe and helpful for everyone:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Do not upload harmful, illegal, or abusive content.</li>
                  <li>Do not cheat, plagiarize, or use AI-generated content dishonestly.</li>
                  <li>Respect other users; harassment, hate speech, or offensive content is prohibited.</li>
              </ul>
              <p className="mt-3 text-sm italic bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg">Grecko may remove content or suspend accounts that violate these rules.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">6. Account Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Keep your login credentials secure.</li>
                  <li>You are responsible for everything that happens under your account.</li>
                  <li>Report any security issues or unauthorized access to <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a> immediately.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">7. Service Availability</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>The app may occasionally be unavailable due to updates or maintenance.</li>
                  <li>Features may change as the app improves.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">8. Privacy and Data</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko collects name, email, password (encrypted), GPA, school grade, assignments, notes, and AI-generated content.</li>
                  <li>All data is stored securely in Supabase.</li>
                  <li>Data is used only for AI suggestions, assignment tracking, account management, and support.</li>
                  <li>Users can request updates, deletion, or access to their data at any time via <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">9. Limitations</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko cannot guarantee academic results or learning outcomes.</li>
                  <li>You are responsible for your own studies and verifying AI suggestions.</li>
                  <li>Grecko is not liable for lost content or errors in AI-generated content.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">10. Account Termination</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Accounts may be suspended or deleted for violating rules.</li>
                  <li>You may request deletion of your account at any time, and all data will be removed from Supabase.</li>
                  <li>Terminated users may not create new accounts to bypass rules.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">11. Changes to Terms</h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li>Grecko may update these Terms from time to time.</li>
                  <li>Users will be notified of major updates in the app.</li>
                  <li>Continued use after updates constitutes agreement to the revised Terms.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">12. Achieving Your GPA with Grecko (Layman’s Terms)</h3>
              <p className="mb-2">Grecko is designed to help you achieve your desired GPA. For example, if you have only a few remaining tests or assignments, the app analyzes the subjects or tasks you have left and provides guidance to help you reach the GPA you want.</p>
              <p className="mb-2">You can start using Grecko at the beginning of the semester, mid-term, or any point during your studies, though we recommend starting at the beginning of the term for the best results.</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  <li><strong>Mid-term use:</strong> Grecko focuses on your remaining subjects or assessments to help you maximize your grades and reach your goal.</li>
                  <li><strong>Beginning of term use:</strong> Grecko reviews all your subjects for the term and provides guidance to help you achieve your desired GPA across all courses.</li>
              </ul>
              <p className="mt-2">Grecko works by analyzing your coursework and providing tailored support to help you excel in your subjects and meet your academic goals.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">13. Contact</h3>
              <p>For questions, feedback, or support, contact:</p>
              <p className="mt-2 bg-blue-50 dark:bg-blue-900/20 inline-block px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  Email: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline font-medium">{contactEmail}</a>
              </p>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  const getPolicyTitle = () => {
      switch(activePolicy) {
          case 'privacy': return "Privacy Policy";
          case 'terms': return "Terms of Service";
          case 'use': return "Terms of Use";
          default: return "";
      }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary to-primary-dark pointer-events-none" />
      
      {/* Decorative Circles */}
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-black/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center mt-20">
        <h1 className="text-6xl font-bold text-white tracking-tight mb-6">Grecko</h1>
        
        <p className="text-blue-100 text-lg mb-2">The smart way to</p>
        
        <div className="h-8">
           <span className="text-2xl font-bold text-white">
             {displayText}
             <span className="animate-pulse">|</span>
           </span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto mb-4">
        <div className="bg-[#0f286e]/60 backdrop-blur-md rounded-[2rem] p-6 pb-8 border border-white/10 shadow-xl">
           <button 
             onClick={() => setAuthModalMode('signup')}
             className="w-full bg-white text-slate-900 font-bold text-lg py-4 rounded-full shadow-lg hover:bg-slate-50 active:scale-[0.98] transition-all mb-6"
           >
             Sign up
           </button>
           
           <button 
             onClick={() => setAuthModalMode('login')}
             className="w-full text-white font-medium hover:text-blue-100 transition-colors text-sm"
           >
             I have an account
           </button>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-blue-200/60 font-medium tracking-wide">
          <button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
          <button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors">Terms of Service</button>
          <button onClick={() => setActivePolicy('use')} className="hover:text-white transition-colors">Terms of Use</button>
        </div>
      </div>

      {/* Auth Modal (Login/Signup) */}
      {authModalMode && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-black rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 relative border border-white/10">
            <button
              onClick={() => setAuthModalMode(null)}
              className="absolute top-5 right-5 p-1 bg-zinc-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8 mt-2">
              <h2 className="text-2xl font-bold text-white mb-2">
                {authModalMode === 'signup' ? 'Sign up' : 'Sign in'}
              </h2>
              <p className="text-gray-400 text-sm">
                {authModalMode === 'signup' 
                  ? 'Create your account to start improving your grades' 
                  : 'Sign in to continue improving your grades'}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  onGoogleAuth();
                  setAuthModalMode(null);
                }}
                className="w-full bg-white text-black font-semibold text-lg py-3.5 rounded-full flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {authModalMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
              </button>

              <button
                onClick={() => {
                  if (authModalMode === 'signup') {
                    onSignupWithEmail();
                  } else {
                    onLoginWithEmail();
                  }
                  setAuthModalMode(null);
                }}
                className="w-full bg-black border border-white/20 text-white font-semibold text-lg py-3.5 rounded-full flex items-center justify-center gap-3 hover:bg-zinc-900 transition-colors"
              >
                <Mail className="w-5 h-5" />
                {authModalMode === 'signup' ? 'Sign up with Email' : 'Sign in with Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Page Policy View */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                     <button onClick={() => setActivePolicy(null)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                     </button>
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getPolicyTitle()}</h2>
                </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-2xl mx-auto pb-12">
                   {getPolicyContent()}

                   <div className="mt-12 pt-8 border-t border-slate-100 dark:border-zinc-800">
                        <button 
                            onClick={() => setActivePolicy(null)}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
                        >
                            I understand
                        </button>
                   </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
