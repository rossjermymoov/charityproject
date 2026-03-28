"use client";

import { Button } from "./button";

interface ConfirmButtonProps {
  message: string;
  children: React.ReactNode;
  variant?: "destructive" | "outline" | "default" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  title?: string;
}

export function ConfirmButton({ message, children, variant = "destructive", size, className, title }: ConfirmButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      title={title}
      onClick={(e) => {
        if (!confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
