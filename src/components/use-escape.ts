"use client";

import { useEffect, useRef } from "react";

type Layer = { depth: number; close: () => void };

const layers: Layer[] = [];

function onKey(event: KeyboardEvent) {
  if (event.key !== "Escape" || layers.length === 0) return;
  let top = layers[0];
  for (const layer of layers) {
    if (layer.depth >= top.depth) top = layer;
  }
  event.preventDefault();
  top.close();
}

export function useEscape(active: boolean, close: () => void, depth = 0) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!active) return;
    const layer = { depth, close: () => closeRef.current() };
    layers.push(layer);
    if (layers.length === 1) window.addEventListener("keydown", onKey);
    return () => {
      const index = layers.lastIndexOf(layer);
      if (index !== -1) layers.splice(index, 1);
      if (layers.length === 0) window.removeEventListener("keydown", onKey);
    };
  }, [active, depth]);
}
