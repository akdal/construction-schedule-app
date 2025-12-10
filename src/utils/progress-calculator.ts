import type { Task } from 'gantt-task-react';
import type { ExtendedTask } from './construction-logic';

/**
 * Calculate task progress based on reference date (기준일)
 *
 * @param task - The task to calculate progress for
 * @param referenceDate - The reference date (기준일) to compare against
 * @returns Progress percentage (0-100)
 */
export function calculateTaskProgress(task: Task, referenceDate: Date): number {
    const refTime = referenceDate.getTime();
    const startTime = task.start.getTime();
    const endTime = task.end.getTime();

    // If reference date is before task start → 0%
    if (refTime < startTime) {
        return 0;
    }

    // If reference date is after or equal to task end → 100%
    if (refTime >= endTime) {
        return 100;
    }

    // Otherwise → proportional progress
    const totalDuration = endTime - startTime;
    const elapsed = refTime - startTime;
    return Math.round((elapsed / totalDuration) * 100);
}

/**
 * Apply dynamic progress to all tasks based on reference date
 *
 * @param tasks - Array of tasks to process
 * @param referenceDate - The reference date (기준일) to calculate progress against
 * @returns New array of tasks with updated progress values
 */
export function applyProgressToTasks(tasks: ExtendedTask[], referenceDate: Date): ExtendedTask[] {
    return tasks.map(task => ({
        ...task,
        progress: calculateTaskProgress(task, referenceDate)
    }));
}
