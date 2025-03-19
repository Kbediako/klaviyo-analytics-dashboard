"use client"

import { useState } from "react"
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
          <MetricCard
            title="Total Revenue"
            value="$42,582"
            change="+12.5%"
            trend="up"
            icon={<DollarSign className="h-4 w-4" />}
            description="vs previous period"
            color="emerald"
          />
          <MetricCard
            title="Active Subscribers"
            value="24,853"
            change="+5.1%"
            trend="up"
            icon={<Users className="h-4 w-4" />}
            description="vs previous period"
            color="blue"
          />
          <MetricCard
            title="Conversion Rate"
            value="18.5%"
            change="-1.2%"
            trend="down"
            icon={<ShoppingCart className="h-4 w-4" />}
            description="vs previous period"
            color="violet"
          />
          <MetricCard
            title="Form Submissions"
            value="3,842"
            change="+8.3%"
            trend="up"
            icon={<FormInput className="h-4 w-4" />}
            description="vs previous period"
            color="amber"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
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
                  <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                    <LineChart className="h-8 w-8 text-muted-foreground" />
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
                    <PieChart className="h-8 w-8 text-muted-foreground" />
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
                    {segments.map((segment) => (
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
                    {flows.map((flow) => (
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
                    {forms.map((form) => (
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
                    {campaigns.map((campaign) => (
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
                    {flowsDetailed.map((flow) => (
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
                    {formsDetailed.map((form) => (
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

function MetricCard({ title, value, change, trend, icon, description, color }) {
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

function ChannelItem({ name, value, color }) {
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

function getBadgeVariant(rate) {
  if (rate >= 30) return "success"
  if (rate >= 20) return "default"
  return "secondary"
}

// Sample data
const campaigns = [
  {
    id: 1,
    name: "Summer Sale Announcement",
    sent: 24850,
    openRate: 42.8,
    clickRate: 18.5,
    conversionRate: 8.2,
    revenue: 12580,
  },
  {
    id: 2,
    name: "New Product Launch",
    sent: 18650,
    openRate: 38.5,
    clickRate: 15.2,
    conversionRate: 6.8,
    revenue: 9840,
  },
  {
    id: 3,
    name: "Customer Feedback Survey",
    sent: 15420,
    openRate: 31.2,
    clickRate: 12.8,
    conversionRate: 4.5,
    revenue: 3250,
  },
  { id: 4, name: "Weekly Newsletter", sent: 28750, openRate: 24.7, clickRate: 9.3, conversionRate: 3.2, revenue: 4680 },
  {
    id: 5,
    name: "Exclusive Member Discount",
    sent: 12580,
    openRate: 35.9,
    clickRate: 16.4,
    conversionRate: 7.5,
    revenue: 8450,
  },
]

const segments = [
  { id: 1, name: "VIP Customers", conversionRate: 42, count: 5842, revenue: 28450 },
  { id: 2, name: "Recent Purchasers", conversionRate: 35, count: 12480, revenue: 42680 },
  { id: 3, name: "Cart Abandoners", conversionRate: 28, count: 8640, revenue: 15280 },
  { id: 4, name: "Email Engaged", conversionRate: 22, count: 18540, revenue: 24850 },
]

const flows = [
  { id: 1, name: "Welcome Series", recipients: 8450, conversionRate: 32 },
  { id: 2, name: "Abandoned Cart", recipients: 6280, conversionRate: 28 },
  { id: 3, name: "Post-Purchase", recipients: 12480, conversionRate: 24 },
  { id: 4, name: "Win-Back", recipients: 5840, conversionRate: 18 },
]

const flowsDetailed = [
  {
    id: 1,
    name: "Welcome Series",
    recipients: 8450,
    openRate: 68.5,
    clickRate: 42.8,
    conversionRate: 32,
    revenue: 24850,
  },
  {
    id: 2,
    name: "Abandoned Cart",
    recipients: 6280,
    openRate: 58.2,
    clickRate: 38.5,
    conversionRate: 28,
    revenue: 18650,
  },
  {
    id: 3,
    name: "Post-Purchase",
    recipients: 12480,
    openRate: 52.4,
    clickRate: 32.6,
    conversionRate: 24,
    revenue: 15420,
  },
  { id: 4, name: "Win-Back", recipients: 5840, openRate: 42.8, clickRate: 28.4, conversionRate: 18, revenue: 9840 },
  {
    id: 5,
    name: "Browse Abandonment",
    recipients: 4280,
    openRate: 38.5,
    clickRate: 24.2,
    conversionRate: 15,
    revenue: 6580,
  },
  {
    id: 6,
    name: "Re-Engagement",
    recipients: 7850,
    openRate: 32.6,
    clickRate: 18.4,
    conversionRate: 12,
    revenue: 4250,
  },
]

const forms = [
  { id: 1, name: "Newsletter Signup", views: 12480, submissionRate: 38 },
  { id: 2, name: "Exit Intent Popup", views: 28450, submissionRate: 24 },
  { id: 3, name: "Product Registration", views: 8640, submissionRate: 42 },
  { id: 4, name: "Contact Form", views: 5840, submissionRate: 32 },
]

const formsDetailed = [
  { id: 1, name: "Newsletter Signup", views: 12480, submissions: 4742, submissionRate: 38, conversions: 1850 },
  { id: 2, name: "Exit Intent Popup", views: 28450, submissions: 6828, submissionRate: 24, conversions: 2450 },
  { id: 3, name: "Product Registration", views: 8640, submissions: 3628, submissionRate: 42, conversions: 1580 },
  { id: 4, name: "Contact Form", views: 5840, submissions: 1868, submissionRate: 32, conversions: 845 },
  { id: 5, name: "Discount Popup", views: 18650, submissions: 5595, submissionRate: 30, conversions: 2240 },
  { id: 6, name: "Feedback Survey", views: 7850, submissions: 1962, submissionRate: 25, conversions: 580 },
]

