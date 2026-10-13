'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function RichTextEditor({ 
  value, 
  onChange,
  placeholder = "Outline the investment terms, structure, and expected yield..."
}: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm focus:outline-none min-h-[150px] p-3 text-zinc-100 placeholder:text-zinc-600',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-zinc-800 bg-zinc-900 rounded-sm overflow-hidden focus-within:border-zinc-500 transition-colors">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 p-2 bg-zinc-950/50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-zinc-800 transition-colors ${editor.isActive('bold') ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-zinc-800 transition-colors ${editor.isActive('italic') ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}
        >
          Italic
        </button>
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-xs rounded hover:bg-zinc-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-xs rounded hover:bg-zinc-800 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}
        >
          H3
        </button>
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-zinc-800 transition-colors ${editor.isActive('bulletList') ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-zinc-800 transition-colors ${editor.isActive('orderedList') ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}
        >
          Numbered List
        </button>
      </div>
      <EditorContent editor={editor} className="bg-zinc-900" />
    </div>
  );
}
