"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Image,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Type,
  Heading1,
  SeparatorHorizontal,
  MousePointerClick,
  ImageIcon,
  AlertCircle,
} from "lucide-react";

/* ─── constants ─── */

const CATEGORIES = [
  { value: "THANK_YOU", label: "Thank You" },
  { value: "WELCOME", label: "Welcome" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "EVENT", label: "Event" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "GENERAL", label: "General" },
  { value: "CUSTOM", label: "Custom" },
];

const VARIABLES = [
  { key: "contactFirstName", label: "First Name", sample: "Jane" },
  { key: "contactLastName", label: "Last Name", sample: "Smith" },
  { key: "contactEmail", label: "Email", sample: "jane@example.com" },
  { key: "donorName", label: "Donor Name", sample: "Jane Smith" },
  { key: "amount", label: "Amount", sample: "£50.00" },
  { key: "donationType", label: "Donation Type", sample: "One-off" },
  { key: "eventName", label: "Event Name", sample: "Annual Charity Gala" },
  { key: "eventDate", label: "Event Date", sample: "15-06-2026" },
  { key: "date", label: "Date", sample: "05-04-2026" },
  { key: "orgName", label: "Organisation", sample: "DeepCharity" },
];

const SAMPLE_DATA: Record<string, string> = {};
VARIABLES.forEach((v) => { SAMPLE_DATA[v.key] = v.sample; });

/* ─── block types ─── */

type Block =
  | { type: "text"; id: string; content: string }
  | { type: "heading"; id: string; content: string }
  | { type: "button"; id: string; label: string; url: string; colour: string }
  | { type: "divider"; id: string }
  | { type: "image"; id: string; src: string; alt: string }
  | { type: "callout"; id: string; content: string; bgColour: string };

let blockCounter = 0;
function newId() { return `b_${++blockCounter}_${Date.now()}`; }

/* ─── HTML → blocks parser (for existing templates) ─── */

function htmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return [{ type: "text", id: newId(), content: "" }];

  const blocks: Block[] = [];
  const div = document.createElement("div");
  div.innerHTML = html;

  function extractText(el: Element): string {
    // Convert <br> to newlines, <strong>/<b> to text, etc.
    let text = "";
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        text += node.textContent || "";
      } else if (node.nodeType === 1) {
        const tag = (node as Element).tagName.toLowerCase();
        if (tag === "br") {
          text += "\n";
        } else if (tag === "strong" || tag === "b") {
          text += `**${(node as Element).textContent || ""}**`;
        } else if (tag === "em" || tag === "i") {
          text += `_${(node as Element).textContent || ""}_`;
        } else if (tag === "a") {
          const href = (node as Element).getAttribute("href") || "";
          text += `[${(node as Element).textContent || ""}](${href})`;
        } else {
          text += extractText(node as Element);
        }
      }
    });
    return text;
  }

  // Walk top-level children
  div.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      const t = (node.textContent || "").trim();
      if (t) blocks.push({ type: "text", id: newId(), content: t });
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === "hr") {
      blocks.push({ type: "divider", id: newId() });
    } else if (tag === "h1" || tag === "h2" || tag === "h3") {
      blocks.push({ type: "heading", id: newId(), content: extractText(el) });
    } else if (tag === "img") {
      blocks.push({ type: "image", id: newId(), src: el.getAttribute("src") || "", alt: el.getAttribute("alt") || "" });
    } else if (tag === "div" || tag === "table") {
      // Check if it's a callout-style box (has background)
      const bg = (el as HTMLElement).style?.background || (el as HTMLElement).style?.backgroundColor || "";
      if (bg) {
        blocks.push({ type: "callout", id: newId(), content: extractText(el), bgColour: bg });
      } else {
        // Recurse into div content
        const innerText = extractText(el).trim();
        if (innerText) blocks.push({ type: "text", id: newId(), content: innerText });
      }
    } else if (tag === "ul" || tag === "ol") {
      const items: string[] = [];
      el.querySelectorAll("li").forEach((li) => {
        items.push(`• ${extractText(li).trim()}`);
      });
      if (items.length) blocks.push({ type: "text", id: newId(), content: items.join("\n") });
    } else {
      // p, span, etc.
      const text = extractText(el).trim();
      if (text) blocks.push({ type: "text", id: newId(), content: text });
    }
  });

  return blocks.length ? blocks : [{ type: "text", id: newId(), content: "" }];
}

/* ─── blocks → HTML generator ─── */

function blocksToHtml(blocks: Block[], logoUrl?: string): string {
  const parts: string[] = [];
  parts.push('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">');

  if (logoUrl) {
    parts.push(`<div style="text-align: center; padding: 20px 0 10px;"><img src="${logoUrl}" alt="Logo" style="max-height: 60px; object-fit: contain;" /></div>`);
  }

  for (const block of blocks) {
    switch (block.type) {
      case "text": {
        // Convert markdown-like to HTML
        const lines = block.content.split("\n");
        for (const line of lines) {
          let html = line
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/_(.+?)_/g, "<em>$1</em>")
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #4f46e5;">$1</a>');
          if (html.startsWith("• ")) {
            parts.push(`<li style="margin-bottom: 4px;">${html.slice(2)}</li>`);
          } else {
            parts.push(`<p style="margin: 0 0 12px; line-height: 1.6; color: #374151;">${html}</p>`);
          }
        }
        break;
      }
      case "heading":
        parts.push(`<h2 style="color: #111827; margin: 20px 0 8px; font-size: 20px;">${block.content}</h2>`);
        break;
      case "divider":
        parts.push('<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />');
        break;
      case "button":
        parts.push(`<div style="text-align: center; margin: 24px 0;"><a href="${block.url}" style="display: inline-block; padding: 12px 28px; background: ${block.colour}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${block.label}</a></div>`);
        break;
      case "image":
        parts.push(`<div style="text-align: center; margin: 16px 0;"><img src="${block.src}" alt="${block.alt}" style="max-width: 100%; border-radius: 8px;" /></div>`);
        break;
      case "callout":
        parts.push(`<div style="background: ${block.bgColour}; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0; color: #374151;">${block.content}</p></div>`);
        break;
    }
  }

  parts.push("</div>");
  return parts.join("\n");
}

/* ─── blocks → plain text ─── */

function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "text": return b.content.replace(/\*\*(.+?)\*\*/g, "$1").replace(/_(.+?)_/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");
        case "heading": return b.content.toUpperCase();
        case "divider": return "---";
        case "button": return `${b.label}: ${b.url}`;
        case "image": return `[Image: ${b.alt}]`;
        case "callout": return b.content;
        default: return "";
      }
    })
    .join("\n\n");
}

/* ─── replace vars with samples for preview ─── */

function replaceVars(text: string): string {
  let result = text;
  for (const [key, val] of Object.entries(SAMPLE_DATA)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }
  return result;
}

/* ─── main component ─── */

interface TemplateEditorProps {
  mode: "create" | "edit";
  templateId?: string;
  initial?: {
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    logoUrl: string;
    category: string;
    isActive: boolean;
  };
}

export default function TemplateEditor({ mode, templateId, initial }: TemplateEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initial?.name || "");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl || "");
  const [category, setCategory] = useState(initial?.category || "CUSTOM");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  // Lazy-init blocks from existing HTML
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (initial?.bodyHtml && typeof window !== "undefined") {
      return htmlToBlocks(initial.bodyHtml);
    }
    return [{ type: "text", id: newId(), content: "" }];
  });

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  /* ── block operations ── */

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } as Block : b)));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length ? next : [{ type: "text" as const, id: newId(), content: "" }];
    });
  }, []);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }, []);

  const addBlock = useCallback((type: Block["type"], afterId?: string) => {
    let newBlock: Block;
    switch (type) {
      case "text": newBlock = { type: "text", id: newId(), content: "" }; break;
      case "heading": newBlock = { type: "heading", id: newId(), content: "" }; break;
      case "divider": newBlock = { type: "divider", id: newId() }; break;
      case "button": newBlock = { type: "button", id: newId(), label: "Click here", url: "https://", colour: "#4f46e5" }; break;
      case "image": newBlock = { type: "image", id: newId(), src: "", alt: "" }; break;
      case "callout": newBlock = { type: "callout", id: newId(), content: "", bgColour: "#f0fdf4" }; break;
      default: return;
    }
    setBlocks((prev) => {
      if (afterId) {
        const idx = prev.findIndex((b) => b.id === afterId);
        const copy = [...prev];
        copy.splice(idx + 1, 0, newBlock);
        return copy;
      }
      return [...prev, newBlock];
    });
    setActiveBlockId(newBlock.id);
  }, []);

  /* ── insert variable at cursor in active textarea ── */

  const insertVariable = useCallback((varKey: string) => {
    const tag = `{{${varKey}}}`;
    if (activeBlockId && textareaRefs.current[activeBlockId]) {
      const ta = textareaRefs.current[activeBlockId]!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const currentValue = ta.value;
      const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end);
      updateBlock(activeBlockId, { content: newValue });
      // Restore cursor
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }
  }, [activeBlockId, updateBlock]);

  /* ── save ── */

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const bodyHtml = blocksToHtml(blocks, logoUrl);
      const bodyText = blocksToPlainText(blocks);
      const payload = {
        name, subject, bodyHtml, bodyText, logoUrl, category, isActive,
        variables: VARIABLES.map((v) => `{{${v.key}}}`),
      };

      const url = mode === "edit" ? `/api/email-templates/${templateId}` : "/api/email-templates";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/settings/email-templates");
      router.refresh();
    } catch {
      alert("Error saving template");
    } finally {
      setLoading(false);
    }
  };

  /* ── preview HTML ── */
  const previewHtml = replaceVars(blocksToHtml(blocks, logoUrl));

  /* ── render ── */

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/email-templates" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "edit" ? "Edit Template" : "Create Email Template"}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={loading || !name || !subject} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Template"}
        </Button>
      </div>

      {/* Settings row */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Template Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Donation Thank You" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject Line</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Thank you, {{contactFirstName}}!" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORIES} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <Image className="h-3 w-3" /> Logo URL
              </label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
            <label htmlFor="isActive" className="text-sm text-gray-600">Active</label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Block editor */}
        <div className="lg:col-span-3 space-y-3">
          {/* Variable pills */}
          <Card>
            <CardContent className="py-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Click a variable to insert it at your cursor position:</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                    title={`Insert {{${v.key}}} — e.g. "${v.sample}"`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blocks */}
          <div className="space-y-2">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                className={`group relative border rounded-lg bg-white transition-all ${activeBlockId === block.id ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => setActiveBlockId(block.id)}
              >
                {/* Block toolbar */}
                <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                  <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex-1">
                    {block.type === "text" ? "Text" : block.type === "heading" ? "Heading" : block.type === "button" ? "Button" : block.type === "divider" ? "Divider" : block.type === "image" ? "Image" : "Callout"}
                  </span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} className="p-0.5 text-gray-400 hover:text-gray-600" disabled={idx === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} className="p-0.5 text-gray-400 hover:text-gray-600" disabled={idx === blocks.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-0.5 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Block content */}
                <div className="p-3">
                  {block.type === "text" && (
                    <textarea
                      ref={(el) => { textareaRefs.current[block.id] = el; }}
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      onFocus={() => setActiveBlockId(block.id)}
                      placeholder="Type your text here... Use **bold** and _italic_ formatting. Click a variable above to insert it."
                      className="w-full resize-none border-0 focus:outline-none focus:ring-0 text-sm text-gray-800 leading-relaxed min-h-[60px] placeholder:text-gray-300"
                      rows={Math.max(2, block.content.split("\n").length)}
                    />
                  )}

                  {block.type === "heading" && (
                    <input
                      ref={(el) => { textareaRefs.current[block.id] = el as unknown as HTMLTextAreaElement; }}
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      onFocus={() => setActiveBlockId(block.id)}
                      placeholder="Heading text..."
                      className="w-full border-0 focus:outline-none focus:ring-0 text-lg font-bold text-gray-900 placeholder:text-gray-300"
                    />
                  )}

                  {block.type === "divider" && (
                    <hr className="border-gray-200" />
                  )}

                  {block.type === "button" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Input value={block.label} onChange={(e) => updateBlock(block.id, { label: e.target.value })} placeholder="Button text" />
                        <Input value={block.url} onChange={(e) => updateBlock(block.id, { url: e.target.value })} placeholder="https://..." />
                        <div className="flex items-center gap-2">
                          <input type="color" value={block.colour} onChange={(e) => updateBlock(block.id, { colour: e.target.value })} className="h-9 w-10 rounded border border-gray-200 cursor-pointer" />
                          <div className="flex-1 text-center">
                            <span style={{ background: block.colour }} className="inline-block px-4 py-1.5 rounded text-white text-xs font-semibold">{block.label || "Button"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === "image" && (
                    <div className="space-y-2">
                      <Input value={block.src} onChange={(e) => updateBlock(block.id, { src: e.target.value })} placeholder="Image URL (https://...)" />
                      <Input value={block.alt} onChange={(e) => updateBlock(block.id, { alt: e.target.value })} placeholder="Alt text (description)" />
                      {block.src && <img src={block.src} alt={block.alt} className="max-h-32 rounded border object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                  )}

                  {block.type === "callout" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input type="color" value={block.bgColour} onChange={(e) => updateBlock(block.id, { bgColour: e.target.value })} className="h-7 w-8 rounded border border-gray-200 cursor-pointer" />
                        <span className="text-xs text-gray-400">Background colour</span>
                      </div>
                      <textarea
                        ref={(el) => { textareaRefs.current[block.id] = el; }}
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        onFocus={() => setActiveBlockId(block.id)}
                        placeholder="Callout message..."
                        className="w-full resize-none border-0 focus:outline-none focus:ring-0 text-sm text-gray-800 leading-relaxed min-h-[40px] placeholder:text-gray-300"
                        rows={2}
                        style={{ background: block.bgColour + "33" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add block toolbar */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-400 font-medium">Add:</span>
            {([
              { type: "text" as const, icon: Type, label: "Text" },
              { type: "heading" as const, icon: Heading1, label: "Heading" },
              { type: "divider" as const, icon: SeparatorHorizontal, label: "Divider" },
              { type: "button" as const, icon: MousePointerClick, label: "Button" },
              { type: "image" as const, icon: ImageIcon, label: "Image" },
              { type: "callout" as const, icon: AlertCircle, label: "Callout" },
            ]).map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addBlock(item.type)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-medium">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  {/* Subject bar */}
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Subject</p>
                    <p className="text-xs font-semibold text-gray-900 mt-0.5">{replaceVars(subject) || "No subject"}</p>
                  </div>
                  {/* Email body */}
                  <div
                    className="p-4 text-xs leading-relaxed [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1 [&_p]:mb-2 [&_hr]:my-3 [&_a]:text-indigo-600 [&_a]:underline [&_img]:max-w-full [&_img]:rounded [&_li]:ml-4 [&_li]:list-disc"
                    dangerouslySetInnerHTML={{ __html: replaceVars(blocksToHtml(blocks, logoUrl)) || '<p style="color: #9ca3af; font-style: italic;">Start adding content blocks...</p>' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
