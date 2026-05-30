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
        {children}
      </SidebarProvider>
    </TooltipProvider>
  )
}
