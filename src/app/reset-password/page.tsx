"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2Icon, CircleIcon, LockIcon, WalletIcon, ShieldCheckIcon, AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
import Link from "next/link"

const rules = [
    { key: "length", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
    { key: "upper", label: "Letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
    { key: "number", label: "Al menos un número", test: (p: string) => /[0-9]/.test(p) },
    { key: "special", label: "Carácter especial (!@#$)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sessionValid, setSessionValid] = useState<boolean | null>(null)

    const allValid = rules.every(r => r.test(password))
    const passwordsMatch = password === confirm && confirm.length > 0

    useEffect(() => {
        async function checkSession() {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            setSessionValid(!!session)
        }
        checkSession()
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!allValid) { setError("La contraseña no cumple los requisitos de seguridad."); return }
        if (!passwordsMatch) { setError("Las contraseñas no coinciden."); return }

        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.")
            setLoading(false)
        } else {
            setSuccess(true)
            setTimeout(() => router.push("/dashboard"), 2000)
        }
    }

    // Loading state
    if (sessionValid === null) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center" style={{
                background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #1e3a8a 100%)"
            }}>
                <RefreshCwIcon className="w-6 h-6 text-white/50 animate-spin" />
            </div>
        )
    }

    // Invalid/expired session state
    if (!sessionValid) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4" style={{
                background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #1e3a8a 100%)"
            }}>
                <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.12)"
                }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <WalletIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">Finanza</span>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <AlertTriangleIcon className="w-9 h-9 text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-white text-lg">Enlace expirado</p>
                            <p className="text-sm text-white/50 mt-2 leading-relaxed">
                                El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo para restablecer tu contraseña.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="w-full h-11 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 border-0 transition-all mt-2"
                        >
                            <Link href="/forgot-password">Solicitar nuevo enlace</Link>
                        </Button>
                        <Link href="/login" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                            Volver al inicio de sesión
                        </Link>
                    </div>
                    <p className="text-center text-xs text-white/20 mt-4">Finanza v3.0 · Finanzas Familiares</p>
                </div>
            </div>
        )
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
                    <span className="text-2xl font-bold text-white tracking-tight">Finanza</span>
                </div>

                {success ? (
                    /* SUCCESS STATE */
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <ShieldCheckIcon className="w-9 h-9 text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-white text-lg">¡Contraseña actualizada!</p>
                            <p className="text-sm text-white/50 mt-2 leading-relaxed">
                                Tu contraseña ha sido cambiada exitosamente. Redirigiendo al panel...
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/30 mt-2">
                            <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                            Redirigiendo...
                        </div>
                    </div>
                ) : (
                    /* FORM STATE */
                    <>
                        <h1 className="text-xl font-bold text-white mb-1">Nueva Contraseña</h1>
                        <p className="text-sm text-white/40 mb-6">Crea una contraseña segura para tu cuenta.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Nueva Contraseña</Label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Mín. 8 caracteres"
                                        className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                        style={{ background: "rgba(255,255,255,0.08)" }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Rules Checklist */}
                            <div className="space-y-1 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                                {rules.map(r => {
                                    const ok = r.test(password)
                                    return (
                                        <div key={r.key} className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${ok ? 'text-emerald-400' : 'text-white/30'}`}>
                                            {ok
                                                ? <CheckCircle2Icon className="w-3 h-3 shrink-0" />
                                                : <CircleIcon className="w-3 h-3 shrink-0" />
                                            }
                                            {r.label}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Confirmar Contraseña</Label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        id="confirm"
                                        type="password"
                                        placeholder="Repite la contraseña"
                                        className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                        style={{ background: "rgba(255,255,255,0.08)" }}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        required
                                    />
                                </div>
                                {confirm.length > 0 && !passwordsMatch && (
                                    <p className="text-xs text-rose-400 mt-1">Las contraseñas no coinciden.</p>
                                )}
                                {passwordsMatch && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                                        <CheckCircle2Icon className="w-3 h-3" />
                                        Las contraseñas coinciden
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 text-xs font-medium text-rose-300 bg-rose-900/30 border border-rose-500/30 px-3 py-2.5 rounded-xl">
                                    <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 border-0 transition-all"
                                disabled={loading || !allValid || !passwordsMatch}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                        Guardando...
                                    </span>
                                ) : (
                                    "Guardar nueva contraseña"
                                )}
                            </Button>
                        </form>
                    </>
                )}

                <p className="text-center text-xs text-white/20 mt-6">Finanza v3.0 · Finanzas Familiares</p>
            </div>
        </div>
    )
}
