import { cn } from "../../lib/cn.js";

export default function GlassCard({ children, className, strong = false, ...props }) {
  return (
    <div
      className={cn(strong ? "glass-panel-strong" : "glass-panel", "p-5 md:p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
