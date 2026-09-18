"use client";

import { useState, useEffect, useCallback } from "react";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K -> Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      // Cmd+J -> Toggle AI Copilot
      if ((e.metaKey || e.ctrlKey) && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("nexora:open-copilot"));
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
