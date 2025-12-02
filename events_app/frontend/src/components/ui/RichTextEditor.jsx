// RichTextEditor.jsx


import React from 'react'
import {useEditor, EditorContent} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'


const MenuBar = ({editor}) => {
    if (!editor) {
        return null
    }

    const getButtonClass = (isActive) =>
    `px-3 py-1.5 rounded text-sm font-bold transition-colors ${
        isActive
            ? "bg-[#c90000] text-white" // Active state
            : "text-[#6f2d37] hover:bg-[#6f2d37]/10" // Inactive state
    }`

    return (

        <div className = "flex gap-2 p-2 border-b-2 border-[#6f2d37]/20 bg-[#eae5dc]/30">
            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleBold().run()
                }}
                disabled = {!editor.can().chain().focus().toggleBold().run()}
                className = {getButtonClass(editor.isActive('bold'))}
            >
                B
            </button>

            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleItalic().run()
                }}
                disabled = {!editor.can().chain().focus().toggleItalic().run()}
                className = {getButtonClass(editor.isActive('italic'))}
            >
                I
            </button>

            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleBulletList().run()
                }}
                className = {getButtonClass(editor.isActive('bulletList'))}
            >
                • List
            </button>

            <button
                onClick = {(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleOrderedList().run()
                }}
                className = {getButtonClass(editor.isActive('orderedList'))}
            >
                1. List
            </button>
        </div>

    )
}


export default function RichTextEditor({value, onChange}) {

    const editor = useEditor({
        extensions : [
            StarterKit,
            Placeholder.configure({
                placeholder : "Write something epic about your event..."
            })
        ],
        content : value,
        // When the user types, send the HTML back to the parent form.
        onUpdate : ({editor}) => {
            onChange(editor.getHTML())
        },
        editorProps : {
            attributes : {
                class : "prose prose-red max-w-none focus:outline-none min-h-[150px] p-4 text-[#6f2d37]", 
            },
        },
    })

    return (

        <div className = "bg-white rounded-lg overflow-hidden border-2 border-[#6f2d37]/20 focus-within:border-[#c90000] transition-colors">
            <MenuBar editor = {editor} />
            <EditorContent editor = {editor} />
        </div>

    )

}

