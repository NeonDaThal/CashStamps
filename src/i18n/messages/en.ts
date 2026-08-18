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
    cashOutBch: 'Cashout',
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
    customerCashAmount: 'Topup Amount',
    salePreviewTitle: 'Sale preview',
    salePreviewSubtitle:
      'A live BCH quote will be locked on the review screen.',
    topupAmount: 'Topup amount',
    customerToPay: 'Customer to pay',
    customerPays: 'Customer pays',
    serviceFee: 'Service fee',
    voucherValueBeforeQuote: 'Topup Amount',
    quoteSource: 'Quote',
    lockedAfterReview: 'Locked after review',
    reviewVoucher: 'Review Topup',
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
      eyebrow: 'New Voucher Sale',
      title: 'Sell Topup',
      intro:
        'Enter the Topup amount. The app will lock a BCH quote and show the service fee and total customer payment before issuing the voucher. You then present the voucher QR code to the customer.',
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
      copy: 'Enter the Topup amount. The app will lock a BCH quote and show the service fee and total customer payment before issuing the voucher.',
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
      noIssueOperation:
        'This Topup review no longer has a valid issue operation. Please review the Topup again.',

      fundingIntentNotReady:
        'The Topup funding transaction is not ready. Refresh the Treasury Wallet and review the Topup again.',

      issueOperationAlreadySaved:
        'This Topup issue operation was already saved. The existing record has been reused.',
      quoteExpired:
        'The locked quote has expired. Please review the Topup again to get a fresh BCH quote before issuing.',
    },
  },
  cashOutPage: {
    hero: {
      eyebrow: 'Cash-out BCH',
      title: 'Cash-out BCH',
      intro:
        'Enter the cash amount the customer wants to receive. The app will calculate how much BCH they must send to your Treasury Wallet. Once payment is confirmed in your wallet, you can hand over the Cashout amount.',
    },
    actions: {
      treasuryWallet: 'Treasury wallet',
      voucherHistory: 'Voucher history',
      reviewCashOut: 'Review Cashout',
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
      serviceFeeSpread: 'Fees',
      customerSendsValue: 'Customer sends in BCH',
      quoteSource: 'Quote',
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
      qrApplied: 'QR details added to the send form.',
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
        enterValidAmount: 'Enter a valid fiat amount to send.',
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
      title: 'Cash on Hand',
      subtitle:
        'Optional physical cash tracker for topups, cash-outs, and local reports.',
      setUp: 'Ready',
      notSetUp: 'Not set up',
      notSetUpPrompt:
        'Track the physical cash currently available in this shop or drawer.',
      currentBalance: 'Current Cash on Hand',
      readyForManualTracking: 'Ready for manual cash tracking.',
      lastUpdated: 'Last updated: {date}',
      currency: 'Currency',
      actions: {
        setUp: 'Set up',
        addCash: 'Add cash',
        withdrawCash: 'Withdraw cash',
        clear: 'Clear Cash on Hand',
        confirmClear: 'Clear Cash on Hand',
        saveSetup: 'Save',
        saveAdd: 'Save',
        saveWithdraw: 'Save',
      },
      dialog: {
        setupTitle: 'Set up Cash on Hand',
        setupSubtitle:
          'Enter the starting physical cash amount currently available.',
        addTitle: 'Add cash',
        addSubtitle: 'Record extra physical cash added to your cash holding.',
        withdrawTitle: 'Withdraw cash',
        withdrawSubtitle:
          'Record physical cash removed from your cash holding.',
        currentCash: 'Current Cash on Hand',
        enteredAmount: 'Entered amount',
        newCash: 'New Cash on Hand',
        startingAmount: 'Starting amount',
        amountToAdd: 'Amount to add',
        amountToWithdraw: 'Amount to withdraw',
        noteOptional: 'Note optional',
      },
      clearDialog: {
        title: 'Clear Cash on Hand?',
        message:
          'This resets Cash on Hand back to the not set up state. Topups and Cash-outs will continue to work.',
        warning:
          'The current tracked balance is {amount}. Clearing removes this active balance from the Treasury Wallet page.',
        clearNote: 'Cash on Hand cleared manually.',
      },
      transactions: {
        link: 'Transactions',
        title: 'Transactions',
        subtitle: 'Cash on Hand movements that changed this balance.',
        emptyTitle: 'No transactions yet',
        emptySubtitle: 'Cash on Hand changes will appear here.',
        showing: 'Showing {count} of {total}',
        showMore: 'Show 10 more',
        viewOlder: 'View older transactions',
        backToLatest: 'Back to latest transactions',
        olderPage: 'Older transactions · page {page}',
        detailTitle: 'Cash movement details',
        type: 'Type',
        date: 'Date',
        cashAmount: 'Cash amount',
        balanceAfter: 'Balance after',
        reference: 'Reference',
        bchAddress: 'BCH address',
        bchTransaction: 'BCH transaction',
        note: 'Note',
        noRelatedRecord: 'Related record not found',
        types: {
          setup: 'Setup',
          topup: 'Topup',
          cashOut: 'Cash-out',
          cashAdded: 'Cash added',
          withdrawal: 'Withdrawal',
          cleared: 'Cleared',
        },
        amount: {
          reset: 'Reset to {amount}',
        },
      },
      errors: {
        enterValidAmount: 'Enter a valid cash amount.',
        enterPositiveAmount: 'Enter an amount greater than zero.',
        withdrawTooMuch: 'You cannot withdraw more cash than is available.',
      },
      messages: {
        couldNotLoad: 'Could not load Cash on Hand information.',
        setUp: 'Cash on Hand set up.',
        added: 'Cash added to Cash on Hand.',
        withdrawn: 'Cash withdrawn from Cash on Hand.',
        cleared: 'Cash on Hand cleared.',
        couldNotSave: 'Could not save Cash on Hand change.',
        couldNotClear: 'Could not clear Cash on Hand.',
      },
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
      balanceUnavailable: 'Fiat balance unavailable',
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
      revealSeedBackup: 'Reveal Seed Phrase',
      clearRestoreTool: 'Clear Restore Tool',
      checkSeed: 'Check Seed',
      importCheckedSeed: 'Import Checked Seed',
      clearTreasuryWallet: 'Delete Treasury Wallet',
      create: 'Create',
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
      caption: 'Delete the local treasury wallet',
      warning:
        "Deleting the local Treasury Wallet removes this device's saved treasury wallet data. Only do this when you are sure the wallet is backed up or no longer needed.",
    },
    safetyNotice:
      'Development safety mode is still active. Treasury tools are available for testing while live merchant operation is being prepared.',
    messages: {
      couldNotLoadWalletInfo: 'Could not load treasury wallet information.',
      createdWallet: 'Created treasury wallet.',
      couldNotCreateWallet: 'Could not create treasury wallet.',
      clearedWallet: 'Deleted treasury wallet.',
      couldNotClearWallet: 'Could not delete treasury wallet.',
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
    qrAlt: 'Treasury top-up QR code',
    qrUnavailable: 'QR code unavailable.',
    treasuryAddress: 'Treasury Wallet Address',
    paymentUri: 'BCH payment URI',
    qrGenerated: 'QR generated',
    copy: 'Copy',
    copyAddress: 'Copy Address',
    copyPaymentUri: 'Copy Payment URI',
    tapQrToCopy: 'Tap QR to copy wallet address.',
    watching: 'Waiting for incoming BCH...',
    watchingError:
      'Could not watch for incoming BCH. You can still copy the address and refresh the balance after sending.',
    receivedTitle: 'Received',
    receivedSubtitle:
      'Incoming BCH has been detected in your Treasury Wallet. Close this window to return to the updated wallet balance.',
    receivedAmount: 'Received',
    receivedTxid: 'Transaction',
    uriLabel: 'BCH Voucher Treasury',
    uriMessage: 'Top up merchant treasury wallet',
    addressCopied: 'Treasury address copied.',
    uriCopied: 'Treasury payment URI copied.',
    copyFailed: 'Could not copy to clipboard.',
  },
  pinLock: {
    brand: {
      title: 'Bitcoin Cash Topups',
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
      message: 'Bitcoin Cash Topups is ready to open.',
      openApp: 'Open App',
    },
    unlock: {
      eyebrow: 'Merchant access',
      title: 'Welcome back',
      message: 'Enter your PIN to open Bitcoin Cash Topups.',
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
    language: {
      prompt: 'Please select the language you wish to use',
      toolbarHint:
        'You can also switch language at any time by clicking the language button in the top, right hand corner of the app.',
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
      sellVoucher: 'Top-up',
      cashOut: 'Cash-out',
      voucherHistory: 'Voucher History',
      merchantReports: 'Reports',
      treasuryWallet: 'Treasury Wallet',
      printerSetup: 'Printer Setup',
      appSettings: 'App Settings',
      checkForUpdates: 'Check for Updates',
      updateAvailable: 'Update Available',
      checkForUpdatesCaption: 'App version',
      howToSellVoucher: 'How to Top-up',
      howToCashOut: 'How to Cash-out',
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
    update: {
      checking: 'Checking for updates...',
      newBadge: 'New',
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
      installationTitle: 'Installation notes',
      installationStepOpen: 'The download page will open in your browser.',
      installationStepAsset:
        'Download the latest Android APK from the Assets section(at bottom of page).',
      installationStepWarning:
        'Android may show a safety warning because BCH Topups is installed outside Google Play.',
      installationStepConfirm:
        'Only continue if the page is the official Bitcoin Cash Topup release page.',
      verificationHash: 'Verification SHA-256',
      openReleasePage: 'Open Download Page',
      downloadUpdate: 'Download Update',
      openFailed: 'Could not open the download page.',
      close: 'Close',
    },
  },

  merchantReportsPage: {
    hero: {
      eyebrow: 'Merchant Reports',
      title: 'Reports',
      intro:
        'Track topups, cash-outs, fees, and merchant activity from this device.',
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
        'Compare the fiat value loaded into Topups with cash paid out through Cash-outs.',
      fiatMovement: 'Transaction Value',
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
      title: 'Print Preview',
      subtitle: 'A4 merchant report preview',
      pdfTitle: 'Export PDF',
      pdfSubtitle: 'Save this A4 merchant report as a PDF.',
      savePdf: 'Save as PDF',
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
      close: 'Close',
      print: 'Print',
      reportTitle: 'Merchant Report',
      selectedRange: 'Selected range',
      generated: 'Generated',
      atAGlance: 'At a glance',
      topupsVsCashOuts: 'Topups vs Cash-outs',
      currencyBreakdown: 'Currency breakdown',
      currency: 'Currency',
      topups: 'Topups',
      cashOuts: 'Cash-outs',
      totalFiat: 'Total fiat',
      noCurrencyData: 'No currency activity in this range yet.',
      localNotice:
        'Generated locally from records stored on this device. No report data is sent to a server.',
    },
    connectedNotice:
      'Reports are now connected to local topup and cash-out records for this device.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'Value loaded',
      scanToRedeem: 'Scan to Redeem',
      reference: 'Reference',
      issued: 'Issued',
      customerPaid: 'Customer Paid',
      loaded: 'Topup Loaded',
      voucherAddress: 'Voucher Address',
    },
    privateKeyWarning:
      'Development preview only. This receipt contains a sweepable private key QR. Anyone who scans or copies it can sweep the voucher funds.',
    loading: 'Building receipt preview...',
    receiptTitle: 'BCH Voucher',
    printerSubtitle: 'Topup Voucher',
    receiptSubtitle: 'Sweepable BCH voucher receipt',
    voucherValueLoaded: 'Value loaded',
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
