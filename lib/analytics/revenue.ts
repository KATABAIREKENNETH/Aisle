import { getCurrentUser } from '../supabase/auth';
import { createRevenueTracking, updateRevenueTracking } from '../api/analytics';

// Track revenue/subscription payment
export async function trackRevenue(
  amount: number,
  context?: {
    subscriptionType?: string;
    currency?: string;
    paymentMethod?: string;
    transactionId?: string;
    weddingId?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const user = await getCurrentUser();

    const revenue = await createRevenueTracking({
      user_id: user?.id,
      wedding_id: context?.weddingId,
      subscription_type: context?.subscriptionType,
      amount,
      currency: context?.currency || 'USD',
      payment_method: context?.paymentMethod,
      transaction_id: context?.transactionId,
      status: 'pending',
      metadata: context?.metadata as any,
    });

    return revenue;
  } catch (error) {
    console.error('Failed to track revenue:', error);
    throw error;
  }
}

// Mark revenue as completed
export async function completeRevenue(
  transactionId: string,
  context?: {
    transactionFee?: number;
    netAmount?: number;
    metadata?: Record<string, any>;
  }
) {
  try {
    const revenue = await updateRevenueTracking(transactionId, {
      status: 'completed',
      transaction_fee: context?.transactionFee,
      net_amount: context?.netAmount,
      metadata: context?.metadata as any,
    });

    return revenue;
  } catch (error) {
    console.error('Failed to complete revenue tracking:', error);
    throw error;
  }
}

// Mark revenue as failed
export async function failRevenue(
  transactionId: string,
  reason: string,
  context?: { metadata?: Record<string, any> }
) {
  try {
    const revenue = await updateRevenueTracking(transactionId, {
      status: 'failed',
      metadata: {
        ...(context?.metadata as any),
        failure_reason: reason,
      },
    });

    return revenue;
  } catch (error) {
    console.error('Failed to mark revenue as failed:', error);
    throw error;
  }
}

// Process refund
export async function processRefund(
  transactionId: string,
  refundAmount: number,
  context?: { metadata?: Record<string, any> }
) {
  try {
    const revenue = await updateRevenueTracking(transactionId, {
      status: 'refunded',
      metadata: {
        ...(context?.metadata as any),
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
      },
    });

    return revenue;
  } catch (error) {
    console.error('Failed to process refund:', error);
    throw error;
  }
}

// React Hook for revenue tracking
export function useRevenueTracking() {
  const trackPayment = async (
    amount: number,
    paymentContext?: Parameters<typeof trackRevenue>[1]
  ) => {
    return trackRevenue(amount, paymentContext);
  };

  const completePayment = async (
    transactionId: string,
    completeContext?: Parameters<typeof completeRevenue>[1]
  ) => {
    return completeRevenue(transactionId, completeContext);
  };

  const failPayment = async (
    transactionId: string,
    reason: string,
    failContext?: { metadata?: Record<string, any> }
  ) => {
    return failRevenue(transactionId, reason, failContext);
  };

  const refundPayment = async (
    transactionId: string,
    refundAmount: number,
    refundContext?: { metadata?: Record<string, any> }
  ) => {
    return processRefund(transactionId, refundAmount, refundContext);
  };

  return {
    trackPayment,
    completePayment,
    failPayment,
    refundPayment,
  };
}
