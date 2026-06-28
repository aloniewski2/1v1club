/**
 * DEV-ONLY visual preview of the restyled Wagerly screens with mock data.
 * Lets the design be verified without a Supabase login. Not linked in the app;
 * remove the route in App.tsx if you don't want it shipped.
 */
import { useState } from 'react'
import { Plus, Lock, Calendar, MapPin, Pencil, Check, Link as LinkIcon, CreditCard, Play, AlertTriangle, ChevronRight, FileText, Shield, Send } from 'lucide-react'
import MatchupBar from '../components/MatchupBar'
import SportGlyph from '../components/SportGlyph'
import StatusBadge from '../components/StatusBadge'
import SportPicker from '../components/SportPicker'
import PrimaryCTA from '../components/PrimaryCTA'
import ThemeToggle from '../components/ThemeToggle'
import WagerWallet from './WagerWallet'
import WagerCashOut from './WagerCashOut'
import WagerLeaderboard from './WagerLeaderboard'
import WagerAddFriend from './WagerAddFriend'
import { cn } from '@/lib/utils'
import type { SportType } from '../lib/wagerTypes'

const SCREENS = [
  'dashboard', 'detail', 'create', 'declare', 'invite', 'payout', 'dispute', 'chat',
  'wallet', 'cashout', 'leaderboard', 'friends',
] as const
type Screen = (typeof SCREENS)[number]

export default function WagerPreview() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  return (
    <div className="min-h-screen bg-[hsl(var(--backdrop))] py-8">
      <div className="mx-auto mb-6 flex w-full max-w-[420px] flex-wrap gap-2 px-5">
        {SCREENS.map((s) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={cn(
              'rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em]',
              screen === s ? 'bg-ink text-background' : 'border border-border bg-surface text-muted-foreground'
            )}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto"><ThemeToggle /></div>
      </div>
      <div className="mx-auto w-full max-w-[420px] rounded-[24px] border border-border bg-background px-5 py-3">
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'detail' && <Detail />}
        {screen === 'create' && <Create />}
        {screen === 'declare' && <Declare />}
        {screen === 'invite' && <Invite />}
        {screen === 'payout' && <Payout />}
        {screen === 'dispute' && <Dispute />}
        {screen === 'chat' && <Chat />}
        {screen === 'wallet' && <WagerWallet />}
        {screen === 'cashout' && <WagerCashOut />}
        {screen === 'leaderboard' && <WagerLeaderboard />}
        {screen === 'friends' && <WagerAddFriend />}
      </div>
    </div>
  )
}

function Dashboard() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between pt-2">
        <div>
          <div className="font-mono text-[10px] font-bold tracking-[0.18em] text-muted-foreground">MON · JUN 26</div>
          <h1 className="mt-0.5 font-display text-[25px] font-extrabold text-ink">Evening, Marcus</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface text-ink">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            <span className="absolute -right-px -top-px flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white" style={{ background: 'hsl(var(--rival))', border: '2px solid hsl(var(--background))' }}>3</span>
          </div>
          <ThemeToggle />
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-glyph text-[15px] font-bold text-ink">MB</span>
        </div>
      </div>

      <div className="mt-5 font-mono text-[11px] font-bold tracking-[0.14em] text-muted-foreground">// LIVE NOW</div>
      <button className="mt-[9px] w-full rounded-[18px] border border-border bg-surface p-[15px] text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink">
            <SportGlyph sport="golf" size={18} />
            <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-muted-foreground">GOLF · 9 HOLES</span>
          </div>
          <StatusBadge status="active" />
        </div>
        <div className="mt-3">
          <MatchupBar height={90} seam={26} bordered={false} pot="$100"
            you={{ name: 'You', initial: 'M', sub: 'PAID' }}
            rival={{ name: 'Tyler J.', initial: 'T', sub: 'PAID' }} />
        </div>
        <div className="mt-[11px] text-[13px] font-medium text-ink/80">First to par. Loser buys dinner.</div>
      </button>

      <div className="mt-3 flex rounded-[14px] border border-border bg-surface">
        <Stat value="7–2" label="RECORD" />
        <Stat value="$340" label="IN PLAY" bordered />
        <Stat value="78%" label="WIN RATE" accent bordered />
      </div>

      <div className="mt-[18px] flex items-center justify-between">
        <span className="font-display text-[15px] font-extrabold text-ink">Your wagers</span>
        <div className="flex gap-1.5 font-mono text-[10px] font-bold tracking-[0.06em]">
          <button onClick={() => setTab('pending')} className={cn('rounded-[7px] px-2.5 py-1.5', tab === 'pending' ? 'bg-ink text-background' : 'text-muted-foreground')}>PENDING</button>
          <button onClick={() => setTab('history')} className={cn('rounded-[7px] px-2.5 py-1.5', tab === 'history' ? 'bg-ink text-background' : 'text-muted-foreground')}>HISTORY</button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-[9px]">
        <MockRow sport="chess" name="Chess" status="declaring" sub="vs Sam K. · best of three" amt="$40" />
        <MockRow sport="tennis" name="Tennis" status="awaiting_opponent" sub="Invite sent · expires in 24h" amt="$250" />
      </div>

      <div className="mt-4">
        <PrimaryCTA><Plus className="h-4 w-4" strokeWidth={2.5} />New challenge</PrimaryCTA>
      </div>
    </div>
  )
}

function MockRow({ sport, name, status, sub, amt }: { sport: SportType; name: string; status: 'declaring' | 'awaiting_opponent'; sub: string; amt: string }) {
  const lower = status === 'awaiting_opponent' ? 'var(--await)' : 'var(--rival)'
  return (
    <div className="flex w-full items-center gap-[11px] rounded-[13px] border border-border bg-surface px-[13px] py-[11px]">
      <span className="w-1 self-stretch rounded" style={{ background: 'linear-gradient(hsl(var(--you)) 0 50%, hsl(' + lower + ') 50% 100%)' }} />
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-glyph text-ink"><SportGlyph sport={sport} size={19} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-[7px]">
          <span className="text-sm font-bold text-ink">{name}</span>
          <StatusBadge status={status} className="rounded-[5px] px-1.5 py-0.5" />
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">{sub}</span>
      </span>
      <span className="font-display text-sm font-extrabold tabular-nums text-ink">{amt}</span>
    </div>
  )
}

function Stat({ value, label, accent, bordered }: { value: string; label: string; accent?: boolean; bordered?: boolean }) {
  return (
    <div className={cn('flex-1 px-3.5 py-[11px]', bordered && 'border-l border-border')}>
      <div className="text-[17px] font-bold tabular-nums" style={{ color: accent ? 'hsl(var(--win))' : 'hsl(var(--ink))' }}>{value}</div>
      <div className="mt-px font-mono text-[9px] font-bold tracking-[0.1em] text-muted-foreground">{label}</div>
    </div>
  )
}

function Detail() {
  return (
    <div className="flex flex-col">
      <div className="mt-1 flex items-center justify-between">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">‹</div>
        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground">GOLF · 9 HOLES</span>
        <StatusBadge status="active" />
      </div>
      <h1 className="mt-[18px] max-w-[300px] font-display text-[28px] font-extrabold leading-[1.1] text-ink">First to par, loser buys dinner.</h1>
      <div className="mt-[18px]">
        <MatchupBar height={112} seam={30} pot="$100"
          you={{ name: 'You', initial: 'M', sub: 'PAID $50' }}
          rival={{ name: 'Tyler J.', initial: 'T', sub: 'PAID $50' }} />
      </div>
      <div className="mt-3.5 rounded-[18px] border border-border bg-surface p-[18px]">
        <div className="flex flex-col gap-[9px] text-[13px] font-medium text-muted-foreground">
          <div className="flex justify-between"><span>Your stake</span><span className="tabular-nums text-ink">$50.00 ✓</span></div>
          <div className="flex justify-between"><span>Tyler's stake</span><span className="tabular-nums text-ink">$50.00 ✓</span></div>
          <div className="flex justify-between"><span>Platform fee (5%)</span><span className="tabular-nums text-ink">−$5.00</span></div>
          <div className="mt-0.5 flex items-center justify-between border-t border-border pt-[11px]">
            <span className="font-display text-sm font-extrabold text-ink">Winner takes</span>
            <span className="font-display text-[20px] font-extrabold tabular-nums" style={{ color: 'hsl(var(--win))' }}>$95.00</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-surface px-[11px] py-2 text-[11px] font-semibold text-ink/85"><Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />Sat Jun 28</span>
        <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-surface px-[11px] py-2 text-[11px] font-semibold text-ink/85"><MapPin className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />Pebble Creek</span>
      </div>
      <div className="mt-4">
        <PrimaryCTA>Declare the winner</PrimaryCTA>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground"><Lock className="h-3 w-3" style={{ color: 'hsl(var(--win))' }} strokeWidth={2} />Funds held securely until both confirm</div>
      </div>
    </div>
  )
}

function Create() {
  const [sport, setSport] = useState<SportType>('golf')
  const [amount, setAmount] = useState(50)
  const pot = amount * 2
  const win = (pot * 0.95).toFixed(2)
  return (
    <div className="flex flex-col">
      <div className="mt-1 flex items-center justify-between">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">‹</div>
        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground">NEW CHALLENGE</span>
        <div className="w-[34px]" />
      </div>
      <h1 className="mt-4 font-display text-[28px] font-extrabold text-ink">Set the stakes.</h1>
      <div className="wg-label mt-5">SPORT</div>
      <div className="mt-2.5"><SportPicker value={sport} onChange={setSport} /></div>
      <div className="wg-label mt-[22px]">STAKE — EACH PLAYER</div>
      <div className="mt-2.5 flex gap-2">
        {[10, 25, 50, 100].map((n) => (
          <button key={n} onClick={() => setAmount(n)} className={cn('flex-1 rounded-[12px] border py-3 text-center text-sm font-bold', amount === n ? 'border-[1.5px] border-you bg-you-tint text-you' : 'border-border bg-surface text-ink')}>${n}</button>
        ))}
      </div>
      <div className="mt-3.5 flex items-center justify-between rounded-2xl border border-border bg-surface px-[18px] py-4">
        <div><div className="wg-label tracking-[0.14em]">TOTAL POT</div><div className="mt-0.5 font-display text-[30px] font-extrabold leading-none text-ink">${pot}.00</div></div>
        <div className="text-right"><div className="wg-label tracking-[0.1em]">WINNER TAKES</div><div className="mt-0.5 font-display text-[22px] font-extrabold" style={{ color: 'hsl(var(--win))' }}>${win}</div><div className="mt-px text-[10px] font-medium text-muted-foreground">after 5% fee</div></div>
      </div>
      <div className="wg-label mt-[22px]">THE BET</div>
      <div className="mt-2.5 flex items-center justify-between gap-2.5 rounded-[13px] border border-border bg-surface px-3.5 py-3">
        <span className="text-sm font-medium text-ink">First to par, loser buys dinner.</span>
        <Pencil className="h-[15px] w-[15px] shrink-0 text-muted-foreground" strokeWidth={2} />
      </div>
      <div className="wg-label mt-[22px]">OPPONENT</div>
      <div className="mt-2.5 flex items-center gap-3 rounded-[13px] border-[1.5px] border-you bg-you-tint px-3.5 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-you text-white"><LinkIcon className="h-[18px] w-[18px]" strokeWidth={2} /></span>
        <div className="flex-1"><div className="text-[13px] font-bold text-ink">Invite by link</div><div className="mt-px text-[11px] font-medium text-muted-foreground">Anyone with the link can accept</div></div>
        <Check className="h-[18px] w-[18px] text-you" strokeWidth={2.5} />
      </div>
      <div className="mt-5"><PrimaryCTA>Create &amp; get invite link</PrimaryCTA></div>
    </div>
  )
}

function Declare() {
  const [pick, setPick] = useState<'you' | 'rival' | null>(null)
  return (
    <div className="flex flex-col">
      <div className="mt-1 flex items-center justify-between">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">‹</div>
        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground">DECLARE RESULT</span>
        <div className="w-[34px]" />
      </div>
      <h1 className="mt-[18px] font-display text-[30px] font-extrabold text-ink">Who won?</h1>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">Tap the winner. Tyler confirms too — if you disagree, it goes to review.</p>
      <div className="mt-[22px] flex gap-3">
        <DeclareCard side="you" name="You" initial="M" selected={pick === 'you'} onClick={() => setPick('you')} />
        <DeclareCard side="rival" name="Tyler J." initial="T" selected={pick === 'rival'} onClick={() => setPick('rival')} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-[16px] border border-border bg-surface px-[18px] py-4">
        <span className="text-[13px] font-semibold text-muted-foreground">Winner of the $100 pot takes</span>
        <span className="font-display text-[22px] font-extrabold" style={{ color: 'hsl(var(--win))' }}>$95.00</span>
      </div>
      <div className="mt-4"><PrimaryCTA disabled={!pick}>Confirm result</PrimaryCTA></div>
    </div>
  )
}

function DeclareCard({ side, name, initial, selected, onClick }: { side: 'you' | 'rival'; name: string; initial: string; selected: boolean; onClick: () => void }) {
  const color = side === 'you' ? 'var(--you)' : 'var(--rival)'
  const tint = side === 'you' ? 'var(--you-tint)' : 'var(--rival-tint)'
  return (
    <button onClick={onClick} className="flex flex-1 flex-col items-center gap-2.5 rounded-[18px] border p-[22px]"
      style={{ borderColor: selected ? `hsl(${color})` : 'hsl(var(--border))', borderWidth: selected ? 2 : 1, background: selected ? `hsl(${tint})` : 'hsl(var(--surface))' }}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full text-[22px] font-bold text-white" style={{ background: `hsl(${color})` }}>{initial}</span>
      <span className="text-[15px] font-bold text-ink">{name}</span>
      <span className="font-mono text-[9px] font-bold tracking-[0.08em]" style={{ color: `hsl(${color})` }}>{selected ? 'WINNER ✓' : 'TAP TO PICK'}</span>
    </button>
  )
}

function PreviewHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="mt-1 flex items-center justify-between">
      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">‹</div>
      <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-muted-foreground">{label}</span>
      {right ?? <div className="w-[34px]" />}
    </div>
  )
}

function Invite() {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex flex-col">
      <PreviewHeader label="INVITE" />
      <div className="mt-[22px] text-center">
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-you-tint"><Check className="h-[30px] w-[30px] text-you" strokeWidth={2.5} /></div>
        <h1 className="mt-3.5 font-display text-[26px] font-extrabold text-ink">Challenge is live</h1>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">Golf · 9 holes · $100 pot · winner takes $95.00</p>
      </div>
      <div className="mt-[22px]">
        <MatchupBar height={96} seam={28} pot="$100" you={{ name: 'You', initial: 'M', sub: 'PAID $50' }} rival={{ name: 'Pending', initial: '?', sub: 'NOT JOINED' }} rivalPending />
      </div>
      <div className="wg-label mt-[22px]">SHARE LINK</div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-[13px] border border-border bg-surface py-2 pl-3.5 pr-2">
        <span className="flex-1 truncate font-mono text-[13px] font-semibold text-ink">wagerly.gg/j/9F2K-A7</span>
        <button onClick={() => setCopied(true)} className="shrink-0 rounded-[9px] px-3.5 py-2.5 text-xs font-bold text-[hsl(var(--cta-ink))]" style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}>{copied ? 'Copied ✓' : 'Copy'}</button>
      </div>
      <div className="mt-4 flex items-center gap-2 px-0.5">
        <span className="h-2 w-2 rounded-full bg-await [animation:wgpulse_1.6s_ease-in-out_infinite]" />
        <span className="text-[12px] font-medium text-muted-foreground">Waiting for your opponent to accept…</span>
      </div>
      <div className="mt-6"><PrimaryCTA><Play className="h-[15px] w-[15px]" fill="currentColor" strokeWidth={0} />Go to challenge</PrimaryCTA></div>
    </div>
  )
}

function Payout() {
  return (
    <div className="flex flex-col">
      <div className="mt-[30px] text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full opacity-[.16]" style={{ background: 'hsl(var(--win))' }} />
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full" style={{ background: 'hsl(var(--pot-bg))', color: 'hsl(var(--pot-ink))', boxShadow: 'var(--pot-shadow)', border: '3px solid hsl(var(--pot-border))' }}>
            <div className="font-display text-[22px] font-extrabold leading-none">$95</div>
            <div className="font-mono text-[7px] font-bold tracking-[0.14em]" style={{ color: 'hsl(var(--pot-sub))' }}>WON</div>
          </div>
        </div>
        <h1 className="mt-[18px] font-display text-[32px] font-extrabold text-ink">You won.</h1>
        <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">You beat Tyler J. at golf · pot released instantly</p>
      </div>
      <div className="mt-6">
        <MatchupBar height={96} seam={28} pot="$100" you={{ name: 'You', initial: 'M', sub: 'WON $95', opacity: 1 }} rival={{ name: 'Tyler J.', initial: 'T', sub: 'LOST', opacity: 0.45 }} />
      </div>
      <div className="mt-3.5 rounded-[18px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-glyph text-ink"><CreditCard className="h-5 w-5" strokeWidth={2} /></span>
            <div><div className="text-[13px] font-bold text-ink">Paid to your account</div><div className="text-[11px] font-medium text-muted-foreground">Visa •••• 4242 · instant</div></div>
          </div>
          <div className="font-display text-[20px] font-extrabold" style={{ color: 'hsl(var(--win))' }}>+$95.00</div>
        </div>
      </div>
      <div className="mt-6"><PrimaryCTA>Back to home</PrimaryCTA></div>
    </div>
  )
}

function Dispute() {
  return (
    <div className="flex flex-col">
      <PreviewHeader label="UNDER REVIEW" />
      <div className="mt-[22px] text-center">
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-[16px]" style={{ background: 'hsl(var(--amber-bg) / 0.16)' }}><AlertTriangle className="h-[30px] w-[30px]" style={{ color: 'hsl(var(--amber))' }} strokeWidth={2} /></div>
        <h1 className="mt-3.5 font-display text-[26px] font-extrabold text-ink">Results don't match</h1>
        <p className="mx-auto mt-1.5 max-w-[280px] text-[13px] font-medium text-muted-foreground">You both claimed the win. The pot is frozen until it's sorted.</p>
      </div>
      <div className="mt-[22px] flex gap-2.5">
        {(['you', 'rival'] as const).map((side) => {
          const color = side === 'you' ? 'var(--you)' : 'var(--rival)'
          const tint = side === 'you' ? 'var(--you-tint)' : 'var(--rival-tint)'
          return (
            <div key={side} className="flex-1 rounded-[14px] border p-3.5 text-center" style={{ borderColor: `hsl(${color})`, background: `hsl(${tint})` }}>
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-bold text-white" style={{ background: `hsl(${color})` }}>{side === 'you' ? 'M' : 'T'}</span>
              <div className="mt-2 text-[12px] font-bold text-ink">{side === 'you' ? 'You said' : 'Tyler said'}</div>
              <div className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.06em]" style={{ color: `hsl(${color})` }}>I WON</div>
            </div>
          )
        })}
      </div>
      <div className="wg-label mt-[22px]">HOW TO RESOLVE</div>
      <div className="mt-2.5 flex flex-col gap-[9px]">
        {[{ icon: <FileText className="h-[17px] w-[17px]" strokeWidth={2} />, t: 'Add evidence', s: 'Scorecard photo or witness' }, { icon: <Shield className="h-[17px] w-[17px]" strokeWidth={2} />, t: 'Wagerly review', s: 'A mod decides within 24h' }].map((r) => (
          <div key={r.t} className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-3.5 py-3">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-glyph text-ink">{r.icon}</span>
            <div className="flex-1"><div className="text-[13px] font-bold text-ink">{r.t}</div><div className="mt-px text-[11px] font-medium text-muted-foreground">{r.s}</div></div>
            <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" />
          </div>
        ))}
      </div>
      <div className="mt-6"><PrimaryCTA>Submit to review</PrimaryCTA></div>
    </div>
  )
}

function Chat() {
  const msgs = [
    { who: 'them', text: "You sure about this? I've been practicing 🏌️" },
    { who: 'me', text: 'Practicing losing, maybe' },
    { who: 'them', text: 'Bold words for $50 on the line' },
    { who: 'me', text: "Loser buys dinner too, don't forget" },
    { who: 'them', text: 'hope you brought your wallet 😏' },
  ]
  return (
    <div className="flex h-[640px] flex-col">
      <div className="-mx-5 flex items-center gap-3 border-b border-border px-5 pb-3 pt-1">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink">‹</div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: 'hsl(var(--rival))' }}>T</span>
        <div className="flex-1"><div className="text-sm font-bold text-ink">Tyler J.</div><div className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">GOLF · $100 POT · LIVE</div></div>
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border border-border bg-surface text-ink"><SportGlyph sport="golf" size={17} /></span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-4">
        <div className="mb-0.5 text-center font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">WAGER ACCEPTED · $50 EACH</div>
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex', m.who === 'me' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[76%] px-3.5 py-2.5 text-[13px] font-medium leading-[1.4]', m.who === 'me' ? 'text-white' : 'border border-border text-ink')} style={{ background: m.who === 'me' ? 'hsl(var(--you))' : 'hsl(var(--surface))', borderRadius: m.who === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px' }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="-mx-5 flex items-center gap-2.5 border-t border-border px-5 pb-2 pt-3">
        <div className="flex-1 rounded-[20px] border border-border bg-surface px-4 py-3 text-[13px] font-medium text-muted-foreground">Send a message…</div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-[hsl(var(--cta-ink))]" style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}><Send className="h-[18px] w-[18px]" strokeWidth={2} /></span>
      </div>
    </div>
  )
}
