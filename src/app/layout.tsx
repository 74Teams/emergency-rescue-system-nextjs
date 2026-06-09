import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/app/providers'
import type { Metadata } from 'next'
import { Arimo } from 'next/font/google'
import './globals.css'

const arimo = Arimo({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-sans',
})

export const metadata: Metadata = {
    title: 'Hệ Thống Cứu Hộ',
    description: 'Phần mềm điều phối cứu trợ',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="vi" className={arimo.variable}>
            <body className={`font-sans bg-slate-50`}>
                <Providers>{children}</Providers>
                <Toaster richColors position="top-right" duration={2000} />
            </body>
        </html>
    )
}
