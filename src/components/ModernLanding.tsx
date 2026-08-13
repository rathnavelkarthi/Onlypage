import React, { useState } from 'react';
import { ArrowRight, CalendarCheck, Check, Command, Globe2, IndianRupee, Languages, LayoutPanelTop, Menu, MessageCircle, MousePointer2, WandSparkles, X } from 'lucide-react';
import PricingSection from './PricingSection';

interface ModernLandingProps {
  onStart: () => void;
  onLogin: () => void;
}

const outcomes = [
  { icon: CalendarCheck, title: 'Turn visits into bookings', detail: 'Give customers a clear time to choose, a deposit to pay, and a WhatsApp confirmation.' },
  { icon: MessageCircle, title: 'Reply while the lead is warm', detail: 'Keep every follow-up and delivery status beside the customer record.' },
  { icon: IndianRupee, title: 'Get paid locally', detail: 'Use UPI or Razorpay with totals calculated safely on the server.' },
];

export default function ModernLanding({ onStart, onLogin }: ModernLandingProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f4] text-[#18201d] selection:bg-lime-300 selection:text-[#18201d]">
      <header className="sticky top-0 z-40 border-b border-[#18201d]/10 bg-[#f7f7f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button onClick={() => scrollTo('top')} className="flex items-center gap-2.5 text-left" aria-label="OnlyPage home">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#18201d] text-sm font-black text-lime-300">O</span>
            <span className="text-[15px] font-black tracking-[-0.04em]">OnlyPage</span>
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {[['How it works', 'how-it-works'], ['For local business', 'outcomes'], ['Editor', 'editor'], ['Pricing', 'pricing']].map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#53605a] transition hover:bg-white hover:text-[#18201d]">{label}</button>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex"><button onClick={onLogin} className="rounded-xl px-3.5 py-2 text-sm font-bold text-[#53605a] transition hover:text-[#18201d]">Log in</button><button onClick={onStart} className="rounded-xl bg-[#18201d] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#28332f]">Create my page</button></div>
          <button onClick={() => setMobileOpen((open) => !open)} className="rounded-lg p-2 text-[#18201d] md:hidden" aria-label="Toggle menu">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {mobileOpen && <div className="border-t border-[#18201d]/10 bg-[#f7f7f4] p-4 md:hidden"><div className="mx-auto grid max-w-7xl gap-1"><button onClick={() => scrollTo('how-it-works')} className="rounded-lg px-3 py-3 text-left text-sm font-bold">How it works</button><button onClick={() => scrollTo('editor')} className="rounded-lg px-3 py-3 text-left text-sm font-bold">Editor</button><button onClick={onLogin} className="rounded-lg px-3 py-3 text-left text-sm font-bold">Log in</button><button onClick={onStart} className="mt-2 rounded-xl bg-[#18201d] px-4 py-3 text-sm font-bold text-white">Create my page</button></div></div>}
      </header>

      <section id="top" className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="absolute left-[42%] top-5 size-[33rem] rounded-full bg-lime-300/30 blur-3xl" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="dna-rise inline-flex items-center gap-2 rounded-full border border-[#18201d]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#53605a]" style={{ animationDelay: '40ms' }}><span className="size-1.5 rounded-full bg-[#70a10d]" /> Built for businesses that run on WhatsApp</div>
            <h1 className="dna-rise mt-6 max-w-3xl text-[clamp(3rem,7vw,6.4rem)] font-black leading-[0.92] tracking-[-0.075em] text-[#18201d]" style={{ animationDelay: '120ms' }}>Your website should help run your business.</h1>
            <p className="dna-rise mt-7 max-w-xl text-lg leading-8 text-[#53605a]" style={{ animationDelay: '200ms' }}>Launch a page that can capture leads, take bookings, collect payment, and follow up—without learning a complicated design tool.</p>
            <div className="dna-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '280ms' }}><button onClick={onStart} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#18201d] px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#28332f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f4]">Create my business page <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></button><button onClick={() => scrollTo('how-it-works')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#18201d]/15 bg-white px-5 py-3.5 text-sm font-bold transition hover:border-[#18201d]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18201d]/30">See how it works</button></div>
            <p className="dna-rise mt-4 text-xs font-medium text-[#718078]" style={{ animationDelay: '340ms' }}>Start with Guided Launch. Studio Mode is ready when you need full control.</p>
          </div>

          <div className="dna-rise relative mx-auto w-full max-w-[580px]" style={{ animationDelay: '240ms' }}>
            <div className="overflow-hidden rounded-[24px] border border-[#18201d]/15 bg-[#18201d] p-2 shadow-[0_30px_80px_rgba(24,32,29,0.22)]">
              <div className="overflow-hidden rounded-[18px] bg-[#f7f7f4]">
                <div className="flex items-center justify-between border-b border-[#18201d]/10 px-4 py-3"><div className="flex gap-1.5"><i className="size-2 rounded-full bg-[#cf7964]" /><i className="size-2 rounded-full bg-[#e2bb58]" /><i className="size-2 rounded-full bg-[#7aa964]" /></div><span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-[#718078]">ananya-studio.onlypage.in</span><span className="text-[10px] font-bold text-[#70a10d]">DRAFT</span></div>
                <div className="grid gap-5 p-5 sm:grid-cols-[1.08fr_0.92fr] sm:p-7"><div><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#70a10d]">Ananya Beauty Studio</span><h2 className="mt-3 text-3xl font-black leading-none tracking-[-0.06em]">Feel good. Look like yourself.</h2><p className="mt-3 text-xs leading-5 text-[#718078]">Hair, skin and bridal services in Indiranagar.</p><button className="mt-5 rounded-lg bg-[#18201d] px-3 py-2 text-[11px] font-bold text-white">Book an appointment</button></div><div className="rounded-2xl bg-[#e3f0bb] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#53605a]">Today’s next step</p><p className="mt-5 text-sm font-black leading-5">Reply to 3 new enquiries</p><div className="mt-4 rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold">Priya Sharma</p><p className="mt-1 text-[10px] text-[#718078]">Bridal package enquiry</p><button className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-[#4c7005]"><MessageCircle size={11} /> Send follow-up</button></div></div></div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-[#18201d]/10 bg-white p-3 shadow-lg sm:block"><p className="text-[10px] font-bold text-[#718078]">Customer action</p><p className="mt-1 text-xs font-black">Booking confirmed</p><div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#4c7005]"><Check size={12} /> WhatsApp ready</div></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#18201d]/10 bg-white py-18 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#70a10d]">Guided Launch</p><h2 className="mt-3 text-4xl font-black tracking-[-0.06em] sm:text-5xl">Start with your business, not a blank canvas.</h2><p className="mt-5 text-base leading-7 text-[#53605a]">A short workflow gives your site the right page structure and the tools your business needs from day one.</p></div><div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#18201d]/10 bg-[#18201d]/10 md:grid-cols-3">{[['01', 'Tell us what you do', 'Choose your business type, goal, services, language and style.'], ['02', 'Pick the outcomes', 'Add leads, booking, payments, offers and review requests.'], ['03', 'Run the next action', 'Follow up, confirm bookings and improve your page from one place.']].map(([number, title, copy]) => <article key={number} className="bg-white p-6 sm:p-8"><span className="text-xs font-black text-[#70a10d]">{number}</span><h3 className="mt-10 text-xl font-black tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#718078]">{copy}</p></article>)}</div></div>
      </section>

      <section id="outcomes" className="mx-auto max-w-7xl px-5 py-18 sm:px-8 sm:py-24"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#70a10d]">More than a website</p><h2 className="mt-3 text-4xl font-black tracking-[-0.06em] sm:text-5xl">Every block should do useful work.</h2></div><p className="max-w-md text-sm leading-6 text-[#53605a]">OnlyPage is designed for the day after publishing: when a customer sends an enquiry, wants a time, or is ready to pay.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{outcomes.map(({ icon: Icon, title, detail }) => <article key={title} className="rounded-2xl border border-[#18201d]/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#18201d]/5"><span className="grid size-10 place-items-center rounded-xl bg-[#e3f0bb] text-[#4c7005]"><Icon size={19} /></span><h3 className="mt-12 text-xl font-black tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#718078]">{detail}</p></article>)}</div></section>

      <section id="editor" className="relative overflow-hidden bg-[#18201d] py-18 text-white sm:py-24 dna-noise"><div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">A calmer editor</p><h2 className="mt-3 text-4xl font-black tracking-[-0.06em] sm:text-5xl">The canvas first. Controls when you ask for them.</h2><p className="mt-5 max-w-md text-base leading-7 text-white/65">Canvas Mode keeps the page in focus. Select a section to edit it, use quick actions for common changes, and open Studio Mode only for advanced layout work.</p><ul className="mt-8 space-y-3 text-sm font-semibold text-white/80"><li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-lime-300" />Contextual properties instead of permanent sidebars</li><li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-lime-300" />Command bar for “add pricing” or “make this premium”</li><li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-lime-300" />Studio Mode preserves the complete design system</li></ul></div><div className="rounded-[22px] border border-white/10 bg-[#222c28] p-2 shadow-2xl"><div className="rounded-[16px] bg-[#f7f7f4] p-4 text-[#18201d]"><div className="flex items-center justify-between border-b border-[#18201d]/10 pb-3"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-[#18201d] text-xs font-black text-lime-300">O</span><span className="text-xs font-black">Ananya Beauty Studio</span></div><button className="rounded-md border border-[#18201d]/10 bg-white px-2 py-1 text-[10px] font-bold">Studio Mode</button></div><div className="relative mt-4 overflow-hidden rounded-xl border border-[#18201d]/10 bg-white"><div className="flex items-center justify-between px-5 py-4"><span className="text-xs font-black">Your next beautiful page</span><span className="text-[10px] font-bold text-[#718078]">Home</span></div><div className="border-y border-[#18201d]/10 bg-[#e3f0bb] px-5 py-10"><span className="text-[9px] font-black uppercase tracking-wider text-[#4c7005]">Selected section</span><p className="mt-3 max-w-sm text-2xl font-black leading-7 tracking-[-0.05em]">Premium care for every kind of day.</p><button className="mt-5 rounded-lg bg-[#18201d] px-3 py-2 text-[10px] font-bold text-white">Book now</button></div><div className="flex gap-2 p-3"><button className="rounded-lg bg-[#18201d] px-3 py-2 text-[10px] font-bold text-white">Edit copy</button><button className="rounded-lg border border-[#18201d]/10 px-3 py-2 text-[10px] font-bold">Change style</button><button className="rounded-lg border border-[#18201d]/10 px-3 py-2 text-[10px] font-bold">Add section</button></div></div><div className="mt-3 flex items-center gap-2 rounded-lg border border-[#18201d]/10 bg-white px-3 py-2"><Command size={13} /><span className="text-[10px] font-semibold text-[#718078]">Add pricing, make this more premium, add booking section…</span></div></div></div></div>
      </section>

      <PricingSection onPlanSelect={onStart} />

      <footer className="border-t border-[#18201d]/10 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs font-semibold text-[#718078] sm:flex-row sm:items-center sm:justify-between"><span className="font-black text-[#18201d]">OnlyPage</span><span>Built for India’s independent businesses.</span><div className="flex gap-4"><button onClick={onLogin} className="hover:text-[#18201d]">Log in</button><button onClick={onStart} className="hover:text-[#18201d]">Get started</button></div></div></footer>
    </main>
  );
}
