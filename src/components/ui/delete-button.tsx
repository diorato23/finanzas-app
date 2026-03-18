"use client"

import { useFormStatus } from "react-dom"
import { Button } from "./button"
import { TrashIcon } from "lucide-react"

interface DeleteButtonProps {
    message: string
    className?: string
}

export function DeleteButton({ message, className }: DeleteButtonProps) {
    const { pending } = useFormStatus()
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            type="submit" 
            className={className || "h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"} 
            title="Eliminar"
            disabled={pending}
            onClick={(e) => {
                if (!window.confirm(message)) {
                    e.preventDefault()
                }
            }}
        >
            <TrashIcon className="w-4 h-4" />
        </Button>
    )
}
