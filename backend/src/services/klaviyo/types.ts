/**
 * Type definitions for the Klaviyo API client
 */

/**
 * Standard response format from Klaviyo API (JSON:API format)
 */
export interface KlaviyoApiResponse<T> {
  data: T[];
  links?: {
    self?: string;
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
  meta?: {
    total?: number;
    page_count?: number;
    next_cursor?: string;
  };
  included?: any[];
}

/**
 * Date range for filtering API requests
 */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * Campaign data structure
 */
export interface Campaign {
  id: string;
  type: string;
  attributes: {
    name: string;
    status: string;
    created: string;
    updated: string;
    archived: boolean;
    send_time: string;
    tags?: string[];
  };
  relationships?: {
    tags?: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

/**
 * Flow data structure
 */
export interface Flow {
  id: string;
  type: string;
  attributes: {
    name: string;
    status: string;
    created: string;
    updated: string;
    trigger_type: string;
    tags?: string[];
  };
  relationships?: {
    tags?: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

/**
 * Flow message data structure
 */
export interface FlowMessage {
  id: string;
  type: string;
  attributes: {
    name: string;
    content: string;
    created: string;
    updated: string;
    status: string;
    position: number;
  };
}

/**
 * Metric data structure
 */
export interface Metric {
  id: string;
  type: string;
  attributes: {
    name: string;
    created: string;
    updated: string;
    integration: string;
  };
}

/**
 * Metric aggregate data structure
 */
export interface MetricAggregate {
  id: string;
  type: string;
  attributes: {
    datetime: string;
    value: number;
  };
}

/**
 * Profile data structure
 */
export interface Profile {
  id: string;
  type: string;
  attributes: {
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    created: string;
    updated: string;
    subscriptions?: {
      email?: {
        marketing: {
          consent_state: string;
          consent_timestamp?: string;
        };
      };
      sms?: {
        marketing: {
          consent_state: string;
          consent_timestamp?: string;
        };
      };
    };
  };
}

/**
 * Segment data structure
 */
export interface Segment {
  id: string;
  type: string;
  attributes: {
    name: string;
    created: string;
    updated: string;
    profile_count: number;
  };
}

/**
 * Event data structure
 */
export interface Event {
  id: string;
  type: string;
  attributes: {
    datetime: string;
    event_name: string;
    value: number;
    properties: Record<string, any>;
  };
  relationships?: {
    profile?: {
      data: {
        type: string;
        id: string;
      };
    };
    metric?: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}
