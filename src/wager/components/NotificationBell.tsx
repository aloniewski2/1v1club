import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Props {
  userId: string
}

export default function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markAllRead } = useNotifications(userId)
  const navigate = useNavigate()

  return (
    <Popover onOpenChange={(open) => { if (open && unreadCount > 0) markAllRead() }}>
      <PopoverTrigger asChild>
        <button className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-glyph">
          <Bell className="h-[19px] w-[19px]" strokeWidth={2} />
          {unreadCount > 0 && (
            <span
              className="absolute -right-px -top-px flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white"
              style={{ background: 'hsl(var(--rival))', border: '2px solid hsl(var(--background))' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-muted transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                onClick={() => { if (n.wager_id) navigate(`/wager/${n.wager_id}`) }}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
