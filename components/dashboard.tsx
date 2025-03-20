import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DateRangeSelector } from './date-range-selector';
import { OverviewSection } from './overview-section';
import { CampaignsTable } from './campaigns-table';
import { FlowsTable } from './flows-table';
import { FormsTable } from './forms-table';
import { SegmentsTable } from './segments-table';
import { clearCache } from '../lib/api-client';
import { 
  BarChartIcon, 
  SearchIcon, 
  FilterIcon, 
  DownloadIcon, 
  BellIcon, 
  UserIcon,
  LineChartIcon,
  PieChartIcon
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

/**
 * Main dashboard component
 * 
 * @returns React component
 */
export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <BarChartIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>EDM Reporting</span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="w-[200px] pl-8 md:w-[260px] rounded-lg" 
            />
          </div>
          
          <DateRangeSelector />
          
          <Button variant="outline" size="icon" className="rounded-lg">
            <FilterIcon className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" className="rounded-lg">
            <DownloadIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-lg"
            onClick={() => {
              clearCache();
              window.location.reload();
            }}
          >
            <BellIcon className="h-4 w-4" />
          </Button>
          
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance across campaigns, flows, segments, and forms</p>
        </div>
        
        {/* Overview metrics - Always visible */}
        <OverviewSection />
        
        {/* Tabbed content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 mt-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="flows">Flows</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Revenue by channel over time</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                    <LineChartIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Revenue chart would render here</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                      <span>Campaigns</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-violet-500" />
                      <span>Flows</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-amber-500" />
                      <span>Forms</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-emerald-500" />
                      <span>Other</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Channel Distribution</CardTitle>
                  <CardDescription>Revenue by marketing channel</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                  <div className="h-[180px] w-[180px] flex items-center justify-center bg-muted/20 rounded-full">
                    <PieChartIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="w-full space-y-3">
                    <ChannelItem name="Campaigns" value="42%" color="bg-blue-500" />
                    <ChannelItem name="Flows" value="35%" color="bg-violet-500" />
                    <ChannelItem name="Forms" value="15%" color="bg-amber-500" />
                    <ChannelItem name="Other" value="8%" color="bg-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Top Performing Segments</CardTitle>
                  <CardDescription>By conversion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <SegmentItem name="VIP Customers" conversionRate={42} count={5842} revenue={28450} />
                    <SegmentItem name="Recent Purchasers" conversionRate={35} count={12480} revenue={42680} />
                    <SegmentItem name="Cart Abandoners" conversionRate={28} count={8640} revenue={15280} />
                    <SegmentItem name="Email Engaged" conversionRate={22} count={18540} revenue={24850} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Top Performing Flows</CardTitle>
                  <CardDescription>By conversion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FlowItem name="Welcome Series" recipients={8450} conversionRate={32} />
                    <FlowItem name="Abandoned Cart" recipients={6280} conversionRate={28} />
                    <FlowItem name="Post-Purchase" recipients={12480} conversionRate={24} />
                    <FlowItem name="Win-Back" recipients={5840} conversionRate={18} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Top Performing Forms</CardTitle>
                  <CardDescription>By submission rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormItem name="Newsletter Signup" views={12480} submissionRate={38} />
                    <FormItem name="Exit Intent Popup" views={28450} submissionRate={24} />
                    <FormItem name="Product Registration" views={8640} submissionRate={42} />
                    <FormItem name="Contact Form" views={5840} submissionRate={32} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
            </div>
            {activeTab === 'campaigns' && <CampaignsTable />}
          </TabsContent>
          
          <TabsContent value="flows" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Flows</h2>
            </div>
            {activeTab === 'flows' && <FlowsTable />}
          </TabsContent>
          
          <TabsContent value="forms" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Forms</h2>
            </div>
            {activeTab === 'forms' && <FormsTable />}
          </TabsContent>
          
          <TabsContent value="segments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Segments</h2>
            </div>
            {activeTab === 'segments' && <SegmentsTable />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper components for the overview tab
function ChannelItem({ name, value, color }: { name: string, value: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-sm">{name}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function SegmentItem({ name, conversionRate, count, revenue }: { name: string, conversionRate: number, count: number, revenue: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium">{name}</div>
        <div>{conversionRate}%</div>
      </div>
      <Progress value={conversionRate} max={50} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{count.toLocaleString()} subscribers</span>
        <span>${revenue.toLocaleString()}</span>
      </div>
    </div>
  );
}

function FlowItem({ name, recipients, conversionRate }: { name: string, recipients: number, conversionRate: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="font-medium">{name}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <UserIcon className="mr-1 h-3.5 w-3.5" />
          {recipients.toLocaleString()} recipients
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={getBadgeVariant(conversionRate)}>{conversionRate}%</Badge>
      </div>
    </div>
  );
}

function FormItem({ name, views, submissionRate }: { name: string, views: number, submissionRate: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="font-medium">{name}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {views.toLocaleString()} views
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={getBadgeVariant(submissionRate)}>{submissionRate}%</Badge>
      </div>
    </div>
  );
}

function getBadgeVariant(rate: number): "default" | "secondary" | "destructive" | "outline" {
  if (rate >= 30) return "default";
  if (rate >= 20) return "outline";
  return "secondary";
}
