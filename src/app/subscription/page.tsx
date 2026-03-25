import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Lock, Smartphone, CreditCard } from "lucide-react"
import { HeaderThemeToggle } from "@/components/header-theme-toggle"

export default async function SubscriptionPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("subscription_status, trial_ends_at, nombre, whatsapp, rol, familia_id")
        .eq("id", user.id)
        .single()

    let activeSubscriptionStatus = perfil?.subscription_status;
    let activeTrialEndsAt = perfil?.trial_ends_at;

    if (perfil?.rol !== 'admin' && perfil?.familia_id) {
        const { data: adminPerfil } = await supabase
            .from("perfiles")
            .select("subscription_status, trial_ends_at")
            .eq("familia_id", perfil.familia_id)
            .eq("rol", "admin")
            .single();
            
        if (adminPerfil) {
            activeSubscriptionStatus = adminPerfil.subscription_status;
            activeTrialEndsAt = adminPerfil.trial_ends_at;
        }
    }

    if (activeSubscriptionStatus === 'active') {
        redirect("/dashboard")
    }

    if (activeSubscriptionStatus === 'trial' && activeTrialEndsAt) {
        const now = new Date()
        const trialEnds = new Date(activeTrialEndsAt)
        if (now <= trialEnds) {
            redirect("/dashboard")
        }
    }
    
    const isOwner = perfil?.rol === 'admin';

    const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "573000000000"
    const message = encodeURIComponent(`Hola, soy ${perfil?.nombre} (${perfil?.whatsapp}). Mi prueba gratuita terminó y quiero adquirir Premium.`)
    const wpLink = `https://wa.me/${adminWhatsApp}?text=${message}`

    return (
        <div className="min-h-screen bg-background flex flex-col items-center p-4">
            <header className="w-full flex justify-end p-4">
                <HeaderThemeToggle />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full space-y-6 pb-20">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary animate-pulse">
                    <Lock size={32} />
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Finanzas Premium</h1>
                    <p className="text-muted-foreground text-lg px-4">
                        {isOwner 
                            ? "Tu período de prueba ha terminado. Activa Premium para seguir teniendo el control de tu dinero."
                            : "El período de prueba de tu grupo familiar ha terminado. Pide al administrador que active Premium para seguir usando la app."}
                    </p>
                </div>

                <Card className="w-full border-primary/20 bg-card shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                    
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold">Plan Familiar</CardTitle>
                        <CardDescription>Acceso para ti y 4 dependientes</CardDescription>
                        <div className="mt-4 flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">$XX.XXX</span>
                            <span className="text-muted-foreground font-medium">/mes</span>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-3">
                            {[
                                "Asistente IA por WhatsApp 24/7",
                                "Registro automático con voz o texto",
                                "Gestión de presupuestos y alertas",
                                "Sincronización Offline",
                                "Hasta 4 dependientes incluidos"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                    <span className="text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 space-y-3 border-t border-border mt-6">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                                <CreditCard size={16} /> Medios de Pago Disponibles:
                            </h3>
                            <div className="flex gap-2 justify-center">
                                <a href={wpLink} target="_blank" rel="noopener noreferrer" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">
                                    <Smartphone size={14} /> Nequi
                                </a>
                                <a href={wpLink} target="_blank" rel="noopener noreferrer" className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-500 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">
                                    <Smartphone size={14} /> Bancolombia
                                </a>
                                <a href={wpLink} target="_blank" rel="noopener noreferrer" className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-500 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">
                                    <Smartphone size={14} /> DaviPlata
                                </a>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex-col gap-4">
                        <Button asChild size="lg" className="w-full font-semibold shadow-md active:scale-[0.98] transition-all">
                            <a href={wpLink} target="_blank" rel="noopener noreferrer">
                                {isOwner ? "Renovar por WhatsApp" : "Contactar Administrador / Renovar"}
                            </a>
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Tus datos e historial están guardados de forma segura y se restaurarán al activar.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
