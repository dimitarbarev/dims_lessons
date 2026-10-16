"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEscape } from "@/components/use-escape";

const GRAVITY = 1450;
const FLAP = -520;
type Gate = { x: number; top: number; gap: number; kind: number; scored: boolean };
type Phase = "ready" | "play" | "dead";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

export function BroomFlight() {
  const t = useTranslations("game");
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flapRef = useRef<() => void>(() => {});
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
    window.addEventListener("lessons:broom", openGame);
    return () => window.removeEventListener("lessons:broom", openGame);
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
    const ignoreUntil = performance.now() + 520;

    const world = {
      y: 0,
      vy: 0,
      started: false,
      dead: false,
      score: 0,
      gates: [] as Gate[],
      width: 1,
      height: 1,
      ground: 1,
      wizards: [] as HTMLImageElement[],
      hill: null as HTMLImageElement | null,
      pieces: {} as Record<string, HTMLImageElement>,
    };

    function size() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      world.width = rect.width;
      world.height = rect.height;
      world.ground = rect.height * 0.74;
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!world.started) world.y = rect.height * 0.36;
    }

    function reset() {
      world.y = world.height * 0.36;
      world.vy = 0;
      world.started = false;
      world.dead = false;
      world.score = 0;
      world.gates = [];
      setScore(0);
      setPhase("ready");
      spawn(world.width * 0.95);
    }

    function spawn(x: number) {
      const gap = Math.max(176, world.height * 0.27);
      const margin = world.height * 0.1;
      const topMax = Math.max(margin, world.ground - gap - margin);
      const top = margin + Math.random() * Math.max(8, topMax - margin);
      world.gates.push({ x, top, gap, kind: Math.random() < 0.5 ? 0 : 1, scored: false });
    }

    function flap() {
      if (performance.now() < ignoreUntil || stopped) return;
      if (world.dead) {
        reset();
        return;
      }
      world.started = true;
      world.vy = FLAP;
      setPhase("play");
    }

    flapRef.current = flap;

    function onKey(event: KeyboardEvent) {
      if (event.key === " " || event.key === "ArrowUp") {
        event.preventDefault();
        flap();
      }
    }

    function hit(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function drawCover(image: HTMLImageElement) {
      const ir = image.width / image.height;
      const cr = world.width / world.height;
      let dw: number;
      let dh: number;
      let ox: number;
      let oy: number;
      if (ir > cr) {
        dh = world.height;
        dw = world.height * ir;
        ox = (world.width - dw) / 2;
        oy = 0;
      } else {
        dw = world.width;
        dh = world.width / ir;
        ox = 0;
        oy = (world.height - dh) / 2;
      }
      ctx!.drawImage(image, ox, oy, dw, dh);
    }

    function drawPiece(image: HTMLImageElement, x: number, y: number, height: number) {
      const width = height * (image.width / image.height);
      ctx!.drawImage(image, x, y, width, height);
      return width;
    }

    function tick(now: number, last: number) {
      if (stopped) return;
      const dt = Math.min(0.032, (now - last) / 1000);
      const speed = world.width * 0.32 * (1 + Math.min(world.score, 20) * 0.02);
      if (world.started && !world.dead) {
        world.vy += GRAVITY * dt;
        world.y += world.vy * dt;
        for (const gate of world.gates) gate.x -= speed * dt;
        const lastGate = world.gates[world.gates.length - 1];
        if (!lastGate || lastGate.x < world.width * 0.48) spawn(world.width + 40);
        world.gates = world.gates.filter((gate) => gate.x > -world.height);
      }

      const wizard = world.wizards[0];
      const birdW = world.height * 0.2;
      const birdH = wizard ? birdW * (wizard.height / wizard.width) : birdW * 0.6;
      const birdX = world.width * 0.24;
      let birdY = world.y;
      if (!world.started) birdY = world.height * 0.36 + Math.sin(now / 280) * 8;
      world.y = world.started ? world.y : birdY;

      const body = {
        x: birdX + birdW * 0.36,
        y: birdY - birdH * 0.28,
        w: birdW * 0.26,
        h: birdH * 0.46,
      };

      if (world.started && !world.dead) {
        const crashed = body.y < 0 || body.y + body.h > world.ground;
        const span = world.height * 0.1;
        for (const gate of world.gates) {
          const topBox = { x: gate.x, y: 0, w: span, h: gate.top };
          const bottomBox = { x: gate.x, y: gate.top + gate.gap, w: span, h: world.height };
          if (hit(body, topBox) || hit(body, bottomBox)) {
            world.dead = true;
            setPhase("dead");
          }
          if (!gate.scored && gate.x + span < body.x) {
            gate.scored = true;
            world.score += 1;
            setScore(world.score);
          }
        }
        if (crashed) {
          world.dead = true;
          setPhase("dead");
        }
      }

      ctx!.clearRect(0, 0, world.width, world.height);
      if (world.hill) drawCover(world.hill);
      else {
        ctx!.fillStyle = "#d5e6c4";
        ctx!.fillRect(0, 0, world.width, world.height);
      }

      for (const gate of world.gates) {
        const span = world.height * 0.1;
        const topImage = world.pieces[gate.kind === 0 ? "roots" : "point"];
        const bottomImage = world.pieces[gate.kind === 0 ? "trunk" : "crystal"];
        const pieceH = world.height * 0.72;
        if (topImage) {
          const pieceW = pieceH * (topImage.width / topImage.height);
          drawPiece(topImage, gate.x + span / 2 - pieceW / 2, gate.top - pieceH, pieceH);
        }
        if (bottomImage) {
          const pieceW = pieceH * (bottomImage.width / bottomImage.height);
          drawPiece(bottomImage, gate.x + span / 2 - pieceW / 2, gate.top + gate.gap, pieceH);
        }
      }

      const pose =
        world.vy < -280 ? 2 : world.vy < -40 ? 1 : world.vy > 220 ? 3 : 0;
      const sprite = world.wizards[pose] ?? wizard;
      if (sprite) {
        ctx!.save();
        ctx!.translate(birdX + birdW / 2, birdY);
        const tilt = Math.max(-0.22, Math.min(0.38, world.vy / 1400));
        ctx!.rotate(world.started ? tilt : 0);
        ctx!.drawImage(sprite, -birdW / 2, -birdH / 2, birdW, birdH);
        ctx!.restore();
      }

      frame = window.requestAnimationFrame((next) => tick(next, now));
    }

    size();
    reset();
    const onResize = () => size();
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);

    Promise.all([
      loadImage("/game/hill.jpg"),
      loadImage("/game/wizard-0.png"),
      loadImage("/game/wizard-1.png"),
      loadImage("/game/wizard-2.png"),
      loadImage("/game/wizard-3.png"),
      loadImage("/game/trunk.png"),
      loadImage("/game/roots.png"),
      loadImage("/game/crystal.png"),
      loadImage("/game/point.png"),
    ]).then(([hill, w0, w1, w2, w3, trunk, roots, crystal, point]) => {
      if (stopped) return;
      world.hill = hill;
      world.wizards = [w0, w1, w2, w3];
      world.pieces = { trunk, roots, crystal, point };
    }).catch(() => {});

    frame = window.requestAnimationFrame((now) => tick(now, now));

    return () => {
      stopped = true;
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`broom-stage${leaving ? " is-leaving" : ""}`} onPointerDown={() => flapRef.current()}>
      <canvas ref={canvasRef} className="broom-canvas" />
      {phase !== "ready" ? <p className="broom-score">{score}</p> : null}
      {phase !== "play" ? <p className="broom-hint">{phase === "dead" ? t("again") : t("fly")}</p> : null}
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
