import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DateRangeSelector } from './date-range-selector';
import { OverviewSection } from './overview-section';
import { CampaignsTable } from './campaigns-table';
import { FlowsTable } from './flows-table';
import { FormsTable } from './forms-table';
import { SegmentsTable } from './segments-table';

/**
 * Main dashboard component
 * 
 * @returns React component
 */
export function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Klaviyo Analytics Dashboard</h1>
        </div>
        
        <DateRangeSelector />
      </header>
      
      {/* Main content */}
      <div className="flex-1 space-y-8 p-8">
        {/* Overview section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <OverviewSection />
        </div>
        
        {/* Tabbed content */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="flows">Flows</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
            </div>
            <CampaignsTable />
          </TabsContent>
          
          <TabsContent value="flows" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Flows</h2>
            </div>
            <FlowsTable />
          </TabsContent>
          
          <TabsContent value="forms" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Forms</h2>
            </div>
            <FormsTable />
          </TabsContent>
          
          <TabsContent value="segments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Segments</h2>
            </div>
            <SegmentsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
