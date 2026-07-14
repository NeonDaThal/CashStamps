const neNP = {
  common: {
    appName: 'BCH रिचार्ज भौचर प्रिन्टर',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'BCH रिचार्ज भौचर',
    continue: 'जारी राख्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    confirm: 'पुष्टि गर्नुहोस्',
    close: 'बन्द गर्नुहोस्',
    back: 'फिर्ता',
    done: 'सम्पन्न',
    loading: 'लोड हुँदै...',
    error: 'त्रुटि',
    success: 'सफल',
    warning: 'चेतावनी',
    yes: 'हो',
    no: 'होइन',
  },

  language: {
    label: 'भाषा',
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
    eyebrow: 'व्यापारी रिचार्ज भौचर एप',
    title: 'Bitcoin Cash रिचार्ज',
    intro:
      'पसलमै Bitcoin Cash रिचार्ज भौचर बेच्नुहोस्, रसिद जारी गर्नुहोस्, र ग्राहकलाई BCH आफ्नै वालेटमा सार्न दिनुहोस्।',
    actionTitle: 'तपाईं के गर्न चाहनुहुन्छ?',
    actionSubtitle: 'अर्को व्यापारी कार्य छान्नुहोस्।',
    sellVoucher: 'रिचार्ज',
    cashOutBch: 'क्यास-आउट',
    voucherHistory: 'भौचर इतिहास',
    treasuryWallet: 'ट्रेजरी वालेट',
    receiptPreview: 'रसिद पूर्वावलोकन',
    glance: {
      title: 'एक नजरमा',
      subtitle: 'आज अहिलेसम्मको गतिविधिको सारांश',
      topups: 'रिचार्ज',
      cashOuts: 'क्यास-आउट',
      totalActions: 'कुल कार्यहरू',
    },
    status: {
      receipts: {
        title: 'भौचर रसिदहरू',
        text: 'ब्राउजर रसिद पूर्वावलोकन तयार छ।',
      },
      printer: {
        title: 'थर्मल प्रिन्टर',
        text: 'प्रिन्टर जडान अर्को चरणमा थपिनेछ।',
      },
      cashHandling: {
        title: 'नगद व्यवस्थापन',
        text: 'प्रिन्ट गरिएको भौचर QR कोडलाई नगद जस्तै व्यवहार गर्नुहोस्।',
      },
    },
  },

  sellForm: {
    customerCashAmount: 'ग्राहकको नगद रकम',
    salePreviewTitle: 'बिक्री पूर्वावलोकन',
    salePreviewSubtitle: 'समीक्षा स्क्रिनमा लाइभ BCH दर लक गरिनेछ।',
    customerPays: 'ग्राहकले तिर्छ',
    serviceFee: 'सेवा शुल्क',
    voucherValueBeforeQuote: 'दर लक हुनु अघिको भौचर मूल्य',
    quoteSource: 'दर स्रोत',
    lockedAfterReview: 'समीक्षापछि लक हुन्छ',
    reviewVoucher: 'भौचर समीक्षा गर्नुहोस्',
    viewHistory: 'इतिहास हेर्नुहोस्',
  },

  issueProgress: {
    title: 'भौचर जारी हुँदै',
    subtitle: 'ग्राहकको लागि भौचर रेकर्ड र रसिद तयार हुँदैछ।',
    safetyModeNotice:
      'विकास सुरक्षा मोड सक्रिय छ। लाइभ प्रसारण हालको सुरक्षा नियमहरूद्वारा सुरक्षित रहँदा भौचर जारी गर्ने परीक्षण गर्न सकिन्छ।',
  },

  sellPage: {
    hero: {
      eyebrow: 'नयाँ भौचर',
      title: 'BCH रिचार्ज भौचर बेच्नुहोस्',
      intro:
        'ग्राहकले तिर्ने नगद रकम प्रविष्ट गर्नुहोस्। एपले BCH दर लक गर्नेछ र भौचर जारी गर्नु अघि समीक्षा स्क्रिन देखाउनेछ। त्यसपछि ग्राहकलाई QR कोड देखाउनुहोस्।',
    },
    treasury: {
      title: 'ट्रेजरी वालेट',
      subtitle: 'यो वालेटले जारी गरिएका भौचरहरूको लागि BCH उपलब्ध गराउँछ।',
      ready: 'तयार',
      address: 'ठेगाना',
      balance: 'ब्यालेन्स',
      lastChecked: 'अन्तिम जाँच',
      balanceNotChecked: 'ब्यालेन्स अझै जाँच गरिएको छैन।',
      notSetUp: 'सेटअप गरिएको छैन',
      setUpBeforeUse: 'लाइभ व्यापारी प्रयोग अघि ट्रेजरी वालेट सेटअप गर्नुहोस्।',
      refreshBalance: 'ब्यालेन्स रिफ्रेस गर्नुहोस्',
    },
    sale: {
      eyebrow: 'नयाँ भौचर',
      title: 'बिक्री रकम प्रविष्ट गर्नुहोस्',
      copy: 'ग्राहकले तिर्ने नगद रकम प्रविष्ट गर्नुहोस्। एपले BCH दर लक गर्नेछ र भौचर जारी गर्नु अघि समीक्षा स्क्रिन देखाउनेछ। त्यसपछि ग्राहकलाई QR कोड देखाउनुहोस्।',
    },
    issued: {
      title: 'भौचर जारी भयो',
      subtitle:
        'भौचर सुरक्षित गरिएको छ र ग्राहकको लागि रसिद पूर्वावलोकन तयार छ।',
      voucherReference: 'भौचर सन्दर्भ',
      customerPaid: 'ग्राहकले तिरेको',
      bchLoaded: 'लोड भएको BCH',
      voucherAddress: 'भौचर ठेगाना',
      issueAnother: 'अर्को जारी गर्नुहोस्',
    },
    developerDetails: {
      title: 'विकास विवरण',
      derivationIndex: 'डेरिभेसन इन्डेक्स',
      wifExportReady: 'WIF निर्यात तयार',
      platformFeePlan: 'प्लेटफर्म शुल्क योजना',
      recordStatus: 'रेकर्ड स्थिति',
    },
    issueSteps: {
      quote: {
        label: 'लक गरिएको दर पुष्टि गर्नुहोस्',
        description: 'पुष्टि गर्नु अघि लक गरिएको BCH/GBP दर प्रयोग गर्नुहोस्।',
      },
      wallet: {
        label: 'भौचर वालेट तयार गर्नुहोस्',
        description:
          'पुष्टि गर्नु अघि तयार गरिएको भौचर ठेगाना प्रयोग गर्नुहोस्।',
      },
      funding: {
        label: 'फन्डिङ योजना तयार गर्नुहोस्',
        description:
          'लाइभ प्रसारण सुरक्षित रहँदा तयार गरिएको फन्डिङ योजना जाँच गर्नुहोस्।',
      },
      store: {
        label: 'भौचर रेकर्ड सुरक्षित गर्नुहोस्',
        description: 'भौचर बिक्री रेकर्ड स्थानीय रूपमा सुरक्षित गर्नुहोस्।',
      },
    },
    receiptDialog: {
      title: 'भौचर रसिद',
      subtitle: 'जारी गर्दाको रसिद पूर्वावलोकन',
    },
    safetyNotice:
      'विकास सुरक्षा मोड अझै सक्रिय छ। व्यापारी UX परिष्कृत हुँदैछ, तर स्पष्ट रूपमा परिवर्तन नगरेसम्म लाइभ कारोबार प्रसारण हालको सुरक्षा नियमहरूद्वारा सुरक्षित रहनेछ।',
    messages: {
      treasuryNotSetUpWarning:
        'ट्रेजरी वालेट सेटअप गरिएको छैन। भौचर समीक्षा जारी राख्न सकिन्छ, तर ट्रेजरी वालेट नभएसम्म लाइभ फन्डिङ रोकिनेछ।',
      treasuryBalanceNotCheckedWarning:
        'ट्रेजरी ब्यालेन्स जाँच गरिएको छैन। भौचर समीक्षा जारी राख्न सकिन्छ, तर लाइभ फन्डिङका लागि नयाँ ब्यालेन्स जाँच चाहिन्छ।',
      treasuryBalanceTooLow:
        'यो भौचरका लागि ट्रेजरी ब्यालेन्स कम छ। आवश्यक: {required}। उपलब्ध: {available}।',
      couldNotLoadTreasuryWallet: 'ट्रेजरी वालेट स्थिति लोड गर्न सकिएन।',
      treasuryBalanceRefreshed: 'ट्रेजरी ब्यालेन्स रिफ्रेस भयो।',
      couldNotRefreshTreasuryBalance:
        'ट्रेजरी ब्यालेन्स रिफ्रेस गर्न सकिएन। जडान जाँच गरेर फेरि प्रयास गर्नुहोस्।',
      enterValidCashAmount: 'पहिले मान्य नगद रकम प्रविष्ट गर्नुहोस्।',
      treasuryBalanceCheckTimedOut: 'ट्रेजरी ब्यालेन्स जाँच समय सकियो।',
      treasuryBalanceCouldNotBeCheckedWarning:
        'ट्रेजरी ब्यालेन्स जाँच गर्न सकिएन। भौचर समीक्षा जारी राख्न सकिन्छ, तर लाइभ फन्डिङका लागि नयाँ ब्यालेन्स जाँच चाहिन्छ।',
      voucherKeyExportFailed:
        'भौचर कुञ्जी निर्यात जाँच असफल भयो। समीक्षा जारी राख्न सकिन्छ, तर प्रिन्ट/स्वीप गर्न WIF निर्यात आवश्यक हुनेछ।',
      fallbackQuoteWarning:
        'लाइभ मूल्य उपलब्ध थिएन, त्यसैले हालैको क्यास गरिएको दर प्रयोग भइरहेको छ। जारी गर्नु अघि दर सावधानीपूर्वक समीक्षा गर्नुहोस्।',
      liveQuoteLocked: 'लाइभ मूल्य दर सफलतापूर्वक लक भयो।',
      couldNotPrepareReview:
        'भौचर समीक्षा तयार गर्न सकिएन। कृपया जडान जाँच गरेर फेरि प्रयास गर्नुहोस्।',
      noLockedQuote:
        'लक गरिएको दर उपलब्ध छैन। कृपया भौचर फेरि समीक्षा गर्नुहोस्।',
      noVoucherAddress:
        'भौचर ठेगाना उपलब्ध छैन। कृपया भौचर फेरि समीक्षा गर्नुहोस्।',
      couldNotIssueVoucher: 'भौचर जारी गर्न सकिएन।',
    },
  },

  cashOutPage: {
    hero: {
      eyebrow: 'BCH नगदमा साट्नुहोस्',
      title: 'BCH नगदमा साट्नुहोस्',
      intro:
        'ग्राहकले प्राप्त गर्न चाहेको नगद रकम प्रविष्ट गर्नुहोस्। एपले ग्राहकले व्यापारी ट्रेजरीमा पठाउनुपर्ने BCH रकम गणना गर्नेछ।',
    },
    actions: {
      treasuryWallet: 'ट्रेजरी वालेट',
      voucherHistory: 'भौचर इतिहास',
      reviewCashOut: 'क्यास-आउट समीक्षा गर्नुहोस्',
    },
    form: {
      cashAmountLabel: 'भुक्तानी गर्नुपर्ने नगद रकम',
      paymentQrNotice:
        'ग्राहकले BCH भुक्तानी QR स्क्यान गर्नेछ। ट्रेजरी वालेटमा BCH पत्ता लागेपछि मात्र क्यास-आउट पूरा हुनेछ।',
    },
    preview: {
      title: 'क्यास-आउट पूर्वावलोकन',
      subtitle: 'अन्तिम BCH रकम समीक्षापछि लक हुन्छ।',
      customerReceivesCash: 'ग्राहकले नगद प्राप्त गर्छ',
      serviceFeeSpread: 'सेवा शुल्क / स्प्रेड',
      customerSendsValue: 'ग्राहकले पठाउने मूल्य',
      quoteSource: 'दर स्रोत',
      lockedAfterReview: 'समीक्षापछि लक हुन्छ',
    },
    paymentUri: {
      label: 'BCH क्यास-आउट',
    },
    safetyNotice: 'व्यापारीले नगद दिनु अघि ग्राहकको BCH पत्ता लाग्नुपर्छ।',
    messages: {
      couldNotLoadTreasuryWallet: 'ट्रेजरी वालेट लोड गर्न सकिएन।',
      enterValidCashAmount: 'मान्य नगद रकम प्रविष्ट गर्नुहोस्।',
      setUpTreasuryFirst:
        'क्यास-आउट तयार गर्नु अघि व्यापारी ट्रेजरी वालेट सेटअप गर्नुहोस्।',
      fallbackQuoteWarning:
        'ब्याकअप दर प्रयोग भयो। जारी राख्नु अघि दर सावधानीपूर्वक जाँच गर्नुहोस्।',
      pricingUnavailable:
        'मूल्य हाल उपलब्ध छैन। जडान जाँच गरेर फेरि प्रयास गर्नुहोस्।',
      couldNotPrepareCashOut: 'क्यास-आउट तयार गर्न सकिएन।',
      receiptPrintingPending:
        'भुक्तानी पत्ता लगाउने सुविधा थपिएपछि रसिद प्रिन्टिङ जडान गरिनेछ।',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: 'निकाल्ने जाँच गर्नुहोस्',
      receivedTitle: 'BCH प्राप्त भयो',
      reviewSubtitle:
        'ग्राहकलाई QR कोड स्क्यान गरेर आवश्यक BCH पठाउन भन्नुहोस्।',
      receivedSubtitle: 'ग्राहकको भुक्तानी व्यापारी ट्रेजरीमा पत्ता लागेको छ।',
    },
    quoteStatus: {
      fallback:
        'ब्याकअप मूल्य दर प्रयोग भयो। जारी राख्नु अघि दर सावधानीपूर्वक जाँच गर्नुहोस्।',
      liveLocked: 'लाइभ मूल्य दर सफलतापूर्वक लक भयो।',
    },
    breakdown: {
      title: 'क्यास-आउट विवरण',
      subtitle: 'ग्राहकलाई दिने रकम र आवश्यक BCH',
      cashOutAmount: 'क्यास-आउट रकम',
      cashOutAmountNote: 'ग्राहकलाई दिइने नगद',
      serviceFeeSpread: 'सेवा शुल्क / स्प्रेड',
      cashOutTotal: 'क्यास-आउट कुल',
      cashOutTotalNote: 'ग्राहकले यो कुल मूल्य BCH मा पठाउँछ',
    },
    summary: {
      cashCustomerReceives: 'ग्राहकले प्राप्त गर्ने नगद',
      customerSends: 'ग्राहकले पठाउँछ',
      fiatEquivalentSent: 'पठाइएको फियाट बराबर',
      serviceFeeSpread: 'सेवा शुल्क / स्प्रेड',
    },
    paymentQr: {
      title: 'ग्राहक भुक्तानी QR',
      subtitle:
        'ग्राहकलाई आफ्नो BCH वालेटबाट यो QR कोड स्क्यान गर्न भन्नुहोस्। नगद दिनु अघि BCH भुक्तानी तपाईंको ट्रेजरी वालेटमा आइपुग्न पर्खनुहोस्।',
      qrAlt: 'क्यास-आउट BCH भुक्तानी QR',
      qrUnavailable: 'QR उपलब्ध छैन',
    },
    paymentDetails: {
      amountToSend: 'पठाउनुपर्ने रकम',
      treasuryReceivingAddress: 'ट्रेजरी प्राप्त गर्ने ठेगाना',
      tapToRevealAddress: 'पूरा ठेगाना देखाउन ट्याप गर्नुहोस्',
      paymentUri: 'भुक्तानी URI',
    },
    paymentUri: {
      label: 'BCH क्यास-आउट',
    },
    details: {
      orderDetailsTitle: 'अर्डर विवरण',
      orderDetailsCaption: 'क्यास-आउट अर्डरको विवरण हेर्न यहाँ क्लिक गर्नुहोस्',
      reference: 'सन्दर्भ',
      marketRate: 'बजार दर',
      quoteSource: 'दर स्रोत',
      fallbackBadge: 'ब्याकअप',
      quoteTime: 'दर समय',
      quoteExpires: 'दर समाप्त हुन्छ',
      status: 'स्थिति',
      bchReceived: 'प्राप्त BCH',
      transactionId: 'कारोबार ID',
      detected: 'पत्ता लाग्यो',
    },
    success: {
      title: 'BCH प्राप्त भयो',
      nowGiveCustomer: 'अब ग्राहकलाई',
      cash: 'नगद दिनुहोस्',
    },
    actions: {
      copyAddress: 'ठेगाना प्रतिलिपि गर्नुहोस्',
      copyPaymentUri: 'भुक्तानी URI प्रतिलिपि गर्नुहोस्',
      closeReview: 'क्यास-आउट रद्द गरेर बन्द गर्नुहोस्',
      printReceipt: 'रसिद प्रिन्ट गर्नुहोस्',
    },
    messages: {
      treasuryAddressCopied: 'ट्रेजरी ठेगाना प्रतिलिपि भयो।',
      paymentUriCopied: 'भुक्तानी URI प्रतिलिपि भयो।',
      copyFailed: 'प्रतिलिपि गर्न असफल भयो।',
    },
    quoteSources: {
      developmentQuote: 'विकास दर',
      cachedQuote: 'क्यास गरिएको दर',
      manualQuote: 'म्यानुअल दर',
      unknown: 'अज्ञात',
    },
  },

  saleConfirm: {
    title: 'भौचर समीक्षा गर्नुहोस्',
    subtitle:
      'यो भौचर जारी गर्नु अघि ग्राहक भुक्तानी, BCH रकम, र रसिद विवरण पुष्टि गर्नुहोस्।',
    quoteStatus: {
      fallback:
        'लाइभ मूल्य उपलब्ध थिएन, त्यसैले हालैको क्यास गरिएको दर प्रयोग भइरहेको छ। जारी गर्नु अघि दर सावधानीपूर्वक समीक्षा गर्नुहोस्।',
      liveLocked: 'लाइभ मूल्य दर सफलतापूर्वक लक भयो।',
    },
    summary: {
      customerPays: 'ग्राहकले तिर्छ',
      voucherValue: 'भौचर मूल्य',
      bchLoaded: 'लोड भएको BCH',
      serviceFee: 'सेवा शुल्क',
    },
    details: {
      marketRate: 'बजार दर',
      quoteSource: 'दर स्रोत',
      fallbackBadge: 'ब्याकअप',
      quoteTime: 'दर समय',
      quoteExpires: 'दर समाप्त हुन्छ',
      treasuryBalance: 'ट्रेजरी ब्यालेन्स',
    },
    fundingReadiness: {
      ready:
        'फन्डिङ तयारी जाँचहरू सफल भए। लाइभ कारोबार प्रसारण अझै हालको सुरक्षा नियमद्वारा सुरक्षित छ।',
      notReady: 'लाइभ फन्डिङ अझै तयार छैन।',
    },
    safetyNotice:
      'विकास सुरक्षा मोड सक्रिय छ। यो स्क्रिनले भौचर रेकर्ड र रसिद पूर्वावलोकन जारी गर्न सक्छ, तर स्पष्ट रूपमा सक्षम नगरेसम्म लाइभ प्रसारण सुरक्षित रहनेछ।',
    actions: {
      issueVoucher: 'भौचर जारी गर्नुहोस्',
    },
    quoteSources: {
      developmentQuote: 'विकास दर',
      cachedQuote: 'क्यास गरिएको दर',
    },
  },

  historyPage: {
    hero: {
      eyebrow: 'भौचर रेकर्डहरू',
      title: 'भौचर इतिहास',
      intro:
        'जारी गरिएका BCH भौचरहरू समीक्षा गर्नुहोस्, रिडेम्प्सन स्थिति जाँच गर्नुहोस्, र प्रिन्टर परीक्षण तयारी भइरहँदा विकास रसिद पूर्वावलोकन प्रयोग गर्नुहोस्।',
    },
    actions: {
      sellVoucher: 'भौचर बेच्नुहोस्',
    },
    summary: {
      totalVouchers: 'कुल भौचरहरू',
      openActive: 'खुला / सक्रिय',
      sweptRedeemed: 'स्वीप / रिडिम गरिएको',
    },
    records: {
      title: 'भौचर रेकर्डहरू',
      subtitle:
        'ग्राहकसँग सम्बन्धित भौचर जानकारी पहिले देखिन्छ। प्राविधिक फन्डिङ र परीक्षण उपकरणहरू प्रत्येक रेकर्डभित्र राखिएका छन्।',
    },
    safetyNotice:
      'विकास सुरक्षा मोड अझै सक्रिय छ। अन्तिम प्रिन्टर प्रवाह जडान गर्नु अघि रसिद पूर्वावलोकन र रिडेम्प्सन उपकरणहरू परीक्षणका लागि उपलब्ध छन्।',
    messages: {
      couldNotLoadVoucherRecords: 'भौचर रेकर्डहरू लोड गर्न सकिएन।',
      createdTestVoucher: 'परीक्षण भौचर {serial} सिर्जना भयो।',
      couldNotCreateTestVoucher: 'परीक्षण भौचर सिर्जना गर्न सकिएन।',
      markedManualRedemption:
        '{serial} लाई म्यानुअल रूपमा स्वीप/रिडिम गरिएको चिन्ह लगाइयो।',
      couldNotFindVoucherRecordToUpdate:
        'अपडेट गर्न भौचर रेकर्ड फेला पार्न सकिएन।',
      couldNotMarkVoucherAsManuallyRedeemed:
        'भौचरलाई म्यानुअल रूपमा रिडिम गरिएको चिन्ह लगाउन सकिएन।',
      clearedManualRedemption: '{serial} को म्यानुअल रिडेम्प्सन स्थिति हटाइयो।',
      couldNotClearManualRedemption: 'म्यानुअल रिडेम्प्सन स्थिति हटाउन सकिएन।',
      couldNotFindVoucherRecordToCheck:
        'जाँच गर्न भौचर रेकर्ड फेला पार्न सकिएन।',
      checkedOnChainRedemptionStatus:
        '{serial} को अन-चेन रिडेम्प्सन स्थिति जाँच गरियो: {status}।',
      couldNotUpdateVoucherRedemptionDetectionResult:
        'भौचर रिडेम्प्सन पत्ता लगाउने नतिजा अपडेट गर्न सकिएन।',
      couldNotCheckVoucherRedemptionStatus:
        'भौचर रिडेम्प्सन स्थिति जाँच गर्न सकिएन।',
      clearedAllLocalTestVoucherRecords:
        'सबै स्थानीय परीक्षण भौचर रेकर्डहरू हटाइयो।',
      couldNotClearVoucherRecords: 'भौचर रेकर्डहरू हटाउन सकिएन।',
    },
  },

  historyList: {
    empty: {
      title: 'अहिलेसम्म कुनै भौचर रेकर्ड छैन',
      text: 'बिक्री पूरा भएपछि जारी गरिएका भौचरहरू यहाँ देखिनेछन्।',
    },
    issuedDate: 'जारी गरिएको {date}',
    summary: {
      customerPaid: 'ग्राहकले तिरेको',
      bchLoaded: 'लोड भएको BCH',
      redemption: 'रिडेम्प्सन',
      quote: 'दर',
    },
    address: {
      voucherAddress: 'भौचर ठेगाना',
      notDerivedYet: 'अझै डेरिभ गरिएको छैन',
    },
    actions: {
      previewReceipt: 'रसिद पूर्वावलोकन',
      checkRedemption: 'रिडेम्प्सन जाँच',
      checkOnChainStatus: 'अन-चेन स्थिति जाँच',
      markAsManuallySwept: 'म्यानुअल रूपमा स्वीप भएको चिन्ह लगाउनुहोस्',
      clearManualSweepStatus: 'म्यानुअल स्वीप स्थिति हटाउनुहोस्',
    },
    status: {
      redeemed: 'रिडिम गरिएको',
      funded: 'फन्डेड',
      error: 'त्रुटि',
      issued: 'जारी गरिएको',
    },
    redemption: {
      manualSwept: 'म्यानुअल स्वीप',
      swept: 'स्वीप भएको',
      funded: 'फन्डेड',
      unfunded: 'फन्ड नभएको',
      notChecked: 'जाँच नभएको',
    },
    redemptionTools: {
      label: 'रिडेम्प्सन उपकरणहरू',
      caption: 'म्यानुअल स्वीप स्थिति र अन-चेन रिडेम्प्सन जाँच',
      manualMarked: 'भौचर म्यानुअल रूपमा स्वीप/रिडिम गरिएको चिन्ह लगाइयो।',
      notCheckedYet: 'रिडेम्प्सन स्थिति अझै जाँच गरिएको छैन।',
      status: 'स्थिति',
      sweepTransactionId: 'स्वीप कारोबार ID',
      note: 'नोट',
      redeemed: 'रिडिम गरिएको',
      detectedStatus: 'पत्ता लागेको स्थिति',
      detectedBalance: 'पत्ता लागेको ब्यालेन्स',
      detectedUtxos: 'पत्ता लागेका UTXO हरू',
      checked: 'जाँच भयो',
      sweepTxidOptional: 'स्वीप TXID वैकल्पिक',
      noteOptional: 'नोट वैकल्पिक',
    },
    quoteSources: {
      cached: 'क्यास गरिएको',
      manual: 'म्यानुअल',
      unknown: 'अज्ञात',
    },
  },

  treasuryPage: {
    common: {
      notConfigured: 'सेटअप नगरिएको',
      valid: 'मान्य',
      notReady: 'तयार छैन',
      validNotRequired: 'मान्य / आवश्यक छैन',
    },
    hero: {
      eyebrow: 'व्यापारी रकम',
      title: 'ट्रेजरी वालेट',
      intro:
        'ग्राहक भौचर रसिदहरू फन्ड गर्न प्रयोग हुने BCH वालेट व्यवस्थापन गर्नुहोस्।',
    },
    walletStatus: {
      title: 'वालेट स्थिति',
      subtitle: 'व्यापारी ट्रेजरी वालेट तयार छ कि छैन जाँच गर्नुहोस्।',
      setupBanner: 'ट्रेजरी वालेट सेटअप गरिएको छ।',
      notSetupBanner: 'अझै कुनै ट्रेजरी वालेट सेटअप गरिएको छैन।',
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
      title: 'हातमा रहेको नगद',
      subtitle:
        'रिचार्ज, क्यास-आउट, र स्थानीय रिपोर्टहरूको लागि वैकल्पिक भौतिक नगद ट्र्याकर।',
      setUp: 'सेटअप गर्नुहोस्',
      notSetUp: 'सेटअप गरिएको छैन',
      notSetUpPrompt:
        'यस पसल वा ड्रअरमा हाल उपलब्ध भौतिक नगद ट्र्याक गर्नुहोस्।',
      currentBalance: 'हाल हातमा रहेको नगद',
      readyForManualTracking: 'म्यानुअल नगद ट्र्याकिङका लागि तयार।',
      lastUpdated: 'अन्तिम अपडेट: {date}',
      currency: 'मुद्रा',
      actions: {
        setUp: 'सेटअप गर्नुहोस्',
        addCash: 'नगद थप्नुहोस्',
        withdrawCash: 'नगद झिक्नुहोस्',
        clear: 'हातमा रहेको नगद हटाउनुहोस्',
        confirmClear: 'हातमा रहेको नगद हटाउनुहोस्',
        saveSetup: 'सेभ गर्नुहोस्',
        saveAdd: 'सेभ गर्नुहोस्',
        saveWithdraw: 'सेभ गर्नुहोस्',
      },
      dialog: {
        setupTitle: 'हातमा रहेको नगद सेटअप गर्नुहोस्',
        setupSubtitle:
          'हाल उपलब्ध रहेको सुरुवाती भौतिक नगद रकम प्रविष्ट गर्नुहोस्।',
        addTitle: 'नगद थप्नुहोस्',
        addSubtitle:
          'पसलको ड्रअरमा थपिएको अतिरिक्त भौतिक नगद रेकर्ड गर्नुहोस्।',
        withdrawTitle: 'नगद झिक्नुहोस्',
        withdrawSubtitle: 'पसलको ड्रअरबाट हटाइएको भौतिक नगद रेकर्ड गर्नुहोस्।',
        currentCash: 'हाल हातमा रहेको नगद',
        enteredAmount: 'प्रविष्ट गरिएको रकम',
        newCash: 'नयाँ हातमा रहेको नगद',
        startingAmount: 'सुरुवाती रकम',
        amountToAdd: 'थप्ने रकम',
        amountToWithdraw: 'झिक्ने रकम',
        noteOptional: 'नोट वैकल्पिक',
      },
      clearDialog: {
        title: 'हातमा रहेको नगद हटाउने?',
        message:
          'यसले हातमा रहेको नगदलाई सेटअप नगरिएको अवस्थामा फर्काउँछ। रिचार्ज र क्यास-आउट काम गरिरहनेछन्।',
        warning:
          'हाल ट्र्याक गरिएको ब्यालेन्स {amount} हो। हटाउँदा यो सक्रिय ब्यालेन्स ट्रेजरी वालेट पेजबाट हट्छ।',
        clearNote: 'हातमा रहेको नगद म्यानुअल रूपमा हटाइयो।',
      },
      transactions: {
        link: 'कारोबारहरू',
        title: 'कारोबारहरू',
        subtitle: 'यो ब्यालेन्स परिवर्तन गर्ने हातमा रहेको नगदका गतिविधिहरू।',
        emptyTitle: 'अहिलेसम्म कुनै कारोबार छैन',
        emptySubtitle: 'हातमा रहेको नगदका परिवर्तनहरू यहाँ देखिनेछन्।',
        showing: '{total} मध्ये {count} देखाउँदै',
        showMore: 'थप १० देखाउनुहोस्',
        viewOlder: 'पुराना कारोबारहरू हेर्नुहोस्',
        backToLatest: 'नयाँ कारोबारहरूमा फर्कनुहोस्',
        olderPage: 'पुराना कारोबारहरू · पृष्ठ {page}',
        detailTitle: 'नगद गतिविधि विवरण',
        type: 'प्रकार',
        date: 'मिति',
        cashAmount: 'नगद रकम',
        balanceAfter: 'त्यसपछिको ब्यालेन्स',
        reference: 'सन्दर्भ',
        bchAddress: 'BCH ठेगाना',
        bchTransaction: 'BCH कारोबार',
        note: 'नोट',
        noRelatedRecord: 'सम्बन्धित रेकर्ड फेला परेन',
        types: {
          setup: 'सेटअप',
          topup: 'रिचार्ज',
          cashOut: 'क्यास-आउट',
          cashAdded: 'नगद थपिएको',
          withdrawal: 'निकासी',
          cleared: 'हटाइएको',
        },
        amount: {
          reset: '{amount} मा रिसेट',
        },
      },
      errors: {
        enterValidAmount: 'मान्य नगद रकम प्रविष्ट गर्नुहोस्।',
        enterPositiveAmount: 'शून्यभन्दा ठूलो रकम प्रविष्ट गर्नुहोस्।',
        withdrawTooMuch: 'उपलब्धभन्दा बढी नगद झिक्न सकिँदैन।',
      },
      messages: {
        couldNotLoad: 'हातमा रहेको नगद जानकारी लोड गर्न सकिएन।',
        setUp: 'हातमा रहेको नगद सेटअप भयो।',
        added: 'हातमा रहेको नगदमा नगद थपियो।',
        withdrawn: 'हातमा रहेको नगदबाट नगद झिकियो।',
        cleared: 'हातमा रहेको नगद हटाइयो।',
        couldNotSave: 'हातमा रहेको नगद परिवर्तन सेभ गर्न सकिएन।',
        couldNotClear: 'हातमा रहेको नगद हटाउन सकिएन।',
      },
    },
    summary: {
      status: 'स्थिति',
      ready: 'तयार',
      notSetUp: 'सेटअप नभएको',
      balance: 'ब्यालेन्स',
      notChecked: 'जाँच नभएको',
      utxos: 'UTXO हरू',
      lastChecked: 'अन्तिम जाँच',
      notCheckedYet: 'अझै जाँच गरिएको छैन',
      balanceUnavailable: 'Fiat balance unavailable',
    },
    details: {
      treasuryAddress: 'ट्रेजरी ठेगाना',
      created: 'सिर्जना गरिएको',
      updated: 'अपडेट गरिएको',
    },
    actions: {
      sellVoucher: 'भौचर बेच्नुहोस्',
      refreshBalance: 'ब्यालेन्स रिफ्रेस गर्नुहोस्',
      walletReady: 'ट्रेजरी वालेट तयार',
      createWallet: 'वालेट सिर्जना गर्नुहोस्',
      hideSeed: 'सीड लुकाउनुहोस्',
      revealSeedBackup: 'सीड ब्याकअप देखाउनुहोस्',
      clearRestoreTool: 'रिस्टोर उपकरण हटाउनुहोस्',
      checkSeed: 'सीड जाँच गर्नुहोस्',
      importCheckedSeed: 'जाँच गरिएको सीड आयात गर्नुहोस्',
      clearTreasuryWallet: 'ट्रेजरी वालेट हटाउनुहोस्',
      create: 'Create',
    },
    utxoDetails: {
      label: 'UTXO विवरण',
      caption: 'उन्नत पढ्न-मात्र ट्रेजरी आउटपुटहरू',
      description:
        'यी ट्रेजरी वालेटका लागि हाल पत्ता लागेका खर्च नभएका आउटपुटहरू हुन्। यो खण्ड पढ्न-मात्र हो।',
      noneDetected: 'कुनै ट्रेजरी UTXO पत्ता लागेन।',
      utxoNumber: 'UTXO {number}',
      value: 'मूल्य',
      tx: 'Tx',
      outputIndex: 'आउटपुट इन्डेक्स',
    },
    fundingConfig: {
      label: 'फन्डिङ कन्फिगरेसन',
      caption: 'लाइभ ट्रेजरी फन्डिङका लागि शुल्क ठेगाना तयारी',
      platformFeeValid: 'प्लेटफर्म शुल्क ठेगाना सेटअप गरिएको र मान्य छ।',
      platformFeeInvalid:
        'प्लेटफर्म शुल्क ठेगाना सेटअप गरिएको छ तर अमान्य छ: {error}',
      platformFeeNotConfigured:
        'प्लेटफर्म शुल्क ठेगाना सेटअप गरिएको छैन। लाइभ फन्डिङ बन्द रहनुपर्छ।',
      bufferReserveValid: 'बफर रिजर्भ ठेगाना सेटअप गरिएको र मान्य छ।',
      bufferReserveOptional:
        'MVP का लागि बफर रिजर्भ आउटपुट वैकल्पिक हो र हाल आवश्यक छैन।',
      platformFeeAddress: 'प्लेटफर्म शुल्क ठेगाना',
      platformFeeAddressStatus: 'प्लेटफर्म शुल्क ठेगाना स्थिति',
      bufferReserveAddress: 'बफर रिजर्भ ठेगाना',
      bufferReserveAddressStatus: 'बफर रिजर्भ ठेगाना स्थिति',
      configChecked: 'कन्फिग जाँच भयो',
    },
    walletBackup: {
      label: 'वालेट ब्याकअप',
      caption: 'विकास र रिकभरीका लागि संवेदनशील सीड ब्याकअप',
      warning:
        'यो सीड फ्रेज भएका जो कोहीले ट्रेजरी BCH नियन्त्रण गर्न सक्छन्। यसलाई सुरक्षित निजी वातावरणमा मात्र देखाउनुहोस्।',
      backupStatus: 'ब्याकअप स्थिति',
      seedLoaded: 'ब्याकअपका लागि सीड लोड भयो',
      seedNotRevealed: 'सीड देखाइएको छैन',
      seedPhrase: 'सीड फ्रेज',
      exported: 'निर्यात गरिएको',
    },
    restore: {
      label: 'वालेट रिस्टोर / आयात',
      caption: 'ट्रेजरी सीड फ्रेज जाँच वा आयात गर्नुहोस्',
      warning:
        'आयात गर्दा हालको स्थानीय ट्रेजरी वालेट प्रतिस्थापन हुनेछ। यो विकास बिल्डमा उत्पादन सीड फ्रेज नटाँस्नुहोस्।',
      seedInputLabel: 'जाँच/आयात गर्न ट्रेजरी सीड फ्रेज',
      matchesCurrentAddress: 'यो सीडले हालको ट्रेजरी ठेगाना निकाल्छ।',
      differentAddress: 'यो सीडले फरक ट्रेजरी ठेगाना निकाल्छ।',
      importedIntoLocalStorage: 'ट्रेजरी वालेट स्थानीय स्टोरेजमा आयात गरियो।',
      derivedAddress: 'निकालिएको ठेगाना',
      currentTreasuryAddress: 'हालको ट्रेजरी ठेगाना',
      noCurrentTreasuryWallet: 'हाल कुनै ट्रेजरी वालेट छैन',
      checked: 'जाँच भयो',
      importedAddress: 'आयात गरिएको ठेगाना',
      replacedExistingWallet: 'अवस्थित वालेट प्रतिस्थापन गरियो',
      imported: 'आयात गरिएको',
    },
    dangerZone: {
      label: 'जोखिम क्षेत्र',
      caption: 'स्थानीय ट्रेजरी वालेट हटाउनुहोस्',
      warning:
        'स्थानीय ट्रेजरी वालेट हटाउँदा यस उपकरणमा सुरक्षित गरिएको ट्रेजरी वालेट डाटा हट्छ। वालेट ब्याकअप भएको वा अब आवश्यक नभएको निश्चित भएपछि मात्र यो गर्नुहोस्।',
    },
    safetyNotice:
      'विकास सुरक्षा मोड अझै सक्रिय छ। लाइभ व्यापारी सञ्चालन तयार हुँदै गर्दा ट्रेजरी उपकरणहरू परीक्षणका लागि उपलब्ध छन्।',
    messages: {
      couldNotLoadWalletInfo: 'ट्रेजरी वालेट जानकारी लोड गर्न सकिएन।',
      createdWallet: 'ट्रेजरी वालेट सिर्जना भयो।',
      couldNotCreateWallet: 'ट्रेजरी वालेट सिर्जना गर्न सकिएन।',
      clearedWallet: 'ट्रेजरी वालेट हटाइयो।',
      couldNotClearWallet: 'ट्रेजरी वालेट हटाउन सकिएन।',
      balanceRefreshed: 'ट्रेजरी ब्यालेन्स रिफ्रेस भयो।',
      couldNotRefreshBalance:
        'ट्रेजरी ब्यालेन्स रिफ्रेस गर्न सकिएन। जडान जाँच गरेर फेरि प्रयास गर्नुहोस्।',
      seedBackupLoaded: 'ट्रेजरी सीड ब्याकअप लोड भयो।',
      couldNotLoadBackupInfo: 'ट्रेजरी ब्याकअप जानकारी लोड गर्न सकिएन।',
      seedBackupHidden: 'ट्रेजरी सीड ब्याकअप लुकाइयो।',
      restoreSeedCheckCompleted: 'ट्रेजरी रिस्टोर सीड जाँच पूरा भयो।',
      couldNotCheckRestoreSeed: 'ट्रेजरी रिस्टोर सीड जाँच गर्न सकिएन।',
      checkSeedBeforeImporting:
        'आयात गर्नु अघि ट्रेजरी सीड फ्रेज जाँच गर्नुहोस्।',
      importedCheckedSeed:
        'जाँच गरिएको ट्रेजरी सीड स्थानीय स्टोरेजमा आयात भयो।',
      couldNotImportSeed: 'ट्रेजरी सीड आयात गर्न सकिएन।',
      restoreToolCleared: 'ट्रेजरी रिस्टोर उपकरण हटाइयो।',
    },
  },

  treasuryTopUpQr: {
    title: 'ट्रेजरी रिचार्ज QR',
    subtitle:
      'व्यापारी ट्रेजरी वालेट रिचार्ज गर्न अर्को BCH वालेटबाट यो QR कोड स्क्यान गर्नुहोस्।',
    qrAlt: 'ट्रेजरी रिचार्ज QR कोड',
    qrUnavailable: 'QR कोड उपलब्ध छैन।',
    treasuryAddress: 'ट्रेजरी वालेट ठेगाना',
    paymentUri: 'BCH भुक्तानी URI',
    qrGenerated: 'QR सिर्जना भयो',
    copy: 'प्रतिलिपि गर्नुहोस्',
    copyAddress: 'ठेगाना प्रतिलिपि गर्नुहोस्',
    copyPaymentUri: 'भुक्तानी URI प्रतिलिपि गर्नुहोस्',
    tapQrToCopy: 'वालेट ठेगाना प्रतिलिपि गर्न QR मा ट्याप गर्नुहोस्।',
    watching: 'आउँदै गरेको BCH पर्खँदै...',
    watchingError:
      'आउँदै गरेको BCH हेर्न सकिएन। तपाईं अझै ठेगाना प्रतिलिपि गर्न सक्नुहुन्छ र पठाएपछि ब्यालेन्स रिफ्रेस गर्न सक्नुहुन्छ।',
    receivedTitle: 'प्राप्त भयो',
    receivedSubtitle:
      'तपाईंको ट्रेजरी वालेटमा आउँदै गरेको BCH पत्ता लागेको छ। अपडेट भएको वालेट ब्यालेन्समा फर्कन यो विन्डो बन्द गर्नुहोस्।',
    receivedAmount: 'प्राप्त भयो',
    receivedTxid: 'कारोबार',
    uriLabel: 'BCH भौचर ट्रेजरी',
    uriMessage: 'व्यापारी ट्रेजरी वालेट रिचार्ज गर्नुहोस्',
    addressCopied: 'ट्रेजरी ठेगाना प्रतिलिपि भयो।',
    uriCopied: 'ट्रेजरी भुक्तानी URI प्रतिलिपि भयो।',
    copyFailed: 'क्लिपबोर्डमा प्रतिलिपि गर्न सकिएन।',
  },

  layout: {
    brand: {
      title: 'Bitcoin Cash रिचार्ज',
      subtitle: 'व्यापारी एप',
    },
    drawer: {
      subtitle: 'व्यापारी रिचार्ज एप',
    },
    navigation: {
      openMenu: 'नेभिगेसन मेनु खोल्नुहोस्',
      closeMenu: 'नेभिगेसन मेनु बन्द गर्नुहोस्',
    },
    status: {
      treasury: 'ट्रेजरी',
      printerPending: 'प्रिन्टर बाँकी',
      devMode: 'डेभ मोड',
    },
    sections: {
      main: 'मुख्य',
      merchantSetup: 'व्यापारी सेटअप',
      help: 'मद्दत',
      advanced: 'उन्नत',
    },
    items: {
      home: 'गृह',
      sellVoucher: 'रिचार्ज भौचर बेच्नुहोस्',
      cashOut: 'क्यास-आउट',
      voucherHistory: 'भौचर इतिहास',
      merchantReports: 'रिपोर्टहरू',
      treasuryWallet: 'ट्रेजरी वालेट',
      printerSetup: 'प्रिन्टर सेटअप',
      appSettings: 'एप सेटिङहरू',
      checkForUpdates: 'Check for Updates',
      checkForUpdatesCaption: 'App version and download status',
      howToSellVoucher: 'भौचर कसरी बेच्ने',
      howToCashOut: 'How to Cash-out',
      howCustomersRedeem: 'ग्राहकले कसरी रिडिम गर्छन्',
      faq: 'प्रश्नोत्तर',
      support: 'सहयोग',
      communities: 'समुदायहरू',
      socialMedia: 'सामाजिक सञ्जाल',
      developerTools: 'डेभलपर उपकरणहरू',
    },
    common: {
      comingSoon: 'चाँडै आउँदैछ',
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
    connectedNotice:
      'Reports are now connected to local topup and cash-out records for this device.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'लोड गरिएको मूल्य',
      scanToRedeem: 'रिडिम गर्न स्क्यान गर्नुहोस्',
      reference: 'सन्दर्भ',
      issued: 'जारी गरिएको',
      customerPaid: 'ग्राहकले तिरेको',
      loaded: 'लोड गरिएको',
      voucherAddress: 'भौचर ठेगाना',
    },
    privateKeyWarning:
      'विकास पूर्वावलोकन मात्र। यो रसिदमा स्वीप गर्न मिल्ने निजी कुञ्जी QR छ। यसलाई स्क्यान वा प्रतिलिपि गर्ने जो कोहीले भौचर रकम स्वीप गर्न सक्छ।',
    loading: 'रसिद पूर्वावलोकन बनाउँदै...',
    receiptTitle: 'BCH रिचार्ज भौचर',
    receiptSubtitle: 'स्वीप गर्न मिल्ने BCH भौचर रसिद',
    voucherValueLoaded: 'भौचर मूल्य लोड भयो',
    scanToSweep: 'स्वीप गर्न स्क्यान गर्नुहोस्',
    qrAlt: 'स्वीप गर्न मिल्ने BCH भौचर QR कोड',
    reference: 'सन्दर्भ',
    issued: 'जारी गरिएको',
    customerPaid: 'ग्राहकले तिरेको',
    voucherAddress: 'भौचर ठेगाना',
    keepSafeUntilRedeemed: 'रिडिम नभएसम्म सुरक्षित राख्नुहोस्',
    redemptionInstruction:
      'निजी कुञ्जी स्वीप समर्थन गर्ने Bitcoin Cash वालेटबाट यो QR कोड स्क्यान गर्नुहोस्।',
    cashWarning:
      'यो रसिदलाई नगद जस्तै व्यवहार गर्नुहोस्। यो QR कोड भएका जो कोहीले रकम स्वीप गर्न सक्छन्।',
    supportNote:
      'BCH तपाईंको आफ्नै वालेटमा स्वीप नभएसम्म यो रसिद सुरक्षित राख्नुहोस्।',
    couldNotBuildPreview: 'भौचर रसिद पूर्वावलोकन बनाउन सकिएन।',
    errors: {
      invalidDerivationIndex: 'भौचरमा मान्य डेरिभेसन इन्डेक्स छैन।',
      missingSerial: 'भौचरमा सिरियल/सन्दर्भ नम्बर छैन।',
      missingFiatCurrency: 'भौचरमा फियाट मुद्रा छैन।',
      invalidBchAmount: 'भौचरमा मान्य लोड गरिएको BCH रकम छैन।',
      missingAddress: 'भौचरमा BCH ठेगाना छैन।',
      addressMismatch:
        'भौचर ठेगाना निर्यात गरिएको भौचर कुञ्जी ठेगानासँग मेल खाँदैन।',
    },
  },
};

export default neNP;
