import React, { useState, useEffect } from "react";
import { 
  Check, Shield, Sparkles, Building2, Flame, BadgeAlert, Clock, 
  HelpCircle, RefreshCw, Key, AlertTriangle, Terminal, CreditCard,
  Layers, Lock, Database, ArrowUpRight, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Plan {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
  gradient: string;
}

const DEFAULT_PLANS: Plan[] = [
  {
    name: "Starter",
    price: 999,
    description: "Essential workflow compliance tracking for small teams.",
    features: [
      "Up to 10 active corporate personnel",
      "Standard PDF Voucher generation",
      "Continuous Firestore real-time sync",
      "Manual multi-department routing",
      "Email alerts for task approvals"
    ],
    color: "slate",
    gradient: "from-slate-700 to-slate-900"
  },
  {
    name: "Business",
    price: 4999,
    description: "Advanced controls & complete reporting for growing enterprises.",
    features: [
      "Up to 100 active corporate personnel",
      "Fully customized Voucher Numbering prefix configurations",
      "Advanced BI Reports & interactive chart analysis",
      "Automated multi-level smart approval workflows",
      "Saved PDF document archiving vault",
      "Priority business-hours tech support"
    ],
    popular: true,
    color: "indigo",
    gradient: "from-indigo-600 to-slate-900"
  },
  {
    name: "Enterprise",
    price: 19999,
    description: "High-grade continuous regulatory compliance & SLAs.",
    features: [
      "Unlimited corporate users & departments",
      "Regulatory-grade audit logs dashboard with search",
      "Dynamic GST & calculation logic configurations",
      "Custom commission rate rule generators",
      "Dedicated account representative & 24/7 SLA",
      "Developer API credentials & webhook integrations"
    ],
    color: "amber",
    gradient: "from-amber-600 to-slate-900"
  }
];

interface SubscriptionBillingProps {
  currentUser: any;
  apiHeaders: Record<string, string>;
  onRefreshUser?: () => void;
}

export const SubscriptionBilling: React.FC<SubscriptionBillingProps> = ({ 
  currentUser, 
  apiHeaders,
  onRefreshUser 
}) => {
  const [config, setConfig] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [paymentLogs, setPaymentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  
  // Sandbox states
  const [sandboxModal, setSandboxModal] = useState<any>(null);

  const fetchConfigAndStatus = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [confRes, statRes] = await Promise.all([
        fetch("/api/billing/config", { headers: apiHeaders }),
        fetch("/api/billing/status", { headers: apiHeaders })
      ]);

      if (confRes.ok && statRes.ok) {
        const confData = await confRes.json();
        const statData = await statRes.json();
        setConfig(confData);
        setStatus(statData);
      } else {
        setErrorMsg("Failed to retrieve latest subscription configurations.");
      }
    } catch (err: any) {
      setErrorMsg("Network connection offline: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentLogs = async () => {
    try {
      // payment logs can be bootstrapped from central local persistence
      const res = await fetch("/api/audit-logs", { headers: apiHeaders });
      if (res.ok) {
        // Payment logs can be parsed or we can mock/fetch direct logs list if any
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConfigAndStatus();
    fetchPaymentLogs();
  }, [apiHeaders]);

  const handleSubscribe = async (planName: string) => {
    setActionLoading(planName);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const res = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan: planName })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Subscription initialization failed.");
      }

      const checkoutDetails = await res.json();

      if (checkoutDetails.isDemo) {
        // Trigger Sandbox Popup Simulator for seamless user preview
        setSandboxModal(checkoutDetails);
      } else {
        // Real Razorpay Checkout flow
        openRazorpayCheckout(checkoutDetails);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRazorpayCheckout = (details: any) => {
    // 1. Double check Razorpay scripts are loaded
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => initRealRazorpayModal(details);
      document.body.appendChild(script);
    } else {
      initRealRazorpayModal(details);
    }
  };

  const initRealRazorpayModal = (details: any) => {
    if (!window.Razorpay || !config) return;

    const options = {
      key: config.keyId,
      subscription_id: details.subscriptionId,
      name: "APROFLOW Workspace",
      description: `Upgrade to ${details.planName} Tier`,
      image: "/icon.png",
      handler: async function (response: any) {
        setActionLoading(details.planName);
        try {
          const verifyRes = await fetch("/api/billing/verify-payment", {
            method: "POST",
            headers: {
              ...apiHeaders,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              subscriptionId: response.razorpay_subscription_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan: details.planName,
              isDemo: false
            })
          });

          if (!verifyRes.ok) {
            const errData = await verifyRes.json();
            throw new Error(errData.error || "Payment signature verify aborted.");
          }

          setSuccessMsg(`Outstanding Success! Subscription initialized. Your ${details.planName} tier is now active.`);
          fetchConfigAndStatus();
          if (onRefreshUser) onRefreshUser();
        } catch (e: any) {
          setErrorMsg("Signature verification failing: " + e.message);
        } finally {
          setActionLoading(null);
        }
      },
      prefill: {
        name: currentUser.name || "Administrator",
        email: currentUser.email || "billing@aproflow.com"
      },
      theme: {
        color: "#0F172A"
      }
    };

    const rzpInstance = new window.Razorpay(options);
    rzpInstance.open();
  };

  const submitMockSandboxPayment = async (simulateSuccess: boolean) => {
    if (!sandboxModal) return;
    
    setActionLoading(sandboxModal.planName);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      subscriptionId: sandboxModal.subscriptionId,
      customerId: sandboxModal.customerId,
      paymentId: `pay_sandbox_${Math.random().toString(36).substring(2, 10)}`,
      signature: "signature_sandbox_verified_success",
      plan: sandboxModal.planName,
      isDemo: true,
      simulateSuccess
    };

    try {
      if (!simulateSuccess) {
        throw new Error("Sandbox simulator payment aborted by tester.");
      }

      const res = await fetch("/api/billing/verify-payment", {
        method: "POST",
        headers: {
          ...apiHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Sandbox transaction state sync failing.");
      }

      setSuccessMsg(`Sandbox Success! Simulated payment credited. Plan ${sandboxModal.planName} is active.`);
      setSandboxModal(null);
      fetchConfigAndStatus();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setErrorMsg(err.message);
      setSandboxModal(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateExpiry = async () => {
    if (!window.confirm("Simulate immediate subscription plan expiry to test Read Only workspace restrictions?")) {
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/billing/trigger-expire", {
        method: "POST",
        headers: apiHeaders
      });

      if (res.ok) {
        setSuccessMsg("Plan expired! Your enterprise workspace is now restricted to Read-Only mode for compliance evaluation.");
        fetchConfigAndStatus();
        if (onRefreshUser) onRefreshUser();
      } else {
        const badPayload = await res.json();
        setErrorMsg(badPayload.error || "Failed to trigger simulated expiration.");
      }
    } catch (err: any) {
      setErrorMsg("Network expiry simulation error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlanActive = (planName: string) => {
    if (!status) return planName === "Free";
    if (status.status !== "active") return false;
    return status.plan === planName;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800" id="billing-subscriptions-page">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Coins className="h-6 w-6 text-indigo-600" />
            Pricing & Subscription Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose a plan to upgrade corporate capacity or manage active enterprise billing.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {config?.isDemo && (
            <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px] shadow-sm animate-pulse">
              <Terminal className="h-3.5 w-3.5" />
              Demo Simulator Mode Active
            </span>
          )}
          
          <button
            onClick={fetchConfigAndStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 font-sans cursor-pointer transition shadow-sm"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Sync Status
          </button>
        </div>
      </div>

      {/* Global Alerts Feed */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs font-medium flex items-start gap-2 animate-bounce-short">
          <BadgeAlert className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-xs font-medium flex items-start gap-2">
          <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Expiry / Lock indicator warning banner */}
      {status && status.status === "expired" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex gap-3">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workspace Restrictions Enforced: Read Only Active</h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
                The subscription plan for enterprise code <strong className="font-mono text-xs">{currentUser?.enterpriseCode}</strong> has expired. Mutating actions on voucher forms and audit rules are locked until upgraded or reactivated.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSubscribe("Business")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            Reactivate Business Plan
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grid of Pricing Plans */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
          <span className="text-xs font-medium">Retrieving plan tiers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEFAULT_PLANS.map((plan) => {
            const isActive = isCurrentPlanActive(plan.name);
            const isStarter = plan.name === "Starter";
            
            return (
              <div 
                key={plan.name}
                className={`relative bg-white rounded-3xl border transition-all duration-300 flex flex-col min-h-[500px] shadow-sm hover:shadow-xl ${
                  isActive 
                    ? "ring-2 ring-indigo-600 border-indigo-600" 
                    : plan.popular 
                      ? "border-slate-800" 
                      : "border-slate-200"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <span className="absolute -top-3 left-1/3 right-1/3 mx-auto text-center bg-indigo-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    Popular Choose
                  </span>
                )}

                {/* Card Title & Pricing info */}
                <div className="p-6 border-b border-slate-100 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tight text-slate-900">{plan.name} Plan</h3>
                    {isActive && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
                  
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">₹{plan.price.toLocaleString("en-IN")}</span>
                    <span className="text-xs text-slate-400 font-sans font-medium">/ month</span>
                  </div>

                  {/* Feature Lists */}
                  <div className="mt-6 space-y-3.5">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Footer Actions */}
                <div className="p-6 bg-slate-50 rounded-b-3xl border-t border-slate-100">
                  {isActive ? (
                    <div className="w-full py-2.5 text-center text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1">
                      <Shield className="h-4 w-4" />
                      Active Level Compliance 
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={!!actionLoading}
                      className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wide font-sans shadow transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        plan.popular 
                          ? "bg-slate-900 hover:bg-slate-800 text-white" 
                          : "bg-white border border-slate-300 hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      {actionLoading === plan.name ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe to {plan.name}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current Enterprise Subscription Details Summary Drawer Card */}
      {status && status.plan !== "Free" && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">Enterprise Subscription Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">ACTIVE PLAN STATE</span>
              <strong className="text-md text-amber-400 font-black tracking-tight">{status.plan} Plan</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-sans block">SUBSCRIPTION ID</span>
              <code className="text-xs font-mono text-indigo-300 block select-all">{status.subscriptionId}</code>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-sans block font-medium">RENEWAL CYCLE</span>
              <span className="text-xs font-mono text-slate-300 flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5" />
                {status.renewalDate ? new Date(status.renewalDate).toLocaleDateString("en-IN", {
                  year: "numeric", month: "short", day: "numeric"
                }) : "N/A"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-sans block">CUSTOMER BILLING ID</span>
              <span className="text-xs text-slate-300 block truncate font-mono select-all">
                {status.customerId || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Developer Sandbox Testing panel */}
      {currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Terminal className="h-4 w-4 text-slate-600 animate-pulse" />
              Dev Sandbox Testing Tools
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Use these tools to manually expire your enterprise subscription instantly. Allows developers to preview the Read-Only warning blocks and testing payment upgrade loops.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSimulateExpiry}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-[11px] rounded-xl hover:bg-slate-800 shadow transition flex items-center gap-1.5 cursor-pointer cursor-device-target border border-slate-700/50"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Simulate Sub Expiry (Lock Read-Only)
            </button>
            
            <button
              onClick={async () => {
                const res = await fetch("/api/billing/webhook", {
                  method: "POST",
                  headers: {
                    ...apiHeaders,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    event: "payment.captured",
                    payload: {
                      payment: {
                        entity: {
                          id: `pay_test_${Math.random().toString(36).substring(2,8)}`,
                          notes: {
                            enterpriseId: currentUser.enterpriseCode,
                            planName: "Enterprise"
                          }
                        }
                      }
                    }
                  })
                });
                if (res.ok) {
                  setSuccessMsg("Webhook Simulator processed! Active tier expanded to high-grade Enterprise layout.");
                  fetchConfigAndStatus();
                  if (onRefreshUser) onRefreshUser();
                }
              }}
              className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-[11px] rounded-xl hover:bg-slate-300 shadow transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
            >
              Simulate Active Webhook Trigger
            </button>
          </div>
        </div>
      )}

      {/* MOCK SANDBOX SIMULATOR MODAL POPUP */}
      <AnimatePresence>
        {sandboxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs cursor-pointer"
              onClick={() => setSandboxModal(null)}
            />

            {/* Dialog Card Content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-400 shadow-2xl p-6 text-slate-850 z-50"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Terminal className="h-5 w-5 text-indigo-600 animate-pulse" />
                <h2 className="text-md font-extrabold tracking-tight text-slate-900 uppercase font-mono">
                  Razorpay SDK Sandbox Simulator
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Enterprise Code:</span>
                    <strong className="font-mono">{sandboxModal.enterpriseId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Plan Tier:</span>
                    <strong className="text-slate-900 font-sans">{sandboxModal.planName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Charge Value:</span>
                    <strong className="font-mono text-emerald-600">₹{sandboxModal.amount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-1.5 mt-1">
                    <span className="text-slate-400">Generated Subscription ID:</span>
                    <code className="text-[10px] bg-slate-200 font-mono text-slate-800 px-1 py-0.2 rounded mt-0.5">{sandboxModal.subscriptionId}</code>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-2xl text-[11px] text-indigo-850 font-medium">
                  This simulated model acts as Razorpay payment trigger gateway. Clicking "Pass" will submit a mock verification token, persistent-activating your subscription dashboard.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => submitMockSandboxPayment(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    Fail/Decline payment
                  </button>

                  <button
                    onClick={() => submitMockSandboxPayment(true)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black tracking-wide transition flex items-center justify-center gap-1"
                  >
                    Pass/Approve payment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
