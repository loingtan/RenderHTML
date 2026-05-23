import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Monitor,
  Smartphone,
  Maximize2,
  FileCode,
} from "lucide-react";

export function Renderer() {
  const { activeFile, activeContent, bookmarks, addBookmark } = useApp();
  const [viewport, setViewport] = useState("desktop");
  const iframeRef = useRef(null);

  const isBookmarked = activeFile && bookmarks.some((b) => b.file_id === activeFile.id);

  const handleBookmark = () => {
    if (activeFile && !isBookmarked && activeFile.id !== "paste-preview") {
      addBookmark(activeFile.id, activeFile.name);
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(activeContent);
        doc.close();
      }
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  };

  if (!activeFile) {
    return (
      <div className="main-workspace" data-testid="main-workspace">
        <div className="empty-state" data-testid="empty-state">
          <div
            className="empty-state-bg"
            style={{
              backgroundImage: `url(https://static.prod-images.emergentagent.com/jobs/93a3545f-af24-4c6f-bfff-34224c1feb16/images/de0b74c62464117ee3a5e7dce0a2fffed4e6a0b7b777660a3c80635bec0cc7e2.png)`,
            }}
          />
          <div className="empty-state-content">
            <FileCode size={48} className="empty-state-icon mx-auto" />
            <div className="empty-state-title">No file selected</div>
            <div className="empty-state-desc">
              Upload an HTML or MHTML file, paste raw HTML, or select a file from
              the sidebar to begin rendering.
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
          <FileCode size={16} style={{ color: "#0000FF", flexShrink: 0 }} />
          <span className="toolbar-filename" data-testid="toolbar-filename">
            {activeFile.name}
          </span>
        </div>
        <div className="toolbar-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-none ${viewport === "desktop" ? "bg-slate-100" : ""}`}
                onClick={() => setViewport("desktop")}
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
                className={`h-8 w-8 rounded-none ${viewport === "mobile" ? "bg-slate-100" : ""}`}
                onClick={() => setViewport("mobile")}
                data-testid="viewport-mobile-btn"
                aria-label="Mobile viewport"
              >
                <Smartphone size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mobile view</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-slate-200 mx-1" />

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
                className={`h-8 w-8 rounded-none ${isBookmarked ? "text-[#0000FF]" : ""}`}
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
        className={`render-frame ${viewport === "mobile" ? "mobile-viewport" : ""}`}
        data-testid="render-frame"
      >
        <iframe
          ref={iframeRef}
          srcDoc={activeContent}
          title="HTML Render"
          sandbox="allow-scripts allow-popups allow-forms"
          data-testid="render-iframe"
        />
      </div>
    </div>
  );
}
