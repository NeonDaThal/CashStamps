const en = {
  common: {
    appName: 'BCH Voucher Printer',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'BCH Voucher',
    continue: 'Continue',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    yes: 'Yes',
    no: 'No',
  },

  language: {
    label: 'Language',
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
    eyebrow: 'Merchant topup voucher app',
    title: 'Bitcoin Cash Topups',
    logoAlt: 'Bitcoin Cash logo',
    intro:
      'Sell Bitcoin Cash Topup Vouchers and print receipt for customer to sweep with their wallet or buy Bitcoin Cash from customers for cash in-store.',
    actionTitle: 'What would you like to do?',
    actionSubtitle: 'Choose the next customer action.',
    sellVoucher: 'Topup',
    cashOutBch: 'Cash-out',
    voucherHistory: 'History',
    treasuryWallet: 'Treasury',
    receiptPreview: 'Receipt Preview',
    glance: {
      title: 'At a glance',
      subtitle: 'Summary of todays activity so far',
      topups: 'Topups',
      cashOuts: 'Cash-outs',
      totalActions: 'Total actions',
    },
    status: {
      receipts: {
        title: 'Voucher receipts',
        text: 'Browser receipt preview ready.',
      },
      printer: {
        title: 'Thermal printer',
        text: 'Printer connection will be added next.',
      },
      cashHandling: {
        title: 'Cash handling',
        text: 'Treat printed voucher QR codes like cash.',
      },
    },
  },

  sellForm: {
    customerCashAmount: 'Customer cash amount',
    salePreviewTitle: 'Sale preview',
    salePreviewSubtitle:
      'A live BCH quote will be locked on the review screen.',
    customerPays: 'Customer pays',
    serviceFee: 'Service fee',
    voucherValueBeforeQuote: 'Voucher value before quote',
    quoteSource: 'Quote source',
    lockedAfterReview: 'Locked after review',
    reviewVoucher: 'Review Voucher',
    viewHistory: 'View History',
  },

  issueProgress: {
    title: 'Issuing Voucher',
    subtitle: 'Preparing the voucher record and receipt for the customer.',
    safetyModeNotice:
      'Development safety mode is active. Voucher issuing can be tested while live broadcasting remains protected by the existing guardrails.',
  },

  sellPage: {
    hero: {
      eyebrow: 'New Voucher',
      title: 'Sell BCH Voucher',
      intro:
        'Enter the cash amount the customer is paying. The app will lock a BCH quote and show a review screen before issuing the voucher. You then present the QR code to the customer.',
    },
    treasury: {
      title: 'Treasury Wallet',
      subtitle: 'This wallet supplies BCH for issued vouchers.',
      ready: 'Ready',
      address: 'Address',
      balance: 'Balance',
      lastChecked: 'Last checked',
      balanceNotChecked: 'Balance has not been checked yet.',
      notSetUp: 'Not set up',
      setUpBeforeUse: 'Set up the treasury wallet before live merchant use.',
      refreshBalance: 'Refresh Balance',
    },
    sale: {
      eyebrow: 'New voucher',
      title: 'Enter sale amount',
      copy: 'Enter the cash amount the customer is paying. The app will lock a BCH quote and show a review screen before issuing the voucher. You then present the QR code to the customer.',
    },
    issued: {
      title: 'Voucher issued',
      subtitle:
        'The voucher has been saved and the receipt preview is ready for the customer.',
      voucherReference: 'Voucher reference',
      customerPaid: 'Customer paid',
      bchLoaded: 'BCH loaded',
      voucherAddress: 'Voucher address',
      issueAnother: 'Issue Another',
    },
    developerDetails: {
      title: 'Development details',
      derivationIndex: 'Derivation index',
      wifExportReady: 'WIF export ready',
      platformFeePlan: 'Platform fee plan',
      recordStatus: 'Record status',
    },
    issueSteps: {
      quote: {
        label: 'Confirm locked quote',
        description: 'Use the BCH/GBP quote locked before confirmation.',
      },
      wallet: {
        label: 'Prepare voucher wallet',
        description: 'Use the voucher address prepared before confirmation.',
      },
      funding: {
        label: 'Prepare funding plan',
        description:
          'Check the prepared funding plan while live broadcast remains guarded.',
      },
      store: {
        label: 'Save voucher record',
        description: 'Store the voucher sale record locally.',
      },
    },
    receiptDialog: {
      title: 'Voucher Receipt',
      subtitle: 'Issue-time receipt preview',
    },
    safetyNotice:
      'Development safety mode is still active. The merchant UX is being polished, but live transaction broadcasting remains protected by the existing guardrails until explicitly changed.',
    messages: {
      treasuryNotSetUpWarning:
        'Treasury wallet is not set up. Voucher review can continue, but live funding will be blocked until a treasury wallet exists.',
      treasuryBalanceNotCheckedWarning:
        'Treasury balance has not been checked. Voucher review can continue, but live funding will require a fresh balance check.',
      treasuryBalanceTooLow:
        'Treasury balance is too low for this voucher. Required: {required}. Available: {available}.',
      couldNotLoadTreasuryWallet: 'Could not load treasury wallet status.',
      treasuryBalanceRefreshed: 'Treasury balance refreshed.',
      couldNotRefreshTreasuryBalance:
        'Could not refresh treasury balance. Check your connection and try again.',
      enterValidCashAmount: 'Enter a valid cash amount first.',
      treasuryBalanceCheckTimedOut: 'Treasury balance check timed out.',
      treasuryBalanceCouldNotBeCheckedWarning:
        'Treasury balance could not be checked. Voucher review can continue, but live funding will require a fresh balance check.',
      voucherKeyExportFailed:
        'Voucher key export check failed. Review can continue, but printing/sweeping will require WIF export.',
      fallbackQuoteWarning:
        'Live pricing was unavailable, so a recent cached quote is being used. Review the quote carefully before issuing.',
      liveQuoteLocked: 'Live price quote locked successfully.',
      couldNotPrepareReview:
        'Could not prepare voucher review. Please check the connection and try again.',
      noLockedQuote:
        'No locked quote is available. Please review the voucher again.',
      noVoucherAddress:
        'No voucher address is available. Please review the voucher again.',
      couldNotIssueVoucher: 'Could not issue voucher.',
    },
  },
  cashOutPage: {
    hero: {
      eyebrow: 'Cash-out BCH',
      title: 'Cash-out BCH',
      intro:
        'Enter the cash amount the customer wants to receive. The app will calculate how much BCH they must send to the merchant treasury.',
    },
    actions: {
      treasuryWallet: 'Treasury wallet',
      voucherHistory: 'Voucher history',
      reviewCashOut: 'Review Cash-out',
    },
    form: {
      cashAmountLabel: 'Cash amount to pay out',
      paymentQrNotice:
        'The customer will scan a BCH payment QR. The cash-out will only be completed after BCH is detected in the Treasury Wallet.',
    },
    preview: {
      title: 'Cash-out Preview',
      subtitle: 'Final BCH amount is locked after review.',
      customerReceivesCash: 'Customer receives cash',
      serviceFeeSpread: 'Service fee / spread',
      customerSendsValue: 'Customer sends value',
      quoteSource: 'Quote source',
      lockedAfterReview: 'Locked after review',
    },
    paymentUri: {
      label: 'BCH Cash-out',
    },
    safetyNotice:
      'Customer BCH must be detected before the merchant gives out cash.',
    messages: {
      couldNotLoadTreasuryWallet: 'Could not load treasury wallet.',
      enterValidCashAmount: 'Enter a valid cash amount.',
      setUpTreasuryFirst:
        'Set up the merchant treasury wallet before preparing a cash-out.',
      fallbackQuoteWarning:
        'Fallback quote used. Check the rate carefully before continuing.',
      pricingUnavailable:
        'Pricing is currently unavailable. Check your connection and try again.',
      couldNotPrepareCashOut: 'Could not prepare cash-out.',
      receiptPrintingPending:
        'Receipt printing will be connected after payment detection is added.',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: 'Review Cash-out',
      receivedTitle: 'BCH received',
      reviewSubtitle:
        'Ask the customer to scan the QR code below with their BCH wallet and send the required BCH amount. Once it is confirmed your Treasury Wallet has received the payment, you can give them the Cash-out amount.',
      receivedSubtitle:
        'The customer payment has been detected in the merchant treasury.',
    },
    quoteStatus: {
      fallback:
        'Fallback price quote used. Check the rate carefully before continuing.',
      liveLocked: 'Live price quote locked successfully.',
    },
    breakdown: {
      title: 'Cash-out breakdown',
      subtitle: 'Cash-out breakdown',
      cashOutAmount: 'Cash-out requested',
      cashOutAmountNote: 'To pay to customer',
      serviceFeeSpread: '10% fee',
      cashOutTotal: 'Cash-out total to pay',
      cashOutTotalNote: 'Customer to send to you',
    },
    summary: {
      cashCustomerReceives: 'Cash customer receives',
      customerSends: 'Customer sends',
      fiatEquivalentSent: 'Fiat equivalent sent',
      serviceFeeSpread: 'Service fee / spread',
    },
    paymentQr: {
      title: 'Ask customer to scan QR code and send requested amount',
      subtitle:
        'You will see a notification of successful transfer before giving the customer their cash.',
      qrAlt: 'Cash-out payment QR code',
      qrUnavailable: 'Payment QR code unavailable.',
    },
    paymentDetails: {
      amountToSend: 'Amount:',
      treasuryReceivingAddress: 'Receiving address',
      tapToRevealAddress: 'Tap to show full address',
      paymentUri: 'Payment URI',
    },
    paymentUri: {
      label: 'BCH Cash-out',
    },
    details: {
      orderDetailsTitle: 'Order details',
      orderDetailsCaption: 'Click here to see details of Cash-out order',
      reference: 'Reference',
      marketRate: 'Market rate',
      quoteSource: 'Quote source',
      fallbackBadge: 'fallback',
      quoteTime: 'Quote time',
      quoteExpires: 'Quote expires',
      status: 'Status',
      bchReceived: 'BCH received',
      transactionId: 'Transaction ID',
      detected: 'Detected',
    },
    success: {
      title: 'BCH received',
      nowGiveCustomer: 'Now give the customer',
      cash: 'cash',
    },
    actions: {
      copyAddress: 'Copy address',
      copyPaymentUri: 'Copy payment URI',
      closeReview: 'Cancel cash-out and close',
      printReceipt: 'Print Receipt',
    },
    messages: {
      treasuryAddressCopied: 'Treasury address copied.',
      paymentUriCopied: 'Payment URI copied.',
      copyFailed: 'Copy failed.',
    },
    quoteSources: {
      developmentQuote: 'Development quote',
      cachedQuote: 'Cached quote',
      manualQuote: 'Manual quote',
      unknown: 'Unknown',
    },
  },
  saleConfirm: {
    title: 'Review Voucher',
    subtitle:
      'Confirm the customer payment, BCH amount, and receipt details before issuing this voucher.',
    quoteStatus: {
      fallback:
        'Live pricing was unavailable, so a recent cached quote is being used. Review the quote carefully before issuing.',
      liveLocked: 'Live price quote locked successfully.',
    },
    summary: {
      customerPays: 'Customer pays',
      voucherValue: 'Voucher value',
      bchLoaded: 'BCH loaded',
      serviceFee: 'Service fee',
    },
    details: {
      marketRate: 'Market rate',
      quoteSource: 'Quote source',
      fallbackBadge: 'fallback',
      quoteTime: 'Quote time',
      quoteExpires: 'Quote expires',
      treasuryBalance: 'Treasury balance',
    },
    fundingReadiness: {
      ready:
        'Funding readiness checks passed. Live transaction broadcasting is still protected by the current safety guard.',
      notReady: 'Live funding is not ready yet.',
    },
    safetyNotice:
      'Development safety mode is active. This screen can issue the voucher record and receipt preview, while live broadcasting remains guarded until explicitly enabled.',
    actions: {
      issueVoucher: 'Issue Voucher',
    },
    quoteSources: {
      developmentQuote: 'Development quote',
      cachedQuote: 'Cached quote',
    },
  },
  historyPage: {
    hero: {
      eyebrow: 'Voucher records',
      title: 'Voucher History',
      intro:
        'Review issued BCH vouchers, check redemption status, and access development receipt previews while printer testing is still being prepared.',
    },
    actions: {
      sellVoucher: 'Sell Voucher',
    },
    summary: {
      totalVouchers: 'Total vouchers',
      openActive: 'Open / active',
      sweptRedeemed: 'Swept / redeemed',
    },
    records: {
      title: 'Voucher records',
      subtitle:
        'Customer-facing voucher information appears first. Technical funding and testing tools are kept inside each record.',
    },
    safetyNotice:
      'Development safety mode is still active. Receipt preview and redemption tools remain available for testing before the final printer flow is connected.',
    messages: {
      couldNotLoadVoucherRecords: 'Could not load voucher records.',
      createdTestVoucher: 'Created test voucher {serial}.',
      couldNotCreateTestVoucher: 'Could not create test voucher.',
      markedManualRedemption: 'Marked {serial} as manually swept/redeemed.',
      couldNotFindVoucherRecordToUpdate:
        'Could not find voucher record to update.',
      couldNotMarkVoucherAsManuallyRedeemed:
        'Could not mark voucher as manually redeemed.',
      clearedManualRedemption: 'Cleared manual redemption status for {serial}.',
      couldNotClearManualRedemption:
        'Could not clear manual redemption status.',
      couldNotFindVoucherRecordToCheck:
        'Could not find voucher record to check.',
      checkedOnChainRedemptionStatus:
        'Checked on-chain redemption status for {serial}: {status}.',
      couldNotUpdateVoucherRedemptionDetectionResult:
        'Could not update voucher redemption detection result.',
      couldNotCheckVoucherRedemptionStatus:
        'Could not check voucher redemption status.',
      clearedAllLocalTestVoucherRecords:
        'Cleared all local test voucher records.',
      couldNotClearVoucherRecords: 'Could not clear voucher records.',
    },
  },
  historyList: {
    empty: {
      title: 'No voucher records yet',
      text: 'Issued vouchers will appear here after a sale is completed.',
    },
    issuedDate: 'Issued {date}',
    summary: {
      customerPaid: 'Customer paid',
      bchLoaded: 'BCH loaded',
      redemption: 'Redemption',
      quote: 'Quote',
    },
    address: {
      voucherAddress: 'Voucher address',
      notDerivedYet: 'Not derived yet',
    },
    actions: {
      previewReceipt: 'Preview Receipt',
      checkRedemption: 'Check Redemption',
      checkOnChainStatus: 'Check On-Chain Status',
      markAsManuallySwept: 'Mark as Manually Swept',
      clearManualSweepStatus: 'Clear Manual Sweep Status',
    },
    status: {
      redeemed: 'Redeemed',
      funded: 'Funded',
      error: 'Error',
      issued: 'Issued',
    },
    redemption: {
      manualSwept: 'Manual swept',
      swept: 'Swept',
      funded: 'Funded',
      unfunded: 'Unfunded',
      notChecked: 'Not checked',
    },
    redemptionTools: {
      label: 'Redemption tools',
      caption: 'Manual sweep status and on-chain redemption check',
      manualMarked: 'Voucher manually marked as swept/redeemed.',
      notCheckedYet: 'Redemption status has not been checked yet.',
      status: 'Status',
      sweepTransactionId: 'Sweep transaction ID',
      note: 'Note',
      redeemed: 'Redeemed',
      detectedStatus: 'Detected status',
      detectedBalance: 'Detected balance',
      detectedUtxos: 'Detected UTXOs',
      checked: 'Checked',
      sweepTxidOptional: 'Sweep TXID optional',
      noteOptional: 'Note optional',
    },
    quoteSources: {
      cached: 'Cached',
      manual: 'Manual',
      unknown: 'Unknown',
    },
  },
  treasuryPage: {
    common: {
      notConfigured: 'Not configured',
      valid: 'Valid',
      notReady: 'Not ready',
      validNotRequired: 'Valid / not required',
    },
    hero: {
      eyebrow: 'Merchant funds',
      title: 'Treasury Wallet',
      intro: 'Manage the BCH wallet used to fund customer voucher receipts.',
    },
    walletStatus: {
      title: 'Wallet status',
      subtitle: 'Check whether the merchant treasury wallet is ready.',
      setupBanner: 'Treasury wallet is set up.',
      notSetupBanner: 'No treasury wallet has been set up yet.',
    },
    summary: {
      status: 'Status',
      ready: 'Ready',
      notSetUp: 'Not set up',
      balance: 'Balance',
      notChecked: 'Not checked',
      utxos: 'UTXOs',
      lastChecked: 'Last checked',
      notCheckedYet: 'Not checked yet',
    },
    details: {
      treasuryAddress: 'Treasury address',
      created: 'Created',
      updated: 'Updated',
    },
    actions: {
      sellVoucher: 'Sell Voucher',
      refreshBalance: 'Refresh Balance',
      walletReady: 'Treasury Wallet Ready',
      createWallet: 'Create Wallet',
      hideSeed: 'Hide Seed',
      revealSeedBackup: 'Reveal Seed Backup',
      clearRestoreTool: 'Clear Restore Tool',
      checkSeed: 'Check Seed',
      importCheckedSeed: 'Import Checked Seed',
      clearTreasuryWallet: 'Clear Treasury Wallet',
    },
    utxoDetails: {
      label: 'UTXO details',
      caption: 'Advanced read-only treasury outputs',
      description:
        'These are the unspent outputs currently detected for the treasury wallet. This section is read-only.',
      noneDetected: 'No treasury UTXOs detected.',
      utxoNumber: 'UTXO {number}',
      value: 'Value',
      tx: 'Tx',
      outputIndex: 'Output index',
    },
    fundingConfig: {
      label: 'Funding configuration',
      caption: 'Fee address readiness for live treasury funding',
      platformFeeValid: 'Platform fee address is configured and valid.',
      platformFeeInvalid:
        'Platform fee address is configured but invalid: {error}',
      platformFeeNotConfigured:
        'Platform fee address is not configured. Live funding must stay disabled.',
      bufferReserveValid: 'Buffer reserve address is configured and valid.',
      bufferReserveOptional:
        'Buffer reserve output is optional for MVP and is not currently required.',
      platformFeeAddress: 'Platform fee address',
      platformFeeAddressStatus: 'Platform fee address status',
      bufferReserveAddress: 'Buffer reserve address',
      bufferReserveAddressStatus: 'Buffer reserve address status',
      configChecked: 'Config checked',
    },
    walletBackup: {
      label: 'Wallet backup',
      caption: 'Sensitive seed backup for development and recovery',
      warning:
        'Anyone with this seed phrase can control the treasury BCH. Only reveal this in a safe private environment.',
      backupStatus: 'Backup status',
      seedLoaded: 'Seed loaded for backup',
      seedNotRevealed: 'Seed not revealed',
      seedPhrase: 'Seed phrase',
      exported: 'Exported',
    },
    restore: {
      label: 'Wallet restore / import',
      caption: 'Check or import a treasury seed phrase',
      warning:
        'Importing will replace the current local treasury wallet. Do not paste a production seed phrase into this development build.',
      seedInputLabel: 'Treasury seed phrase to check/import',
      matchesCurrentAddress: 'This seed derives the current treasury address.',
      differentAddress: 'This seed derives a different treasury address.',
      importedIntoLocalStorage: 'Imported treasury wallet into local storage.',
      derivedAddress: 'Derived address',
      currentTreasuryAddress: 'Current treasury address',
      noCurrentTreasuryWallet: 'No current treasury wallet',
      checked: 'Checked',
      importedAddress: 'Imported address',
      replacedExistingWallet: 'Replaced existing wallet',
      imported: 'Imported',
    },
    dangerZone: {
      label: 'Danger zone',
      caption: 'Clear the local treasury wallet',
      warning:
        "Clearing the local treasury wallet removes this device's saved treasury wallet data. Only do this when you are sure the wallet is backed up or no longer needed.",
    },
    safetyNotice:
      'Development safety mode is still active. Treasury tools are available for testing while live merchant operation is being prepared.',
    messages: {
      couldNotLoadWalletInfo: 'Could not load treasury wallet information.',
      createdWallet: 'Created treasury wallet.',
      couldNotCreateWallet: 'Could not create treasury wallet.',
      clearedWallet: 'Cleared treasury wallet.',
      couldNotClearWallet: 'Could not clear treasury wallet.',
      balanceRefreshed: 'Treasury balance refreshed.',
      couldNotRefreshBalance:
        'Could not refresh treasury balance. Check your connection and try again.',
      seedBackupLoaded: 'Treasury seed backup loaded.',
      couldNotLoadBackupInfo: 'Could not load treasury backup information.',
      seedBackupHidden: 'Treasury seed backup hidden.',
      restoreSeedCheckCompleted: 'Treasury restore seed check completed.',
      couldNotCheckRestoreSeed: 'Could not check treasury restore seed.',
      checkSeedBeforeImporting:
        'Check a treasury seed phrase before importing.',
      importedCheckedSeed: 'Imported checked treasury seed into local storage.',
      couldNotImportSeed: 'Could not import treasury seed.',
      restoreToolCleared: 'Treasury restore tool cleared.',
    },
  },
  treasuryTopUpQr: {
    title: 'Treasury Top-Up QR',
    subtitle:
      'Scan this QR code from another BCH wallet to top up the merchant treasury wallet.',
    receiveOnlyNotice:
      'Receive-only QR. This lets the merchant add BCH to the treasury wallet. It does not spend or broadcast anything from this app.',
    qrAlt: 'Treasury top-up QR code',
    qrUnavailable: 'QR code unavailable.',
    treasuryAddress: 'Treasury address',
    paymentUri: 'BCH payment URI',
    qrGenerated: 'QR generated',
    copyAddress: 'Copy Address',
    copyPaymentUri: 'Copy Payment URI',
    uriLabel: 'BCH Voucher Treasury',
    uriMessage: 'Top up merchant treasury wallet',
    addressCopied: 'Treasury address copied.',
    uriCopied: 'Treasury payment URI copied.',
    copyFailed: 'Could not copy to clipboard.',
  },
  layout: {
    brand: {
      title: 'Bitcoin Cash Vouchers',
      subtitle: 'Merchant app',
    },
    drawer: {
      subtitle: 'Merchant voucher app',
    },
    navigation: {
      openMenu: 'Open navigation menu',
      closeMenu: 'Close navigation menu',
    },
    status: {
      treasury: 'Treasury',
      printerPending: 'Printer pending',
      devMode: 'Dev mode',
    },
    sections: {
      main: 'Main',
      merchantSetup: 'Merchant Setup',
      help: 'Help',
      advanced: 'Advanced',
    },
    items: {
      home: 'Home',
      sellVoucher: 'Sell Voucher',
      cashOut: 'Cash-out',
      voucherHistory: 'Voucher History',
      merchantReports: 'Reports',
      treasuryWallet: 'Treasury Wallet',
      printerSetup: 'Printer Setup',
      appSettings: 'App Settings',
      howToSellVoucher: 'How to Sell a Voucher',
      howCustomersRedeem: 'How Customers Redeem',
      faq: 'FAQ',
      support: 'Support',
      communities: 'Communities',
      socialMedia: 'Social Media',
      developerTools: 'Developer Tools',
    },
    common: {
      comingSoon: 'Coming soon',
    },
  },

  merchantReportsPage: {
    hero: {
      eyebrow: 'Merchant Reports',
      title: 'Reports',
      intro:
        'Track voucher sales, cash-outs, revenue, and growth from this device.',
    },
    actions: {
      viewHistory: 'View History',
      sellVoucher: 'Sell Voucher',
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
      noRecordsYet: 'No completed voucher records yet',
    },
    summary: {
      localData: 'Local',
      previousPeriod: 'Previous',
      totalVouchers: 'Total Vouchers Issued',
      totalVouchersCaption:
        'Number of completed voucher sales in the selected period.',
      grossFiat: 'Gross Fiat Value',
      grossFiatCaption:
        'Total customer cash value handled through voucher sales.',
      netFiat: 'Net Fiat Value',
      netFiatCaption: 'Estimated value after tracked voucher fee deductions.',
      bchLoaded: 'BCH Loaded',
      bchLoadedCaption:
        'Total BCH loaded into customer vouchers during this period.',
      averageVoucherValue: 'Average Voucher Value',
      averageVoucherValueCaption:
        'Average fiat value per completed voucher sale.',
      growth: 'Growth vs Previous Period',
      growthCaption:
        'Voucher count compared with the matching previous report period.',
      noPreviousPeriod: 'No previous period',
      newActivity: 'New',
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
        'View currency totals, voucher flow, and which local records are counted.',
      currencyTitle: 'By Currency',
      noCurrencyData: 'No completed voucher activity in this range yet.',
      voucherCount: '{count} vouchers',
      flowTitle: 'Voucher Flow',
      vouchersIssued: 'Vouchers issued',
      bchLoaded: 'BCH loaded',
      flowText:
        'Cash-out reporting will be added here after the voucher report view is confirmed.',
      statusTitle: 'Reportable Records',
      recordsLoaded: 'Voucher records loaded',
      reportableVouchers: 'Reportable vouchers',
      statusText:
        'Reports currently count funded, printed, and redeemed vouchers. Drafts, quote-locked records, errors, and reclaimed records are excluded.',
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
    connectedNotice:
      'Reports are now connected to local voucher records for this device.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'Value loaded',
      scanToRedeem: 'Scan to Redeem',
      reference: 'Reference',
      issued: 'Issued',
      customerPaid: 'Customer Paid',
      loaded: 'Loaded',
      voucherAddress: 'Voucher Address',
    },
    privateKeyWarning:
      'Development preview only. This receipt contains a sweepable private key QR. Anyone who scans or copies it can sweep the voucher funds.',
    loading: 'Building receipt preview...',
    receiptTitle: 'BCH Voucher',
    receiptSubtitle: 'Sweepable BCH voucher receipt',
    voucherValueLoaded: 'Voucher value loaded',
    scanToSweep: 'Scan to sweep',
    qrAlt: 'Sweepable BCH voucher QR code',
    reference: 'Reference',
    issued: 'Issued',
    customerPaid: 'Customer paid',
    voucherAddress: 'Voucher address',
    keepSafeUntilRedeemed: 'Keep safe until redeemed',
    redemptionInstruction:
      'Scan this QR code with a Bitcoin Cash wallet that supports private key sweeping.',
    cashWarning:
      'Treat this receipt like cash. Anyone with this QR code can sweep the funds.',
    supportNote:
      'Keep this receipt safe until the BCH has been swept into your own wallet.',
    couldNotBuildPreview: 'Could not build voucher receipt preview.',
    errors: {
      invalidDerivationIndex: 'Voucher does not have a valid derivation index.',
      missingSerial: 'Voucher does not have a serial/reference number.',
      missingFiatCurrency: 'Voucher does not have a fiat currency.',
      invalidBchAmount: 'Voucher does not have a valid BCH amount loaded.',
      missingAddress: 'Voucher does not have a BCH address.',
      addressMismatch:
        'Voucher address does not match the exported voucher key address.',
    },
  },
};

export default en;
