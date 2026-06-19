import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export function PasteEditor() {
  const { pasteHtml, openFileInTab, setActiveContent, loading } = useApp();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleRender = () => {
    if (!code.trim()) return;
    // Open as a temporary preview tab
    var previewTab = { id: "paste-preview", name: name || "Pasted HTML", file_type: "html" };
    openFileInTab("paste-preview", previewTab.name, "html");
    // Override content directly since paste-preview isn't in DB
    setTimeout(function () { setActiveContent(code); }, 100);
  };

  const handleSaveAndRender = async () => {
    if (!code.trim()) return;
    await pasteHtml(name || "Pasted HTML", code);
  };

  return (
    <div className="paste-area" data-testid="paste-editor">
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-[#0000FF] focus:ring-2 focus:ring-[#0000FF]/10 font-medium dark:text-slate-200"
        data-testid="paste-name-input"
      />
      <textarea
        placeholder="Paste your HTML code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
        data-testid="paste-textarea"
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-none text-xs h-8 uppercase tracking-wider font-semibold"
          onClick={handleRender}
          disabled={!code.trim()}
          data-testid="render-paste-btn"
        >
          <Play size={14} className="mr-1" />
          Preview
        </Button>
        <Button
          className="flex-1 rounded-none text-xs h-8 uppercase tracking-wider font-semibold bg-[#0000FF] hover:bg-[#0000CC] text-white"
          onClick={handleSaveAndRender}
          disabled={!code.trim() || loading}
          data-testid="save-paste-btn"
        >
          Save & Render
        </Button>
      </div>
    </div>
  );
}
