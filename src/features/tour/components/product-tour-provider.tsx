"use client";

import * as React from "react";
import type { TourContextValue, TourRole } from "../types";
import { createTourDriver } from "../lib/tour-driver";
import { hasCompletedTour } from "../lib/tour-storage";
import { MobileTourModal } from "./mobile-tour-modal";
import "../styles/tour.css";

const defaultTourContext: TourContextValue = {
  isTourActive: false,
  isMobileModalOpen: false,
  currentRole: "member",
  startTour: () => {},
  closeTour: () => {},
  closeMobileModal: () => {},
};

const TourContext = React.createContext<TourContextValue | null>(null);

export function useProductTour(): TourContextValue {
  const context = React.useContext(TourContext);
  return context || defaultTourContext;
}

interface ProductTourProviderProps {
  children: React.ReactNode;
  workspaceId?: string;
  userId?: string;
  role?: TourRole;
}

export function ProductTourProvider({
  children,
  workspaceId,
  userId,
  role = "member",
}: ProductTourProviderProps) {
  const [isTourActive, setIsTourActive] = React.useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = React.useState(false);
  const driverInstanceRef = React.useRef<ReturnType<typeof createTourDriver> | null>(null);

  const startTour = React.useCallback(
    (force = false) => {
      if (!workspaceId || !userId) return;

      if (!force && hasCompletedTour(workspaceId, userId, role)) {
        return;
      }

      // Check if on a mobile viewport (< 768px)
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

      if (isMobile) {
        setIsMobileModalOpen(true);
        return;
      }

      // Desktop: run driver.js spotlight tour
      try {
        if (driverInstanceRef.current) {
          driverInstanceRef.current.destroy();
        }

        const driver = createTourDriver({
          workspaceId,
          userId,
          role,
          onFinish: () => {
            setIsTourActive(false);
            driverInstanceRef.current = null;
          },
        });

        driverInstanceRef.current = driver;
        setIsTourActive(true);
        driver.drive();
      } catch (err) {
        console.warn("[ProductTourProvider] Failed to launch desktop tour:", err);
        setIsTourActive(false);
      }
    },
    [workspaceId, userId, role]
  );

  const closeTour = React.useCallback(() => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.destroy();
      driverInstanceRef.current = null;
    }
    setIsTourActive(false);
    setIsMobileModalOpen(false);
  }, []);

  // Automatic one-time tour trigger on first visit
  React.useEffect(() => {
    if (!workspaceId || !userId) return;

    const alreadyCompleted = hasCompletedTour(workspaceId, userId, role);
    if (!alreadyCompleted) {
      // Delay slightly (850ms) to ensure Next.js App Router DOM nodes and navigation elements are fully painted
      const timer = setTimeout(() => {
        startTour(false);
      }, 850);

      return () => clearTimeout(timer);
    }
  }, [workspaceId, userId, role, startTour]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (driverInstanceRef.current) {
        driverInstanceRef.current.destroy();
      }
    };
  }, []);

  const contextValue = React.useMemo<TourContextValue>(
    () => ({
      isTourActive,
      isMobileModalOpen,
      currentRole: role,
      startTour,
      closeTour,
      closeMobileModal: () => setIsMobileModalOpen(false),
    }),
    [isTourActive, isMobileModalOpen, role, startTour, closeTour]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}

      {/* Mobile-Friendly Modal Carousel fallback */}
      {workspaceId && userId && (
        <MobileTourModal
          open={isMobileModalOpen}
          onOpenChange={setIsMobileModalOpen}
          role={role}
          workspaceId={workspaceId}
          userId={userId}
        />
      )}
    </TourContext.Provider>
  );
}
