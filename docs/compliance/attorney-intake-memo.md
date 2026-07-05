# Attorney Intake Memo — Wagerly (New Jersey)

> Send this to a New Jersey gaming/payments attorney. Fill the bracketed blanks.
> Keep it factual — counsel needs the real mechanics, not marketing language.

## 1. Product summary
Wagerly is a mobile/web app for **face-to-face 1v1 skill competitions** —
currently basketball 1v1 and head-to-head video gaming. Two users agree to a
match, each puts up a money stake, they compete in person, and the winner
receives the pot.

- Launch jurisdiction: **New Jersey** (users physically located in NJ).
- Format: **skill-based**, in person, no element of chance in the contest.
- Games at launch: [basketball 1v1 / specific video game titles].

## 2. Money flow (as currently built)
1. Each player pays their stake via card (Stripe) into the platform.
2. The platform **holds both stakes** (escrow / wallet ledger).
3. Players compete in person; both declare the winner in the app.
4. On agreement, the platform credits the winner's in-app **wallet** with the
   pot **minus a 5% platform fee**.
5. The winner can **cash out** the wallet balance to their bank (Stripe Connect),
   minus an instant-payout fee.
6. Disputed results go to platform/admin review.

Stakes may be **asymmetric** (e.g. Player A risks $10, Player B risks $20).

## 3. Fee model
- **5%** of the total pot, retained by the platform on each settled match.
- Plus a small instant-cashout fee on withdrawals.

## 4. Specific questions
1. Under New Jersey law, is this a **gambling/wagering** product, a **contest of
   skill**, or something else?
2. Does any **skill-contest exemption** apply to in-person 1v1 money contests?
3. Does the platform **collecting stakes and paying the winner** change the
   analysis vs. players paying each other directly?
4. Does taking a **5% rake** push this into regulated gaming / bookmaking?
5. Because we **hold user funds** in a wallet between stake and cashout, are we a
   **money transmitter** under NJ/federal law? Does that require an MTL?
6. What **licensing or registration** (if any) would let us operate the
   real-money model legally?
7. What **age threshold** should we enforce (18+ vs 21+) and what verification?
8. What **KYC/AML** obligations attach to our fund flows?
9. What **disclosures, terms, and policies** are required?
10. What must we **avoid** in product design and marketing to stay compliant?
11. If the real-money model isn't viable, what's the nearest **compliant
    structure** (e.g. non-custodial matchmaking + subscription, sponsor-funded
    prizes)?

## 5. Attachments to include
- This memo.
- `money-flow.md` (diagrams).
- App screenshots / mockups.
- The fee schedule.
- List of supported games and how a winner is determined for each.
