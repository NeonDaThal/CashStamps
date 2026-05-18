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
  },

  home: {
    eyebrow: 'Merchant voucher app',
    title: 'Bitcoin Cash Vouchers',
    intro:
      'Sell Bitcoin Cash vouchers in-store, issue a receipt, and let the customer sweep the BCH into their own wallet.',
    actionTitle: 'What would you like to do?',
    actionSubtitle: 'Choose the next merchant action.',
    sellVoucher: 'Sell New Voucher',
    voucherHistory: 'Voucher History',
    treasuryWallet: 'Treasury Wallet',
    receiptPreview: 'Receipt Preview',
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
      eyebrow: 'Merchant checkout',
      title: 'Sell BCH Voucher',
      intro:
        "Enter the customer's cash amount, review the BCH value, issue the voucher, and present the receipt QR to the customer.",
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
      copy: 'Add the cash amount the customer is paying. The app will lock a BCH quote and show a review screen before issuing the voucher.',
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
};

export default en;
