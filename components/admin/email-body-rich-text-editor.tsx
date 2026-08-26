"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImageBase from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Link2Off,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { adminUploadEmailMarketingImageAction } from "@/lib/actions/admin-email-marketing";
import { plainTextToEditorHtml } from "@/lib/admin/email-marketing-body-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ImageAlign = "left" | "center" | "right";

const IMAGE_ALIGN_STYLE: Record<ImageAlign, string> = {
  left: "display:block;margin-left:0;margin-right:auto;",
  center: "display:block;margin-left:auto;margin-right:auto;",
  right: "display:block;margin-left:auto;margin-right:0;",
};

const IMAGE_WIDTH_PRESETS = [
  { label: "S", px: 140 },
  { label: "M", px: 280 },
  { label: "L", px: 420 },
  { label: "Full", px: 560 },
] as const;

/** Adds a resizable width and left/center/right alignment on top of the base Image node. */
const RichImage = TiptapImageBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("width");
          return raw ? Number.parseInt(raw, 10) || null : null;
        },
        renderHTML: (attrs: { width?: number | null }) =>
          attrs.width ? { width: String(attrs.width) } : {},
      },
      align: {
        default: "left",
        parseHTML: (element: HTMLElement) => {
          const style = element.getAttribute("style") || "";
          if (/margin-left:\s*auto/.test(style) && /margin-right:\s*auto/.test(style)) {
            return "center";
          }
          if (/margin-left:\s*auto/.test(style)) return "right";
          return "left";
        },
        renderHTML: (attrs: { align?: ImageAlign }) => ({
          style: IMAGE_ALIGN_STYLE[attrs.align ?? "left"],
        }),
      },
    };
  },
});

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
        active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border" aria-hidden />;
}

export function EmailBodyRichTextEditor({
  name = "bodyText",
  id = "bodyText",
  defaultValue = "",
  onChange,
}: {
  name?: string;
  id?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
}) {
  const initialHtml = useRef(plainTextToEditorHtml(defaultValue)).current;
  const [html, setHtml] = useState(initialHtml);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [, setSelectionTick] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      RichImage.configure({ inline: false }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        id,
        class:
          "min-h-40 px-3 py-2.5 text-sm leading-relaxed focus:outline-none " +
          "[&_p]:mb-3 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:underline " +
          "[&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_li]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 " +
          "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground " +
          "[&_img]:max-w-full [&_img]:rounded-md [&_img]:my-2",
      },
    },
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      setHtml(next);
      onChangeRef.current?.(next);
    },
    onSelectionUpdate: () => {
      // Force a re-render so image-selection-dependent toolbar controls stay in sync.
      setSelectionTick((n) => n + 1);
    },
  });

  useEffect(() => {
    onChangeRef.current?.(initialHtml);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openLinkPanel() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
    const previous = (editor.getAttributes("link").href as string | undefined) ?? "";
    setLinkValue(previous);
    setLinkPanelOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const url = linkValue.trim();
    const range = savedSelectionRef.current;
    const chain = editor.chain().focus();
    if (range) chain.setTextSelection(range);
    if (!url) {
      chain.extendMarkRange("link").unsetLink().run();
    } else {
      chain.extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkPanelOpen(false);
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkPanelOpen(false);
  }

  async function handleImageFile(file: File | null) {
    if (!file || !editor) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await adminUploadEmailMarketingImageAction(form);
      if (result.ok) {
        editor.chain().focus().setImage({ src: result.url, alt: "" }).run();
      } else {
        setUploadError(result.error);
      }
    } catch {
      setUploadError("Could not upload that image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const imageSelected = editor?.isActive("image") ?? false;
  const imageAttrs = imageSelected ? editor!.getAttributes("image") : null;

  return (
    <div className="rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/70 p-1">
        <ToolbarButton
          label="Paragraph"
          active={editor?.isActive("paragraph")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor?.isActive("heading", { level: 2 })}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor?.isActive("heading", { level: 3 })}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Bold"
          active={editor?.isActive("bold")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor?.isActive("italic")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor?.isActive("underline")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Align left"
          active={editor?.isActive({ textAlign: "left" })}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={editor?.isActive({ textAlign: "center" })}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={editor?.isActive({ textAlign: "right" })}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Bullet list"
          active={editor?.isActive("bulletList")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor?.isActive("orderedList")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Add link"
          active={editor?.isActive("link") || linkPanelOpen}
          disabled={!editor}
          onClick={() => (linkPanelOpen ? setLinkPanelOpen(false) : openLinkPanel())}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        {editor?.isActive("link") ? (
          <ToolbarButton label="Remove link" onClick={removeLink}>
            <Link2Off className="h-3.5 w-3.5" />
          </ToolbarButton>
        ) : null}
        <ToolbarButton
          label="Insert image"
          disabled={!editor || uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
        </ToolbarButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleImageFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {uploadError ? (
        <p className="border-b border-border/70 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          {uploadError}
        </p>
      ) : null}
      {linkPanelOpen ? (
        <div className="flex items-center gap-1.5 border-b border-border/70 bg-muted/30 p-1.5">
          <Input
            autoFocus
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setLinkPanelOpen(false);
              }
            }}
            placeholder="https://example.com"
            className="h-7 flex-1 text-xs"
          />
          <Button type="button" size="sm" className="h-7" onClick={applyLink}>
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={() => setLinkPanelOpen(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}
      {imageSelected ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 bg-muted/30 p-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">Image size</span>
          {IMAGE_WIDTH_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                editor?.chain().focus().updateAttributes("image", { width: preset.px }).run()
              }
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                imageAttrs?.width === preset.px
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:bg-muted",
              )}
            >
              {preset.label}
            </button>
          ))}
          <Divider />
          <ToolbarButton
            label="Align image left"
            active={imageAttrs?.align === "left"}
            onClick={() => editor?.chain().focus().updateAttributes("image", { align: "left" }).run()}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Center image"
            active={imageAttrs?.align === "center"}
            onClick={() =>
              editor?.chain().focus().updateAttributes("image", { align: "center" }).run()
            }
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Align image right"
            active={imageAttrs?.align === "right"}
            onClick={() =>
              editor?.chain().focus().updateAttributes("image", { align: "right" }).run()
            }
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
