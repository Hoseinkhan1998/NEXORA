"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logoutAction } from "../actions/logout";

export interface LogoutButtonProps extends Omit<ButtonProps, "onClick"> {
  showIcon?: boolean;
}

export function LogoutButton({
  children = "Sign out",
  showIcon = true,
  variant = "outline",
  size = "default",
  ...props
}: LogoutButtonProps) {
  const [isPending, startTransition] = React.useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <Button variant={variant} size={size} loading={isPending} onClick={handleLogout} {...props}>
      {showIcon && !isPending && <LogOut className="h-4 w-4" />}
      {children}
    </Button>
  );
}
