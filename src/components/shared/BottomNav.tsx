'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, PlusCircle, TrendingUp, Heart, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  badgeCount?: number;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tracking', label: 'Suivi', icon: PlusCircle },
  { id: 'progress', label: 'Progrès', icon: TrendingUp },
  { id: 'coaching', label: 'Coaching', icon: Heart },
  { id: 'profile', label: 'Profil', icon: User },
] as const;

export default function BottomNav({ activeTab, onTabChange, badgeCount = 0 }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-bottom"
      role="tablist"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* Dot indicator */}
              <motion.div
                className="absolute -top-0.5 h-1 w-1 rounded-full"
                animate={{
                  backgroundColor: isActive ? 'oklch(0.55 0.15 160)' : 'transparent',
                  scale: isActive ? 1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />

              {/* Icon */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className="size-5 transition-colors duration-200"
                    style={{
                      color: isActive
                        ? 'var(--color-primary)'
                        : 'var(--color-muted-foreground)',
                    }}
                  />
                </motion.div>

                {/* Badge count on Dashboard tab */}
                {tab.id === 'dashboard' && badgeCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <motion.span
                className="text-[10px] font-medium transition-colors duration-200"
                animate={{
                  color: isActive
                    ? 'var(--color-primary)'
                    : 'var(--color-muted-foreground)',
                }}
              >
                {tab.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
