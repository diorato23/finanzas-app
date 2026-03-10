"use client"

import { useState } from "react"
import { startAuthentication } from "@simplewebauthn/browser"
import { getAuthenticationOptions, verifyAuthentication } from "@/app/auth/webauthn/actions"
import { Button } from "@/components/ui/button"
import { Fingerprint } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function BiometricLogin() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async () => {
        setIsLoading(true)
        try {
            // 1. Obter opções de desafio
            const options = await getAuthenticationOptions()

            // 2. Acionar hardware (FaceID/Digital)
            const authResponse = await startAuthentication({
                optionsJSON: options,
            })

            // 3. Verificar no servidor
            const result = await verifyAuthentication(authResponse)

            if (result.success) {
                toast.success("¡Acceso concedido!", {
                    description: "Ingresando con biometría...",
                })
                // O servidor já deve ter configurado os cookies de sessão ou gerado o redirecionamento
                router.push("/dashboard")
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            if (error.name !== "AbortError") {
                toast.error("Error de autenticación", {
                    description: "No se reconoció la huella o el dispositivo.",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 rounded-xl border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary transition-all group"
        >
            <Fingerprint className="h-5 w-5 mr-3 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-semibold">{isLoading ? "Verificando..." : "Entrar con Biometría"}</span>
        </Button>
    )
}
