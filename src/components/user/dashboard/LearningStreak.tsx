'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserLanguage } from '@/context/AppContext';
import { Flame, Calendar, Trophy, Target } from 'lucide-react';

interface LearningStreakProps {
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string | null;
}

export function LearningStreak({ currentStreak = 0, longestStreak = 0, lastActivityDate }: LearningStreakProps) {
  const { t } = useUserLanguage();

  const isStreakActive = () => {
    if (!lastActivityDate) return false;
    const lastActivity = new Date(lastActivityDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      lastActivity.toDateString() === today.toDateString() ||
      lastActivity.toDateString() === yesterday.toDateString()
    );
  };

  const streakActive = isStreakActive();
  const streakPercentage = Math.min((currentStreak / 30) * 100, 100); // Max 30 days

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl" />

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${streakActive ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
          {t('user.dashboard.streak.title', 'Learning Streak')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {streakActive
            ? t('user.dashboard.streak.active', 'Keep it going!')
            : t('user.dashboard.streak.inactive', 'Start your streak today')}
        </p>
      </CardHeader>
      <CardContent className="relative">
        {/* Main Streak Display */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Circular Progress */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 - (streakPercentage / 100) * 2 * Math.PI * 56}
                className={`${streakActive ? 'text-orange-500' : 'text-primary'} transition-all duration-1000`}
                strokeLinecap="round"
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className={`h-8 w-8 mb-1 ${streakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className="text-3xl font-bold text-foreground">{currentStreak}</span>
              <span className="text-xs text-muted-foreground">
                {currentStreak === 1 ? t('user.dashboard.streak.day', 'day') : t('user.dashboard.streak.days', 'days')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {t('user.dashboard.streak.longest', 'Longest')}
              </p>
              <p className="text-lg font-bold truncate">{longestStreak}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {t('user.dashboard.streak.goal', 'Goal')}
              </p>
              <p className="text-lg font-bold truncate">30</p>
            </div>
          </div>
        </div>

        {/* Motivation Message */}
        {streakActive && currentStreak > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm text-center font-medium text-orange-700 dark:text-orange-300">
              {currentStreak >= 7
                ? t('user.dashboard.streak.great', '🔥 Amazing! You\'re on fire!')
                : currentStreak >= 3
                ? t('user.dashboard.streak.good', '🌟 Great progress! Keep going!')
                : t('user.dashboard.streak.start', '💪 You\'ve started! Don\'t break the chain!')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
