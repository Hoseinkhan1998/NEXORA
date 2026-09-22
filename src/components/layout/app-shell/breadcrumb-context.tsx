"use client";

import * as React from "react";

interface BreadcrumbContextValue {
  customLabels: Record<string, string>;
  setCustomLabel: (segment: string, label: string) => void;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue>({
  customLabels: {},
  setCustomLabel: () => {},
});

export function BreadcrumbProvider({
  children,
  initialLabels,
}: {
  children: React.ReactNode;
  initialLabels?: Record<string, string>;
}) {
  const [customLabels, setCustomLabels] = React.useState<Record<string, string>>({});

  const setCustomLabel = React.useCallback((segment: string, label: string) => {
    setCustomLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  const mergedLabels = React.useMemo(() => {
    return { ...(initialLabels || {}), ...customLabels };
  }, [initialLabels, customLabels]);

  return (
    <BreadcrumbContext.Provider value={{ customLabels: mergedLabels, setCustomLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  return React.useContext(BreadcrumbContext);
}

/**
 * Convenience helper component to set a dynamic breadcrumb label from server or client pages
 */
export function DynamicBreadcrumbSetter({
  segment,
  label,
}: {
  segment: string;
  label: string;
}) {
  const { setCustomLabel } = useBreadcrumbs();

  React.useEffect(() => {
    if (segment && label) {
      setCustomLabel(segment, label);
    }
  }, [segment, label, setCustomLabel]);

  return null;
}
