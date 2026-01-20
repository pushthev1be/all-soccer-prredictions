import Image from "next/image";
import { getUserAvatar, getUserInitials } from "@/lib/avatar";

interface UserAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showInitialsFallback?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function UserAvatar({
  user,
  size = "md",
  className = "",
  showInitialsFallback = false,
}: UserAvatarProps) {
  const avatarUrl = getUserAvatar(user);
  const initials = getUserInitials(user);

  if (showInitialsFallback) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-full overflow-hidden shadow-md border-2 border-gray-200`}>
      <Image
        src={avatarUrl}
        alt={user.name || user.email || "User avatar"}
        fill
        className="object-cover"
        unoptimized // DiceBear SVGs don't need optimization
      />
    </div>
  );
}
