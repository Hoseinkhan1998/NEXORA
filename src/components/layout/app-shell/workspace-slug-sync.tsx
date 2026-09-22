"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

interface WorkspaceSlugSyncProps {
  currentSlug: string;
  expectedSlug?: string;
}

export function WorkspaceSlugSync({
  currentSlug,
  expectedSlug,
}: WorkspaceSlugSyncProps) {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (
      expectedSlug &&
      expectedSlug !== currentSlug &&
      pathname &&
      pathname.includes(`/app/${currentSlug}`)
    ) {
      const newPath = pathname.replace(`/app/${currentSlug}`, `/app/${expectedSlug}`);
      router.replace(newPath);
    }
  }, [currentSlug, expectedSlug, pathname, router]);

  return null;
}
