import { useApp } from "@/context/AppContext";
import { X, FileCode, FileText, FileType } from "lucide-react";

function TabIcon({ fileType }) {
  if (fileType === "markdown") return <FileType size={12} className="text-[#0000FF] dark:text-blue-400" />;
  if (fileType === "pdf") return <FileText size={12} className="text-red-500" />;
  return <FileCode size={12} />;
}

export function TabBar() {
  var app = useApp();
  var openTabs = app.openTabs;
  var activeTabId = app.activeTabId;
  var switchTab = app.switchTab;
  var closeTab = app.closeTab;

  if (openTabs.length === 0) return null;

  return (
    <div className="tab-bar" data-testid="tab-bar">
      {openTabs.map(function (tab) {
        var isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={"tab-item" + (isActive ? " tab-active" : "")}
            onClick={function () { switchTab(tab.id); }}
            data-testid={"tab-" + tab.id}
          >
            <TabIcon fileType={tab.file_type} />
            <span className="tab-name">{tab.name}</span>
            <button
              className="tab-close"
              onClick={function (e) { e.stopPropagation(); closeTab(tab.id); }}
              data-testid={"tab-close-" + tab.id}
              aria-label="Close tab"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
