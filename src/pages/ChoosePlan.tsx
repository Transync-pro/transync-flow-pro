import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const plans = [
  { id: "starter", name: "Starter", description: "For small teams" },
  { id: "business", name: "Business", description: "For growing teams" },
  { id: "enterprise", name: "Enterprise", description: "For large orgs" },
];

// This page is used for both /pricing and /subscription
export default function ChoosePlan() {
  const { user } = useAuth();
  const { refresh } = useSubscription();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChoose = async () => {
    if (!selected) return;
    if (!user) {
      // Optionally: localStorage.setItem("pendingPlan", selected);
      navigate("/signup");
      return;
    }
    setLoading(true);
    await supabase
      .from("user_subscriptions")
      .update({ plan_name: selected })
      .eq("user_id", user.id);
    await refresh();
    setLoading(false);
    navigate("/authenticate");
  };

  return (
    <div>
      <h2>Choose Your Plan</h2>
      <ul>
        {plans.map(plan => (
          <li key={plan.id}>
            <label>
              <input
                type="radio"
                value={plan.id}
                checked={selected === plan.id}
                onChange={() => setSelected(plan.id)}
              />
              <b>{plan.name}</b>: {plan.description}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={handleChoose} disabled={!selected || loading}>
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
