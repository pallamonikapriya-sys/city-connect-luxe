import { useRef, useState, type ReactNode } from "react";

export function TiltCard({
  children,
  className = "",
  intensity = 10,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  return (
    <div className="scene-3d">
      <div
        ref={ref}
        className={`tilt-card ${className}`}
        style={style}
        onMouseMove={(e) => {
          const el = ref.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          setStyle({
            transform: `translateZ(30px) rotateY(${px * intensity * 2}deg) rotateX(${-py * intensity * 2}deg) scale(1.015)`,
          });
        }}
        onMouseLeave={() => setStyle({})}
      >
        {children}
      </div>
    </div>
  );
}