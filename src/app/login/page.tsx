"use client"
import { login, signup } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, use } from "react"
import { BiometricLogin } from "@/components/auth/biometric-login"
import Link from "next/link"
import { CheckCircle2Icon, CircleIcon, WalletIcon, UserIcon, LockIcon, MailIcon, PhoneIcon } from "lucide-react"

const passwordRules = [
    { key: "length", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
    { key: "upper", label: "Letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
    { key: "number", label: "Al menos un número", test: (p: string) => /[0-9]/.test(p) },
    { key: "special", label: "Carácter especial (!@#$)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string, tab?: string }> }) {
    const resolvedParams = use(searchParams)
    const errorParam = resolvedParams?.error
    const [tab, setTab] = useState<"login" | "signup">(resolvedParams?.tab === "signup" ? "signup" : "login")
    const [isDependent, setIsDependent] = useState(false)
    const [signupPassword, setSignupPassword] = useState("")

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4" style={{
            background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 40%, #1e3a8a 100%)"
        }}>
            {/* Card glassmorphism */}
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

                {/* Tabs */}
                <div className="flex rounded-2xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <button
                        type="button"
                        onClick={() => setTab("login")}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            tab === "login"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                                : "text-white/50 hover:text-white/80"
                        }`}
                    >
                        Ingresar
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("signup")}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            tab === "signup"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                                : "text-white/50 hover:text-white/80"
                        }`}
                    >
                        Crear Cuenta
                    </button>
                </div>

                {/* ── LOGIN FORM ── */}
                {tab === "login" && (
                    <div className="space-y-4">
                        <BiometricLogin />
                        <form action={login} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Correo</Label>
                                <div className="relative">
                                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        required
                                        className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                        style={{ background: "rgba(255,255,255,0.08)" }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Contraseña</Label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                        style={{ background: "rgba(255,255,255,0.08)" }}
                                    />
                                </div>
                                <div className="text-right">
                                    <Link href="/forgot-password" className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                            </div>
                            {errorParam && (
                                <div className="text-xs font-medium text-rose-300 bg-rose-900/30 border border-rose-500/30 px-3 py-2 rounded-xl">{errorParam}</div>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 border-0 mt-2 transition-all"
                            >
                                Ingresar
                            </Button>
                        </form>
                        <p className="text-center text-xs text-white/40 pt-1">
                            ¿No tienes cuenta?{" "}
                            <button onClick={() => setTab("signup")} className="text-indigo-300 font-semibold hover:text-indigo-200">
                                Crear Cuenta
                            </button>
                        </p>
                    </div>
                )}

                {/* ── SIGNUP FORM ── */}
                {tab === "signup" && (
                    <form action={signup} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Tu Nombre</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    id="nombre"
                                    name="nombre"
                                    placeholder="José Pérez"
                                    required
                                    className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                />
                            </div>
                        </div>

                        {!isDependent ? (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Nombre de Familia</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        id="familia"
                                        name="familia"
                                        placeholder="Familia Pérez"
                                        required
                                        className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                        style={{ background: "rgba(255,255,255,0.08)" }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Código de Familia</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <Input
                                        id="codigo_familia"
                                        name="codigo_familia"
                                        placeholder="Pega el ID de familia"
                                        required
                                        className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                        style={{ background: "rgba(255,255,255,0.08)" }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Correo</Label>
                            <div className="relative">
                                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    id="email-signup"
                                    name="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    required
                                    className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">WhatsApp</Label>
                            <div className="relative">
                                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    id="whatsapp"
                                    name="whatsapp"
                                    type="tel"
                                    placeholder="573001234567"
                                    required
                                    className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Contraseña</Label>
                            <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                    id="password-signup"
                                    name="password"
                                    type="password"
                                    placeholder="Mín. 8 caracteres"
                                    value={signupPassword}
                                    onChange={e => setSignupPassword(e.target.value)}
                                    required
                                    className="pl-10 rounded-xl border-0 text-white placeholder:text-white/25 h-11"
                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                />
                            </div>
                            {signupPassword.length > 0 && (
                                <div className="mt-1.5 space-y-1 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                                    {passwordRules.map(r => {
                                        const ok = r.test(signupPassword)
                                        return (
                                            <div key={r.key} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-emerald-400' : 'text-white/30'}`}>
                                                {ok ? <CheckCircle2Icon className="w-3 h-3 shrink-0" /> : <CircleIcon className="w-3 h-3 shrink-0" />}
                                                {r.label}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsDependent(!isDependent)}
                            className="text-xs text-indigo-300 hover:text-indigo-200 w-full text-center pt-0.5"
                        >
                            {isDependent ? "¿Eres titular? Haz clic aquí." : "¿Te invitaron como dependiente?"}
                        </button>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 border-0 transition-all"
                        >
                            {isDependent ? "Unirme a Familia" : "Crear Grupo Familiar"}
                        </Button>

                        <p className="text-center text-xs text-white/40 pt-1">
                            ¿Ya tienes cuenta?{" "}
                            <button type="button" onClick={() => setTab("login")} className="text-indigo-300 font-semibold hover:text-indigo-200">
                                Ingresar
                            </button>
                        </p>
                    </form>
                )}

                <p className="text-center text-xs text-white/20 mt-4">Bolsillo v3.0 · Finanzas Familiares</p>
            </div>
        </div>
    )
}
