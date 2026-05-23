import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dropzone } from "@/components/Dropzone";
import { FileList } from "@/components/FileList";
import { BookmarkList } from "@/components/BookmarkList";
import { PasteEditor } from "@/components/PasteEditor";
import { FileCode, Bookmark, ClipboardPaste } from "lucide-react";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState("files");

  return (
    <aside className="sidebar" data-testid="sidebar">
      <div className="sidebar-header">
        <FileCode size={20} strokeWidth={2.5} style={{ color: "#0000FF" }} />
        <h1>HTML Viewer</h1>
      </div>
      <div className="sidebar-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
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

          <TabsContent value="files" className="flex-1 flex flex-col overflow-hidden mt-0">
            <Dropzone />
            <ScrollArea className="flex-1">
              <FileList />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmarks" className="flex-1 overflow-hidden mt-0">
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
