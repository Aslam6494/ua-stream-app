interface UaStreamLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  inverted?: boolean;
}

export function UaStreamLogo({
  size = 'md',
  showWordmark = true,
  inverted = false,
}: UaStreamLogoProps) {
  const boxSize =
    size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const textSize =
    size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="inline-flex items-center gap-3 shrink-0 select-none">
      {/* Sleek Geometric UA Monogram in Crimson & Obsidian */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${boxSize} shrink-0`}
        aria-hidden="true"
      >
        <rect
          x="1.5"
          y="1.5"
          width="61"
          height="61"
          rx="14"
          className="fill-[#090B0F] stroke-white/15"
          strokeWidth="2"
        />
        {/* Subtle Crimson Diagonal Studio Accent */}
        <path
          d="M42 8H55C57.7614 8 60 10.2386 60 13V24L42 8Z"
          fill="#E11D48"
          fillOpacity="0.22"
        />
        {/* Geometric U */}
        <path
          d="M14 18V36.5C14 44.8 19.3 50 27 50C34.7 50 40 44.8 40 36.5V18H33V36C33 40.6 30.6 43.4 27 43.4C23.4 43.4 21 40.6 21 36V18H14Z"
          fill="#F4F6FA"
        />
        {/* Geometric Crimson A Slash */}
        <path
          d="M38.8 50L49.8 18H42.5L31.5 50H38.8Z"
          fill="#E11D48"
        />
        <path
          d="M44.5 38.5H54.5V44.5H44.5V38.5Z"
          fill="#F43F5E"
        />
      </svg>

      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight whitespace-nowrap ${textSize} ${
            inverted ? 'text-slate-900 dark:text-white' : 'text-white'
          }`}
        >
          UA <span className="text-rose-500">Stream</span>
        </span>
      )}
    </div>
  );
}
