"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2Icon, CircleIcon, LockIcon } from "lucide-react"

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
    const [error, setError] = useState<string | null>(null)

    const allValid = rules.every(r => r.test(password))
    const passwordsMatch = password === confirm && confirm.length > 0

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
            router.push("/dashboard")
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Nueva Contraseña</CardTitle>
                    <CardDescription>Crea una contraseña segura para tu cuenta.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nueva Contraseña</Label>
                            <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mín. 8 caracteres"
                                    className="pl-9"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Checklist de requisitos */}
                        <div className="space-y-1.5">
                            {rules.map(r => {
                                const ok = r.test(password)
                                return (
                                    <div key={r.key} className={`flex items-center gap-2 text-sm transition-colors ${ok ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {ok
                                            ? <CheckCircle2Icon className="w-4 h-4 shrink-0" />
                                            : <CircleIcon className="w-4 h-4 shrink-0" />
                                        }
                                        {r.label}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirmar Contraseña</Label>
                            <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="confirm"
                                    type="password"
                                    placeholder="Repite la contraseña"
                                    className="pl-9"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                />
                            </div>
                            {confirm.length > 0 && !passwordsMatch && (
                                <p className="text-xs text-red-500">Las contraseñas no coinciden.</p>
                            )}
                        </div>

                        {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading || !allValid || !passwordsMatch}>
                            {loading ? "Guardando..." : "Guardar nueva contraseña"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
