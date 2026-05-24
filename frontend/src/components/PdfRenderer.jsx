import { useMemo } from "react";

export function PdfRenderer({ content }) {
  var blobUrl = useMemo(function () {
    try {
      var binary = atob(content);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      var blob = new Blob([bytes], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    } catch (e) {
      return null;
    }
  }, [content]);

  if (!blobUrl) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm" data-testid="pdf-error">
        Failed to load PDF
      </div>
    );
  }

  return (
    <object
      data={blobUrl}
      type="application/pdf"
      className="w-full h-full"
      data-testid="pdf-viewer"
    >
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-slate-500 text-sm">PDF preview not supported in this browser.</p>
        <a
          href={blobUrl}
          download="document.pdf"
          className="text-[#0000FF] text-sm font-medium underline"
          data-testid="pdf-download-link"
        >
          Download PDF instead
        </a>
      </div>
    </object>
  );
}
