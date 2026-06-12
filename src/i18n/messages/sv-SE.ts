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
    sellVoucher: 'Sälj ny värdekod',
    cashOutBch: 'BCH till kontanter',
    voucherHistory: 'Värdekodshistorik',
    treasuryWallet: 'Treasury-plånbok',
    receiptPreview: 'Kvittovisning',
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
      reviewTitle: 'Granska kontantuttag',
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
      paymentUri: 'Betalnings-URI',
    },
    paymentUri: {
      label: 'BCH kontantuttag',
    },
    details: {
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
      closeReview: 'Stäng granskning',
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
    receiveOnlyNotice:
      'Endast mottagning. Detta låter handlaren lägga till BCH i treasury-plånboken. Det spenderar eller sänder ingenting från den här appen.',
    qrAlt: 'QR-kod för treasury-laddning',
    qrUnavailable: 'QR-kod inte tillgänglig.',
    treasuryAddress: 'Treasury-adress',
    paymentUri: 'BCH-betalnings-URI',
    qrGenerated: 'QR skapad',
    copyAddress: 'Kopiera adress',
    copyPaymentUri: 'Kopiera betalnings-URI',
    uriLabel: 'BCH-laddning treasury',
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
      howToSellVoucher: 'Så säljer du en värdekod',
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
  },

  merchantReportsPage: {
    hero: {
      eyebrow: 'Handlarrapporter',
      title: 'Rapporter',
      intro:
        'Följ värdekodsförsäljning, BCH-kontantuttag, intäkter och tillväxt från den här enheten.',
    },
    actions: {
      viewHistory: 'Visa historik',
      sellVoucher: 'Sälj värdekod',
      printReport: 'Skriv ut rapport',
      exportPdf: 'Exportera PDF',
      saveImage: 'Spara bild',
      shareReport: 'Dela rapport',
      refreshReport: 'Uppdatera rapport',
    },
    range: {
      title: 'Rapportintervall',
      subtitle: 'Växla mellan användbara rapportperioder för handlaren.',
    },
    ranges: {
      today: 'Idag',
      week: 'Denna vecka',
      month: 'Denna månad',
      year: 'Detta år',
      allTime: 'All tid',
    },
    period: {
      currentRange: 'Aktuellt intervall',
      loading: 'Läser in rapportintervall...',
      noRecordsYet: 'Inga slutförda värdekodsregister ännu',
    },
    summary: {
      localData: 'Lokalt',
      previousPeriod: 'Föregående period',
      totalVouchers: 'Totalt utfärdade värdekoder',
      totalVouchersCaption:
        'Antal slutförda värdekodsförsäljningar under valt intervall.',
      grossFiat: 'Brutto fiat-värde',
      grossFiatCaption:
        'Totalt kundkontantvärde hanterat genom värdekodsförsäljning.',
      netFiat: 'Netto fiat-värde',
      netFiatCaption:
        'Beräknat värde efter avdrag för spårade värdekodsavgifter.',
      bchLoaded: 'BCH laddat',
      bchLoadedCaption:
        'Total BCH som laddats på kundvärdekoder under perioden.',
      averageVoucherValue: 'Genomsnittligt värdekodsvärde',
      averageVoucherValueCaption:
        'Genomsnittligt fiat-värde per slutförd värdekodsförsäljning.',
      growth: 'Tillväxt mot föregående period',
      growthCaption:
        'Jämförelse av värdekodsantal mot motsvarande föregående rapportperiod.',
      noPreviousPeriod: 'Ingen föregående period',
      newActivity: 'Ny',
    },
    targets: {
      title: 'Slå föregående period',
      subtitle:
        'Automatiska mål jämför det här intervallet med motsvarande föregående period.',
      progressLabel: 'Målframsteg',
      noPreviousPeriod: 'Ingen föregående period',
      noPreviousPeriodMessage:
        'Välj idag, denna vecka, denna månad eller detta år när det finns föregående aktivitet att jämföra med.',
      newActivity: 'Ny aktivitet',
      newActivityMessage:
        'Föregående period hade ingen aktivitet, så den här perioden börjar från noll.',
      matchedLastPeriod: 'Matchade föregående period',
      matchedMessage:
        'Den här perioden ligger just nu lika med motsvarande föregående period.',
      aheadBy: 'Före med {amount}',
      aheadMessage:
        'Handlaren ligger just nu före motsvarande föregående period.',
      leftToBeat: '{amount} kvar',
      behindMessage:
        'Detta återstår för att slå motsvarande föregående period.',
    },
    breakdowns: {
      title: 'Uppdelningar',
      subtitle:
        'Se valutatotaler, värdekodsflöde och vilka lokala register som räknas.',
      currencyTitle: 'Efter valuta',
      noCurrencyData:
        'Ingen slutförd värdekodsaktivitet finns för detta intervall ännu.',
      voucherCount: '{count} värdekoder',
      flowTitle: 'Värdekodsflöde',
      vouchersIssued: 'Utfärdade värdekoder',
      bchLoaded: 'BCH laddat',
      flowText:
        'BCH-kontantuttag läggs till här när rapportvyn för värdekoder har bekräftats.',
      statusTitle: 'Rapporterbara register',
      recordsLoaded: 'Inlästa värdekodsregister',
      reportableVouchers: 'Rapporterbara värdekoder',
      statusText:
        'Rapporter räknar för närvarande finansierade, utskrivna och inlösta värdekoder. Utkast, kurslåsta register, fel och återtagna register ingår inte.',
    },
    reportActions: {
      title: 'Rapportåtgärder',
      subtitle: 'Förberett för utskrift, PDF-export, bildsparande och delning.',
      comingSoon: 'Rapportåtgärder kopplas in senare.',
    },
    localFirst: {
      title: 'Lokala rapporter först.',
      message:
        'Rapporter beräknas från register som sparats på den här enheten. Ingen serverspårning läggs till i detta steg.',
    },
    messages: {
      loadingReport: 'Läser in lokal rapportdata...',
      couldNotLoadReport: 'Kunde inte läsa in handlarrapportdata.',
    },
    connectedNotice:
      'Rapporter är nu kopplade till den här enhetens lokala värdekodsregister.',
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
