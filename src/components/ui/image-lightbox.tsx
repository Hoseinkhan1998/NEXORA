"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "./button";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageAlt?: string;
  fileName?: string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  imageAlt = "Image preview",
  fileName,
}: ImageLightboxProps) {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    setScale(1);
    setRotation(0);

    // Capture phase listener for Escape to prevent Radix Dialog from closing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl || !mounted) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const lightboxContent = (
    <div
      data-lightbox="true"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] pointer-events-auto flex items-center justify-center bg-black/95 backdrop-blur-lg select-none w-screen h-screen overflow-hidden animate-in fade-in-0 duration-200"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Top action toolbar */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between z-20 px-2 text-white pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 max-w-[60%] truncate">
          <p className="text-xs sm:text-sm font-medium text-white/90 truncate">
            {fileName || imageAlt}
          </p>
        </div>

        <div
          className="flex items-center gap-1 sm:gap-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleRotate();
            }}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <a
            href={imageUrl}
            download={fileName || "image"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </a>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full ml-1 cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Image View */}
      <div
        className="relative flex items-center justify-center p-4 max-w-[95vw] max-h-[85vh] select-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: "transform 0.15s ease-out",
          }}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
