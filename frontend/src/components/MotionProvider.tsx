"use client";

import { LazyMotion, domMax } from "framer-motion";

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domMax} strict>{children}</LazyMotion>;
}
