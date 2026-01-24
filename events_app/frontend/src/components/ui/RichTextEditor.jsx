// RichTextEditor.jsx


import {useState} from 'react'
import {useEditor, EditorContent} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {Bold, Italic, List, ListOrdered} from 'lucide-react'


const MenuBar = ({editor}) => {
    if (!editor) return null

    const getButtonClass = (isActive) => `p-2 rounded-lg transition-all duration-200 
        ${isActive
            ? "bg-pink-500 text-white shadow-[0_0_10px_rgba(236, 72, 153, 0.4)]" // Active state
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white" // Inactive state
        }
    `

    return (

        <div className = "flex gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleBold().run()
                }}
                disabled = {!editor.can().chain().focus().toggleBold().run()}
                className = {getButtonClass(editor.isActive('bold'))}
                title = 'Bold'
            >
                <Bold 
                    size = {18}
                    strokeWidth = {2.5}
                />
            </button>

            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleItalic().run()
                }}
                disabled = {!editor.can().chain().focus().toggleItalic().run()}
                className = {getButtonClass(editor.isActive('italic'))}
                title = 'Italic'
            >
                <Italic 
                    size = {18}
                    strokeWidth = {2.5}
                />
            </button>

            <div className = "w-[1px] h-6 bg-zinc-800 mx-1 self-center" />

            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleBulletList().run()
                }}
                className = {getButtonClass(editor.isActive('bulletList'))}
                title = "Bullet List"
            >
                <List 
                    size = {18}
                    strokeWidth = {2.5}
                />
            </button>

            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleOrderedList().run()
                }}
                className = {getButtonClass(editor.isActive('orderedList'))}
                title = "Ordered List"
            >
                <ListOrdered 
                    size = {18}
                    strokeWidth = {2.5}
                />
            </button>
        </div>

    )
}


export default function RichTextEditor({value, onChange}) {

    const [, forceUpdate] = useState(0)

    const editor = useEditor({
        extensions : [
            StarterKit,
            Placeholder.configure({
                placeholder : "Write something epic about your event...",
                emptyEditorClass : "is-editor-empty before:content-[attr(data-placeholder)] before:text-zinc-600 before:float-left before:pointer-events-none"
            })
        ],
        content : value,
        // Forces React to re-render the component whenever the editor state changes (basically button clicks, typing etc.)
        onTransaction : () => {
            forceUpdate(n => n + 1)
        },
        // When the user types, send the HTML back to the parent form.
        onUpdate : ({editor}) => {
            onChange(editor.getHTML())
        },
        editorProps : {
            attributes : {
                class : "prose prose-invert prose-p:my-2 prose-headings:mb-2 max-w-none focus:outline-none min-h-[150px] p-4 text-zinc-300 selection:bg-pink-500/30 selection:text-pink-200", 
            },
        },
    })

    return (

        <div className = "bg-zinc-900 rounded-xl overflow-hidden border-2 border-zinc-800 focus-within:border-pink-500 focus-within:shadow-[0_0_15px_rgba(236, 72, 153, 0.1)] transition-all duration-300">
            <MenuBar editor = {editor} />
            <EditorContent editor = {editor} />
        </div>

    )

}
