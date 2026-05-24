import { useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

function MermaidBlock({ code }) {
  var ref = useRef(null);

  useEffect(function () {
    if (!ref.current || !code) return;
    var id = "mermaid-" + Math.random().toString(36).slice(2, 9);
    mermaid.render(id, code).then(function (result) {
      if (ref.current) ref.current.innerHTML = result.svg;
    }).catch(function () {
      if (ref.current) ref.current.innerHTML = '<pre class="text-red-500 text-xs">Mermaid render error</pre>';
    });
  }, [code]);

  return <div ref={ref} className="my-4 flex justify-center" data-testid="mermaid-diagram" />;
}

function CodeBlock({ node, className, children, ...props }) {
  var match = (className || "").match(/language-(\w+)/);
  var lang = match ? match[1] : "";

  if (lang === "mermaid") {
    return <MermaidBlock code={String(children).trim()} />;
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export function MarkdownViewer({ content }) {
  return (
    <div className="markdown-body p-6 md:p-10 max-w-4xl mx-auto" data-testid="markdown-viewer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{ code: CodeBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function MarkdownEditor({ content, onSave }) {
  var ref = useRef(null);
  var previewRef = useRef(null);

  var handleSave = useCallback(function () {
    if (ref.current) {
      onSave(ref.current.value);
    }
  }, [onSave]);

  var handleKeyDown = useCallback(function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  return (
    <div className="flex flex-col md:flex-row h-full" data-testid="markdown-editor">
      <div className="flex-1 flex flex-col border-r border-slate-200 min-h-0">
        <div className="h-8 px-3 flex items-center border-b border-slate-200 bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Editor</span>
          <span className="ml-auto text-[10px] text-slate-400">Ctrl+S to save</span>
        </div>
        <textarea
          ref={ref}
          defaultValue={content}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none p-4 font-mono text-sm leading-relaxed bg-white text-slate-800 outline-none"
          spellCheck={false}
          data-testid="markdown-editor-textarea"
        />
      </div>
      <div className="flex-1 flex flex-col overflow-auto min-h-0">
        <div className="h-8 px-3 flex items-center border-b border-slate-200 bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preview</span>
        </div>
        <div ref={previewRef} className="flex-1 overflow-auto bg-white">
          <MarkdownViewer content={content} />
        </div>
      </div>
    </div>
  );
}
