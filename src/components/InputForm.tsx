import React, { useState, useEffect } from 'react';
import type { ProjectInput } from '../utils/construction-logic';
import { Layers, Briefcase, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface InputFormProps {
    onCalculate: (data: ProjectInput) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onCalculate }) => {
    // Default values - empty for new project
    const [name, setName] = useState<string>('Untitled');
    const [startDate, setStartDate] = useState<Date>(new Date()); // 오늘 날짜
    const [structureType, setStructureType] = useState<string>('RC');

    // Numeric inputs stored as strings to handle leading zeros and empty states
    const [grossFloorArea, setGrossFloorArea] = useState<string>('');
    const [undergroundFloors, setUndergroundFloors] = useState<string>('0');
    const [abovegroundFloors, setAbovegroundFloors] = useState<string>('');
    const [totalCost, setTotalCost] = useState<string>(''); // Store as string for input, convert to number for calculation

    const [costPerPyInput, setCostPerPyInput] = useState<string>(''); // For per pyeong input

    // Helper to parse numeric input, allowing empty string and stripping leading zeros
    const parseNumericInput = (input: string) => {
        if (input === '') return ''; // Allow empty string for clearing
        const rawValue = input.replace(/,/g, '');
        // Use Number() to handle leading zeros (e.g., "05" becomes 5)
        const num = Number(rawValue);
        return isNaN(num) ? '' : num;
    };

    // Generic handler for numeric strings to prevent leading zeros
    const handleNumericStringChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        // Prevent multiple leading zeros unless it is just "0"
        if (val.length > 1 && val.startsWith('0')) {
            setter(val.replace(/^0+/, ''));
        } else {
            setter(val);
        }
    };

    // Sync Per Cost only on mount or area change (if we want to keep it synced)
    useEffect(() => {
        const currentGrossFloorArea = parseFloat(grossFloorArea);
        const currentTotalCost = parseFloat(totalCost);

        if (!isNaN(currentGrossFloorArea) && currentGrossFloorArea > 0 && !isNaN(currentTotalCost) && currentTotalCost > 0) {
            const py = currentGrossFloorArea / 3.3058;
            const calculatedPerPy = Math.round(currentTotalCost / py);
            setCostPerPyInput(calculatedPerPy.toString());
        } else {
            setCostPerPyInput(''); // Clear if area or total cost is invalid
        }
    }, [grossFloorArea, totalCost]);

    const handleCostPerPyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsedValue = parseNumericInput(e.target.value);
        if (parsedValue === '') {
            setCostPerPyInput('');
            // Optionally, reset totalCost or keep it as is if per py is cleared
            // For now, let's keep totalCost as is if per py is cleared
        } else if (typeof parsedValue === 'number') {
            setCostPerPyInput(parsedValue.toString());
            // Calc Total Cost
            const currentGrossFloorArea = parseFloat(grossFloorArea);
            if (!isNaN(currentGrossFloorArea) && currentGrossFloorArea > 0) {
                const py = currentGrossFloorArea / 3.3058;
                const newTotal = Math.round(parsedValue * py);
                setTotalCost(newTotal.toString());
            }
        }
    };

    const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue === '') {
            setTotalCost('');
            setCostPerPyInput(''); // Clear per py if total cost is cleared
            return;
        }
        if (!isNaN(Number(rawValue))) {
            setTotalCost(rawValue);
            // Calc Per Py
            const currentGrossFloorArea = parseFloat(grossFloorArea);
            if (!isNaN(currentGrossFloorArea) && currentGrossFloorArea > 0) {
                const py = currentGrossFloorArea / 3.3058;
                const newPerPy = Math.round(Number(rawValue) / py);
                setCostPerPyInput(newPerPy.toString());
            }
        }
    };

    const handleGrossFloorAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9.]/g, ''); // Allow decimal for area
        if (val.length > 1 && val.startsWith('0') && val.indexOf('.') === -1) {
            setGrossFloorArea(val.replace(/^0+/, ''));
        } else {
            setGrossFloorArea(val);
        }

        // If area updates, current total cost implies new per py (or keep per py constant?)
        // Let's keep Total Cost constant and update Per Py display
        const numVal = parseFloat(val);
        const currentTotalCost = parseFloat(totalCost);
        if (!isNaN(numVal) && numVal > 0 && !isNaN(currentTotalCost) && currentTotalCost > 0) {
            const py = numVal / 3.3058;
            const newPerPy = Math.round(currentTotalCost / py);
            setCostPerPyInput(newPerPy.toString());
        } else {
            setCostPerPyInput('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const projectInput: ProjectInput = {
            name: name,
            startDate: startDate,
            grossFloorArea: parseFloat(grossFloorArea) || 0,
            undergroundFloors: parseInt(undergroundFloors) || 0,
            abovegroundFloors: parseInt(abovegroundFloors) || 0,
            structureType: structureType,
            totalCost: parseFloat(totalCost) || 0,
        };
        onCalculate(projectInput);
    };

    // Format helpers
    const formatNumber = (num: number | string) => {
        if (num === '' || num === null || num === undefined) return '';
        return Number(num).toLocaleString();
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
                프로젝트 개요
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project Name */}
                <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명</Label>
                    <Input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        required
                    />
                </div>

                {/* Start Date */}
                <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">착공일</Label>
                    <DatePicker
                        date={startDate}
                        onDateChange={(date) => date && setStartDate(date)}
                        placeholder="착공일 선택"
                        className="w-full"
                    />
                </div>

                {/* Area & Floors */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">연면적 (m²)</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Layers className="h-4 w-4 text-gray-400" />
                            </div>
                            <Input
                                type="text" // Changed to text to handle string state
                                name="grossFloorArea"
                                value={grossFloorArea}
                                onChange={handleGrossFloorAreaChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">구조</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Briefcase className="h-4 w-4 text-gray-400" />
                            </div>
                            <Select value={structureType} onValueChange={setStructureType}>
                                <SelectTrigger className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RC">철근콘크리트</SelectItem>
                                    <SelectItem value="SRC">철골철근콘크리트</SelectItem>
                                    <SelectItem value="Steel">철골조</SelectItem>
                                    <SelectItem value="Wood">목구조</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">지하 층수</Label>
                        <Input
                            type="text" // Changed to text to handle string state
                            name="undergroundFloors"
                            value={undergroundFloors}
                            onChange={handleNumericStringChange(setUndergroundFloors)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            min="0"
                        />
                    </div>
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">지상 층수</Label>
                        <Input
                            type="text" // Changed to text to handle string state
                            name="abovegroundFloors"
                            value={abovegroundFloors}
                            onChange={handleNumericStringChange(setAbovegroundFloors)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            min="1"
                        />
                    </div>
                </div>

                {/* Cost Input Section */}
                <div className="pt-4 border-t border-gray-100">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">예상 공사비 (Total & Per Py)</Label>

                    {/* Dual Inputs Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {/* Total Cost Input */}
                        <div className="relative group">
                            <Label className="text-[10px] text-gray-500 absolute top-1 left-2">총 공사비</Label>
                            <Input
                                type="text"
                                name="totalCostDisplay"
                                value={formatNumber(totalCost)}
                                onChange={handleTotalCostChange}
                                placeholder="총액 입력"
                                className="w-full pl-2 pr-2 pt-5 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right text-sm font-medium"
                            />
                        </div>

                        {/* Per Py Input */}
                        <div className="relative group">
                            <Label className="text-[10px] text-gray-500 absolute top-1 left-2">평당 단가</Label>
                            <Input
                                type="text"
                                name="costPerPyInput"
                                value={formatNumber(costPerPyInput)}
                                onChange={handleCostPerPyChange}
                                placeholder="평당 입력"
                                className="w-full pl-2 pr-2 pt-5 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-1 text-xs text-gray-400">
                        <span>* 자동 변환 계산됩니다</span>
                    </div>

                </div>

                <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-6 flex justify-center items-center"
                >
                    <Calculator className="w-4 h-4 mr-2" />
                    공정표 생성 (Create Schedule)
                </Button>
            </form>
        </div>
    );
};
