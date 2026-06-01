import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { isToday, isYesterday, format } from 'date-fns'

export interface NotificationItem {
    id: string
    title: React.ReactNode
    description: React.ReactNode
    timestamp: string // ISO date string
    onClick?: () => void
}

interface NotificationBellProps {
    items: NotificationItem[]
    onItemClick?: (item: NotificationItem) => void
}

export function NotificationBell({ items, onItemClick }: NotificationBellProps) {
    const [readIds, setReadIds] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('unread')

    // Load read IDs from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('notifications_read_ids')
            if (stored) {
                setReadIds(JSON.parse(stored))
            }
        } catch (e) {
            console.error('Failed to parse read notification IDs', e)
        }
    }, [])

    const { unreadItems, readItems } = useMemo(() => {
        const unread: NotificationItem[] = []
        const read: NotificationItem[] = []
        
        // Sort items by timestamp descending
        const sortedItems = [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        sortedItems.forEach(item => {
            if (readIds.includes(item.id)) {
                read.push(item)
            } else {
                unread.push(item)
            }
        })
        return { unreadItems: unread, readItems: read }
    }, [items, readIds])

    // When dropdown closes, mark all currently unread items as read
    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open)
        if (open) {
            // Automatically switch to unread if there are any, else read
            setActiveTab(unreadItems.length > 0 ? 'unread' : 'read')
        } else {
            // When closing, save unread to readIds
            if (unreadItems.length > 0) {
                const newReadIds = [...new Set([...readIds, ...unreadItems.map(i => i.id)])]
                setReadIds(newReadIds)
                try {
                    localStorage.setItem('notifications_read_ids', JSON.stringify(newReadIds))
                } catch (e) {
                    console.error('Failed to save read notification IDs', e)
                }
            }
        }
    }, [readIds, unreadItems])

    const formatTimestamp = (isoString: string) => {
        try {
            const date = new Date(isoString)
            if (isToday(date)) {
                return `Hôm nay, ${format(date, 'HH:mm')}`
            }
            if (isYesterday(date)) {
                return `Hôm qua, ${format(date, 'HH:mm')}`
            }
            return format(date, 'dd/MM/yyyy HH:mm')
        } catch (e) {
            return ''
        }
    }

    const renderNotificationItem = (item: NotificationItem) => (
        <DropdownMenuItem 
            key={item.id} 
            className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-slate-50 relative"
            onClick={() => {
                if (item.onClick) item.onClick()
                if (onItemClick) onItemClick(item)
                setIsOpen(false)
            }}
        >
            <div className="flex justify-between w-full items-start">
                <div className="w-full">{item.title}</div>
            </div>
            <div className="w-full">{item.description}</div>
            <div className="text-[10px] text-slate-400 mt-1 w-full text-right">{formatTimestamp(item.timestamp)}</div>
        </DropdownMenuItem>
    )

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full relative text-slate-500 hover:text-blue-600"
                >
                    <Bell size={20} strokeWidth={2.5} />
                    {unreadItems.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px] p-0">
                <DropdownMenuLabel className="p-3 bg-slate-50 border-b">Thông báo hệ thống</DropdownMenuLabel>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-3 pt-2">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="unread" className="relative">
                                Chưa xem
                                {unreadItems.length > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                                        {unreadItems.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="read">Đã xem</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="unread" className="max-h-[300px] overflow-y-auto mt-2">
                        {unreadItems.length > 0 ? (
                            <div className="flex flex-col">
                                {unreadItems.map(renderNotificationItem)}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500">
                                Không có thông báo mới
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="read" className="max-h-[300px] overflow-y-auto mt-2">
                        {readItems.length > 0 ? (
                            <div className="flex flex-col">
                                {readItems.map(renderNotificationItem)}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500">
                                Chưa có thông báo cũ
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
