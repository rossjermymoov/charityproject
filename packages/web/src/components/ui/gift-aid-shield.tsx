interface GiftAidShieldProps {
  type: "S" | "R";
  size?: "sm" | "md";
}

export function GiftAidShield({ type, size = "sm" }: GiftAidShieldProps) {
  const isRetail = type === "R";
  const bg = isRetail ? "#9333ea" : "#db2777"; // purple-600 / pink-600
  const title = isRetail ? "Retail Gift Aid" : "Standard Gift Aid";

  const dims = size === "sm" ? { w: 20, h: 24, fs: 11 } : { w: 24, h: 28, fs: 13 };

  return (
    <span title={title} className="inline-flex items-center">
      <svg width={dims.w} height={dims.h} viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 0C10 0 0 2 0 4V12C0 18 10 24 10 24C10 24 20 18 20 12V4C20 2 10 0 10 0Z"
          fill={bg}
        />
        <text
          x="10"
          y="14.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontWeight="bold"
          fontSize={dims.fs}
          fontFamily="system-ui, sans-serif"
        >
          {type}
        </text>
      </svg>
    </span>
  );
}
