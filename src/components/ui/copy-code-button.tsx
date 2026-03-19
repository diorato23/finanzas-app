"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "lucide-react"

interface CopyCodeButtonProps {
    code: string
}

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
        >
            {copied
                ? <CheckIcon className="w-4 h-4 text-green-500" />
                : <CopyIcon className="w-4 h-4" />
            }
            <span className="sr-only">Copiar código</span>
        </Button>
    )
}
