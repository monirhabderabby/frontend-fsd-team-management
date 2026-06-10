import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "border border-transparent bg-slate-900 text-white",
  secondary: "border border-transparent bg-slate-100 text-slate-900",
  outline: "border border-border text-foreground",
};

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
      badgeVariants[variant] || badgeVariants.default,
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
