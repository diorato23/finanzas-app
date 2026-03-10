"use strict"
import { Outfit } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ServiceWorkerRegister } from "@/components/pwa-register"
import { Toaster } from "sonner"

import { Metadata, Viewport } from "next"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Finanzas App",
  description: "Controle financeiro inteligente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finanzas App",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${outfit.variable} font-sans`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorkerRegister />
          {children}
          <Toaster richColors closeButton position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
