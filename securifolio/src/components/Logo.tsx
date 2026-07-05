import React from "react";

export function Logo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <mask id="shield-cutout">
          {/* Le fond blanc rend tout visible par défaut */}
          <rect width="100%" height="100%" fill="white" />
          
          {/* Le bouclier en noir découpe (rend invisible) cette partie */}
          {/* transform="matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)" */}
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            fill="black"
            transform="matrix(0.42, 0, 0, 0.42, 6.96, 7.5)"
          />
        </mask>
      </defs>

      <g mask="url(#shield-cutout)">
        {/* Forme pleine du Livre (Solid Book) */}
        {/* Page gauche */}
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        {/* Page droite */}
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </g>
    </svg>
  );
}
