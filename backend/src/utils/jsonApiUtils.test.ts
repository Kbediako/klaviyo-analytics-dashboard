import { 
  buildQueryString, 
  parseJsonApiResponse, 
  createDateRangeFilter,
  FilterParam,
  JsonApiParams
} from './jsonApiUtils';

describe('jsonApiUtils', () => {
  describe('buildQueryString', () => {
    it('should build a query string with filter parameters', () => {
      const params: JsonApiParams = {
        filter: [
          {
            field: 'messages.channel',
            operator: 'equals',
            value: 'email'
          }
        ]
      };
      
      const result = buildQueryString(params);
      expect(result).toBe('?filter=equals(messages.channel,"email")');
    });
    
    it('should build a query string with multiple filter parameters', () => {
      const params: JsonApiParams = {
        filter: [
          {
            field: 'messages.channel',
            operator: 'equals',
            value: 'email'
          },
          {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        ]
      };
      
      const result = buildQueryString(params);
      expect(result).toBe('?filter=equals(messages.channel,"email"),equals(status,"active")');
    });
    
    it('should handle date values in filter parameters', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const params: JsonApiParams = {
        filter: [
          {
            field: 'created',
            operator: 'greater-than',
            value: date
          }
        ]
      };
      
      const result = buildQueryString(params);
      expect(result).toBe(`?filter=greater-than(created,${date.toISOString()})`);
    });
    
    it('should build a query string with sort parameters', () => {
      const params: JsonApiParams = {
        sort: ['-created', 'name']
      };
      
      const result = buildQueryString(params);
      expect(result).toBe('?sort=-created,name');
    });
    
    it('should build a query string with include parameters', () => {
      const params: JsonApiParams = {
        include: ['tags', 'metrics']
      };
      
      const result = buildQueryString(params);
      expect(result).toBe('?include=tags,metrics');
    });
    
    it('should build a query string with fields parameters', () => {
      const params: JsonApiParams = {
        fields: {
          campaign: ['name', 'status', 'created'],
          tag: ['name']
        }
      };
      
      const result = buildQueryString(params);
      expect(result).toContain('fields[campaign]=name,status,created');
      expect(result).toContain('fields[tag]=name');
    });
    
    it('should build a query string with pagination parameters', () => {
      const params: JsonApiParams = {
        page: {
          size: 50,
          cursor: 'abc123'
        }
      };
      
      const result = buildQueryString(params);
      expect(result).toContain('page[cursor]=abc123');
      expect(result).toContain('page[size]=50');
    });
    
    it('should build a query string with all parameter types', () => {
      const params: JsonApiParams = {
        filter: [
          {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        ],
        sort: ['-created'],
        include: ['tags'],
        fields: {
          campaign: ['name', 'status']
        },
        page: {
          size: 25
        }
      };
      
      const result = buildQueryString(params);
      expect(result).toContain('filter=equals(status,"active")');
      expect(result).toContain('sort=-created');
      expect(result).toContain('include=tags');
      expect(result).toContain('fields[campaign]=name,status');
      expect(result).toContain('page[size]=25');
    });
    
    it('should handle string filter for backward compatibility', () => {
      const params: JsonApiParams = {
        filter: 'equals(status,"active")'
      };
      
      const result = buildQueryString(params);
      expect(result).toBe('?filter=equals(status,"active")');
    });
    
    it('should handle object filter for backward compatibility', () => {
      const params: JsonApiParams = {
        filter: {
          status: 'active',
          channel: 'email'
        }
      };
      
      const result = buildQueryString(params);
      expect(result).toContain('filter[status]=active');
      expect(result).toContain('filter[channel]=email');
    });
  });
  
  describe('parseJsonApiResponse', () => {
    it('should parse a simple JSON:API response', () => {
      const response = {
        data: [
          {
            id: '1',
            type: 'campaign',
            attributes: {
              name: 'Test Campaign',
              status: 'active'
            }
          }
        ]
      };
      
      const result = parseJsonApiResponse(response);
      expect(result).toEqual([
        {
          id: '1',
          name: 'Test Campaign',
          status: 'active'
        }
      ]);
    });
    
    it('should parse a JSON:API response with included relationships', () => {
      const response = {
        data: [
          {
            id: '1',
            type: 'campaign',
            attributes: {
              name: 'Test Campaign',
              status: 'active'
            },
            relationships: {
              tags: {
                data: [
                  { id: 'tag1', type: 'tag' },
                  { id: 'tag2', type: 'tag' }
                ]
              }
            }
          }
        ],
        included: [
          {
            id: 'tag1',
            type: 'tag',
            attributes: {
              name: 'Tag 1'
            }
          },
          {
            id: 'tag2',
            type: 'tag',
            attributes: {
              name: 'Tag 2'
            }
          }
        ]
      };
      
      const result = parseJsonApiResponse(response);
      expect(result).toEqual([
        {
          id: '1',
          name: 'Test Campaign',
          status: 'active',
          tags: [
            {
              id: 'tag1',
              name: 'Tag 1'
            },
            {
              id: 'tag2',
              name: 'Tag 2'
            }
          ]
        }
      ]);
    });
    
    it('should handle single object responses', () => {
      const response = {
        data: {
          id: '1',
          type: 'campaign',
          attributes: {
            name: 'Test Campaign',
            status: 'active'
          }
        }
      };
      
      const result = parseJsonApiResponse(response);
      expect(result).toEqual([
        {
          id: '1',
          name: 'Test Campaign',
          status: 'active'
        }
      ]);
    });
    
    it('should handle single relationships', () => {
      const response = {
        data: {
          id: '1',
          type: 'campaign',
          attributes: {
            name: 'Test Campaign'
          },
          relationships: {
            owner: {
              data: { id: 'user1', type: 'user' }
            }
          }
        },
        included: [
          {
            id: 'user1',
            type: 'user',
            attributes: {
              name: 'John Doe'
            }
          }
        ]
      };
      
      const result = parseJsonApiResponse(response);
      expect(result).toEqual([
        {
          id: '1',
          name: 'Test Campaign',
          owner: {
            id: 'user1',
            name: 'John Doe'
          }
        }
      ]);
    });
    
    it('should return empty array for null or undefined response', () => {
      expect(parseJsonApiResponse(null)).toEqual([]);
      expect(parseJsonApiResponse(undefined)).toEqual([]);
      expect(parseJsonApiResponse({})).toEqual([]);
    });
  });
  
  describe('createDateRangeFilter', () => {
    it('should create a date range filter', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      const result = createDateRangeFilter('created', startDate, endDate);
      
      expect(result).toHaveLength(2);
      
      // Check first filter (greater-than with adjusted date)
      expect(result[0].field).toBe('created');
      expect(result[0].operator).toBe('greater-than');
      // The value should be 1ms before startDate
      const expectedStartDate = new Date(startDate.getTime() - 1);
      expect(result[0].value).toEqual(expect.any(Date));
      expect((result[0].value as Date).getTime()).toBe(expectedStartDate.getTime());
      
      // Check second filter (less-than with adjusted date)
      expect(result[1].field).toBe('created');
      expect(result[1].operator).toBe('less-than');
      // The value should be 1ms after endDate
      const expectedEndDate = new Date(endDate.getTime() + 1);
      expect(result[1].value).toEqual(expect.any(Date));
      expect((result[1].value as Date).getTime()).toBe(expectedEndDate.getTime());
    });
  });
});
