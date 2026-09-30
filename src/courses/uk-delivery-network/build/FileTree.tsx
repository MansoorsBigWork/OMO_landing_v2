import { useCallback, useId, useRef, useState } from "react";
import { fileTree, type FileNode } from "./data";

/* The starter's file tree, generated from build.ts. Structure and the
   full keyboard grammar (roving tabindex, arrows, Home, End, typeahead)
   are ported from the 21st.dev Tree View starting point, rebuilt
   dependency free and restyled to the dark tokens. Every row shows its
   one-line description when hovered, focused or selected, and carries
   an EDIT or READ ONLY tag. */

interface Row {
  node: FileNode;
  id: string;
  level: number;
  parentId: string | null;
  branch: boolean;
  open: boolean;
  posinset: number;
  setsize: number;
}

function flatten(
  nodes: ReadonlyArray<FileNode>,
  open: ReadonlySet<string>,
  level = 1,
  parentId: string | null = null,
  out: Row[] = [],
): Row[] {
  nodes.forEach((node, i) => {
    const id = (parentId ? `${parentId}/` : "") + node.path;
    const branch = (node.children?.length ?? 0) > 0;
    const isOpen = branch && open.has(id);
    out.push({ node, id, level, parentId, branch, open: isOpen, posinset: i + 1, setsize: nodes.length });
    if (isOpen) flatten(node.children ?? [], open, level + 1, id, out);
  });
  return out;
}

export default function FileTree({ label, tags }: { label: string; tags: { edit: string; readonly: string } }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(fileTree.map((n) => n.path)));
  const [selected, setSelected] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLElement>());
  const hintId = useId();

  const rows = flatten(fileTree, open);
  const tabStop = focusId && rows.some((r) => r.id === focusId) ? focusId : rows[0]?.id;

  const focusRow = useCallback((id: string) => {
    setFocusId(id);
    refs.current.get(id)?.focus();
  }, []);

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onKey = (e: React.KeyboardEvent, row: Row) => {
    const at = rows.findIndex((r) => r.id === row.id);
    const go = (i: number) => rows[i] && focusRow(rows[i].id);
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); go(at + 1); return;
      case "ArrowUp": e.preventDefault(); go(at - 1); return;
      case "ArrowRight":
        e.preventDefault();
        if (row.branch && !row.open) toggle(row.id);
        else if (row.open) go(at + 1);
        return;
      case "ArrowLeft":
        e.preventDefault();
        if (row.open) toggle(row.id);
        else if (row.parentId) focusRow(row.parentId);
        return;
      case "Home": e.preventDefault(); go(0); return;
      case "End": e.preventDefault(); go(rows.length - 1); return;
      case "Enter":
      case " ":
        e.preventDefault();
        setSelected(row.id);
        if (row.branch) toggle(row.id);
        return;
      default:
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && e.key !== " ") {
      const letter = e.key.toLowerCase();
      for (let step = 1; step <= rows.length; step++) {
        const c = rows[(at + step) % rows.length];
        if (c.node.path.toLowerCase().startsWith(letter)) {
          e.preventDefault();
          focusRow(c.id);
          return;
        }
      }
    }
  };

  const renderNodes = (list: ReadonlyArray<FileNode>, level: number, parentId: string | null) =>
    list.map((node, i) => {
      const id = (parentId ? `${parentId}/` : "") + node.path;
      const row = rows.find((r) => r.id === id);
      if (!row) return null;
      const isSelected = selected === id;
      return (
        <li key={id} role="none">
          <div
            role="treeitem"
            ref={(el) => {
              if (el) refs.current.set(id, el);
              else refs.current.delete(id);
            }}
            aria-level={level}
            aria-posinset={i + 1}
            aria-setsize={list.length}
            aria-expanded={row.branch ? row.open : undefined}
            aria-selected={isSelected}
            aria-describedby={hintId}
            tabIndex={tabStop === id ? 0 : -1}
            className={`bp-tree-row${isSelected ? " is-selected" : ""}`}
            onFocus={() => setFocusId(id)}
            onKeyDown={(e) => onKey(e, row)}
            onClick={() => {
              setSelected(id);
              focusRow(id);
              if (row.branch) toggle(id);
            }}
          >
            <span className="bp-tree-caret" aria-hidden="true">
              {row.branch && (
                <svg viewBox="0 0 12 12" style={{ transform: row.open ? "rotate(90deg)" : undefined }}>
                  <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="bp-tree-name">{node.path}</span>
            {node.tag && (
              <span className={`bp-tag is-${node.tag}`}>{node.tag === "edit" ? tags.edit : tags.readonly}</span>
            )}
            <span className="bp-tree-desc">{node.description}</span>
          </div>
          {row.branch && row.open && (
            <ul role="group" className="bp-tree-group">
              {renderNodes(node.children ?? [], level + 1, id)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <div className="bp-tree">
      <ul role="tree" aria-label={label}>
        {renderNodes(fileTree, 1, null)}
      </ul>
      <span id={hintId} className="visually-hidden">
        Use the arrow keys to move. Right expands a folder, left collapses it or climbs to its parent. Home and End
        jump to the ends, and typing a letter jumps to the next name starting with it.
      </span>
    </div>
  );
}
