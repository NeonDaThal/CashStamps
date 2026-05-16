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
};

export default en;
