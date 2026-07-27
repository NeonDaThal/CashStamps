const svSE = {
  common: {
    appName: 'BCH-värdekodskrivare',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'BCH-värdekod',
    continue: 'Fortsätt',
    cancel: 'Avbryt',
    confirm: 'Bekräfta',
    close: 'Stäng',
    back: 'Tillbaka',
    done: 'Klart',
    loading: 'Laddar...',
    error: 'Fel',
    success: 'Klart',
    warning: 'Varning',
    yes: 'Ja',
    no: 'Nej',
  },

  language: {
    label: 'Språk',
    english: 'English',
    spanish: 'Español',
    german: 'Deutsch',
    portuguese: 'Português',
    cantonese: '中文（香港）',
    nepali: 'नेपाली',
    swedish: 'Svenska',
    swahili: 'Kiswahili',
  },

  home: {
    eyebrow: 'Handlarapp för värdekoder',
    title: 'Bitcoin Cash-laddning',
    intro:
      'Sälj Bitcoin Cash-värdekoder i butik, skriv ut ett kvitto och låt kunden föra över BCH till sin egen plånbok.',
    actionTitle: 'Vad vill du göra?',
    actionSubtitle: 'Välj nästa handlaråtgärd.',
    sellVoucher: 'Ladda',
    cashOutBch: 'Uttag',
    voucherHistory: 'Värdekodshistorik',
    treasuryWallet: 'Treasury-plånbok',
    receiptPreview: 'Kvittovisning',
    glance: {
      title: 'Översikt',
      subtitle: 'Sammanfattning av dagens aktivitet hittills',
      topups: 'Laddningar',
      cashOuts: 'Kontantuttag',
      totalActions: 'Åtgärder totalt',
    },
    status: {
      receipts: {
        title: 'Värdekodskvitton',
        text: 'Kvittovisning i webbläsaren är klar.',
      },
      printer: {
        title: 'Termoskrivare',
        text: 'Skrivaranslutning läggs till härnäst.',
      },
      cashHandling: {
        title: 'Kontanthantering',
        text: 'Behandla utskrivna QR-koder för värdekoder som kontanter.',
      },
    },
  },

  sellForm: {
    customerCashAmount: 'Kundens kontantbelopp',
    salePreviewTitle: 'Förhandsvisning av försäljning',
    salePreviewSubtitle: 'En livekurs för BCH låses på granskningsskärmen.',
    customerPays: 'Kunden betalar',
    serviceFee: 'Serviceavgift',
    voucherValueBeforeQuote: 'Värdekodens värde före kurslåsning',
    quoteSource: 'Kurskälla',
    lockedAfterReview: 'Låses efter granskning',
    reviewVoucher: 'Granska värdekod',
    viewHistory: 'Visa historik',
  },

  issueProgress: {
    title: 'Utfärdar värdekod',
    subtitle: 'Förbereder värdekodsregister och kvitto åt kunden.',
    safetyModeNotice:
      'Utvecklingsskydd är aktivt. Utfärdande av värdekoder kan testas medan live-sändning fortfarande skyddas av befintliga spärrar.',
  },

  sellPage: {
    hero: {
      eyebrow: 'Handlarbetalning',
      title: 'Sälj BCH-värdekod',
      intro:
        'Ange kundens kontantbelopp, granska BCH-värdet, utfärda värdekoden och visa kvittots QR-kod för kunden.',
    },
    treasury: {
      title: 'Treasury-plånbok',
      subtitle:
        'Den här plånboken tillhandahåller BCH för utfärdade värdekoder.',
      ready: 'Klar',
      address: 'Adress',
      balance: 'Saldo',
      lastChecked: 'Senast kontrollerad',
      balanceNotChecked: 'Saldot har inte kontrollerats ännu.',
      notSetUp: 'Inte konfigurerad',
      setUpBeforeUse:
        'Konfigurera treasury-plånboken innan den används i skarp handel.',
      refreshBalance: 'Uppdatera saldo',
    },
    sale: {
      eyebrow: 'Ny värdekod',
      title: 'Ange försäljningsbelopp',
      copy: 'Ange det kontantbelopp kunden betalar. Appen låser en BCH-kurs och visar en granskningsskärm innan värdekoden utfärdas.',
    },
    issued: {
      title: 'Värdekod utfärdad',
      subtitle:
        'Värdekoden har sparats och kvittovisningen är redo för kunden.',
      voucherReference: 'Värdekodsreferens',
      customerPaid: 'Kunden betalade',
      bchLoaded: 'BCH laddat',
      voucherAddress: 'Värdekodsadress',
      issueAnother: 'Utfärda en till',
    },
    developerDetails: {
      title: 'Utvecklingsdetaljer',
      derivationIndex: 'Deriveringsindex',
      wifExportReady: 'WIF-export klar',
      platformFeePlan: 'Plan för plattformsavgift',
      recordStatus: 'Registerstatus',
    },
    issueSteps: {
      quote: {
        label: 'Bekräfta låst kurs',
        description: 'Använd den låsta BCH/GBP-kursen från före bekräftelsen.',
      },
      wallet: {
        label: 'Förbered värdekodens plånbok',
        description:
          'Använd värdekodsadressen som förbereddes före bekräftelsen.',
      },
      funding: {
        label: 'Förbered finansieringsplan',
        description:
          'Kontrollera den förberedda finansieringsplanen medan live-sändning fortfarande är skyddad.',
      },
      store: {
        label: 'Spara värdekodsregister',
        description: 'Spara värdekodsförsäljningen lokalt.',
      },
    },
    receiptDialog: {
      title: 'Värdekodskvitto',
      subtitle: 'Kvittovisning vid utfärdande',
    },
    safetyNotice:
      'Utvecklingsskydd är fortfarande aktivt. Handlarflödet förfinas, men live-sändning av transaktioner skyddas av befintliga spärrar tills detta uttryckligen ändras.',
    messages: {
      treasuryNotSetUpWarning:
        'Treasury-plånboken är inte konfigurerad. Värdekoden kan fortfarande granskas, men live-finansiering blockeras tills en treasury-plånbok finns.',
      treasuryBalanceNotCheckedWarning:
        'Treasury-saldot har inte kontrollerats ännu. Värdekoden kan fortfarande granskas, men live-finansiering kräver en aktuell saldokontroll.',
      treasuryBalanceTooLow:
        'Treasury-saldot är för lågt för den här värdekoden. Krävs: {required}. Tillgängligt: {available}.',
      couldNotLoadTreasuryWallet:
        'Kunde inte läsa in treasury-plånbokens status.',
      treasuryBalanceRefreshed: 'Treasury-saldot har uppdaterats.',
      couldNotRefreshTreasuryBalance:
        'Kunde inte uppdatera treasury-saldot. Kontrollera anslutningen och försök igen.',
      enterValidCashAmount: 'Ange först ett giltigt kontantbelopp.',
      treasuryBalanceCheckTimedOut:
        'Kontroll av treasury-saldo tog för lång tid.',
      treasuryBalanceCouldNotBeCheckedWarning:
        'Treasury-saldot kunde inte kontrolleras. Värdekoden kan fortfarande granskas, men live-finansiering kräver en aktuell saldokontroll.',
      voucherKeyExportFailed:
        'Kontroll av värdekodens nyckelexport misslyckades. Granskningen kan fortsätta, men utskrift/överföring kräver WIF-export.',
      fallbackQuoteWarning:
        'Livepris var inte tillgängligt, så en nyligen cachad kurs används. Granska kursen noggrant innan du utfärdar.',
      liveQuoteLocked: 'Livekursen har låsts.',
      couldNotPrepareReview:
        'Kunde inte förbereda värdekodsgranskningen. Kontrollera anslutningen och försök igen.',
      noLockedQuote:
        'Ingen låst kurs finns tillgänglig. Granska värdekoden igen.',
      noVoucherAddress:
        'Ingen värdekodsadress finns tillgänglig. Granska värdekoden igen.',
      couldNotIssueVoucher: 'Kunde inte utfärda värdekoden.',
    },
  },

  cashOutPage: {
    hero: {
      eyebrow: 'BCH till kontanter',
      title: 'BCH till kontanter',
      intro:
        'Ange kontantbeloppet kunden vill få. Appen räknar ut hur mycket BCH kunden måste skicka till handlarens treasury.',
    },
    actions: {
      treasuryWallet: 'Treasury-plånbok',
      voucherHistory: 'Värdekodshistorik',
      reviewCashOut: 'Granska kontantuttag',
    },
    form: {
      cashAmountLabel: 'Kontantbelopp att betala ut',
      paymentQrNotice:
        'Kunden skannar en BCH-betalnings-QR. Kontantuttaget slutförs först när BCH har upptäckts i treasury-plånboken.',
    },
    preview: {
      title: 'Förhandsvisning av kontantuttag',
      subtitle: 'Slutligt BCH-belopp låses efter granskning.',
      customerReceivesCash: 'Kunden får kontanter',
      serviceFeeSpread: 'Serviceavgift / spread',
      customerSendsValue: 'Kunden skickar värde',
      quoteSource: 'Kurskälla',
      lockedAfterReview: 'Låses efter granskning',
    },
    paymentUri: {
      label: 'BCH kontantuttag',
    },
    safetyNotice:
      'Kundens BCH måste upptäckas innan handlaren lämnar ut kontanter.',
    messages: {
      couldNotLoadTreasuryWallet: 'Kunde inte läsa in treasury-plånboken.',
      enterValidCashAmount: 'Ange ett giltigt kontantbelopp.',
      setUpTreasuryFirst:
        'Konfigurera handlarens treasury-plånbok innan ett kontantuttag förbereds.',
      fallbackQuoteWarning:
        'Reservkurs användes. Kontrollera kursen noggrant innan du fortsätter.',
      pricingUnavailable:
        'Prissättning är inte tillgänglig just nu. Kontrollera anslutningen och försök igen.',
      couldNotPrepareCashOut: 'Kunde inte förbereda kontantuttaget.',
      receiptPrintingPending:
        'Kvittoutskrift kopplas in efter att betalningsdetektering har lagts till.',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: 'Granska uttag',
      receivedTitle: 'BCH mottaget',
      reviewSubtitle: 'Be kunden skanna QR-koden och skicka den BCH som krävs.',
      receivedSubtitle:
        'Kundens betalning har upptäckts i handlarens treasury.',
    },
    quoteStatus: {
      fallback:
        'Reservkurs användes. Kontrollera kursen noggrant innan du fortsätter.',
      liveLocked: 'Livekursen har låsts.',
    },
    breakdown: {
      title: 'Uppdelning av kontantuttag',
      subtitle: 'Kundutbetalning och BCH som krävs',
      cashOutAmount: 'Kontantuttagsbelopp',
      cashOutAmountNote: 'Kontanter som betalas till kunden',
      serviceFeeSpread: 'Serviceavgift / spread',
      cashOutTotal: 'Kontantuttag totalt',
      cashOutTotalNote: 'Kunden skickar detta totalvärde i BCH',
    },
    summary: {
      cashCustomerReceives: 'Kontanter kunden får',
      customerSends: 'Kunden skickar',
      fiatEquivalentSent: 'Skickat fiat-motsvarande',
      serviceFeeSpread: 'Serviceavgift / spread',
    },
    paymentQr: {
      title: 'Kundens betalnings-QR',
      subtitle:
        'Be kunden skanna den här QR-koden med sin BCH-plånbok. Vänta tills BCH-betalningen har kommit till din treasury-plånbok innan du lämnar ut kontanter.',
      qrAlt: 'BCH-betalnings-QR för kontantuttag',
      qrUnavailable: 'QR är inte tillgänglig',
    },
    paymentDetails: {
      amountToSend: 'Belopp att skicka',
      treasuryReceivingAddress: 'Treasury-mottagaradress',
      tapToRevealAddress: 'Tryck för att visa hela adressen',
      paymentUri: 'Betalnings-URI',
    },
    paymentUri: {
      label: 'BCH kontantuttag',
    },
    details: {
      orderDetailsTitle: 'Orderdetaljer',
      orderDetailsCaption: 'Klicka här för att se detaljer om kontantuttaget',
      reference: 'Referens',
      marketRate: 'Marknadskurs',
      quoteSource: 'Kurskälla',
      fallbackBadge: 'reserv',
      quoteTime: 'Kurstid',
      quoteExpires: 'Kursen löper ut',
      status: 'Status',
      bchReceived: 'BCH mottaget',
      transactionId: 'Transaktions-ID',
      detected: 'Upptäckt',
    },
    success: {
      title: 'BCH mottaget',
      nowGiveCustomer: 'Ge nu kunden',
      cash: 'kontanter',
    },
    actions: {
      copyAddress: 'Kopiera adress',
      copyPaymentUri: 'Kopiera betalnings-URI',
      closeReview: 'Avbryt kontantuttag och stäng',
      printReceipt: 'Skriv ut kvitto',
    },
    messages: {
      treasuryAddressCopied: 'Treasury-adress kopierad.',
      paymentUriCopied: 'Betalnings-URI kopierad.',
      copyFailed: 'Kopiering misslyckades.',
    },
    quoteSources: {
      developmentQuote: 'Utvecklingskurs',
      cachedQuote: 'Cachad kurs',
      manualQuote: 'Manuell kurs',
      unknown: 'Okänd',
    },
  },

  saleConfirm: {
    title: 'Granska värdekod',
    subtitle:
      'Bekräfta kundens betalning, BCH-beloppet och kvittodetaljerna innan du utfärdar värdekoden.',
    quoteStatus: {
      fallback:
        'Livepris var inte tillgängligt, så en nyligen cachad kurs används. Granska kursen noggrant innan du utfärdar.',
      liveLocked: 'Livekursen har låsts.',
    },
    summary: {
      customerPays: 'Kunden betalar',
      voucherValue: 'Värdekodsvärde',
      bchLoaded: 'BCH laddat',
      serviceFee: 'Serviceavgift',
    },
    details: {
      marketRate: 'Marknadskurs',
      quoteSource: 'Kurskälla',
      fallbackBadge: 'reserv',
      quoteTime: 'Kurstid',
      quoteExpires: 'Kursen löper ut',
      treasuryBalance: 'Treasury-saldo',
    },
    fundingReadiness: {
      ready:
        'Finansieringskontrollerna är godkända. Live-sändning av transaktioner skyddas fortfarande av den aktuella spärren.',
      notReady: 'Live-finansiering är inte redo ännu.',
    },
    safetyNotice:
      'Utvecklingsskydd är aktivt. Den här skärmen kan utfärda värdekodsregister och kvittovisning, medan live-sändning fortfarande skyddas tills den uttryckligen aktiveras.',
    actions: {
      issueVoucher: 'Utfärda värdekod',
    },
    quoteSources: {
      developmentQuote: 'Utvecklingskurs',
      cachedQuote: 'Cachad kurs',
    },
  },

  historyPage: {
    hero: {
      eyebrow: 'Värdekodsregister',
      title: 'Värdekodshistorik',
      intro:
        'Granska utfärdade BCH-värdekoder, kontrollera inlösenstatus och öppna kvittovisningar för utveckling medan skrivartestningen fortfarande förbereds.',
    },
    actions: {
      sellVoucher: 'Sälj värdekod',
    },
    summary: {
      totalVouchers: 'Totalt antal värdekoder',
      openActive: 'Öppna / aktiva',
      sweptRedeemed: 'Överförda / inlösta',
    },
    records: {
      title: 'Värdekodsregister',
      subtitle:
        'Kundens värdekodsinformation visas först. Tekniska finansierings- och testverktyg finns inuti varje registerpost.',
    },
    safetyNotice:
      'Utvecklingsskydd är fortfarande aktivt. Kvittovisning och inlösenverktyg är tillgängliga för testning innan det slutliga skrivarflödet kopplas in.',
    messages: {
      couldNotLoadVoucherRecords: 'Kunde inte läsa in värdekodsregister.',
      createdTestVoucher: 'Testvärdekod {serial} skapades.',
      couldNotCreateTestVoucher: 'Kunde inte skapa testvärdekod.',
      markedManualRedemption:
        '{serial} markerades manuellt som överförd/inlöst.',
      couldNotFindVoucherRecordToUpdate:
        'Kunde inte hitta värdekodsregistret som ska uppdateras.',
      couldNotMarkVoucherAsManuallyRedeemed:
        'Kunde inte markera värdekoden som manuellt inlöst.',
      clearedManualRedemption: 'Manuell inlösenstatus rensades för {serial}.',
      couldNotClearManualRedemption: 'Kunde inte rensa manuell inlösenstatus.',
      couldNotFindVoucherRecordToCheck:
        'Kunde inte hitta värdekodsregistret som ska kontrolleras.',
      checkedOnChainRedemptionStatus:
        'On-chain-inlösenstatus kontrollerades för {serial}: {status}.',
      couldNotUpdateVoucherRedemptionDetectionResult:
        'Kunde inte uppdatera resultatet för värdekodens inlösendetektering.',
      couldNotCheckVoucherRedemptionStatus:
        'Kunde inte kontrollera värdekodens inlösenstatus.',
      clearedAllLocalTestVoucherRecords:
        'Alla lokala testregister för värdekoder rensades.',
      couldNotClearVoucherRecords: 'Kunde inte rensa värdekodsregister.',
    },
  },

  historyList: {
    empty: {
      title: 'Inga värdekodsregister ännu',
      text: 'Utfärdade värdekoder visas här när en försäljning har slutförts.',
    },
    issuedDate: 'Utfärdad {date}',
    summary: {
      customerPaid: 'Kunden betalade',
      bchLoaded: 'BCH laddat',
      redemption: 'Inlösen',
      quote: 'Kurs',
    },
    address: {
      voucherAddress: 'Värdekodsadress',
      notDerivedYet: 'Inte deriverad ännu',
    },
    actions: {
      previewReceipt: 'Förhandsvisa kvitto',
      checkRedemption: 'Kontrollera inlösen',
      checkOnChainStatus: 'Kontrollera on-chain-status',
      markAsManuallySwept: 'Markera som manuellt överförd',
      clearManualSweepStatus: 'Rensa manuell överföringsstatus',
    },
    status: {
      redeemed: 'Inlöst',
      funded: 'Finansierad',
      error: 'Fel',
      issued: 'Utfärdad',
    },
    redemption: {
      manualSwept: 'Manuellt överförd',
      swept: 'Överförd',
      funded: 'Finansierad',
      unfunded: 'Ofinansierad',
      notChecked: 'Inte kontrollerad',
    },
    redemptionTools: {
      label: 'Inlösenverktyg',
      caption: 'Manuell överföringsstatus och on-chain-inlösenkontroll',
      manualMarked: 'Värdekoden markerades manuellt som överförd/inlöst.',
      notCheckedYet: 'Inlösenstatus har inte kontrollerats ännu.',
      status: 'Status',
      sweepTransactionId: 'Transaktions-ID för överföring',
      note: 'Anteckning',
      redeemed: 'Inlöst',
      detectedStatus: 'Upptäckt status',
      detectedBalance: 'Upptäckt saldo',
      detectedUtxos: 'Upptäckta UTXO:er',
      checked: 'Kontrollerad',
      sweepTxidOptional: 'Överförings-TXID valfritt',
      noteOptional: 'Anteckning valfri',
    },
    quoteSources: {
      cached: 'Cachad',
      manual: 'Manuell',
      unknown: 'Okänd',
    },
  },

  treasuryPage: {
    common: {
      notConfigured: 'Inte konfigurerad',
      valid: 'Giltig',
      notReady: 'Inte redo',
      validNotRequired: 'Giltig / krävs inte',
    },
    hero: {
      eyebrow: 'Handlarens medel',
      title: 'Treasury-plånbok',
      intro:
        'Hantera BCH-plånboken som används för att finansiera kundernas värdekodskvitton.',
    },
    walletStatus: {
      title: 'Plånboksstatus',
      subtitle: 'Kontrollera om handlarens treasury-plånbok är redo.',
      setupBanner: 'Treasury-plånboken är konfigurerad.',
      notSetupBanner: 'Ingen treasury-plånbok har konfigurerats ännu.',
      notSetupPrompt: 'Treasury Wallet is not yet set up.',
    },
    walletTools: {
      addFunds: 'Add BCH',
      addFundsTitle: 'Add BCH to your Treasury Wallet',
      addFundsSubtitle:
        'Scan this QR code from another BCH wallet or copy the below wallet address, paste and send, to top-up your Treasury Wallet.',
      sendFunds: 'Send BCH',
      sendFundsTitle: 'Send BCH',
      sendFundsSubtitle:
        'Send BCH from the Treasury Wallet to another BCH address.',
      scanQr: 'Scan QR',
      uploadQr: 'Upload QR',
      scannerTitle: 'Scan recipient QR',
      scannerSubtitle:
        'Point the camera at a BCH address or payment QR. Scanning happens locally on this device.',
      copied: 'Copied.',
      sendFundsInstruction:
        'Paste a BCH receiving address or payment URI, enter the fiat amount, then review before sending.',
      sendAddressLabel: 'Receiving address or payment URI',
      sendAddressPlaceholder: 'Paste BCH address or payment URI here',
      sendAmountLabel: 'Amount to send',
      sendFiatAmountLabel: 'Fiat amount to send',
      bchEquivalent: 'BCH equivalent',
      available: 'Available',
      max: 'Max',
      maxSelected:
        'Max selected. The network fee will be deducted so the wallet can send the maximum available amount.',
      realBroadcastTestWarning:
        'Real Treasury Send broadcast testing is enabled. Only test with a tiny amount and turn this off immediately afterwards.',
      reviewSend: 'Review Send',
      reviewSendTitle: 'Review Treasury Send',
      sendAmount: 'Amount',
      networkFee: 'Network fee',
      totalDebit: 'Total from treasury',
      destination: 'Destination',
      swipeToSend: 'Swipe to send',
      swipeToSendCaption: 'Slide right to broadcast this treasury transaction.',
      sending: 'Sending BCH...',
      sentTitle: 'Sent',
      sentSubtitle:
        'BCH has been sent from your Treasury Wallet. Close this window to return to the updated wallet balance.',
      txid: 'Transaction',
      copyDestination: 'Copy Destination',
      copyTxid: 'Copy Transaction ID',
      errors: {
        enterValidAmount: 'Enter a valid BCH amount.',
        couldNotCreateDraft: 'Could not prepare this treasury send.',
        broadcastFailed:
          'Treasury send failed. Check the details and try again.',
        noQrValue: 'No QR value was found.',
        qrScanFailed: 'Could not scan QR code.',
        qrUploadFailed: 'Could not read QR code from this image.',
      },
      sendFundsPlaceholder:
        'The send flow will be added in the next step. This button is placed here now so the Treasury Wallet tools are in their final position before wiring live spending.',
      backup: 'Backup',
      import: 'Import',
      delete: 'Delete',
      restoreImport: 'Restore/import',
      backupTitle: 'Backup Treasury Wallet',
      backupSubtitle:
        'This 12 word seed phrase is the key to your wallet. Write it down somewhere safe where nobody else will see it. With this, you can access your funds via a BCH wallet anywhere.',
      backupWarning:
        "Anyone with this seed phrase can control this Treasury Wallet's BCH. Only reveal this in a safe, private environment.",
      seedHidden: 'Seed phrase hidden until revealed.',
      importTitle: 'Import Treasury Wallet',
      importSubtitle: 'Import an existing Treasury Wallet from a seed phrase.',
      seedPhraseInput: 'Seed phrase',
      seedPhrasePlaceholder: 'Enter seed phrase of wallet to import here',
      importWallet: 'Import Wallet',
      deleteTitle: 'Delete Treasury Wallet',
      deleteSubtitle: 'Remove this device’s saved Treasury Wallet data.',
      deleteWallet: 'Delete Treasury Wallet',
    },
    cashOnHand: {
      title: 'Kontantkassa',
      subtitle:
        'Valfri spårning av fysiska kontanter för laddningar, kontantuttag och lokala rapporter.',
      setUp: 'Konfigurera',
      notSetUp: 'Inte konfigurerad',
      notSetUpPrompt:
        'Spåra de fysiska kontanter som just nu finns i butiken eller kassalådan.',
      currentBalance: 'Nuvarande kontantkassa',
      readyForManualTracking: 'Redo för manuell kontantspårning.',
      lastUpdated: 'Senast uppdaterad: {date}',
      currency: 'Valuta',
      actions: {
        setUp: 'Konfigurera',
        addCash: 'Lägg till kontanter',
        withdrawCash: 'Ta ut kontanter',
        clear: 'Rensa kontantkassa',
        confirmClear: 'Rensa kontantkassa',
        saveSetup: 'Spara',
        saveAdd: 'Spara',
        saveWithdraw: 'Spara',
      },
      dialog: {
        setupTitle: 'Konfigurera kontantkassa',
        setupSubtitle:
          'Ange startbeloppet för de fysiska kontanter som finns tillgängliga just nu.',
        addTitle: 'Lägg till kontanter',
        addSubtitle:
          'Registrera extra fysiska kontanter som lagts i kassalådan.',
        withdrawTitle: 'Ta ut kontanter',
        withdrawSubtitle:
          'Registrera fysiska kontanter som tagits ur kassalådan.',
        currentCash: 'Nuvarande kontantkassa',
        enteredAmount: 'Angivet belopp',
        newCash: 'Ny kontantkassa',
        startingAmount: 'Startbelopp',
        amountToAdd: 'Belopp att lägga till',
        amountToWithdraw: 'Belopp att ta ut',
        noteOptional: 'Anteckning valfri',
      },
      clearDialog: {
        title: 'Rensa kontantkassa?',
        message:
          'Detta återställer kontantkassan till ej konfigurerad. Laddningar och kontantuttag fortsätter att fungera.',
        warning:
          'Det aktuella spårade saldot är {amount}. Rensning tar bort detta aktiva saldo från treasury-plånbokssidan.',
        clearNote: 'Kontantkassa rensad manuellt.',
      },
      transactions: {
        link: 'Transaktioner',
        title: 'Transaktioner',
        subtitle: 'Kassarörelser som ändrade detta saldo.',
        emptyTitle: 'Inga transaktioner ännu',
        emptySubtitle: 'Ändringar i kontantkassan visas här.',
        showing: 'Visar {count} av {total}',
        showMore: 'Visa 10 till',
        viewOlder: 'Visa äldre transaktioner',
        backToLatest: 'Tillbaka till senaste transaktioner',
        olderPage: 'Äldre transaktioner · sida {page}',
        detailTitle: 'Detaljer för kassarörelse',
        type: 'Typ',
        date: 'Datum',
        cashAmount: 'Kontantbelopp',
        balanceAfter: 'Saldo efter',
        reference: 'Referens',
        bchAddress: 'BCH-adress',
        bchTransaction: 'BCH-transaktion',
        note: 'Anteckning',
        noRelatedRecord: 'Relaterad post hittades inte',
        types: {
          setup: 'Konfiguration',
          topup: 'Laddning',
          cashOut: 'Kontantuttag',
          cashAdded: 'Kontanter tillagda',
          withdrawal: 'Uttag',
          cleared: 'Rensad',
        },
        amount: {
          reset: 'Återställd till {amount}',
        },
      },
      errors: {
        enterValidAmount: 'Ange ett giltigt kontantbelopp.',
        enterPositiveAmount: 'Ange ett belopp större än noll.',
        withdrawTooMuch:
          'Du kan inte ta ut mer kontanter än vad som finns tillgängligt.',
      },
      messages: {
        couldNotLoad: 'Kunde inte läsa in information om kontantkassan.',
        setUp: 'Kontantkassa konfigurerad.',
        added: 'Kontanter lades till i kontantkassan.',
        withdrawn: 'Kontanter togs ut ur kontantkassan.',
        cleared: 'Kontantkassa rensad.',
        couldNotSave: 'Kunde inte spara ändringen i kontantkassan.',
        couldNotClear: 'Kunde inte rensa kontantkassan.',
      },
    },
    summary: {
      status: 'Status',
      ready: 'Redo',
      notSetUp: 'Inte konfigurerad',
      balance: 'Saldo',
      notChecked: 'Inte kontrollerad',
      utxos: 'UTXO:er',
      lastChecked: 'Senast kontrollerad',
      notCheckedYet: 'Inte kontrollerad ännu',
      balanceUnavailable: 'Fiat balance unavailable',
    },
    details: {
      treasuryAddress: 'Treasury-adress',
      created: 'Skapad',
      updated: 'Uppdaterad',
    },
    actions: {
      sellVoucher: 'Sälj värdekod',
      refreshBalance: 'Uppdatera saldo',
      walletReady: 'Treasury-plånbok redo',
      createWallet: 'Skapa plånbok',
      hideSeed: 'Dölj seed',
      revealSeedBackup: 'Visa seed-backup',
      clearRestoreTool: 'Rensa återställningsverktyg',
      checkSeed: 'Kontrollera seed',
      importCheckedSeed: 'Importera kontrollerad seed',
      clearTreasuryWallet: 'Rensa treasury-plånbok',
      create: 'Create',
    },
    utxoDetails: {
      label: 'UTXO-detaljer',
      caption: 'Avancerade skrivskyddade treasury-utgångar',
      description:
        'Detta är de outnyttjade utgångar som för närvarande upptäcks för treasury-plånboken. Den här sektionen är skrivskyddad.',
      noneDetected: 'Inga treasury-UTXO:er upptäckta.',
      utxoNumber: 'UTXO {number}',
      value: 'Värde',
      tx: 'Tx',
      outputIndex: 'Utgångsindex',
    },
    fundingConfig: {
      label: 'Finansieringskonfiguration',
      caption:
        'Beredskap för avgiftsadress vid live-finansiering från treasury',
      platformFeeValid:
        'Plattformens avgiftsadress är konfigurerad och giltig.',
      platformFeeInvalid:
        'Plattformens avgiftsadress är konfigurerad men ogiltig: {error}',
      platformFeeNotConfigured:
        'Plattformens avgiftsadress är inte konfigurerad. Live-finansiering måste förbli avstängd.',
      bufferReserveValid: 'Buffertreservadressen är konfigurerad och giltig.',
      bufferReserveOptional:
        'Buffertreservutgången är valfri för MVP och krävs inte just nu.',
      platformFeeAddress: 'Plattformens avgiftsadress',
      platformFeeAddressStatus: 'Status för plattformens avgiftsadress',
      bufferReserveAddress: 'Buffertreservadress',
      bufferReserveAddressStatus: 'Status för buffertreservadress',
      configChecked: 'Konfiguration kontrollerad',
    },
    walletBackup: {
      label: 'Plånboksbackup',
      caption: 'Känslig seed-backup för utveckling och återställning',
      warning:
        'Alla som har den här seed-frasen kan kontrollera BCH i treasury. Visa den endast i en privat och säker miljö.',
      backupStatus: 'Backupstatus',
      seedLoaded: 'Seed laddad för backup',
      seedNotRevealed: 'Seed visas inte',
      seedPhrase: 'Seed-fras',
      exported: 'Exporterad',
    },
    restore: {
      label: 'Återställ / importera plånbok',
      caption: 'Kontrollera eller importera en treasury-seedfras',
      warning:
        'Import ersätter den nuvarande lokala treasury-plånboken. Klistra inte in en produktions-seedfras i den här utvecklingsversionen.',
      seedInputLabel: 'Treasury-seedfras att kontrollera/importera',
      matchesCurrentAddress:
        'Den här seeden deriverar den nuvarande treasury-adressen.',
      differentAddress: 'Den här seeden deriverar en annan treasury-adress.',
      importedIntoLocalStorage:
        'Treasury-plånbok importerad till lokal lagring.',
      derivedAddress: 'Deriverad adress',
      currentTreasuryAddress: 'Nuvarande treasury-adress',
      noCurrentTreasuryWallet: 'Ingen nuvarande treasury-plånbok',
      checked: 'Kontrollerad',
      importedAddress: 'Importerad adress',
      replacedExistingWallet: 'Ersatte befintlig plånbok',
      imported: 'Importerad',
    },
    dangerZone: {
      label: 'Riskzon',
      caption: 'Rensa lokal treasury-plånbok',
      warning:
        'Att rensa den lokala treasury-plånboken tar bort treasury-plånboksdata som sparats på den här enheten. Gör detta endast när du är säker på att plånboken är säkerhetskopierad eller inte längre behövs.',
    },
    safetyNotice:
      'Utvecklingsskydd är fortfarande aktivt. Treasury-verktygen är tillgängliga för testning medan skarp handlaranvändning förbereds.',
    messages: {
      couldNotLoadWalletInfo:
        'Kunde inte läsa in treasury-plånboksinformation.',
      createdWallet: 'Treasury-plånbok skapad.',
      couldNotCreateWallet: 'Kunde inte skapa treasury-plånbok.',
      clearedWallet: 'Treasury-plånbok rensad.',
      couldNotClearWallet: 'Kunde inte rensa treasury-plånbok.',
      balanceRefreshed: 'Treasury-saldo uppdaterat.',
      couldNotRefreshBalance:
        'Kunde inte uppdatera treasury-saldot. Kontrollera anslutningen och försök igen.',
      seedBackupLoaded: 'Treasury-seedbackup laddad.',
      couldNotLoadBackupInfo: 'Kunde inte läsa in treasury-backupinformation.',
      seedBackupHidden: 'Treasury-seedbackup dold.',
      restoreSeedCheckCompleted:
        'Kontroll av treasury-återställningsseed slutförd.',
      couldNotCheckRestoreSeed:
        'Kunde inte kontrollera treasury-återställningsseed.',
      checkSeedBeforeImporting:
        'Kontrollera en treasury-seedfras innan import.',
      importedCheckedSeed:
        'Kontrollerad treasury-seed importerad till lokal lagring.',
      couldNotImportSeed: 'Kunde inte importera treasury-seed.',
      restoreToolCleared: 'Treasury-återställningsverktyg rensat.',
    },
  },

  treasuryTopUpQr: {
    title: 'Treasury-laddnings-QR',
    subtitle:
      'Skanna den här QR-koden från en annan BCH-plånbok för att ladda handlarens treasury-plånbok.',
    qrAlt: 'QR-kod för treasury-laddning',
    qrUnavailable: 'QR-kod inte tillgänglig.',
    treasuryAddress: 'Treasury-plånboksadress',
    paymentUri: 'BCH-betalnings-URI',
    qrGenerated: 'QR skapad',
    copy: 'Kopiera',
    copyAddress: 'Kopiera adress',
    copyPaymentUri: 'Kopiera betalnings-URI',
    tapQrToCopy: 'Tryck på QR-koden för att kopiera plånboksadressen.',
    watching: 'Väntar på inkommande BCH...',
    watchingError:
      'Kunde inte bevaka inkommande BCH. Du kan fortfarande kopiera adressen och uppdatera saldot efter att du har skickat.',
    receivedTitle: 'Mottaget',
    receivedSubtitle:
      'Inkommande BCH har upptäckts i din treasury-plånbok. Stäng det här fönstret för att återgå till det uppdaterade plånbokssaldot.',
    receivedAmount: 'Mottaget',
    receivedTxid: 'Transaktion',
    uriLabel: 'BCH-värdekods-treasury',
    uriMessage: 'Ladda handlarens treasury-plånbok',
    addressCopied: 'Treasury-adress kopierad.',
    uriCopied: 'Treasury-betalnings-URI kopierad.',
    copyFailed: 'Kunde inte kopiera till urklipp.',
  },

  layout: {
    brand: {
      title: 'Bitcoin Cash-laddning',
      subtitle: 'Handlarapp',
    },
    drawer: {
      subtitle: 'Handlarapp för laddning',
    },
    navigation: {
      openMenu: 'Öppna navigeringsmeny',
      closeMenu: 'Stäng navigeringsmeny',
    },
    status: {
      treasury: 'Treasury',
      printerPending: 'Skrivare väntar',
      devMode: 'Dev-läge',
    },
    sections: {
      main: 'Huvudmeny',
      merchantSetup: 'Handlarinställning',
      help: 'Hjälp',
      advanced: 'Avancerat',
    },
    items: {
      home: 'Hem',
      sellVoucher: 'Sälj värdekod',
      cashOut: 'BCH till kontanter',
      voucherHistory: 'Värdekodshistorik',
      merchantReports: 'Handlarrapporter',
      treasuryWallet: 'Treasury-plånbok',
      printerSetup: 'Skrivarinställning',
      appSettings: 'Appinställningar',
      checkForUpdates: 'Check for Updates',
      checkForUpdatesCaption: 'App version and download status',
      howToSellVoucher: 'Så säljer du en värdekod',
      howToCashOut: 'How to Cash-out',
      howCustomersRedeem: 'Så löser kunder in',
      faq: 'Vanliga frågor',
      support: 'Support',
      communities: 'Communityn',
      socialMedia: 'Sociala medier',
      developerTools: 'Utvecklarverktyg',
    },
    common: {
      comingSoon: 'Kommer snart',
    },
    update: {
      checking: 'Checking for updates...',
      upToDateTitle: 'You are up to date',
      upToDateMessage: 'This device is running the latest public release.',
      updateAvailableTitle: 'Update available',
      updateAvailableMessage:
        'A newer Bitcoin Cash Topup release is ready to download.',
      installedNewerTitle: 'Newer test build installed',
      installedNewerMessage:
        'This device is running a newer local/test build than the latest public release.',
      unsupportedTitle: 'Update channel mismatch',
      unsupportedMessage:
        'This update channel is for the public BCH Topups Android release app.',
      failedTitle: 'Could not check for updates',
      failedMessage: 'Check your internet connection and try again.',
      installedVersion: 'Installed version',
      latestVersion: 'Latest public version',
      versionCode: 'Version code {code}',
      releaseNotes: 'Release notes',
      safetyTitle: 'Before updating',
      safetyMessage:
        'This is a non-production alpha release. Back up important wallet recovery information before updating or reinstalling.',
      verificationHash: 'Verification SHA-256',
      openReleasePage: 'Open Download Page',
      openFailed: 'Could not open the download page.',
      close: 'Close',
    },
  },

  merchantReportsPage: {
    hero: {
      eyebrow: 'Merchant Reports',
      title: 'Reports',
      intro: 'Track topups, cash-outs, revenue, and growth from this device.',
    },
    actions: {
      viewHistory: 'View History',
      sellVoucher: 'Sell Topup',
      printReport: 'Print Report',
      exportPdf: 'Export PDF',
      saveImage: 'Save Image',
      shareReport: 'Share Report',
      refreshReport: 'Refresh Report',
    },
    range: {
      title: 'Report Range',
      subtitle: 'Switch between useful merchant reporting periods.',
    },
    ranges: {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      year: 'This Year',
      allTime: 'All Time',
    },
    period: {
      currentRange: 'Current Range',
      loading: 'Loading report range...',
      noRecordsYet: 'No completed topup or cash-out records yet',
    },
    summary: {
      localData: 'Local',
      previousPeriod: 'Previous',

      topups: 'Topups',
      cashOuts: 'Cash-outs',

      totalTopups: 'Topups Issued',
      totalTopupsCaption:
        'Number of completed customer topups in the selected period.',

      cashOutsCompleted: 'Cash-outs Completed',
      cashOutsCompletedCaption:
        'Number of completed customer cash-outs in the selected period.',

      grossFiat: 'Gross Fiat Movement',
      grossFiatCaption: 'Total fiat value handled across topups and cash-outs.',

      netFiat: 'Net Fiat Movement',
      netFiatCaption:
        'Estimated value after tracked fee deductions where available.',

      bchLoaded: 'BCH Loaded Into Topups',
      bchLoadedCaption:
        'Total BCH loaded into customer topups during this period.',

      bchBoughtFromCustomers: 'BCH Bought From Customers',
      bchBoughtFromCustomersCaption:
        'Total BCH customers sold back to the merchant through cash-outs.',

      fiatPaidOut: 'Fiat Paid Out',
      fiatPaidOutCaption:
        'Total cash paid out to customers for completed cash-outs.',

      averageTopupValue: 'Average Topup Value',
      averageTopupValueCaption:
        'Average fiat value per completed customer topup.',

      totalBchMovement: 'Total BCH Movement',
      totalBchMovementCaption:
        'Combined BCH loaded into topups and bought from customers.',

      growth: 'Growth vs Previous Period',
      growthCaption:
        'Topup count compared with the matching previous report period.',
      noPreviousPeriod: 'No previous period',
      newActivity: 'New',
    },
    tracker: {
      title: 'Topups vs Cash-outs',
      subtitle:
        'See whether this merchant is mainly selling BCH topups or buying BCH back from customers.',
      fiatMovement: 'Fiat Movement',
      localPeriod: 'Selected Range',
      topups: 'Topups',
      cashOuts: 'Cash-outs',
      transactionCount: '{count} transactions',
      emptyState: 'No completed topups or cash-outs in this range yet.',
    },
    targets: {
      title: 'Beat Last Period',
      subtitle:
        'Automatic targets compare this range with the previous matching period.',
      progressLabel: 'Target Progress',
      noPreviousPeriod: 'No previous period',
      noPreviousPeriodMessage:
        'Choose Today, This Week, This Month, or This Year once there is previous activity to compare against.',
      newActivity: 'New activity',
      newActivityMessage:
        'There was no activity in the previous period, so this period has started fresh.',
      matchedLastPeriod: 'Matched last period',
      matchedMessage:
        'This period is currently level with the previous matching period.',
      aheadBy: '{amount} ahead',
      aheadMessage:
        'The merchant is currently ahead of the previous matching period.',
      leftToBeat: '{amount} left',
      behindMessage:
        'This is the amount still needed to beat the previous matching period.',
    },
    breakdowns: {
      title: 'Breakdowns',
      subtitle:
        'View currency totals, topup flow, cash-out flow, and which local records are counted.',
      currencyTitle: 'By Currency',
      noCurrencyData:
        'No completed topup or cash-out activity in this range yet.',
      topupCount: '{count} topups',
      cashOutCount: '{count} cash-outs',

      flowTitle: 'Topup & Cash-out Flow',
      topupsIssued: 'Topups issued',
      cashOutsCompleted: 'Cash-outs completed',
      totalBchMovement: 'Total BCH movement',
      flowText:
        'This compares the merchant’s BCH sold through topups against BCH bought back from customers through cash-outs.',

      statusTitle: 'Reportable Records',
      recordsLoaded: 'Records loaded',
      reportableTopups: 'Reportable topups',
      reportableCashOuts: 'Reportable cash-outs',
      statusText:
        'Reports count funded, printed, and redeemed topups, plus completed cash-outs. Drafts, quote-locked records, errors, cancelled records, and reclaimed records are excluded.',
    },
    reportActions: {
      title: 'Report Actions',
      subtitle:
        'Prepared for print, PDF export, image save, and sharing features.',
      comingSoon: 'Report actions will be connected later.',
    },
    localFirst: {
      title: 'Local-first reports.',
      message:
        'Reports are calculated from records stored on this device. No server tracking is added in this step.',
    },
    messages: {
      loadingReport: 'Loading local report data...',
      couldNotLoadReport: 'Could not load merchant report data.',
    },
    printPreview: {
      title: 'Utskriftsförhandsvisning',
      subtitle: 'A4-förhandsvisning av handlarrapport',
      pdfTitle: 'Exportera PDF',
      pdfSubtitle: 'Spara den här A4-handlarrapporten som PDF.',
      savePdf: 'Spara som PDF',
      imageTitle: 'Save Image',
      imageSubtitle: 'Save this A4 merchant report as a PNG image.',
      saveImage: 'Save Image',
      savingImage: 'Saving image…',
      imageSaved: 'Image saved',
      imageSavedAndroidCaption: 'Saved to Pictures/Bitcoin Cash Topups.',
      imageSavedDesktopCaption: 'Downloaded as a PNG image.',
      imageSaveFailed: 'Could not save image',
      imageSaveFailedCaption: 'Please try again.',
      close: 'Stäng',
      print: 'Skriv ut',
      reportTitle: 'Handlarrapport',
      selectedRange: 'Valt intervall',
      generated: 'Skapad',
      atAGlance: 'Översikt',
      topupsVsCashOuts: 'Laddningar vs kontantuttag',
      currencyBreakdown: 'Uppdelning per valuta',
      currency: 'Valuta',
      topups: 'Laddningar',
      cashOuts: 'Kontantuttag',
      totalFiat: 'Fiat totalt',
      noCurrencyData: 'Ingen valutaaktivitet finns för detta intervall ännu.',
      localNotice:
        'Skapad lokalt från register som sparats på den här enheten. Inga rapportdata skickas till någon server.',
    },
    connectedNotice:
      'Rapporter är nu anslutna till lokala laddnings- och kontantuttagsregister på den här enheten.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'Laddat värde',
      scanToRedeem: 'Skanna för att lösa in',
      reference: 'Referens',
      issued: 'Utfärdad',
      customerPaid: 'Kunden betalade',
      loaded: 'Laddat',
      voucherAddress: 'Värdekodsadress',
    },
    privateKeyWarning:
      'Endast utvecklingsvisning. Det här kvittot innehåller en QR-kod med en överförbar privat nyckel. Alla som skannar eller kopierar den kan föra över värdekodens medel.',
    loading: 'Bygger kvittovisning...',
    receiptTitle: 'BCH-värdekod',
    receiptSubtitle: 'Överförbart BCH-värdekodskvitto',
    voucherValueLoaded: 'Värdekodsvärde laddat',
    scanToSweep: 'Skanna för att överföra',
    qrAlt: 'Överförbar BCH-värdekods-QR',
    reference: 'Referens',
    issued: 'Utfärdad',
    customerPaid: 'Kunden betalade',
    voucherAddress: 'Värdekodsadress',
    keepSafeUntilRedeemed: 'Förvara säkert tills den är inlöst',
    redemptionInstruction:
      'Skanna den här QR-koden med en Bitcoin Cash-plånbok som stöder import/överföring av privat nyckel.',
    cashWarning:
      'Behandla detta kvitto som kontanter. Alla som har QR-koden kan föra över medlen.',
    supportNote:
      'Förvara kvittot säkert tills BCH har förts över till din egen plånbok.',
    couldNotBuildPreview: 'Kunde inte skapa kvittovisning för värdekoden.',
    errors: {
      invalidDerivationIndex: 'Värdekoden saknar ett giltigt deriveringsindex.',
      missingSerial: 'Värdekoden saknar serienummer/referens.',
      missingFiatCurrency: 'Värdekoden saknar fiat-valuta.',
      invalidBchAmount: 'Värdekoden saknar ett giltigt laddat BCH-belopp.',
      missingAddress: 'Värdekoden saknar BCH-adress.',
      addressMismatch:
        'Värdekodsadressen matchar inte adressen från den exporterade värdekodsnyckeln.',
    },
  },
};

export default svSE;
