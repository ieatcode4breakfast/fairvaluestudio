import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  // null = not yet positioned, object = positioned and ready to show
  const [style, setStyle] = useState<{
    top: number;
    left: number;
    arrowLeft: string;
    opacity: number;
  } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Runs synchronously after DOM paint — tooltip is rendered invisible first,
  // then we measure its real width and clamp it
  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) {
      setStyle(null);
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const GUTTER = 12;

    // Icon center (where arrow should point)
    const iconCenterX = triggerRect.left + triggerRect.width / 2;

    // Desired left so tooltip is centered on icon
    let left = iconCenterX - tooltipRect.width / 2;

    // Clamp so tooltip stays within screen bounds
    left = Math.max(GUTTER, Math.min(screenWidth - tooltipRect.width - GUTTER, left));

    // Arrow should point at the icon center, relative to the clamped tooltip left
    const arrowRelative = iconCenterX - left;
    // Clamp arrow within the tooltip box with some padding
    const arrowClamped = Math.max(16, Math.min(tooltipRect.width - 16, arrowRelative));

    setStyle({
      top: triggerRect.top + window.scrollY,
      left: left + window.scrollX,
      arrowLeft: `${arrowClamped}px`,
      opacity: 1,
    });
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => {
        setIsVisible(false);
        setStyle(null);
      }}
    >
      {children}
      {isVisible && createPortal(
        <AnimatePresence>
          <motion.div
            ref={tooltipRef}
            key="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: style?.opacity ?? 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: style ? `${style.top}px` : 0,
              left: style ? `${style.left}px` : 0,
              transform: 'translateY(-100%)',
              marginTop: '-90px',
              // Intentionally NOT using translate-x -50% anymore — left is exact
              maxWidth: 'min(280px, calc(100vw - 24px))',
              width: 'max-content',
              // Hide until positioned to avoid flash
              visibility: style ? 'visible' : 'hidden',
            }}
            className="z-[9999] p-3 bg-slate-900 dark:bg-slate-700 text-white text-xs leading-relaxed rounded-xl shadow-2xl pointer-events-none text-center"
          >
            {content}
            {/* Arrow pinned to exact icon position */}
            {style && (
              <div
                style={{ left: style.arrowLeft }}
                className="absolute top-full -translate-x-1/2 -mt-1 border-6 border-transparent border-t-slate-900 dark:border-t-slate-700"
              />
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
