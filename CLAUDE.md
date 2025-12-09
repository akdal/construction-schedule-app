# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Construction Schedule App - A React application for calculating and visualizing construction project timelines using Gantt charts. Users input project parameters (area, floors, cost, structure type) and the app generates a detailed construction schedule with phase breakdowns.

## Development Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript compile + Vite production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **Gantt Chart**: `gantt-task-react` library
- **Date Handling**: `date-fns`
- **Excel Export**: `xlsx`
- **Icons**: `lucide-react`

## Architecture

### Core Data Flow

1. `InputForm` collects `ProjectInput` (area, floors, cost, dates)
2. `construction-logic.ts` calculates duration via `calculateTotalDuration()` and generates tasks via `generateScheduleTasks()`
3. Results flow to `DashboardSummary` (metrics cards) and `GanttChart` (visualization)

### Key Types (`src/utils/construction-logic.ts`)

```typescript
interface ProjectInput {
  name: string;
  startDate: Date;
  grossFloorArea: number;    // m²
  undergroundFloors: number;
  abovegroundFloors: number;
  structureType: string;     // 'RC' | 'Steel' | 'Wood'
  totalCost: number;         // KRW
}

interface ScheduleResult {
  totalDurationDays: number;
  completionDate: Date;
  tasks: Task[];             // gantt-task-react Task type
  costPerPy: number;         // KRW per 3.3m²
}
```

### Duration Calculation Logic

- Base formula: `(area × 0.2) + (undergroundFloors × 30) + (abovegroundFloors × 15) + 60`
- High-end finish modifier: ×1.1 when cost ≥ 8,000,000 KRW/평
- Holiday factor: ×1.2 (weekends, weather)

### Schedule Phases (auto-generated tasks)

1. **Preconstruction** (10%): Survey → Permitting → Contracts
2. **Foundation** (15%): Demolition → Excavation → Foundation Pour
3. **Structure** (35%): Per-floor framing tasks
4. **Exterior** (20%): Windows → Facade (starts at 50% structure)
5. **Interior** (25%): MEP → Drywall → Finishes (overlaps with structure end)
6. **Handover** (5%): Cleaning → Inspection

### Component Responsibilities

- `App.tsx`: State management, Excel export, expand/collapse handling
- `GanttChart.tsx`: Custom task list header/table, view mode switching, color palette
- `InputForm.tsx`: Dual-input cost fields (total ↔ per-pyeong sync)
- `DashboardSummary.tsx`: 4-card metrics display
- `LogicExplainer.tsx`: Collapsible calculation breakdown panel
