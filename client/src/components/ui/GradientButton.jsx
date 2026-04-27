import { motion } from "framer-motion";
import { cn } from "../../lib/cn.js";

export default function GradientButton({ className, children, ...props }) {
  return (
    <motion.button
      type="button"
      className={cn("btn-primary", className)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
