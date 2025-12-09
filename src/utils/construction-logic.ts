import { addDays } from 'date-fns';
import type { Task } from 'gantt-task-react';

export interface ProjectInput {
    name: string;
    startDate: Date;
    grossFloorArea: number; // m2
    undergroundFloors: number;
    abovegroundFloors: number;
    structureType: string;
    totalCost: number; // KRW
}

// Building type for presets
export type BuildingType = 'residential' | 'commercial' | 'industrial' | 'hospital' | 'custom';

// Structure type modifiers
export type StructureTypeKey = 'RC' | 'Steel' | 'Wood' | 'SRC';


// Region for regional adjustments
export type Region = 'seoul' | 'gyeonggi' | 'coastal' | 'mountain' | 'other';

// Assumptions that can be customized by user
export interface ScheduleAssumptions {
    // Basic calculation factors
    areaFactor: number;           // Base days per m² (default: 0.2)
    undergroundDays: number;      // Days per underground floor (default: 30)
    abovegroundDays: number;      // Days per aboveground floor (default: 15)
    baseDays: number;             // Fixed base duration (default: 60)
    holidayFactor: number;        // Holiday/weather factor (default: 1.2)
    highEndThreshold: number;     // KRW per pyeong threshold for high-end (default: 8000000)
    highEndMultiplier: number;    // Multiplier when high-end (default: 1.1)

    // Phase percentages
    preconstructionPct: number;   // default: 0.10
    foundationPct: number;        // default: 0.15
    structurePct: number;         // default: 0.35
    exteriorPct: number;          // default: 0.20
    interiorPct: number;          // default: 0.25
    handoverPct: number;          // default: 0.05

    // Structure type modifier
    structureModifier: number;    // Multiplier based on structure type (default: 1.0)

    // Regional factor
    regionalFactor: number;       // Regional adjustment (default: 1.0)
}

// Structure type multipliers
export const STRUCTURE_MODIFIERS: Record<StructureTypeKey, { modifier: number; label: string; description: string }> = {
    RC: { modifier: 1.0, label: '철근콘크리트 (RC)', description: '가장 일반적인 구조, 기준 공기' },
    SRC: { modifier: 1.15, label: '철골철근콘크리트 (SRC)', description: '복합 구조로 공기 증가' },
    Steel: { modifier: 0.85, label: '철골 (Steel)', description: '조립식으로 공기 단축' },
    Wood: { modifier: 0.75, label: '목구조 (Wood)', description: '경량 구조로 빠른 시공' },
};

// Regional factors
export const REGIONAL_FACTORS: Record<Region, { factor: number; label: string; description: string }> = {
    seoul: { factor: 1.05, label: '서울', description: '교통/규제로 소폭 증가' },
    gyeonggi: { factor: 1.0, label: '경기권', description: '기준 지역' },
    coastal: { factor: 1.1, label: '해안가', description: '염해/바람 영향' },
    mountain: { factor: 1.15, label: '산간지역', description: '접근성/기후 영향' },
    other: { factor: 1.0, label: '기타', description: '일반 조건' },
};

// Building type presets
export const BUILDING_PRESETS: Record<BuildingType, { label: string; assumptions: Partial<ScheduleAssumptions> }> = {
    residential: {
        label: '주거시설 (아파트/주택)',
        assumptions: {
            areaFactor: 0.18,
            undergroundDays: 25,
            abovegroundDays: 12,
            baseDays: 45,
            preconstructionPct: 0.08,
            foundationPct: 0.15,
            structurePct: 0.32,
            exteriorPct: 0.20,
            interiorPct: 0.20,
            handoverPct: 0.05,
        }
    },
    commercial: {
        label: '상업시설 (오피스/상가)',
        assumptions: {
            areaFactor: 0.20,
            undergroundDays: 30,
            abovegroundDays: 14,
            baseDays: 60,
            preconstructionPct: 0.10,
            foundationPct: 0.15,
            structurePct: 0.35,
            exteriorPct: 0.18,
            interiorPct: 0.17,
            handoverPct: 0.05,
        }
    },
    industrial: {
        label: '산업시설 (공장/물류)',
        assumptions: {
            areaFactor: 0.12,
            undergroundDays: 20,
            abovegroundDays: 8,
            baseDays: 40,
            preconstructionPct: 0.12,
            foundationPct: 0.20,
            structurePct: 0.40,
            exteriorPct: 0.15,
            interiorPct: 0.08,
            handoverPct: 0.05,
        }
    },
    hospital: {
        label: '의료시설 (병원/요양)',
        assumptions: {
            areaFactor: 0.28,
            undergroundDays: 35,
            abovegroundDays: 18,
            baseDays: 90,
            preconstructionPct: 0.12,
            foundationPct: 0.15,
            structurePct: 0.30,
            exteriorPct: 0.18,
            interiorPct: 0.20,
            handoverPct: 0.05,
        }
    },
    custom: {
        label: '사용자 정의',
        assumptions: {}
    }
};

export const DEFAULT_ASSUMPTIONS: ScheduleAssumptions = {
    areaFactor: 0.2,
    undergroundDays: 30,
    abovegroundDays: 15,
    baseDays: 60,
    holidayFactor: 1.2,
    highEndThreshold: 8000000,
    highEndMultiplier: 1.1,
    preconstructionPct: 0.10,
    foundationPct: 0.15,
    structurePct: 0.35,
    exteriorPct: 0.20,
    interiorPct: 0.25,
    handoverPct: 0.05,
    structureModifier: 1.0,
    regionalFactor: 1.0,
};

export interface ScheduleResult {
    totalDurationDays: number;
    completionDate: Date;
    tasks: Task[];
    costPerPy: number; // KRW per 3.3m2
}

export const calculateTotalDuration = (
    input: ProjectInput,
    assumptions: ScheduleAssumptions = DEFAULT_ASSUMPTIONS
): { totalDays: number; costPerPy: number } => {
    // 1. Basic Calculation using assumptions
    let rawDays = (input.grossFloorArea * assumptions.areaFactor) +
        (input.undergroundFloors * assumptions.undergroundDays) +
        (input.abovegroundFloors * assumptions.abovegroundDays) +
        assumptions.baseDays;

    // 2. Cost Correction (High-end finish)
    const costPerPy = input.totalCost / (input.grossFloorArea / 3.3);
    if (costPerPy >= assumptions.highEndThreshold) {
        rawDays *= assumptions.highEndMultiplier;
    }

    // 3. Structure Type Modifier
    rawDays *= assumptions.structureModifier;

    // 4. Regional Factor
    rawDays *= assumptions.regionalFactor;

    // 5. Holiday/Off-day Factor
    const totalDays = Math.ceil(rawDays * assumptions.holidayFactor);

    return { totalDays, costPerPy };
};

// Helper for vibrant colors based on reference
// Each color has: main, selected, light (for background/unfilled portions)
const COLORS = {
    cyan: '#06b6d4', // Preconstruction / Planning
    cyanSelect: '#0891b2',
    cyanLight: '#cffafe', // Light cyan for background
    orange: '#f97316', // Core Construction
    orangeSelect: '#ea580c',
    orangeLight: '#ffedd5', // Light orange for background
    purple: '#a855f7', // Interior / Finishing
    purpleSelect: '#9333ea',
    purpleLight: '#f3e8ff', // Light purple for background
    green: '#22c55e', // Final
    greenSelect: '#16a34a',
    greenLight: '#dcfce7', // Light green for background
    gray: '#64748b', // Milestones
    graySelect: '#475569',
    grayLight: '#f1f5f9', // Light gray for background
};

// Helper to create task styles with group color reflection
const createTaskStyles = (mainColor: string, selectColor: string, lightColor: string) => ({
    progressColor: mainColor,
    progressSelectedColor: selectColor,
    backgroundColor: lightColor,
    backgroundSelectedColor: lightColor,
});

// Helper to create project (group) styles
const createProjectStyles = (mainColor: string, selectColor: string) => ({
    progressColor: mainColor,
    progressSelectedColor: selectColor,
    backgroundColor: mainColor,
    backgroundSelectedColor: selectColor,
});

export const generateScheduleTasks = (
    input: ProjectInput,
    totalDuration: number,
    assumptions: ScheduleAssumptions = DEFAULT_ASSUMPTIONS
): Task[] => {
    const { startDate } = input;
    const tasks: Task[] = [];
    let currentDate = startDate;

    // Use assumptions for phase percentages
    const phasePcts = {
        pre: assumptions.preconstructionPct,
        earth: assumptions.foundationPct,
        struct: assumptions.structurePct,
        ext: assumptions.exteriorPct,
        int: assumptions.interiorPct,
        final: assumptions.handoverPct,
    };

    const pct = (percent: number) => Math.ceil(totalDuration * percent);

    // Phase: Preconstruction (Group)
    // 1. Site Survey & Planning
    // 2. Permitting
    // 3. Contractor Bidding
    const preDur = pct(phasePcts.pre);
    const t1_days = Math.ceil(preDur * 0.3);
    const t2_days = Math.ceil(preDur * 0.4);
    const t3_days = preDur - t1_days - t2_days;

    const f_pre = addDays(currentDate, t1_days + t2_days + t3_days);

    tasks.push({
        start: currentDate,
        end: f_pre,
        name: 'Preconstruction (사전 준비)',
        id: 'phase-pre',
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: createProjectStyles(COLORS.cyan, COLORS.cyanSelect),
        hideChildren: false
    });

    // Subtasks
    const task_survey_end = addDays(currentDate, t1_days);
    tasks.push({
        start: currentDate,
        end: task_survey_end,
        name: '현장 조사 및 측량 (Site Survey)',
        id: 'task-survey',
        type: 'task',
        progress: 100,
        project: 'phase-pre',
        styles: createTaskStyles(COLORS.cyan, COLORS.cyanSelect, COLORS.cyanLight),
    });

    const task_permit_start = task_survey_end;
    const task_permit_end = addDays(task_permit_start, t2_days);
    tasks.push({
        start: task_permit_start,
        end: task_permit_end,
        name: '인허가 (Permitting)',
        id: 'task-permit',
        type: 'task',
        progress: 50,
        dependencies: ['task-survey'],
        project: 'phase-pre',
        styles: createTaskStyles(COLORS.cyan, COLORS.cyanSelect, COLORS.cyanLight),
    });

    const task_bid_start = task_permit_end;
    const task_bid_end = addDays(task_bid_start, t3_days);
    tasks.push({
        start: task_bid_start,
        end: task_bid_end,
        name: '업체 선정 및 계약 (Contracts)',
        id: 'task-bid',
        type: 'task',
        progress: 10,
        dependencies: ['task-permit'],
        project: 'phase-pre',
        styles: createTaskStyles(COLORS.cyan, COLORS.cyanSelect, COLORS.cyanLight),
    });
    currentDate = task_bid_end;

    // Phase: Foundation & Earthwork (Group)
    const earth_dur = pct(phasePcts.earth);
    const earth_end = addDays(currentDate, earth_dur);

    tasks.push({
        start: currentDate,
        end: earth_end,
        name: 'Foundation (토목 및 기초)',
        id: 'phase-earth',
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: createProjectStyles(COLORS.orange, COLORS.orangeSelect),
        hideChildren: false
    });

    // Breakdown Earthwork
    const demol_days = Math.floor(earth_dur * 0.2);
    const excav_days = Math.floor(earth_dur * 0.5);
    const foun_days = earth_dur - demol_days - excav_days;

    const t_demo_end = addDays(currentDate, demol_days);
    tasks.push({
        start: currentDate,
        end: t_demo_end,
        name: '철거 및 가설 펜스 (Demolition)',
        id: 'task-demo',
        type: 'task',
        progress: 0,
        dependencies: ['task-bid'],
        project: 'phase-earth',
        styles: createTaskStyles(COLORS.orange, COLORS.orangeSelect, COLORS.orangeLight),
    });

    const t_excav_start = t_demo_end;
    const t_excav_end = addDays(t_excav_start, excav_days);
    tasks.push({
        start: t_excav_start,
        end: t_excav_end,
        name: '터파기 및 흙막이 (Excavation)',
        id: 'task-excav',
        type: 'task',
        progress: 0,
        dependencies: ['task-demo'],
        project: 'phase-earth',
        styles: createTaskStyles(COLORS.orange, COLORS.orangeSelect, COLORS.orangeLight),
    });

    const t_foun_start = t_excav_end;
    const t_foun_end = addDays(t_foun_start, foun_days);
    tasks.push({
        start: t_foun_start,
        end: t_foun_end,
        name: '기초 콘크리트 타설 (Foundation Pour)',
        id: 'task-foun',
        type: 'task',
        progress: 0,
        dependencies: ['task-excav'],
        project: 'phase-earth',
        styles: createTaskStyles(COLORS.orange, COLORS.orangeSelect, COLORS.orangeLight),
    });
    currentDate = t_foun_end;

    // Phase: Structure (Group) - Per Floor
    const struct_dur = pct(phasePcts.struct);
    const floors = input.abovegroundFloors;
    // Calculate simple per-floor duration
    const daysPerFloor = Math.floor(struct_dur / floors);
    // Add Underground structure if needed (simplified into earth/foundation or first step here)

    const struct_end_date = addDays(currentDate, floors * daysPerFloor);

    tasks.push({
        start: currentDate,
        end: struct_end_date,
        name: 'Structure (골조 공사)',
        id: 'phase-struct',
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: createProjectStyles(COLORS.orange, COLORS.orangeSelect),
        hideChildren: false
    });

    let prev_struct_id = 'task-foun';
    let local_current = currentDate;

    for (let i = 1; i <= floors; i++) {
        const f_start = local_current;
        const f_end = addDays(f_start, daysPerFloor);
        const f_id = `task-floor-${i}`;

        tasks.push({
            start: f_start,
            end: f_end,
            name: `${i}층 골조 (Floor ${i} Framing)`,
            id: f_id,
            type: 'task',
            progress: 0,
            dependencies: [prev_struct_id],
            project: 'phase-struct',
            styles: createTaskStyles(COLORS.orange, COLORS.orangeSelect, COLORS.orangeLight),
        });

        prev_struct_id = f_id;
        local_current = f_end;
    }

    // Phase: Exterior (Group)
    // Starts when Structure is ~50% done or after specific floors.
    // For simplicity, let's start after 2nd floor is done or 50% structural time.
    const ext_dur = pct(phasePcts.ext);
    const ext_start = addDays(currentDate, Math.floor(struct_dur * 0.5));
    const ext_end = addDays(ext_start, ext_dur);

    tasks.push({
        start: ext_start,
        end: ext_end,
        name: 'Exterior (외부 마감)',
        id: 'phase-ext',
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: createProjectStyles(COLORS.purple, COLORS.purpleSelect),
        hideChildren: false
    });

    tasks.push({
        start: ext_start,
        end: addDays(ext_start, Math.floor(ext_dur * 0.6)),
        name: '창호 및 유리 (Windows/Glass)',
        id: 'task-win',
        type: 'task',
        progress: 0,
        // dependencies: [`task-floor-${Math.ceil(floors/2)}`], // Soft link
        project: 'phase-ext',
        styles: createTaskStyles(COLORS.purple, COLORS.purpleSelect, COLORS.purpleLight),
    });

    tasks.push({
        start: addDays(ext_start, Math.floor(ext_dur * 0.4)),
        end: ext_end,
        name: '외벽 마감 (Brick/Stone/Paint)',
        id: 'task-facade',
        type: 'task',
        progress: 0,
        dependencies: ['task-win'],
        project: 'phase-ext',
        styles: createTaskStyles(COLORS.purple, COLORS.purpleSelect, COLORS.purpleLight),
    });

    // Phase: Interior & Systems (Group)
    const int_dur = pct(phasePcts.int);
    // Starts after Structure is done or parallel with Exterior
    const int_start = addDays(struct_end_date, -10); // Overlap slightly
    const int_end = addDays(int_start, int_dur);

    tasks.push({
        start: int_start,
        end: int_end,
        name: 'Interior & MEP (내부 및 설비)',
        id: 'phase-int',
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: createProjectStyles(COLORS.purple, COLORS.purpleSelect),
        hideChildren: false
    });

    // Subtasks for interior
    const mep_days = Math.floor(int_dur * 0.4);
    const dry_days = Math.floor(int_dur * 0.3);
    const fin_days = Math.floor(int_dur * 0.3);

    const t_mep_end = addDays(int_start, mep_days);
    tasks.push({
        start: int_start,
        end: t_mep_end,
        name: '설비 배관/배선 (MEP Rough-in)',
        id: 'task-mep',
        type: 'task',
        progress: 0,
        dependencies: [prev_struct_id], // Last floor
        project: 'phase-int',
        styles: createTaskStyles(COLORS.purple, COLORS.purpleSelect, COLORS.purpleLight),
    });

    const t_dry_start = addDays(int_start, Math.floor(mep_days * 0.5)); // Overlap
    const t_dry_end = addDays(t_dry_start, dry_days);
    tasks.push({
        start: t_dry_start,
        end: t_dry_end,
        name: '벽체 및 천장 (Drywall/Ceiling)',
        id: 'task-dry',
        type: 'task',
        progress: 0,
        dependencies: ['task-mep'],
        project: 'phase-int',
        styles: createTaskStyles(COLORS.purple, COLORS.purpleSelect, COLORS.purpleLight),
    });

    const t_fin_start = t_dry_end;
    const t_fin_end = addDays(t_fin_start, fin_days);
    tasks.push({
        start: t_fin_start,
        end: t_fin_end,
        name: '바닥/도장/가구 (Finishes/Flooring)',
        id: 'task-fin',
        type: 'task',
        progress: 0,
        dependencies: ['task-dry'],
        project: 'phase-int',
        styles: createTaskStyles(COLORS.purple, COLORS.purpleSelect, COLORS.purpleLight),
    });

    // Phase: Final (Group)
    const final_start = new Date(Math.max(ext_end.getTime(), int_end.getTime()));
    const final_end = addDays(final_start, pct(phasePcts.final));

    tasks.push({
        start: final_start,
        end: final_end,
        name: 'Handover (준공 및 인도)',
        id: 'phase-final',
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: createProjectStyles(COLORS.green, COLORS.greenSelect),
        hideChildren: false
    });

    const finalDur = pct(phasePcts.final);
    const cleanDays = Math.ceil(finalDur * 0.4);

    tasks.push({
        start: final_start,
        end: addDays(final_start, cleanDays),
        name: '준공 청소 (Final Cleaning)',
        id: 'task-clean',
        type: 'task',
        progress: 0,
        dependencies: ['task-fin', 'task-facade'],
        project: 'phase-final',
        styles: createTaskStyles(COLORS.green, COLORS.greenSelect, COLORS.greenLight),
    });

    tasks.push({
        start: addDays(final_start, cleanDays),
        end: final_end,
        name: '사용승인 검사 및 입주 (Inspection & Move-in)',
        id: 'task-inspect',
        type: 'task',
        progress: 0,
        dependencies: ['task-clean'],
        project: 'phase-final',
        styles: createTaskStyles(COLORS.green, COLORS.greenSelect, COLORS.greenLight),
    });

    return tasks;
};

// Export COLORS for use in other components (e.g., color picker updates)
export { COLORS };
