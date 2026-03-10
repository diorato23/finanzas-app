"use client"
import { login, signup } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useState, use } from "react"
import { BiometricLogin } from "@/components/auth/biometric-login"

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const [isDependent, setIsDependent] = useState(false)
    const resolvedParams = use(searchParams)
    const errorParam = resolvedParams?.error

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl items-start">
                {/* LOGIN */}
                <Card className="flex-1 w-full shrink-0">
                    <CardHeader>
                        <CardTitle>Iniciar Sesión</CardTitle>
                        <CardDescription>Accede a tu cuenta de Finanzas.</CardDescription>
                    </CardHeader>
                    <div className="px-6 pb-2">
                        <BiometricLogin />
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-muted-foreground/20" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">O usa tu contraseña</span>
                            </div>
                        </div>
                    </div>
                    <form action={login}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-login">Correo Electrónico</Label>
                                <Input id="email-login" name="email" type="email" placeholder="correo@ejemplo.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-login">Contraseña</Label>
                                <Input id="password-login" name="password" type="password" required />
                            </div>
                            {errorParam && (
                                <div className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded">{errorParam}</div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Ingresar</Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* REGISTRO */}
                <Card className="flex-1 w-full shrink-0">
                    <CardHeader>
                        <CardTitle>Crear Cuenta Nueva</CardTitle>
                        <CardDescription>
                            Regístrate para manejar tus finanzas.
                            <button
                                type="button"
                                onClick={() => setIsDependent(!isDependent)}
                                className="block mt-2 text-sm text-blue-600 hover:underline"
                            >
                                {isDependent ? "¿Eres el titular administrador? Haz clic aquí." : "¿Te invitaron como dependiente? Haz clic aquí."}
                            </button>
                        </CardDescription>
                    </CardHeader>
                    <form action={signup}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Tu Nombre</Label>
                                <Input id="nombre" name="nombre" placeholder="José Pérez" required />
                            </div>

                            {!isDependent ? (
                                <div className="space-y-2">
                                    <Label htmlFor="familia">Nombre de la Familia (Titular)</Label>
                                    <Input id="familia" name="familia" placeholder="Familia Pérez" required />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="codigo_familia">Código de Familia (Invitación)</Label>
                                    <Input id="codigo_familia" name="codigo_familia" placeholder="Copia y pega el ID de familia" required />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email-signup">Correo Electrónico</Label>
                                <Input id="email-signup" name="email" type="email" placeholder="correo@ejemplo.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-signup">Contraseña</Label>
                                <Input id="password-signup" name="password" type="password" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" variant={isDependent ? "outline" : "secondary"} className="w-full">
                                {isDependent ? "Registrar como Dependiente" : "Crear Grupo Familiar"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
