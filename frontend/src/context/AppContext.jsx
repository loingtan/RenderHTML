import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeContent, setActiveContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Tabs state: array of { id, name, file_type }
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // Derived: active file from tabs
  const activeFile = openTabs.find(function (t) { return t.id === activeTabId; }) || null;

  // File order for drag & drop (array of file IDs)
  const [fileOrder, setFileOrder] = useState([]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/files`);
      setFiles(res.data.files);
    } catch (e) {
      console.error("Failed to fetch files", e);
    }
  }, []);

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/bookmarks`);
      setBookmarks(res.data.bookmarks);
    } catch (e) {
      console.error("Failed to fetch bookmarks", e);
    }
  }, []);

  const uploadFiles = useCallback(async (fileList) => {
    setLoading(true);
    try {
      const formData = new FormData();
      const paths = [];
      for (const f of fileList) {
        formData.append("files", f);
        paths.push(f.webkitRelativePath || "");
      }
      formData.append("paths", JSON.stringify(paths));
      const res = await axios.post(`${API}/files/upload`, formData);
      toast.success(`${res.data.length} file(s) uploaded`);
      await fetchFiles();
      if (res.data.length > 0) {
        openFileInTab(res.data[0].id, res.data[0].name, res.data[0].file_type);
      }
    } catch (e) {
      toast.error("Upload failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  const pasteHtml = useCallback(async (name, content) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/files/paste`, { name, content });
      toast.success("HTML saved");
      await fetchFiles();
      openFileInTab(res.data.id, res.data.name, res.data.file_type || "html");
    } catch (e) {
      toast.error("Failed to save");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  // Tab management
  const openFileInTab = useCallback(async (fileId, fileName, fileType) => {
    // Check if tab already open
    setOpenTabs(function (prev) {
      var existing = prev.find(function (t) { return t.id === fileId; });
      if (existing) return prev;
      return prev.concat([{ id: fileId, name: fileName, file_type: fileType || "html" }]);
    });
    setActiveTabId(fileId);
    // Load content
    try {
      const res = await axios.get(`${API}/files/${fileId}/content`);
      setActiveContent(res.data.content);
      // Update tab name/type in case it changed
      setOpenTabs(function (prev) {
        return prev.map(function (t) {
          return t.id === fileId ? { ...t, name: res.data.name, file_type: res.data.file_type || t.file_type } : t;
        });
      });
    } catch (e) {
      toast.error("Failed to load file");
    }
  }, []);

  const switchTab = useCallback(async (tabId) => {
    setActiveTabId(tabId);
    try {
      const res = await axios.get(`${API}/files/${tabId}/content`);
      setActiveContent(res.data.content);
    } catch (e) {
      toast.error("Failed to load file");
    }
  }, []);

  const closeTab = useCallback(function (tabId) {
    setOpenTabs(function (prev) {
      var filtered = prev.filter(function (t) { return t.id !== tabId; });
      // If closing active tab, switch to neighbor
      if (tabId === activeTabId) {
        var idx = prev.findIndex(function (t) { return t.id === tabId; });
        var next = filtered[Math.min(idx, filtered.length - 1)];
        if (next) {
          setActiveTabId(next.id);
          axios.get(`${API}/files/${next.id}/content`).then(function (res) {
            setActiveContent(res.data.content);
          });
        } else {
          setActiveTabId(null);
          setActiveContent("");
        }
      }
      return filtered;
    });
  }, [activeTabId]);

  // Backward compat: loadFileContent opens in tab
  const loadFileContent = useCallback(async (fileId, fileName, fileType) => {
    openFileInTab(fileId, fileName, fileType);
  }, [openFileInTab]);

  const deleteFile = useCallback(async (fileId) => {
    try {
      await axios.delete(`${API}/files/${fileId}`);
      toast.success("File deleted");
      // Close tab if open
      closeTab(fileId);
      await fetchFiles();
      await fetchBookmarks();
    } catch (e) {
      toast.error("Delete failed");
    }
  }, [closeTab, fetchFiles, fetchBookmarks]);

  const addBookmark = useCallback(async (fileId, name) => {
    try {
      await axios.post(`${API}/bookmarks`, { file_id: fileId, name });
      toast.success("Bookmarked");
      await fetchBookmarks();
    } catch (e) {
      toast.error("Bookmark failed");
    }
  }, [fetchBookmarks]);

  const removeBookmark = useCallback(async (bookmarkId) => {
    try {
      await axios.delete(`${API}/bookmarks/${bookmarkId}`);
      toast.success("Bookmark removed");
      await fetchBookmarks();
    } catch (e) {
      toast.error("Remove failed");
    }
  }, [fetchBookmarks]);

  const clearAllFiles = useCallback(async () => {
    try {
      const res = await axios.delete(`${API}/files`);
      toast.success(`Cleared ${res.data.files_deleted} file(s)`);
      setOpenTabs([]);
      setActiveTabId(null);
      setActiveContent("");
      await fetchFiles();
      await fetchBookmarks();
    } catch (e) {
      toast.error("Clear failed");
    }
  }, [fetchFiles, fetchBookmarks]);

  const renameFile = useCallback(async (fileId, newName) => {
    try {
      await axios.patch(`${API}/files/${fileId}/rename`, { name: newName });
      toast.success("Renamed");
      // Update tab name
      setOpenTabs(function (prev) {
        return prev.map(function (t) { return t.id === fileId ? { ...t, name: newName } : t; });
      });
      await fetchFiles();
      await fetchBookmarks();
    } catch (e) {
      toast.error("Rename failed");
    }
  }, [fetchFiles, fetchBookmarks]);

  const exportBookmarks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/bookmarks/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bookmarks-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Bookmarks exported");
    } catch (e) {
      toast.error("Export failed");
    }
  }, []);

  const updateFileContent = useCallback(async (fileId, content) => {
    try {
      await axios.patch(`${API}/files/${fileId}/content`, { content });
      toast.success("Saved");
      setActiveContent(content);
      await fetchFiles();
    } catch (e) {
      toast.error("Save failed");
    }
  }, [fetchFiles]);

  const value = {
    files, bookmarks, activeFile, activeContent, loading,
    openTabs, activeTabId,
    fileOrder, setFileOrder,
    setActiveContent, setActiveFile: function () {}, // deprecated, use tabs
    fetchFiles, fetchBookmarks, uploadFiles, pasteHtml,
    loadFileContent, openFileInTab, switchTab, closeTab,
    deleteFile, addBookmark, removeBookmark, clearAllFiles,
    renameFile, exportBookmarks, updateFileContent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
