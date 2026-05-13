// src/app/dispatcher/layout.tsx
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function DispatcherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-slate-50">
          {children}
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
