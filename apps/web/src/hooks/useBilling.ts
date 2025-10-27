/**
 * React Query hooks for Billing data
 */

import { useQuery, useMutation, UseQueryResult, UseMutationResult } from "@tanstack/react-query"
import {
  getPlan,
  getUsage,
  getInvoices,
  getBillingInfo,
  isSandboxMode,
  isStripeLive,
  createCheckoutSession,
  createPortalSession,
  type BillingPlan,
  type UsageData,
  type Invoice,
  type BillingInfo,
} from "@/src/lib/adapters/billing"

/**
 * Hook to fetch billing plan
 */
export function useBillingPlan(): UseQueryResult<BillingPlan, Error> {
  return useQuery({
    queryKey: ["billing", "plan"],
    queryFn: getPlan,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch usage statistics
 */
export function useUsage(): UseQueryResult<UsageData, Error> {
  return useQuery({
    queryKey: ["billing", "usage"],
    queryFn: getUsage,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

/**
 * Hook to fetch invoice history
 */
export function useInvoices(): UseQueryResult<Invoice[], Error> {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: getInvoices,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch complete billing information
 */
export function useBillingInfo(): UseQueryResult<BillingInfo, Error> {
  return useQuery({
    queryKey: ["billing", "info"],
    queryFn: getBillingInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if we're in sandbox mode
 */
export function useIsSandboxMode(): boolean {
  return isSandboxMode()
}

/**
 * Hook to check if Stripe is live
 */
export function useIsStripeLive(): boolean {
  return isStripeLive()
}

/**
 * Hook to create checkout session (redirect to Stripe)
 */
export function useCheckout(): UseMutationResult<
  { url: string },
  Error,
  { priceId: string; plan?: "starter" | "pro" | "enterprise"; successUrl: string; cancelUrl: string }
> {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    },
  })
}

/**
 * Hook to create billing portal session (manage subscription)
 */
export function useBillingPortal(): UseMutationResult<{ url: string }, Error, { returnUrl: string }> {
  return useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => {
      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url
      }
    },
  })
}
