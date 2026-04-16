// RichTextEditor.jsx


import {Bold, Italic, List, ListOrdered, Redo2, Underline, Undo2} from 'lucide-react'
import {useEffect, useState} from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import UnderlineExtension from '@tiptap/extension-underline'
import {EditorContent, useEditor} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'


const editorStyles = `
    .ProseMirror {
        outline : none;
    }

    .ProseMirror ul {
        list-style-type : disc;
        padding-left : 1.5rem;
        margin : 0.5rem 0;
    }

    .ProseMirror ul ul {
        list-style-type : circle;
        padding-left : 1.5rem;
        margin : 0.15rem 0;
    }

    .ProseMirror ul ul ul {
        list-style-type : square;
        padding-left : 1.5rem;
    }
    
    // Ordered lists
    .ProseMirror ol {
        list-style-type : decimal;
        padding-left : 1.5rem;
        margin : 0.5rem 0;
    }

    .ProseMirror ol ol {
        list-style-type : lower-alpha;
        padding-left : 1.5rem;
        margin : 0.15rem 0;
    }

    .ProseMirror ol ol ol {
        list-style-type : lower-roman;
        padding-left : 1.5rem;
    }

    // Shared list item
    .ProseMirror li {
        margin : 0.2rem 0;
        padding-left : 0.25rem;
        color : #d4d4d8;
    }

    // Marker colour
    .ProseMirror ul li:marker,
    .ProseMirror ol li:marker {
        color : #ec4899;
    }

    // Paragraph spacing
    .ProseMirror p {
        margin : 0.4rem 0;
        line-height : 1.65;
        color : #d4d4d8;
    }

    .ProseMirror li p {
        margin : 0;
        line-height : 1.65;
    }

    // Bold
    .ProseMirror strong {
        color : #f4f4f5;
    }

    // Placeholder
    .ProseMirror.is-editor-empty:first-child::before {
        content : attr(data-placeholder);
        color : #52525b;
        font-style : italic;
        float : left;
        pointer-events : none;
        height : 0;   
    }

    // Text selection
    .ProseMirror ::selection {
        background : rgba(236, 72, 153, 0.28);
        color : #fce7f3;
    }
`

const Divider = () => (
    <div className = "h-5 w-px bg-zinc-700/60 mx-1 shrink-0 self-center" />
)

const ToolbarBtn = ({icon : Icon, title, action, isActive, disabled}) => (
    <button
        type = 'button'
        onClick = {action}
        onMouseDown = {(e) => e.preventDefault()}
        disabled = {disabled}
        title = {title}
        className = {`
            p-2.5 rounded-md transition-all duration-150 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed
            ${isActive
                ? "bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/40"
                : "text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-100"
            }
        `}
    >
        <Icon
            size = {18}
            strokeWidth = {2.2}
        />
    </button>
)

const MenuBar = ({editor}) => {
    if (!editor) return null

    const buttons = [
        {
            icon : Bold,
            title : 'Bold',
            action : () => editor.chain().focus().toggleBold().run(),
            isActive : editor.isActive('bold'),
            disabled : false
        },
        {
            icon : Italic,
            title : 'Italic',
            action : () => editor.chain().focus().toggleItalic().run(),
            isActive : editor.isActive('italic'),
            disabled : false
        },
        {
            icon : Underline,
            title : 'Underline',
            action : () => editor.chain().focus().toggleUnderline().run(),
            isActive : editor.isActive('underline'),
            disabled : false
        },
        {type : 'divider'},
        {
            icon : List,
            title : "Bullet List",
            action : () => editor.chain().focus().toggleBulletList().run(),
            isActive : editor.isActive('bulletList'),
            disabled : false
        },
        {
            icon : ListOrdered,
            title : "Ordered List",
            action : () => editor.chain().focus().toggleOrderedList().run(),
            isActive : editor.isActive('orderedList'),
            disabled : false
        },
        {type : 'divider'},
        {
            icon : Undo2,
            title : 'Undo',
            action : () => editor.chain().focus().undo().run(),
            isActive : false,
            disabled : !editor.can().chain().focus().undo().run()
        },
        {
            icon : Redo2,
            title : 'Redo',
            action : () => editor.chain().focus().redo().run(),
            isActive : false,
            disabled : !editor.can().chain().focus().redo().run()
        }
    ]

    return (

        <div className = "flex items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-x-auto no-scrollbar touch-pan-x">
            {buttons.map((btn, index) =>
                btn.type === 'divider'
                    ? <Divider key = {index} />
                    : <ToolbarBtn
                        key = {btn.title}
                        {...btn}
                    />
            )}
        </div>

    )
}


export default function RichTextEditor({value, onChange}) {

    const [, setTick] = useState(0)

    const editor = useEditor({
        extensions : [
            StarterKit,
            UnderlineExtension,
            Placeholder.configure({
                placeholder : "Write something epic about your event...",
                emptyEditorClass : 'is-editor-empty',
            })
        ],
        editorProps : {
            attributes : {
                class : "min-h-[180px] p-4 text-sm sm:text-base",
            }
        },
        // Fires on every keystroke, cursor move & formatting toggle
        onTransaction : () => {
            setTick((t) => t + 1)
        },
        // When the user types, send the HTML back to the parent form.
        onUpdate : ({editor}) => {
            onChange(editor.getHTML())
        }
    })

    useEffect(() => {
        if (!editor) return

        if (value && editor.isEmpty) {
            editor.commands.setContent(value)
        }
    }, [editor, value])

    return (

        <>
            <style>{editorStyles}</style>

            <div className = "bg-zinc-900 rounded-xl overflow-hidden border-2 border-zinc-800 focus-within:border-pink-500/70 focus-within:shadow-[0_0_20px_rgba(236, 72, 153, 0.08)] transition-all duration-300 w-full">
                <MenuBar editor = {editor} />

                <EditorContent editor = {editor} />
            </div>
        </>

    )

}

