import type { ProjectInput, ScheduleAssumptions } from './construction-logic';
import { DEFAULT_ASSUMPTIONS } from './construction-logic';

const STORAGE_KEY = 'construction-schedule-projects';

// Serialized version of ProjectInput (Date → string)
export interface SerializedProjectInput {
    name: string;
    startDate: string; // ISO string
    grossFloorArea: number;
    undergroundFloors: number;
    abovegroundFloors: number;
    structureType: string;
    totalCost: number;
}

export interface SavedProject {
    id: string;
    name: string;
    savedAt: string; // ISO timestamp
    input: SerializedProjectInput;
    assumptions: ScheduleAssumptions;
}

// Serialization helpers
export const serializeProjectInput = (input: ProjectInput): SerializedProjectInput => ({
    name: input.name,
    startDate: input.startDate.toISOString(),
    grossFloorArea: input.grossFloorArea,
    undergroundFloors: input.undergroundFloors,
    abovegroundFloors: input.abovegroundFloors,
    structureType: input.structureType,
    totalCost: input.totalCost,
});

export const deserializeProjectInput = (data: SerializedProjectInput): ProjectInput => ({
    name: data.name,
    startDate: new Date(data.startDate),
    grossFloorArea: data.grossFloorArea,
    undergroundFloors: data.undergroundFloors,
    abovegroundFloors: data.abovegroundFloors,
    structureType: data.structureType,
    totalCost: data.totalCost,
});

// CRUD operations
export const getSavedProjects = (): SavedProject[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data) as SavedProject[];
    } catch {
        console.error('Failed to load projects from localStorage');
        return [];
    }
};

export const saveProject = (
    input: ProjectInput,
    assumptions: ScheduleAssumptions,
    existingId?: string
): SavedProject => {
    const projects = getSavedProjects();
    const now = new Date().toISOString();

    if (existingId) {
        // Update existing project
        const index = projects.findIndex(p => p.id === existingId);
        if (index !== -1) {
            projects[index] = {
                ...projects[index],
                name: input.name,
                savedAt: now,
                input: serializeProjectInput(input),
                assumptions,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            return projects[index];
        }
    }

    // Create new project
    const newProject: SavedProject = {
        id: Date.now().toString(),
        name: input.name,
        savedAt: now,
        input: serializeProjectInput(input),
        assumptions,
    };

    projects.unshift(newProject); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return newProject;
};

export const loadProject = (id: string): { input: ProjectInput; assumptions: ScheduleAssumptions } | null => {
    const projects = getSavedProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    return {
        input: deserializeProjectInput(project.input),
        // Merge with defaults for backward compatibility with older saved projects
        assumptions: { ...DEFAULT_ASSUMPTIONS, ...project.assumptions },
    };
};

export const deleteProject = (id: string): void => {
    const projects = getSavedProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Relative time formatting
export const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
    return date.toLocaleDateString('ko-KR');
};
