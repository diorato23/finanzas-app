import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const next = requestUrl.searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error("[Auth Callback] Error exchanging code:", error.message)
            const errorUrl = new URL("/forgot-password", requestUrl.origin)
            errorUrl.searchParams.set("error", "expired")
            return NextResponse.redirect(errorUrl)
        }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin))
}
