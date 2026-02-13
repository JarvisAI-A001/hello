import { useEffect, useMemo, useRef } from "react";
import { useState } from "react";

type PlanId = "starter" | "optimizer" | "enterprise";

interface PayPalSubscriptionButtonProps {
  plan: PlanId;
  disabled?: boolean;
  onApprove?: (subscriptionId: string) => void | Promise<void>;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (selector: string) => Promise<void> | void };
    };
  }
}

const PLAN_MAP: Record<PlanId, { planId: string; style: Record<string, string> }> = {
  starter: {
    planId: "P-11600414JE099690VNGHWVCA",
    style: { shape: "pill", color: "silver", layout: "vertical", label: "subscribe" },
  },
  optimizer: {
    planId: "P-33S94351DU487740ANGHWWZA",
    style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe" },
  },
  enterprise: {
    planId: "P-97169227D2780844HNGHWXVY",
    style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe" },
  },
};

const PAYPAL_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID ||
  "Aa9Y35c1Wq4AycGrNXcky-P2oz86kK983Sku4KBiwzHp4URwpj0W_c9_Z8k5kakKOx7TiFoZfUYSL5PZ";

export function PayPalSubscriptionButton({ plan, disabled, onApprove }: PayPalSubscriptionButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const id = useMemo(() => `paypal-btn-${plan}-${Math.random().toString(36).slice(2, 10)}`, [plan]);
  const [isDarkMode, setIsDarkMode] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkMode(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const ensureScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.paypal) {
          resolve();
          return;
        }
        const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
        script.async = true;
        script.dataset.paypalSdk = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("PayPal SDK failed to load"));
        document.body.appendChild(script);
      });

    const renderButtons = async () => {
      try {
        await ensureScript();
        if (!window.paypal || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        const selected = PLAN_MAP[plan];
        await window.paypal.Buttons({
          style: {
            ...selected.style,
            color: isDarkMode ? "black" : selected.style.color,
          },
          createSubscription: (_data: unknown, actions: { subscription: { create: (payload: { plan_id: string }) => Promise<string> } }) =>
            actions.subscription.create({ plan_id: selected.planId }),
          onApprove: async (data: { subscriptionID?: string }) => {
            if (data?.subscriptionID && onApprove) {
              await onApprove(data.subscriptionID);
            }
          },
        }).render(`#${id}`);
      } catch (error) {
        console.error("PayPal render error:", error);
      }
    };

    renderButtons();
  }, [plan, disabled, id, onApprove, isDarkMode]);

  return (
    <div
      className={`rounded-2xl border border-border/70 bg-secondary/40 backdrop-blur-sm shadow-sm p-4 ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <div id={id} ref={containerRef} />
    </div>
  );
}
