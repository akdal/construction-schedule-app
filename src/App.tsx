import { useState, useEffect, useMemo } from 'react';
import { calculateTotalDuration, generateScheduleTasks, DEFAULT_ASSUMPTIONS } from './utils/construction-logic';
import type { ProjectInput, ScheduleResult, ScheduleAssumptions, ExtendedTask } from './utils/construction-logic';
import { applyProgressToTasks } from './utils/progress-calculator';
import { InputForm } from './components/InputForm';
import { AssumptionsForm } from './components/AssumptionsForm';
import { DashboardSummary } from './components/DashboardSummary';
import { GanttChart } from './components/GanttChart';
import { LogicExplainer } from './components/LogicExplainer';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { Calculator, Download, Building, Settings, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { getSavedProjects, saveProject, loadProject, deleteProject } from './utils/storage';
import type { SavedProject } from './utils/storage';
import { Button } from '@/components/ui/button';

type SidebarTab = 'input' | 'assumptions';

function App() {
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [currentInput, setCurrentInput] = useState<ProjectInput | null>(null);
  const [assumptions, setAssumptions] = useState<ScheduleAssumptions>(DEFAULT_ASSUMPTIONS);
  const [activeTab, setActiveTab] = useState<SidebarTab>('input');
  const [todayDate, setTodayDate] = useState<Date>(new Date()); // 기준일 (Today)

  // Project management state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Load saved projects on mount
  useEffect(() => {
    setSavedProjects(getSavedProjects());
  }, []);

  // Compute tasks with dynamic progress based on todayDate (기준일)
  const scheduleResultWithProgress = useMemo(() => {
    if (!scheduleResult) return null;
    return {
      ...scheduleResult,
      tasks: applyProgressToTasks(scheduleResult.tasks, todayDate)
    };
  }, [scheduleResult, todayDate]);

  const handleCalculate = (input: ProjectInput) => {
    setCurrentInput(input);

    // 1. Calculate Duration & Cost using assumptions
    const { totalDays, costPerPy } = calculateTotalDuration(input, assumptions);

    // 2. Generate Tasks using assumptions
    const tasks = generateScheduleTasks(input, totalDays, assumptions);

    // 3. Set Result
    const completionDate = tasks[tasks.length - 1].end;

    setScheduleResult({
      totalDurationDays: totalDays,
      completionDate,
      tasks,
      costPerPy
    });
  };

  // Recalculate when assumptions change (if we have input)
  const handleAssumptionsChange = (newAssumptions: ScheduleAssumptions) => {
    setAssumptions(newAssumptions);

    // Auto-recalculate if we have existing input
    if (currentInput) {
      const { totalDays, costPerPy } = calculateTotalDuration(currentInput, newAssumptions);
      const tasks = generateScheduleTasks(currentInput, totalDays, newAssumptions);
      const completionDate = tasks[tasks.length - 1].end;

      setScheduleResult({
        totalDurationDays: totalDays,
        completionDate,
        tasks,
        costPerPy
      });
    }
  };

  const handleExpanderClick = (task: any) => {
    setScheduleResult(prev => {
      if (!prev) return null;
      const newTasks = prev.tasks.map(t => {
        if (t.id === task.id) {
          return { ...t, hideChildren: !t.hideChildren };
        }
        return t;
      });
      return { ...prev, tasks: newTasks };
    });
  };

  const handleExpandAll = () => {
    setScheduleResult(prev => {
      if (!prev) return null;
      const newTasks = prev.tasks.map(t => ({ ...t, hideChildren: false }));
      return { ...prev, tasks: newTasks };
    });
  };

  const handleCollapseAll = () => {
    setScheduleResult(prev => {
      if (!prev) return null;
      const newTasks = prev.tasks.map(t => ({ ...t, hideChildren: true }));
      return { ...prev, tasks: newTasks };
    });
  };

  // Helper to generate a lighter version of a color for task backgrounds
  const getLighterColor = (hexColor: string): string => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Mix with white (increase by ~80% toward white)
    const lightR = Math.round(r + (255 - r) * 0.8);
    const lightG = Math.round(g + (255 - g) * 0.8);
    const lightB = Math.round(b + (255 - b) * 0.8);

    // Convert back to hex
    return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
  };

  const handleColorChange = (task: any, color: string) => {
    setScheduleResult(prev => {
      if (!prev) return null;

      const lightColor = getLighterColor(color);

      const newTasks = prev.tasks.map(t => {
        // Update the group (project) itself
        if (t.id === task.id) {
          return {
            ...t,
            styles: {
              ...t.styles,
              progressColor: color,
              progressSelectedColor: color,
              backgroundColor: color,
              backgroundSelectedColor: color
            }
          };
        }
        // Update child tasks with the group's color (progress) and light version (background)
        if (task.type === 'project' && t.project === task.id) {
          return {
            ...t,
            styles: {
              ...t.styles,
              progressColor: color,
              progressSelectedColor: color,
              backgroundColor: lightColor,
              backgroundSelectedColor: lightColor
            }
          };
        }
        return t;
      });
      return { ...prev, tasks: newTasks };
    });
  };

  const handleExportExcel = () => {
    if (!scheduleResult || !currentInput) return;

    // Sheet 1: Project Input & Assumptions
    const inputAndAssumptionsData = [
      ['프로젝트 정보'],
      ['항목', '값'],
      ['프로젝트명', currentInput.name],
      ['착공일', currentInput.startDate.toLocaleDateString()],
      ['준공일', scheduleResult.completionDate.toLocaleDateString()],
      ['총 공기', `${scheduleResult.totalDurationDays}일`],
      ['연면적 (m²)', currentInput.grossFloorArea],
      ['구조 타입', currentInput.structureType],
      ['지하 층수', currentInput.undergroundFloors],
      ['지상 층수', currentInput.abovegroundFloors],
      ['총 공사비 (원)', currentInput.totalCost.toLocaleString()],
      ['평당 공사비 (원/평)', Math.round(scheduleResult.costPerPy).toLocaleString()],
      [],
      ['주요 가정 - 공기 산출 계수'],
      ['항목', '값'],
      ['면적 계수 (일/m²)', assumptions.areaFactor],
      ['기본 공기 (일)', assumptions.baseDays],
      ['지하층 (일/층)', assumptions.undergroundDays],
      ['지상층 (일/층)', assumptions.abovegroundDays],
      ['휴일/기상 보정', assumptions.holidayFactor],
      ['고급 마감 보정', assumptions.highEndMultiplier],
      ['고급 마감 기준 (원/평)', assumptions.highEndThreshold.toLocaleString()],
      [],
      ['주요 가정 - 보정 계수'],
      ['항목', '값'],
      ['구조 타입 보정', assumptions.structureModifier],
      ['지역 보정', assumptions.regionalFactor],
      [],
      ['주요 가정 - 공정 단계별 비율'],
      ['단계', '비율 (%)'],
      ['사전준비', `${Math.round(assumptions.preconstructionPct * 100)}%`],
      ['토목/기초', `${Math.round(assumptions.foundationPct * 100)}%`],
      ['골조공사', `${Math.round(assumptions.structurePct * 100)}%`],
      ['외부마감', `${Math.round(assumptions.exteriorPct * 100)}%`],
      ['내부/설비', `${Math.round(assumptions.interiorPct * 100)}%`],
      ['준공/인도', `${Math.round(assumptions.handoverPct * 100)}%`],
    ];

    // Sheet 2: Gantt Schedule
    const scheduleHeader = [
      ['간트 일정표'],
      ['Type', 'Name (Korean)', 'Name (English)', 'Start', 'End', 'Duration (days)'],
    ];

    const taskData = scheduleResult.tasks.map(t => {
      const extTask = t as ExtendedTask;
      return [
        t.type,
        extTask.nameKo || t.name,
        extTask.nameEn || t.name,
        t.start.toISOString().split('T')[0],
        t.end.toISOString().split('T')[0],
        Math.ceil((t.end.getTime() - t.start.getTime()) / (1000 * 60 * 60 * 24))
      ];
    });

    // Create workbook with two sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: Input & Assumptions
    const wsInputAssumptions = XLSX.utils.aoa_to_sheet(inputAndAssumptionsData);
    // Set column widths
    wsInputAssumptions['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsInputAssumptions, '프로젝트 정보');

    // Sheet 2: Schedule
    const wsSchedule = XLSX.utils.aoa_to_sheet([...scheduleHeader, ...taskData]);
    wsSchedule['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSchedule, '간트 일정');

    XLSX.writeFile(wb, `${currentInput.name}_schedule.xlsx`);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);

  // Project management handlers
  const handleSaveProject = () => {
    if (!currentInput) return;
    const saved = saveProject(currentInput, assumptions, currentProjectId || undefined);
    setCurrentProjectId(saved.id);
    setSavedProjects(getSavedProjects());
  };

  const handleLoadProject = (id: string) => {
    const loaded = loadProject(id);
    if (!loaded) return;

    setCurrentInput(loaded.input);
    setAssumptions(loaded.assumptions);
    setCurrentProjectId(id);

    // Recalculate schedule
    const { totalDays, costPerPy } = calculateTotalDuration(loaded.input, loaded.assumptions);
    const tasks = generateScheduleTasks(loaded.input, totalDays, loaded.assumptions);
    const completionDate = tasks[tasks.length - 1].end;

    setScheduleResult({
      totalDurationDays: totalDays,
      completionDate,
      tasks,
      costPerPy
    });
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setSavedProjects(getSavedProjects());
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col transition-all duration-300">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-20 flex items-center justify-between px-6 shadow-sm flex-none">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            variant={isSidebarOpen ? "default" : "outline"}
            size="sm"
            className={`transition-all flex items-center gap-1.5 ${isSidebarOpen
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            title={isSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
          >
            {isSidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
            <span className="text-xs font-medium hidden sm:inline">{isSidebarOpen ? '접기' : '펼치기'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-700 hidden md:block">SJ Scheduler</span>
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">
            {currentInput ? currentInput.name : '프로젝트를 입력해주세요'}
          </h1>
          <Button
            onClick={() => setIsProjectModalOpen(true)}
            size="sm"
            className="flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
            title="프로젝트 관리"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">프로젝트 관리</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {scheduleResult && (
            <Button
              onClick={handleExportExcel}
              size="sm"
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Excel Export</span>
            </Button>
          )}
          <div className="text-sm text-gray-500 font-medium">
            v1.4.0
          </div>
        </div>
      </header>

      {/* Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        savedProjects={savedProjects}
        currentProjectName={currentInput?.name || null}
        onSave={handleSaveProject}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Tabbed Input Form & Assumptions - Independent Scroll */}
        <aside
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out flex-none ${isSidebarOpen ? 'w-96 translate-x-0' : 'w-0 -translate-x-full opacity-0'
            }`}
          style={{ height: 'calc(100vh - 64px)' }}
        >
          {/* Tab Headers */}
          <div className="flex-none border-b border-gray-200 bg-gray-50">
            <div className="flex">
              <Button
                onClick={() => setActiveTab('input')}
                variant="ghost"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 rounded-none ${activeTab === 'input'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Building className="w-4 h-4" />
                프로젝트 개요
              </Button>
              <Button
                onClick={() => setActiveTab('assumptions')}
                variant="ghost"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 rounded-none ${activeTab === 'assumptions'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Settings className="w-4 h-4" />
                주요 가정
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'input' ? (
              <InputForm onCalculate={handleCalculate} />
            ) : (
              <AssumptionsForm
                assumptions={assumptions}
                onApplyAssumptions={handleAssumptionsChange}
                hasProjectInput={!!currentInput}
              />
            )}
          </div>
        </aside>

        {/* Right Content: Dashboard & Chart - Fixed Layout with Flex */}
        <main className="flex-1 bg-gray-50 relative flex flex-col h-[calc(100vh-80px)] overflow-hidden">

          {scheduleResultWithProgress && currentInput ? (
            <>
              {/* Top Section: Dashboard Toggle & Content */}
              <div className="flex-none bg-white border-b border-gray-200 z-20 shadow-sm">
                <Button
                  onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                  variant="ghost"
                  className="w-full flex items-center justify-between px-6 py-3 h-auto rounded-none hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg transition-colors ${isDashboardOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Building className="w-4 h-4" />
                    </div>
                    <span className={`font-bold text-sm ${isDashboardOpen ? 'text-gray-800' : 'text-gray-500'}`}>
                      프로젝트 대시보드
                    </span>
                    {!isDashboardOpen && scheduleResultWithProgress && currentInput && (() => {
                      const totalProjectDays = Math.ceil((scheduleResultWithProgress.completionDate.getTime() - currentInput.startDate.getTime()) / (1000 * 60 * 60 * 24));
                      const elapsedDays = Math.ceil((todayDate.getTime() - currentInput.startDate.getTime()) / (1000 * 60 * 60 * 24));
                      const remainingDays = Math.max(0, Math.ceil((scheduleResultWithProgress.completionDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
                      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalProjectDays) * 100)));
                      return (
                        <div className="flex items-center gap-2 ml-3 text-xs font-normal flex-wrap">
                          <span className="text-gray-500">
                            기준일 <span className="text-orange-600 font-medium">{format(todayDate, 'yyyy-MM-dd')}</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">
                            공정율 <span className="text-indigo-600 font-bold">{progressPercent}%</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">
                            경과 <span className="text-gray-700 font-medium">{elapsedDays > 0 ? elapsedDays : 0}일</span> / 잔여 <span className="text-gray-700 font-medium">{remainingDays}일</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">
                            총 <span className="text-gray-700 font-medium">{totalProjectDays}일</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">
                            착공 <span className="text-gray-700 font-medium">{format(currentInput.startDate, 'yyyy-MM-dd')}</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">
                            준공 <span className="text-gray-700 font-medium">{format(scheduleResultWithProgress.completionDate, 'yyyy-MM-dd')}</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500">
                            공사비 <span className="text-gray-700 font-medium">{(currentInput.totalCost / 100000000).toFixed(1)}억</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {isDashboardOpen ? '접기' : '펼치기'}
                    </span>
                    {isDashboardOpen
                      ? <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      : <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    }
                  </div>
                </Button>

                {/* Collapsible Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isDashboardOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 pb-2 space-y-6 overflow-y-auto max-h-[50vh]">
                    <LogicExplainer input={currentInput} totalDuration={scheduleResultWithProgress.totalDurationDays} assumptions={assumptions} />
                    <div className="mt-6">
                      <DashboardSummary
                        result={scheduleResultWithProgress}
                        startDate={currentInput.startDate}
                        todayDate={todayDate}
                        onTodayDateChange={setTodayDate}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gantt Area: Fills remaining space, internal scroll */}
              <div className="flex-1 p-6 pt-4 min-h-0 overflow-hidden flex flex-col bg-gray-50">
                <GanttChart
                  result={scheduleResultWithProgress}
                  onExpanderClick={handleExpanderClick}
                  onColorChange={handleColorChange}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                />
              </div>
            </>
          ) : (
            // Empty State - Show saved projects or guide
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 overflow-y-auto">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <Calculator className="w-12 h-12 text-indigo-200" />
              </div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">SJ Scheduler</h2>
              <p className="text-sm text-gray-500 mb-6">건설 프로젝트 공정표 생성기</p>

              {savedProjects.length > 0 ? (
                <div className="w-full max-w-md">
                  <p className="text-sm font-medium text-gray-600 mb-3">저장된 프로젝트</p>
                  <div className="space-y-2 mb-6">
                    {savedProjects.slice(0, 5).map((project) => (
                      <Button
                        key={project.id}
                        variant="outline"
                        className="w-full justify-between text-left h-auto py-3 px-4 hover:bg-indigo-50 hover:border-indigo-300"
                        onClick={() => {
                          const loaded = loadProject(project.id);
                          if (loaded) {
                            handleCalculate(loaded.input);
                            setCurrentProjectId(project.id);
                            setTodayDate(new Date());
                            if (loaded.assumptions) {
                              setAssumptions(loaded.assumptions);
                            }
                          }
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{project.name}</span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(project.savedAt), 'yyyy-MM-dd HH:mm')}
                          </span>
                        </div>
                        <FolderOpen className="w-4 h-4 text-gray-400" />
                      </Button>
                    ))}
                  </div>
                  {savedProjects.length > 5 && (
                    <p className="text-xs text-gray-400 text-center mb-4">
                      외 {savedProjects.length - 5}개 프로젝트 (프로젝트 관리에서 확인)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-6">저장된 프로젝트가 없습니다.</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setIsProjectModalOpen(true)}
                >
                  <FolderOpen className="w-4 h-4" />
                  프로젝트 관리
                </Button>
                <Button
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => {
                    if (!isSidebarOpen) setIsSidebarOpen(true);
                    setActiveTab('input');
                  }}
                >
                  <Calculator className="w-4 h-4" />
                  새 프로젝트 시작
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
