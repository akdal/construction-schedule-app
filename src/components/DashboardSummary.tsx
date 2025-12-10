import React from 'react';
import type { ScheduleResult } from '../utils/construction-logic';
import { format } from 'date-fns';
import { Calendar, ArrowRight, TrendingUp, CalendarDays, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';

interface DashboardSummaryProps {
    result: ScheduleResult;
    startDate: Date;
    todayDate: Date;
    onTodayDateChange: (date: Date) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ result, startDate, todayDate, onTodayDateChange }) => {
    const { totalDurationDays, completionDate } = result;

    // Calculate progress based on today date
    const totalProjectDays = Math.ceil((completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalProjectDays) * 100)));
    const remainingDays = Math.max(0, Math.ceil((completionDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));

    const handleResetToday = () => {
        onTodayDateChange(new Date());
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* 1. 착공일 Card */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">착공일</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{format(startDate, 'yyyy-MM-dd')}</p>
                    </div>
                </CardContent>
            </Card>

            {/* 2. 준공 예정일 Card */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">준공 예정일</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{format(completionDate, 'yyyy-MM-dd')}</p>
                    </div>
                </CardContent>
            </Card>

            {/* 3. 공사 기간 Card */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">공사 기간</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{totalDurationDays}일</p>
                    </div>
                </CardContent>
            </Card>

            {/* 4. 기준일 Card - Date Picker */}
            <Card className="border-orange-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">기준일</p>
                        <div className="flex items-center gap-1 mt-1">
                            <DatePicker
                                date={todayDate}
                                onDateChange={(date) => date && onTodayDateChange(date)}
                                placeholder="기준일 선택"
                                className="flex-1 h-8 text-sm font-bold"
                            />
                            <Button
                                onClick={handleResetToday}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs font-medium flex-shrink-0"
                                title="오늘 날짜로 설정"
                            >
                                T
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 5. 공정 진행률 Card */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">공정 진행률</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-2xl font-bold text-gray-900">{progressPercent}</span>
                                <span className="text-sm font-medium text-gray-500">%</span>
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold flex-1 text-center">
                            경과 {elapsedDays > 0 ? elapsedDays : 0}일
                        </div>
                        <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-semibold flex-1 text-center">
                            잔여 {remainingDays}일
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
