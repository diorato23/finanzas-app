"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon, CheckCircle2Icon, MailIcon } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`

        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

        if (error) {
            setError("No encontramos una cuenta con ese correo. Verifica e intenta de nuevo.")
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Link>
                        <span className="text-sm text-muted-foreground">Volver al inicio</span>
                    </div>
                    <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
                    <CardDescription>
                        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                    </CardDescription>
                </CardHeader>

                {sent ? (
                    <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                        <CheckCircle2Icon className="w-14 h-14 text-green-500" />
                        <div>
                            <p className="font-semibold text-foreground">¡Correo enviado!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue el enlace para crear una nueva contraseña.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="w-full mt-2">
                            <Link href="/login">Volver al inicio de sesión</Link>
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <div className="relative">
                                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        className="pl-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    )
}
