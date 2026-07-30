const zhHK = {
  common: {
    appName: 'BCH 增值券打印機',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'BCH 增值券',
    continue: '繼續',
    cancel: '取消',
    confirm: '確認',
    close: '關閉',
    back: '返回',
    done: '完成',
    loading: '載入中...',
    error: '錯誤',
    success: '成功',
    warning: '警告',
    yes: '是',
    no: '否',
  },

  language: {
    label: '語言',
    english: 'English',
    spanish: 'Español',
    german: 'Deutsch',
    portuguese: 'Português',
    cantonese: '廣東話',
    nepali: 'नेपाली',
    swedish: 'Svenska',
    swahili: 'Kiswahili',
  },

  home: {
    eyebrow: '商戶增值券應用程式',
    title: 'Bitcoin Cash 增值',
    intro:
      '在店內出售 Bitcoin Cash 增值券、發出收據，並讓顧客將 BCH 轉入自己的錢包。',
    actionTitle: '你想做甚麼？',
    actionSubtitle: '選擇下一個商戶操作。',
    sellVoucher: '增值',
    cashOutBch: '兌現',
    voucherHistory: '增值券記錄',
    treasuryWallet: '資金錢包',
    receiptPreview: '收據預覽',
    glance: {
      title: '一覽',
      subtitle: '今日到目前為止的活動摘要',
      topups: '增值',
      cashOuts: '兌現',
      totalActions: '操作總數',
    },
    status: {
      receipts: {
        title: '增值券收據',
        text: '瀏覽器收據預覽已準備好。',
      },
      printer: {
        title: '熱敏打印機',
        text: '下一步會加入打印機連接。',
      },
      cashHandling: {
        title: '現金處理',
        text: '請將打印出來的增值券 QR 碼當作現金處理。',
      },
    },
  },

  sellForm: {
    customerCashAmount: '顧客現金金額',
    salePreviewTitle: '銷售預覽',
    salePreviewSubtitle: '系統會在覆核畫面鎖定即時 BCH 報價。',
    customerPays: '顧客付款',
    serviceFee: '服務費',
    voucherValueBeforeQuote: '報價前的增值券金額',
    quoteSource: '報價來源',
    lockedAfterReview: '覆核後鎖定',
    reviewVoucher: '覆核增值券',
    viewHistory: '查看記錄',
  },

  issueProgress: {
    title: '正在發出增值券',
    subtitle: '正在為顧客準備增值券記錄和收據。',
    safetyModeNotice:
      '開發安全模式已啟用。你可以測試發出增值券，而即時廣播仍受現有保護機制限制。',
  },

  sellPage: {
    hero: {
      eyebrow: '商戶收款',
      title: '出售 BCH 增值券',
      intro:
        '輸入顧客現金金額、覆核 BCH 價值、發出增值券，並向顧客顯示收據 QR 碼。',
    },
    treasury: {
      title: '資金錢包',
      subtitle: '此錢包用於為已發出的增值券提供 BCH。',
      ready: '已準備',
      address: '地址',
      balance: '餘額',
      lastChecked: '上次檢查',
      balanceNotChecked: '尚未檢查餘額。',
      notSetUp: '尚未設定',
      setUpBeforeUse: '在真實商戶操作前，請先設定資金錢包。',
      refreshBalance: '更新餘額',
    },
    sale: {
      eyebrow: '新增值券',
      title: '輸入銷售金額',
      copy: '輸入顧客支付的現金金額。應用程式會鎖定 BCH 報價，並在發出增值券前顯示覆核畫面。',
    },
    issued: {
      title: '增值券已發出',
      subtitle: '增值券已儲存，顧客收據預覽已準備好。',
      voucherReference: '增值券參考',
      customerPaid: '顧客已付款',
      bchLoaded: '已載入 BCH',
      voucherAddress: '增值券地址',
      issueAnother: '再發一張',
    },
    developerDetails: {
      title: '開發詳情',
      derivationIndex: '衍生索引',
      wifExportReady: 'WIF 匯出已準備',
      platformFeePlan: '平台費用計劃',
      recordStatus: '記錄狀態',
    },
    issueSteps: {
      quote: {
        label: '確認已鎖定報價',
        description: '使用確認前鎖定的 BCH/GBP 報價。',
      },
      wallet: {
        label: '準備增值券錢包',
        description: '使用確認前已準備的增值券地址。',
      },
      funding: {
        label: '準備資金計劃',
        description: '檢查已準備的資金計劃，同時即時廣播仍受保護。',
      },
      store: {
        label: '儲存增值券記錄',
        description: '在本機儲存增值券銷售記錄。',
      },
    },
    receiptDialog: {
      title: '增值券收據',
      subtitle: '發出時的收據預覽',
    },
    safetyNotice:
      '開發安全模式仍然啟用。商戶介面正在完善，但即時交易廣播會繼續受現有保護機制限制，直至明確更改。',
    messages: {
      treasuryNotSetUpWarning:
        '資金錢包尚未設定。仍可繼續覆核增值券，但在資金錢包存在之前，即時資金操作會被封鎖。',
      treasuryBalanceNotCheckedWarning:
        '尚未檢查資金錢包餘額。仍可繼續覆核增值券，但即時資金操作需要最新餘額檢查。',
      treasuryBalanceTooLow:
        '資金錢包餘額不足以處理此增值券。需要：{required}。可用：{available}。',
      couldNotLoadTreasuryWallet: '無法載入資金錢包狀態。',
      treasuryBalanceRefreshed: '資金錢包餘額已更新。',
      couldNotRefreshTreasuryBalance:
        '無法更新資金錢包餘額。請檢查連線後再試。',
      enterValidCashAmount: '請先輸入有效現金金額。',
      treasuryBalanceCheckTimedOut: '資金錢包餘額檢查逾時。',
      treasuryBalanceCouldNotBeCheckedWarning:
        '無法檢查資金錢包餘額。仍可繼續覆核增值券，但即時資金操作需要最新餘額檢查。',
      voucherKeyExportFailed:
        '增值券密鑰匯出檢查失敗。仍可繼續覆核，但打印／轉移需要 WIF 匯出。',
      fallbackQuoteWarning:
        '即時價格不可用，因此正在使用最近的快取報價。發出前請仔細核對報價。',
      liveQuoteLocked: '即時價格報價已成功鎖定。',
      couldNotPrepareReview: '無法準備增值券覆核。請檢查連線後再試。',
      noLockedQuote: '沒有可用的已鎖定報價。請重新覆核增值券。',
      noVoucherAddress: '沒有可用的增值券地址。請重新覆核增值券。',
      couldNotIssueVoucher: '無法發出增值券。',
    },
  },

  cashOutPage: {
    hero: {
      eyebrow: 'BCH 兌現',
      title: 'BCH 兌現',
      intro:
        '輸入顧客想收取的現金金額。應用程式會計算顧客需要向商戶資金錢包發送多少 BCH。',
    },
    actions: {
      treasuryWallet: '資金錢包',
      voucherHistory: '增值券記錄',
      reviewCashOut: '覆核兌現',
    },
    form: {
      cashAmountLabel: '要支付的現金金額',
      paymentQrNotice:
        '顧客會掃描 BCH 付款 QR 碼。只有在資金錢包偵測到 BCH 後，兌現才會完成。',
    },
    preview: {
      title: '兌現預覽',
      subtitle: '最終 BCH 金額會在覆核後鎖定。',
      customerReceivesCash: '顧客收取現金',
      serviceFeeSpread: '服務費／差價',
      customerSendsValue: '顧客發送價值',
      quoteSource: '報價來源',
      lockedAfterReview: '覆核後鎖定',
    },
    paymentUri: {
      label: 'BCH 兌現',
    },
    safetyNotice: '必須先偵測到顧客 BCH，商戶才可交出現金。',
    messages: {
      couldNotLoadTreasuryWallet: '無法載入資金錢包。',
      enterValidCashAmount: '請輸入有效現金金額。',
      setUpTreasuryFirst: '準備兌現前，請先設定商戶資金錢包。',
      fallbackQuoteWarning: '使用了備用報價。繼續前請仔細核對匯率。',
      pricingUnavailable: '價格暫時不可用。請檢查連線後再試。',
      couldNotPrepareCashOut: '無法準備兌現。',
      receiptPrintingPending: '收據打印會在加入付款偵測後連接。',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: '確認套現',
      receivedTitle: '已收到 BCH',
      reviewSubtitle: '請顧客掃描 QR 碼並發送所需 BCH。',
      receivedSubtitle: '顧客付款已在商戶資金錢包偵測到。',
    },
    quoteStatus: {
      fallback: '使用了備用價格報價。繼續前請仔細核對匯率。',
      liveLocked: '即時價格報價已成功鎖定。',
    },
    breakdown: {
      title: '兌現明細',
      subtitle: '顧客收款和所需 BCH',
      cashOutAmount: '兌現金額',
      cashOutAmountNote: '支付給顧客的現金',
      serviceFeeSpread: '服務費／差價',
      cashOutTotal: '兌現總額',
      cashOutTotalNote: '顧客以 BCH 發送此總值',
    },
    summary: {
      cashCustomerReceives: '顧客收取現金',
      customerSends: '顧客發送',
      fiatEquivalentSent: '已發送法幣等值',
      serviceFeeSpread: '服務費／差價',
    },
    paymentQr: {
      title: '顧客付款 QR',
      subtitle:
        '請顧客用 BCH 錢包掃描此 QR 碼。請等待 BCH 付款到達你的資金錢包後，才交出現金。',
      qrAlt: 'BCH 兌現付款 QR',
      qrUnavailable: 'QR 不可用',
    },
    paymentDetails: {
      amountToSend: '要發送的金額',
      treasuryReceivingAddress: '資金錢包收款地址',
      tapToRevealAddress: '點按以顯示完整地址',
      paymentUri: '付款 URI',
    },
    paymentUri: {
      label: 'BCH 兌現',
    },
    details: {
      orderDetailsTitle: '訂單詳情',
      orderDetailsCaption: '按此查看兌現訂單詳情',
      reference: '參考',
      marketRate: '市場匯率',
      quoteSource: '報價來源',
      fallbackBadge: '備用',
      quoteTime: '報價時間',
      quoteExpires: '報價到期',
      status: '狀態',
      bchReceived: '已收到 BCH',
      transactionId: '交易 ID',
      detected: '已偵測',
    },
    success: {
      title: '已收到 BCH',
      nowGiveCustomer: '現在交給顧客',
      cash: '現金',
    },
    actions: {
      copyAddress: '複製地址',
      copyPaymentUri: '複製付款 URI',
      closeReview: '取消兌現並關閉',
      printReceipt: '打印收據',
    },
    messages: {
      treasuryAddressCopied: '資金錢包地址已複製。',
      paymentUriCopied: '付款 URI 已複製。',
      copyFailed: '複製失敗。',
    },
    quoteSources: {
      developmentQuote: '開發報價',
      cachedQuote: '快取報價',
      manualQuote: '手動報價',
      unknown: '未知',
    },
  },

  saleConfirm: {
    title: '覆核增值券',
    subtitle: '發出此增值券前，請確認顧客付款、BCH 金額和收據詳情。',
    quoteStatus: {
      fallback:
        '即時價格不可用，因此正在使用最近的快取報價。發出前請仔細核對報價。',
      liveLocked: '即時價格報價已成功鎖定。',
    },
    summary: {
      customerPays: '顧客付款',
      voucherValue: '增值券價值',
      bchLoaded: '已載入 BCH',
      serviceFee: '服務費',
    },
    details: {
      marketRate: '市場匯率',
      quoteSource: '報價來源',
      fallbackBadge: '備用',
      quoteTime: '報價時間',
      quoteExpires: '報價到期',
      treasuryBalance: '資金錢包餘額',
    },
    fundingReadiness: {
      ready: '資金準備檢查已通過。即時交易廣播仍受目前安全保護限制。',
      notReady: '即時資金操作尚未準備好。',
    },
    safetyNotice:
      '開發安全模式已啟用。此畫面可以發出增值券記錄和收據預覽，而即時廣播會繼續受保護，直至明確啟用。',
    actions: {
      issueVoucher: '發出增值券',
    },
    quoteSources: {
      developmentQuote: '開發報價',
      cachedQuote: '快取報價',
    },
  },

  historyPage: {
    hero: {
      eyebrow: '增值券記錄',
      title: '增值券記錄',
      intro:
        '查看已發出的 BCH 增值券、檢查兌換狀態，並在打印機測試準備期間使用開發收據預覽。',
    },
    actions: {
      sellVoucher: '出售增值券',
    },
    summary: {
      totalVouchers: '增值券總數',
      openActive: '未完成／有效',
      sweptRedeemed: '已轉入／已兌換',
    },
    records: {
      title: '增值券記錄',
      subtitle:
        '顧客相關的增值券資料會先顯示。技術資金和測試工具會保留在每個記錄內。',
    },
    safetyNotice:
      '開發安全模式仍然啟用。在連接最終打印流程前，收據預覽和兌換工具仍可用於測試。',
    messages: {
      couldNotLoadVoucherRecords: '無法載入增值券記錄。',
      createdTestVoucher: '已建立測試增值券 {serial}。',
      couldNotCreateTestVoucher: '無法建立測試增值券。',
      markedManualRedemption: '已將 {serial} 手動標記為已轉入／已兌換。',
      couldNotFindVoucherRecordToUpdate: '找不到要更新的增值券記錄。',
      couldNotMarkVoucherAsManuallyRedeemed: '無法將增值券手動標記為已兌換。',
      clearedManualRedemption: '已清除 {serial} 的手動兌換狀態。',
      couldNotClearManualRedemption: '無法清除手動兌換狀態。',
      couldNotFindVoucherRecordToCheck: '找不到要檢查的增值券記錄。',
      checkedOnChainRedemptionStatus:
        '已檢查 {serial} 的鏈上兌換狀態：{status}。',
      couldNotUpdateVoucherRedemptionDetectionResult:
        '無法更新增值券兌換偵測結果。',
      couldNotCheckVoucherRedemptionStatus: '無法檢查增值券兌換狀態。',
      clearedAllLocalTestVoucherRecords: '已清除所有本機測試增值券記錄。',
      couldNotClearVoucherRecords: '無法清除增值券記錄。',
    },
  },

  historyList: {
    empty: {
      title: '尚未有增值券記錄',
      text: '完成銷售後，已發出的增值券會顯示在這裡。',
    },
    issuedDate: '發出時間 {date}',
    summary: {
      customerPaid: '顧客已付款',
      bchLoaded: '已載入 BCH',
      redemption: '兌換',
      quote: '報價',
    },
    address: {
      voucherAddress: '增值券地址',
      notDerivedYet: '尚未衍生',
    },
    actions: {
      previewReceipt: '預覽收據',
      checkRedemption: '檢查兌換',
      checkOnChainStatus: '檢查鏈上狀態',
      markAsManuallySwept: '手動標記為已轉入',
      clearManualSweepStatus: '清除手動轉入狀態',
    },
    status: {
      redeemed: '已兌換',
      funded: '已入資',
      error: '錯誤',
      issued: '已發出',
    },
    redemption: {
      manualSwept: '手動轉入',
      swept: '已轉入',
      funded: '已入資',
      unfunded: '未入資',
      notChecked: '未檢查',
    },
    redemptionTools: {
      label: '兌換工具',
      caption: '手動轉入狀態和鏈上兌換檢查',
      manualMarked: '增值券已手動標記為已轉入／已兌換。',
      notCheckedYet: '尚未檢查兌換狀態。',
      status: '狀態',
      sweepTransactionId: '轉入交易 ID',
      note: '備註',
      redeemed: '已兌換',
      detectedStatus: '偵測到的狀態',
      detectedBalance: '偵測到的餘額',
      detectedUtxos: '偵測到的 UTXO',
      checked: '已檢查',
      sweepTxidOptional: '轉入 TXID（選填）',
      noteOptional: '備註（選填）',
    },
    quoteSources: {
      cached: '快取',
      manual: '手動',
      unknown: '未知',
    },
  },

  treasuryPage: {
    common: {
      notConfigured: '未設定',
      valid: '有效',
      notReady: '未準備好',
      validNotRequired: '有效／非必需',
    },
    hero: {
      eyebrow: '商戶資金',
      title: '資金錢包',
      intro: '管理用於為顧客增值券收據提供 BCH 的錢包。',
    },
    walletStatus: {
      title: '錢包狀態',
      subtitle: '檢查商戶資金錢包是否已準備好。',
      setupBanner: '資金錢包已設定。',
      notSetupBanner: '尚未設定資金錢包。',
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
        enterValidAmount: 'Enter a valid amount to send.',
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
      title: '手頭現金',
      subtitle: '可選的實體現金追蹤，用於增值、兌現和本機報告。',
      setUp: '設定',
      notSetUp: '未設定',
      notSetUpPrompt: '追蹤目前在此店舖或錢箱內可用的實體現金。',
      currentBalance: '目前手頭現金',
      readyForManualTracking: '已準備好手動追蹤現金。',
      lastUpdated: '最後更新：{date}',
      currency: '貨幣',
      actions: {
        setUp: '設定',
        addCash: '加入現金',
        withdrawCash: '取出現金',
        clear: '清除手頭現金',
        confirmClear: '清除手頭現金',
        saveSetup: '儲存',
        saveAdd: '儲存',
        saveWithdraw: '儲存',
      },
      dialog: {
        setupTitle: '設定手頭現金',
        setupSubtitle: '輸入目前可用的起始實體現金金額。',
        addTitle: '加入現金',
        addSubtitle: '記錄加入店舖錢箱的額外實體現金。',
        withdrawTitle: '取出現金',
        withdrawSubtitle: '記錄從店舖錢箱取出的實體現金。',
        currentCash: '目前手頭現金',
        enteredAmount: '輸入金額',
        newCash: '新的手頭現金',
        startingAmount: '起始金額',
        amountToAdd: '要加入的金額',
        amountToWithdraw: '要取出的金額',
        noteOptional: '備註（選填）',
      },
      clearDialog: {
        title: '清除手頭現金？',
        message: '這會將手頭現金重設為未設定狀態。增值和兌現功能會繼續運作。',
        warning:
          '目前追蹤的結餘是 {amount}。清除後，此有效結餘會從資金錢包頁面移除。',
        clearNote: '手頭現金已手動清除。',
      },
      transactions: {
        link: '交易記錄',
        title: '交易記錄',
        subtitle: '改變此結餘的手頭現金變動。',
        emptyTitle: '尚未有交易記錄',
        emptySubtitle: '手頭現金變動會顯示在這裡。',
        showing: '顯示 {total} 筆中的 {count} 筆',
        showMore: '再顯示 10 筆',
        viewOlder: '查看較舊交易記錄',
        backToLatest: '返回最新交易記錄',
        olderPage: '較舊交易記錄 · 第 {page} 頁',
        detailTitle: '現金變動詳情',
        type: '類型',
        date: '日期',
        cashAmount: '現金金額',
        balanceAfter: '之後結餘',
        reference: '參考',
        bchAddress: 'BCH 地址',
        bchTransaction: 'BCH 交易',
        note: '備註',
        noRelatedRecord: '找不到相關記錄',
        types: {
          setup: '設定',
          topup: '增值',
          cashOut: '兌現',
          cashAdded: '已加入現金',
          withdrawal: '取出現金',
          cleared: '已清除',
        },
        amount: {
          reset: '重設為 {amount}',
        },
      },
      errors: {
        enterValidAmount: '請輸入有效現金金額。',
        enterPositiveAmount: '請輸入大於零的金額。',
        withdrawTooMuch: '不可取出多於可用金額的現金。',
      },
      messages: {
        couldNotLoad: '無法載入手頭現金資料。',
        setUp: '手頭現金已設定。',
        added: '現金已加入手頭現金。',
        withdrawn: '現金已從手頭現金取出。',
        cleared: '手頭現金已清除。',
        couldNotSave: '無法儲存手頭現金變更。',
        couldNotClear: '無法清除手頭現金。',
      },
    },
    summary: {
      status: '狀態',
      ready: '已準備',
      notSetUp: '未設定',
      balance: '餘額',
      notChecked: '未檢查',
      utxos: 'UTXO',
      lastChecked: '上次檢查',
      notCheckedYet: '尚未檢查',
      balanceUnavailable: 'Fiat balance unavailable',
    },
    details: {
      treasuryAddress: '資金錢包地址',
      created: '建立時間',
      updated: '更新時間',
    },
    actions: {
      sellVoucher: '出售增值券',
      refreshBalance: '更新餘額',
      walletReady: '資金錢包已準備',
      createWallet: '建立錢包',
      hideSeed: '隱藏助記詞',
      revealSeedBackup: '顯示助記詞備份',
      clearRestoreTool: '清除還原工具',
      checkSeed: '檢查助記詞',
      importCheckedSeed: '匯入已檢查助記詞',
      clearTreasuryWallet: '清除資金錢包',
      create: 'Create',
    },
    utxoDetails: {
      label: 'UTXO 詳情',
      caption: '進階只讀資金輸出',
      description: '這些是目前在資金錢包偵測到的未花費輸出。此部分為只讀。',
      noneDetected: '未偵測到資金錢包 UTXO。',
      utxoNumber: 'UTXO {number}',
      value: '價值',
      tx: 'Tx',
      outputIndex: '輸出索引',
    },
    fundingConfig: {
      label: '資金設定',
      caption: '即時資金操作的平台費地址準備狀態',
      platformFeeValid: '平台費地址已設定並有效。',
      platformFeeInvalid: '平台費地址已設定但無效：{error}',
      platformFeeNotConfigured:
        '平台費地址尚未設定。即時資金操作必須保持停用。',
      bufferReserveValid: '緩衝儲備地址已設定並有效。',
      bufferReserveOptional: '緩衝儲備輸出在 MVP 階段為選用，目前不是必需。',
      platformFeeAddress: '平台費地址',
      platformFeeAddressStatus: '平台費地址狀態',
      bufferReserveAddress: '緩衝儲備地址',
      bufferReserveAddressStatus: '緩衝儲備地址狀態',
      configChecked: '設定已檢查',
    },
    walletBackup: {
      label: '錢包備份',
      caption: '用於開發和還原的敏感助記詞備份',
      warning:
        '任何人只要取得此助記詞，都可以控制資金錢包內的 BCH。只應在安全私人環境中顯示。',
      backupStatus: '備份狀態',
      seedLoaded: '助記詞已載入作備份',
      seedNotRevealed: '助記詞未顯示',
      seedPhrase: '助記詞',
      exported: '已匯出',
    },
    restore: {
      label: '錢包還原／匯入',
      caption: '檢查或匯入資金錢包助記詞',
      warning:
        '匯入會取代目前本機資金錢包。不要將正式使用的助記詞貼入此開發版本。',
      seedInputLabel: '要檢查／匯入的資金錢包助記詞',
      matchesCurrentAddress: '此助記詞會衍生目前的資金錢包地址。',
      differentAddress: '此助記詞會衍生另一個資金錢包地址。',
      importedIntoLocalStorage: '資金錢包已匯入本機儲存。',
      derivedAddress: '衍生地址',
      currentTreasuryAddress: '目前資金錢包地址',
      noCurrentTreasuryWallet: '沒有目前資金錢包',
      checked: '已檢查',
      importedAddress: '已匯入地址',
      replacedExistingWallet: '已取代現有錢包',
      imported: '已匯入',
    },
    dangerZone: {
      label: '危險區',
      caption: '清除本機資金錢包',
      warning:
        '清除本機資金錢包會移除此裝置儲存的資金錢包資料。只有在確定錢包已備份或不再需要時才執行。',
    },
    safetyNotice:
      '開發安全模式仍然啟用。在準備真實商戶操作期間，資金工具可用於測試。',
    messages: {
      couldNotLoadWalletInfo: '無法載入資金錢包資料。',
      createdWallet: '已建立資金錢包。',
      couldNotCreateWallet: '無法建立資金錢包。',
      clearedWallet: '已清除資金錢包。',
      couldNotClearWallet: '無法清除資金錢包。',
      balanceRefreshed: '資金錢包餘額已更新。',
      couldNotRefreshBalance: '無法更新資金錢包餘額。請檢查連線後再試。',
      seedBackupLoaded: '資金錢包助記詞備份已載入。',
      couldNotLoadBackupInfo: '無法載入資金錢包備份資料。',
      seedBackupHidden: '資金錢包助記詞備份已隱藏。',
      restoreSeedCheckCompleted: '資金錢包還原助記詞檢查已完成。',
      couldNotCheckRestoreSeed: '無法檢查資金錢包還原助記詞。',
      checkSeedBeforeImporting: '匯入前請先檢查資金錢包助記詞。',
      importedCheckedSeed: '已將檢查過的資金錢包助記詞匯入本機儲存。',
      couldNotImportSeed: '無法匯入資金錢包助記詞。',
      restoreToolCleared: '資金錢包還原工具已清除。',
    },
  },

  treasuryTopUpQr: {
    title: '資金錢包增值 QR',
    subtitle: '用另一個 BCH 錢包掃描此 QR 碼，為商戶資金錢包增值。',
    qrAlt: '資金錢包增值 QR 碼',
    qrUnavailable: 'QR 碼不可用。',
    treasuryAddress: '資金錢包地址',
    paymentUri: 'BCH 付款 URI',
    qrGenerated: 'QR 已產生',
    copy: '複製',
    copyAddress: '複製地址',
    copyPaymentUri: '複製付款 URI',
    tapQrToCopy: '點按 QR 以複製錢包地址。',
    watching: '正在等待 BCH 到賬...',
    watchingError: '無法監察 BCH 到賬。你仍可複製地址，發送後再更新結餘。',
    receivedTitle: '已收到',
    receivedSubtitle:
      '已在你的資金錢包偵測到 BCH 到賬。關閉此視窗即可返回已更新的錢包結餘。',
    receivedAmount: '已收到',
    receivedTxid: '交易',
    uriLabel: 'BCH 增值券資金錢包',
    uriMessage: '為商戶資金錢包增值',
    addressCopied: '資金錢包地址已複製。',
    uriCopied: '資金錢包付款 URI 已複製。',
    copyFailed: '無法複製到剪貼簿。',
  },

  layout: {
    brand: {
      title: 'Bitcoin Cash 增值',
      subtitle: '商戶應用程式',
    },
    drawer: {
      subtitle: '商戶增值應用程式',
    },
    navigation: {
      openMenu: '開啟導覽選單',
      closeMenu: '關閉導覽選單',
    },
    status: {
      treasury: '資金錢包',
      printerPending: '打印機待連接',
      devMode: '開發模式',
    },
    sections: {
      main: '主要功能',
      merchantSetup: '商戶設定',
      help: '幫助',
      advanced: '進階',
    },
    items: {
      home: '主頁',
      sellVoucher: '出售增值券',
      cashOut: 'BCH 兌現',
      voucherHistory: '增值券記錄',
      treasuryWallet: '資金錢包',
      printerSetup: '打印機設定',
      appSettings: '應用程式設定',
      checkForUpdates: 'Check for Updates',
      checkForUpdatesCaption: 'App version',
      howToSellVoucher: '如何出售增值券',
      howToCashOut: 'How to Cash-out',
      howCustomersRedeem: '顧客如何兌換',
      faq: '常見問題',
      support: '支援',
      communities: '社群',
      socialMedia: '社交媒體',
      developerTools: '開發者工具',
    },
    common: {
      comingSoon: '即將推出',
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
      title: '打印預覽',
      subtitle: 'A4 商戶報告預覽',
      pdfTitle: '匯出 PDF',
      pdfSubtitle: '將此 A4 商戶報告儲存為 PDF。',
      savePdf: '儲存為 PDF',
      imageTitle: 'Save Image',
      imageSubtitle: 'Save this A4 merchant report as a PNG image.',
      saveImage: 'Save Image',
      savingImage: 'Saving image…',
      imageSaved: 'Image saved',
      imageSavedAndroidCaption: 'Saved to Pictures/Bitcoin Cash Topups.',
      imageSavedDesktopCaption: 'Downloaded as a PNG image.',
      imageSaveFailed: 'Could not save image',
      imageSaveFailedCaption: 'Please try again.',
      close: '關閉',
      print: '打印',
      reportTitle: '商戶報告',
      selectedRange: '已選範圍',
      generated: '產生時間',
      atAGlance: '一覽',
      topupsVsCashOuts: '增值 vs 兌現',
      currencyBreakdown: '按貨幣分類',
      currency: '貨幣',
      topups: '增值',
      cashOuts: '兌現',
      totalFiat: '法幣總額',
      noCurrencyData: '此範圍內尚未有貨幣活動。',
      localNotice:
        '根據此裝置儲存的記錄在本機產生。沒有報告資料會傳送到伺服器。',
    },
    connectedNotice: '報告現已連接到此裝置上的本機增值和兌現記錄。',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: '已載入價值',
      scanToRedeem: '掃描以兌換',
      reference: '參考',
      issued: '發出時間',
      customerPaid: '顧客已付款',
      loaded: '已載入',
      voucherAddress: '增值券地址',
    },
    privateKeyWarning:
      '僅供開發預覽。此收據包含可轉入資金的私鑰 QR。任何人掃描或複製它，都可以轉走增值券資金。',
    loading: '正在建立收據預覽...',
    receiptTitle: 'BCH 增值券',
    printerSubtitle: 'Topup Voucher',
    receiptSubtitle: '可轉入 BCH 的增值券收據',
    voucherValueLoaded: '已載入增值券價值',
    scanToSweep: '掃描以轉入',
    qrAlt: '可轉入 BCH 增值券 QR 碼',
    reference: '參考',
    issued: '發出時間',
    customerPaid: '顧客已付款',
    voucherAddress: '增值券地址',
    keepSafeUntilRedeemed: '兌換前請妥善保管',
    redemptionInstruction:
      '請用支援私鑰轉入功能的 Bitcoin Cash 錢包掃描此 QR 碼。',
    cashWarning: '請將此收據當作現金處理。任何人持有此 QR 碼都可以轉走資金。',
    supportNote: '請妥善保管此收據，直至 BCH 已轉入你自己的錢包。',
    couldNotBuildPreview: '無法建立增值券收據預覽。',
    errors: {
      invalidDerivationIndex: '增值券沒有有效的衍生索引。',
      missingSerial: '增值券沒有序號／參考號碼。',
      missingFiatCurrency: '增值券沒有法幣貨幣。',
      invalidBchAmount: '增值券沒有有效的已載入 BCH 金額。',
      missingAddress: '增值券沒有 BCH 地址。',
      addressMismatch: '增值券地址與匯出的增值券密鑰地址不相符。',
    },
  },
};

export default zhHK;
