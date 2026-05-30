import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/app/providers'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
        <html lang="vi">
            <body className={`${inter.className} bg-slate-50`}>
                <Providers>{children}</Providers>
                <Toaster richColors position="top-right" duration={2000} />
            </body>
        </html>
    )
}
