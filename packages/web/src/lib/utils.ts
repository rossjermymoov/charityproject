import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    APPLICANT: "bg-blue-100 text-blue-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    ON_LEAVE: "bg-yellow-100 text-yellow-800",
    DEPARTED: "bg-red-100 text-red-800",
    OPEN: "bg-blue-100 text-blue-800",
    FILLED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    EXPIRED: "bg-red-100 text-red-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800",
    NO_SHOW: "bg-red-100 text-red-800",
    LOGGED: "bg-yellow-100 text-yellow-800",
    VERIFIED: "bg-green-100 text-green-800",
    DISPUTED: "bg-red-100 text-red-800",
    LOW: "bg-gray-100 text-gray-800",
    NORMAL: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getUrgencyIcon(urgency: string): string {
  const icons: Record<string, string> = {
    LOW: "info",
    NORMAL: "bell",
    HIGH: "alert-triangle",
    CRITICAL: "alert-octagon",
  };
  return icons[urgency] || "bell";
}
