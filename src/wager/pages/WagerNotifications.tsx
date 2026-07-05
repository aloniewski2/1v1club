import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import ScreenHeader from '../components/ScreenHeader'
import { initialsOf } from '../lib/wagerUtils'
import type { Notification } from '../lib/wagerTypes'

export default function WagerNotifications() {
  const { profile } = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications(profile?.id)
  const navigate = useNavigate()

  const unread = notifications.filter((n) => !n.read)
  const read = notifications.filter((n) => n.read)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        label="NOTIFICATIONS"
        onBack={() => navigate('/')}
        right={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="text-[11px] font-semibold" style={{ color: 'hsl(var(--win))' }}>Mark read</button>
          ) : undefined
        }
      />

      {notifications.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">No notifications yet.</p>
      )}

      {unread.length > 0 && (
        <>
          <div className="wg-label mt-5">NEW</div>
          <div className="mt-2.5 flex flex-col gap-[9px]">
            {unread.map((n) => <Row key={n.id} n={n} fresh onClick={() => n.wager_id && navigate(`/${n.wager_id}`)} />)}
          </div>
        </>
      )}

      {read.length > 0 && (
        <>
          <div className="wg-label mt-[22px]">EARLIER</div>
          <div className="mt-2.5 flex flex-col gap-[9px] pb-4">
            {read.map((n) => <Row key={n.id} n={n} onClick={() => n.wager_id && navigate(`/${n.wager_id}`)} />)}
          </div>
        </>
      )}
    </div>
  )
}

function Row({ n, fresh, onClick }: { n: Notification; fresh?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-start gap-3 rounded-[14px] bg-surface px-3.5 py-3 text-left"
      style={{ border: `1px solid ${fresh ? 'hsl(var(--you))' : 'hsl(var(--border))'}` }}
    >
      <span
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
        style={{ background: 'hsl(var(--you))', opacity: fresh ? 1 : 0.7 }}
      >
        {initialsOf(n.title, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-[13px] font-semibold leading-[1.35] ${fresh ? 'text-ink' : 'text-muted-foreground'}`}>{n.title}</div>
        {n.body && <div className="mt-0.5 text-[12px] font-medium text-muted-foreground">{n.body}</div>}
        <div className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </div>
      </div>
      {fresh && <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: 'hsl(var(--you))' }} />}
    </button>
  )
}
