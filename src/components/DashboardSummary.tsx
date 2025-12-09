import React from 'react';
import type { ScheduleResult } from '../utils/construction-logic';
import { format } from 'date-fns';
import { Clock, Calendar, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardSummaryProps {
    result: ScheduleResult;
    startDate: Date;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ result, startDate }) => {
    const { totalDurationDays, completionDate, costPerPy } = result;

    const cards = [
        {
            label: '총 공사 기간',
            value: `${totalDurationDays}일`,
            subValue: `${Math.round(totalDurationDays / 30 * 10) / 10}개월`,
            icon: Clock,
            color: 'bg-blue-50 text-blue-600',
        },
        {
            label: '착공일',
            value: format(startDate, 'yyyy-MM-dd'),
            subValue: 'Start Date',
            icon: Calendar,
            color: 'bg-indigo-50 text-indigo-600',
        },
        {
            label: '준공 예정일',
            value: format(completionDate, 'yyyy-MM-dd'),
            subValue: 'Estimated Completion',
            icon: CheckCircle,
            color: 'bg-green-50 text-green-600',
        },
        {
            label: '평당 공사비',
            value: `${Math.round(costPerPy / 10000).toLocaleString()}만원`,
            subValue: '/ 3.3m²',
            icon: TrendingUp,
            color: 'bg-purple-50 text-purple-600',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {cards.map((card, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                        <card.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{card.subValue}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
