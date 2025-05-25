import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Subscription = () => {
  const [billingAnnually, setBillingAnnually] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { subscriptionData, isOnTrial, isTrialExpired } = useSubscription();

  const plans = [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for small businesses just getting started with QuickBooks.",
      monthlyPrice: 9.99,
      annualPrice: 95.88, // $7.99 * 12
      features: [
        "Connect 1 QuickBooks company",
        "Bulk import up to 1,000 records/month",
        "Bulk export up to 1,000 records/month",
        "Basic field mapping",
        "Standard support",
        "Community access"
      ],
      popular: false,
      cta: "Get Started"
    },
    {
      id: "business",
      name: "Business",
      description: "Ideal for growing businesses with more QuickBooks data to manage.",
      monthlyPrice: 19.99,
      annualPrice: 203.88, // $16.99 * 12
      features: [
        "Connect 3 QuickBooks companies",
        "Bulk import up to 10,000 records/month",
        "Bulk export up to 10,000 records/month",
        "Advanced field mapping",
        "Bulk delete functionality",
        "Save import/export templates",
        "Priority support",
        "API access"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For larger organizations with complex QuickBooks needs.",
      monthlyPrice: 29.99,
      annualPrice: 323.88, // $26.99 * 12
      features: [
        "Connect unlimited QuickBooks companies",
        "Unlimited imports and exports",
        "Custom field mapping with AI assistance",
        "Advanced data validation rules",
        "Automated scheduled operations",
        "Full audit history",
        "Dedicated support",
        "Custom integration options",
        "Team collaboration features"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planName: planId,
          billingCycle: billingAnnually ? 'annual' : 'monthly',
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonText = (plan: any) => {
    if (isTrialExpired) {
      return "Upgrade Now";
    }
    if (isOnTrial) {
      return "Upgrade Plan";
    }
    return plan.cta;
  };

  const getTrialStatusMessage = () => {
    if (isOnTrial && subscriptionData) {
      const daysLeft = Math.max(0, subscriptionData.trial_days_left);
      return `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free trial.`;
    }
    if (isTrialExpired) {
      return "Your free trial has expired. Choose a plan to continue using TransyncPro.";
    }
    return null;
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Choose the plan that's right for your business. All plans include our core QuickBooks data management features with a free month to get started.
          </p>
          
          {getTrialStatusMessage() && (
            <div className="mb-8">
              <div className={`inline-block px-6 py-3 rounded-lg text-lg font-medium ${
                isTrialExpired ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {getTrialStatusMessage()}
              </div>
            </div>
          )}
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <span className={`mr-3 text-lg ${billingAnnually ? 'text-white/70' : 'text-white font-medium'}`}>
              Monthly
            </span>
            <Switch 
              checked={billingAnnually}
              onCheckedChange={setBillingAnnually}
              className="bg-white/30 data-[state=checked]:bg-white"
            />
            <span className={`ml-3 text-lg ${billingAnnually ? 'text-white font-medium' : 'text-white/70'}`}>
              Annually <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`rounded-xl border ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-gray-200'} p-8 flex flex-col h-full relative`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-transyncpro-heading mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  {(!isTrialExpired && subscriptionData?.subscription_status !== 'active') && (
                    <div className="mb-2">
                      <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full inline-block mb-4">
                        First month FREE
                      </div>
                    </div>
                  )}
                  <div className="mb-6">
                    <p className="text-4xl font-bold">
                      ${billingAnnually ? (plan.annualPrice / 12).toFixed(2) : plan.monthlyPrice}
                      <span className="text-lg font-normal text-gray-500">/month</span>
                    </p>
                    {billingAnnually && (
                      <p className="text-sm text-gray-500">
                        Billed annually (${plan.annualPrice.toFixed(2)}/year)
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-grow">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {plan.id === 'enterprise' ? (
                  <Link to="/contact">
                    <Button 
                      className={`w-full py-6 ${plan.popular ? 'bg-transyncpro-button hover:bg-transyncpro-button/90' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Contact Sales
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`w-full py-6 ${plan.popular ? 'bg-transyncpro-button hover:bg-transyncpro-button/90' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      getButtonText(plan)
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table (Visible only on larger screens) */}
      <section className="py-16 bg-gray-50 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Plan Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-4 px-6 text-left font-medium text-gray-700">Feature</th>
                  <th className="py-4 px-6 text-center font-medium text-gray-700">Starter</th>
                  <th className="py-4 px-6 text-center font-medium text-gray-700 bg-primary/5">Business</th>
                  <th className="py-4 px-6 text-center font-medium text-gray-700">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">QuickBooks Companies</td>
                  <td className="py-4 px-6 text-center">1</td>
                  <td className="py-4 px-6 text-center bg-primary/5">3</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">Bulk Import Limit</td>
                  <td className="py-4 px-6 text-center">1,000/month</td>
                  <td className="py-4 px-6 text-center bg-primary/5">10,000/month</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">Bulk Export Limit</td>
                  <td className="py-4 px-6 text-center">1,000/month</td>
                  <td className="py-4 px-6 text-center bg-primary/5">10,000/month</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">Bulk Delete</td>
                  <td className="py-4 px-6 text-center">—</td>
                  <td className="py-4 px-6 text-center bg-primary/5">✓</td>
                  <td className="py-4 px-6 text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">Field Mapping</td>
                  <td className="py-4 px-6 text-center">Basic</td>
                  <td className="py-4 px-6 text-center bg-primary/5">Advanced</td>
                  <td className="py-4 px-6 text-center">AI-Assisted</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">Save Templates</td>
                  <td className="py-4 px-6 text-center">—</td>
                  <td className="py-4 px-6 text-center bg-primary/5">✓</td>
                  <td className="py-4 px-6 text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">API Access</td>
                  <td className="py-4 px-6 text-center">—</td>
                  <td className="py-4 px-6 text-center bg-primary/5">✓</td>
                  <td className="py-4 px-6 text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">Automated Scheduling</td>
                  <td className="py-4 px-6 text-center">—</td>
                  <td className="py-4 px-6 text-center bg-primary/5">—</td>
                  <td className="py-4 px-6 text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 font-medium">Support Level</td>
                  <td className="py-4 px-6 text-center">Standard</td>
                  <td className="py-4 px-6 text-center bg-primary/5">Priority</td>
                  <td className="py-4 px-6 text-center">Dedicated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Do you offer a free trial?</h3>
              <p className="text-gray-600">Yes, all plans include a completely free first month so you can experience the full power of TransyncPro before committing to a subscription.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. For Enterprise plans, we also offer invoicing options.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Is there a setup fee?</h3>
              <p className="text-gray-600">No, there are no setup fees for any of our plans. You only pay the subscription price shown after your free month.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Do you offer discounts for non-profits?</h3>
              <p className="text-gray-600">Yes, we offer special pricing for qualified non-profit organizations. Please contact our sales team for more information.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Subscription;
