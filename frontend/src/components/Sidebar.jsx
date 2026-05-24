import { useState, useRef, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/Dropzone";
import { FileList } from "@/components/FileList";
import { BookmarkList } from "@/components/BookmarkList";
import { PasteEditor } from "@/components/PasteEditor";
import { useApp } from "@/context/AppContext";
import { FileCode, Bookmark, ClipboardPaste, Search, X, Trash2 } from "lucide-react";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState("files");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const searchRef = useRef(null);
  const { files, clearAllFiles } = useApp();

  // Global keyboard shortcut: Ctrl+F / Cmd+F to focus search
  useEffect(function () {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setActiveTab("files");
        // Small delay so tab switch renders the input first
        setTimeout(function () {
          if (searchRef.current) {
            searchRef.current.focus();
            searchRef.current.select();
          }
        }, 50);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return function () { window.removeEventListener("keydown", handleKeyDown); };
  }, []);

  // Escape clears search when input focused
  var handleSearchKeyDown = useCallback(function (e) {
    if (e.key === "Escape") {
      setSearchQuery("");
      if (searchRef.current) searchRef.current.blur();
    }
  }, []);

  var handleConfirmClear = useCallback(function () {
    clearAllFiles();
    setShowClearDialog(false);
    setSearchQuery("");
  }, [clearAllFiles]);

  return (
    <aside className="sidebar" data-testid="sidebar">
      <div className="sidebar-header">
        <FileCode size={20} strokeWidth={2.5} style={{ color: "#0000FF" }} />
        <h1>HTML Viewer</h1>
      </div>
      <div className="sidebar-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
          <TabsList className="w-full rounded-none border-b border-slate-200 bg-transparent p-0 h-10" data-testid="sidebar-tabs">
            <TabsTrigger
              value="files"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0000FF] data-[state=active]:bg-transparent data-[state=active]:text-[#0000FF] data-[state=active]:shadow-none text-xs uppercase tracking-wider font-semibold h-10"
              data-testid="tab-files"
            >
              <FileCode size={14} className="mr-1.5" />
              Files
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0000FF] data-[state=active]:bg-transparent data-[state=active]:text-[#0000FF] data-[state=active]:shadow-none text-xs uppercase tracking-wider font-semibold h-10"
              data-testid="tab-bookmarks"
            >
              <Bookmark size={14} className="mr-1.5" />
              Bookmarks
            </TabsTrigger>
            <TabsTrigger
              value="paste"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0000FF] data-[state=active]:bg-transparent data-[state=active]:text-[#0000FF] data-[state=active]:shadow-none text-xs uppercase tracking-wider font-semibold h-10"
              data-testid="tab-paste"
            >
              <ClipboardPaste size={14} className="mr-1.5" />
              Paste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="flex-1 flex flex-col overflow-hidden mt-0 min-h-0">
            <Dropzone />
            <div className="px-3 pb-2 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search files...  (Ctrl+F)"
                  value={searchQuery}
                  onChange={function (e) { setSearchQuery(e.target.value); }}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full h-8 pl-8 pr-8 text-xs border border-slate-200 bg-white outline-none focus:border-[#0000FF] focus:ring-2 focus:ring-[#0000FF]/10 font-medium placeholder:text-slate-400"
                  data-testid="file-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={function () { setSearchQuery(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    data-testid="file-search-clear"
                    aria-label="Clear search (Escape)"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {files.length > 1 && (
                <div className="flex gap-2 items-center">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger
                      className="h-7 rounded-none text-xs flex-1 border-slate-200"
                      data-testid="sort-select-trigger"
                    >
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="newest" className="text-xs" data-testid="sort-newest">Newest first</SelectItem>
                      <SelectItem value="oldest" className="text-xs" data-testid="sort-oldest">Oldest first</SelectItem>
                      <SelectItem value="name-asc" className="text-xs" data-testid="sort-name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc" className="text-xs" data-testid="sort-name-desc">Name Z-A</SelectItem>
                      <SelectItem value="size-desc" className="text-xs" data-testid="sort-size-desc">Largest first</SelectItem>
                      <SelectItem value="size-asc" className="text-xs" data-testid="sort-size-asc">Smallest first</SelectItem>
                      <SelectItem value="type" className="text-xs" data-testid="sort-type">By type</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="rounded-none text-xs h-7 px-2 uppercase tracking-wider font-semibold text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 flex-shrink-0"
                    onClick={function () { setShowClearDialog(true); }}
                    data-testid="clear-all-files-btn"
                  >
                    <Trash2 size={12} className="mr-1" />
                    Clear
                  </Button>
                </div>
              )}
              {files.length === 1 && (
                <Button
                  variant="outline"
                  className="w-full rounded-none text-xs h-7 uppercase tracking-wider font-semibold text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  onClick={function () { setShowClearDialog(true); }}
                  data-testid="clear-all-files-btn"
                >
                  <Trash2 size={12} className="mr-1.5" />
                  Clear All ({files.length})
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <FileList searchQuery={searchQuery} sortBy={sortBy} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmarks" className="flex-1 overflow-hidden mt-0 min-h-0">
            <ScrollArea className="h-full">
              <BookmarkList />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="paste" className="flex-1 flex flex-col overflow-hidden mt-0">
            <PasteEditor />
          </TabsContent>
        </Tabs>
      </div>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="rounded-none sm:rounded-none" data-testid="clear-all-dialog">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight">Clear all files?</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              This will permanently delete all {files.length} file{files.length !== 1 ? "s" : ""} and their bookmarks. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-none"
              onClick={function () { setShowClearDialog(false); }}
              data-testid="clear-all-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              className="rounded-none bg-[#FF3333] hover:bg-red-600 text-white"
              onClick={handleConfirmClear}
              data-testid="clear-all-confirm-btn"
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
