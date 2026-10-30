"use client";

import React, { useState, useMemo } from "react";
import {
  Upload,
  Trash2,
  Copy,
  Check,
  Loader2,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderInput,
  Lock,
  Search,
  FileText,
  X,
  Layers,
  HardDrive,
} from "lucide-react";
import { ModalPortal } from "../../components/ui/modal-portal";

export interface MediaFolderItem {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  created_date?: string | Date;
  _count?: { files: number; children?: number };
}

export interface MediaItem {
  id: string;
  file_name: string;
  file_url: string;
  folder_id?: string | null;
  folder?: { id: string; name: string; slug: string; parent_id?: string | null } | null;
  created_date: string | Date;
  is_used?: boolean;
  usage_count?: number;
}

export interface MediaViewProps {
  media: MediaItem[];
  folders?: MediaFolderItem[];
  onUpload: (file: File, folderId?: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreateFolder?: (
    name: string,
    slug?: string,
    parentId?: string | null
  ) => Promise<MediaFolderItem | void>;
  onDeleteFolder?: (id: string) => Promise<void>;
  onMoveFile?: (fileId: string, targetFolderId: string | null) => Promise<void>;
}

function sanitizeFolderInput(name: string): string {
  return name
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/[ö]/g, "o")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_]+/, "");
}

function sanitizeFolderSlug(name: string): string {
  return sanitizeFolderInput(name).replace(/[-_]+$/, "");
}

function FolderTreePipeIcon({ showLine }: { showLine: boolean }) {
  return (
    <svg
      viewBox="0 0 18 28"
      fill="none"
      className="w-4 h-6 -my-1 text-slate-500 shrink-0"
      aria-hidden="true"
    >
      {showLine && (
        <path
          d="M 6 0 L 6 28"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function FolderTreeBranchIcon({ isLast }: { isLast: boolean }) {
  return (
    <svg
      viewBox="0 0 18 28"
      fill="none"
      className="w-4 h-6 -my-1 text-slate-500 shrink-0"
      aria-hidden="true"
    >
      {isLast ? (
        <path
          d="M 6 0 L 6 12 Q 6 14 8 14 L 17 14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path
            d="M 6 0 L 6 28"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M 6 14 L 17 14"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export function MediaView({
  media = [],
  folders = [],
  onUpload,
  onDelete,
  onCreateFolder,
  onDeleteFolder,
  onMoveFile,
}: MediaViewProps) {
  // Navigation: "ALL" | null (Root) | folder.id
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>("ALL");
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Folder creation modal state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Move file modal state
  const [movingFile, setMovingFile] = useState<MediaItem | null>(null);
  const [targetFolderChoice, setTargetFolderChoice] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Drag and drop state
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // Filtered files based on active folder selection and search
  const displayedFiles = useMemo(() => {
    return media.filter((item) => {
      // Folder filtering
      if (selectedFolderId === "ALL") {
        // all files
      } else if (selectedFolderId === null) {
        // root files only
        if (item.folder_id) return false;
      } else {
        // specific folder
        if (item.folder_id !== selectedFolderId) return false;
      }

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          item.file_name.toLowerCase().includes(query) ||
          item.file_url.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [media, selectedFolderId, search]);

  const effectiveFolders = useMemo(() => {
    const map = new Map<string, MediaFolderItem>();
    folders.forEach((f) => map.set(f.id, f));
    media.forEach((item) => {
      if (item.folder && !map.has(item.folder.id)) {
        map.set(item.folder.id, {
          id: item.folder.id,
          name: item.folder.name,
          slug: item.folder.slug,
          parent_id: item.folder.parent_id ?? null,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "sv"));
  }, [folders, media]);

  const rootLevelFolders = useMemo(
    () => effectiveFolders.filter((f) => !f.parent_id),
    [effectiveFolders]
  );

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, MediaFolderItem[]>();
    effectiveFolders.forEach((f) => {
      if (f.parent_id) {
        const list = map.get(f.parent_id) || [];
        list.push(f);
        map.set(f.parent_id, list);
      }
    });
    return map;
  }, [effectiveFolders]);

  // Folder counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: media.length,
      ROOT: 0,
    };
    effectiveFolders.forEach((f) => {
      counts[f.id] = 0;
    });
    media.forEach((item) => {
      if (!item.folder_id) {
        counts.ROOT = (counts.ROOT || 0) + 1;
      } else {
        counts[item.folder_id] = (counts[item.folder_id] || 0) + 1;
      }
    });
    return counts;
  }, [media, effectiveFolders]);

  const activeFolder = useMemo(() => {
    if (selectedFolderId === "ALL" || selectedFolderId === null) return null;
    return effectiveFolders.find((f) => f.id === selectedFolderId) || null;
  }, [effectiveFolders, selectedFolderId]);

  const activeFolderBreadcrumb = useMemo(() => {
    if (selectedFolderId === "ALL") return "All Files";
    if (selectedFolderId === null || !activeFolder) return "Mediafolder";
    if (activeFolder.parent_id) {
      const parent = effectiveFolders.find((f) => f.id === activeFolder.parent_id);
      if (parent) {
        return `Mediafolder / ${parent.name} / ${activeFolder.name}`;
      }
    }
    return `Mediafolder / ${activeFolder.name}`;
  }, [selectedFolderId, activeFolder, effectiveFolders]);

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    setActionError(null);
    const uploadFolderId = selectedFolderId === "ALL" ? null : selectedFolderId;

    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        await onUpload(files[i], uploadFolderId);
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to upload file(s)");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await uploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleDropzoneDragOver = (e: React.DragEvent) => {
    // Ignore internal media card drags
    if (draggedFileId) return;
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      if (!isDropzoneActive) setIsDropzoneActive(true);
    }
  };

  const handleDropzoneDragLeave = (e: React.DragEvent) => {
    if (draggedFileId) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneActive(false);
  };

  const handleDropzoneDrop = async (e: React.DragEvent) => {
    if (draggedFileId) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDropzoneActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteFile = async (item: MediaItem) => {
    if (item.is_used) {
      alert("This file is currently in use on the website and cannot be deleted.");
      return;
    }
    if (!confirm(`Delete "${item.file_name}"?`)) return;

    setActionError(null);
    try {
      await onDelete(item.id);
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete file");
    }
  };

  const handleOpenCreateFolder = (defaultParentId?: string | null) => {
    setNewFolderName("");
    if (defaultParentId !== undefined) {
      setNewFolderParentId(defaultParentId);
    } else if (activeFolder) {
      setNewFolderParentId(activeFolder.parent_id ? activeFolder.parent_id : activeFolder.id);
    } else {
      setNewFolderParentId(null);
    }
    setIsCreateFolderOpen(true);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = sanitizeFolderSlug(newFolderName);
    if (!cleanedName) return;

    setIsCreatingFolder(true);
    setActionError(null);
    try {
      if (onCreateFolder) {
        const created = await onCreateFolder(cleanedName, cleanedName, newFolderParentId);
        if (created && created.id) {
          setSelectedFolderId(created.id);
        }
      }
      setIsCreateFolderOpen(false);
      setNewFolderName("");
      setNewFolderParentId(null);
    } catch (err: any) {
      setActionError(err?.message || "Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: MediaFolderItem) => {
    const childCount = childrenByParentId.get(folder.id)?.length || 0;
    if (childCount > 0) {
      alert(`The folder "${folder.name}" contains ${childCount} subfolder(s). Delete the subfolders first.`);
      return;
    }
    const count = folderCounts[folder.id] || 0;
    if (count > 0) {
      alert(`The folder "${folder.name}" contains ${count} file(s). Move or delete the files first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete the empty folder "${folder.name}"?`)) {
      return;
    }

    setActionError(null);
    try {
      if (onDeleteFolder) {
        await onDeleteFolder(folder.id);
        if (selectedFolderId === folder.id) {
          setSelectedFolderId(folder.parent_id || "ALL");
        }
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete folder");
    }
  };

  const handleOpenMoveModal = (file: MediaItem) => {
    setMovingFile(file);
    setTargetFolderChoice(file.folder_id || null);
  };

  const handleConfirmMove = async () => {
    if (!movingFile || !onMoveFile) return;

    setIsMoving(true);
    setActionError(null);
    try {
      await onMoveFile(movingFile.id, targetFolderChoice);
      setMovingFile(null);
    } catch (err: any) {
      setActionError(err?.message || "Failed to move file");
    } finally {
      setIsMoving(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData("text/plain", fileId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedFileId(fileId);
  };

  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDragOverFolderId(null);
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const fileId = e.dataTransfer.getData("text/plain") || draggedFileId;
    if (!fileId || !onMoveFile) return;

    const file = media.find((m) => m.id === fileId);
    if (!file) return;

    // Do nothing if already in target folder
    const currentFolderId = file.folder_id || null;
    if (currentFolderId === targetFolderId) return;

    setActionError(null);
    try {
      await onMoveFile(fileId, targetFolderId);
    } catch (err: any) {
      setActionError(err?.message || "Failed to move file");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Media & Files</h1>
          <p className="mt-1 text-xs text-slate-400">
            Organize files into folders, manage uploads, and inspect asset usage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCreateFolder && (
            <button
              type="button"
              onClick={() => handleOpenCreateFolder()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-700 transition"
            >
              <FolderPlus className="w-4 h-4 text-sky-400" />
              <span>New Folder</span>
            </button>
          )}

          <label className="flex items-center gap-2 cursor-pointer rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>
              {isUploading
                ? uploadProgress && uploadProgress.total > 1
                  ? `Uploading (${uploadProgress.current}/${uploadProgress.total})...`
                  : "Uploading..."
                : activeFolder
                ? `Upload to ${activeFolder.name}`
                : "Upload File"}
            </span>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout: Sidebar Folders + Files Display */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Folders Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Folders
              </span>
              {onCreateFolder && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateFolder(null)}
                  className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                  title="Create new folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              {/* All Files View */}
              <button
                type="button"
                onClick={() => setSelectedFolderId("ALL")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  selectedFolderId === "ALL"
                    ? "bg-sky-600/15 border border-sky-500/30 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Layers className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">All Files</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                  {folderCounts.ALL || 0}
                </span>
              </button>

              {/* Mediafolder (Root) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverFolderId !== "ROOT") setDragOverFolderId("ROOT");
                }}
                onDragLeave={() => {
                  if (dragOverFolderId === "ROOT") setDragOverFolderId(null);
                }}
                onDrop={(e) => handleFolderDrop(e, null)}
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  dragOverFolderId === "ROOT"
                    ? "border-2 border-dashed border-sky-400 bg-sky-500/20 text-white"
                    : selectedFolderId === null
                    ? "bg-sky-600/15 border border-sky-500/30 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {selectedFolderId === null ? (
                    <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">Mediafolder</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                  {folderCounts.ROOT || 0}
                </span>
              </div>

              {/* User Folders (Level 1 & Level 2) */}
              {rootLevelFolders.map((folder, index) => {
                const isSelected = selectedFolderId === folder.id;
                const isDragOver = dragOverFolderId === folder.id;
                const count = folderCounts[folder.id] || 0;
                const isLastTop = index === rootLevelFolders.length - 1;
                const childFolders = childrenByParentId.get(folder.id) || [];
                const canDeleteTop = count === 0 && childFolders.length === 0;

                return (
                  <React.Fragment key={folder.id}>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverFolderId !== folder.id) setDragOverFolderId(folder.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                      }}
                      onDrop={(e) => handleFolderDrop(e, folder.id)}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isDragOver
                          ? "border-2 border-dashed border-sky-400 bg-sky-500/20 text-white"
                          : isSelected
                          ? "bg-sky-600/15 border border-sky-500/30 text-white font-semibold"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FolderTreeBranchIcon isLast={isLastTop} />
                        {isSelected ? (
                          <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : (
                          <Folder className="w-4 h-4 text-slate-400 group-hover:text-sky-300 shrink-0" />
                        )}
                        <span className="truncate pl-0.5" title={folder.name}>
                          {folder.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {onCreateFolder && (
                          <button
                            type="button"
                            onClick={() => handleOpenCreateFolder(folder.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition"
                            title={`Create subfolder in ${folder.name}`}
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteTop && onDeleteFolder && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFolder(folder)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                            title="Delete empty folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {count}
                        </span>
                      </div>
                    </div>

                    {/* Level 2 Subfolders */}
                    {childFolders.map((child, childIdx) => {
                      const isChildSelected = selectedFolderId === child.id;
                      const isChildDragOver = dragOverFolderId === child.id;
                      const childCount = folderCounts[child.id] || 0;
                      const isLastChild = childIdx === childFolders.length - 1;

                      return (
                        <div
                          key={child.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverFolderId !== child.id) setDragOverFolderId(child.id);
                          }}
                          onDragLeave={() => {
                            if (dragOverFolderId === child.id) setDragOverFolderId(null);
                          }}
                          onDrop={(e) => handleFolderDrop(e, child.id)}
                          onClick={() => setSelectedFolderId(child.id)}
                          className={`group w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                            isChildDragOver
                              ? "border-2 border-dashed border-sky-400 bg-sky-500/20 text-white"
                              : isChildSelected
                              ? "bg-sky-600/15 border border-sky-500/30 text-white font-semibold"
                              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FolderTreePipeIcon showLine={!isLastTop} />
                            <FolderTreeBranchIcon isLast={isLastChild} />
                            {isChildSelected ? (
                              <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-slate-400 group-hover:text-sky-300 shrink-0" />
                            )}
                            <span className="truncate pl-0.5" title={`${folder.name}/${child.name}`}>
                              {child.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {childCount === 0 && onDeleteFolder && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFolder(child)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                                title="Delete empty folder"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                              {childCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Files Content Area */}
        <div
          className="w-full flex-1 min-w-0 space-y-4"
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onDrop={handleDropzoneDrop}
        >
          {/* Top Filter and Breadcrumb Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Path:</span>
              <span className="font-semibold text-white">
                {activeFolderBreadcrumb}
              </span>
              <span className="text-slate-600 font-mono">
                ({displayedFiles.length} {displayedFiles.length === 1 ? "file" : "files"})
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Always-visible Multi-File Dropzone */}
          <label
            onDragOver={handleDropzoneDragOver}
            onDragLeave={handleDropzoneDragLeave}
            onDrop={handleDropzoneDrop}
            className={`block w-full text-center rounded-2xl border-2 border-dashed transition cursor-pointer ${
              displayedFiles.length === 0 ? "py-14 px-6" : "py-5 px-4"
            } ${
              isDropzoneActive
                ? "border-sky-400 bg-sky-500/15 text-sky-200"
                : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50 text-slate-400"
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                  <div className="text-xs font-medium text-sky-300">
                    {uploadProgress && uploadProgress.total > 1
                      ? `Uploading file ${uploadProgress.current} of ${uploadProgress.total}...`
                      : "Uploading file..."}
                  </div>
                </>
              ) : (
                <>
                  <Upload
                    className={`${
                      displayedFiles.length === 0 ? "w-7 h-7" : "w-5 h-5"
                    } ${isDropzoneActive ? "text-sky-400" : "text-slate-500"}`}
                  />
                  {displayedFiles.length === 0 && (
                    <div className="text-xs font-medium text-slate-400">
                      No files in this folder.
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500">
                    Drag and drop files here or click Upload File to add items.
                  </div>
                </>
              )}
            </div>
          </label>

          {/* Files Grid */}
          {displayedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayedFiles.map((item) => {
                const isPdf = item.file_name.toLowerCase().endsWith(".pdf");
                const isDragging = draggedFileId === item.id;

                return (
                  <div
                    key={item.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`group relative rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col hover:border-slate-700 transition shadow-sm ${
                      isDragging ? "opacity-30 scale-95" : ""
                    }`}
                  >
                    {/* Thumbnail View */}
                    <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing">
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                          <FileText className="w-8 h-8 text-rose-400" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                            PDF Document
                          </span>
                        </div>
                      ) : (
                        <img
                          src={item.file_url}
                          alt={item.file_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      )}

                      {/* In-Use Badge */}
                      {item.is_used && (
                        <div
                          className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-slate-950/80 backdrop-blur border border-amber-500/40 px-2 py-0.5 text-[10px] font-medium text-amber-300 shadow"
                          title={`Used on pages/galleries (${item.usage_count || 1})`}
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>In use</span>
                        </div>
                      )}

                      {/* Folder Name Badge (when in All Files view) */}
                      {selectedFolderId === "ALL" && item.folder && (
                        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-slate-950/80 backdrop-blur border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300 shadow">
                          <Folder className="w-2.5 h-2.5 text-sky-400" />
                          <span className="truncate max-w-[140px]">{item.folder.slug || item.folder.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-900/90">
                      <div className="truncate text-xs font-medium text-slate-200" title={item.file_name}>
                        {item.file_name}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy URL */}
                        <button
                          type="button"
                          onClick={() => copyUrl(item.id, item.file_url)}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                          title="Copy file URL"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Move to folder */}
                        {onMoveFile && (
                          <button
                            type="button"
                            onClick={() => handleOpenMoveModal(item)}
                            className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                            title="Move file to another folder"
                          >
                            <FolderInput className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete file */}
                        <button
                          type="button"
                          disabled={item.is_used}
                          onClick={() => handleDeleteFile(item)}
                          className={`p-1 rounded transition ${
                            item.is_used
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-slate-400 hover:text-red-400 hover:bg-slate-800"
                          }`}
                          title={
                            item.is_used
                              ? "This file is in use on the website and cannot be deleted"
                              : "Delete file"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">Create New Folder</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Parent Folder
                  </label>
                  <select
                    value={newFolderParentId || ""}
                    onChange={(e) => setNewFolderParentId(e.target.value || null)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">Mediafolder (Root level)</option>
                    {rootLevelFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        Mediafolder / {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cabins, activities"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(sanitizeFolderInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500">
                    Allowed characters: a-z, 0-9, hyphen (-) and underscore (_).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateFolderOpen(false)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingFolder || !sanitizeFolderSlug(newFolderName)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
                  >
                    {isCreatingFolder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Folder</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Move File Modal */}
      {movingFile && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderInput className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">Move File to Folder</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMovingFile(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-slate-300">
                  Move <span className="font-semibold text-white">"{movingFile.file_name}"</span> to:
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 border border-slate-800 rounded-xl p-2 bg-slate-900/60">
                  {/* Option: Mediafolder (Root) */}
                  <label
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition ${
                      targetFolderChoice === null
                        ? "bg-sky-600/20 border border-sky-500/40 text-white font-semibold"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {targetFolderChoice === null ? (
                        <FolderOpen className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Folder className="w-4 h-4 text-slate-400" />
                      )}
                      <span>Mediafolder</span>
                    </div>
                    <input
                      type="radio"
                      name="targetFolder"
                      checked={targetFolderChoice === null}
                      onChange={() => setTargetFolderChoice(null)}
                      className="text-sky-600 focus:ring-0"
                    />
                  </label>

                  {/* Options: User Folders (Level 1 & Level 2) */}
                  {rootLevelFolders.map((f, idx) => {
                    const isLastTop = idx === rootLevelFolders.length - 1;
                    const childFolders = childrenByParentId.get(f.id) || [];

                    return (
                      <React.Fragment key={f.id}>
                        <label
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                            targetFolderChoice === f.id
                              ? "bg-sky-600/20 border border-sky-500/40 text-white font-semibold"
                              : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <FolderTreeBranchIcon isLast={isLastTop} />
                            <Folder className="w-4 h-4 text-sky-400 shrink-0" />
                            <span className="pl-0.5">{f.name}</span>
                          </div>
                          <input
                            type="radio"
                            name="targetFolder"
                            checked={targetFolderChoice === f.id}
                            onChange={() => setTargetFolderChoice(f.id)}
                            className="text-sky-600 focus:ring-0"
                          />
                        </label>

                        {childFolders.map((child, childIdx) => {
                          const isLastChild = childIdx === childFolders.length - 1;
                          return (
                            <label
                              key={child.id}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                                targetFolderChoice === child.id
                                  ? "bg-sky-600/20 border border-sky-500/40 text-white font-semibold"
                                  : "text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <FolderTreePipeIcon showLine={!isLastTop} />
                                <FolderTreeBranchIcon isLast={isLastChild} />
                                <Folder className="w-4 h-4 text-sky-400 shrink-0" />
                                <span className="pl-0.5">{child.name}</span>
                              </div>
                              <input
                                type="radio"
                                name="targetFolder"
                                checked={targetFolderChoice === child.id}
                                onChange={() => setTargetFolderChoice(child.id)}
                                className="text-sky-600 focus:ring-0"
                              />
                            </label>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500">
                  The physical file path and database URL will be updated, and the Next.js cache will be cleared automatically.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMovingFile(null)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isMoving}
                    onClick={handleConfirmMove}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
                  >
                    {isMoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Move File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
