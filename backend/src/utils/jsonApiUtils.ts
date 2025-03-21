/**
 * JSON:API Parameter Formatting Utilities
 * 
 * This module provides utilities for formatting parameters according to the JSON:API specification.
 * https://jsonapi.org/format/
 */

/**
 * Filter parameter for JSON:API requests
 */
export interface FilterParam {
  field: string;
  operator: 'equals' | 'greater-than' | 'less-than' | 'greater-or-equal' | 'less-or-equal' | 'contains';
  value: string | number | boolean | Date;
}

/**
 * Type guard for FilterParam
 * 
 * @param value Value to check
 * @returns True if the value is a FilterParam
 */
export function isFilterParam(value: unknown): value is FilterParam {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const candidate = value as Record<string, unknown>;
  
  // Check field
  if (typeof candidate.field !== 'string') {
    return false;
  }
  
  // Check operator
  if (typeof candidate.operator !== 'string') {
    return false;
  }
  
  const validOperators = [
    'equals', 
    'greater-than', 
    'less-than', 
    'greater-or-equal', 
    'less-or-equal', 
    'contains'
  ];
  
  if (!validOperators.includes(candidate.operator)) {
    return false;
  }
  
  // Check value
  const valueType = typeof candidate.value;
  if (valueType !== 'string' && 
      valueType !== 'number' && 
      valueType !== 'boolean' && 
      !(candidate.value instanceof Date)) {
    return false;
  }
  
  return true;
}

/**
 * Sparse fieldset specification for JSON:API requests
 */
export interface SparseFieldset {
  [resourceType: string]: string[];
}

/**
 * Type guard for SparseFieldset
 * 
 * @param value Value to check
 * @returns True if the value is a SparseFieldset
 */
export function isSparseFieldset(value: unknown): value is SparseFieldset {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const candidate = value as Record<string, unknown>;
  
  // Check each key has a string array value
  return Object.values(candidate).every(fieldList => 
    Array.isArray(fieldList) && fieldList.every(field => typeof field === 'string')
  );
}

/**
 * JSON:API parameters interface
 */
export interface JsonApiParams {
  filter?: FilterParam[] | string | Record<string, any>;
  sort?: string[] | string;
  include?: string[] | string;
  fields?: SparseFieldset;
  page?: {
    cursor?: string;
    size?: number;
  };
}

/**
 * Type guard for JsonApiParams
 * 
 * @param value Value to check
 * @returns True if the value is a JsonApiParams object
 */
export function isJsonApiParams(value: unknown): value is JsonApiParams {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const candidate = value as Record<string, unknown>;
  
  // Check filter
  if (candidate.filter !== undefined) {
    if (Array.isArray(candidate.filter)) {
      if (!candidate.filter.every(isFilterParam)) {
        return false;
      }
    } else if (typeof candidate.filter !== 'string' && typeof candidate.filter !== 'object') {
      return false;
    }
  }
  
  // Check sort
  if (candidate.sort !== undefined) {
    if (Array.isArray(candidate.sort)) {
      if (!candidate.sort.every(item => typeof item === 'string')) {
        return false;
      }
    } else if (typeof candidate.sort !== 'string') {
      return false;
    }
  }
  
  // Check include
  if (candidate.include !== undefined) {
    if (Array.isArray(candidate.include)) {
      if (!candidate.include.every(item => typeof item === 'string')) {
        return false;
      }
    } else if (typeof candidate.include !== 'string') {
      return false;
    }
  }
  
  // Check fields
  if (candidate.fields !== undefined && !isSparseFieldset(candidate.fields)) {
    return false;
  }
  
  // Check page
  if (candidate.page !== undefined) {
    if (typeof candidate.page !== 'object' || candidate.page === null) {
      return false;
    }
    
    const page = candidate.page as Record<string, unknown>;
    
    if (page.cursor !== undefined && typeof page.cursor !== 'string') {
      return false;
    }
    
    if (page.size !== undefined && typeof page.size !== 'number') {
      return false;
    }
  }
  
  return true;
}

/**
 * Build a filter string from a FilterParam object
 * 
 * @param filter Filter parameter
 * @returns Formatted filter string
 */
function buildFilterString(filter: FilterParam): string {
  // Format date values as ISO strings
  let value = filter.value;
  if (value instanceof Date) {
    value = value.toISOString();
  } else if (typeof value === 'string') {
    // Escape quotes in string values
    value = `"${value.replace(/"/g, '\\"')}"`;
  }

  return `${filter.operator}(${filter.field},${value})`;
}

/**
 * Build a query string from JSON:API parameters
 * 
 * @param params JSON:API parameters
 * @returns Formatted query string
 */
export function buildQueryString(params: JsonApiParams): string {
  const queryParams = new URLSearchParams();
  
  // Add filter parameters
  if (params.filter) {
    if (Array.isArray(params.filter) && params.filter.length > 0) {
      const filterStrings = params.filter.map(buildFilterString);
      queryParams.append('filter', filterStrings.join(','));
    } else if (typeof params.filter === 'string') {
      // Handle string filter (for backward compatibility)
      queryParams.append('filter', params.filter);
    } else if (typeof params.filter === 'object') {
      // Handle object filter (for backward compatibility)
      Object.entries(params.filter).forEach(([key, value]) => {
        queryParams.append(`filter[${key}]`, String(value));
      });
    }
  }
  
  // Add sort parameters
  if (params.sort) {
    if (Array.isArray(params.sort) && params.sort.length > 0) {
      queryParams.append('sort', params.sort.join(','));
    } else if (typeof params.sort === 'string') {
      queryParams.append('sort', params.sort);
    }
  }
  
  // Add include parameters
  if (params.include) {
    if (Array.isArray(params.include) && params.include.length > 0) {
      queryParams.append('include', params.include.join(','));
    } else if (typeof params.include === 'string') {
      queryParams.append('include', params.include);
    }
  }
  
  // Add fields parameters (sparse fieldsets)
  if (params.fields) {
    Object.entries(params.fields).forEach(([resourceType, fields]) => {
      queryParams.append(`fields[${resourceType}]`, fields.join(','));
    });
  }
  
  // Add pagination parameters
  if (params.page) {
    if (params.page.cursor) {
      queryParams.append('page[cursor]', params.page.cursor);
    }
    if (params.page.size) {
      queryParams.append('page[size]', params.page.size.toString());
    }
  }
  
  return queryParams.toString() ? `?${queryParams.toString()}` : '';
}

/**
 * Parse a JSON:API response to extract data
 * 
 * @param response JSON:API response
 * @returns Extracted data
 */
export function parseJsonApiResponse<T>(response: any): T[] {
  if (!response || !response.data) {
    return [];
  }
  
  // Handle both single objects and arrays
  const dataArray = Array.isArray(response.data) ? response.data : [response.data];
  
  return dataArray.map((item: any) => {
    // Extract attributes
    const result = { ...item.attributes, id: item.id };
    
    // Extract relationships if included
    if (response.included && item.relationships) {
      Object.entries(item.relationships).forEach(([relationName, relationData]: [string, any]) => {
        if (!relationData || !relationData.data) return;
        
        // Handle both single relationships and arrays
        const relatedIds = Array.isArray(relationData.data) 
          ? relationData.data.map((rel: any) => rel.id)
          : [relationData.data.id];
        
        // Find related objects in included data
        const relatedItems = relatedIds.map((id: string) => 
          response.included.find((inc: any) => inc.id === id)
        ).filter(Boolean);
        
        // Add related data to result
        if (relatedItems.length > 0) {
          result[relationName] = relatedItems.map((item: any) => ({
            id: item.id,
            ...item.attributes
          }));
          
          // If it's a single relationship, unwrap from array
          if (!Array.isArray(relationData.data)) {
            result[relationName] = result[relationName][0];
          }
        }
      });
    }
    
    return result as T;
  });
}

/**
 * Create a filter parameter for date range filtering
 * 
 * @param field Field to filter on
 * @param startDate Start date
 * @param endDate End date
 * @returns Array of filter parameters for the date range
 */
export function createDateRangeFilter(
  field: string,
  startDate: Date,
  endDate: Date
): FilterParam[] {
  return [
    {
      field,
      operator: 'greater-or-equal',
      value: startDate
    },
    {
      field,
      operator: 'less-or-equal',
      value: endDate
    }
  ];
}
