"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEscape } from "@/components/use-escape";

type Coin = { x: number; y: number; vy: number; r: number; spin: number; spinV: number; pop: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; gold: boolean };
type Floater = { x: number; y: number; life: number };
type Star = { x: number; y: number; s: number; p: number };
type Phase = "ready" | "play" | "dead";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

export function CoinRain() {
  const t = useTranslations("game");
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<() => void>(() => {});

  closeRef.current = () => {
    setLeaving(true);
    window.setTimeout(() => setOpen(false), 320);
  };

  useEscape(open, () => closeRef.current());

  useEffect(() => {
    const openGame = () => {
      setLeaving(false);
      setPhase("ready");
      setScore(0);
      setOpen(true);
    };
    window.addEventListener("lessons:coins", openGame);
    return () => window.removeEventListener("lessons:coins", openGame);
  }, []);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let stopped = false;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = motion.matches;

    const world = {
      x: 0,
      target: 0,
      vx: 0,
      started: false,
      dead: false,
      score: 0,
      spawn: 0.35,
      width: 1,
      height: 1,
      ground: 1,
      shake: 0,
      flash: 0,
      dim: 0,
      coins: [] as Coin[],
      sparks: [] as Spark[],
      floaters: [] as Floater[],
      stars: [] as Star[],
      wizard: null as HTMLImageElement | null,
    };

    const keys = { left: false, right: false };
    let pointerX: number | null = null;

    function size() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      world.width = Math.max(1, rect.width);
      world.height = Math.max(1, rect.height);
      world.ground = rect.height * 0.86;
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (world.stars.length === 0) {
        for (let i = 0; i < 42; i += 1) {
          world.stars.push({
            x: Math.random(),
            y: Math.random() * 0.62,
            s: 0.6 + Math.random() * 1.8,
            p: Math.random() * Math.PI * 2,
          });
        }
      }
      if (!world.started) {
        world.x = rect.width * 0.5;
        world.target = world.x;
      }
    }

    function reset() {
      world.x = world.width * 0.5;
      world.target = world.x;
      world.vx = 0;
      world.started = false;
      world.dead = false;
      world.score = 0;
      world.spawn = 0.4;
      world.shake = 0;
      world.flash = 0;
      world.dim = 0;
      world.coins = [];
      world.sparks = [];
      world.floaters = [];
      setScore(0);
      setPhase("ready");
    }

    function burst(x: number, y: number, gold: boolean, count: number) {
      if (reduce) return;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * (gold ? 220 : 160);
        world.sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (gold ? 80 : 20),
          life: 0,
          max: 0.45 + Math.random() * 0.35,
          gold,
        });
      }
    }

    function spawn() {
      const reach = Math.min(world.width * 0.46, world.width * 0.18 + world.score * 18);
      const margin = 28;
      let x = world.x + (Math.random() * 2 - 1) * reach;
      x = Math.max(margin, Math.min(world.width - margin, x));
      const fall = Math.min(680, 230 + world.score * 18);
      world.coins.push({
        x,
        y: -22,
        vy: fall * (0.92 + Math.random() * 0.14),
        r: 16 + Math.random() * 6,
        spin: Math.random() * Math.PI,
        spinV: (Math.random() - 0.5) * 3.2,
        pop: 0,
      });
    }

    function tick(now: number, last: number) {
      if (stopped) return;
      const dt = Math.min(0.032, (now - last) / 1000);
      const spriteH = Math.min(190, world.height * 0.24);
      const sprite = world.wizard;
      const spriteW = sprite ? spriteH * (sprite.width / sprite.height) : spriteH * 1.5;

      if (keys.left || keys.right) {
        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        world.target = world.x + dir * 760 * dt;
      } else if (pointerX !== null) {
        world.target = pointerX;
      }
      const edge = spriteW * 0.34;
      world.target = Math.max(edge, Math.min(world.width - edge, world.target));
      const previous = world.x;
      world.x += (world.target - world.x) * Math.min(1, dt * 16);
      world.vx = (world.x - previous) / Math.max(dt, 0.001);

      if (world.started && !world.dead) {
        world.spawn -= dt;
        const alive = world.coins.filter((coin) => coin.pop === 0).length;
        const cap = world.score < 3 ? 1 : world.score < 8 ? 2 : 3;
        if (world.spawn <= 0 && alive < cap) {
          spawn();
          world.spawn = Math.max(0.38, 1.12 * Math.pow(0.955, world.score));
        }
      }

      const facing = world.vx < -40 ? -1 : 1;
      const spriteLeft = world.x - spriteW / 2;
      const spriteTop = world.ground - spriteH + 8;
      const face = facing < 0 ? 1 - 0.53 : 0.53;
      const catchX = spriteLeft + spriteW * face;
      const catchY = spriteTop + spriteH * 0.52;
      const rx = spriteW * 0.3;
      const ry = spriteH * 0.36;

      if (world.started && !world.dead) {
        for (const coin of world.coins) {
          if (coin.pop > 0) {
            coin.pop += dt;
            coin.y -= 70 * dt;
            coin.spin += coin.spinV * dt;
            continue;
          }
          coin.y += coin.vy * dt;
          coin.spin += coin.spinV * dt;
          coin.x += Math.sin(now / 280 + coin.spin) * 10 * dt;
          const dx = (coin.x - catchX) / rx;
          const dy = (coin.y - catchY) / ry;
          if (dx * dx + dy * dy <= 1) {
            coin.pop = 0.001;
            world.score += 1;
            world.flash = 0.55;
            setScore(world.score);
            world.floaters.push({ x: coin.x, y: coin.y, life: 0 });
            burst(coin.x, coin.y, true, 14);
            continue;
          }
          if (coin.y + coin.r >= world.ground) {
            world.dead = true;
            world.shake = reduce ? 0 : 10;
            world.dim = 1;
            coin.y = world.ground - coin.r * 0.35;
            burst(coin.x, world.ground, false, 18);
            setPhase("dead");
            break;
          }
        }
        world.coins = world.coins.filter((coin) => coin.pop < 0.34);
      }

      for (const spark of world.sparks) {
        spark.life += dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vy += 520 * dt;
      }
      world.sparks = world.sparks.filter((spark) => spark.life < spark.max);
      for (const floater of world.floaters) floater.life += dt;
      world.floaters = world.floaters.filter((floater) => floater.life < 0.7);
      world.shake *= Math.exp(-dt * 7);
      world.flash = Math.max(0, world.flash - dt * 1.8);
      if (world.dead) world.dim = Math.min(1, world.dim + dt * 1.4);

      const shakeX = world.shake ? (Math.random() - 0.5) * world.shake : 0;
      const shakeY = world.shake ? (Math.random() - 0.5) * world.shake : 0;
      ctx!.clearRect(0, 0, world.width, world.height);
      ctx!.save();
      ctx!.translate(shakeX, shakeY);
      paint(now, sprite, spriteW, spriteH, spriteLeft, spriteTop, facing, catchX, catchY);
      ctx!.restore();

      frame = window.requestAnimationFrame((next) => tick(next, now));
    }

    function paint(
      now: number,
      sprite: HTMLImageElement | null,
      spriteW: number,
      spriteH: number,
      spriteLeft: number,
      spriteTop: number,
      facing: number,
      catchX: number,
      catchY: number,
    ) {
      const sky = ctx!.createLinearGradient(0, 0, 0, world.height);
      sky.addColorStop(0, "#141a2b");
      sky.addColorStop(0.42, "#3c4d73");
      sky.addColorStop(0.72, "#e7b98a");
      sky.addColorStop(1, "#f4e2c4");
      ctx!.fillStyle = sky;
      ctx!.fillRect(0, 0, world.width, world.height);

      const glow = ctx!.createRadialGradient(world.width * 0.78, world.height * 0.16, 10, world.width * 0.78, world.height * 0.16, world.width * 0.28);
      glow.addColorStop(0, "rgba(255, 236, 196, 0.95)");
      glow.addColorStop(0.2, "rgba(255, 214, 140, 0.35)");
      glow.addColorStop(1, "transparent");
      ctx!.fillStyle = glow;
      ctx!.beginPath();
      ctx!.arc(world.width * 0.78, world.height * 0.16, world.width * 0.28, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "#fff6dd";
      ctx!.beginPath();
      ctx!.arc(world.width * 0.78, world.height * 0.16, Math.min(36, world.width * 0.035), 0, Math.PI * 2);
      ctx!.fill();

      for (const star of world.stars) {
        const twinkle = reduce ? 0.7 : 0.35 + Math.sin(now / 500 + star.p) * 0.35;
        ctx!.fillStyle = `rgba(255, 244, 220, ${twinkle})`;
        ctx!.beginPath();
        ctx!.arc(star.x * world.width, star.y * world.ground, star.s, 0, Math.PI * 2);
        ctx!.fill();
      }

      const ground = ctx!.createLinearGradient(0, world.ground, 0, world.height);
      ground.addColorStop(0, "#6a4a32");
      ground.addColorStop(0.18, "#3a2a20");
      ground.addColorStop(1, "#241910");
      ctx!.fillStyle = ground;
      ctx!.fillRect(0, world.ground, world.width, world.height - world.ground);
      ctx!.fillStyle = "rgba(243, 213, 160, 0.85)";
      ctx!.fillRect(0, world.ground, world.width, 3);

      for (const coin of world.coins) {
        const height = 1 - Math.min(1, Math.max(0, coin.y / world.ground));
        ctx!.fillStyle = `rgba(40, 24, 10, ${0.18 + height * 0.2})`;
        ctx!.beginPath();
        ctx!.ellipse(coin.x, world.ground + 2, coin.r * (0.7 + height * 0.5), coin.r * 0.28, 0, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.save();
      ctx!.translate(world.x, world.ground + 4);
      ctx!.scale(1, 0.28);
      ctx!.fillStyle = "rgba(30, 18, 10, 0.28)";
      ctx!.beginPath();
      ctx!.ellipse(0, 0, spriteW * 0.34, spriteH * 0.34, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();

      if (sprite) {
        const bob = world.started || reduce ? 0 : Math.sin(now / 380) * 6;
        ctx!.save();
        ctx!.translate(world.x, spriteTop + spriteH / 2 + bob);
        ctx!.scale(facing, 1);
        const lean = Math.max(-0.08, Math.min(0.08, world.vx / 4000));
        ctx!.rotate(facing * lean);
        ctx!.drawImage(sprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
        ctx!.restore();
      }

      if (world.flash > 0 && !reduce) {
        ctx!.strokeStyle = `rgba(255, 226, 150, ${world.flash})`;
        ctx!.lineWidth = 3;
        ctx!.beginPath();
        ctx!.ellipse(catchX, catchY, spriteW * 0.3, spriteH * 0.36, 0, 0, Math.PI * 2);
        ctx!.stroke();
      }

      for (const coin of world.coins) {
        const scale = coin.pop > 0 ? 1 + coin.pop * 1.4 : 1;
        const alpha = coin.pop > 0 ? Math.max(0, 1 - coin.pop / 0.34) : 1;
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.translate(coin.x, coin.y);
        ctx!.rotate(coin.spin);
        ctx!.scale(scale, scale * 0.92);
        const disc = ctx!.createRadialGradient(-coin.r * 0.3, -coin.r * 0.35, coin.r * 0.1, 0, 0, coin.r);
        disc.addColorStop(0, "#fff6d2");
        disc.addColorStop(0.45, "#f0c14a");
        disc.addColorStop(1, "#c4842a");
        ctx!.fillStyle = disc;
        ctx!.beginPath();
        ctx!.arc(0, 0, coin.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.strokeStyle = "rgba(120, 72, 16, 0.55)";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.strokeStyle = "rgba(255, 246, 210, 0.8)";
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.arc(0, 0, coin.r * 0.62, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.fillStyle = "#fff8df";
        ctx!.beginPath();
        ctx!.moveTo(0, -coin.r * 0.28);
        ctx!.lineTo(coin.r * 0.1, -coin.r * 0.05);
        ctx!.lineTo(0, coin.r * 0.32);
        ctx!.lineTo(-coin.r * 0.1, -coin.r * 0.05);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();
      }

      for (const spark of world.sparks) {
        const left = 1 - spark.life / spark.max;
        ctx!.fillStyle = spark.gold ? `rgba(255, 214, 120, ${left})` : `rgba(90, 62, 40, ${left})`;
        ctx!.beginPath();
        ctx!.arc(spark.x, spark.y, spark.gold ? 3.2 : 2.4, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.fillStyle = "rgba(255, 248, 230, 0.95)";
      ctx!.font = "700 18px var(--font-display), Georgia, serif";
      ctx!.textAlign = "center";
      for (const floater of world.floaters) {
        ctx!.globalAlpha = 1 - floater.life / 0.7;
        ctx!.fillText("+1", floater.x, floater.y - floater.life * 36);
        ctx!.globalAlpha = 1;
      }

      if (world.dim > 0) {
        ctx!.fillStyle = `rgba(16, 12, 10, ${world.dim * 0.38})`;
        ctx!.fillRect(0, 0, world.width, world.height);
      }
    }

    function begin() {
      if (stopped) return;
      if (world.dead) {
        reset();
        return;
      }
      if (!world.started) {
        world.started = true;
        setPhase("play");
      }
    }

    function onPointerDown(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      begin();
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        if (event.key === "ArrowLeft") keys.left = true;
        if (event.key === "ArrowRight") keys.right = true;
        begin();
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        begin();
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") keys.left = false;
      if (event.key === "ArrowRight") keys.right = false;
    }

    size();
    reset();
    const onResize = () => size();
    const onMotion = () => {
      reduce = motion.matches;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    motion.addEventListener("change", onMotion);

    loadImage("/game/wizard-0.png")
      .then((wizard) => {
        if (!stopped) world.wizard = wizard;
      })
      .catch(() => {});

    frame = window.requestAnimationFrame((now) => tick(now, now));

    return () => {
      stopped = true;
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      motion.removeEventListener("change", onMotion);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`coin-stage${leaving ? " is-leaving" : ""}`}>
      <canvas ref={canvasRef} className="broom-canvas" />
      {phase !== "ready" ? <p className="broom-score">{score}</p> : null}
      {phase !== "play" ? <p className="coin-hint">{phase === "dead" ? t("missed") : t("catch")}</p> : null}
      {phase === "dead" ? <p className="coin-again">{t("again")}</p> : null}
      <button
        type="button"
        className="broom-close"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          closeRef.current();
        }}
      >
        {t("leave")}
      </button>
    </div>
  );
}
