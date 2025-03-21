'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Skeleton } from './skeleton';

interface LazyVisualizationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string | number;
  width?: string | number;
  threshold?: number; // Intersection observer threshold
  rootMargin?: string; // Intersection observer root margin
}

/**
 * LazyVisualization component for lazy loading visualizations 
 * Only renders when the component enters the viewport
 */
export function LazyVisualization({
  children,
  fallback,
  height = '400px',
  width = '100%',
  threshold = 0.1,
  rootMargin = '200px 0px',
}: LazyVisualizationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Initialize on client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Set up intersection observer
  useEffect(() => {
    if (!containerRef.current || !isClient) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve once visible
          observer.unobserve(containerRef.current!);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );
    
    observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isClient, threshold, rootMargin]);
  
  // Default fallback loading skeleton
  const defaultFallback = (
    <div className="flex items-center justify-center h-full w-full bg-muted/10 rounded-md border border-border/30 animate-pulse">
      <Skeleton className="h-full w-full" />
    </div>
  );
  
  return (
    <div
      ref={containerRef}
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        minHeight: '100px' 
      }}
      className="lazy-visualization-container"
    >
      {isVisible ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
}

/**
 * Progressive rendering component for complex visualizations
 * Renders a placeholder initially, then the full component after a specified delay
 */
export function ProgressiveVisualization({
  children,
  placeholder,
  delay = 100, // ms
  priority = false,
}: {
  children: React.ReactNode;
  placeholder: React.ReactNode;
  delay?: number;
  priority?: boolean;
}) {
  const [showFull, setShowFull] = useState(priority);
  
  useEffect(() => {
    if (priority) return;
    
    const timer = setTimeout(() => {
      setShowFull(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay, priority]);
  
  return showFull ? children : placeholder;
}