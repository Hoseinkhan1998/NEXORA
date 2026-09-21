export type TourRole = "owner" | "admin" | "member" | "viewer";

export interface TourStep {
  id: string;
  element?: string; // CSS selector of the target element. If omitted, displayed centered
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  badge?: string;
  icon?: string;
}

export type RoleTourConfig = Record<TourRole, TourStep[]>;

export interface TourContextValue {
  isTourActive: boolean;
  isMobileModalOpen: boolean;
  currentRole: TourRole;
  startTour: (force?: boolean) => void;
  closeTour: () => void;
  closeMobileModal: () => void;
}
