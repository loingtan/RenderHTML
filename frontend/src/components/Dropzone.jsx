import { useState, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Dropzone() {
  const { uploadFiles, loading } = useApp();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const items = e.dataTransfer.items;
    const validFiles = [];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file && isValidFile(file.name)) {
            validFiles.push(file);
          }
        }
      }
    } else {
      const droppedFiles = e.dataTransfer.files;
      for (let i = 0; i < droppedFiles.length; i++) {
        if (isValidFile(droppedFiles[i].name)) {
          validFiles.push(droppedFiles[i]);
        }
      }
    }

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  }, [uploadFiles]);

  const isValidFile = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    return ["html", "htm", "mhtml", "mht"].includes(ext);
  };

  const handleFileSelect = (e) => {
    const fileList = Array.from(e.target.files).filter((f) => isValidFile(f.name));
    if (fileList.length > 0) uploadFiles(fileList);
    e.target.value = "";
  };

  return (
    <div className="p-3 space-y-2">
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="file-dropzone"
        style={{ margin: 0, minHeight: 120, padding: "20px 16px" }}
      >
        <Upload size={28} className="dropzone-icon" />
        <div className="dropzone-text">
          {loading ? "Uploading..." : "Drop files here or click to upload"}
        </div>
        <div className="dropzone-subtext">.html, .htm, .mhtml, .mht</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.mhtml,.mht"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
          data-testid="file-input"
        />
      </div>
      <Button
        variant="outline"
        className="w-full rounded-none text-xs h-8 uppercase tracking-wider font-semibold"
        onClick={() => folderInputRef.current?.click()}
        disabled={loading}
        data-testid="folder-upload-btn"
      >
        <FolderOpen size={14} className="mr-1.5" />
        Upload Folder
      </Button>
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
        data-testid="folder-input"
      />
    </div>
  );
}
