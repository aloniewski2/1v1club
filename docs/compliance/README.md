# Wagerly — Compliance & Launch Packet

> **Not legal advice.** These are working templates to (a) brief a New Jersey
> gaming/payments attorney and (b) inquire honestly with payment processors.
> Nothing here authorizes real-money operation. Do not take real stakes until a
> licensed NJ attorney signs off on your specific structure.

## The honest bottom line

The legal risk in Wagerly is **structural, not cosmetic**. These four facts —
together — make it look like a regulated wagering business:

1. Two users stake real money on an uncertain 1v1 outcome.
2. The winner receives the loser's money (a pot).
3. The platform **holds and moves** the funds (wallet + escrow + payout).
4. The platform **takes 5%** of the stake (a rake).

Changing vocabulary ("challenge" not "wager", "service fee" not "rake") does
**not** change the classification. The only things that actually reduce risk are
changing the *mechanics* or getting *licensed*.

> ⚠️ Never describe the product to a processor differently than how it operates.
> Misrepresentation to get a merchant account is fraud and is the single most
> common way money-app startups get funds frozen and accounts closed.

## Two legitimate paths

### Path A — Lower-risk restructure (ship sooner)
- App is **matchmaking + scorekeeping + dispute records only**.
- App **never holds, pools, or pays out** stake money.
- **No rake.** Monetize with a subscription / access fee not tied to any match.
- Players settle between themselves, off-platform.
- Still benefits from age-gating, anti-cheat, and clear terms.
- This is the version most likely to pass Stripe and the app stores.

### Path B — Real-money model, done properly (slower, regulated)
1. **NJ gaming/payments counsel** — skill-vs-chance + money-transmitter analysis.
2. **Licensing/registration** as counsel directs (may include MTL since you hold
   funds in a wallet between stake and cashout).
3. **Processor approval in writing** — Stripe explicitly, or a gaming-specialized
   PSP (Worldpay, Sightline, PayNearMe, Trustly).
4. **Compliance build** — real KYC/AML, geofencing, hard age verification,
   deposit limits / self-exclusion, tax (1099) reporting.
5. **Launch only after written sign-off.**

## Files in this packet
- `attorney-intake-memo.md` — 1-page brief + exact questions for NJ counsel.
- `payment-processor-inquiry.md` — truthful description to send a processor.
- `money-flow.md` — current (high-risk) vs. lower-risk flow diagrams.
- `risk-checklist.md` — launch checklist across legal/payment/compliance.
- `../legal/TERMS_OF_SERVICE_DRAFT.md` — starter ToS for the skill-platform model.

## Where the current codebase sits
The repo today implements **Path B mechanics** (wallet ledger, escrow, 5% fee,
Stripe-managed payout, dispute review). That's the high-risk end. Before any
real-money launch it needs counsel + processor approval + the compliance layer.
To pivot toward **Path A**, you would disable wallet/escrow/payout/rake and keep
matchmaking, declaration, chat, and dispute records.
