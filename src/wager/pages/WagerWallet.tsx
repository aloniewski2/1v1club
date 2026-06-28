import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import ScreenHeader from '../components/ScreenHeader'

/** Wallet — UI only; balances are placeholders (no wallet ledger backend yet). */
const ACTIVITY = [
  { glyph: '↓', credit: true, title: 'Won vs Tyler J.', sub: 'Golf · Jun 21', amt: '+$95.00' },
  { glyph: '↑', credit: false, title: 'Stake escrowed', sub: 'Golf vs Tyler J. · Jun 19', amt: '−$50.00' },
  { glyph: '↓', credit: true, title: 'Won vs Dev R.', sub: 'Pool · Jun 18', amt: '+$38.00' },
  { glyph: '↑', credit: false, title: 'Cashed out to Visa', sub: 'Instant · Jun 12', amt: '−$200.00' },
]

export default function WagerWallet() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col">
      <ScreenHeader label="WALLET" onBack={() => navigate('/wager/profile')} />

      <div className="mt-4 rounded-[20px] px-[22px] py-[22px] text-[hsl(var(--cta-ink))]" style={{ background: 'hsl(var(--cta-bg))', boxShadow: 'var(--cta-shadow)' }}>
        <div className="font-mono text-[10px] font-bold tracking-[0.14em] opacity-75">AVAILABLE BALANCE</div>
        <div className="mt-1 font-display text-[42px] font-extrabold leading-none">$418.50</div>
        <div className="mt-3 flex gap-[18px] border-t border-white/20 pt-3.5 text-[12px] font-semibold opacity-85">
          <span><b className="opacity-100">$100</b> in escrow</span>
          <span><b className="opacity-100">+$240</b> this month</span>
        </div>
      </div>

      <div className="mt-3 flex gap-[9px]">
        <button onClick={() => navigate('/wager/cashout')} className="flex flex-1 flex-col items-center gap-[7px] rounded-[14px] border border-border bg-surface py-3.5 text-ink">
          <ArrowDown className="h-5 w-5" strokeWidth={2} />
          <span className="text-[12px] font-bold">Cash out</span>
        </button>
        <button className="flex flex-1 flex-col items-center gap-[7px] rounded-[14px] border border-border bg-surface py-3.5 text-ink">
          <ArrowUp className="h-5 w-5" strokeWidth={2} />
          <span className="text-[12px] font-bold">Add funds</span>
        </button>
      </div>

      <div className="wg-label mt-[22px]">ACTIVITY</div>
      <div className="mt-2.5 flex flex-col gap-[9px] pb-4">
        {ACTIVITY.map((t, i) => (
          <div key={i} className="flex items-center gap-3 rounded-[13px] border border-border bg-surface px-[13px] py-[11px]">
            <span
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] text-[16px] font-bold"
              style={{ background: t.credit ? 'hsl(var(--you-tint))' : 'hsl(var(--glyph-bg))', color: t.credit ? 'hsl(var(--you))' : 'hsl(var(--ink))' }}
            >
              {t.glyph}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-ink">{t.title}</div>
              <div className="mt-px text-[11px] font-medium text-muted-foreground">{t.sub}</div>
            </div>
            <div className="font-display text-sm font-extrabold tabular-nums" style={{ color: t.credit ? 'hsl(var(--win))' : 'hsl(var(--ink))' }}>{t.amt}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
