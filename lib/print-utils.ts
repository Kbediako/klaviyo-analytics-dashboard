/**
 * Utilities for print-friendly visualizations
 */

/**
 * Convert color to grayscale equivalent
 * Used for print-friendly visualizations that will be printed in black and white
 * 
 * @param hexColor - Hex color string (e.g., "#3b82f6")
 * @returns Grayscale hex color
 */
export function toGrayscale(hexColor: string): string {
  // Remove hash if present
  hexColor = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate grayscale value (luminance formula)
  const grayscale = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  
  // Convert back to hex
  const grayHex = grayscale.toString(16).padStart(2, '0');
  
  return `#${grayHex}${grayHex}${grayHex}`;
}

/**
 * Get print-friendly color palette
 * Uses high contrast colors that will be distinguishable in black and white
 * 
 * @returns Object with print-friendly colors
 */
export function getPrintTheme(): {[key: string]: string} {
  return {
    background: '#FFFFFF',
    text: '#000000',
    border: '#CCCCCC',
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    accent1: '#333333',
    accent2: '#777777',
    grid: '#EEEEEE'
  };
}

/**
 * High contrast pattern fills for charts in print
 * These are better than just colors for distinguishing chart elements in black and white
 * 
 * @returns Array of pattern definitions for SVG
 */
export function getPatternDefs(): React.ReactNode {
  return (
    <defs>
      <pattern id="pattern-stripe" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="2" height="4" transform="translate(0,0)" fill="white"></rect>
      </pattern>
      <pattern id="pattern-dot" width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="2.5" cy="2.5" r="1.5" fill="black"></circle>
      </pattern>
      <pattern id="pattern-dash" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0,5 L10,5" stroke="black" strokeWidth="2"></path>
      </pattern>
      <pattern id="pattern-crosshatch" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0,0 L8,8 M8,0 L0,8" stroke="black" strokeWidth="1"></path>
      </pattern>
    </defs>
  );
}

/**
 * Add print media style tag to document
 * Ensures charts display correctly when printed
 * 
 * @param containerId - ID of the chart container element
 */
export function addPrintStyles(containerId: string): void {
  const styleId = `print-styles-${containerId}`;
  
  // Check if style already exists
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @media print {
      #${containerId} {
        break-inside: avoid;
        page-break-inside: avoid;
        width: 100% !important;
      }
      
      #${containerId} .recharts-wrapper {
        width: 100% !important;
      }
      
      #${containerId} .recharts-surface {
        width: 100% !important;
      }
      
      #${containerId} .chart-data-table {
        display: table !important;
        width: 100% !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}