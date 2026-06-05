import Link from 'next/link'
import TopbarSearch from '@/components/dashboards/citizen/TopbarSearch'
import { CitizenHeaderActions } from '@/components/dashboards/citizen/CitizenHeaderActions'
import { CitizenSidebar } from '@/components/dashboards/citizen/CitizenSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { LifeBuoy } from 'lucide-react'

export default function CitizenLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <SidebarProvider>
            <div className="flex flex-col w-full h-screen">
                <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm z-20 h-16 shrink-0 w-full">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="text-slate-500 hover:text-blue-600 transition-colors" />
                        <Link
                            href="/"
                            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity group"
                        >
                            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200">
                                <LifeBuoy className="w-5 h-5 stroke-[2.5] transition-transform duration-500 group-hover:rotate-90" />
                            </div>

                            {/* Phần Chữ Logo */}
                            <div className="flex flex-col justify-center">
                                <span className="text-[17px] font-black tracking-tight leading-none text-slate-900">
                                    Rescue<span className="text-emerald-600">System</span>
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">
                                    Hỗ trợ người dân
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Góc giữa: Ô tìm kiếm */}
                    <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
                        <TopbarSearch />
                    </div>

                    <CitizenHeaderActions />
                </header>
                <div className="flex flex-1 overflow-hidden relative z-10">
                    <CitizenSidebar />
                    <main className="flex-1 relative h-full">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    )
}
