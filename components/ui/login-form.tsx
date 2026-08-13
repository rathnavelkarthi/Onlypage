import React, { useState } from "react";
import { X, Mail, Lock, User, ArrowLeft, Loader2, ArrowRight, Check, MessageCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LoginFormProps {
  onClose?: () => void;
  onSuccess?: (username: string) => void;
}

export default function LoginForm({ onClose, onSuccess }: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (isSignUp && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (isSignUp && !agreeTerms) {
      setError("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
          setIsSignUp(false);
          return;
        }
        onSuccess?.(name || email.split("@")[0]);
        onClose?.();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onSuccess?.(email.split("@")[0]);
        onClose?.();
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed.");
      setIsLoading(false);
    }
  };

  const inputWrap =
    "flex items-center gap-3 h-12 rounded-xl border border-[#18201d]/15 bg-white px-4 transition focus-within:border-[#18201d] focus-within:ring-2 focus-within:ring-lime-300/70";
  const inputBase =
    "w-full h-full bg-transparent text-sm font-semibold text-[#18201d] placeholder-[#96a099] outline-none";

  return (
    <div
      data-testid="auth-page"
      className="flex h-screen w-full overflow-hidden bg-[#f7f7f4] font-sans text-[#18201d] selection:bg-lime-300 selection:text-[#18201d]"
    >
      {/* Left brand panel — on-brand, no random stock art */}
      <div className="relative hidden h-full w-[46%] overflow-hidden bg-[#18201d] text-white md:block dna-noise">
        <div className="absolute -left-24 top-10 size-[30rem] rounded-full bg-lime-300/20 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] size-[24rem] rounded-full bg-[#70a10d]/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-[10px] bg-lime-300 text-sm font-black text-[#18201d]">O</span>
            <span className="text-[15px] font-black tracking-[-0.04em]">OnlyPage</span>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80">
              <span className="size-1.5 rounded-full bg-lime-300" /> Built for businesses that run on WhatsApp
            </div>
            <h1 className="mt-6 text-[2.6rem] font-black leading-[0.95] tracking-[-0.06em]">
              Build one page.<br />Run the whole business.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              Capture leads, take bookings, collect payments and follow up on WhatsApp — without learning a complicated design tool.
            </p>

            {/* Branded product mock — same language as the marketing site */}
            <div className="mt-9 rounded-2xl border border-white/10 bg-[#222c28] p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-white/50">ananya-studio.onlypage.in</span>
                <span className="text-[11px] font-bold text-lime-300">LIVE</span>
              </div>
              <div className="mt-3 rounded-xl bg-[#e3f0bb] p-4 text-[#18201d]">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4c7005]">Today’s next step</p>
                <p className="mt-3 text-sm font-black leading-5">Reply to 3 new enquiries</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-black text-[#4c7005]">
                  <MessageCircle size={13} /> Send follow-up
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-white/40">Built for India’s independent businesses.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-y-auto p-6 sm:p-10 md:w-[54%]">
        {onClose && (
          <>
            <button
              data-testid="auth-back"
              onClick={onClose}
              className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#53605a] transition hover:text-[#18201d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18201d]/30 rounded-lg px-2 py-1"
            >
              <ArrowLeft size={14} /> Back to site
            </button>
            <button
              data-testid="auth-close"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-6 top-6 grid size-9 place-items-center rounded-full text-[#53605a] transition hover:bg-white hover:text-[#18201d]"
            >
              <X size={18} />
            </button>
          </>
        )}

        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2.5 md:hidden">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#18201d] text-sm font-black text-lime-300">O</span>
            <span className="text-[15px] font-black tracking-[-0.04em]">OnlyPage</span>
          </div>

          <span className="text-xs font-black uppercase tracking-[0.16em] text-[#70a10d]">
            {isSignUp ? "Get started free" : "Welcome back"}
          </span>
          <h2 className="mt-3 text-[2.1rem] font-black leading-none tracking-[-0.055em]">
            {isSignUp ? "Create your account" : "Sign in to OnlyPage"}
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-[#53605a]">
            {isSignUp
              ? "Claim your free onlypage.in address and publish today."
              : "Manage your page, leads and bookings from one place."}
          </p>

          {error && (
            <div data-testid="auth-error" className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              <AlertCircle size={15} className="shrink-0" /> <span>{error}</span>
            </div>
          )}
          {info && (
            <div data-testid="auth-info" className="mt-5 flex items-center gap-2 rounded-xl border border-[#70a10d]/30 bg-[#e3f0bb]/60 p-3 text-xs font-bold text-[#4c7005]">
              <Check size={15} className="shrink-0" /> <span>{info}</span>
            </div>
          )}

          <button
            data-testid="auth-google"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#18201d]/15 bg-white text-sm font-bold text-[#18201d] transition hover:border-[#18201d]/35 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18201d]/30 disabled:opacity-60"
          >
            <img className="size-4" src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="" />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px w-full bg-[#18201d]/10" />
            <span className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-[#96a099]">
              or with email
            </span>
            <span className="h-px w-full bg-[#18201d]/10" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#53605a]">Full name</span>
                <div className={inputWrap}>
                  <User size={16} className="shrink-0 text-[#96a099]" />
                  <input
                    data-testid="auth-name"
                    type="text"
                    placeholder="Ananya Rao"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputBase}
                    required={isSignUp}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#53605a]">Email</span>
              <div className={inputWrap}>
                <Mail size={16} className="shrink-0 text-[#96a099]" />
                <input
                  data-testid="auth-email"
                  type="email"
                  placeholder="you@business.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#53605a]">Password</span>
              <div className={inputWrap}>
                <Lock size={16} className="shrink-0 text-[#96a099]" />
                <input
                  data-testid="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputBase}
                  required
                />
              </div>
            </label>

            {!isSignUp ? (
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-bold text-[#53605a]">
                  <input type="checkbox" id="remember_me" className="size-4 rounded border-[#18201d]/25 text-[#4c7005] focus:ring-lime-400" />
                  Remember me
                </label>
                <button type="button" className="text-xs font-bold text-[#4c7005] hover:underline">
                  Forgot password?
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer select-none items-start gap-2 text-xs font-medium leading-5 text-[#53605a]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-[#18201d]/25 text-[#4c7005] focus:ring-lime-400"
                />
                <span>
                  I agree to the <a className="font-bold text-[#4c7005] hover:underline">Terms of Service</a> and{" "}
                  <a className="font-bold text-[#4c7005] hover:underline">Privacy Policy</a>.
                </span>
              </label>
            )}

            <button
              data-testid="auth-submit"
              type="submit"
              disabled={isLoading}
              className="group mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#18201d] text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#28332f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f4] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Just a moment…</>
              ) : (
                <>{isSignUp ? "Create my account" : "Sign in"} <ArrowRight size={15} className="transition group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold text-[#53605a]">
            {isSignUp ? "Already have an account?" : "New to OnlyPage?"}{" "}
            <button
              data-testid="auth-toggle"
              type="button"
              onClick={() => {
                setError(null);
                setInfo(null);
                setIsSignUp(!isSignUp);
              }}
              className="font-black text-[#18201d] underline decoration-lime-400 decoration-2 underline-offset-4 hover:decoration-[#70a10d]"
            >
              {isSignUp ? "Sign in" : "Create one free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
