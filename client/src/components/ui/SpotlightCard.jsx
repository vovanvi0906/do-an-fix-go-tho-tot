import React from 'react';

/**
 * Reusable Mouse-Following Spotlight Card (Linear / Vercel Style)
 * Calculates local cursor coordinates and projects a smooth radial glow
 * that follows mouse movement with 60fps hardware acceleration.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(59, 130, 246, 0.15)', // Default subtle blue glow
  as: Component = 'div',
  style = {},
  ...props
}) {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <Component
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${className}`}
      style={{
        ...style,
        '--spotlight-color': spotlightColor,
      }}
      {...props}
    >
      <div className="relative z-10 w-full h-full">{children}</div>
    </Component>
  );
}
