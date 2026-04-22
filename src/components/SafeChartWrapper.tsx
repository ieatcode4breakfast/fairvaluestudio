import React, { useState, useEffect, useRef, ReactElement } from 'react';

interface SafeChartWrapperProps {
  children: ReactElement;
}

/**
 * A structurally robust container that intercepts React rendering to ensure
 * child chart components (like Recharts' LineChart) are ONLY mounted when 
 * the container has actual pixel dimensions greater than 0.
 * 
 * This completely eliminates the recurring "width(-1) and height(-1)"
 * warnings caused by Recharts attempting to render during layout reflows.
 */
export function SafeChartWrapper({ children }: SafeChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timeoutId: number;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      
      const { width, height } = entries[0].contentRect;
      
      // Debounce updates by 50ms to prevent React rendering loops
      // during rapid window resizing operations.
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        // Only update state if dimensions are strictly positive
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }, 50);
    });

    observer.observe(el);
    
    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-w-0 min-h-0 relative">
      {dimensions.width > 0 && dimensions.height > 0 ? (
        React.cloneElement(children, {
          width: dimensions.width,
          height: dimensions.height,
        })
      ) : null}
    </div>
  );
}
