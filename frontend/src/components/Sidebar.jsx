import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dropzone } from "@/components/Dropzone";
import { FileList } from "@/components/FileList";
import { BookmarkList } from "@/components/BookmarkList";
import { PasteEditor } from "@/components/PasteEditor";
import { FileCode, Bookmark, ClipboardPaste, Search, X } from "lucide-react";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState("files");
  const [searchQuery, setSearchQuery] = useState("");

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
            <div className="px-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={function (e) { setSearchQuery(e.target.value); }}
                  className="w-full h-8 pl-8 pr-8 text-xs border border-slate-200 bg-white outline-none focus:border-[#0000FF] focus:ring-2 focus:ring-[#0000FF]/10 font-medium placeholder:text-slate-400"
                  data-testid="file-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={function () { setSearchQuery(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    data-testid="file-search-clear"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <FileList searchQuery={searchQuery} />
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
    </aside>
  );
}
