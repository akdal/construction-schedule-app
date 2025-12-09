import React, { useState } from 'react';
import { X, FolderOpen, Save, Trash2, Upload, AlertCircle } from 'lucide-react';
import type { SavedProject } from '../utils/storage';
import { formatRelativeTime } from '../utils/storage';

interface ProjectManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedProjects: SavedProject[];
    currentProjectName: string | null;
    onSave: () => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
    isOpen,
    onClose,
    savedProjects,
    currentProjectName,
    onSave,
    onLoad,
    onDelete,
}) => {
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleDelete = (id: string) => {
        if (deleteConfirmId === id) {
            onDelete(id);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(id);
        }
    };

    const handleLoad = (id: string) => {
        onLoad(id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <FolderOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">프로젝트 관리</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Save Current Button */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <button
                        onClick={() => {
                            onSave();
                            // Don't close - let user see it was saved
                        }}
                        disabled={!currentProjectName}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                            currentProjectName
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Save className="w-4 h-4" />
                        {currentProjectName
                            ? `"${currentProjectName}" 저장하기`
                            : '프로젝트를 먼저 입력하세요'}
                    </button>
                </div>

                {/* Project List */}
                <div className="px-6 py-4 max-h-80 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">저장된 프로젝트</h3>

                    {savedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <AlertCircle className="w-10 h-10 mb-2 text-gray-300" />
                            <p className="text-sm">저장된 프로젝트가 없습니다</p>
                            <p className="text-xs mt-1">위 버튼을 눌러 현재 프로젝트를 저장하세요</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {savedProjects.map(project => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">
                                            {project.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatRelativeTime(project.savedAt)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 ml-3">
                                        <button
                                            onClick={() => handleLoad(project.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            불러오기
                                        </button>

                                        {deleteConfirmId === project.id ? (
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                            >
                                                확인
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                        프로젝트는 브라우저 로컬 스토리지에 저장됩니다
                    </p>
                </div>
            </div>
        </div>
    );
};
