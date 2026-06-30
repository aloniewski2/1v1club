# New Jersey Legal Research + Competitor Landscape (June 2026)

> Independent research, **not legal advice**. Statute text is summarized from
> public sources; verify exact current text with counsel. Sources at the bottom.

## TL;DR
- New Jersey's "contest of skill" safe harbor (**N.J.S.A. 5:19-1**) is **narrow**
  and does **not** cover 1v1 basketball or head-to-head gaming for money.
- NJ's gambling test (**N.J.S.A. 2C:37-1**) uses the **"material element of
  chance"** standard — stricter than the "predominance" test used by most states.
- A platform that **holds the pot and takes a 5% rake** is the single riskiest
  structure: it invites **promoting-gambling / bookmaking** exposure on top of the
  base wagering question.
- Holding user funds in a wallet → likely a **NJ money-transmitter license**
  (surety bond, NMLS, annual renewal).
- The whole industry has converged **away from Wagerly's exact model**. The apps
  that operate legally use **entry-fee → prize-pool skill tournaments on
  app-measured video games**, exclude ~8–12 states, and avoid taking a
  house cut. The most direct comparable (1v1Me, formerly Players' Lounge)
  **pivoted out of** peer-to-peer wagering.

---

## 1. The NJ "contest of skill" statute is narrower than it sounds
**N.J.S.A. 5:19-1** ("Participation in contests of skill not deemed unlawful
gambling") sounds perfect until you read the definition. It defines a "contest of
skill" as **"any baking or photography contest, and any similar contest that is
approved as a 'contest of skill' by the Attorney General, provided that the
winner... [is] selected solely on the quality of an entry... as determined by a
panel of judges using uniform criteria."** It also **excludes** anything where the
outcome "depends in a material degree upon an element of chance."

**Implication:** this is a **judged-entry** safe harbor (bake-offs, photo
contests). A 1v1 basketball game or a Madden match is **not** a "contest of skill"
under this statute, and you **cannot rely on 5:19-1** for Wagerly. (An operator
could theoretically seek AG approval for a "similar contest," but that's a
discretionary, uncertain process — not a shortcut.)

## 2. NJ's actual gambling test — "material element of chance"
**N.J.S.A. 2C:37-1**:
- **"Gambling"** = staking something of value on the outcome of a **contest of
  chance** *or* a **future contingent event not under the actor's control or
  influence**, on the understanding of receiving value for a certain outcome.
- **"Contest of chance"** = outcome depends **in a material degree** on chance,
  even if skill is also a factor.
- **"Bookmaking"** = advancing gambling by accepting bets from the public **as a
  business**.

**The skill argument (thin but real):** if a contest is *pure* skill with **no
material element of chance**, and the outcome is **under the players' control**,
there's an argument it isn't "gambling" because it's neither a contest of chance
nor an uncontrollable future event. This is the thread skill-gaming apps walk.
**But NJ's "material element" test is stricter than predominance** — even a
*non-trivial minority* of chance flips it to a contest of chance. And the
platform-side offenses (**promoting gambling**, **2C:37-2**) can attach to the
operator independent of whether players are charged.

## 3. The 5% rake is the worst single feature
Taking a percentage of others' stakes is what makes an operator look like a
**bookmaker / gambling promoter** rather than a neutral tool. Notably, the leading
comparable app advertises the **opposite**: "no odds, no house edge, no bookmaker
taking a cut against you." That phrasing is a deliberate legal posture. A rake
pushes you toward the exact characterization you want to avoid.

## 4. Holding funds = money-transmitter exposure
Under the **NJ Money Transmitters Act**, accepting funds from users and then
holding/transferring them to another party for a fee generally requires a
**license**: surety bond, NMLS registration, recordkeeping, annual renewal. The
wallet + escrow + cash-out flow Wagerly currently has is squarely in this zone.
Most skill apps avoid this by routing funds through a **licensed third-party
processor** so they never custody the money themselves.

## 5. Regulatory climate is tightening
In **2025, New Jersey** (with CA, CT, MT, NY) passed laws targeting
**sweepstakes/"casino-mimicking" money-gaming platforms**, and several states took
enforcement actions. The trend is toward *more* scrutiny of grey-area real-money
gaming, not less.

---

## Competitor landscape — how the legal ones are built

| App | Model | Key legal posture |
|-----|-------|-------------------|
| **Skillz** | Entry-fee skill **tournaments**, app-measured mobile games | Restricts cash entry in ~12 states (AZ, AR, CT, DE, IN, IA, LA, ME, MT, SC, SD, TN). NJ generally allowed. |
| **WorldWinner / Game Taco** | Entry-fee skill tournaments, casual games | Fully restricts ~8 states (AR, CT, DE, LA, MT, SC, SD, TN) + partial AZ/FL/IN/ME. |
| **GamerSaloon** | Head-to-head **video game** cash matches (Madden/2K), since 2006 | Entry-fee + cash-prize "skill game" framing; app/console-tied results. |
| **1v1Me (was Players' Lounge)** | **Started** as P2P 1v1 video-game wagering; **pivoted** to "stake pro gamers," money into a **match pool**, **"no house cut"** | Explicitly markets as **staking, not a sportsbook**; "all 50 states." The pivot itself signals the straight P2P-wager-with-rake model was fragile. |

### What the market tells you
1. **Nobody legal takes a rake against players.** They use entry fees into a prize
   pool, subscriptions, or a staking-pool model with no house edge.
2. **Skill positioning depends on app-measured results.** All the durable players
   use **video games** where the platform can verify the score — not
   self-reported real-world basketball. Self-reported IRL results make the skill
   defense weaker and fraud much higher.
3. **Everyone geo-excludes** the same ~8–12 states. NJ is generally *permitted*
   for app-measured skill contests — but that's the tournament/entry-fee model,
   not peer wagering with a cut.
4. **Funds are usually held by a licensed processor**, not the app.

---

## What this means for Wagerly
Wagerly currently combines the three riskiest elements at once:
**peer-to-peer wager + platform custody of funds + 5% rake**, and contemplates
**real-world** (self-reported) basketball. To move toward what actually operates
legally:

1. **Drop the rake.** Move to entry-fee→prize-pool or subscription. (Mirrors
   1v1Me's "no house cut" posture.)
2. **Lead with app-verifiable video games** (Madden/2K with result verification),
   not self-reported real-world sports, so the skill framing holds and fraud is
   controllable.
3. **Geo-exclude** the prohibited states from day one; gate by verified location.
4. **Don't custody funds yourself** — use a licensed processor/escrow partner, or
   pursue a NJ money-transmitter license.
5. **Do not rely on N.J.S.A. 5:19-1.** Get counsel's written read on 2C:37
   (promoting gambling) for your specific format before taking real stakes.

The honest conclusion: the **real-world 1v1 sports + rake + custody** product is
the hardest possible version to get approved. The nearest *viable* version is a
**no-rake, app-measured-skill, geo-restricted, non-custodial** contest platform —
and even that needs an NJ gaming attorney's sign-off.

## Sources
- N.J.S.A. 5:19-1 (contest of skill) — https://law.justia.com/codes/new-jersey/title-5/section-5-19-1/
- N.J.S.A. 2C:37-1 (gambling definitions) — https://law.justia.com/codes/new-jersey/title-2c/section-2c-37-1/
- NJ gambling law overview (Brownstein) — https://www.bhfs.com/insight/united-states-new-jersey-gambling-law/
- ICLG Gambling 2026 — New Jersey — https://iclg.com/practice-areas/gambling-laws-and-regulations/usa-new-jersey/
- NJ Money Transmitter licensing (NJDOBI) — https://www.nj.gov/dobi/banklicensing/formontrans.html
- Skillz legality / restricted states — https://docs.skillz.com/docs/28.0.5/legal-skillz/
- WorldWinner restricted states — https://worldwinner.zendesk.com/hc/en-us/articles/4405946046227-Restricted-States
- Walters Law Group — skill gaming states — https://www.firstamendment.com/skill-gaming-states/
- 1v1Me (staking model) — https://www.1v1me.com/
- Benzinga on 1v1Me staking pivot — https://www.benzinga.com/general/gaming/23/07/33102830/
- AGA State of the States 2026 — https://www.americangaming.org/resources/state-of-the-states-2026/
