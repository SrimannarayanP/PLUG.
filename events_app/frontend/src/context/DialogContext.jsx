// DialogContext.jsx


import {createContext, useCallback, useContext, useState} from 'react'

import ConfirmDialog from '../components/common/ConfirmDialog'


const DialogContext = createContext()


export function DialogProvider({children}) {

    const [isOpen, setIsOpen] = useState(false)
    const [dialogConfig, setDialogConfig] = useState({
        title : '',
        message : '',
        confirmText : 'Confirm',
        cancelText : 'Cancel',
        isDestructive : false,
        onConfirm : () => {}
    })

    const confirm = useCallback((config) => {
        setDialogConfig({
            title : config.title || "Are you sure?",
            message : config.message || "This action cannot be undone.",
            confirmText : config.confirmText || 'Confirm',
            cancelText : config.cancelText || 'Cancel',
            isDestructive : config.isDestructive || false,
            onConfirm : config.onConfirm || (() => {})
        })

        setIsOpen(true)
    }, [])

    const closeDialog = useCallback(() => {
        setIsOpen(false)
    }, [])


    return (

        <DialogContext.Provider value = {{confirm}}>
            {children}

            <ConfirmDialog
                isOpen = {isOpen}
                onClose = {closeDialog}
                title = {dialogConfig.title}
                message = {dialogConfig.message}
                confirmText = {dialogConfig.confirmText}
                cancelText = {dialogConfig.cancelText}
                isDestructive = {dialogConfig.isDestructive}
                onConfirm = {dialogConfig.onConfirm}
            />
        </DialogContext.Provider>

    )

}

export const useDialog = () => {
    const context = useContext(DialogContext)

    if (!context) {
        throw new Error("useDialog must be used within a DialogProvider")
    }

    return context
}
