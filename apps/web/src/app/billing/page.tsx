"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import PageLayout from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, CreditCard, Download, TrendingUp, Zap, BarChart3, Shield, AlertCircle, Calendar, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { useBillingPlan, useUsage, useInvoices, useIsSandboxMode, useIsStripeLive, useCheckout, useBillingPortal } from "@/src/hooks/useBilling"

// Static plans data (normally would come from Stripe/backend)
const allPlans = [
  {
    name: "Starter",
    price: 29,
    interval: "month" as const,
    features: [
      "5 AI Agents",
      "10,000 API calls/mo",
      "5 GB Storage",
      "Basic analytics",
      "Email support",
      "5 team members",
    ],
  },
  {
    name: "Professional",
    price: 99,
    interval: "month" as const,
    popular: true,
    features: [
      "20 AI Agents",
      "100,000 API calls/mo",
      "50 GB Storage",
      "Advanced analytics",
      "Priority support",
      "20 team members",
      "Custom integrations",
      "White-label options",
    ],
  },
  {
    name: "Enterprise",
    price: 299,
    interval: "month" as const,
    features: [
      "Unlimited AI Agents",
      "Unlimited API calls",
      "Unlimited Storage",
      "Custom analytics",
      "24/7 dedicated support",
      "Unlimited team members",
      "Custom integrations",
      "White-label + API access",
      "SLA guarantee",
      "Advanced security",
    ],
  },
]

export default function BillingPage() {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month")
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)

  // Fetch real data
  const { data: currentPlan, isLoading: planLoading } = useBillingPlan()
  const { data: usageData, isLoading: usageLoading } = useUsage()
  const { data: invoices = [], isLoading: _invoicesLoading } = useInvoices()
  const _isSandbox = useIsSandboxMode()
  const isStripeLive = useIsStripeLive()

  // Stripe mutations
  const checkoutMutation = useCheckout()
  const portalMutation = useBillingPortal()

  const isLoading = planLoading || usageLoading

  const planSlugByLabel: Record<string, "starter" | "pro" | "enterprise"> = {
    Starter: "starter",
    Professional: "pro",
    Enterprise: "enterprise",
  }

  const resolvePriceId = (id: string | undefined) => id && id.length > 0 ? id : undefined

  const handleUpgrade = (planName: string) => {
    if (!isStripeLive) {
      alert("Stripe is not configured. Set NEXT_PUBLIC_STRIPE_LIVE=true and configure Stripe keys to enable live billing.")
      return
    }

    // TODO: Map plan names to Stripe price IDs from env
    const priceIds: Record<string, string> = {
      Starter:
        resolvePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER) ||
        resolvePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER) ||
        "",
      Professional:
        resolvePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) ||
        resolvePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) ||
        "",
      Enterprise:
        resolvePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE) ||
        resolvePriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE) ||
        "",
    }

    const priceId = priceIds[planName]
    if (!priceId) {
      alert(`Price ID not configured for ${planName}`)
      return
    }

    const plan = planSlugByLabel[planName]

    checkoutMutation.mutate({
      priceId,
      plan,
      successUrl: `${window.location.origin}/billing?success=true`,
      cancelUrl: `${window.location.origin}/billing?canceled=true`,
    })
  }

  const handleManageBilling = () => {
    if (!isStripeLive) {
      alert("Stripe is not configured. Billing management requires live Stripe keys.")
      return
    }

    portalMutation.mutate({
      returnUrl: `${window.location.origin}/billing`,
    })
  }

  const calculatePrice = (basePrice: number) => {
    return billingInterval === "year" ? Math.floor(basePrice * 0.8 * 12) : basePrice
  }

  return (
    <PageLayout
      title={
        <div className="flex items-center gap-3">
          <span>Billing & Subscription</span>
          {isStripeLive ? (
            <Badge variant="outline" className="bg-[#00FF94]/20 text-[#00FF94] border-[#00FF94]/30">
              Live • Stripe Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              Sandbox • Test Mode
            </Badge>
          )}
        </div>
      }
      subtitle="Manage your subscription, usage, and payment methods"
      actions={
        <Button 
          onClick={handleManageBilling}
          disabled={!isStripeLive || portalMutation.isPending}
          className="gap-2 bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90"
        >
          {portalMutation.isPending ? "Loading..." : "Manage Billing"}
          {isStripeLive && <ExternalLink className="h-4 w-4" />}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Current Plan Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="bg-gradient-to-br from-[#00D9FF]/20 to-[#B14BFF]/20 backdrop-blur-xl border-white/10 hover:border-[#00D9FF]/50 transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Current Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] bg-clip-text text-transparent">
                      {currentPlan?.name || "Professional"}
                    </div>
                    <p className="text-sm text-gray-400">${currentPlan?.price || 99}/month</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#00D9FF]/30 transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">API Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageData?.apiCalls.used.toLocaleString() || "0"}</div>
                    <p className="text-sm text-gray-400">of {usageData?.apiCalls.total.toLocaleString() || "0"} calls</p>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: usageData ? `${(usageData.apiCalls.used / usageData.apiCalls.total) * 100}%` : "0%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#B14BFF]/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData?.storage.used || 0} GB</div>
                <p className="text-sm text-gray-400">of {usageData?.storage.total || 0} GB</p>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: usageData ? `${(usageData.storage.used / usageData.storage.total) * 100}%` : "0%" }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-[#B14BFF] to-[#FF006B]"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#00FF94]/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Next Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Feb 1</div>
                <p className="text-sm text-gray-400">in 15 days</p>
                <div className="mt-2 flex items-center gap-1 text-[#00FF94]">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">Auto-renewal enabled</span>
                </div>
              </CardContent>
            </Card>
              </motion.div>
            </>
          )}
        </div>

        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList className="bg-[#0E0F1A]/60 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            {/* Billing Interval Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 p-1 bg-[#0E0F1A]/60 backdrop-blur-xl border border-white/10 rounded-lg">
                <Button
                  variant={billingInterval === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBillingInterval("month")}
                  className={
                    billingInterval === "month"
                      ? "bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90"
                      : "hover:bg-white/5"
                  }
                >
                  Monthly
                </Button>
                <Button
                  variant={billingInterval === "year" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBillingInterval("year")}
                  className={
                    billingInterval === "year"
                      ? "bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90"
                      : "hover:bg-white/5"
                  }
                >
                  Yearly
                  <Badge variant="secondary" className="ml-2 bg-[#00FF94]/20 text-[#00FF94] border-[#00FF94]/30">
                    Save 20%
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {allPlans.map((plan, i) => {
                const isCurrent = currentPlan?.name === plan.name
                return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className={`relative bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#00D9FF]/50 transition-all ${
                      plan.popular ? "border-[#00D9FF]/50 shadow-lg shadow-[#00D9FF]/20" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-0 right-0 flex justify-center">
                        <Badge className="bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] border-0">Most Popular</Badge>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="outline" className="bg-[#00FF94]/10 text-[#00FF94] border-[#00FF94]/30">
                          Current Plan
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-white">${calculatePrice(plan.price)}</span>
                          <span className="text-gray-400">/{billingInterval === "year" ? "year" : "month"}</span>
                        </div>
                        {billingInterval === "year" && (
                          <p className="text-xs text-[#00FF94] mt-1">Save ${plan.price * 12 * 0.2}/year</p>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-[#00FF94] shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleUpgrade(plan.name)}
                        className={`w-full gap-2 ${
                          isCurrent
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90"
                        }`}
                        disabled={isCurrent || checkoutMutation.isPending}
                      >
                        {checkoutMutation.isPending ? "Loading..." : isCurrent ? "Current Plan" : "Upgrade"}
                        {!isCurrent && isStripeLive && <ExternalLink className="h-4 w-4" />}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                )
              })}
            </div>

            {/* Enterprise Contact */}
            <Card className="bg-gradient-to-r from-[#B14BFF]/10 to-[#00D9FF]/10 border-[#B14BFF]/20">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Need a custom plan?</h3>
                  <p className="text-sm text-gray-400">
                    Contact our sales team for enterprise pricing and custom features
                  </p>
                </div>
                <Button className="bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90">Contact Sales</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#00D9FF]" />
                    API Usage Breakdown
                  </CardTitle>
                  <CardDescription>Current billing cycle (Jan 1 - Jan 31)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Total Calls</span>
                      <span className="font-semibold">
                        {usageData?.apiCalls?.used?.toLocaleString() || "0"} / {usageData?.apiCalls?.total?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]"
                        style={{ width: `${usageData?.apiCalls ? (usageData.apiCalls.used / usageData.apiCalls.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    {[
                      { name: "Content Generation", calls: 18420, percent: 42, color: "#00D9FF" },
                      { name: "SEO Analysis", calls: 12980, percent: 30, color: "#B14BFF" },
                      { name: "Social Media", calls: 8672, percent: 20, color: "#FF006B" },
                      { name: "Email Marketing", calls: 3219, percent: 8, color: "#00FF94" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-gray-400">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">{item.calls.toLocaleString()}</span>
                          <span style={{ color: item.color }}>{item.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#00FF94]" />
                    Usage Trends
                  </CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Area Chart: API Calls Over Time</p>
                      <p className="text-xs mt-1">(Integrate with recharts/chart.js)</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#00FF94]" />
                      <span className="text-[#00FF94]">+12.3%</span>
                    </div>
                    <span className="text-gray-400">vs previous period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle>Storage by Type</CardTitle>
                  <CardDescription>50 GB total capacity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Donut Chart: Storage Distribution</p>
                      <p className="text-xs mt-1">(Documents, Images, Videos, Other)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle>Activity Heatmap</CardTitle>
                  <CardDescription>Peak usage hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-white/5">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Heatmap: Hourly Activity</p>
                      <p className="text-xs mt-1">(Days vs Hours grid)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Projection */}
            <Card className="bg-gradient-to-r from-[#FF006B]/10 to-[#B14BFF]/10 border-[#FF006B]/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-[#FF006B]" />
                      Usage Alert
                    </h3>
                    <p className="text-sm text-gray-400">
                      You&apos;re using 43% of your API quota. At current rate, you&apos;ll exceed your limit on Jan 22.
                    </p>
                  </div>
                  <Button variant="outline" className="bg-transparent border-[#FF006B]/30 hover:bg-[#FF006B]/10">
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>View and download past invoices</CardDescription>
                  </div>
                  <Button variant="outline" className="gap-2 bg-transparent border-white/10 hover:border-[#00D9FF]/50">
                    <Download className="h-4 w-4" />
                    Export All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoices.map((invoice, i) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#00D9FF]/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-[#00D9FF]/10 group-hover:bg-[#00D9FF]/20 transition-all">
                          <CreditCard className="h-5 w-5 text-[#00D9FF]" />
                        </div>
                        <div>
                          <div className="font-semibold">{invoice.id}</div>
                          <div className="text-sm text-gray-400">{new Date(invoice.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">${invoice.amount.toFixed(2)}</div>
                          <Badge variant="outline" className="bg-[#00FF94]/10 text-[#00FF94] border-[#00FF94]/30">
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your payment methods</CardDescription>
                  </div>
                  <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90">
                        <CreditCard className="h-4 w-4" />
                        Add Card
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0E0F1A] border-white/10">
                      <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>Enter your card details to add a new payment method</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            className="bg-white/5 border-white/10 focus:border-[#00D9FF]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              className="bg-white/5 border-white/10 focus:border-[#00D9FF]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input
                              id="cvc"
                              placeholder="123"
                              className="bg-white/5 border-white/10 focus:border-[#00D9FF]"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Cardholder Name</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            className="bg-white/5 border-white/10 focus:border-[#00D9FF]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddCardOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]">Add Card</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-[#00D9FF]/10 to-[#B14BFF]/10 border border-[#00D9FF]/20 hover:border-[#00D9FF]/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold">•••• •••• •••• 4242</div>
                        <div className="text-sm text-gray-400">Expires 12/2025</div>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] border-0">Default</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent border-white/10">
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#FF006B] bg-transparent border-[#FF006B]/30 hover:bg-[#FF006B]/10"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="p-6 text-center text-gray-400 border border-dashed border-white/10 rounded-lg bg-white/5">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50 text-[#00FF94]" />
                  <p className="text-sm">All payments are secured with 256-bit SSL encryption</p>
                  <p className="text-xs mt-1">Your card information is never stored on our servers</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>Manage your billing preferences and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-400">Receive billing updates via email</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-[#00FF94]/10 border-[#00FF94]/30 text-[#00FF94]">
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-Renewal</h4>
                      <p className="text-sm text-gray-400">Automatically renew subscription</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-[#00FF94]/10 border-[#00FF94]/30 text-[#00FF94]">
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Usage Alerts</h4>
                      <p className="text-sm text-gray-400">Get notified when reaching quota limits</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-[#00FF94]/10 border-[#00FF94]/30 text-[#00FF94]">
                      Enabled
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h4 className="font-medium mb-4">Billing Address</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input defaultValue="John" className="bg-white/5 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input defaultValue="Doe" className="bg-white/5 border-white/10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input defaultValue="123 Main St" className="bg-white/5 border-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input defaultValue="San Francisco" className="bg-white/5 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <Label>ZIP Code</Label>
                        <Input defaultValue="94102" className="bg-white/5 border-white/10" />
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]">Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
