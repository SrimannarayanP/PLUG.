// RichTextEditor.jsx


import {useEffect} from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import UnderlineExtension from '@tiptap/extension-underline'
import {useEditor, EditorContent} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {Bold, Italic, List, ListOrdered, Underline} from 'lucide-react'


const MenuBar = ({editor}) => {
    if (!editor) return null

    const buttons = [
        {
            icon : Bold,
            title : 'Bold',
            action : () => editor.chain().focus().toggleBold().run(),
            isActive : editor.isActive('bold'),
            canExecute : editor.can().chain().focus().toggleBold().run()
        },

        {
            icon : Italic,
            title : 'Italic',
            action : () => editor.chain().focus().toggleItalic().run(),
            isActive : editor.isActive('italic'),
            canExecute : editor.can().chain().focus().toggleItalic().run()
        },

        {
            icon : Underline,
            title : 'Underline',
            action : () => editor.chain().focus().toggleUnderline().run(),
            isActive : editor.isActive('underline'),
            canExecute : editor.can().chain().focus().toggleUnderline().run()
        },

        {type : 'divider'},

        {
            icon : List,
            title : "Bullet List",
            action : () => editor.chain().focus().toggleBulletList().run(),
            isActive : editor.isActive('bulletList'),
            canExecute : true
        },

        {
            icon : ListOrdered,
            title : "Ordered List",
            action : () => editor.chain().focus().toggleOrderedList().run(),
            isActive : editor.isActive('orderedList'),
            canExecute : true
        }
    ]

    return (

        <div className = "flex items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-x-auto no-scrollbar touch-pan-x">
            {buttons.map((btn, index) => {
                if (btn.type === 'divider') {

                    return (

                        <div
                            key = {index}
                            className = "w-[1px] h-6 bg-zinc-800 mx-1 shrink-0"
                        />

                    )

                }

                const Icon = btn.icon

                return (

                    <button
                        key = {index}
                        onClick = {(e) => {
                            e.preventDefault()
                            btn.action()
                        }}
                        disabled = {!btn.canExecute}
                        title = {btn.title}
                        className = {`
                            p-2 rounded-lg transition-all duration-200 shrink-0
                            ${btn.isActive
                                ? "bg-pink-500 text-white shadow-[0_0_10px_rgba(236, 72, 153, 0.4)]"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            }
                        `}
                    >
                        <Icon 
                            size = {18}
                            strokeWidth = {2.5}
                        />
                    </button>

                )
            })}
        </div>

    )
}


export default function RichTextEditor({value, onChange}) {

    const editor = useEditor({
        extensions : [
            StarterKit,
            UnderlineExtension,
            Placeholder.configure({
                placeholder : "Write something epic about your event...",
                emptyEditorClass : "is-editor-empty before:content-[attr(data-placeholder)] before:text-zinc-600 before:float-left before:pointer-events-none"
            })
        ],
        editorProps : {
            attributes : {
                class : "prose prose-invert prose-sm sm:prose-base prose-p:my-2 prose-headings:mb-2 max-w-none focus:outline-none min-h-[150px] p-4 text-zinc-300 selection:bg-pink-500/30 selection:text-pink-200"
            }
        },
        // When the user types, send the HTML back to the parent form.
        onUpdate : ({editor}) => {
            onChange(editor.getHTML())
        }
    })

    useEffect(() => {
        if (editor && value) {
            if (editor.getHTML() !== value) {
                editor.commands.setContent(value)
            }
        }
    }, [editor, value])

    return (

        <div className = "bg-zinc-900 rounded-xl overflow-hidden border-2 border-zinc-800 focus-within:border-pink-500 focus-within:shadow-[0_0_15px_rgba(236, 72, 153, 0.1)] transition-all duration-300 w-full">
            <MenuBar editor = {editor} />
            <EditorContent editor = {editor} />
        </div>

    )

}

