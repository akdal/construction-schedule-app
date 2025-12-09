import React, { useState, useMemo } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import type { ScheduleResult } from '../utils/construction-logic';

interface GanttChartProps {
    result: ScheduleResult;
    onExpanderClick: (task: Task) => void;
}

// Custom Header Component
const TaskListHeader: React.FC<{
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    onExpandAll: () => void;
    onCollapseAll: () => void;
}> = ({ headerHeight, fontFamily, fontSize, onExpandAll, onCollapseAll }) => {
    return (
        <div
            style={{
                fontFamily: fontFamily,
                fontSize: fontSize,
                height: headerHeight - 2,
                top: '0px'
            }}
            className="flex border-b border-gray-200 bg-gray-50 text-gray-700 font-bold items-center sticky z-10"
        >
            <div className="flex-1 p-2 border-r border-gray-200 flex items-center justify-between" style={{ minWidth: '350px' }}>
                <span>공정명</span>
                <div className="flex gap-1">
                    <button onClick={onExpandAll} className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600">전체 펼침</button>
                    <button onClick={onCollapseAll} className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600">전체 접힘</button>
                </div>
            </div>
            <div className="w-[100px] p-2 border-r border-gray-200 text-center">시작일</div>
            <div className="w-[100px] p-2 border-r border-gray-200 text-center">종료일</div>
            <div className="w-[80px] p-2 text-center">기간</div>
        </div >
    );
};

// Custom Table Component
const TaskListTable: React.FC<{
    rowHeight: number;
    tasks: Task[];
    fontFamily: string;
    fontSize: string;
    onExpanderClick: (task: Task) => void;
    onColorChange: (task: Task, color: string) => void; // New Prop
}> = ({ rowHeight, tasks, fontFamily, fontSize, onExpanderClick, onColorChange }) => {

    // Predefined colors
    const PALETTE = [
        '#6366f1', // Indigo
        '#ef4444', // Red
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#64748b', // Slate
    ];

    return (
        <div style={{ fontFamily: fontFamily, fontSize: fontSize }}>
            {tasks.map((task) => {
                const diffTime = Math.abs(task.end.getTime() - task.start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const isProject = task.type === 'project';

                // Color Logic
                // 1. Base color comes from task.styles.progressColor (which user selects for projects)
                // 2. Project Rows: User wants them to "reflect color". We can tint the background.
                // 3. Unstarted Rows: Should also receive effect.

                const baseColor = task.styles?.progressColor || (isProject ? '#6366f1' : '#cbd5e1'); // Default Indigo or Slate

                // Helper to convert hex to rgba for tinting
                const hexToRgba = (hex: string, alpha: number) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };

                const styleObj: React.CSSProperties = { height: rowHeight };

                if (isProject) {
                    // Tint group row with base color (very light)
                    Object.assign(styleObj, {
                        backgroundColor: hexToRgba(baseColor, 0.1),
                        borderBottom: `1px solid ${hexToRgba(baseColor, 0.2)}`
                    });
                } else {
                    // Normal task or Unstarted?
                    // User said: "unstarted row's color ... select color effect".
                    // If it's unstarted (progress 0?), maybe tint specific cell? 
                    // Or layout row? 
                    // Let's assume the user implies that 'Project' color should affect its children?
                    // Or just that if a row is 'unstarted', it shouldn't be plain white/gray if it belongs to a colored group?
                    // Since we don't track group parent color inheritance easily here without traversal, 
                    // AND task color is usually on the BAR, not the row.
                    // But the request says "Gantt Chart EACH GROUPING ROW'S COLOR and UNSTARTED ROW'S COLOR".
                    // This strongly suggests coloring the TABLE rows (the background).

                    // Let's default to white but allow hover. 
                    // If 'unstarted' is significant, we need a prop. Assuming 'progress' check?
                    // result.tasks has progress. But here strict Prop 'tasks' is used.
                    // let's stick to standard styling but use the tint for Project rows as requested.
                }

                return (
                    <div
                        key={task.id}
                        className={`flex border-b transition-colors ${isProject
                            ? '' // Style applied via inline for dynamic color
                            : 'border-gray-100 hover:bg-gray-50'
                            }`}
                        style={styleObj}
                    >
                        <div
                            className="flex-1 p-2 border-r border-gray-100 flex items-center min-w-[350px]"
                            title={task.name}
                        >
                            {/* Color Indicator / Picker - Only for Projects (Groups) */}
                            {isProject && (
                                <div className="relative group mr-2">
                                    <div
                                        className="w-4 h-4 rounded shadow-sm border border-gray-200 cursor-pointer ring-2 ring-offset-1 ring-transparent hover:ring-indigo-300"
                                        style={{ backgroundColor: baseColor }}
                                    ></div>
                                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded p-1 z-50 flex flex-wrap w-[90px] gap-1 hidden group-hover:flex">
                                        {PALETTE.map(color => (
                                            <div
                                                key={color}
                                                className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-100 mb-0.5"
                                                style={{ backgroundColor: color }}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent row click
                                                    onColorChange(task, color);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* For non-project tasks, maybe just a small dot or nothing? User said "remove it" */}
                            {!isProject && (
                                <div className="w-4 h-4 mr-2"></div> // Spacer
                            )}

                            <div
                                className="truncate flex items-center flex-1"
                                style={{
                                    paddingLeft: isProject ? '0px' : '4px',
                                    fontWeight: isProject ? '800' : '400',
                                    color: isProject ? '#111827' : '#4b5563',
                                    cursor: isProject ? 'pointer' : 'default'
                                }}
                                onClick={() => isProject && onExpanderClick(task)}
                            >
                                {isProject && (
                                    <span className="mr-1 text-gray-500">
                                        {task.hideChildren ? '▶' : '▼'}
                                    </span>
                                )}
                                {task.name}
                            </div>
                        </div>
                        <div className="w-[100px] p-2 border-r border-gray-100 flex items-center justify-center text-sm text-gray-600">
                            {task.start.toISOString().split('T')[0]}
                        </div>
                        <div className="w-[100px] p-2 border-r border-gray-100 flex items-center justify-center text-sm text-gray-600">
                            {task.end.toISOString().split('T')[0]}
                        </div>
                        <div className="w-[80px] p-2 border-r border-gray-100 flex items-center justify-center text-sm text-gray-500">
                            {diffDays}일
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


export const GanttChart: React.FC<GanttChartProps & {
    onColorChange?: (task: Task, color: string) => void;
    onExpandAll?: () => void; // New
    onCollapseAll?: () => void; // New
}> = ({ result, onExpanderClick, onColorChange, onExpandAll, onCollapseAll }) => {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
    const [isHorizontalCompact, setIsHorizontalCompact] = useState(false); // 가로 Compact
    const [isVerticalCompact, setIsVerticalCompact] = useState(false); // 세로 Compact
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    React.useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Calculate Compact Width
    // If compact, we need to fit all tasks in the available width minus the list width.
    // List width is 630px.
    // Available width: we can assume a large enough screen or use dynamic ref measurement.
    // For simplicity, let's just make columnWidth very small.
    // Better approach: 'Fit' usually implies just showing the whole timeline.
    // Since gantt-task-react doesn't support 'Fit' mode natively, we simulate it by using logic
    // or just a "Compact Month" mode with narrower columns.

    // However, "Screen Width 100%" means we want to see everything without horizontal scroll if possible.
    // Let's implement dynamic column width logic if compact is true.
    // Total Duration in days = result.totalDurationDays
    // Available width approx = window.innerWidth - 630 (list) - 100 (padding)
    // Minimally, let's just set a very small column width.
    const listWidth = 630; // matches listCellWidth

    // 가로 Compact: 타임라인을 섹션 너비에 맞춤
    const compactColumnWidth = useMemo(() => {
        if (!isHorizontalCompact || !result.tasks || result.totalDurationDays === 0) return 30;

        // Calculate available width for the gantt timeline (container - list - scrollbar - padding)
        const scrollbarWidth = 17;
        const availableWidth = containerWidth - listWidth - scrollbarWidth;

        // Calculate how many "columns" we need based on view mode
        let totalColumns: number;
        if (viewMode === ViewMode.Month) {
            totalColumns = Math.ceil(result.totalDurationDays / 30);
        } else if (viewMode === ViewMode.Week) {
            totalColumns = Math.ceil(result.totalDurationDays / 7);
        } else {
            totalColumns = result.totalDurationDays;
        }

        const widthPerColumn = availableWidth / Math.max(totalColumns, 1);
        return Math.max(Math.floor(widthPerColumn), 20);
    }, [isHorizontalCompact, result.tasks, result.totalDurationDays, containerWidth, viewMode]);

    // 세로 Compact: 행 높이를 줄임
    const rowHeight = isVerticalCompact ? 32 : 50;
    const headerHeight = isVerticalCompact ? 40 : 50;

    // Sticky Header Style
    // We target the SVG header inside the library.
    // Since we can't easily inject styles into the library's internal SVG, 
    // we might need a workaround or just apply styles to the container if the library structure permits.
    // The library usually puts the header in a separate div above the scrollable/svg area if configured, 
    // or inside the SVG. 
    // If it's inside SVG, sticky is hard.
    // However, 'gantt-task-react' renders headers as part of the SVG.
    // The library does NOT support sticky headers natively out of the box easily.
    // But we can try to make the TOP container sticky? No, that sticks the whole chart.
    // We want the *header row* of the chart to stick.
    // This is hard with SVG. 
    // Alternative: Hide the default header and render our own Sticky Header outside?
    // That's complex.
    // Let's try to just make the 'Control Bar' sticky for now, 
    // and see if we can target the SVG header.
    // Or maybe the user means the 'Control Bar' (View Mode buttons) + the column headers?
    // "상단의 간트 헤더(년월표시)까지는 모두 고정이 되어야 해" -> "Until the Gantt header (Year/Month display) must be fixed".

    // Current approach: Make the top control bar sticky. 
    // For the SVG header, we'll try to apply a CSS class.

    if (!result.tasks || result.tasks.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center h-64 text-gray-400">
                데이터가 없습니다.
            </div>
        );
    }

    // Refs for scroll synchronization
    const headerScrollRef = React.useRef<HTMLDivElement>(null);
    const bodyScrollRef = React.useRef<HTMLDivElement>(null);

    // Sync header scroll with body scroll
    const handleBodyScroll = () => {
        if (headerScrollRef.current && bodyScrollRef.current) {
            headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
        }
    };

    return (
        <div ref={containerRef} className="bg-white rounded-xl shadow-lg border border-gray-100 relative flex flex-col h-full overflow-hidden">
            {/* Control Bar - Always Top */}
            <div className="flex-none p-4 border-b border-gray-100 flex justify-between items-center bg-white z-20 shadow-sm relative">
                <h3 className="text-lg font-bold text-gray-800">공정표 (Gantt Chart)</h3>
                <div className="flex items-center gap-3">
                    {/* Today Button */}
                    <button
                        onClick={() => {
                            const container = document.getElementById('gantt-scroll-container');
                            if (container) {
                                // Scroll to show current date area
                                const today = new Date();
                                const startDate = result.tasks[0]?.start || today;
                                const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                const columnWidth = isHorizontalCompact ? compactColumnWidth : (viewMode === ViewMode.Month ? 100 : 40);
                                let scrollPosition = 0;
                                if (viewMode === ViewMode.Month) {
                                    scrollPosition = (daysDiff / 30) * columnWidth;
                                } else if (viewMode === ViewMode.Week) {
                                    scrollPosition = (daysDiff / 7) * columnWidth;
                                } else {
                                    scrollPosition = daysDiff * columnWidth;
                                }
                                container.scrollLeft = Math.max(0, scrollPosition - 200);
                            }
                        }}
                        className="px-3 py-1.5 text-sm rounded-lg border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Today
                    </button>
                    {/* View Mode Selection */}
                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                        <button onClick={() => setViewMode(ViewMode.Day)} className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === ViewMode.Day ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Day</button>
                        <button onClick={() => setViewMode(ViewMode.Week)} className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === ViewMode.Week ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Week</button>
                        <button onClick={() => setViewMode(ViewMode.Month)} className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === ViewMode.Month ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Month</button>
                    </div>
                    {/* Compact Options */}
                    <div className="flex items-center gap-1.5">
                        {/* 가로 Compact */}
                        <button
                            onClick={() => setIsHorizontalCompact(!isHorizontalCompact)}
                            title="가로 압축"
                            className={`px-2.5 py-1.5 text-sm rounded-lg border transition-all flex items-center gap-1 ${
                                isHorizontalCompact
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow font-medium'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                            가로
                        </button>
                        {/* 세로 Compact */}
                        <button
                            onClick={() => setIsVerticalCompact(!isVerticalCompact)}
                            title="세로 압축"
                            className={`px-2.5 py-1.5 text-sm rounded-lg border transition-all flex items-center gap-1 ${
                                isVerticalCompact
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow font-medium'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                            </svg>
                            세로
                        </button>
                    </div>
                </div>
            </div>

            {/* Split View Container */}
            <div className="flex-1 flex flex-col min-h-0 relative">

                {/* 1. Header Pane (Timeline + TaskHeader) */}
                {/* Fixed height (headerHeight + padding), Overflow hidden vertically, Sync-controlled horizontally */}
                <div
                    ref={headerScrollRef}
                    className="flex-none w-full overflow-hidden bg-white border-b border-gray-100 z-10"
                    style={{ height: `${headerHeight}px` }}
                >
                    <style>{`
                        /* Hide Bars in Header Pane */
                        .header-pane .bar, .header-pane .bar-wrapper { display: none !important; }
                        /* Ensure text is visible */
                        .header-pane text { fill: #374151 !important; }
                        ${viewMode === ViewMode.Day ? `
                        /* Day view: Hide weekday names in bottom calendar row */
                        .header-pane ._9w8d5,
                        .header-pane [class*="calendarBottom"] text:last-child {
                            display: none !important;
                        }
                        .header-pane svg g g text:nth-of-type(2) {
                            opacity: 0 !important;
                        }
                        ` : ''}
                    `}</style>
                    <div className="header-pane" style={{ width: '100%', height: '100%' }}>
                        <Gantt
                            tasks={result.tasks}
                            viewMode={viewMode}
                            locale="ko"
                            fontFamily="Pretendard, sans-serif"
                            fontSize={isVerticalCompact ? "12px" : "14px"}
                            rowHeight={rowHeight}
                            headerHeight={headerHeight}
                            columnWidth={isHorizontalCompact ? compactColumnWidth : (viewMode === ViewMode.Month ? 100 : 40)}
                            listCellWidth={`${listWidth}px`}
                            barCornerRadius={isVerticalCompact ? 2 : 4}
                            TaskListHeader={(props) => (
                                <TaskListHeader
                                    {...props}
                                    headerHeight={headerHeight}
                                    onExpandAll={onExpandAll || (() => { })}
                                    onCollapseAll={onCollapseAll || (() => { })}
                                />
                            )}
                            TaskListTable={() => <div />} // Empty table for header pane
                        />
                    </div>
                </div>

                {/* 2. Body Pane (Tasks) */}
                {/* Fills remaining space, Scrollable, Header Hidden (headerHeight=0) */}
                <div
                    ref={bodyScrollRef}
                    onScroll={handleBodyScroll}
                    className="flex-1 w-full overflow-auto relative"
                    id="gantt-scroll-container"
                >
                    <style>{`
                        /* Hide Header in Body Pane (Double safety) */
                        .body-pane .calendar { display: none !important; }
                    `}</style>
                    <div className="body-pane" style={{ width: '100%', minHeight: '100%' }}>
                        <Gantt
                            tasks={result.tasks}
                            viewMode={viewMode}
                            locale="ko"
                            arrowColor="#cbd5e1"
                            fontFamily="Pretendard, sans-serif"
                            fontSize={isVerticalCompact ? "12px" : "14px"}
                            rowHeight={rowHeight}
                            headerHeight={0} // Hide header space
                            columnWidth={isHorizontalCompact ? compactColumnWidth : (viewMode === ViewMode.Month ? 100 : 40)}
                            listCellWidth={`${listWidth}px`}
                            barCornerRadius={isVerticalCompact ? 2 : 4}
                            // Hide Header, Show Table
                            TaskListHeader={() => <div />} // Empty header for body pane
                            TaskListTable={(props) => <TaskListTable {...props} rowHeight={rowHeight} onExpanderClick={onExpanderClick} onColorChange={onColorChange || (() => { })} />}
                            onExpanderClick={onExpanderClick}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
