import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { FileCode, FileText, Trash2, Folder, FolderOpen, ChevronRight, ChevronDown, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Flatten file list into renderable rows: folders + files with depth info.
 * Returns [{type: "folder", name, path, depth, fileCount}, {type: "file", file, depth}]
 */
function buildRows(files) {
  // Separate: files with folder structure vs standalone
  const foldered = files.filter(function (f) {
    return f.relative_path && f.relative_path.includes("/");
  });
  const standalone = files.filter(function (f) {
    return !f.relative_path || !f.relative_path.includes("/");
  });

  // Collect all unique folder paths
  var folderPaths = {};
  foldered.forEach(function (f) {
    var parts = f.relative_path.replace(/\\/g, "/").split("/");
    // Build all ancestor paths: ["a"], ["a","b"], etc.
    for (var i = 1; i < parts.length; i++) {
      var fp = parts.slice(0, i).join("/");
      if (!folderPaths[fp]) {
        folderPaths[fp] = { name: parts[i - 1], depth: i - 1, path: fp, files: [] };
      }
    }
    // Assign file to its direct parent folder
    var parentPath = parts.slice(0, parts.length - 1).join("/");
    if (folderPaths[parentPath]) {
      folderPaths[parentPath].files.push(f);
    }
  });

  // Sort folder paths for consistent order
  var sortedFolders = Object.keys(folderPaths).sort();

  // Build flat rows
  var rows = [];
  sortedFolders.forEach(function (fp) {
    var info = folderPaths[fp];
    rows.push({ type: "folder", name: info.name, path: fp, depth: info.depth, fileCount: info.files.length });
    info.files.forEach(function (file) {
      rows.push({ type: "file", file: file, depth: info.depth + 1, parentPath: fp });
    });
  });

  // Add standalone files at the end
  standalone.forEach(function (file) {
    rows.push({ type: "file", file: file, depth: 0, parentPath: "" });
  });

  return rows;
}

function sortFiles(files, sortBy) {
  var sorted = files.slice();
  switch (sortBy) {
    case "newest":
      sorted.sort(function (a, b) { return (b.created_at || "").localeCompare(a.created_at || ""); });
      break;
    case "oldest":
      sorted.sort(function (a, b) { return (a.created_at || "").localeCompare(b.created_at || ""); });
      break;
    case "name-asc":
      sorted.sort(function (a, b) { return (a.name || "").localeCompare(b.name || ""); });
      break;
    case "name-desc":
      sorted.sort(function (a, b) { return (b.name || "").localeCompare(a.name || ""); });
      break;
    case "size-desc":
      sorted.sort(function (a, b) { return (b.size || 0) - (a.size || 0); });
      break;
    case "size-asc":
      sorted.sort(function (a, b) { return (a.size || 0) - (b.size || 0); });
      break;
    case "type":
      sorted.sort(function (a, b) { return (a.file_type || "").localeCompare(b.file_type || ""); });
      break;
    default:
      break;
  }
  return sorted;
}

export function FileList({ searchQuery, sortBy }) {
  var app = useApp();
  var files = app.files;
  var activeFile = app.activeFile;
  var loadFileContent = app.loadFileContent;
  var deleteFile = app.deleteFile;
  var renameFile = app.renameFile;
  var [collapsedFolders, setCollapsedFolders] = useState({});
  var [editingId, setEditingId] = useState(null);
  var [editName, setEditName] = useState("");

  var query = (searchQuery || "").trim().toLowerCase();
  var currentSort = sortBy || "newest";

  // Filter files when search is active
  var filteredFiles = useMemo(function () {
    var list = files;
    if (query) {
      list = list.filter(function (f) {
        var name = (f.name || "").toLowerCase();
        var path = (f.relative_path || "").toLowerCase();
        return name.includes(query) || path.includes(query);
      });
    }
    return sortFiles(list, currentSort);
  }, [files, query, currentSort]);

  var rows = useMemo(function () {
    // When searching or sorting non-default, show flat list for clarity
    if (query || currentSort !== "newest") {
      return filteredFiles.map(function (file) {
        return { type: "file", file: file, depth: 0, parentPath: "" };
      });
    }
    return buildRows(filteredFiles);
  }, [filteredFiles, query, currentSort]);

  if (files.length === 0) {
    return <div className="no-items-message" data-testid="no-files-message">No files uploaded yet</div>;
  }

  if (query && filteredFiles.length === 0) {
    return <div className="no-items-message" data-testid="no-search-results">No files match "{searchQuery}"</div>;
  }

  function toggleFolder(path) {
    setCollapsedFolders(function (prev) {
      var next = Object.assign({}, prev);
      next[path] = !next[path];
      return next;
    });
  }

  function isFolderCollapsed(path) {
    return !!collapsedFolders[path];
  }

  function isHiddenByParent(row) {
    if (row.type === "folder") {
      // Check if any ancestor folder is collapsed
      var parts = row.path.split("/");
      for (var i = 1; i < parts.length; i++) {
        var ancestor = parts.slice(0, i).join("/");
        if (collapsedFolders[ancestor]) return true;
      }
      return false;
    }
    // For files, check if parent folder is collapsed
    if (row.parentPath) {
      if (collapsedFolders[row.parentPath]) return true;
      // Also check ancestors of parent
      var pp = row.parentPath.split("/");
      for (var j = 1; j < pp.length; j++) {
        var anc = pp.slice(0, j).join("/");
        if (collapsedFolders[anc]) return true;
      }
    }
    return false;
  }

  return (
    <div data-testid="file-list">
      {rows.map(function (row, idx) {
        if (isHiddenByParent(row)) return null;

        if (row.type === "folder") {
          var isOpen = !isFolderCollapsed(row.path);
          return (
            <div
              key={"folder-" + row.path}
              className="file-item"
              style={{ paddingLeft: 12 + row.depth * 16 + "px" }}
              onClick={function () { toggleFolder(row.path); }}
              data-testid={"folder-toggle-" + row.name}
            >
              <span className="text-slate-400" style={{ width: 16, display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <div className="file-item-icon" style={{ color: "#0000FF" }}>
                {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
              </div>
              <div className="file-item-info">
                <div className="file-item-name">{row.name}</div>
                <div className="file-item-meta">{row.fileCount} file{row.fileCount !== 1 ? "s" : ""}</div>
              </div>
            </div>
          );
        }

        // File row
        var file = row.file;
        var isEditing = editingId === file.id;
        return (
          <div
            key={file.id}
            className={"file-item" + (activeFile && activeFile.id === file.id ? " active" : "")}
            style={{ paddingLeft: 12 + row.depth * 16 + "px" }}
            onClick={function () { if (!isEditing) loadFileContent(file.id, file.name); }}
            data-testid={"file-item-" + file.id}
          >
            <div className="file-item-icon">
              {file.file_type === "mhtml" ? <FileText size={16} /> : <FileCode size={16} />}
            </div>
            <div className="file-item-info">
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={function (e) { e.stopPropagation(); }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={function (e) { setEditName(e.target.value); }}
                    onKeyDown={function (e) {
                      if (e.key === "Enter") {
                        if (editName.trim()) { renameFile(file.id, editName.trim()); }
                        setEditingId(null);
                      }
                      if (e.key === "Escape") { setEditingId(null); }
                    }}
                    autoFocus
                    className="text-xs border border-[#0000FF] bg-white px-1.5 py-0.5 w-full outline-none focus:ring-1 focus:ring-[#0000FF]/20"
                    data-testid={"rename-input-" + file.id}
                  />
                  <button
                    onClick={function () {
                      if (editName.trim()) { renameFile(file.id, editName.trim()); }
                      setEditingId(null);
                    }}
                    className="text-green-600 hover:text-green-700 flex-shrink-0"
                    data-testid={"rename-confirm-" + file.id}
                    aria-label="Confirm rename"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={function () { setEditingId(null); }}
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    data-testid={"rename-cancel-" + file.id}
                    aria-label="Cancel rename"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="file-item-name">{file.name}</div>
                  <div className="file-item-meta">
                    {file.file_type.toUpperCase()} &middot; {formatSize(file.size)}
                    {(query || currentSort !== "newest") && file.relative_path ? " \u00B7 " + file.relative_path : ""}
                  </div>
                </>
              )}
            </div>
            {!isEditing && (
              <div className="file-item-actions">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none text-slate-400 hover:text-[#0000FF]"
                      onClick={function (e) {
                        e.stopPropagation();
                        setEditingId(file.id);
                        setEditName(file.name);
                      }}
                      data-testid={"rename-file-" + file.id}
                      aria-label="Rename file"
                    >
                      <Pencil size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rename</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none text-slate-400 hover:text-red-500"
                      onClick={function (e) {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      data-testid={"delete-file-" + file.id}
                      aria-label="Delete file"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete file</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
