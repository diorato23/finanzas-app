"use client"

import { useEffect, useState } from "react"
import { startRegistration } from "@simplewebauthn/browser"
import { getRegistrationOptions, verifyRegistration } from "@/app/auth/webauthn/actions"
import { Button } from "@/components/ui/button"
import { Fingerprint } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export function BiometricActivation() {
    const [supported, setSupported] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Verificar suporte básico no navegador e na plataforma
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then((available) => {
                    if (available) setSupported(true)
                })
        }
    }, [])

    const handleRegister = async () => {
        setIsLoading(true)
        try {
            // 1. Obter opções do servidor
            const options = await getRegistrationOptions()

            // 2. Acionar hardware do dispositivo (FaceID/TouchID)
            const regResponse = await startRegistration({
                optionsJSON: options,
            })

            // 3. Verificar no servidor
            const verification = await verifyRegistration(regResponse)

            if (verification.success) {
                toast.success("¡Acceso biométrico activado!", {
                    description: "Ahora puedes entrar al app usando tu huella o rostro.",
                })
                setIsRegistered(true)
            }
        } catch (error: unknown) {
            console.error(error)
            const name = (error as { name?: unknown })?.name
            const message = error instanceof Error ? error.message : undefined
            if (name !== "AbortError") {
                toast.error("Error ao configurar biometria", {
                    description: message || "Asegúrate de tener un PIN o biometría activa en tu equipo.",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!supported || isRegistered) return null

    return (
        <Card className="bg-primary/5 border-primary/20 rounded-[20px] overflow-hidden group hover:bg-primary/10 transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                        <Fingerprint className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground">Acesso Rápido</h4>
                        <p className="text-xs text-muted-foreground font-medium">
                            Ativa FaceID ou Digital para entrar rápido no app.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="rounded-full px-6 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    {isLoading ? "Configurando..." : "Ativar"}
                </Button>
            </CardContent>
        </Card>
    )
}
