import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [activeContent, setActiveContent] = useState("");
  const [loading, setLoading] = useState(false);

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
      // Auto-select first uploaded file
      if (res.data.length > 0) {
        loadFileContent(res.data[0].id, res.data[0].name);
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
      loadFileContent(res.data.id, res.data.name);
    } catch (e) {
      toast.error("Failed to save");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  const loadFileContent = useCallback(async (fileId, fileName) => {
    try {
      const res = await axios.get(`${API}/files/${fileId}/content`);
      setActiveFile({ id: fileId, name: fileName || res.data.name });
      setActiveContent(res.data.content);
    } catch (e) {
      toast.error("Failed to load file");
      console.error(e);
    }
  }, []);

  const deleteFile = useCallback(async (fileId) => {
    try {
      await axios.delete(`${API}/files/${fileId}`);
      toast.success("File deleted");
      if (activeFile?.id === fileId) {
        setActiveFile(null);
        setActiveContent("");
      }
      await fetchFiles();
      await fetchBookmarks();
    } catch (e) {
      toast.error("Delete failed");
    }
  }, [activeFile, fetchFiles, fetchBookmarks]);

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
      setActiveFile(null);
      setActiveContent("");
      await fetchFiles();
      await fetchBookmarks();
    } catch (e) {
      toast.error("Clear failed");
    }
  }, [fetchFiles, fetchBookmarks]);

  const value = {
    files,
    bookmarks,
    activeFile,
    activeContent,
    loading,
    setActiveContent,
    setActiveFile,
    fetchFiles,
    fetchBookmarks,
    uploadFiles,
    pasteHtml,
    loadFileContent,
    deleteFile,
    addBookmark,
    removeBookmark,
    clearAllFiles,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
