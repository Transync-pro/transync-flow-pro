
import React from "react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Clock, Crown } from "lucide-react";

const TrialBanner = () => {
  const { subscriptionData, isOnTrial, isTrialExpired } = useSubscription();

  if (!subscriptionData || (!isOnTrial && !isTrialExpired)) {
    return null;
  }

  if (isTrialExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            <span className="font-medium">Your free trial has expired</span>
          </div>
          <Link to="/subscription">
            <Button variant="secondary" size="sm">
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isOnTrial) {
    const daysLeft = Math.max(0, subscriptionData.trial_days_left);
    return (
      <div className="bg-blue-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="mr-2 h-5 w-5" />
            <span className="font-medium">
              Free trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
            </span>
          </div>
          <Link to="/subscription">
            <Button variant="secondary" size="sm">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default TrialBanner;
