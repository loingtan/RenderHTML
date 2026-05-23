import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export function PasteEditor() {
  const { pasteHtml, setActiveContent, setActiveFile, loading } = useApp();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleRender = () => {
    if (!code.trim()) return;
    // Render directly without saving
    setActiveFile({ id: "paste-preview", name: name || "Pasted HTML" });
    setActiveContent(code);
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
        className="w-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0000FF] focus:ring-2 focus:ring-[#0000FF]/10 font-medium"
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
