"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAppData } from "@/hooks/use-app-data";
import { offlineStore } from "@/lib/offline-store";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import DashboardView from "@/components/dashboard/DashboardView";
import TrackingView from "@/components/tracking/TrackingView";
import ProgressView from "@/components/progress/ProgressView";
import CoachingView from "@/components/coaching/CoachingView";
import ProfileView from "@/components/profile/ProfileView";
import BottomNav from "@/components/shared/BottomNav";
import PinLockScreen from "@/components/shared/PinLockScreen";
import OfflineBanner from "@/components/shared/OfflineBanner";
import OnlineSyncBanner from "@/components/shared/OnlineSyncBanner";
import EmergencyMode from "@/components/emergency/EmergencyMode";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function HomePage() {
  const { isLoading } = useAppData();
  const user = useAppStore((s) => s.user);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const isEmergencyMode = useAppStore((s) => s.isEmergencyMode);
  const badges = useAppStore((s) => s.badges);

  // Check both localStorage and API for onboarding status
  const isOnboarded = user?.isOnboarded || offlineStore.isOnboarded();

  const earnedBadgeCount = badges.length;
  const [isPinVerified, setIsPinVerified] = useState(true);

  // Lock body scroll when emergency mode is active
  useEffect(() => {
    if (isEmergencyMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isEmergencyMode]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-5xl"
          >
            🌱
          </motion.div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding flow for new users
  if (!isOnboarded) {
    return <OnboardingFlow />;
  }

  // PIN lock screen (optional)
  if (user?.pin && !isPinVerified) {
    return (
      <PinLockScreen
        userPin={user.pin}
        userName={user.name}
        onSuccess={() => setIsPinVerified(true)}
      />
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "tracking":
        return <TrackingView />;
      case "progress":
        return <ProgressView />;
      case "coaching":
        return <CoachingView />;
      case "profile":
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content area */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="animate-fade-in"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badgeCount={earnedBadgeCount > 0 ? earnedBadgeCount : undefined}
      />

      {/* Emergency mode overlay */}
      <AnimatePresence>
        {isEmergencyMode && <EmergencyMode />}
      </AnimatePresence>

      {/* Offline / Sync banners */}
      <OfflineBanner />
      <OnlineSyncBanner />
    </div>
  );
}
