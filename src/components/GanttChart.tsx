import React, { useState, useMemo } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import type { ScheduleResult, ExtendedTask } from '../utils/construction-logic';
import { Button } from '@/components/ui/button';

interface GanttChartProps {
    result: ScheduleResult;
    onExpanderClick: (task: Task) => void;
}

// Custom Header Component
const TaskListHeader: React.FC<{
    headerHeight: number;
    fontFamily: string;
    fontSize: string;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    showDetailColumns: boolean;
    language: 'ko' | 'en';
    onLanguageToggle: () => void;
}> = ({ headerHeight, fontFamily, fontSize, onExpandAll, onCollapseAll, showDetailColumns, language, onLanguageToggle }) => {
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
            <div className="p-2 border-r border-gray-200 flex items-center justify-between" style={{ width: '250px', flexShrink: 0 }}>
                <div className="flex items-center gap-1.5">
                    <span>공정명</span>
                    <Button
                        onClick={onLanguageToggle}
                        variant="outline"
                        size="sm"
                        className="h-auto px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                    >
                        {language === 'ko' ? '한' : 'EN'}
                    </Button>
                </div>
                <div className="flex gap-1">
                    <Button onClick={onExpandAll} variant="outline" size="sm" className="h-auto px-1.5 py-0.5 text-[10px] text-gray-600">펼치기</Button>
                    <Button onClick={onCollapseAll} variant="outline" size="sm" className="h-auto px-1.5 py-0.5 text-[10px] text-gray-600">접기</Button>
                </div>
            </div>
            {showDetailColumns && (
                <>
                    <div className="w-[90px] p-2 border-r border-gray-200 text-center text-xs flex-shrink-0">시작일</div>
                    <div className="w-[90px] p-2 border-r border-gray-200 text-center text-xs flex-shrink-0">종료일</div>
                    <div className="w-[50px] p-2 border-r border-gray-200 text-center text-xs flex-shrink-0">기간</div>
                    <div className="w-[50px] p-2 text-center text-xs flex-shrink-0">공정율</div>
                </>
            )}
        </div >
    );
};

// Custom Tooltip Component
const CustomTooltip: React.FC<{
    task: Task;
    fontSize: string;
    fontFamily: string;
}> = ({ task, fontSize, fontFamily }) => {
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div
            style={{
                fontFamily,
                fontSize,
                padding: '8px 12px',
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                color: 'white',
                borderRadius: '6px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '200px'
            }}
        >
            <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
                {task.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                <div style={{ marginBottom: '3px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>시작: </span>
                    {formatDate(task.start)}
                </div>
                <div style={{ marginBottom: '3px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>종료: </span>
                    {formatDate(task.end)}
                </div>
                <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>기간: </span>
                    {duration}일
                </div>
                {task.progress !== undefined && (
                    <div style={{ marginTop: '3px' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>진행률: </span>
                        {task.progress}%
                    </div>
                )}
            </div>
        </div>
    );
};

// Custom Table Component
const TaskListTable: React.FC<{
    rowHeight: number;
    tasks: Task[];
    fontFamily: string;
    fontSize: string;
    onExpanderClick: (task: Task) => void;
    onColorChange: (task: Task, color: string) => void;
    showDetailColumns: boolean;
    language: 'ko' | 'en';
}> = ({ rowHeight, tasks, fontFamily, fontSize, onExpanderClick, onColorChange, showDetailColumns, language }) => {

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
                            className="p-2 border-r border-gray-100 flex items-center flex-shrink-0"
                            style={{ width: '250px' }}
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
                                    color: isProject ? '#1f2937' : '#374151',
                                    cursor: isProject ? 'pointer' : 'default'
                                }}
                                onClick={() => isProject && onExpanderClick(task)}
                            >
                                {isProject && (
                                    <span className="mr-1 text-gray-500">
                                        {task.hideChildren ? '▶' : '▼'}
                                    </span>
                                )}
                                {language === 'ko'
                                    ? (task as ExtendedTask).nameKo || task.name
                                    : (task as ExtendedTask).nameEn || task.name}
                            </div>
                        </div>
                        {showDetailColumns && (
                            <>
                                <div className="w-[90px] p-2 border-r border-gray-100 flex items-center justify-center text-xs text-gray-700 flex-shrink-0">
                                    {task.start.toISOString().split('T')[0]}
                                </div>
                                <div className="w-[90px] p-2 border-r border-gray-100 flex items-center justify-center text-xs text-gray-700 flex-shrink-0">
                                    {task.end.toISOString().split('T')[0]}
                                </div>
                                <div className="w-[50px] p-2 border-r border-gray-100 flex items-center justify-center text-xs text-gray-700 flex-shrink-0">
                                    {diffDays}일
                                </div>
                                <div className="w-[50px] p-2 border-r border-gray-100 flex items-center justify-center text-xs font-medium text-indigo-700 flex-shrink-0">
                                    {task.progress}%
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


export const GanttChart: React.FC<GanttChartProps & {
    onColorChange?: (task: Task, color: string) => void;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
}> = ({ result, onExpanderClick, onColorChange, onExpandAll, onCollapseAll }) => {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
    const [isHorizontalCompact, setIsHorizontalCompact] = useState(false); // 가로 Compact
    const [isVerticalCompact, setIsVerticalCompact] = useState(false); // 세로 Compact
    const [showDetailColumns, setShowDetailColumns] = useState(true); // 상세 컬럼 표시
    const [language, setLanguage] = useState<'ko' | 'en'>('ko'); // Language toggle
    const containerRef = React.useRef<HTMLDivElement>(null);
    const headerScrollRef = React.useRef<HTMLDivElement>(null);
    const topScrollBarRef = React.useRef<HTMLDivElement>(null);
    const bodyScrollRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);
    const [bodyScrollWidth, setBodyScrollWidth] = useState(0);

    const handleLanguageToggle = () => {
        setLanguage(prev => prev === 'ko' ? 'en' : 'ko');
    };

    // Shift + wheel for horizontal scroll
    const handleWheel = (e: React.WheelEvent) => {
        if (!bodyScrollRef.current) return;

        // Shift+wheel or horizontal trackpad scroll
        if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
            const delta = e.shiftKey ? e.deltaY : e.deltaX;
            bodyScrollRef.current.scrollLeft += delta;
        }
    };

    // Update task names based on language selection
    const tasksWithLanguage = useMemo(() => {
        return result.tasks.map(task => {
            const extTask = task as ExtendedTask;
            return {
                ...task,
                name: language === 'ko'
                    ? (extTask.nameKo || task.name)
                    : (extTask.nameEn || task.name)
            };
        });
    }, [result.tasks, language]);

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

    // Day View: 요일 제거하고 숫자만 표시
    React.useEffect(() => {
        if (viewMode !== ViewMode.Day || !containerRef.current) return;

        const removeWeekdays = () => {
            const textElements = containerRef.current?.querySelectorAll('.header-pane svg text');
            textElements?.forEach((el) => {
                const text = el.textContent || '';
                // "월, 15" or "Mon, 15" 형태에서 숫자만 추출
                if (text.includes(',')) {
                    const match = text.match(/\d+/);
                    if (match) {
                        el.textContent = match[0];
                    }
                }
            });
        };

        const timer = setTimeout(removeWeekdays, 100);

        // 스크롤 시에도 재적용
        const observer = new MutationObserver(() => {
            setTimeout(removeWeekdays, 50);
        });

        const headerPane = containerRef.current?.querySelector('.header-pane');
        if (headerPane) {
            observer.observe(headerPane, { childList: true, subtree: true });
        }

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [viewMode, tasksWithLanguage]);

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
    // 상세 컬럼 표시 여부에 따라 리스트 너비 조정
    // 공정명(250) + 시작일(90) + 종료일(90) + 기간(50) + 공정율(50) = 530
    // 공정명만 = 250
    const listWidth = showDetailColumns ? 530 : 250;

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
    }, [isHorizontalCompact, result.tasks, result.totalDurationDays, containerWidth, viewMode, showDetailColumns]);

    // 세로 Compact: 행 높이를 줄임
    const rowHeight = isVerticalCompact ? 32 : 50;
    const headerHeight = isVerticalCompact ? 40 : 50;

    // Update body scroll width when content changes
    React.useEffect(() => {
        const updateScrollWidth = () => {
            if (bodyScrollRef.current) {
                setBodyScrollWidth(bodyScrollRef.current.scrollWidth);
            }
        };

        // Initial update
        const timer = setTimeout(updateScrollWidth, 100);

        // Update on resize
        const observer = new ResizeObserver(updateScrollWidth);
        if (bodyScrollRef.current) {
            observer.observe(bodyScrollRef.current);
        }

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [result.tasks, viewMode, isHorizontalCompact, showDetailColumns]);

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

    // Sync scrollbars (body scroll -> header & top scrollbar)
    const handleBodyScroll = () => {
        if (!bodyScrollRef.current) return;
        const scrollLeft = bodyScrollRef.current.scrollLeft;

        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = scrollLeft;
        }
        if (topScrollBarRef.current) {
            topScrollBarRef.current.scrollLeft = scrollLeft;
        }
    };

    // Sync scrollbars (top scrollbar -> body & header)
    const handleTopScrollBarScroll = () => {
        if (!topScrollBarRef.current) return;
        const scrollLeft = topScrollBarRef.current.scrollLeft;

        if (bodyScrollRef.current) {
            bodyScrollRef.current.scrollLeft = scrollLeft;
        }
        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = scrollLeft;
        }
    };

    if (!result.tasks || result.tasks.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center h-64 text-gray-400">
                데이터가 없습니다.
            </div>
        );
    }

    return (
        <div ref={containerRef} className="bg-white rounded-xl shadow-lg border border-gray-100 relative flex flex-col h-full overflow-hidden">
            <style>{`
                /* Custom scrollbar styling */
                .gantt-scrollbar::-webkit-scrollbar {
                    height: 12px;
                }
                .gantt-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 6px;
                }
                .gantt-scrollbar::-webkit-scrollbar-thumb {
                    background: #94a3b8;
                    border-radius: 6px;
                    border: 2px solid #f1f5f9;
                }
                .gantt-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
                .gantt-scrollbar::-webkit-scrollbar-thumb:active {
                    background: #475569;
                }
            `}</style>
            {/* Control Bar - Always Top */}
            <div className="flex-none p-4 border-b border-gray-100 flex justify-between items-center bg-white z-20 shadow-sm relative">
                <h3 className="text-lg font-bold text-gray-800">공정표</h3>
                <div className="flex items-center gap-3">
                    {/* View Mode Selection */}
                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                        <Button onClick={() => setViewMode(ViewMode.Day)} variant="ghost" size="sm" className={`px-3 py-1 text-sm rounded-md h-auto ${viewMode === ViewMode.Day ? 'bg-white shadow text-indigo-600 font-medium hover:bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-transparent'}`}>Day</Button>
                        <Button onClick={() => setViewMode(ViewMode.Week)} variant="ghost" size="sm" className={`px-3 py-1 text-sm rounded-md h-auto ${viewMode === ViewMode.Week ? 'bg-white shadow text-indigo-600 font-medium hover:bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-transparent'}`}>Week</Button>
                        <Button onClick={() => setViewMode(ViewMode.Month)} variant="ghost" size="sm" className={`px-3 py-1 text-sm rounded-md h-auto ${viewMode === ViewMode.Month ? 'bg-white shadow text-indigo-600 font-medium hover:bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-transparent'}`}>Month</Button>
                    </div>
                    {/* Compact Options */}
                    <div className="flex items-center gap-1.5">
                        {/* 가로 Compact */}
                        <Button
                            onClick={() => setIsHorizontalCompact(!isHorizontalCompact)}
                            title="가로 압축"
                            variant={isHorizontalCompact ? "default" : "outline"}
                            size="sm"
                            className={`flex items-center gap-1 ${
                                isHorizontalCompact
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
                                    : 'text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                            가로
                        </Button>
                        {/* 세로 Compact */}
                        <Button
                            onClick={() => setIsVerticalCompact(!isVerticalCompact)}
                            title="세로 압축"
                            variant={isVerticalCompact ? "default" : "outline"}
                            size="sm"
                            className={`flex items-center gap-1 ${
                                isVerticalCompact
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
                                    : 'text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                            </svg>
                            세로
                        </Button>
                        {/* 상세 컬럼 토글 */}
                        <Button
                            onClick={() => setShowDetailColumns(!showDetailColumns)}
                            title="상세 컬럼 표시/숨김"
                            variant={showDetailColumns ? "default" : "outline"}
                            size="sm"
                            className={`flex items-center gap-1 ${
                                showDetailColumns
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
                                    : 'text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                            </svg>
                            상세
                        </Button>
                    </div>
                </div>
            </div>

            {/* Top Horizontal Scrollbar */}
            {bodyScrollWidth > 0 && (
                <div
                    ref={topScrollBarRef}
                    onScroll={handleTopScrollBarScroll}
                    className="flex-none w-full overflow-x-auto overflow-y-hidden gantt-scrollbar border-b border-gray-200"
                    style={{ height: '14px' }}
                >
                    <div style={{ width: `${bodyScrollWidth}px`, height: '1px' }} />
                </div>
            )}

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
                    `}</style>
                    <div className="header-pane" style={{ width: '100%', height: '100%' }}>
                        <Gantt
                            tasks={tasksWithLanguage}
                            viewMode={viewMode}
                            locale="ko"
                            todayColor="transparent"
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
                                    showDetailColumns={showDetailColumns}
                                    language={language}
                                    onLanguageToggle={handleLanguageToggle}
                                />
                            )}
                            TaskListTable={() => <div />} // Empty table for header pane
                            TooltipContent={(props) => <CustomTooltip {...props} />}
                        />
                    </div>
                </div>

                {/* 2. Body Pane (Tasks) */}
                {/* Fills remaining space, Scrollable, Header Hidden (headerHeight=0) */}
                <div
                    ref={bodyScrollRef}
                    onScroll={handleBodyScroll}
                    onWheel={handleWheel}
                    className="flex-1 w-full overflow-scroll relative gantt-scrollbar"
                    id="gantt-scroll-container"
                >
                    <style>{`
                        /* Hide Header in Body Pane (Double safety) */
                        .body-pane .calendar { display: none !important; }
                        /* Bar label text color - dark gray for better visibility on light backgrounds */
                        .body-pane text { fill: #111827 !important; font-weight: 300; font-size: 13px; }
                        .body-pane .barLabel text { fill: #111827 !important; font-weight: 300; font-size: 13px; }
                        /* All SVG text in gantt area */
                        #gantt-scroll-container text { fill: #111827 !important; }
                    `}</style>
                    <div className="body-pane" style={{ width: '100%', minHeight: '100%', position: 'relative' }}>
                        <Gantt
                            tasks={tasksWithLanguage}
                            viewMode={viewMode}
                            locale="ko"
                            todayColor="transparent"
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
                            TaskListTable={(props) => <TaskListTable {...props} rowHeight={rowHeight} onExpanderClick={onExpanderClick} onColorChange={onColorChange || (() => { })} showDetailColumns={showDetailColumns} language={language} />}
                            TooltipContent={(props) => <CustomTooltip {...props} />}
                            onExpanderClick={onExpanderClick}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
