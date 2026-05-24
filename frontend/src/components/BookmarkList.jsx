import { useApp } from "@/context/AppContext";
import { Bookmark, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function BookmarkList() {
  const { bookmarks, loadFileContent, removeBookmark, exportBookmarks } = useApp();

  if (bookmarks.length === 0) {
    return (
      <div className="no-items-message" data-testid="no-bookmarks-message">
        No bookmarks yet. Open a file and click the bookmark icon to save it.
      </div>
    );
  }

  return (
    <div data-testid="bookmark-list">
      <div className="px-3 py-2">
        <Button
          variant="outline"
          className="w-full rounded-none text-xs h-7 uppercase tracking-wider font-semibold"
          onClick={exportBookmarks}
          data-testid="export-bookmarks-btn"
        >
          <Download size={12} className="mr-1.5" />
          Export Bookmarks ({bookmarks.length})
        </Button>
      </div>
      {bookmarks.map((bm) => (
        <div
          key={bm.id}
          className="bookmark-item"
          onClick={() => loadFileContent(bm.file_id, bm.name)}
          data-testid={`bookmark-item-${bm.id}`}
        >
          <Bookmark size={16} className="text-[#0000FF] flex-shrink-0" />
          <div className="file-item-info">
            <div className="file-item-name">{bm.name}</div>
            {bm.note && <div className="bookmark-note">{bm.note}</div>}
          </div>
          <div className="file-item-actions" style={{ opacity: 1 }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-none text-slate-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmark(bm.id);
                  }}
                  data-testid={`remove-bookmark-${bm.id}`}
                  aria-label="Remove bookmark"
                >
                  <Trash2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove bookmark</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
