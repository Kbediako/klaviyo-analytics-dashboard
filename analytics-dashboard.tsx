"use client"

import { useState } from "react"
import { useRevenueChartData, useChannelDistributionData, useTopSegmentsData, useTopFlowsData, useTopFormsData } from "@/hooks/use-chart-data"
import { useCampaigns } from "@/hooks/use-campaigns"
import { useFlows } from "@/hooks/use-flows"
import { useForms } from "@/hooks/use-forms"
import { useOverviewMetrics } from "@/hooks/use-overview-metrics"
import { RevenueChart } from "@/components/revenue-chart"
import { ChannelDistributionChart } from "@/components/channel-distribution-chart"
import { MetricCardSkeleton } from "@/components/metric-card-skeleton"
import { 
  OverviewMetrics, 
  RevenueDataPoint, 
  ChannelDataPoint, 
  TopSegmentData, 
  TopFlowData, 
  TopFormData,
  Campaign,
  Flow,
  Form
} from "@/lib/api-client"

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

interface ChannelDistributionChartProps {
  data: ChannelDataPoint[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  description: string;
  color: 'blue' | 'indigo' | 'violet' | 'emerald' | 'amber';
}

interface ChannelItemProps {
  name: string;
  value: string;
  color: string;
}
import {
  BarChart,
  LineChart,
  PieChart,
  ArrowUp,
  ArrowDown,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  Bell,
  Search,
  FormInput,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("last-30-days")
  const [activeTab, setActiveTab] = useState("overview")
  
  // Fetch data using hooks
  const { data: overviewMetrics, isLoading: isLoadingOverview } = useOverviewMetrics({ dateRange })
  const { data: revenueData, isLoading: isLoadingRevenue, error: revenueError } = useRevenueChartData({ dateRange })
  const { data: distributionData, isLoading: isLoadingDistribution, error: distributionError } = useChannelDistributionData({ dateRange })
  const { data: topSegments, isLoading: isLoadingSegments, error: segmentsError } = useTopSegmentsData({ dateRange })
  const { data: topFlows, isLoading: isLoadingFlows, error: flowsError } = useTopFlowsData({ dateRange })
  const { data: topForms, isLoading: isLoadingForms, error: formsError } = useTopFormsData({ dateRange })
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useCampaigns({ dateRange })
  const { data: flowsData, isLoading: isLoadingFlowsData } = useFlows({ dateRange })
  const { data: formsData, isLoading: isLoadingFormsData } = useForms({ dateRange })

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <BarChart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>DataPulse</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-[200px] pl-8 md:w-[260px] rounded-lg" />
          </div>
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] rounded-lg">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="this-month">This month</SelectItem>
              <SelectItem value="last-month">Last month</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="rounded-lg">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-lg">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Avatar>
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <div className="flex-1 space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance across campaigns, flows, segments, and forms</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingOverview ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Revenue"
                value={overviewMetrics?.revenue?.current ? `$${overviewMetrics.revenue.current.toLocaleString()}` : '$0'}
                change={overviewMetrics?.revenue?.change !== undefined ? `${overviewMetrics.revenue.change > 0 ? '+' : ''}${overviewMetrics.revenue.change}%` : '0%'}
                trend={overviewMetrics?.revenue?.change ? overviewMetrics.revenue.change > 0 ? 'up' : 'down' : 'down'}
                icon={<DollarSign className="h-4 w-4" />}
                description="vs previous period"
                color="emerald"
              />
              <MetricCard
                title="Active Subscribers"
                value={overviewMetrics?.subscribers?.current ? overviewMetrics.subscribers.current.toLocaleString() : '0'}
                change={overviewMetrics?.subscribers?.change !== undefined ? `${overviewMetrics.subscribers.change > 0 ? '+' : ''}${overviewMetrics.subscribers.change}%` : '0%'}
                trend={overviewMetrics?.subscribers?.change ? overviewMetrics.subscribers.change > 0 ? 'up' : 'down' : 'down'}
                icon={<Users className="h-4 w-4" />}
                description="vs previous period"
                color="blue"
              />
              <MetricCard
                title="Conversion Rate"
                value={overviewMetrics?.conversionRate?.current ? `${overviewMetrics.conversionRate.current}%` : '0%'}
                change={overviewMetrics?.conversionRate?.change !== undefined ? `${overviewMetrics.conversionRate.change > 0 ? '+' : ''}${overviewMetrics.conversionRate.change}%` : '0%'}
                trend={overviewMetrics?.conversionRate?.change ? overviewMetrics.conversionRate.change > 0 ? 'up' : 'down' : 'down'}
                icon={<ShoppingCart className="h-4 w-4" />}
                description="vs previous period"
                color="violet"
              />
              <MetricCard
                title="Form Submissions"
                value={overviewMetrics?.formSubmissions?.current ? overviewMetrics.formSubmissions.current.toLocaleString() : '0'}
                change={overviewMetrics?.formSubmissions?.change !== undefined ? `${overviewMetrics.formSubmissions.change > 0 ? '+' : ''}${overviewMetrics.formSubmissions.change}%` : '0%'}
                trend={overviewMetrics?.formSubmissions?.change ? overviewMetrics.formSubmissions.change > 0 ? 'up' : 'down' : 'down'}
                icon={<FormInput className="h-4 w-4" />}
                description="vs previous period"
                color="amber"
              />
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="flows">Flows</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Revenue by channel over time</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8">
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      View by
                      <ChevronDown className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <RevenueChart 
                    data={revenueData} 
                    isLoading={isLoadingRevenue}
                    error={revenueError}
                  />
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
                  <ChannelDistributionChart 
                    data={distributionData} 
                    isLoading={isLoadingDistribution}
                    error={distributionError}
                  />
                  <div className="w-full space-y-3">
                    {distributionData?.map((channel: ChannelDataPoint) => (
                      <ChannelItem 
                        key={channel.name}
                        name={channel.name} 
                        value={`${channel.value}%`} 
                        color={`bg-${channel.color}-500`}
                      />
                    ))}
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
                    {isLoadingSegments ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-md" />
                        ))}
                      </div>
                    ) : topSegments?.map((segment: TopSegmentData) => (
                      <div key={segment.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium">{segment.name}</div>
                          <div>{segment.conversionRate}%</div>
                        </div>
                        <Progress value={segment.conversionRate} max={50} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{segment.count.toLocaleString()} subscribers</span>
                          <span>${segment.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
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
                    {isLoadingFlows ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-md" />
                        ))}
                      </div>
                    ) : topFlows?.map((flow: TopFlowData) => (
                      <div key={flow.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{flow.name}</div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Users className="mr-1 h-3.5 w-3.5" />
                            {flow.recipients.toLocaleString()} recipients
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getBadgeVariant(flow.conversionRate)}>{flow.conversionRate}%</Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
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
                    {isLoadingForms ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-md" />
                        ))}
                      </div>
                    ) : topForms?.map((form: TopFormData) => (
                      <div key={form.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{form.name}</div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <FormInput className="mr-1 h-3.5 w-3.5" />
                            {form.views.toLocaleString()} views
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getBadgeVariant(form.submissionRate)}>{form.submissionRate}%</Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Detailed metrics for all campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b">
                    <div className="col-span-2">Campaign Name</div>
                    <div className="text-right">Sent</div>
                    <div className="text-right">Open Rate</div>
                    <div className="text-right">Click Rate</div>
                    <div className="text-right">Conversion</div>
                    <div className="text-right">Revenue</div>
                  </div>
                  <div className="divide-y">
                    {isLoadingCampaigns ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-md" />
                        ))}
                      </div>
                    ) : campaignsData?.map((campaign: Campaign) => (
                      <div key={campaign.id} className="grid grid-cols-7 gap-4 p-4 items-center">
                        <div className="col-span-2 font-medium">{campaign.name}</div>
                        <div className="text-right">{campaign.sent.toLocaleString()}</div>
                        <div className="text-right">{campaign.openRate}%</div>
                        <div className="text-right">{campaign.clickRate}%</div>
                        <div className="text-right">{campaign.conversionRate}%</div>
                        <div className="text-right">${campaign.revenue.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Flow Performance</CardTitle>
                <CardDescription>Detailed metrics for automated flows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b">
                    <div className="col-span-2">Flow Name</div>
                    <div className="text-right">Recipients</div>
                    <div className="text-right">Open Rate</div>
                    <div className="text-right">Click Rate</div>
                    <div className="text-right">Conversion</div>
                    <div className="text-right">Revenue</div>
                  </div>
                  <div className="divide-y">
                    {isLoadingFlowsData ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-md" />
                        ))}
                      </div>
                    ) : flowsData?.map((flow: Flow) => (
                      <div key={flow.id} className="grid grid-cols-7 gap-4 p-4 items-center">
                        <div className="col-span-2 font-medium">{flow.name}</div>
                        <div className="text-right">{flow.recipients.toLocaleString()}</div>
                        <div className="text-right">{flow.openRate}%</div>
                        <div className="text-right">{flow.clickRate}%</div>
                        <div className="text-right">{flow.conversionRate}%</div>
                        <div className="text-right">${flow.revenue.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Performance</CardTitle>
                <CardDescription>Detailed metrics for all forms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                    <div className="col-span-2">Form Name</div>
                    <div className="text-right">Views</div>
                    <div className="text-right">Submissions</div>
                    <div className="text-right">Submission Rate</div>
                    <div className="text-right">Conversions</div>
                  </div>
                  <div className="divide-y">
                    {isLoadingFormsData ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-md" />
                        ))}
                      </div>
                    ) : formsData?.map((form: Form) => (
                      <div key={form.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                        <div className="col-span-2 font-medium">{form.name}</div>
                        <div className="text-right">{form.views.toLocaleString()}</div>
                        <div className="text-right">{form.submissions.toLocaleString()}</div>
                        <div className="text-right">{form.submissionRate}%</div>
                        <div className="text-right">{form.conversions.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, trend, icon, description, color }: MetricCardProps) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  }

  const trendColor = trend === "up" ? "text-emerald-600" : "text-rose-600"
  const TrendIcon = trend === "up" ? ArrowUp : ArrowDown

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorMap[color]} border`}>
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <div className={`flex items-center ${trendColor}`}>
            <TrendIcon className="mr-1 h-3.5 w-3.5" />
            <span>{change}</span>
          </div>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span className="text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ChannelItem({ name, value, color }: ChannelItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-sm">{name}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function getBadgeVariant(rate: number): "default" | "secondary" | "outline" {
  if (rate >= 30) return "outline"
  if (rate >= 20) return "default"
  return "secondary"
}
