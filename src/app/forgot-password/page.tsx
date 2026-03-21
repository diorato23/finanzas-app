"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, CheckCircle2Icon, MailIcon, WalletIcon, AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ForgotPasswordContent() {
    const searchParams = useSearchParams()
    const expiredError = searchParams.get("error") === "expired"

    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(
        expiredError ? "El enlace de recuperación ha expirado. Solicita uno nuevo." : null
    )

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
        const redirectTo = `${siteUrl}/auth/confirm?next=/reset-password`

        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

        if (error) {
            if (error.status === 429) {
                setError("Has solicitado demasiados enlaces. Espera unos minutos e intenta de nuevo.")
            } else {
                setError("No encontramos una cuenta con ese correo. Verifica e intenta de nuevo.")
            }
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4" style={{
            background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #1e3a8a 100%)"
        }}>
            <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.12)"
            }}>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <WalletIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Bolsillo</span>
                </div>

                {/* Back Link */}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-5"
                >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    Volver al inicio de sesión
                </Link>

                {/* Title */}
                <h1 className="text-xl font-bold text-white mb-1">Recuperar Contraseña</h1>
                <p className="text-sm text-white/40 mb-6">
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                {sent ? (
                    /* SUCCESS STATE */
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2Icon className="w-9 h-9 text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-white text-lg">¡Correo enviado!</p>
                            <p className="text-sm text-white/50 mt-2 leading-relaxed">
                                Revisa tu bandeja de entrada en <strong className="text-white/70">{email}</strong> y sigue el enlace para crear una nueva contraseña.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="w-full h-11 rounded-xl font-bold text-white mt-2 transition-all border-0"
                            style={{ background: "rgba(255,255,255,0.1)" }}
                        >
                            <Link href="/login">Volver al inicio de sesión</Link>
                        </Button>
                    </div>
                ) : (
                    /* FORM STATE */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Correo Electrónico</Label>
                            <div className="relative">
                                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 text-xs font-medium text-amber-300 bg-amber-900/30 border border-amber-500/30 px-3 py-2.5 rounded-xl">
                                <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 border-0 transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                    Enviando...
                                </span>
                            ) : (
                                "Enviar enlace de recuperación"
                            )}
                        </Button>

                        <p className="text-center text-xs text-white/40 pt-1">
                            ¿Recordaste tu contraseña?{" "}
                            <Link href="/login" className="text-indigo-300 font-semibold hover:text-indigo-200 transition-colors">
                                Ingresar
                            </Link>
                        </p>
                    </form>
                )}

                <p className="text-center text-xs text-white/20 mt-6">Bolsillo v3.0 · Finanzas Familiares</p>
            </div>
        </div>
    )
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center" style={{
                background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #1e3a8a 100%)"
            }}>
                <RefreshCwIcon className="w-6 h-6 text-white/50 animate-spin" />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    )
}
