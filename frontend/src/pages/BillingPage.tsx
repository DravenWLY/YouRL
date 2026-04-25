import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumCheckoutRequest } from '@/types';

const PLAN_OPTIONS = [
  {
    id: 'monthly' as const,
    name: 'Premium Monthly',
    price: '$4.99/mo',
    description: 'Best for trying premium features with monthly flexibility.',
  },
  {
    id: 'annual' as const,
    name: 'Premium Annual',
    price: '$49.99/yr',
    description: 'Lower effective monthly cost for longer-term use.',
  },
];

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, completePremiumCheckout, cancelPremium } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [cardholderName, setCardholderName] = useState('');
  const [billingEmail, setBillingEmail] = useState(user?.email ?? '');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState(String(new Date().getFullYear() + 1));
  const [cvc, setCvc] = useState('123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPremium = Boolean(user?.isPaid);
  const currentPlanLabel = useMemo(() => {
    if (!user?.premiumPlan || user.premiumPlan === 'free') {
      return 'Free';
    }
    return user.premiumPlan === 'annual' ? 'Premium Annual' : 'Premium Monthly';
  }, [user?.premiumPlan]);

  if (!user) {
    return null;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const request: PremiumCheckoutRequest = {
      planId: selectedPlan,
      billingEmail,
      cardholderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvc,
    };

    try {
      setSubmitting(true);
      await completePremiumCheckout(request);
      setSuccessMessage('Test checkout succeeded. Your premium subscription is now active.');
      navigate('/settings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setSuccessMessage(null);
    try {
      setSubmitting(true);
      await cancelPremium();
      setSuccessMessage('Auto-renew has been canceled. Premium stays active until the current billing period ends.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Billing</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          This prototype uses a test checkout flow. No real payment is charged.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Status</span>
              <span className="font-medium capitalize">{user.subscriptionStatus || 'inactive'}</span>
            </div>
            <div className="flex justify-between">
              <span>Plan</span>
              <span className="font-medium">{currentPlanLabel}</span>
            </div>
            <div className="flex justify-between">
              <span>Auto renew</span>
              <span className="font-medium">{user.autoRenew ? 'On' : 'Off'}</span>
            </div>
            {user.currentPeriodEnd && (
              <div className="flex justify-between gap-4">
                <span>Current period end</span>
                <span className="font-medium text-right">{new Date(user.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {isPremium && user.autoRenew && (
            <button onClick={handleCancel} disabled={submitting} className="btn-secondary w-full mt-6">
              Cancel Auto-Renew
            </button>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Premium Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {PLAN_OPTIONS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`text-left border rounded-xl p-4 transition-colors ${
                  selectedPlan === plan.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <span className="text-primary-700 font-semibold">{plan.price}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Email</label>
                <input
                  type="email"
                  className="input-primary w-full"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  className="input-primary w-full"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  autoComplete="cc-name"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input
                type="text"
                className="input-primary w-full"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                autoComplete="cc-number"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-2">
                Use the prototype success card <code>4242 4242 4242 4242</code>. Use <code>4000 0000 0000 0002</code> to simulate a declined payment.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exp. Month</label>
                <input type="text" className="input-primary w-full" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} autoComplete="cc-exp-month" disabled={submitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exp. Year</label>
                <input type="text" className="input-primary w-full" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} autoComplete="cc-exp-year" disabled={submitting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                <input type="text" className="input-primary w-full" value={cvc} onChange={(e) => setCvc(e.target.value)} autoComplete="cc-csc" disabled={submitting} />
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
            {successMessage && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{successMessage}</div>}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Processing...' : 'Continue to Test Checkout'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
