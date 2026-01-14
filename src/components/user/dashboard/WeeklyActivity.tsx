'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserLanguage } from '@/context/AppContext';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';

interface WeeklyActivityProps {
  weeklyData?: {
    day: string;
    hours: number;
    lessons: number;
  }[];
}

export function WeeklyActivity({ weeklyData }: WeeklyActivityProps) {
  const { t } = useUserLanguage();

  // Default data if not provided
  const defaultData = [
    { day: 'Mon', hours: 0, lessons: 0 },
    { day: 'Tue', hours: 0, lessons: 0 },
    { day: 'Wed', hours: 0, lessons: 0 },
    { day: 'Thu', hours: 0, lessons: 0 },
    { day: 'Fri', hours: 0, lessons: 0 },
    { day: 'Sat', hours: 0, lessons: 0 },
    { day: 'Sun', hours: 0, lessons: 0 },
  ];

  const data = weeklyData || defaultData;
  const maxHours = Math.max(...data.map(d => d.hours), 1);
  const totalWeekHours = data.reduce((sum, d) => sum + d.hours, 0);
  const totalWeekLessons = data.reduce((sum, d) => sum + d.lessons, 0);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('user.dashboard.weeklyActivity.title', 'Weekly Activity')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('user.dashboard.weeklyActivity.subtitle', 'Your learning this week')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{totalWeekHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">
              {totalWeekLessons} {t('user.dashboard.weeklyActivity.lessons', 'lessons')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2 h-32">
            {data.map((day, index) => {
              const heightPercent = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;
              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short' }) === day.day;

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end items-center h-full">
                    {day.hours > 0 && (
                      <span className="text-xs font-medium text-foreground mb-1">
                        {day.hours.toFixed(1)}h
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-primary'
                          : day.hours > 0
                          ? 'bg-primary/60 hover:bg-primary/80'
                          : 'bg-muted'
                      }`}
                      style={{
                        height: `${Math.max(heightPercent, day.hours > 0 ? 10 : 5)}%`,
                        animationDelay: `${index * 100}ms`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isToday ? 'text-primary font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    {day.day}
                  </span>
                  {day.lessons > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {day.lessons}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('user.dashboard.weeklyActivity.avgDaily', 'Avg Daily')}
                </p>
                <p className="text-sm font-bold">
                  {(totalWeekHours / 7).toFixed(1)}h
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('user.dashboard.weeklyActivity.activeDays', 'Active Days')}
                </p>
                <p className="text-sm font-bold">
                  {data.filter(d => d.hours > 0).length}/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
