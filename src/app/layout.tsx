"use strict"
import { Outfit } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

export const metadata = {
  title: "Finanzas Familiares",
  description: "Control financiero personal y familiar",
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
