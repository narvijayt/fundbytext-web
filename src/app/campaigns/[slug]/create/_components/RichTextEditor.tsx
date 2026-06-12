"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type Props = {
    value: string;           // HTML string
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
};

function ToolbarButton({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className={`p-1.5 sm:p-2 rounded sm:rounded-md transition-colors ${
                active
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
        >
            {children}
        </button>
    );
}

export default function RichTextEditor({ value, onChange, placeholder, className }: Props) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                blockquote: false,
                code: false,
                codeBlock: false,
                horizontalRule: false,
            }),
        ],
        content: value || "",
        editorProps: {
            attributes: {
                class: "min-h-[140px] sm:min-h-[180px] lg:min-h-[220px] px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-base text-gray-800 focus:outline-none",
            },
        },
        onUpdate({ editor }) {
            const html = editor.isEmpty ? "" : editor.getHTML();
            onChange(html);
        },
    });

    // Sync external value changes (e.g. on campaign load)
    useEffect(() => {
        if (!editor) return;
        const current = editor.isEmpty ? "" : editor.getHTML();
        if (current !== value) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    if (!editor) return null;

    return (
        <div className={`border-2 border-gray-300 rounded-xl sm:rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 ${className ?? ""}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 sm:gap-1 px-2 py-1.5 sm:px-3 sm:py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
                {/* Bold */}
                <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                    </svg>
                </ToolbarButton>

                {/* Italic */}
                <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
                    </svg>
                </ToolbarButton>

                {/* Strike */}
                <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 5.5 8 7C8 9 10 9.5 12 10" strokeLinecap="round" />
                        <path d="M8 18C8 18 9.5 20 12 20C14.5 20 16 18.5 16 17C16 15 14 14.5 12 14" strokeLinecap="round" />
                    </svg>
                </ToolbarButton>

                <div className="w-px h-5 sm:h-6 bg-gray-200 mx-1 sm:mx-1.5" />

                {/* Bullet list */}
                <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
                        <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                </ToolbarButton>

                {/* Ordered list */}
                <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
                        <path d="M4 6h1M4 10h1M3 8h2" strokeLinecap="round" />
                        <path d="M3 14h2v1H3v1h2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 20h2M5 20v-2l-2 1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </ToolbarButton>

                <div className="w-px h-5 sm:h-6 bg-gray-200 mx-1 sm:mx-1.5" />

                {/* Heading 2 */}
                <ToolbarButton title="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <span className="text-xs sm:text-sm font-bold leading-none">H2</span>
                </ToolbarButton>

                {/* Heading 3 */}
                <ToolbarButton title="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    <span className="text-xs sm:text-sm font-bold leading-none">H3</span>
                </ToolbarButton>

                <div className="w-px h-5 sm:h-6 bg-gray-200 mx-1 sm:mx-1.5" />

                {/* Undo */}
                <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a6 6 0 0 1 0 12H9M3 10l4-4M3 10l4 4" />
                    </svg>
                </ToolbarButton>

                {/* Redo */}
                <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a6 6 0 0 0 0 12h4M21 10l-4-4M21 10l-4 4" />
                    </svg>
                </ToolbarButton>
            </div>

            {/* Editor area */}
            <div className="relative">
                {editor.isEmpty && placeholder && (
                    <p className="absolute top-3 left-4 sm:top-4 sm:left-5 text-sm sm:text-base text-gray-400 pointer-events-none select-none">
                        {placeholder}
                    </p>
                )}
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
