# Payment Processor Inquiry — Wagerly

> Send this **before** processing real volume. It describes the product
> truthfully. Do not sanitize the wagering mechanics to get approved — an
> accurate description is what protects you from later freezes/termination.

## Subject
Pre-approval inquiry: real-money skill-contest platform (NJ) — is this a
supported use case?

## Body

> Hello,
>
> I'm building **Wagerly**, a New Jersey app for in-person 1v1 skill
> competitions (basketball, head-to-head gaming). I want to confirm, **before I
> build on your platform**, whether my model is permitted under your acceptable-
> use / prohibited-business policy.
>
> **How money moves, accurately:**
> - Each of two users pays a stake by card into the platform.
> - The platform **holds both stakes** until the match is resolved.
> - The winner is determined by the players (skill-based, in person) and
>   confirmed in-app; disputes go to our review.
> - The platform credits the winner the pot **minus a 5% platform fee**, held as
>   an in-app balance.
> - Users can **withdraw** their balance to their bank.
>
> So to be direct: this involves **users staking money on a contest outcome, the
> platform holding funds, paying the winner, and taking a percentage** — i.e. it
> has the characteristics of real-money contests/wagering.
>
> My questions:
> 1. Is this use case **supported** on your platform, conditionally or at all?
> 2. If conditional, what do you require — licensing proof, KYC/AML, geo
>    restrictions, reserve, specific MCC, separate underwriting?
> 3. Are there product changes (e.g. **non-custodial**: users pay each other
>    directly and we never hold funds, monetized by subscription) that would
>    move it into a supported category?
> 4. Who handles underwriting for this category so I'm reviewed correctly up
>    front rather than flagged later?
>
> I'd rather be told "no" now than have funds frozen after launch. Thanks.

## Notes
- **Stripe**: standard accounts prohibit most gambling/real-money contests.
  Expect this to need explicit approval or a redirect to a gaming-specialized
  processor. If they say no, that answer is itself valuable — it tells you the
  custodial+rake model needs either licensing or a different PSP.
- Gaming-specialized processors to ask if Stripe declines: Worldpay, Sightline,
  PayNearMe, Trustly, Nuvei.
