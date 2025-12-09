import React, { useState, useEffect } from 'react';
import type { ScheduleAssumptions } from '../utils/construction-logic';
import {
    DEFAULT_ASSUMPTIONS,
    BUILDING_PRESETS,
    STRUCTURE_MODIFIERS,
    REGIONAL_FACTORS,
    type BuildingType,
    type StructureTypeKey,
    type Region,
} from '../utils/construction-logic';
import { RotateCcw, RefreshCw, Building2, Hammer, MapPin, ChevronDown, ChevronUp, Sliders } from 'lucide-react';

interface AssumptionsFormProps {
    assumptions: ScheduleAssumptions;
    onApplyAssumptions: (assumptions: ScheduleAssumptions) => void;
    hasProjectInput: boolean;
}

export const AssumptionsForm: React.FC<AssumptionsFormProps> = ({
    assumptions,
    onApplyAssumptions,
    hasProjectInput,
}) => {
    const [localAssumptions, setLocalAssumptions] = useState<ScheduleAssumptions>(assumptions);
    const [hasChanges, setHasChanges] = useState(false);

    // UI state
    const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType>('custom');
    const [selectedStructure, setSelectedStructure] = useState<StructureTypeKey>('RC');
    const [selectedRegion, setSelectedRegion] = useState<Region>('gyeonggi');
    const [showAdvanced, setShowAdvanced] = useState(true);

    useEffect(() => {
        setLocalAssumptions(assumptions);
        setHasChanges(false);
    }, [assumptions]);

    const handleChange = (key: keyof ScheduleAssumptions, value: string) => {
        const numValue = parseFloat(value) || 0;
        setLocalAssumptions(prev => ({ ...prev, [key]: numValue }));
        setHasChanges(true);
        setSelectedBuildingType('custom');
    };

    const handlePctChange = (key: keyof ScheduleAssumptions, value: string) => {
        const pctValue = (parseFloat(value) || 0) / 100;
        setLocalAssumptions(prev => ({ ...prev, [key]: pctValue }));
        setHasChanges(true);
        setSelectedBuildingType('custom');
    };

    const handleBuildingTypeChange = (type: BuildingType) => {
        setSelectedBuildingType(type);
        if (type !== 'custom') {
            const preset = BUILDING_PRESETS[type];
            setLocalAssumptions(prev => ({
                ...prev,
                ...preset.assumptions,
            }));
            setHasChanges(true);
        }
    };

    const handleStructureChange = (structure: StructureTypeKey) => {
        setSelectedStructure(structure);
        const modifier = STRUCTURE_MODIFIERS[structure].modifier;
        setLocalAssumptions(prev => ({ ...prev, structureModifier: modifier }));
        setHasChanges(true);
    };

    const handleRegionChange = (region: Region) => {
        setSelectedRegion(region);
        const factor = REGIONAL_FACTORS[region].factor;
        setLocalAssumptions(prev => ({ ...prev, regionalFactor: factor }));
        setHasChanges(true);
    };

    const handleReset = () => {
        setLocalAssumptions(DEFAULT_ASSUMPTIONS);
        setSelectedBuildingType('custom');
        setSelectedStructure('RC');
        setSelectedRegion('gyeonggi');
        setHasChanges(true);
    };

    const handleApply = () => {
        onApplyAssumptions(localAssumptions);
        setHasChanges(false);
    };

    const pctToDisplay = (val: number) => Math.round(val * 100);

    const totalPct = Math.round(
        (localAssumptions.preconstructionPct +
            localAssumptions.foundationPct +
            localAssumptions.structurePct +
            localAssumptions.exteriorPct +
            localAssumptions.interiorPct +
            localAssumptions.handoverPct) * 100
    );

    // Calculate combined modifier for display
    const combinedModifier = (
        localAssumptions.structureModifier *
        localAssumptions.regionalFactor *
        localAssumptions.holidayFactor
    ).toFixed(2);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">주요 가정</h2>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="기본값으로 초기화"
                >
                    <RotateCcw className="w-3 h-3" />
                    초기화
                </button>
            </div>

            {/* Apply Button */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={!hasProjectInput}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all shadow-md ${
                        hasChanges && hasProjectInput
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : hasProjectInput
                            ? 'bg-gray-100 text-gray-400 cursor-default'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <RefreshCw className={`w-4 h-4 ${hasChanges ? 'animate-pulse' : ''}`} />
                    {hasProjectInput ? '변경사항 반영' : '프로젝트를 먼저 입력하세요'}
                </button>
                {hasChanges && hasProjectInput && (
                    <p className="text-xs text-indigo-600 mt-1 text-center">
                        * 변경사항이 있습니다. 버튼을 클릭하여 반영하세요.
                    </p>
                )}
            </div>

            <div className="space-y-5">
                {/* Building Type Presets */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        건물 용도별 프리셋
                    </div>
                    <select
                        value={selectedBuildingType}
                        onChange={(e) => handleBuildingTypeChange(e.target.value as BuildingType)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                        {(Object.keys(BUILDING_PRESETS) as BuildingType[]).map(type => (
                            <option key={type} value={type}>
                                {BUILDING_PRESETS[type].label}
                            </option>
                        ))}
                    </select>
                    {selectedBuildingType !== 'custom' && (
                        <p className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded">
                            {BUILDING_PRESETS[selectedBuildingType].label} 기준값이 적용됩니다.
                        </p>
                    )}
                </div>

                {/* Structure Type */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Hammer className="w-4 h-4 text-orange-500" />
                        구조 타입
                    </div>
                    <select
                        value={selectedStructure}
                        onChange={(e) => handleStructureChange(e.target.value as StructureTypeKey)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    >
                        {(Object.keys(STRUCTURE_MODIFIERS) as StructureTypeKey[]).map(type => (
                            <option key={type} value={type}>
                                {STRUCTURE_MODIFIERS[type].label} (×{STRUCTURE_MODIFIERS[type].modifier})
                            </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-orange-600 bg-orange-50 px-2 py-1.5 rounded">
                        ×{STRUCTURE_MODIFIERS[selectedStructure].modifier} · {STRUCTURE_MODIFIERS[selectedStructure].description}
                    </p>
                </div>

                {/* Regional Factor */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MapPin className="w-4 h-4 text-green-500" />
                        지역별 조건
                    </div>
                    <select
                        value={selectedRegion}
                        onChange={(e) => handleRegionChange(e.target.value as Region)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                        {(Object.keys(REGIONAL_FACTORS) as Region[]).map(region => (
                            <option key={region} value={region}>
                                {REGIONAL_FACTORS[region].label} (×{REGIONAL_FACTORS[region].factor})
                            </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-green-600 bg-green-50 px-2 py-1.5 rounded">
                        ×{REGIONAL_FACTORS[selectedRegion].factor} · {REGIONAL_FACTORS[selectedRegion].description}
                    </p>
                </div>

                {/* Combined Modifier Summary */}
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600">종합 보정 계수</span>
                        <span className="text-lg font-bold text-indigo-600">×{combinedModifier}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                        구조({localAssumptions.structureModifier}) × 지역({localAssumptions.regionalFactor}) × 휴일({localAssumptions.holidayFactor})
                    </div>
                </div>

                {/* Advanced Settings Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">상세 설정</span>
                    </div>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                    <div className="space-y-5 pt-2 border-t border-gray-100">
                        {/* Duration Calculation Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700">공기 산출 계수</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">면적 계수 (일/m²)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={localAssumptions.areaFactor}
                                        onChange={(e) => handleChange('areaFactor', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">기본 공기 (일)</label>
                                    <input
                                        type="number"
                                        value={localAssumptions.baseDays}
                                        onChange={(e) => handleChange('baseDays', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">지하층 (일/층)</label>
                                    <input
                                        type="number"
                                        value={localAssumptions.undergroundDays}
                                        onChange={(e) => handleChange('undergroundDays', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">지상층 (일/층)</label>
                                    <input
                                        type="number"
                                        value={localAssumptions.abovegroundDays}
                                        onChange={(e) => handleChange('abovegroundDays', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">휴일/기상 보정</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={localAssumptions.holidayFactor}
                                        onChange={(e) => handleChange('holidayFactor', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">고급 마감 보정</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={localAssumptions.highEndMultiplier}
                                        onChange={(e) => handleChange('highEndMultiplier', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">고급 마감 기준 (원/평)</label>
                                <input
                                    type="number"
                                    step="100000"
                                    value={localAssumptions.highEndThreshold}
                                    onChange={(e) => handleChange('highEndThreshold', e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    현재: {(localAssumptions.highEndThreshold / 10000).toLocaleString()}만원/평 이상
                                </p>
                            </div>
                        </div>

                        {/* Phase Percentages Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700">공정 단계별 비율 (%)</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">사전준비</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={pctToDisplay(localAssumptions.preconstructionPct)}
                                            onChange={(e) => handlePctChange('preconstructionPct', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-6"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">토목/기초</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={pctToDisplay(localAssumptions.foundationPct)}
                                            onChange={(e) => handlePctChange('foundationPct', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-6"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">골조공사</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={pctToDisplay(localAssumptions.structurePct)}
                                            onChange={(e) => handlePctChange('structurePct', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-6"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">외부마감</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={pctToDisplay(localAssumptions.exteriorPct)}
                                            onChange={(e) => handlePctChange('exteriorPct', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-6"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">내부/설비</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={pctToDisplay(localAssumptions.interiorPct)}
                                            onChange={(e) => handlePctChange('interiorPct', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-6"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">준공/인도</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={pctToDisplay(localAssumptions.handoverPct)}
                                            onChange={(e) => handlePctChange('handoverPct', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-6"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total percentage indicator */}
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">합계</span>
                                    <span className={`font-medium ${totalPct === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                                        {totalPct}%
                                    </span>
                                </div>
                                {totalPct !== 100 && (
                                    <p className="text-[10px] text-orange-500 mt-1">
                                        * 합계가 100%가 되도록 조정하세요
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Note */}
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-indigo-700">
                    <p className="font-medium mb-1">공기 산출 공식</p>
                    <p className="text-indigo-600">
                        기본공기 = (면적 × {localAssumptions.areaFactor}) + (지하 × {localAssumptions.undergroundDays}) + (지상 × {localAssumptions.abovegroundDays}) + {localAssumptions.baseDays}
                    </p>
                    <p className="mt-1 text-indigo-600">
                        최종공기 = 기본공기 × 종합보정({combinedModifier})
                    </p>
                </div>
            </div>
        </div>
    );
};
