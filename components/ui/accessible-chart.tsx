'use client';

import React, { useEffect, useRef } from 'react';
import { useId } from 'react';

interface AccessibleChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  dataTable?: React.ReactNode;
  printFriendly?: boolean;
  className?: string;
}

/**
 * Accessible wrapper for chart components
 * Provides proper ARIA attributes and keyboard navigation support
 */
export function AccessibleChart({
  title,
  description,
  children,
  dataTable,
  printFriendly = false,
  className = '',
}: AccessibleChartProps) {
  const id = useId();
  const chartId = `chart-${id}`;
  const descriptionId = `chart-desc-${id}`;
  const dataTableId = `chart-data-${id}`;
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Set up keyboard navigation support
  useEffect(() => {
    if (!chartRef.current) return;
    
    const focusableElements = chartRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    // Make the chart container focusable if it doesn't have focusable elements
    chartRef.current.tabIndex = 0;
    
    // Add key handlers for focusing on chart elements
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Focus management for tab navigation
        if (e.shiftKey && document.activeElement === focusableElements[0]) {
          e.preventDefault();
          (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
        } else if (!e.shiftKey && document.activeElement === focusableElements[focusableElements.length - 1]) {
          e.preventDefault();
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    };
    
    chartRef.current.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (chartRef.current) {
        chartRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);
  
  return (
    <div 
      ref={chartRef}
      id={chartId}
      className={`chart-container ${className}`}
      role="region"
      aria-labelledby={title ? descriptionId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {(title || description) && (
        <div id={descriptionId} className="sr-only">
          {title && <div>{title}</div>}
          {description && <div>{description}</div>}
        </div>
      )}
      
      {children}
      
      {/* Accessible data table for screen readers and print mode */}
      {dataTable && (
        <div 
          id={dataTableId} 
          className={printFriendly ? 'sr-only print:not-sr-only print:mt-4' : 'sr-only'}
          aria-label={`Data table for ${title}`}
        >
          {dataTable}
        </div>
      )}
    </div>
  );
}

/**
 * Generates a data table from chart data for accessibility and printing
 */
export function ChartDataTable<T extends Record<string, any>>({
  data,
  title,
  columns,
}: {
  data: T[];
  title: string;
  columns: {
    key: keyof T;
    header: string;
    format?: (value: any) => string;
  }[];
}) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No data available</p>
    );
  }
  
  return (
    <table className="min-w-full border-collapse border border-border">
      <caption className="font-medium text-left mb-2">
        {title}
      </caption>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th 
              key={index} 
              className="border border-border px-4 py-2 text-left font-medium"
              scope="col"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => {
              const value = row[column.key];
              const formattedValue = column.format ? column.format(value) : value;
              
              return (
                <td 
                  key={colIndex} 
                  className="border border-border px-4 py-2"
                >
                  {formattedValue ?? '-'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}