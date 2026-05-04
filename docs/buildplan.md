# BCH Voucher App MVP Build Plan

---

### CashStamps Fork → Android Packaging → Thermal Printer Voucher Printing

## Purpose

This document defines the build plan for creating the first working MVP of a BCH voucher top-up app by forking and modifying CashStamps rather than rewriting from scratch.

The goal is to get a real working prototype up and running as quickly and efficiently as possible, while keeping the project understandable for a developer who is new to Vue.

This MVP will allow a shopkeeper to:

1. Enter a fiat amount such as £100
2. Generate a fresh BCH voucher
3. Fund that voucher from a treasury wallet
4. Print the voucher on a thermal receipt printer
5. Hand the printed voucher to the customer
6. Let the customer scan/redeem the BCH using their wallet

---

## 1. Core Recommendation

#### Recommended approach

For speed, the best route is:

- Fork CashStamps
- Keep its existing Quasar + Vue + TypeScript structure
- Modify the current voucher logic to fit the shop cashier flow
- Get the new logic working in the browser first
- Then package it for Android using Capacitor
- Then add a native ESC/POS thermal printer bridge

### Why this route is best

This is faster than starting over in React Native because CashStamps already contains much of the BCH-related logic needed for the app, including:

- wallet generation
- BCH address handling
- funding-related logic
- price/oracle integration
- Electrum integration
- voucher data compilation
- redeem/reclaim-style flows

The main work is not creating BCH voucher logic from nothing.
The main work is:

- replacing the current CashStamps funding flow
- replacing the current browser print/template flow
- introducing a shop sale flow
- introducing thermal printer support

---

## 2. Important Correction About CashStamps

### What the current public repo appears to contain

The current public CashStamps repository appears to be a:

- Quasar
- Vue 3
- TypeScript
- Vite
- PWA-oriented web app

It has a src-pwa folder, but it does not appear to already contain a ready-made Capacitor mobile project folder.

### What this means

This means we are not simply opening the current app as an Android app.

Instead, the plan is:

- Fork the repo
- Keep the existing BCH/web logic
- Add Capacitor mode later
- Create Android packaging from that point onward

So the mobile packaging phase is still straightforward, but it is a later step, not something already fully present in the repo.

---

## 3. MVP Scope

### What the first MVP must do

The first version should do only the essentials:

1. Cashier enters a GBP amount
2. App calculates the BCH amount
3. App derives a fresh voucher wallet/address
4. App funds that address from the shop treasury wallet
5. App confirms the funding transaction
6. App prints a 58mm receipt with voucher QR code
7. Customer scans and redeems/sweeps the BCH
8. App stores the sale locally for history and recovery

### What is intentionally postponed

The first MVP should not try to solve everything.

The following are postponed until later:

- multi-outlet support
- user accounts
- remote dashboards
- fleet printer management
- advanced reporting
- full production-grade security hardening
- large-scale printer compatibility
- full React Native rewrite

The goal is to prove the complete voucher flow end to end with the least wasted effort.

---

## 4. High-Level App Flow

### Intended cashier flow

1. Customer asks to buy a BCH voucher
2. Shopkeeper enters the fiat amount
3. App calculates BCH equivalent
4. App derives a fresh voucher wallet
5. App funds the voucher from treasury funds
6. App waits for success/funding detection
7. App prints the voucher receipt
8. Customer scans the QR and redeems/sweeps the BCH
9. App stores the sale record

This is similar in spirit to old mobile top-up systems, where the retailer activates value and prints a redeemable receipt.

---

## 5. Recommended Tech Stack

### For the MVP

Use:

- CashStamps fork
- Quasar
- Vue 3
- TypeScript
- Existing CashStamps BCH logic
- Capacitor later for Android
- Native Android printer bridge later
- ESC/POS-compatible test printer

### Why not React Native first

React Native is still a valid future path, especially because of prior React experience.

However, for the first MVP it would slow the build down because it would require:

- rewriting the UI
- porting the logic
- re-solving Android integration
- re-solving printer integration
- learning and debugging several new pieces at once

For MVP speed, adapting CashStamps is the better choice.

---

## 6. Main Architectural Principle

### Reuse the BCH core, replace the user flow

The BCH-specific logic already gives us a head start.

So the strategy is:

#### Keep and reuse where possible

- wallet derivation logic
- address handling
- transaction-related utility logic
- oracle/price logic
- Electrum integration
- redeem/reclaim patterns
- local persistence ideas

#### Replace or redesign

- current invoice/funding UI flow
- collection/stamp-oriented UI
- current browser-print/iframe print flow
- current user journey
- current storage model for cashier sales
- printer output logic

This lets us move fast without carrying over the wrong UX.

---

## 7. Target Repo Structure

The current CashStamps structure should be preserved where possible so the project remains understandable and aligned with the existing app.

### Target Structure

src/
pages/
SellVoucherPage.vue
VoucherHistoryPage.vue
PrinterSettingsPage.vue
ReclaimVoucherPage.vue

components/
VoucherSaleForm.vue
SaleConfirmDialog.vue
IssueProgressDialog.vue
VoucherReceiptPreview.vue
PrinterStatusChip.vue
VoucherHistoryList.vue

services/
app.ts
voucher-store.ts
voucher-issuer.ts
treasury.ts
printer.ts
reclaim.ts

utils/
wallet-hd.ts
wallet-p2pkh.ts
transaction.ts
satoshis.ts
escpos-receipt.ts

types/
voucher.ts
printer.ts
treasury.ts

### Notes

- Existing CashStamps files should be reused wherever appropriate
- New cashier/voucher-specific files should be added beside them
- Android packaging later will add:

src-capacitor/

---

## 8. Screen and UX Plan

### Primary screen: Sell Voucher

This becomes the main working screen for the shopkeeper.

#### It should include:

- fiat amount input
- currency display, initially GBP
- live BCH amount preview
- treasury wallet status
- printer status
- issue button

#### Confirmation dialog

Before the app funds the voucher, show a confirmation dialog including:

- fiat amount received
- BCH amount to load
- estimated fee if needed
- final summary
- confirm button

#### Processing dialog

Once confirmed, the app should show a progress dialog with states such as:

- deriving fresh wallet
- building transaction
- broadcasting transaction
- waiting for detection
- preparing receipt
- printing

#### Success screen

After printing succeeds, show:

- voucher reference
- fiat amount
- BCH amount
- print success
- done button
- optional reprint action with warning

#### History screen

History is important even in MVP because shops need traceability.

Each record should show:

- reference number
- fiat amount
- BCH amount
- date/time
- current status
- reprint action
- reclaim action when appropriate

--

## 9. Voucher Data Model

### Recommended design principle

For the MVP, it is better not to store lots of raw WIF secrets all over the app if avoidable.

A better structure is:

- store one shop master mnemonic
- derive fresh child wallets for each voucher
- store the derivation index
- re-derive the private key/WIF only when necessary

This keeps the model cleaner and better aligned with wallet-based architecture.

#### Suggested voucher record

export interface VoucherRecord {
id: string;
serial: string;
createdAt: string;
updatedAt: string;

fiatCurrency: 'GBP';
fiatAmountMinor: number; // e.g. 10000 = £100.00
bchSats: number;

derivationIndex: number;
address: string;

fundingTxid?: string;
fundingDetectedAt?: string;

printedAt?: string;
redeemedAt?: string;
reclaimedAt?: string;

status:
| 'draft'
| 'funding'
| 'funded'
| 'printed'
| 'redeemed'
| 'reclaimed'
| 'error';

printerJobId?: string;
errorMessage?: string;
}

### Why this is useful

This gives us:

- a clear audit trail
- recoverability
- reprint tracking
- reclaim support
- room for later hardening

---

## 10. Treasury Funding Flow

### Current CashStamps behaviour

CashStamps currently appears to use a funding flow built around invoice/payment logic.

That is not the correct UX for the shop model.

### New flow required for this project

The new flow should be:

- cashier enters fiat amount
- app gets BCH rate
- app calculates sats to load
- app reserves the next derivation index
- app derives a fresh voucher wallet/address
- app builds a treasury funding transaction
- app broadcasts the transaction
- app waits for detection through Electrum or wallet balance change
- app marks the voucher as funded
- app prints the receipt
- app marks the voucher as printed

### Service responsibilities

voucher-issuer.ts
Coordinates the full issue flow.

treasury.ts
Handles treasury wallet funding logic and broadcasting.

voucher-store.ts
Stores voucher records and updates statuses.

printer.ts
Handles the printing stage once the voucher is funded.

---

## 11. Redeem Model for MVP

#### Recommendation

For the first version, do not overcomplicate the redeem process.
Instead of trying to guarantee that every BCH wallet can directly interpret every printed QR perfectly from day one, use a simpler and more controlled approach.

#### Best MVP redeem approach

Print a QR that points to a redeem route in your forked application.
That redeem route can then:

- decode the voucher data
- present the redeem logic
- hand off appropriately to supported BCH wallets

#### Why this is better for MVP

This is easier and more controlled than promising full universal direct wallet sweep support immediately.
Later, direct wallet-first payloads can be explored once the rest of the system works.

---

## 12. Printer Architecture

### Why printer support needs its own abstraction

CashStamps currently appears to use browser-based preview and print behaviour.
That is useful for browser testing, but it is not suitable as the final voucher print flow for a thermal printer in a shop.

So printer support should be abstracted behind a dedicated interface.

#### Recommended printer abstraction

export interface PrinterAdapter {
testPrint(): Promise<void>;
printVoucherReceipt(voucher: VoucherRecord, opts?: PrintOptions): Promise<void>;
}

#### Planned implementations

- WebPreviewPrinterAdapter
  Used during early browser development.
  Prints a simple HTML preview or browser-friendly receipt.

- AndroidEscPosPrinterAdapter
  Used later in Android builds.
  Calls into a native Android bridge/plugin to print to the thermal printer.

- MockPrinterAdapter
  Useful in early development before real hardware is connected.

---

## 13. Receipt Format

### Recommended MVP receipt format

The first receipt should be designed for a standard 58mm thermal receipt printer.

It should include:

- shop/app title
- “BCH Voucher”
- serial/reference number
- fiat amount paid
- BCH amount loaded
- date/time
- QR code
- short redeem instructions
- warning such as “treat like cash”

#### Why keep it simple

This is enough to test the real-world flow while avoiding layout complexity too early.

---

## 14. ESC/POS Strategy

### General plan

The printing layer will eventually need to send printer-ready output to a thermal printer.

The practical routes are:

- native QR print commands
- raster/image printing
- text plus printer formatting commands

Important practical reality

Not all cheap printers behave identically.
Even if they claim ESC/POS support, their implementations can differ.

So the real goal for MVP is not “support every printer.”

The real goal is:

- choose one known compatible printer
- make that one printer work reliably
- refine the print layer from there

---

## 15. Android Packaging Plan

## Packaging sequence

Android packaging should only happen after the browser-side voucher flow is working.

The general plan is:

1. fork and run the app locally
2. implement the new voucher flow in the browser
3. implement browser test printing
4. add Capacitor mode
5. run the app on Android
6. add native printer integration

#### Why this order is better

This isolates the difficult pieces.
If Android and printer work start too early, debugging becomes much harder because several layers can fail at once.

---

## 16. First Files to Keep, Inspect, and Reuse

These existing files should be treated as important reference points in the current codebase:

- src/pages/CreatePage.vue
- src/components/FundingDialog.vue
- src/components/CollectionPreviewComponent.vue
- src/services/app.ts

#### Why these matter

They likely show:

- how the app starts
- how funding currently works
- how preview/print data is currently assembled
- how services are initialized

These files are not the final cashier flow, but they are key to understanding what can be reused.

---

## 17. First Files to Create

### First batch

Create these first:

- src/types/voucher.ts
- src/services/voucher-store.ts
- src/services/voucher-issuer.ts
- src/pages/SellVoucherPage.vue
- src/components/VoucherSaleForm.vue
- src/components/SaleConfirmDialog.vue
- src/components/IssueProgressDialog.vue

### Second batch

Then:

- src/pages/VoucherHistoryPage.vue
- src/components/VoucherHistoryList.vue
- src/services/reclaim.ts

### Third batch

Then:

- src/pages/PrinterSettingsPage.vue
- src/services/printer.ts
- src/components/PrinterStatusChip.vue

### Later, when Android begins

- src-capacitor/
- native Android printer integration files
- Android printer bridge/plugin code

---

## 18. Build Phases

### Phase 0 — Fork and run CashStamps

#### Goal

Get the current CashStamps project running locally.

#### Done when

- the app runs locally
- the main pages/components are visible
- the repo structure is understood

#### Done

- fork created
- repo cloned locally
- upstream remote added
- dependencies installed using `--legacy-peer-deps`
- app runs locally at `http://localhost:9000/`
- working branch created: `bch-voucher-mvp`
- build plan committed in `docs/buildplan.md`
- dependency setup committed

---

### Phase 1 — Add voucher types and local store

#### Goal

Create the voucher data model and local persistence layer.

#### Additional implementation notes

- Add fee-related fields to the voucher model from the start so later pricing logic does not require a refactor.
- Add pricing-related fields to the voucher model so each sale can store:
  - market rate used
  - fee type
  - fee percentage / basis points
  - fee amount
  - final BCH amount loaded
  - quote timestamp
  - quote source
- Design the pricing layer so it can support multiple providers later, for example:
  - General Protocols Oracles where supported
  - CoinGecko for GBP or other unsupported currencies
- Store the last known good quote locally with timestamp so it can later be used as a controlled fallback.
- Store enough quote metadata so the exact rate used for each voucher can always be audited later.

#### Done when

- voucher records can be created locally
- history records can be listed
- fee-related fields to the type/model added
- pricing-related fields to the type/model added
- quote metadata can be stored with each voucher record
- last known good quote can be stored locally for later fallback use

#### Status: Completed

---

### Phase 2 — Build Sell Voucher page with fake funding

#### Goal

Create the new cashier flow without real blockchain funding yet.

#### Additional implementation notes

- Build the pricing flow in a way that can later support:
  - live quote fetching
  - cached fallback quote usage
  - quote expiry / lock timing
- Add the fee to the confirm screen as part of the visible pricing breakdown.
- Show the merchant exactly what rate is being used for the draft sale.
- Show the quote timestamp and prepare the UI so a quote lock / expiry time can be displayed later.
- Design the UX so the merchant sees only clean states, for example:
  - ready to issue
  - quote locked
  - pricing temporarily unavailable
- Do not design the UX around mid-sale failures. If pricing is unavailable, the sale should be blocked before any funding attempt begins.

#### Done when

- cashier can enter an amount
- the app creates a draft voucher
- fee on the confirm screen displayed
- a fake issue flow works from start to finish
- the confirm screen shows the rate being used
- the confirm screen is structured to support quote timestamp / expiry display
- the pricing flow is structured to support fallback logic later without redesigning the UI

#### Status: complete

Phase 2 is complete.

The app now has a working fake cashier flow:

- cashier can enter a GBP amount
- app shows a placeholder pricing breakdown
- app shows a 10% placeholder service fee
- confirmation dialog appears before issuing
- fake issue progress dialog simulates the future issue flow
- voucher record is saved locally
- voucher is marked as `funded` for Phase 2 simulation purposes
- success panel appears after issue
- voucher appears in history
- fee details appear in history

Note: Phase 2 does not yet use a real BCH market rate. The current “quote” is represented by fake Phase 2 quote metadata. Real pricing, quote locking, fallback quote handling, and real BCH amount calculation are handled in Phase 3.

---

### Phase 3 — Replace fake funding with real treasury funding

#### Goal

Connect real BCH funding logic.

#### Additional implementation notes

- Introduce a pricing provider layer before real funding begins.
- Use General Protocols Oracles where available.
- Use CoinGecko for GBP or any other unsupported currency if required.
- Lock a quote before broadcasting any funding transaction.
- Only allow a cached fallback quote to be used if it is still within a strict freshness window.
- If no valid quote is available, do not broadcast a transaction. Instead, block issuance cleanly and show that pricing is temporarily unavailable.
- Store the exact quote used for the sale so the funding and receipt history can always be reconciled later.
- Ensure the sale flow is atomic from the merchant's point of view:
  - quote locked
  - derive wallet
  - build transaction
  - broadcast
  - detect funded state
  - print
- If broadcast result is uncertain, reconcile using transaction ID and Electrum/address status before showing a final result to the merchant.

#### Done when

- app gets live conversion
- fresh voucher wallet is derived
- funding transaction is broadcast
- funded state is detected successfully
- fee is added to real funding calculation
- pricing provider layer is in place
- GBP pricing is supported through the selected pricing provider
- quote is locked before funding begins
- stale cached quotes are rejected outside the allowed freshness window
- no funding transaction is broadcast unless a valid quote is available
- the exact quote used is stored with the voucher record
- treasury funding transaction plan is created and validated before signing/broadcasting
- voucher WIF/private-key export structure is prepared for future sweepable QR printing

#### Current Phase 3 progress note

Phase 3 has now reached the treasury funding dry-run stage.

Completed so far:

- real BCH/GBP pricing is fetched through CoinGecko
- quotes are locked before voucher confirmation
- quote timestamp and expiry are shown in the confirmation dialog and history
- service fee and estimated BCH loaded are calculated from the locked quote
- fresh voucher addresses are derived before confirmation
- voucher address and derivation index are stored with each voucher record
- merchant treasury wallet setup exists
- treasury address is generated and stored locally for MVP testing
- treasury balance can be checked through Electrum
- read-only treasury UTXO details are displayed
- dry-run funding preview is shown before fake issue
- dry-run preview uses actual treasury UTXO details where available
- dry-run preview is saved with the voucher record
- voucher history displays the saved funding preview details

Important: this stage is still read-only / fake-funding only.

No real transaction is currently built, signed, or broadcast. No BCH is moved yet.

#### Fee address configuration note

The treasury funding model now assumes merchant-controlled treasury funding.

The intended real-funding transaction shape is:

- voucher output — BCH loaded for the customer
- platform fee output — automatic fee paid to the platform wallet
- optional buffer reserve output — reserve/buffer wallet if used
- change output — remaining BCH returned to the merchant treasury wallet

Current implementation status:

- platform fee calculation model exists
- merchant retained spread calculation exists
- buffer reserve calculation exists
- fee-output plan is shown during voucher confirmation
- fee-output plan is saved with the voucher record
- Treasury Settings shows fee address configuration status
- real funding is blocked/not ready while required fee addresses are blank

Important: no real transaction is currently built, signed, or broadcast.

### Phase 4 — Browser receipt preview

#### Goal

Create a simple browser-visible thermal-style receipt preview.

#### Done when

- the voucher receipt can be previewed
- QR and voucher information render correctly

### Phase 5 — Add Capacitor / Android

#### Goal

Package the app for Android and test it on device.

#### Done when

- app launches on Android
- basic voucher flow works on device

### Phase 6 — Add native printer bridge

#### Goal

Connect one chosen ESC/POS-compatible thermal printer.

#### Done when

- printer test works
- voucher receipt prints reliably from device

### Phase 7 — Hardening

#### Goal

Reduce mistakes and improve reliability.

#### Additional Implementation Notes

- Review and clean up inherited dependency warnings from the original CashStamps repo.
- Investigate and fix the Quasar/Vite warning shown during `npm run dev`:
  - `invalid Vite plugin specified: undefined`
- Review security warnings from `npm audit`.
- Upgrade vulnerable dependencies carefully, avoiding broad `npm audit fix --force` changes unless each breaking change is understood.
- Confirm the app still builds and runs after dependency cleanup.

#### Done when

- duplicate print handling exists
- reclaim flow works
- error states are improved
- operator warnings exist
- inherited dependency warnings have been reviewed
- critical dependency/security issues have been assessed and fixed where practical
- the Quasar/Vite plugin warning has been investigated and resolved or documented
- the app still runs after dependency cleanup

---

## 19. Security and Operational Warning

### Important truth about printed BCH vouchers

A printed BCH voucher that contains spend authority behaves like a bearer instrument.

That means:

- whoever gets the secret first can potentially redeem it
- accidental duplicate printing matters
- screenshots matter
- logs matter
- debug output matters
- printer spool history may matter
- careless staff behaviour may matter

### What this means for MVP

For early testing, this is acceptable.
For production, it will need additional safety rules and operational controls.

This is one of the most important things to keep in mind as the project grows.

---

## 20. Practical Development Strategy

### Best way to move through the build

The smartest first milestone is:

- fork the repo
- get it running
- add the voucher record type
- build the Sell Voucher page
- make the fake issue flow work in the browser first

### Why this first milestone matters

It lets us:

- make visible progress quickly
- learn the structure of the app
- reduce Vue learning pressure
- validate the new UX
- prepare the codebase for real funding later

This is much safer and faster than trying to solve Android and printer hardware from day one.

---

## 21. Final Direction

### Recommended path forward

The project should proceed in this order:

1. Fork CashStamps
2. Understand the existing structure
3. Build the new cashier flow
4. Add local voucher records
5. Simulate voucher issuing
6. Integrate real BCH treasury funding
7. Create thermal-style receipt preview
8. Package for Android
9. Add native printer bridge
10. Harden the app

### Overall conclusion

This project is realistic.

The BCH logic is reusable enough that a first MVP can be built efficiently by adapting CashStamps.

The critical rule is to stay disciplined:

- keep the first version narrow
- do not rewrite too early
- do not support every printer too early
- prove the complete end-to-end voucher flow first
