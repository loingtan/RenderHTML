import { useEffect } from "react";
import "@/App.css";
import { AppProvider, useApp } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Sidebar } from "@/components/Sidebar";
import { Renderer } from "@/components/Renderer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function AppContent() {
  const { fetchFiles, fetchBookmarks } = useApp();

  useEffect(() => {
    fetchFiles();
    fetchBookmarks();
  }, [fetchFiles, fetchBookmarks]);

  return (
    <div className="app-layout" data-testid="app-layout">
      <Sidebar />
      <Renderer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <AppProvider>
          <AppContent />
          <Toaster position="bottom-right" />
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
