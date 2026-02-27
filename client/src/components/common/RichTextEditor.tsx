import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered } from 'lucide-react';

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
                title="Strikethrough (Ctrl+Shift+S)"
            >
                <Strikethrough size={16} className="text-gray-700 dark:text-gray-300" />
            </button>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleBulletList().run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Bullet List"
            >
                <List size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={(e) => toggleCommand(() => editor.chain().focus().toggleOrderedList().run(), e)}
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                title="Numbered List"
            >
                <ListOrdered size={16} className="text-gray-700 dark:text-gray-300" />
            </button>
        </div>
    );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, readOnly = false }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
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
