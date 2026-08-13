import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'motion/react';

// ============================================================================
// SPOTLIGHT EFFECT
// ============================================================================
export function Spotlight({ className = "", color = "rgba(120, 119, 198, 0.15)" }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;

    div.addEventListener("mousemove", handleMouseMove);
    div.addEventListener("mouseenter", handleMouseEnter);
    div.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      div.removeEventListener("mousemove", handleMouseMove);
      div.removeEventListener("mouseenter", handleMouseEnter);
      div.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={divRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${color}, transparent 80%)`,
        }}
      />
    </div>
  );
}

// ============================================================================
// MOVING BORDERS (Aceternity UI style)
// ============================================================================
export function MovingBorder({
  children,
  duration = 3000,
  rx = "16px",
  className = "",
  containerClassName = "",
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  className?: string;
  containerClassName?: string;
}) {
  const pathRef = useRef<any>(null);
  const progress = useAnimation();

  useEffect(() => {
    progress.start({
      pathLength: [0, 1],
      transition: {
        duration: duration / 1000,
        ease: "linear",
        repeat: Infinity,
      },
    });
  }, [duration, progress]);

  return (
    <div className={`relative p-[1px] overflow-hidden ${containerClassName}`}>
      <div className="absolute inset-0">
        <svg
          className="absolute h-full w-full"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            fill="none"
            width="100%"
            height="100%"
            rx={rx}
            id="rect"
          />
          <motion.rect
            fill="none"
            width="100%"
            height="100%"
            rx={rx}
            stroke="url(#gradient)"
            strokeWidth="2"
            animate={{
              strokeDasharray: ["0 1", "1 0"],
            }}
            transition={{
              duration: duration / 1000,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className={`relative bg-slate-900/90 text-white rounded-[15px] z-10 ${className}`}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// GRID & DOT BACKGROUNDS
// ============================================================================
export function GridBackground({ className = "", opacity = 0.05 }) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(148, 163, 184, ${opacity}) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148, 163, 184, ${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
      }}
    />
  );
}

export function DotBackground({ className = "", opacity = 0.15 }) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(rgba(148, 163, 184, ${opacity}) 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)'
      }}
    />
  );
}

// ============================================================================
// AURORA BACKGROUND
// ============================================================================
export function AuroraBackground({ className = "" }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none opacity-40 mix-blend-screen filter blur-[80px] ${className}`}>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[30%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-emerald-500/20 animate-pulse" style={{ animationDuration: '10s' }} />
    </div>
  );
}

// ============================================================================
// SPARKLING PARTICLES
// ============================================================================
export function SparkleParticles({ count = 20, className = "" }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 5 + 3,
      delay: Math.random() * 2,
    }));
    setParticles(generated);
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// INFINITE MARQUEE / SCROLL
// ============================================================================
export function InfiniteMarquee({
  items,
  speed = "fast",
  direction = "left",
  pauseOnHover = true,
  className = "",
}: {
  items: React.ReactNode[];
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = (item as HTMLElement).cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });
      setStart(true);
    }
  }, []);

  const getSpeed = () => {
    if (speed === "fast") return "20s";
    if (speed === "normal") return "40s";
    return "80s";
  };

  return (
    <div
      ref={containerRef}
      className={`scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] ${className}`}
    >
      <div
        ref={scrollerRef}
        className={`flex min-w-full shrink-0 gap-6 py-4 flex-nowrap ${
          start ? "animate-scroll" : ""
        } ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
        style={{
          animationName: direction === "left" ? "scrollLeft" : "scrollRight",
          animationDuration: getSpeed(),
          animationTimingFunction: "linear",
          animationIterationCount: "infinity",
        }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="shrink-0">
            {item}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-50% - 12px)); }
        }
        @keyframes scrollRight {
          from { transform: translateX(calc(-50% - 12px)); }
          to { transform: translateX(0); }
        }
        .animate-scroll {
          display: flex;
          width: max-content;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// TEXT REVEAL ANIMATION (Word by word)
// ============================================================================
export function TextReveal({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  // Fallback: `useInView` never fires inside the builder's transformed/scaled
  // canvas, which used to leave the animated hero title stuck at opacity:0
  // (reads as "frozen/blank"). Force-reveal shortly after mount so the text is
  // always visible, while still animating normally when scrolled into view.
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: "easeInOut" as any } },
  };

  return (
    <motion.span
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView || forceVisible ? "visible" : "hidden"}
      className={`inline-block ${className}`}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          variants={childVariants}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ============================================================================
// NUMBER COUNTER
// ============================================================================
export function NumberCounter({ value, duration = 2000, suffix = "", className = "" }: { value: number; duration?: number; suffix?: string; className?: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const isInView = useInView(elementRef, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration, isInView]);

  return (
    <span ref={elementRef} className={className}>
      {count}
      {suffix}
    </span>
  );
}

// ============================================================================
// MOUSE FOLLOWING GLOW CARD
// ============================================================================
export function MouseGlowCard({ children, className = "", glowColor = "rgba(59, 130, 246, 0.15)", style }: { children: React.ReactNode; className?: string; glowColor?: string; style?: React.CSSProperties; key?: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      style={style}
    >
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

// ============================================================================
// MAGNETIC BUTTON / CONTAINER EFFECT
// ============================================================================
export function Magnetic({ children }: { children: React.ReactElement }) {
  const ref = useRef<any>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Pull within a radius
    if (Math.abs(distanceX) < 100 && Math.abs(distanceY) < 100) {
      setPosition({ x: distanceX * 0.35, y: distanceY * 0.35 });
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    window.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (el) el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// ANIMATED BEAMS CONNECTORS
// ============================================================================
export function AnimatedBeams({ className = "" }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 50 Q 250 150 500 50 T 1000 50" fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" />
        <motion.path
          d="M 0 50 Q 250 150 500 50 T 1000 50"
          fill="none"
          stroke="url(#beamGradient)"
          strokeWidth="2"
          initial={{ strokeDasharray: "100 900", strokeDashoffset: 1000 }}
          animate={{ strokeDashoffset: [1000, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <defs>
          <linearGradient id="beamGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
