import klaviyoApiClient from './klaviyoApiClient';
import { DateRange } from '../utils/dateUtils';

export interface Campaign {
  id: string;
  name: string;
  sent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

/**
 * Get campaigns data for the dashboard
 * 
 * @param dateRange Date range to get campaigns for
 * @returns Array of campaign data
 */
export async function getCampaignsData(dateRange: DateRange): Promise<Campaign[]> {
  try {
    // Get campaigns from Klaviyo API
    const campaignsResponse = await klaviyoApiClient.getCampaigns(dateRange);
    
    // Get campaign metrics (opens, clicks, conversions, revenue)
    const campaignMetrics = await getCampaignMetrics(dateRange);
    
    // Transform and combine the data
    const campaigns = transformCampaignsData(campaignsResponse, campaignMetrics);
    
    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns data:', error);
    return [];
  }
}

/**
 * Get campaign metrics from Klaviyo API
 * 
 * @param dateRange Date range to get metrics for
 * @returns Campaign metrics data
 */
async function getCampaignMetrics(dateRange: DateRange): Promise<any> {
  // In a real implementation, we would fetch metrics for each campaign
  // For now, we'll return placeholder data
  return {
    opens: {},
    clicks: {},
    conversions: {},
    revenue: {}
  };
}

/**
 * Transform campaigns data from Klaviyo API to the format needed by the frontend
 * 
 * @param campaignsResponse Response from Klaviyo API
 * @param campaignMetrics Campaign metrics data
 * @returns Transformed campaigns data
 */
function transformCampaignsData(campaignsResponse: any, campaignMetrics: any): Campaign[] {
  try {
    // Check if we have actual data from the API
    if (campaignsResponse && campaignsResponse.data && campaignsResponse.data.length > 0) {
      console.log(`Transforming ${campaignsResponse.data.length} campaigns from live API`);
      
      // Map the API response to our campaign interface
      return campaignsResponse.data.map((campaign: any) => {
        const attributes = campaign.attributes || {};
        
        // Generate random metrics for now, in real implementation we'd use actual metrics
        const sent = Math.floor(Math.random() * 30000) + 5000;
        const openRate = Number((Math.random() * 50).toFixed(1));
        const clickRate = Number((Math.random() * 25).toFixed(1));
        const conversionRate = Number((Math.random() * 10).toFixed(1));
        const revenue = Math.floor(Math.random() * 15000) + 1000;
        
        return {
          id: campaign.id || `campaign-${Math.random().toString(36).substr(2, 9)}`,
          name: attributes.name || 'Unnamed Campaign',
          sent,
          openRate,
          clickRate,
          conversionRate,
          revenue
        };
      }).slice(0, 5); // Just take the first 5 for now
    }
    
    // Fallback to mock data if no campaigns found
    console.log('No campaign data found, using fallback data');
    return [
      {
        id: '1',
        name: 'Summer Sale Announcement',
        sent: 24850,
        openRate: 42.8,
        clickRate: 18.5,
        conversionRate: 8.2,
        revenue: 12580
      },
      {
        id: '2',
        name: 'New Product Launch',
        sent: 18650,
        openRate: 38.5,
        clickRate: 15.2,
        conversionRate: 6.8,
        revenue: 9840
      },
      {
        id: '3',
        name: 'Customer Feedback Survey',
        sent: 15420,
        openRate: 31.2,
        clickRate: 12.8,
        conversionRate: 4.5,
        revenue: 3250
      },
      {
        id: '4',
        name: 'Weekly Newsletter',
        sent: 28750,
        openRate: 24.7,
        clickRate: 9.3,
        conversionRate: 3.2,
        revenue: 4680
      },
      {
        id: '5',
        name: 'Exclusive Member Discount',
        sent: 12580,
        openRate: 35.9,
        clickRate: 16.4,
        conversionRate: 7.5,
        revenue: 8450
      }
    ];
  } catch (error) {
    console.error('Error transforming campaigns data:', error);
    return [];
  }
}
