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

Note: Phase 2 does not yet use a real BCH market rate. The current “quote” is represented by fake Phase 2 quote metadata. Real pricing, quote locking, fallback quote handling, and real BCH amount calculation are handled in ### Phase 3 — Replace fake funding with real treasury funding

#### Goal

Connect the voucher sale flow to real BCH funding from a merchant-controlled treasury wallet, while keeping enough safety gates in place to test with small amounts of real BCH.

The core objective was to prove the full voucher loop:

merchant treasury top-up → quote lock → voucher wallet derivation → funding transaction → platform fee output → voucher receives BCH → customer sweeps voucher WIF → app detects redeemed/swept state.

#### Implementation summary

Phase 3 introduced the real funding foundation for BCH vouchers.

Completed:

- live BCH/GBP pricing through CoinGecko
- quote locking before voucher confirmation
- quote timestamp/expiry shown in confirmation and saved with voucher records
- stale quote protection/freshness window
- fresh voucher wallet/address derivation before confirmation
- voucher address and derivation index stored with voucher records
- voucher WIF export capability tested
- voucher records store WIF-ready metadata without storing the full WIF
- merchant treasury wallet created locally for MVP testing
- treasury address shown
- treasury seed backup/reveal added with warnings
- treasury seed restore/check/import flow added
- treasury top-up QR added
- treasury balance and UTXOs checked through Electrum
- read-only treasury UTXO details displayed
- UTXO-aware funding preview created before issue
- fee-output model added:
  - voucher output
  - platform fee output
  - optional buffer reserve output
  - treasury change output
- platform fee address configured and validated
- buffer reserve is tracked but not required as separate output for MVP
- transaction plan created from treasury UTXOs
- real transaction draft generated from real treasury input
- transaction draft audit added
- pre-broadcast checklist added
- global broadcast safety guard added
- guarded broadcast service added
- disabled/blocked broadcast UI gate added
- first tiny real BCH broadcast test completed successfully
- platform fee output received in platform wallet
- voucher address received BCH
- voucher WIF QR revealed from Voucher History for testing
- external BCH wallet swept voucher successfully
- voucher address later showed 0 BCH
- manual redemption status added to Voucher History
- on-chain redemption detection added
- app detected swept/redeemed state from chain

#### Fee and transaction model

The real-funding transaction shape is:

- voucher output — BCH loaded for the customer
- platform fee output — automatic fee paid to the platform wallet
- optional buffer reserve output — disabled for MVP but tracked in fee plan
- change output — remaining BCH returned to merchant treasury

Current MVP fee model:

- 10% total customer premium
- 5% platform fee output
- 3% merchant retained spread, accounting only, not separate output
- 2% buffer reserve tracked, not currently separate on-chain output

#### Safety model

Real BCH movement is protected by a global broadcast safety guard.

The app now includes:

- transaction draft check
- transaction draft audit
- pre-broadcast checklist
- broadcast gate
- guarded broadcast service
- blocked broadcast guard test

The broadcast service refuses to broadcast while the global safety guard is disabled.

For the first real test, the safety guard was temporarily enabled, one tiny funding transaction was broadcast successfully, and the guard was turned back off immediately.

#### Redemption model

A funded voucher has two key parts:

- voucher address — where BCH is loaded
- voucher WIF/private key — what the customer sweeps from the printed QR

For MVP testing:

- WIF export works
- WIF QR reveal works in Voucher History
- a BCH wallet successfully swept the voucher
- on-chain detection confirmed the voucher address was swept/empty

Important: WIF reveal in Voucher History is a development/testing tool only. In the final merchant app, WIF QR access should be limited to the receipt print/issue flow.

#### Done when

Phase 3 is complete when:

- app gets live conversion
- quote is locked before funding begins
- exact quote is stored with the voucher record
- fresh voucher wallet/address is derived
- voucher WIF export is available for receipt QR creation
- treasury wallet exists and can be topped up
- treasury balance and UTXOs are detected
- funding transaction plan is created and validated
- funding transaction draft can be generated from real UTXOs
- fee output is included in real funding calculation
- platform fee output works
- real funding transaction can be broadcast under explicit safety guard
- voucher receives BCH
- treasury change returns correctly
- customer can sweep voucher WIF
- app can detect the voucher as swept/redeemed on-chain

#### Phase 3 result

Phase 3 is functionally complete.

A full live BCH test proved:

- treasury funding transaction succeeded
- platform fee arrived
- voucher received BCH
- voucher WIF QR swept successfully
- voucher address became empty
- app detected swept/redemption status

Remaining polish items should move into later phases, including:

- merchant-friendly UI wording
- hiding developer-only panels
- cleaner receipt/print flow
- stronger production security around WIF exposure
- automatic refresh intervals
- final printer integration

### Phase 4 — Browser receipt preview

#### Goal

Create a simple browser-visible thermal-style receipt preview.

#### Done when

- the voucher receipt can be previewed
- QR and voucher information render correctly

#### Status: Completed

Phase 4 is complete.

The app now has a working browser-visible thermal-style voucher receipt preview. This preview simulates the receipt that will later be printed by a real ESC/POS thermal printer.

Completed:

- created a reusable receipt data builder:
  - `src/services/voucher-receipt.ts`
- created a reusable receipt preview component:
  - `src/components/VoucherReceiptPreview.vue`
- added local TypeScript declaration support for the QR browser import:
  - `src/types/qrcode-lib-browser.d.ts`
- added a developer/testing “Preview Receipt” button in Voucher History
- added an issue-time receipt preview popup after voucher creation
- receipt preview uses real voucher record data
- receipt preview generates a real QR code
- QR payload is the voucher WIF/private key, not the voucher address
- WIF/private key is not displayed as plain text on the receipt
- receipt includes essential customer-facing information only:
  - BCH Voucher label
  - loaded fiat value
  - BCH amount loaded
  - sweepable QR code
  - short redemption instruction
  - cash-style warning
  - voucher serial/reference
  - issue date/time
  - voucher address for verification
  - support/safety note
- receipt avoids internal/developer funding details:
  - no treasury address
  - no UTXO details
  - no platform fee breakdown
  - no merchant retained spread
  - no buffer reserve
  - no quote internals
  - no derivation index on the receipt
  - no transaction draft/audit/checklist details

#### Security note

The receipt QR contains the voucher WIF/private key.

This means the receipt behaves like a bearer cash instrument: anyone who can see, scan, photograph, or copy the QR can sweep the voucher funds.

For MVP testing, the receipt can be previewed from Voucher History and after issue. This is development-only behaviour.

In the final merchant-facing app:

- the WIF QR should only appear at issue/print time
- old receipt previews should not be freely accessible from history
- the Voucher History screen should show safe metadata only unless developer mode is enabled
- the real production flow should become:
  - merchant issues voucher
  - app prints receipt
  - customer receives printed voucher
  - WIF/private key is not repeatedly exposed in normal app screens

#### Phase 4 result

Phase 4 successfully proves the browser receipt/print-preview stage.

The app can now simulate the real voucher handover flow:

merchant enters amount → quote is locked → voucher is created → receipt preview opens → receipt contains sweepable WIF QR → voucher record is saved in history.

This provides the foundation for the later ESC/POS printer work, where the same receipt data can be converted into thermal printer output.

### Phase 5 — Add Capacitor / Android

#### Goal

Package the app for Android and test it on device.

#### Done when

- app launches on Android
- basic voucher flow works on device

#### Status: First APK milestone completed

Capacitor has been added to the project and the Android platform has been generated.

Completed so far:

- added Capacitor project shell in `src-capacitor/`
- configured Android app ID:
  - `com.konk.bchvoucher`
- configured app name:
  - `BCH Voucher`
- generated the Android project under `src-capacitor/android/`
- installed and configured Android Studio, Android SDK, emulator tools, ADB, and Java/JVM support
- created and ran a Pixel 9a emulator
- launched the BCH Voucher app successfully in the emulator
- added a simple Android-friendly development landing page with navigation to:
  - Sell BCH Voucher
  - Voucher History
  - Treasury Settings
- tested the core voucher flow in the Android emulator:
  - Sell Voucher
  - Review Voucher
  - Confirm Fake Issue
  - receipt preview opens
  - QR renders
  - voucher record appears in History
- connected a physical Pixel 9a phone using USB debugging
- launched and tested the app on the physical Pixel 9a using the development server over a private hotspot network
- confirmed the core voucher flow also works on the physical phone
- polished the Android-facing merchant UX before APK creation:
  - homepage / merchant landing screen
  - Sell Voucher page
  - voucher sale form
  - voucher confirmation dialog
  - voucher issue progress dialog
  - Treasury Wallet page
  - Voucher History page shell
  - Voucher History list/cards
  - receipt preview layout and wording
- moved many developer-heavy details behind expandable sections while keeping testing tools available
- reduced visible “fake/test” wording in the merchant flow while keeping development safety guardrails active
- added missing `ace-builds` dependency so the inherited CashStamps template editor code can build successfully
- built the Capacitor Android app successfully
- created the first debug APK:
  - `src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk`
- installed the APK directly onto the physical Pixel 9a using ADB
- confirmed the APK-installed app opens without relying on the laptop dev server
- confirmed the full voucher flow works from the APK-installed app:
  - Home
  - Sell Voucher
  - Review Voucher
  - Issue Voucher
  - receipt preview opens
  - QR renders
  - voucher record appears in History

#### Notes

The physical phone could not load the app while using public Wi-Fi because the Android dev build was trying to reach the local Quasar dev server on the laptop. Switching to a private hotspot network allowed the phone to reach the dev server and the app worked correctly.

A small first-load observation was noted: on the physical phone, homepage buttons needed a few taps immediately after first load, then behaved normally. This should be retested with a packaged APK before treating it as a real app bug.

The packaged APK was later built and installed successfully on the physical Pixel 9a. This confirmed the app can run as a self-contained installed Android app without depending on the laptop dev server.

Development safety mode remains active. Real BCH transaction broadcasting is still protected by the existing guardrails until explicitly changed in a later step.

#### Remaining Phase 5 work

- create a packaged Android debug APK
- install and test the APK directly on the physical Pixel 9a
- confirm the APK does not depend on the laptop dev server
- continue Android-focused UX and layout polish before printer integration

The main Phase 5 APK milestone is now complete. The remaining work before printer integration is optional polish, cleanup, and deciding when/how to replace development guardrails with production-safe merchant controls.

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
