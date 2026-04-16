// ClubSettings.jsx


import {Loader2, Shield, Trash2, User} from 'lucide-react'
import {useState} from 'react'
import {toast} from 'react-hot-toast'

import api from '../../api/api'

import ConfirmDialog from '../common/ConfirmDialog'


export default function ClubSettings({currentUser, clubProfile, refreshProfile}) {

    const [newEmail, setNewEmail] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [removingId, setRemovingId] = useState(false)
    const [dialogConfig, setDialogConfig] = useState({isOpen : false, member : null})

    const isOwner = currentUser.id === clubProfile.owner

    const handleAddMember = async (e) => {
        e.preventDefault()

        if (!newEmail.trim()) return

        setIsAdding(true)

        try {
            const response = await api.post(`/api/host/club/${clubProfile.id}/team/`, {email : newEmail})

            toast.success(response.data.message)

            setNewEmail('')

            await refreshProfile()
        } catch (error) {
            if (error.response?.data?.detail) {
                toast.error(error.response.data.detail)
            } else if (error.response?.data?.email) {
                toast.error(error.response.data.email[0] || "Invalid email.")
            } else if (error.response?.data?.error) {
                toast.error(error.response.data.error)
            } else {
                toast.error("User does not exist or could not be added.")
            }
        } finally {
            setIsAdding(false)
        }
    }

    const initiateRemoveMember = async (member) => {
        setDialogConfig({isOpen : true, member : member})
    }

    const confirmRemoveMember = async () => {
        const {member} = dialogConfig

        if (!member) return

        setRemovingId(member.id)

        try {
            const response = await api.delete(`/api/host/club/${clubProfile.id}/team/`, {data : {email : member.email}})

            toast.success(response.data.message)

            await refreshProfile()
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to remove member")
        } finally {
            setRemovingId(null)

            setDialogConfig({isOpen : false, member : null})
        }
    }

    return (

        <div className = "w-full max-w-4xl mx-auto space-y-8 text-white">
            <div>
                <h2 className = "text-2xl font-black uppercase tracking-tighter">
                    Team Management
                </h2>

                <p className = "text-sm text-zinc-400">
                    Manage who has access to {clubProfile.name}'s dashboard
                </p>
            </div>

            {isOwner && (
                <form
                    onSubmit = {handleAddMember}
                    className = "flex gap-3"
                >
                    <input
                        type = 'email'
                        value = {newEmail}
                        onChange = {(e) => setNewEmail(e.target.value)}
                        placeholder = "Student's PLUG. email address"
                        required
                        disabled = {isAdding}
                        className = "flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-500 transition-colors"
                    />

                    <button
                        type = 'submit'
                        disabled = {isAdding || !newEmail}
                        className = "bg-white text-black font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                        {isAdding ? (
                            <Loader2 className = "h-4 w-4 animate-spin"/>
                        ) : (
                            "Add Member"
                        )}
                    </button>
                </form>
            )}
            
            <div className = "bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className = "px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className = "text-sm font-bold uppercase tracking-widest text-zinc-400">
                        Active Members
                    </h3>
                </div>

                <div className = "divide-y divide-zinc-800/50">
                    {clubProfile.team_members?.map((member) => {
                        const isFounder = member.id === clubProfile.owner
                        const isRemoving = removingId === member.id

                        return (

                            <div
                                key = {member.id}
                                className = "flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20 transition-colors"
                            >
                                <div className = "flex items-center gap-4">
                                    <div
                                        className = {`
                                            h-10 w-10 rounded-full flex items-center justify-center
                                            ${isFounder
                                                ? "bg-pink-500/10 text-pink-500"
                                                : "bg-zinc-800 text-zinc-400"
                                            }
                                        `}
                                    >
                                        {isFounder ? (
                                            <Shield size = {18} />
                                        ) : (
                                            <User size = {18} />
                                        )}
                                    </div>

                                    <div>
                                        <p className = "text-sm font-bold flex items-center gap-2">
                                            {member.first_name} {member.last_name}

                                            {isFounder && (
                                                <span className = "text-[10px] uppercase tracking-wider bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
                                                    Founder
                                                </span>
                                            )}
                                        </p>

                                        <p className = "text-xs text-zinc-500">
                                            {member.email}
                                        </p>
                                    </div>
                                </div>

                                {isOwner && !isFounder && (
                                    <button
                                        onClick = {() => initiateRemoveMember(member)}
                                        disabled = {isRemoving}
                                        className = "text-zinc-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                        title = "Remove from club"
                                    >
                                        {isRemoving ? (
                                            <Loader2 className = "h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className = "h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>

                        )
                    })}
                </div>
            </div>

            <ConfirmDialog
                isOpen = {dialogConfig.isOpen}
                onClose = {() => setDialogConfig({isOpen : false, member : null})}
                onConfirm = {confirmRemoveMember}
                title = "Remove Team Member"
                message = {
                    dialogConfig.member
                        ? `Are you sure you want to remove ${dialogConfig.member.first_name} (${dialogConfig.member.email}) from the club? They will instantly lose access to the host dashboard.`
                        : "Are you sure?"
                }
                confirmText = "Remove Member"
                cancelText = 'Cancel'
                isDestructive = {true}
            />
        </div>

    )

}
