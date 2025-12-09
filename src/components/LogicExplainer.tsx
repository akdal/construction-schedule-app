
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, FileText } from 'lucide-react';
import type { ProjectInput, ScheduleAssumptions } from '../utils/construction-logic';

interface LogicExplainerProps {
    input: ProjectInput;
    totalDuration: number;
    assumptions: ScheduleAssumptions;
}

export const LogicExplainer: React.FC<LogicExplainerProps> = ({ input, totalDuration, assumptions }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate intermediate values for display
    const costPerPy = input.totalCost / (input.grossFloorArea / 3.3);
    const isHighEnd = costPerPy >= assumptions.highEndThreshold;

    // Raw days calculation (before all modifiers)
    const baseDays = (input.grossFloorArea * assumptions.areaFactor) +
        (input.undergroundFloors * assumptions.undergroundDays) +
        (input.abovegroundFloors * assumptions.abovegroundDays) +
        assumptions.baseDays;

    // Combined modifier (structure × regional × holiday)
    const combinedModifier = assumptions.structureModifier * assumptions.regionalFactor * assumptions.holidayFactor;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-1.5 rounded-full">
                        <Info className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-semibold text-indigo-900">공기 산출 근거 및 가정 (총 {totalDuration}일)</span>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-indigo-400" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-indigo-100 space-y-4 text-sm text-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1">
                                <FileText className="w-4 h-4 text-gray-400" /> 기본 산식
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <span className="font-medium">면적 기반:</span> {input.grossFloorArea}m² × {assumptions.areaFactor} = {Math.round(input.grossFloorArea * assumptions.areaFactor)}일
                                </li>
                                <li>
                                    <span className="font-medium">지상층:</span> {input.abovegroundFloors}층 × {assumptions.abovegroundDays}일 = {input.abovegroundFloors * assumptions.abovegroundDays}일
                                </li>
                                <li>
                                    <span className="font-medium">지하층:</span> {input.undergroundFloors}층 × {assumptions.undergroundDays}일 = {input.undergroundFloors * assumptions.undergroundDays}일
                                </li>
                                <li>
                                    <span className="font-medium">기본 공기:</span> {assumptions.baseDays}일
                                </li>
                                <li className="font-medium text-gray-700">
                                    소계: {Math.round(baseDays)}일
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1">
                                <FileText className="w-4 h-4 text-gray-400" /> 보정 계수
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <span className="font-medium">구조 타입:</span> ×{assumptions.structureModifier}
                                </li>
                                <li>
                                    <span className="font-medium">지역 조건:</span> ×{assumptions.regionalFactor}
                                </li>
                                <li>
                                    <span className="font-medium">휴일/기상:</span> ×{assumptions.holidayFactor}
                                </li>
                                {isHighEnd ? (
                                    <li className="text-purple-600">
                                        <span className="font-medium">고급 마감:</span> ×{assumptions.highEndMultiplier}
                                    </li>
                                ) : (
                                    <li className="text-gray-400">
                                        <span className="font-medium">고급 마감:</span> 미적용
                                    </li>
                                )}
                            </ul>

                            <div className="mt-3 p-2 bg-indigo-50 rounded text-xs">
                                <p className="font-medium text-indigo-700">계산 과정:</p>
                                <p className="text-indigo-600">
                                    {Math.round(baseDays)}일 {isHighEnd ? `× ${assumptions.highEndMultiplier}` : ''} × {combinedModifier.toFixed(2)} = <span className="font-bold">{totalDuration}일</span>
                                </p>
                                <p className="text-indigo-500 text-[10px] mt-1">
                                    종합보정 = 구조({assumptions.structureModifier}) × 지역({assumptions.regionalFactor}) × 휴일({assumptions.holidayFactor})
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Phase breakdown */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1">
                            <FileText className="w-4 h-4 text-gray-400" /> 공정 단계별 비율
                        </h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                            <div className="p-2 bg-cyan-50 rounded text-center">
                                <p className="text-cyan-700 font-medium">사전준비</p>
                                <p className="text-cyan-600">{Math.round(assumptions.preconstructionPct * 100)}%</p>
                                <p className="text-cyan-500">{Math.ceil(totalDuration * assumptions.preconstructionPct)}일</p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded text-center">
                                <p className="text-orange-700 font-medium">토목/기초</p>
                                <p className="text-orange-600">{Math.round(assumptions.foundationPct * 100)}%</p>
                                <p className="text-orange-500">{Math.ceil(totalDuration * assumptions.foundationPct)}일</p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded text-center">
                                <p className="text-orange-700 font-medium">골조공사</p>
                                <p className="text-orange-600">{Math.round(assumptions.structurePct * 100)}%</p>
                                <p className="text-orange-500">{Math.ceil(totalDuration * assumptions.structurePct)}일</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded text-center">
                                <p className="text-purple-700 font-medium">외부마감</p>
                                <p className="text-purple-600">{Math.round(assumptions.exteriorPct * 100)}%</p>
                                <p className="text-purple-500">{Math.ceil(totalDuration * assumptions.exteriorPct)}일</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded text-center">
                                <p className="text-purple-700 font-medium">내부/설비</p>
                                <p className="text-purple-600">{Math.round(assumptions.interiorPct * 100)}%</p>
                                <p className="text-purple-500">{Math.ceil(totalDuration * assumptions.interiorPct)}일</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded text-center">
                                <p className="text-green-700 font-medium">준공/인도</p>
                                <p className="text-green-600">{Math.round(assumptions.handoverPct * 100)}%</p>
                                <p className="text-green-500">{Math.ceil(totalDuration * assumptions.handoverPct)}일</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 p-3 rounded-lg text-xs">
                        <p className="font-medium text-gray-500 mb-1">ℹ️ 참고사항</p>
                        <p>위 산출식은 일반적인 건설 프로젝트의 통계를 바탕으로 추정한 것이며, 실제 현장 상황(대지 조건, 민원, 자재 수급 등)에 따라 변동될 수 있습니다. 좌측 '주요 가정' 탭에서 계수를 조정할 수 있습니다.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
