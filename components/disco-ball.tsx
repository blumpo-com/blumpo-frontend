import { cn } from "@/lib/utils";

const DISCO_BALL_BG = `
  radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85) 0%, transparent 45%),
  radial-gradient(circle at 68% 72%, rgba(0,0,0,0.2) 0%, transparent 45%),
  conic-gradient(
    from 0deg,
    #f5f5f5 0deg 12deg,
    #d8d8d8 12deg 24deg,
    #c0c0c0 24deg 36deg,
    #e0e0e0 36deg 48deg,
    #b8b8b8 48deg 60deg,
    #d0d0d0 60deg 72deg,
    #c8c8c8 72deg 84deg,
    #e8e8e8 84deg 96deg,
    #b0b0b0 96deg 108deg,
    #d8d8d8 108deg 120deg,
    #c0c0c0 120deg 132deg,
    #f0f0f0 132deg 144deg,
    #b8b8b8 144deg 156deg,
    #d0d0d0 156deg 168deg,
    #c8c8c8 168deg 180deg,
    #e0e0e0 180deg 192deg,
    #b0b0b0 192deg 204deg,
    #d8d8d8 204deg 216deg,
    #c0c0c0 216deg 228deg,
    #f5f5f5 228deg 240deg,
    #b8b8b8 240deg 252deg,
    #d0d0d0 252deg 264deg,
    #e8e8e8 264deg 276deg,
    #c8c8c8 276deg 288deg,
    #b0b0b0 288deg 300deg,
    #d8d8d8 300deg 312deg,
    #e0e0e0 312deg 324deg,
    #c0c0c0 324deg 336deg,
    #f0f0f0 336deg 348deg,
    #b8b8b8 348deg 360deg
  )
`;

const DISCO_BALL_SHADOW =
  "inset 1px 1px 4px rgba(255,255,255,0.6), inset -1px -1px 4px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2)";

export interface DiscoBallProps {
  className?: string;
  stringHeight?: number;
  ballSize?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

export function DiscoBall({
  className,
  stringHeight = 40,
  ballSize = "md",
}: DiscoBallProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center -translate-x-1/2 -translate-y-full",
        className
      )}
      aria-hidden
    >
      <div
        className="w-0.5 flex-shrink-0 bg-gray-500 rounded-full"
        style={{ height: stringHeight }}
      />
      <div
        className={cn(
          "-mt-0.5 rounded-full animate-spin-slow flex-shrink-0 overflow-hidden",
          sizeClasses[ballSize]
        )}
        style={{
          background: DISCO_BALL_BG,
          boxShadow: DISCO_BALL_SHADOW,
        }}
      />
    </div>
  );
}
