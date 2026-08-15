const sw = {
  common: {
    appName: 'Printa ya Vocha ya Recharge ya BCH',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'Vocha ya Kurecharge BCH',
    continue: 'Endelea',
    cancel: 'Ghairi',
    confirm: 'Thibitisha',
    close: 'Funga',
    back: 'Rudi',
    done: 'Imekamilika',
    loading: 'Inapakia...',
    error: 'Hitilafu',
    success: 'Imefanikiwa',
    warning: 'Onyo',
    yes: 'Ndiyo',
    no: 'Hapana',
  },

  language: {
    label: 'Lugha',
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
    eyebrow: 'App ya mfanyabiashara ya vocha',
    title: 'Bitcoin Cash Recharge',
    intro:
      'Uza vocha za recharge za Bitcoin Cash dukani, toa risiti, na mruhusu mteja ahamishe BCH kwenda kwenye pochi yake mwenyewe.',
    actionTitle: 'Unataka kufanya nini?',
    actionSubtitle: 'Chagua hatua inayofuata ya mfanyabiashara.',
    sellVoucher: 'Recharge',
    cashOutBch: 'Toa fedha',
    voucherHistory: 'Historia ya vocha',
    treasuryWallet: 'Pochi ya hazina',
    receiptPreview: 'Muonekano wa risiti',
    glance: {
      title: 'Kwa muhtasari',
      subtitle: 'Muhtasari wa shughuli za leo hadi sasa',
      topups: 'Recharge',
      cashOuts: 'Kutoa fedha',
      totalActions: 'Jumla ya hatua',
    },
    status: {
      receipts: {
        title: 'Risiti za vocha',
        text: 'Muonekano wa risiti kwenye kivinjari uko tayari.',
      },
      printer: {
        title: 'Printa ya joto',
        text: 'Muunganisho wa printa utaongezwa hatua inayofuata.',
      },
      cashHandling: {
        title: 'Ushughulikiaji wa fedha taslimu',
        text: 'Shughulikia QR za vocha zilizochapishwa kama fedha taslimu.',
      },
    },
  },

  sellForm: {
    customerCashAmount: 'Kiasi cha fedha cha mteja',
    salePreviewTitle: 'Muonekano wa mauzo',
    salePreviewSubtitle:
      'Bei ya moja kwa moja ya BCH itafungwa kwenye skrini ya ukaguzi.',
    topupAmount: 'Topup amount',
    customerToPay: 'Customer to pay',
    customerPays: 'Mteja analipa',
    serviceFee: 'Ada ya huduma',
    voucherValueBeforeQuote: 'Thamani ya vocha kabla ya bei kufungwa',
    quoteSource: 'Chanzo cha bei',
    lockedAfterReview: 'Itafungwa baada ya ukaguzi',
    reviewVoucher: 'Kagua vocha',
    viewHistory: 'Tazama historia',
  },

  issueProgress: {
    title: 'Inatoa vocha',
    subtitle: 'Inatayarisha rekodi ya vocha na risiti ya mteja.',
    safetyModeNotice:
      'Hali ya usalama wa maendeleo imewashwa. Unaweza kujaribu kutoa vocha huku utangazaji wa moja kwa moja ukiendelea kulindwa na vizuizi vilivyopo.',
  },

  sellPage: {
    hero: {
      eyebrow: 'Malipo ya mfanyabiashara',
      title: 'Uza vocha ya kurecharge BCH',
      intro:
        'Weka kiasi cha fedha cha mteja, kagua thamani ya BCH, toa vocha, na mwonyeshe mteja QR ya risiti.',
    },
    treasury: {
      title: 'Pochi ya hazina',
      subtitle: 'Pochi hii hutoa BCH kwa vocha zilizotolewa.',
      ready: 'Tayari',
      address: 'Anwani',
      balance: 'Salio',
      lastChecked: 'Ilikaguliwa mwisho',
      balanceNotChecked: 'Salio bado halijakaguliwa.',
      notSetUp: 'Haijasanidiwa',
      setUpBeforeUse:
        'Sanidi pochi ya hazina kabla ya matumizi halisi ya mfanyabiashara.',
      refreshBalance: 'Sasisha salio',
    },
    sale: {
      eyebrow: 'Vocha mpya',
      title: 'Weka kiasi cha mauzo',
      copy: 'Weka kiasi cha fedha anacholipa mteja. App itafunga bei ya BCH na kuonyesha skrini ya ukaguzi kabla ya kutoa vocha.',
    },
    issued: {
      title: 'Vocha imetolewa',
      subtitle:
        'Vocha imehifadhiwa na muonekano wa risiti uko tayari kwa mteja.',
      voucherReference: 'Rejea ya vocha',
      customerPaid: 'Mteja amelipa',
      bchLoaded: 'BCH iliyopakiwa',
      voucherAddress: 'Anwani ya vocha',
      issueAnother: 'Toa nyingine',
    },
    developerDetails: {
      title: 'Maelezo ya maendeleo',
      derivationIndex: 'Kielezo cha derivation',
      wifExportReady: 'Uhamishaji wa WIF uko tayari',
      platformFeePlan: 'Mpango wa ada ya jukwaa',
      recordStatus: 'Hali ya rekodi',
    },
    issueSteps: {
      quote: {
        label: 'Thibitisha bei iliyofungwa',
        description: 'Tumia bei ya BCH/GBP iliyofungwa kabla ya uthibitisho.',
      },
      wallet: {
        label: 'Tayarisha pochi ya vocha',
        description:
          'Tumia anwani ya vocha iliyotayarishwa kabla ya uthibitisho.',
      },
      funding: {
        label: 'Tayarisha mpango wa ufadhili',
        description:
          'Kagua mpango wa ufadhili uliotayarishwa huku utangazaji wa moja kwa moja ukiendelea kulindwa.',
      },
      store: {
        label: 'Hifadhi rekodi ya vocha',
        description: 'Hifadhi rekodi ya mauzo ya vocha kwenye kifaa.',
      },
    },
    receiptDialog: {
      title: 'Risiti ya vocha',
      subtitle: 'Muonekano wa risiti wakati wa kutoa',
    },
    safetyNotice:
      'Hali ya usalama wa maendeleo bado imewashwa. Muonekano wa mfanyabiashara unaendelea kuboreshwa, lakini utangazaji wa miamala ya moja kwa moja utaendelea kulindwa na vizuizi vilivyopo hadi ibadilishwe waziwazi.',
    messages: {
      treasuryNotSetUpWarning:
        'Pochi ya hazina haijasanidiwa. Unaweza kuendelea kukagua vocha, lakini ufadhili wa moja kwa moja utazuiwa hadi pochi ya hazina iwepo.',
      treasuryBalanceNotCheckedWarning:
        'Salio la hazina bado halijakaguliwa. Unaweza kuendelea kukagua vocha, lakini ufadhili wa moja kwa moja unahitaji ukaguzi mpya wa salio.',
      treasuryBalanceTooLow:
        'Salio la hazina ni dogo kwa vocha hii. Inahitajika: {required}. Inapatikana: {available}.',
      couldNotLoadTreasuryWallet:
        'Haikuwezekana kupakia hali ya pochi ya hazina.',
      treasuryBalanceRefreshed: 'Salio la hazina limesasishwa.',
      couldNotRefreshTreasuryBalance:
        'Haikuwezekana kusasisha salio la hazina. Kagua muunganisho kisha jaribu tena.',
      enterValidCashAmount: 'Weka kwanza kiasi halali cha fedha.',
      treasuryBalanceCheckTimedOut:
        'Ukaguzi wa salio la hazina umechukua muda mrefu.',
      treasuryBalanceCouldNotBeCheckedWarning:
        'Haikuwezekana kukagua salio la hazina. Unaweza kuendelea kukagua vocha, lakini ufadhili wa moja kwa moja unahitaji ukaguzi mpya wa salio.',
      voucherKeyExportFailed:
        'Ukaguzi wa uhamishaji wa funguo ya vocha umeshindikana. Ukaguzi unaweza kuendelea, lakini uchapishaji/kuhamisha fedha utahitaji uhamishaji wa WIF.',
      fallbackQuoteWarning:
        'Bei ya moja kwa moja haikupatikana, hivyo bei ya hivi karibuni iliyohifadhiwa inatumika. Kagua bei kwa makini kabla ya kutoa.',
      liveQuoteLocked: 'Bei ya moja kwa moja imefungwa kwa mafanikio.',
      couldNotPrepareReview:
        'Haikuwezekana kutayarisha ukaguzi wa vocha. Kagua muunganisho kisha jaribu tena.',
      noLockedQuote:
        'Hakuna bei iliyofungwa inayopatikana. Tafadhali kagua vocha tena.',
      noVoucherAddress:
        'Hakuna anwani ya vocha inayopatikana. Tafadhali kagua vocha tena.',
      couldNotIssueVoucher: 'Haikuwezekana kutoa vocha.',
    },
  },

  cashOutPage: {
    hero: {
      eyebrow: 'Badili BCH kuwa fedha taslimu',
      title: 'Badili BCH kuwa fedha taslimu',
      intro:
        'Weka kiasi cha fedha taslimu ambacho mteja anataka kupokea. App itahesabu kiasi cha BCH ambacho lazima atume kwenye hazina ya mfanyabiashara.',
    },
    actions: {
      treasuryWallet: 'Pochi ya hazina',
      voucherHistory: 'Historia ya vocha',
      reviewCashOut: 'Kagua kubadili fedha',
    },
    form: {
      cashAmountLabel: 'Kiasi cha fedha taslimu cha kulipa',
      paymentQrNotice:
        'Mteja atascan QR ya malipo ya BCH. Mchakato utakamilika tu baada ya BCH kugunduliwa kwenye pochi ya hazina.',
    },
    preview: {
      title: 'Muonekano wa kubadili fedha',
      subtitle: 'Kiasi cha mwisho cha BCH kitafungwa baada ya ukaguzi.',
      customerReceivesCash: 'Mteja anapokea fedha taslimu',
      serviceFeeSpread: 'Ada ya huduma / tofauti ya bei',
      customerSendsValue: 'Thamani anayotuma mteja',
      quoteSource: 'Chanzo cha bei',
      lockedAfterReview: 'Itafungwa baada ya ukaguzi',
    },
    paymentUri: {
      label: 'BCH fedha taslimu',
    },
    safetyNotice:
      'BCH ya mteja lazima igunduliwe kabla mfanyabiashara hajatoa fedha taslimu.',
    messages: {
      couldNotLoadTreasuryWallet: 'Haikuwezekana kupakia pochi ya hazina.',
      enterValidCashAmount: 'Weka kiasi halali cha fedha taslimu.',
      setUpTreasuryFirst:
        'Sanidi pochi ya hazina ya mfanyabiashara kabla ya kutayarisha kubadili fedha.',
      fallbackQuoteWarning:
        'Bei mbadala imetumika. Kagua kiwango cha bei kwa makini kabla ya kuendelea.',
      pricingUnavailable:
        'Bei haipatikani kwa sasa. Kagua muunganisho kisha jaribu tena.',
      couldNotPrepareCashOut: 'Haikuwezekana kutayarisha kubadili fedha.',
      receiptPrintingPending:
        'Uchapishaji wa risiti utaunganishwa baada ya ugunduzi wa malipo kuongezwa.',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: 'Kagua toa pesa',
      receivedTitle: 'BCH imepokelewa',
      reviewSubtitle: 'Mwambie mteja ascan QR code na atume BCH inayohitajika.',
      receivedSubtitle:
        'Malipo ya mteja yamegunduliwa kwenye hazina ya mfanyabiashara.',
    },
    quoteStatus: {
      fallback:
        'Bei mbadala imetumika. Kagua kiwango cha bei kwa makini kabla ya kuendelea.',
      liveLocked: 'Bei ya moja kwa moja imefungwa kwa mafanikio.',
    },
    breakdown: {
      title: 'Mchanganuo wa kutoa fedha',
      subtitle: 'Malipo ya mteja na BCH inayohitajika',
      cashOutAmount: 'Kiasi cha kutoa fedha',
      cashOutAmountNote: 'Fedha taslimu zinazolipwa kwa mteja',
      serviceFeeSpread: 'Ada ya huduma / tofauti ya bei',
      cashOutTotal: 'Jumla ya kutoa fedha',
      cashOutTotalNote: 'Mteja anatuma jumla hii ya thamani kwa BCH',
    },
    summary: {
      cashCustomerReceives: 'Fedha taslimu anazopokea mteja',
      customerSends: 'Mteja anatuma',
      fiatEquivalentSent: 'Thamani sawa ya fiat iliyotumwa',
      serviceFeeSpread: 'Ada ya huduma / tofauti ya bei',
    },
    paymentQr: {
      title: 'QR ya malipo ya mteja',
      subtitle:
        'Mwambie mteja ascan QR code hii kwa pochi yake ya BCH. Subiri malipo ya BCH yafike kwenye pochi yako ya hazina kabla ya kutoa fedha taslimu.',
      qrAlt: 'QR ya malipo ya BCH kwa kubadili fedha',
      qrUnavailable: 'QR haipatikani',
    },
    paymentDetails: {
      amountToSend: 'Kiasi cha kutuma',
      treasuryReceivingAddress: 'Anwani ya kupokea ya hazina',
      tapToRevealAddress: 'Gusa ili kuona anwani kamili',
      paymentUri: 'URI ya malipo',
    },
    paymentUri: {
      label: 'BCH fedha taslimu',
    },
    details: {
      orderDetailsTitle: 'Maelezo ya oda',
      orderDetailsCaption: 'Bonyeza hapa kuona maelezo ya oda ya kutoa fedha',
      reference: 'Rejea',
      marketRate: 'Bei ya soko',
      quoteSource: 'Chanzo cha bei',
      fallbackBadge: 'mbadala',
      quoteTime: 'Muda wa bei',
      quoteExpires: 'Bei inaisha',
      status: 'Hali',
      bchReceived: 'BCH iliyopokelewa',
      transactionId: 'ID ya muamala',
      detected: 'Imegunduliwa',
    },
    success: {
      title: 'BCH imepokelewa',
      nowGiveCustomer: 'Sasa mpe mteja',
      cash: 'fedha taslimu',
    },
    actions: {
      copyAddress: 'Nakili anwani',
      copyPaymentUri: 'Nakili URI ya malipo',
      closeReview: 'Ghairi kutoa fedha na funga',
      printReceipt: 'Chapisha risiti',
    },
    messages: {
      treasuryAddressCopied: 'Anwani ya hazina imenakiliwa.',
      paymentUriCopied: 'URI ya malipo imenakiliwa.',
      copyFailed: 'Kunakili kumeshindikana.',
    },
    quoteSources: {
      developmentQuote: 'Bei ya maendeleo',
      cachedQuote: 'Bei iliyohifadhiwa',
      manualQuote: 'Bei ya mwongozo',
      unknown: 'Haijulikani',
    },
  },

  saleConfirm: {
    title: 'Kagua vocha',
    subtitle:
      'Thibitisha malipo ya mteja, kiasi cha BCH, na maelezo ya risiti kabla ya kutoa vocha hii.',
    quoteStatus: {
      fallback:
        'Bei ya moja kwa moja haikupatikana, hivyo bei ya hivi karibuni iliyohifadhiwa inatumika. Kagua bei kwa makini kabla ya kutoa.',
      liveLocked: 'Bei ya moja kwa moja imefungwa kwa mafanikio.',
    },
    summary: {
      customerPays: 'Mteja analipa',
      voucherValue: 'Thamani ya vocha',
      bchLoaded: 'BCH iliyopakiwa',
      serviceFee: 'Ada ya huduma',
    },
    details: {
      marketRate: 'Bei ya soko',
      quoteSource: 'Chanzo cha bei',
      fallbackBadge: 'mbadala',
      quoteTime: 'Muda wa bei',
      quoteExpires: 'Bei inaisha',
      treasuryBalance: 'Salio la hazina',
    },
    fundingReadiness: {
      ready:
        'Ukaguzi wa maandalizi ya ufadhili umepita. Utangazaji wa miamala ya moja kwa moja bado unalindwa na kizuizi cha sasa.',
      notReady: 'Ufadhili wa moja kwa moja bado hauko tayari.',
    },
    safetyNotice:
      'Hali ya usalama wa maendeleo imewashwa. Skrini hii inaweza kutoa rekodi za vocha na muonekano wa risiti, huku utangazaji wa moja kwa moja ukiendelea kulindwa hadi uwezeshwe waziwazi.',
    actions: {
      issueVoucher: 'Toa vocha',
    },
    quoteSources: {
      developmentQuote: 'Bei ya maendeleo',
      cachedQuote: 'Bei iliyohifadhiwa',
    },
  },

  historyPage: {
    hero: {
      eyebrow: 'Rekodi za vocha',
      title: 'Historia ya vocha',
      intro:
        'Kagua vocha za BCH zilizotolewa, angalia hali ya ukombozi, na tumia muonekano wa risiti wa maendeleo wakati maandalizi ya majaribio ya printa yanaendelea.',
    },
    actions: {
      sellVoucher: 'Uza vocha',
    },
    summary: {
      totalVouchers: 'Jumla ya vocha',
      openActive: 'Zilizofunguliwa / hai',
      sweptRedeemed: 'Zilizohamishwa / kukombolewa',
    },
    records: {
      title: 'Rekodi za vocha',
      subtitle:
        'Taarifa za vocha za mteja zinaonekana kwanza. Zana za kiufundi za ufadhili na majaribio zinabaki ndani ya kila rekodi.',
    },
    safetyNotice:
      'Hali ya usalama wa maendeleo bado imewashwa. Muonekano wa risiti na zana za ukombozi zinapatikana kwa majaribio kabla ya kuunganisha mtiririko wa mwisho wa printa.',
    messages: {
      couldNotLoadVoucherRecords: 'Haikuwezekana kupakia rekodi za vocha.',
      createdTestVoucher: 'Vocha ya majaribio {serial} imeundwa.',
      couldNotCreateTestVoucher: 'Haikuwezekana kuunda vocha ya majaribio.',
      markedManualRedemption:
        '{serial} imewekwa alama kwa mkono kama imehamishwa/kukombolewa.',
      couldNotFindVoucherRecordToUpdate:
        'Haikuwezekana kupata rekodi ya vocha ya kusasisha.',
      couldNotMarkVoucherAsManuallyRedeemed:
        'Haikuwezekana kuweka vocha alama kuwa imekombolewa kwa mkono.',
      clearedManualRedemption:
        'Hali ya ukombozi wa mkono imeondolewa kwa {serial}.',
      couldNotClearManualRedemption:
        'Haikuwezekana kuondoa hali ya ukombozi wa mkono.',
      couldNotFindVoucherRecordToCheck:
        'Haikuwezekana kupata rekodi ya vocha ya kukagua.',
      checkedOnChainRedemptionStatus:
        'Hali ya ukombozi kwenye chain imekaguliwa kwa {serial}: {status}.',
      couldNotUpdateVoucherRedemptionDetectionResult:
        'Haikuwezekana kusasisha matokeo ya ugunduzi wa ukombozi wa vocha.',
      couldNotCheckVoucherRedemptionStatus:
        'Haikuwezekana kukagua hali ya ukombozi wa vocha.',
      clearedAllLocalTestVoucherRecords:
        'Rekodi zote za vocha za majaribio za ndani zimeondolewa.',
      couldNotClearVoucherRecords: 'Haikuwezekana kuondoa rekodi za vocha.',
    },
  },

  historyList: {
    empty: {
      title: 'Bado hakuna rekodi za vocha',
      text: 'Vocha zilizotolewa zitaonekana hapa baada ya mauzo kukamilika.',
    },
    issuedDate: 'Imetolewa {date}',
    summary: {
      customerPaid: 'Mteja amelipa',
      bchLoaded: 'BCH iliyopakiwa',
      redemption: 'Ukombozi',
      quote: 'Bei',
    },
    address: {
      voucherAddress: 'Anwani ya vocha',
      notDerivedYet: 'Bado haijatengenezwa',
    },
    actions: {
      previewReceipt: 'Angalia risiti',
      checkRedemption: 'Kagua ukombozi',
      checkOnChainStatus: 'Kagua hali ya on-chain',
      markAsManuallySwept: 'Weka alama kuwa imehamishwa kwa mkono',
      clearManualSweepStatus: 'Ondoa hali ya uhamisho wa mkono',
    },
    status: {
      redeemed: 'Imekombolewa',
      funded: 'Imefadhiliwa',
      error: 'Hitilafu',
      issued: 'Imetolewa',
    },
    redemption: {
      manualSwept: 'Imehamishwa kwa mkono',
      swept: 'Imehamishwa',
      funded: 'Imefadhiliwa',
      unfunded: 'Haijafadhiliwa',
      notChecked: 'Haijakaguliwa',
    },
    redemptionTools: {
      label: 'Zana za ukombozi',
      caption: 'Hali ya uhamisho wa mkono na ukaguzi wa ukombozi wa on-chain',
      manualMarked:
        'Vocha imewekwa alama kwa mkono kama imehamishwa/kukombolewa.',
      notCheckedYet: 'Hali ya ukombozi bado haijakaguliwa.',
      status: 'Hali',
      sweepTransactionId: 'ID ya muamala wa uhamisho',
      note: 'Dokezo',
      redeemed: 'Imekombolewa',
      detectedStatus: 'Hali iliyogunduliwa',
      detectedBalance: 'Salio lililogunduliwa',
      detectedUtxos: 'UTXO zilizogunduliwa',
      checked: 'Imekaguliwa',
      sweepTxidOptional: 'TXID ya uhamisho si lazima',
      noteOptional: 'Dokezo si lazima',
    },
    quoteSources: {
      cached: 'Iliyohifadhiwa',
      manual: 'Ya mwongozo',
      unknown: 'Haijulikani',
    },
  },

  treasuryPage: {
    common: {
      notConfigured: 'Haijasanidiwa',
      valid: 'Halali',
      notReady: 'Haiko tayari',
      validNotRequired: 'Halali / haihitajiki',
    },
    hero: {
      eyebrow: 'Fedha za mfanyabiashara',
      title: 'Pochi ya hazina',
      intro:
        'Dhibiti pochi ya BCH inayotumika kufadhili risiti za vocha za wateja.',
    },
    walletStatus: {
      title: 'Hali ya pochi',
      subtitle: 'Kagua kama pochi ya hazina ya mfanyabiashara iko tayari.',
      setupBanner: 'Pochi ya hazina imesanidiwa.',
      notSetupBanner: 'Bado hakuna pochi ya hazina iliyosanidiwa.',
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
      title: 'Fedha taslimu zilizopo',
      subtitle:
        'Kifuatiliaji cha hiari cha fedha taslimu kwa recharge, kutoa fedha, na ripoti za ndani.',
      setUp: 'Sanidi',
      notSetUp: 'Haijasanidiwa',
      notSetUpPrompt:
        'Fuatilia fedha taslimu zilizopo sasa dukani au kwenye sanduku la fedha.',
      currentBalance: 'Fedha taslimu zilizopo sasa',
      readyForManualTracking:
        'Tayari kwa ufuatiliaji wa fedha taslimu kwa mkono.',
      lastUpdated: 'Imesasishwa mwisho: {date}',
      currency: 'Sarafu',
      actions: {
        setUp: 'Sanidi',
        addCash: 'Ongeza fedha',
        withdrawCash: 'Toa fedha',
        clear: 'Futa fedha taslimu zilizopo',
        confirmClear: 'Futa fedha taslimu zilizopo',
        saveSetup: 'Hifadhi',
        saveAdd: 'Hifadhi',
        saveWithdraw: 'Hifadhi',
      },
      dialog: {
        setupTitle: 'Sanidi fedha taslimu zilizopo',
        setupSubtitle:
          'Weka kiasi cha kuanzia cha fedha taslimu kilichopo sasa.',
        addTitle: 'Ongeza fedha',
        addSubtitle:
          'Rekodi fedha taslimu za ziada zilizoongezwa kwenye sanduku la fedha la duka.',
        withdrawTitle: 'Toa fedha',
        withdrawSubtitle:
          'Rekodi fedha taslimu zilizotolewa kwenye sanduku la fedha la duka.',
        currentCash: 'Fedha taslimu zilizopo sasa',
        enteredAmount: 'Kiasi kilichowekwa',
        newCash: 'Fedha taslimu mpya zilizopo',
        startingAmount: 'Kiasi cha kuanzia',
        amountToAdd: 'Kiasi cha kuongeza',
        amountToWithdraw: 'Kiasi cha kutoa',
        noteOptional: 'Dokezo si lazima',
      },
      clearDialog: {
        title: 'Futa fedha taslimu zilizopo?',
        message:
          'Hii inarudisha fedha taslimu zilizopo kwenye hali ya kutosanidiwa. Recharge na kutoa fedha vitaendelea kufanya kazi.',
        warning:
          'Salio linalofuatiliwa sasa ni {amount}. Kufuta kunaondoa salio hili linalotumika kwenye ukurasa wa pochi ya hazina.',
        clearNote: 'Fedha taslimu zilizopo zimefutwa kwa mkono.',
      },
      transactions: {
        link: 'Miamala',
        title: 'Miamala',
        subtitle: 'Mabadiliko ya fedha taslimu yaliyobadilisha salio hili.',
        emptyTitle: 'Bado hakuna miamala',
        emptySubtitle: 'Mabadiliko ya fedha taslimu yataonekana hapa.',
        showing: 'Inaonyesha {count} kati ya {total}',
        showMore: 'Onyesha 10 zaidi',
        viewOlder: 'Tazama miamala ya zamani',
        backToLatest: 'Rudi kwenye miamala ya karibuni',
        olderPage: 'Miamala ya zamani · ukurasa {page}',
        detailTitle: 'Maelezo ya mabadiliko ya fedha',
        type: 'Aina',
        date: 'Tarehe',
        cashAmount: 'Kiasi cha fedha taslimu',
        balanceAfter: 'Salio baada ya hapo',
        reference: 'Rejea',
        bchAddress: 'Anwani ya BCH',
        bchTransaction: 'Muamala wa BCH',
        note: 'Dokezo',
        noRelatedRecord: 'Rekodi inayohusiana haijapatikana',
        types: {
          setup: 'Usanidi',
          topup: 'Recharge',
          cashOut: 'Kutoa fedha',
          cashAdded: 'Fedha zimeongezwa',
          withdrawal: 'Utoaji',
          cleared: 'Imefutwa',
        },
        amount: {
          reset: 'Imerejeshwa kuwa {amount}',
        },
      },
      errors: {
        enterValidAmount: 'Weka kiasi halali cha fedha taslimu.',
        enterPositiveAmount: 'Weka kiasi kikubwa kuliko sifuri.',
        withdrawTooMuch: 'Huwezi kutoa fedha zaidi ya zilizopo.',
      },
      messages: {
        couldNotLoad:
          'Haikuwezekana kupakia taarifa za fedha taslimu zilizopo.',
        setUp: 'Fedha taslimu zilizopo zimesanidiwa.',
        added: 'Fedha zimeongezwa kwenye fedha taslimu zilizopo.',
        withdrawn: 'Fedha zimetolewa kwenye fedha taslimu zilizopo.',
        cleared: 'Fedha taslimu zilizopo zimefutwa.',
        couldNotSave: 'Haikuwezekana kuhifadhi mabadiliko ya fedha taslimu.',
        couldNotClear: 'Haikuwezekana kufuta fedha taslimu zilizopo.',
      },
    },
    summary: {
      status: 'Hali',
      ready: 'Tayari',
      notSetUp: 'Haijasanidiwa',
      balance: 'Salio',
      notChecked: 'Haijakaguliwa',
      utxos: 'UTXO',
      lastChecked: 'Ilikaguliwa mwisho',
      notCheckedYet: 'Bado haijakaguliwa',
      balanceUnavailable: 'Fiat balance unavailable',
    },
    details: {
      treasuryAddress: 'Anwani ya hazina',
      created: 'Imeundwa',
      updated: 'Imesasishwa',
    },
    actions: {
      sellVoucher: 'Uza vocha',
      refreshBalance: 'Sasisha salio',
      walletReady: 'Pochi ya hazina iko tayari',
      createWallet: 'Unda pochi',
      hideSeed: 'Ficha seed',
      revealSeedBackup: 'Onyesha nakala ya seed',
      clearRestoreTool: 'Ondoa zana ya kurejesha',
      checkSeed: 'Kagua seed',
      importCheckedSeed: 'Leta seed iliyokaguliwa',
      clearTreasuryWallet: 'Ondoa pochi ya hazina',
      create: 'Create',
    },
    utxoDetails: {
      label: 'Maelezo ya UTXO',
      caption: 'Matokeo ya hazina ya juu ya kusoma tu',
      description:
        'Hizi ni output ambazo hazijatumika zilizogunduliwa kwa pochi ya hazina. Sehemu hii ni ya kusoma tu.',
      noneDetected: 'Hakuna UTXO za hazina zilizogunduliwa.',
      utxoNumber: 'UTXO {number}',
      value: 'Thamani',
      tx: 'Tx',
      outputIndex: 'Kielezo cha output',
    },
    fundingConfig: {
      label: 'Usanidi wa ufadhili',
      caption:
        'Utayari wa anwani za ada kwa ufadhili wa hazina wa moja kwa moja',
      platformFeeValid: 'Anwani ya ada ya jukwaa imesanidiwa na ni halali.',
      platformFeeInvalid:
        'Anwani ya ada ya jukwaa imesanidiwa lakini si halali: {error}',
      platformFeeNotConfigured:
        'Anwani ya ada ya jukwaa haijasanidiwa. Ufadhili wa moja kwa moja lazima ubaki umezimwa.',
      bufferReserveValid: 'Anwani ya akiba ya kinga imesanidiwa na ni halali.',
      bufferReserveOptional:
        'Output ya akiba ya kinga ni ya hiari kwa MVP na haihitajiki kwa sasa.',
      platformFeeAddress: 'Anwani ya ada ya jukwaa',
      platformFeeAddressStatus: 'Hali ya anwani ya ada ya jukwaa',
      bufferReserveAddress: 'Anwani ya akiba ya kinga',
      bufferReserveAddressStatus: 'Hali ya anwani ya akiba ya kinga',
      configChecked: 'Usanidi umekaguliwa',
    },
    walletBackup: {
      label: 'Nakala ya pochi',
      caption: 'Nakala nyeti ya seed kwa maendeleo na urejeshaji',
      warning:
        'Mtu yeyote aliye na seed phrase hii anaweza kudhibiti BCH ya hazina. Ionyeshe tu kwenye mazingira binafsi na salama.',
      backupStatus: 'Hali ya nakala',
      seedLoaded: 'Seed imepakiwa kwa nakala',
      seedNotRevealed: 'Seed haijaonyeshwa',
      seedPhrase: 'Seed phrase',
      exported: 'Imehamishwa',
    },
    restore: {
      label: 'Rejesha / leta pochi',
      caption: 'Kagua au leta seed phrase ya hazina',
      warning:
        'Kuleta seed kutabadilisha pochi ya hazina ya sasa ya ndani. Usiweke seed phrase ya matumizi halisi kwenye toleo hili la maendeleo.',
      seedInputLabel: 'Seed phrase ya hazina ya kukagua/kuleta',
      matchesCurrentAddress: 'Seed hii inatoa anwani ya sasa ya hazina.',
      differentAddress: 'Seed hii inatoa anwani tofauti ya hazina.',
      importedIntoLocalStorage:
        'Pochi ya hazina imeletwa kwenye hifadhi ya ndani.',
      derivedAddress: 'Anwani iliyotolewa',
      currentTreasuryAddress: 'Anwani ya sasa ya hazina',
      noCurrentTreasuryWallet: 'Hakuna pochi ya hazina ya sasa',
      checked: 'Imekaguliwa',
      importedAddress: 'Anwani iliyoletwa',
      replacedExistingWallet: 'Imebadilisha pochi iliyokuwepo',
      imported: 'Imeletwa',
    },
    dangerZone: {
      label: 'Eneo la hatari',
      caption: 'Ondoa pochi ya hazina ya ndani',
      warning:
        'Kuondoa pochi ya hazina ya ndani kutaondoa data ya pochi ya hazina iliyohifadhiwa kwenye kifaa hiki. Fanya hivi tu ukiwa na uhakika kuwa pochi imehifadhiwa au haitahitajika tena.',
    },
    safetyNotice:
      'Hali ya usalama wa maendeleo bado imewashwa. Zana za hazina zinapatikana kwa majaribio wakati matumizi halisi ya mfanyabiashara yanaandaliwa.',
    messages: {
      couldNotLoadWalletInfo:
        'Haikuwezekana kupakia taarifa za pochi ya hazina.',
      createdWallet: 'Pochi ya hazina imeundwa.',
      couldNotCreateWallet: 'Haikuwezekana kuunda pochi ya hazina.',
      clearedWallet: 'Pochi ya hazina imeondolewa.',
      couldNotClearWallet: 'Haikuwezekana kuondoa pochi ya hazina.',
      balanceRefreshed: 'Salio la hazina limesasishwa.',
      couldNotRefreshBalance:
        'Haikuwezekana kusasisha salio la hazina. Kagua muunganisho kisha jaribu tena.',
      seedBackupLoaded: 'Nakala ya seed ya hazina imepakiwa.',
      couldNotLoadBackupInfo:
        'Haikuwezekana kupakia taarifa za nakala ya hazina.',
      seedBackupHidden: 'Nakala ya seed ya hazina imefichwa.',
      restoreSeedCheckCompleted:
        'Ukaguzi wa seed ya kurejesha hazina umekamilika.',
      couldNotCheckRestoreSeed:
        'Haikuwezekana kukagua seed ya kurejesha hazina.',
      checkSeedBeforeImporting:
        'Kagua seed phrase ya hazina kabla ya kuiingiza.',
      importedCheckedSeed:
        'Seed ya hazina iliyokaguliwa imeletwa kwenye hifadhi ya ndani.',
      couldNotImportSeed: 'Haikuwezekana kuleta seed ya hazina.',
      restoreToolCleared: 'Zana ya kurejesha hazina imeondolewa.',
    },
  },

  treasuryTopUpQr: {
    title: 'QR ya recharge ya hazina',
    subtitle:
      'Scan QR code hii kutoka kwenye pochi nyingine ya BCH ili kufanya recharge ya pochi ya hazina ya mfanyabiashara.',
    qrAlt: 'QR code ya recharge ya hazina',
    qrUnavailable: 'QR code haipatikani.',
    treasuryAddress: 'Anwani ya pochi ya hazina',
    paymentUri: 'URI ya malipo ya BCH',
    qrGenerated: 'QR imeundwa',
    copy: 'Nakili',
    copyAddress: 'Nakili anwani',
    copyPaymentUri: 'Nakili URI ya malipo',
    tapQrToCopy: 'Gusa QR ili kunakili anwani ya pochi.',
    watching: 'Inasubiri BCH inayoingia...',
    watchingError:
      'Haikuwezekana kufuatilia BCH inayoingia. Bado unaweza kunakili anwani na kusasisha salio baada ya kutuma.',
    receivedTitle: 'Imepokelewa',
    receivedSubtitle:
      'BCH inayoingia imegunduliwa kwenye pochi yako ya hazina. Funga dirisha hili ili kurudi kwenye salio la pochi lililosasishwa.',
    receivedAmount: 'Imepokelewa',
    receivedTxid: 'Muamala',
    uriLabel: 'Hazina ya vocha za BCH',
    uriMessage: 'Recharge pochi ya hazina ya mfanyabiashara',
    addressCopied: 'Anwani ya hazina imenakiliwa.',
    uriCopied: 'URI ya malipo ya hazina imenakiliwa.',
    copyFailed: 'Haikuwezekana kunakili kwenye clipboard.',
  },
  pinLock: {
    brand: {
      title: 'Bitcoin Cash Topup',
      subtitle: 'Secure merchant access',
      logoAlt: 'Bitcoin Cash logo',
    },
    initializing: {
      title: 'Opening securely',
      message: 'Checking the app access lock on this device.',
    },
    privacy: {
      message: 'App content is hidden while inactive.',
    },
    setup: {
      eyebrow: 'First-time setup',
      title: 'Set your PIN',
      message:
        'Please choose a memorable PIN. This will be used to open the app.',
      lengthLabel: 'Choose PIN length',
      lengthHelp: 'Choose a 4, 5, or 6-digit PIN that you can remember.',
      inputLabel: 'Enter your new PIN',
      confirmEyebrow: 'Confirm PIN',
      confirmTitle: 'Enter it again',
      confirmMessage:
        'Enter the same PIN again to make sure it was entered correctly.',
      confirmInputLabel: 'Confirm your new PIN',
      continue: 'Continue',
      setPin: 'Set PIN',
      chooseAgain: 'Choose a different PIN',
    },
    success: {
      eyebrow: 'Setup complete',
      title: 'Your PIN has been set up.',
      message: 'Bitcoin Cash Topup is ready to open.',
      openApp: 'Open App',
    },
    unlock: {
      eyebrow: 'Merchant access',
      title: 'Welcome back',
      message: 'Enter your PIN to open Bitcoin Cash Topup.',
      timeoutMessage:
        'The app was inactive for three hours or more. Enter your PIN to continue.',
      inputLabel: 'Enter your {length}-digit PIN',
      openApp: 'Open App',
    },
    errors: {
      invalidFormat: 'Enter the full PIN using numbers only.',
      pinMismatch: 'The PINs do not match. Please try again.',
      incorrectPin: 'That PIN is not correct. Please try again.',
      alreadyConfigured: 'A PIN is already configured on this device.',
      cooldown: 'Too many incorrect attempts. Try again in {seconds} seconds.',
    },
    forgotten: {
      show: 'Forgotten your PIN?',
      hide: 'Hide PIN help',
      title: 'There is no PIN recovery for this version.',
      message:
        'Clearing the app data or reinstalling may reset the PIN, but it can also remove the local Treasury Wallet, history, and other app data. Make sure wallet recovery information is backed up before taking that action.',
    },
    storageError: {
      eyebrow: 'Secure access unavailable',
      title: 'The app could not read its PIN information',
      message:
        'Restart the app and try again. Access remains blocked while the secure PIN record cannot be checked.',
      warning:
        'Do not clear the app data unless the Treasury Wallet and other important local information have been safely backed up.',
      debugTitle: 'Debug details',
      reload: 'Restart App',
    },
    preview: {
      badge: 'Design preview',
      message:
        'This is a display-only preview. It does not change or replace the PIN already saved on this device.',
      open: 'Preview first-time PIN screen',
      close: 'Close setup preview',
      disabledAction: 'Preview only',
    },
    footer: 'Practical protection for merchant access on this device.',
  },

  appSettings: {
    hero: {
      eyebrow: 'Merchant setup',
      title: 'App Settings',
      intro:
        'Manage your business details and how Bitcoin Cash Topup works on this device.',
    },

    sections: {
      business: 'Business',
      appSecurity: 'App & Security',
      hardware: 'Hardware',
      regional: 'Regional',
      toolsInformation: 'Tools & Information',
      help: 'Help',
    },

    items: {
      yourBusiness: {
        title: 'Your Business',
        subtitle: 'Add your business name and merchant details.',
        savedSubtitle: 'Business name saved on this device.',
      },
      yourWallets: {
        title: 'Your Wallets',
        subtitle: 'Manage wallet-related settings and addresses.',
      },
      privacySecurity: {
        title: 'Privacy & Security',
        subtitle: 'Manage PIN, privacy, and app access protection.',
      },
      preferences: {
        title: 'Preferences',
        subtitle: 'Choose how the app behaves for your business.',
      },
      backupStorage: {
        title: 'Backup and Storage',
        subtitle: 'Manage local data, backups, and storage options.',
      },
      printerSettings: {
        title: 'Printer Settings',
        subtitle: 'Configure receipt printing and printer behaviour.',
      },
      devices: {
        title: 'Devices',
        subtitle: 'Manage connected and trusted devices.',
      },
      language: {
        title: 'Language',
        subtitle: 'Choose the language used throughout the app.',
      },
      currencies: {
        title: 'Currencies',
        subtitle: 'Choose currencies used for merchant activity.',
      },
      transactionChecker: {
        title: 'Transaction Checker',
        subtitle: 'Tools for checking Bitcoin Cash transactions.',
      },
      appInfo: {
        title: 'App Info',
        subtitle: 'View app version, updates, and release information.',
      },
      contactUs: {
        title: 'Contact us',
        subtitle: 'Get in touch with Bitcoin Cash Topup.',
      },
      faq: {
        title: 'FAQ',
        subtitle: 'Find answers to common questions.',
      },
      privacyPolicy: {
        title: 'Privacy Policy',
        subtitle: 'Read how app and merchant data are handled.',
      },
    },

    navigation: {
      backToSettings: 'Back to App Settings',
    },

    business: {
      eyebrow: 'Business settings',
      title: 'Your Business',
      subtitle: 'Manage the business details saved on this device.',
      cardTitle: 'Business details',
      cardSubtitle:
        'Add the name customers know your business by. This can be used to personalise receipts, reports, and other merchant areas in future.',
      nameLabel: 'Business name',
      nameHint: 'For example, Corner Shop',
      save: 'Save Business Name',
      saved: 'Business name saved.',
      saveFailed: 'Could not save the business name.',
    },
    version: {
      appName: 'Bitcoin Cash Topup',
      loading: 'Checking app version...',
      webPreview: 'Web preview',
      unavailable: 'Version unavailable',
      versionAndBuild: 'Version {version} · Build {build}',
    },

    comingSoon: {
      eyebrow: 'App Settings',
      title: 'Coming soon',
      message: '{section} settings will be added here in a future update.',
    },
  },

  layout: {
    brand: {
      title: 'Bitcoin Cash Recharge',
      subtitle: 'App ya mfanyabiashara',
    },
    drawer: {
      subtitle: 'App ya mfanyabiashara ya vocha',
    },
    navigation: {
      openMenu: 'Fungua menyu ya urambazaji',
      closeMenu: 'Funga menyu ya urambazaji',
    },
    status: {
      treasury: 'Hazina',
      printerPending: 'Printa inasubiri',
      devMode: 'Hali ya maendeleo',
    },
    sections: {
      main: 'Kuu',
      merchantSetup: 'Usanidi wa mfanyabiashara',
      help: 'Msaada',
      advanced: 'Ya juu',
    },
    items: {
      home: 'Nyumbani',
      sellVoucher: 'Uza vocha ya recharge',
      cashOut: 'BCH kuwa fedha taslimu',
      voucherHistory: 'Historia ya vocha',
      merchantReports: 'Ripoti za mfanyabiashara',
      treasuryWallet: 'Pochi ya hazina',
      printerSetup: 'Usanidi wa printa',
      appSettings: 'Mipangilio ya app',
      checkForUpdates: 'Check for Updates',
      checkForUpdatesCaption: 'App version and download status',
      updateAvailable: 'Update Available',
      howToSellVoucher: 'Jinsi ya kuuza vocha',
      howToCashOut: 'How to Cash-out',
      howCustomersRedeem: 'Jinsi wateja wanavyokomboa',
      faq: 'Maswali ya mara kwa mara',
      support: 'Msaada',
      communities: 'Jumuiya',
      socialMedia: 'Mitandao ya kijamii',
      developerTools: 'Zana za maendeleo',
    },
    common: {
      comingSoon: 'Inakuja hivi karibuni',
    },
    update: {
      checking: 'Checking for updates...',
      upToDateTitle: 'You are up to date',
      upToDateMessage: 'This device is running the latest public release.',
      updateAvailableTitle: 'Update available',
      updateAvailableMessage:
        'A newer Bitcoin Cash Topup release is ready to download.',
      newBadge: 'New',
      downloadUpdate: 'Download Update',
      installationTitle: 'Installation notes',
      installationStepOpen: 'The download page will open in your browser.',
      installationStepAsset:
        'Download the latest Android APK from the Assets section.',
      installationStepWarning:
        'Android may show a safety warning because BCH Topups is installed outside Google Play.',
      installationStepConfirm:
        'Only continue if the page is the official Bitcoin Cash Topup release page.',
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

      topupCashCollected: 'Topup Cash Collected',
      topupCashCollectedCaption:
        'Total cash collected from Topup customers, including service fees.',

      topupServiceFees: 'Topup Service Fees',
      topupServiceFeesCaption:
        'Total service fees charged on completed Topups.',

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
      topupValueLoaded: 'Topup value loaded',
      topupServiceFees: 'Topup service fees',
      merchantFeeShare: 'Known merchant fee share',
      platformFeeShare: 'Known platform fee share',
      legacyFeeSplits: 'Legacy fee splits unavailable',
      cashOutsCompleted: 'Cash-outs completed',
      totalBchMovement: 'Total BCH movement',
      flowText:
        'Topup service fees are shown separately from the value loaded. Merchant and platform fee shares are only included where the stored record explicitly identifies the split.',

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
      title: 'Muonekano kabla ya kuchapisha',
      subtitle: 'Muonekano wa ripoti ya mfanyabiashara ya A4',
      pdfTitle: 'Hamisha PDF',
      pdfSubtitle: 'Hifadhi ripoti hii ya mfanyabiashara ya A4 kama PDF.',
      savePdf: 'Hifadhi kama PDF',
      imageTitle: 'Save Image',
      imageSubtitle: 'Save this A4 merchant report as a PNG image.',
      saveImage: 'Save Image',
      savingImage: 'Saving image…',
      imageSaved: 'Image saved',
      imageSavedAndroidCaption: 'Saved to Pictures/Bitcoin Cash Topups.',
      imageSavedDesktopCaption: 'Downloaded as a PNG image.',
      imageSaveFailed: 'Could not save image',
      imageSaveFailedCaption: 'Please try again.',
      shareTitle: 'Share report',
      shareSubtitle: 'Review the report before sharing it as a PNG image.',
      share: 'Share',
      shareFailed: 'Could not share report',
      shareFailedCaption: 'Please try again.',
      shareSubject: 'A Bitcoin Cash Topups Report has been shared with you',
      shareBody:
        'Please see the attached Bitcoin Cash Topups Business Report for {period}.',
      close: 'Funga',
      print: 'Chapisha',
      reportTitle: 'Ripoti ya mfanyabiashara',
      selectedRange: 'Kipindi kilichochaguliwa',
      generated: 'Imeundwa',
      atAGlance: 'Kwa muhtasari',
      topupsVsCashOuts: 'Recharge dhidi ya kutoa fedha',
      currencyBreakdown: 'Mgawanyo kwa sarafu',
      currency: 'Sarafu',
      topups: 'Recharge',
      cashOuts: 'Kutoa fedha',
      totalFiat: 'Jumla ya fiat',
      noCurrencyData: 'Bado hakuna shughuli ya sarafu katika kipindi hiki.',
      localNotice:
        'Imeundwa ndani ya kifaa kutoka kwenye rekodi zilizohifadhiwa kwenye kifaa hiki. Hakuna data ya ripoti inayotumwa kwenye seva.',
    },
    connectedNotice:
      'Ripoti sasa zimeunganishwa na rekodi za ndani za recharge na kutoa fedha kwenye kifaa hiki.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'Thamani iliyopakiwa',
      scanToRedeem: 'Scan ili kukomboa',
      reference: 'Rejea',
      issued: 'Imetolewa',
      customerPaid: 'Mteja amelipa',
      loaded: 'Imepakiwa',
      voucherAddress: 'Anwani ya vocha',
    },
    privateKeyWarning:
      'Muonekano wa maendeleo pekee. Risiti hii ina QR ya private key inayoweza kuhamisha fedha. Mtu yeyote anayeiscan au kuinakili anaweza kuhamisha fedha za vocha.',
    loading: 'Inatengeneza muonekano wa risiti...',
    receiptTitle: 'Vocha ya Kurecharge BCH',
    printerSubtitle: 'Topup Voucher',
    receiptSubtitle: 'Risiti ya vocha ya BCH inayoweza kuhamishwa',
    voucherValueLoaded: 'Thamani ya vocha imepakiwa',
    scanToSweep: 'Scan ili kuhamisha',
    qrAlt: 'QR ya vocha ya BCH inayoweza kuhamishwa',
    reference: 'Rejea',
    issued: 'Imetolewa',
    customerPaid: 'Mteja amelipa',
    voucherAddress: 'Anwani ya vocha',
    keepSafeUntilRedeemed: 'Hifadhi salama hadi ikombolewe',
    redemptionInstruction:
      'Scan QR code hii kwa pochi ya Bitcoin Cash inayounga mkono kuhamisha private key.',
    cashWarning:
      'Shughulikia risiti hii kama fedha taslimu. Mtu yeyote mwenye QR code hii anaweza kuhamisha fedha.',
    supportNote:
      'Hifadhi risiti hii salama hadi BCH ihamishwe kwenda kwenye pochi yako mwenyewe.',
    couldNotBuildPreview:
      'Haikuwezekana kutengeneza muonekano wa risiti ya vocha.',
    errors: {
      invalidDerivationIndex: 'Vocha haina kielezo halali cha derivation.',
      missingSerial: 'Vocha haina namba ya serial/rejea.',
      missingFiatCurrency: 'Vocha haina sarafu ya fiat.',
      invalidBchAmount: 'Vocha haina kiasi halali cha BCH kilichopakiwa.',
      missingAddress: 'Vocha haina anwani ya BCH.',
      addressMismatch:
        'Anwani ya vocha hailingani na anwani kutoka kwenye funguo ya vocha iliyohamishwa.',
    },
  },
};

export default sw;
