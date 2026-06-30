# Wagering Risk & Launch Checklist

> Work top to bottom. Any "yes" in the **Business model / Payment** sections is a
> signal to get counsel + processor sign-off before launch.

## Business model risk
- [ ] Do users stake money (or value) on a match outcome?  *(currently: yes)*
- [ ] Does the winner receive the loser's stake?  *(currently: yes)*
- [ ] Does the platform take a % of the stake?  *(currently: yes — 5%)*
- [ ] Does the platform control the payout?  *(currently: yes)*

## Payment / custody risk
- [ ] Are funds held in the app (wallet/escrow)?  *(currently: yes)*
- [ ] Are stakes pooled by the platform?  *(currently: yes)*
- [ ] Are there wallet balances / stored value?  *(currently: yes)*
- [ ] Can users deposit and withdraw money?  *(currently: yes — cash out)*
- [ ] Has the processor approved this category **in writing**?  *(currently: no)*

## Gambling-law risk (New Jersey)
- [ ] Could the contest be viewed as a wager?
- [ ] Is the outcome uncertain at the time of staking?
- [ ] Is the contest determined purely by skill? (document why per game)
- [ ] Has NJ counsel confirmed whether a skill exemption applies?
- [ ] Has counsel ruled on money-transmitter status for the wallet?

## Compliance controls
- [ ] Hard age verification (not just self-reported DOB)?  *(currently: partial)*
- [ ] KYC / identity checks on users handling money?  *(currently: no)*
- [ ] Geolocation enforcement (allowed states/countries only)?  *(currently: no)*
- [ ] Fraud controls (duplicate accounts, collusion, device checks)?  *(partial)*
- [ ] Anti-cheat + proof integrity?  *(currently: yes — proof hashing)*
- [ ] Structured dispute process with evidence + admin review?  *(yes)*
- [ ] Deposit limits / self-exclusion / responsible-gaming resources?  *(no)*
- [ ] Tax reporting (1099s over threshold)?  *(no)*

## Platform / store risk
- [ ] Do Apple/Google real-money-gaming policies allow this model + geo?
- [ ] Does the processor's AUP allow the category?
- [ ] Does marketing avoid implying unlicensed gambling?
- [ ] Do the Terms accurately describe the product (no misrepresentation)?

## Operational readiness
- [ ] No-show handling?  *(deadline forfeit — built)*
- [ ] Evidence capture for disputes?  *(built)*
- [ ] Moderation / account suspension plan?
- [ ] Logged user acknowledgment of rules at signup?

## Go/No-Go gate
Do **not** process real stakes until **all** are true:
- [ ] NJ counsel has given a written opinion on legality + structure.
- [ ] Processor has approved the category in writing.
- [ ] Age verification + geofencing + KYC are live.
- [ ] Terms, Privacy, and responsible-gaming policies are published.
