"use client";

import { useProjectActivity } from "../../hooks/use-project-activity";
import { ActivityItem } from "./activity-item";
import { ActivityEmpty } from "./activity-empty";
import type { ProjectActivityWithActor } from "../../types";

interface ActivityFeedProps {
  projectId: string;
  initialActivities: ProjectActivityWithActor[];
  className?: string;
}

export function ActivityFeed({ projectId, initialActivities, className }: ActivityFeedProps) {
  const { activities } = useProjectActivity({
    projectId,
    initialActivities,
  });

  if (activities.length === 0) {
    return <ActivityEmpty />;
  }

  return (
    <div className={`divide-y divide-border/40 ${className || ""}`}>
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
