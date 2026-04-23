"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Scroll-linked transforms. Depth effect comes from each layer moving at a
  // different rate. Background barely moves, figures drift, props drift more.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.16]);

  const leftFigureY = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const leftFigureX = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const leftFigureRot = useTransform(scrollYProgress, [0, 1], [0, -6]);

  const rightFigureY = useTransform(scrollYProgress, [0, 1], ["0%", "-24%"]);
  const rightFigureX = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const rightFigureRot = useTransform(scrollYProgress, [0, 1], [0, 4]);

  const skateY = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);
  const skateRot = useTransform(scrollYProgress, [0, 1], [-8, -24]);

  const coffeeY = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);
  const coffeeRot = useTransform(scrollYProgress, [0, 1], [6, 18]);

  const titleScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.82]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5, 0.9], [1, 0.9, 0]);

  // Mouse-linked transforms. Spring-smoothed so it's not twitchy.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.5 });

  const bgMouseX = useTransform(sx, (v) => v * -8);
  const bgMouseY = useTransform(sy, (v) => v * -8);
  const leftMouseX = useTransform(sx, (v) => v * -28);
  const leftMouseY = useTransform(sy, (v) => v * -20);
  const rightMouseX = useTransform(sx, (v) => v * 32);
  const rightMouseY = useTransform(sy, (v) => v * -22);
  const skateMouseX = useTransform(sx, (v) => v * 40);
  const coffeeMouseX = useTransform(sx, (v) => v * -50);
  const coffeeMouseY = useTransform(sy, (v) => v * -40);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#0a0a0a]"
    >
      {/* BG PLATE */}
      <motion.div
        style={{ y: bgY, scale: bgScale, x: bgMouseX, translateY: bgMouseY }}
        className="absolute inset-0 -z-10"
      >
        <Image
          src="/landing/bg-plate.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* vignette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 55%, transparent 35%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {/* breathing atmospheric overlay */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(252,211,77,0.35) 0%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* LEFT FIGURE — pepe */}
      <motion.div
        style={{
          y: leftFigureY,
          x: leftFigureX,
          rotate: leftFigureRot,
          translateX: leftMouseX,
          translateY: leftMouseY,
        }}
        className="absolute left-[-6%] top-[6%] h-[92%] w-[46%] sm:left-[-2%] sm:w-[38%] lg:left-[2%] lg:w-[34%]"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-full w-full"
        >
          <Image
            src="/landing/figure-pepe.png"
            alt="Renaissance figure holding a Pepe plush"
            fill
            priority
            sizes="(max-width: 640px) 46vw, 38vw"
            className="object-contain object-bottom"
          />
        </motion.div>
      </motion.div>

      {/* RIGHT FIGURE — wif, horizontally flipped so it reaches left toward the other */}
      <motion.div
        style={{
          y: rightFigureY,
          x: rightFigureX,
          rotate: rightFigureRot,
          translateX: rightMouseX,
          translateY: rightMouseY,
        }}
        className="absolute right-[-6%] top-[8%] h-[90%] w-[46%] sm:right-[-2%] sm:w-[38%] lg:right-[2%] lg:w-[34%]"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="relative h-full w-full"
        >
          <Image
            src="/landing/figure-wif.png"
            alt="Renaissance figure holding a dogwifhat plush"
            fill
            priority
            sizes="(max-width: 640px) 46vw, 38vw"
            className="object-contain object-bottom [transform:scaleX(-1)]"
          />
        </motion.div>
      </motion.div>

      {/* SKATEBOARD — bottom center, white bg knocked out via mix-blend-multiply */}
      <motion.div
        style={{ y: skateY, rotate: skateRot, translateX: skateMouseX }}
        className="pointer-events-none absolute bottom-[4%] left-1/2 z-10 w-[42vw] max-w-[420px] -translate-x-1/2 mix-blend-multiply sm:w-[28vw]"
      >
        <motion.div
          animate={{ rotate: [-8, -5, -8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative aspect-[2/1]"
        >
          <Image
            src="/landing/prop-skateboard.png"
            alt=""
            fill
            sizes="42vw"
            className="object-contain"
          />
        </motion.div>
      </motion.div>

      {/* COFFEE — orange bg knocked out via mix-blend-multiply */}
      <motion.div
        style={{
          y: coffeeY,
          rotate: coffeeRot,
          translateX: coffeeMouseX,
          translateY: coffeeMouseY,
        }}
        className="pointer-events-none absolute right-[8%] top-[6%] z-10 hidden w-[11vw] max-w-[130px] mix-blend-multiply sm:block"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative aspect-[2/3]"
        >
          <Image
            src="/landing/prop-coffee.png"
            alt=""
            fill
            sizes="14vw"
            className="object-contain"
          />
        </motion.div>
      </motion.div>

      {/* TITLE BLOCK — centered, shrinks on scroll */}
      <motion.div
        style={{ scale: titleScale, opacity: titleOpacity }}
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6"
      >
        <div className="pointer-events-auto relative w-full max-w-[420px] border border-white/50 bg-black/10 p-8 text-white backdrop-blur-[2px] sm:max-w-[460px] sm:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">
            recon · v0.1
          </p>
          <h1 className="mt-3 font-sans text-[36px] font-semibold leading-[1.02] tracking-tight sm:text-[46px]">
            The Ren<span className="italic text-[var(--accent)]">ai</span>ssance
            <br />
            of on-chain calls.
          </h1>
          <p className="mt-5 max-w-[32ch] font-sans text-[13px] leading-[1.6] text-white/80 sm:text-[14px]">
            Two AIs argue over every Solana token we surface. A third breaks
            the tie. Wins, losses, and splits all file to the same public feed.
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/feed"
              className="group flex items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-black transition-colors hover:bg-[var(--accent)]/90"
            >
              enter terminal
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="#how"
              className="flex items-center justify-center gap-2 border border-white/40 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/90 transition-colors hover:border-white hover:text-white"
            >
              scroll the story ↓
            </Link>
          </div>
          {/* faux edition markers, roman numerals running down the right edge */}
          <div className="pointer-events-none absolute right-3 top-8 hidden flex-col gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/45 sm:flex">
            {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"].map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* scroll hint */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">
        scroll ↓
      </div>
    </section>
  );
}
