import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  firstName: string;
  lastName: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ firstName, lastName, imageUrl, size = "md", className }: AvatarProps) {
  const sizes: Record<string, string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${firstName} ${lastName}`}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-indigo-100 text-indigo-700 font-medium flex items-center justify-center",
        sizes[size],
        className
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
