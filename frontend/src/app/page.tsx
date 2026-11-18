"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AiDemo } from "@/components/marketing/AiDemo";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Hero } from "@/components/marketing/Hero";
import { LandingNav } from "@/components/marketing/LandingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/today");
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <Logo size={32} className="animate-logo-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-fg">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <ProductPreview />
        <FeatureGrid />
        <AiDemo />
        <CtaBand />
      </main>
      <MarketingFooter />
    </div>
  );
}
