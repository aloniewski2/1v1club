# Money Flow — Current vs. Lower-Risk

## Current build (HIGH RISK — custodial + rake)

```
USER A ──pays stake──┐
                     ├──►  PLATFORM HOLDS BOTH STAKES (wallet/escrow)
USER B ──pays stake──┘                │
                                      ▼
                        In-person match, both declare winner
                                      │
                              agree ──┴── disagree ──► admin review
                                      │
                                      ▼
                   PLATFORM PAYS WINNER pot − 5% fee  (in-app wallet)
                                      │
                                      ▼
                        WINNER CASHES OUT to bank (Stripe Connect)
```
Risk drivers: platform custody of funds, platform-managed payout, 5% rake,
wallet + withdrawals (possible money-transmission), real-money contest outcome.

## Lower-risk restructure (NON-CUSTODIAL + subscription)

```
USER A ──┐
         ├──►  PLATFORM MATCHES + provides rules/scorekeeping/dispute log
USER B ──┘                │
                          ▼
            Players agree terms; settle money DIRECTLY between themselves
                          │  (platform never holds or moves the stake)
                          ▼
              In-person match → result recorded for ranking/history
                          │
                          ▼
        PLATFORM CHARGES a subscription / access fee (NOT a cut of any stake)
```
Risk reducers: no custody of funds, no payout handling, no rake, fee not tied to
the contest. Still benefits from age-gating, anti-cheat, clear terms. Not
risk-free — counsel should still confirm it isn't "facilitating wagering" — but
materially lower exposure and far more likely to pass processors/app stores.

## Comparison

| Structure                              | Risk      | Why |
|----------------------------------------|-----------|-----|
| Matchmaking only, no funds held        | Lower     | Platform never touches stake money |
| Direct user-to-user payment off-app    | Low–Med   | Reduced platform role; may still raise wager concerns |
| Subscription instead of rake           | Lower     | Revenue not tied to contest outcome |
| App escrow + platform payout           | High      | Looks like fund handling / wager facilitation |
| App takes 5% rake from stakes          | Highest   | Strong bookmaking/operator appearance |
| Wallet + deposits + withdrawals        | Highest   | May trigger money-transmission obligations |
