import { useState, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MarkdownViewer, MarkdownEditor } from "@/components/MarkdownRenderer";
import { PdfRenderer } from "@/components/PdfRenderer";
import {
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Monitor,
  Smartphone,
  Maximize2,
  FileCode,
  FileText,
  Pencil,
  Eye,
  Save,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

function detectFileType(file) {
  if (!file) return "unknown";
  var name = (file.name || "").toLowerCase();
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".mhtml") || name.endsWith(".mht")) return "mhtml";
  return "html";
}

export function Renderer() {
  var app = useApp();
  var activeFile = app.activeFile;
  var activeContent = app.activeContent;
  var bookmarks = app.bookmarks;
  var addBookmark = app.addBookmark;
  var updateFileContent = app.updateFileContent;
  var [viewport, setViewport] = useState("desktop");
  var [editMode, setEditMode] = useState(false);
  var [editContent, setEditContent] = useState("");
  var [zoom, setZoom] = useState(100);
  var iframeRef = useRef(null);

  var zoomIn = useCallback(function () { setZoom(function (z) { return Math.min(z + 25, 300); }); }, []);
  var zoomOut = useCallback(function () { setZoom(function (z) { return Math.max(z - 25, 25); }); }, []);
  var zoomReset = useCallback(function () { setZoom(100); }, []);

  var isBookmarked = activeFile && bookmarks.some(function (b) { return b.file_id === activeFile.id; });
  var fileType = activeFile ? (activeFile.file_type || detectFileType(activeFile)) : "unknown";
  var isMarkdown = fileType === "markdown";
  var isPdf = fileType === "pdf";
  var isHtml = fileType === "html" || fileType === "mhtml";

  var handleBookmark = useCallback(function () {
    if (activeFile && !isBookmarked && activeFile.id !== "paste-preview") {
      addBookmark(activeFile.id, activeFile.name);
    }
  }, [activeFile, isBookmarked, addBookmark]);

  var handleRefresh = useCallback(function () {
    if (iframeRef.current && isHtml) {
      var doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(activeContent);
        doc.close();
      }
    }
  }, [activeContent, isHtml]);

  var handleFullscreen = useCallback(function () {
    var el = document.querySelector('[data-testid="render-frame"]');
    if (el) el.requestFullscreen && el.requestFullscreen();
  }, []);

  var handleToggleEdit = useCallback(function () {
    if (!editMode) {
      setEditContent(activeContent);
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  }, [editMode, activeContent]);

  var handleSaveMarkdown = useCallback(function (content) {
    if (activeFile && activeFile.id !== "paste-preview") {
      updateFileContent(activeFile.id, content);
      setEditContent(content);
    }
  }, [activeFile, updateFileContent]);

  if (!activeFile) {
    return (
      <div className="main-workspace" data-testid="main-workspace">
        <div className="empty-state" data-testid="empty-state">
          <div
            className="empty-state-bg"
            style={{
              backgroundImage: "url(https://static.prod-images.emergentagent.com/jobs/93a3545f-af24-4c6f-bfff-34224c1feb16/images/de0b74c62464117ee3a5e7dce0a2fffed4e6a0b7b777660a3c80635bec0cc7e2.png)",
            }}
          />
          <div className="empty-state-content">
            <FileCode size={48} className="empty-state-icon mx-auto" />
            <div className="empty-state-title">No file selected</div>
            <div className="empty-state-desc">
              Upload HTML, MHTML, Markdown, or PDF files. Paste raw HTML. Select a file from the sidebar to view or edit.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-workspace" data-testid="main-workspace">
      <div className="toolbar" data-testid="toolbar">
        <div className="toolbar-left">
          {isPdf ? <FileText size={16} style={{ color: "#FF3333", flexShrink: 0 }} /> :
           isMarkdown ? <FileText size={16} style={{ color: "#0000FF", flexShrink: 0 }} /> :
           <FileCode size={16} style={{ color: "#0000FF", flexShrink: 0 }} />}
          <span className="toolbar-filename" data-testid="toolbar-filename">
            {activeFile.name}
          </span>
          {isMarkdown && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-2">
              {editMode ? "Editing" : "Viewing"}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          {isMarkdown && activeFile.id !== "paste-preview" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={"h-8 w-8 rounded-none " + (editMode ? "bg-[#0000FF]/10 text-[#0000FF]" : "")}
                    onClick={handleToggleEdit}
                    data-testid="toggle-edit-btn"
                    aria-label={editMode ? "Switch to view" : "Edit markdown"}
                  >
                    {editMode ? <Eye size={16} /> : <Pencil size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{editMode ? "View mode" : "Edit mode"}</TooltipContent>
              </Tooltip>
              {editMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none text-green-600"
                      onClick={function () { handleSaveMarkdown(editContent); }}
                      data-testid="save-markdown-btn"
                      aria-label="Save changes"
                    >
                      <Save size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (Ctrl+S)</TooltipContent>
                </Tooltip>
              )}
              <div className="w-px h-5 bg-slate-200 mx-1" />
            </>
          )}

          {isHtml && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={"h-8 w-8 rounded-none " + (viewport === "desktop" ? "bg-slate-100" : "")}
                    onClick={function () { setViewport("desktop"); }}
                    data-testid="viewport-desktop-btn"
                    aria-label="Desktop viewport"
                  >
                    <Monitor size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Desktop view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={"h-8 w-8 rounded-none " + (viewport === "mobile" ? "bg-slate-100" : "")}
                    onClick={function () { setViewport("mobile"); }}
                    data-testid="viewport-mobile-btn"
                    aria-label="Mobile viewport"
                  >
                    <Smartphone size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mobile view</TooltipContent>
              </Tooltip>
              <div className="w-px h-5 bg-slate-200 mx-1" />
            </>
          )}

          {isHtml && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={zoomOut}
                    disabled={zoom <= 25}
                    data-testid="zoom-out-btn"
                    aria-label="Zoom out"
                  >
                    <ZoomOut size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out</TooltipContent>
              </Tooltip>
              <button
                onClick={zoomReset}
                className="h-8 px-1.5 text-[11px] font-mono font-semibold text-slate-600 hover:text-[#0000FF] transition-colors"
                data-testid="zoom-level"
                aria-label="Reset zoom"
                title="Click to reset"
              >
                {zoom}%
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={zoomIn}
                    disabled={zoom >= 300}
                    data-testid="zoom-in-btn"
                    aria-label="Zoom in"
                  >
                    <ZoomIn size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in</TooltipContent>
              </Tooltip>
              <div className="w-px h-5 bg-slate-200 mx-1" />
            </>
          )}

          {isHtml && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  onClick={handleRefresh}
                  data-testid="refresh-btn"
                  aria-label="Refresh render"
                >
                  <RefreshCw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={handleFullscreen}
                data-testid="fullscreen-btn"
                aria-label="Fullscreen"
              >
                <Maximize2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={"h-8 w-8 rounded-none " + (isBookmarked ? "text-[#0000FF]" : "")}
                onClick={handleBookmark}
                disabled={isBookmarked || activeFile.id === "paste-preview"}
                data-testid="bookmark-btn"
                aria-label={isBookmarked ? "Already bookmarked" : "Bookmark this file"}
              >
                {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isBookmarked ? "Already bookmarked" : activeFile.id === "paste-preview" ? "Save first to bookmark" : "Bookmark"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        className={"render-frame" + (isHtml && viewport === "mobile" ? " mobile-viewport" : "")}
        data-testid="render-frame"
      >
        {isHtml && (
          <iframe
            ref={iframeRef}
            srcDoc={activeContent}
            title="HTML Render"
            sandbox="allow-scripts allow-popups allow-forms"
            style={{
              transform: "scale(" + (zoom / 100) + ")",
              transformOrigin: "0 0",
              width: (10000 / zoom) + "%",
              height: (10000 / zoom) + "%",
            }}
            data-testid="render-iframe"
          />
        )}
        {isMarkdown && !editMode && (
          <div className="overflow-auto h-full bg-white">
            <MarkdownViewer content={activeContent} />
          </div>
        )}
        {isMarkdown && editMode && (
          <MarkdownEditor
            content={editContent}
            onSave={handleSaveMarkdown}
            onChange={function (val) { setEditContent(val); }}
          />
        )}
        {isPdf && (
          <PdfRenderer content={activeContent} />
        )}
      </div>
    </div>
  );
}
