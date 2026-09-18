"use client";

import { useState, useEffect, useCallback } from "react";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierActive = e.metaKey || e.ctrlKey;
      if (!isModifierActive) return;

      // Cmd+K or Ctrl+K -> Toggle Command Palette
      // Supports physical key (e.code === 'KeyK'), English ('k'), and Persian layout ('ن')
      const isKeyK = e.code === "KeyK" || e.key.toLowerCase() === "k" || e.key === "ن";

      if (isKeyK) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Cmd+J or Ctrl+J -> Toggle AI Copilot
      // Supports physical key (e.code === 'KeyJ'), English ('j'), and Persian layout ('ت')
      const isKeyJ = e.code === "KeyJ" || e.key.toLowerCase() === "j" || e.key === "ت";

      if (isKeyJ) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("nexora:open-copilot"));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    open,
    setOpen,
    isOpen: open,
    setIsOpen: setOpen,
    toggle,
  };
}
