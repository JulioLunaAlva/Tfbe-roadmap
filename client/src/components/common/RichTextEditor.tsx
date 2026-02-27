import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import {
    Bold, Italic, Strikethrough, List, ListOrdered,
    Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
    Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify, Smile,
    Heading1, Heading2
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}

const MenuBar = ({ editor, readOnly }: { editor: any, readOnly: boolean }) => {
    if (!editor || readOnly) {
        return null;
    }

    const toggleCommand = (command: () => void, e: React.MouseEvent) => {
        e.preventDefault();
        command();
    };

    return (
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleBold().run(), e)}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Bold (Ctrl+B)"
            >
                <Bold size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleItalic().run(), e)}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Italic (Ctrl+I)"
            >
                <Italic size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleStrike().run(), e)}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Tachado"
            >
                <Strikethrough size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleSuperscript().run(), e)}
                disabled={!editor.can().chain().focus().toggleSuperscript().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('superscript') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Superíndice"
            >
                <SuperscriptIcon size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleSubscript().run(), e)}
                disabled={!editor.can().chain().focus().toggleSubscript().run()}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('subscript') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Subíndice"
            >
                <SubscriptIcon size={16} className="text-gray-700 dark:text-gray-300" />
            </button>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().setTextAlign('left').run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Alinear a la izquierda"
            >
                <AlignLeft size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().setTextAlign('center').run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Centrar"
            >
                <AlignCenter size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().setTextAlign('right').run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Alinear a la derecha"
            >
                <AlignRight size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().setTextAlign('justify').run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Justificar"
            >
                <AlignJustify size={16} className="text-gray-700 dark:text-gray-300" />
            </button>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleBulletList().run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Viñetas"
            >
                <List size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleOrderedList().run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Lista Numerada"
            >
                <ListOrdered size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleBlockquote().run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Cita"
            >
                <Quote size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Título 1"
            >
                <Heading1 size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Título 2"
            >
                <Heading2 size={16} className="text-gray-700 dark:text-gray-300" />
            </button>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().insertContent(' ⭐ ').run(), e)}
                className="flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                title="Insertar Estrella / Tip Emoji"
            >
                <Smile size={16} />
                <span className="text-xs font-medium whitespace-nowrap">+ Emojis Win + .</span>
            </button>
        </div>
    );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, readOnly = false }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Superscript,
            Subscript,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: value,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 min-h-[120px] bg-transparent text-sm text-gray-700 dark:text-gray-300',
            },
        },
    });

    // Handle external updates and placeholders manually
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            if (value === '' || !value) {
                editor.commands.clearContent();
            } else {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    // Cleanup memory
    React.useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy();
            }
        }
    }, [editor]);

    return (
        <div className={`flex flex-col h-full overflow-hidden ${readOnly ? '' : 'border-t border-gray-200 dark:border-gray-700'}`}>
            <MenuBar editor={editor} readOnly={readOnly} />
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${readOnly ? 'bg-transparent' : 'bg-white dark:bg-[#1E2630]'}`}>
                {/* Show placeholder if empty and editor is focused/unfocused - handling this simply via CSS or injected text is complex in Tiptap without Placeholder extension. For brevity, we wrap it manually if needed, but standard CSS works well for the 'is-empty' class injected by Tiptap if we added the extension. Since we didn't add the placeholder extension, we'll rely on a basic wrapper if no content exists and readOnly is true. */}
                {readOnly && (!value || value === '<p></p>') ? (
                    <div className="p-4 text-sm text-gray-400 dark:text-gray-600 italic">
                        {placeholder || 'Sin información disponible'}
                    </div>
                ) : (
                    <EditorContent editor={editor} className="h-full" />
                )}
            </div>
        </div>
    );
};
