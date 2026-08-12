/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, CheckCircle, ShieldCheck, X, ArrowRight, Globe, Zap } from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import ModernLanding from './components/ModernLanding';
import AiBuilderSection from './components/AiBuilderSection';
import BuiltForEveryoneSection from './components/BuiltForEveryoneSection';
import WebsiteEditorSection from './components/WebsiteEditorSection';
import DashboardSection from './components/DashboardSection';
import WhatsAppSection from './components/WhatsAppSection';
import FeaturesSection from './components/FeaturesSection';
import TemplatesSection from './components/TemplatesSection';
import PrdExplorer from './components/PrdExplorer';
import PricingSection from './components/PricingSection';
import LoginForm from '@/components/ui/login-form';
import EfferdDashboard2 from '@/components/ui/efferd-dashboard-2';
import OnboardingWizard, { SiteRecord } from '@/components/ui/onboarding-wizard';
import { DarkModeProvider } from '@/hooks/use-dark-mode';
import { I18nProvider } from '@/hooks/use-i18n';
import { Persona } from './types';
import { PERSONAS } from './data';
import { supabase } from '@/lib/supabase';
import PublicSiteView from './components/PublicSiteView';
import DnaDemo from './components/DnaDemo';

const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();

  // Local production-parity preview: http://my-site.localhost:3000
  if (hostname.endsWith('.localhost')) {
    const localSubdomain = hostname.slice(0, -'.localhost'.length).trim();
    if (localSubdomain) return localSubdomain;
  }
  
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === 'onlypage.in' ||
    hostname === 'www.onlypage.in' ||
    hostname.endsWith('.vercel.app')
  ) {
    return null;
  }
  
  if (hostname.endsWith('.onlypage.in')) {
    const sub = hostname.replace('.onlypage.in', '').trim();
    if (sub && sub !== 'www') return sub;
  }
  
  return null;
};

export default function App() {
  const currentSubdomain = getSubdomain();

  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'dna') {
    return <DnaDemo />;
  }

  if (currentSubdomain) {
    return <PublicSiteView subdomain={currentSubdomain} />;
  }

  const [businessName, setBusinessName] = useState('yourname');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(PERSONAS[0]); // default to salon
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [site, setSite] = useState<SiteRecord | null>(null);
  const [siteLoading, setSiteLoading] = useState(false);

  // Load the current user's site (if any) to decide onboarding vs dashboard.
  const loadSite = async (isInitial = false) => {
    if (isInitial) setSiteLoading(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setSite(null);
      if (isInitial) setSiteLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('owner_id', authData.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!error) setSite((data as SiteRecord) ?? null);
    if (isInitial) setSiteLoading(false);
  };

  useEffect(() => {
    // Hydrate the initial session, then react to any auth state change
    // (login, logout, and the Google OAuth redirect landing back here).
    supabase.auth.getSession().then(async ({ data }) => {
      const loggedIn = !!data.session;
      setIsLoggedIn(loggedIn);
      if (loggedIn) await loadSite(true);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        // Only load site on SIGNED_IN. Ignore TOKEN_REFRESHED to prevent editor resets.
        if (event === 'SIGNED_IN') {
          await loadSite(false);
        }
      } else {
        setSite(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar once scrolled past 480px
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleClaimDomain = () => {
    setShowClaimModal(true);
  };

  const handleSelectTemplate = (tempId: string) => {
    // Select persona corresponding to template ID
    if (tempId === 'temp-1') {
      setSelectedPersona(PERSONAS[4]); // Business
      showToast('Loaded Apex Professional Template in Editor');
    } else if (tempId === 'temp-2') {
      setSelectedPersona(PERSONAS[3]); // Creator
      showToast('Loaded Lumina Creative Template in Editor');
    } else if (tempId === 'temp-3') {
      setSelectedPersona(PERSONAS[0]); // Salon
      showToast('Loaded Elysian Boutique Template in Editor');
    } else if (tempId === 'temp-4') {
      setSelectedPersona(PERSONAS[2]); // Student
      showToast('Loaded Vanguard Minimalist Template in Editor');
    }
  };

  if (!authReady || (isLoggedIn && siteLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    // Logged in but no site yet -> run onboarding first.
    if (!site) {
      return <OnboardingWizard onComplete={(created) => setSite(created)} />;
    }
    return (
      <DarkModeProvider>
        <I18nProvider>
          <EfferdDashboard2
            site={site}
            onUpdateSite={(updatedSite) => setSite(updatedSite)}
            onLogout={async () => {
              await supabase.auth.signOut();
              setSite(null);
              setIsLoggedIn(false);
            }}
          />
        </I18nProvider>
      </DarkModeProvider>
    );
  }

  // The public product surface is intentionally compact. Older prototype
  // sections remain available in source while the signed-out experience now
  // leads with the real product workflow instead of a long feature demo.
  if (!isLoggedIn) {
    return (
      <>
        <ModernLanding onStart={() => setIsLoginOpen(true)} onLogin={() => setIsLoginOpen(true)} />
        <AnimatePresence>
          {isLoginOpen && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[60] overflow-hidden"
            >
              <LoginForm
                onClose={() => setIsLoginOpen(false)}
                onSuccess={(username) => {
                  showToast(`Successfully signed in as ${username}!`);
                  setIsLoginOpen(false);
                  setIsLoggedIn(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Floating Global Glass Header */}
      <Header onScrollTo={handleScrollTo} onLoginClick={() => setIsLoginOpen(true)} />

      {/* --- SECTION 1: HERO --- */}
      <HeroSection 
        businessName={businessName} 
        setBusinessName={setBusinessName} 
        onClaimDomain={handleClaimDomain} 
      />

      {/* --- SECTION 2: AI BUILDER DEMO --- */}
      <AiBuilderSection businessName={businessName} />

      {/* --- SECTION 3: BUILT FOR EVERYONE --- */}
      <BuiltForEveryoneSection 
        onSelectPersona={(p) => {
          setSelectedPersona(p);
          showToast(`Successfully loaded preset for: ${p.name}`);
        }} 
        onScrollTo={handleScrollTo} 
      />

      {/* --- SECTION 4: EASY WEBSITE EDITOR --- */}
      <WebsiteEditorSection 
        selectedPersona={selectedPersona} 
        businessName={businessName}
        setBusinessName={setBusinessName}
      />

      {/* --- SECTION 5: BUSINESS DASHBOARD --- */}
      <DashboardSection businessName={businessName} />

      {/* --- SECTION 6: WHATSAPP ASSISTANT --- */}
      <WhatsAppSection businessName={businessName} />

      {/* --- SECTION 7: FEATURES BENTO --- */}
      <FeaturesSection onScrollTo={handleScrollTo} />

      {/* --- SECTION 8: TEMPLATES SHOWCASE --- */}
      <TemplatesSection 
        onSelectTemplate={handleSelectTemplate} 
        onScrollTo={handleScrollTo} 
      />

      {/* --- SECTION 8.5: PRD SPEC EXPLORER --- */}
      <PrdExplorer />

      {/* --- SECTION 9: PRICING PLANS --- */}
      <PricingSection 
        onPlanSelect={(planName) => {
          showToast(`Create an account to start the ${planName} plan setup.`);
          setIsLoginOpen(true);
        }} 
      />

      {/* --- SECTION 10: FINAL CTA --- */}
      <section className="py-24 bg-mesh-cta relative overflow-hidden border-t border-slate-150 grid-pattern">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
            Launch Today
          </span>
          
          <h2 className="text-fluid-h2 font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto font-sans leading-tight">
            Your idea deserves a place online.
          </h2>
          
          <p className="text-slate-500 text-sm sm:text-base font-semibold max-w-lg mx-auto">
            Build your website, structure booking forms, accept leads, and automate client inquiries on WhatsApp business in minutes. No credit card required.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleScrollTo('pricing')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              Create your OnlyPage
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => handleScrollTo('ai-demo')}
              className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-350 text-slate-700 font-bold px-8 py-3.5 rounded-xl transition-all shadow-2xs inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} className="text-blue-500" />
              Try AI Generator Demo
            </button>
          </div>

          <div className="pt-6 text-xs text-slate-400 font-semibold select-none flex justify-center items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Built for independent businesses ready to grow online</span>
          </div>
        </div>
      </section>

      {/* --- PLATFORM FOOTER --- */}
      <Footer onScrollTo={handleScrollTo} />

      {/* DYNAMIC CONFIRMATION TOAST FLOATER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm w-max border border-white/10"
          >
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOMAIN CLAIMED SUCCESS OVERLAY DIALOG */}
      <AnimatePresence>
        {showClaimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClaimModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full relative z-10 shadow-2xl text-center space-y-4"
            >
              <button
                onClick={() => setShowClaimModal(false)}
                className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl mx-auto">
                ✨
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Your preferred page address is ready to check</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Continue setup to check whether <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">{businessName}.onlypage.in</span> is available.
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                We will confirm availability during onboarding, then help you build the page and customer tools your business needs.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowClaimModal(false);
                    setIsLoginOpen(true);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Start guided setup
                </button>
                <button
                  onClick={() => {
                    setShowClaimModal(false);
                    setIsLoginOpen(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Create my OnlyPage
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSISTENT FLOATING STICKY CTA BAR ON SCROLL */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-3xl z-45 bg-white/95 border border-slate-200/80 backdrop-blur-lg shadow-xl rounded-2xl p-3 md:p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center shrink-0 text-indigo-600 hidden sm:flex">
                <Globe size={14} className="animate-pulse" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 truncate">
                    {businessName || 'yourname'}.onlypage.in
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 hidden md:block">
                  Choose this address during your guided setup.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleScrollTo('editor')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] md:text-xs rounded-xl transition-all cursor-pointer hidden sm:inline-block"
              >
                Customize layout
              </button>
              <button
                onClick={handleClaimDomain}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] md:text-xs rounded-xl shadow-md shadow-indigo-100 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start setup</span>
                <Zap size={11} className="fill-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LOGIN & SIGNUP FULL SCREEN DIALOG --- */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-55 overflow-hidden"
          >
            <LoginForm 
              onClose={() => setIsLoginOpen(false)} 
              onSuccess={(username) => {
                showToast(`Successfully signed in as ${username}!`);
                setIsLoginOpen(false);
                setIsLoggedIn(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
