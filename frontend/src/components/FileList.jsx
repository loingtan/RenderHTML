import { useApp } from "@/context/AppContext";
import { FileCode, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList() {
  const { files, activeFile, loadFileContent, deleteFile } = useApp();

  if (files.length === 0) {
    return <div className="no-items-message" data-testid="no-files-message">No files uploaded yet</div>;
  }

  return (
    <div data-testid="file-list">
      {files.map((file) => (
        <div
          key={file.id}
          className={`file-item ${activeFile?.id === file.id ? "active" : ""}`}
          onClick={() => loadFileContent(file.id, file.name)}
          data-testid={`file-item-${file.id}`}
        >
          <div className="file-item-icon">
            {file.file_type === "mhtml" ? (
              <FileText size={16} />
            ) : (
              <FileCode size={16} />
            )}
          </div>
          <div className="file-item-info">
            <div className="file-item-name">{file.name}</div>
            <div className="file-item-meta">
              {file.file_type.toUpperCase()} &middot; {formatSize(file.size)}
            </div>
          </div>
          <div className="file-item-actions">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-none text-slate-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.id);
                  }}
                  data-testid={`delete-file-${file.id}`}
                  aria-label="Delete file"
                >
                  <Trash2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete file</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
