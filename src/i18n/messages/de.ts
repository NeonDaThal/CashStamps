const de = {
  common: {
    appName: 'BCH-Voucher-Drucker',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'BCH-Voucher',
    continue: 'Weiter',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    close: 'Schließen',
    back: 'Zurück',
    done: 'Fertig',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    warning: 'Warnung',
    yes: 'Ja',
    no: 'Nein',
  },

  language: {
    label: 'Sprache',
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
    eyebrow: 'Gutschein-App für Händler',
    title: 'Bitcoin-Cash-Gutschein',
    intro:
      'Verkaufe Bitcoin-Cash-Voucher im Geschäft, stelle einen Beleg aus und ermögliche dem Kunden, das BCH in seine eigene Wallet zu übertragen.',
    actionTitle: 'Was möchtest du tun?',
    actionSubtitle: 'Wähle die nächste Händleraktion.',
    sellVoucher: 'Aufladen',
    cashOutBch: 'Auszahlen',
    voucherHistory: 'Voucher-Verlauf',
    treasuryWallet: 'Treasury-Wallet',
    receiptPreview: 'Belegvorschau',
    glance: {
      title: 'Auf einen Blick',
      subtitle: 'Zusammenfassung der heutigen Aktivität bisher',
      topups: 'Aufladungen',
      cashOuts: 'Auszahlungen',
      totalActions: 'Aktionen gesamt',
    },
    status: {
      receipts: {
        title: 'Voucher-Belege',
        text: 'Belegvorschau im Browser ist bereit.',
      },
      printer: {
        title: 'Thermodrucker',
        text: 'Die Druckerverbindung wird als Nächstes hinzugefügt.',
      },
      cashHandling: {
        title: 'Bargeldhandhabung',
        text: 'Behandle gedruckte Voucher-QR-Codes wie Bargeld.',
      },
    },
  },

  sellForm: {
    customerCashAmount: 'Barbetrag des Kunden',
    salePreviewTitle: 'Verkaufsvorschau',
    salePreviewSubtitle:
      'Ein Live-BCH-Kurs wird auf dem Prüfungsbildschirm festgeschrieben.',
    customerPays: 'Kunde zahlt',
    serviceFee: 'Servicegebühr',
    voucherValueBeforeQuote: 'Voucher-Wert vor Kursfestlegung',
    quoteSource: 'Kursquelle',
    lockedAfterReview: 'Nach Prüfung festgeschrieben',
    reviewVoucher: 'Voucher prüfen',
    viewHistory: 'Verlauf anzeigen',
  },

  issueProgress: {
    title: 'Voucher wird ausgestellt',
    subtitle:
      'Der Voucher-Datensatz und der Beleg für den Kunden werden vorbereitet.',
    safetyModeNotice:
      'Der Entwicklungssicherheitsmodus ist aktiv. Die Voucher-Ausstellung kann getestet werden, während Live-Übertragungen durch die bestehenden Schutzmechanismen geschützt bleiben.',
  },

  sellPage: {
    hero: {
      eyebrow: 'Händler-Kasse',
      title: 'BCH-Voucher verkaufen',
      intro:
        'Gib den Barbetrag des Kunden ein, prüfe den BCH-Wert, stelle den Voucher aus und zeige dem Kunden den Beleg-QR-Code.',
    },
    treasury: {
      title: 'Treasury-Wallet',
      subtitle: 'Diese Wallet stellt BCH für ausgestellte Voucher bereit.',
      ready: 'Bereit',
      address: 'Adresse',
      balance: 'Guthaben',
      lastChecked: 'Zuletzt geprüft',
      balanceNotChecked: 'Das Guthaben wurde noch nicht geprüft.',
      notSetUp: 'Nicht eingerichtet',
      setUpBeforeUse:
        'Richte die Treasury-Wallet ein, bevor sie im echten Händlerbetrieb verwendet wird.',
      refreshBalance: 'Guthaben aktualisieren',
    },
    sale: {
      eyebrow: 'Neuer Voucher',
      title: 'Verkaufsbetrag eingeben',
      copy: 'Gib den Barbetrag ein, den der Kunde bezahlt. Die App schreibt einen BCH-Kurs fest und zeigt vor der Voucher-Ausstellung einen Prüfungsbildschirm an.',
    },
    issued: {
      title: 'Voucher ausgestellt',
      subtitle:
        'Der Voucher wurde gespeichert und die Belegvorschau ist für den Kunden bereit.',
      voucherReference: 'Voucher-Referenz',
      customerPaid: 'Kunde zahlte',
      bchLoaded: 'BCH geladen',
      voucherAddress: 'Voucher-Adresse',
      issueAnother: 'Weiteren ausstellen',
    },
    developerDetails: {
      title: 'Entwicklungsdetails',
      derivationIndex: 'Ableitungsindex',
      wifExportReady: 'WIF-Export bereit',
      platformFeePlan: 'Plattformgebührenplan',
      recordStatus: 'Datensatzstatus',
    },
    issueSteps: {
      quote: {
        label: 'Festgeschriebenen Kurs bestätigen',
        description:
          'Den vor der Bestätigung festgeschriebenen BCH/GBP-Kurs verwenden.',
      },
      wallet: {
        label: 'Voucher-Wallet vorbereiten',
        description:
          'Die vor der Bestätigung vorbereitete Voucher-Adresse verwenden.',
      },
      funding: {
        label: 'Finanzierungsplan vorbereiten',
        description:
          'Den vorbereiteten Finanzierungsplan prüfen, während Live-Übertragungen geschützt bleiben.',
      },
      store: {
        label: 'Voucher-Datensatz speichern',
        description: 'Den Voucher-Verkaufsdatensatz lokal speichern.',
      },
    },
    receiptDialog: {
      title: 'Voucher-Beleg',
      subtitle: 'Belegvorschau zum Ausstellungszeitpunkt',
    },
    safetyNotice:
      'Der Entwicklungssicherheitsmodus ist weiterhin aktiv. Die Händleroberfläche wird verfeinert, aber Live-Transaktionsübertragungen bleiben durch die bestehenden Schutzmechanismen geschützt, bis dies ausdrücklich geändert wird.',
    messages: {
      treasuryNotSetUpWarning:
        'Die Treasury-Wallet ist nicht eingerichtet. Die Voucher-Prüfung kann fortgesetzt werden, aber Live-Finanzierung bleibt blockiert, bis eine Treasury-Wallet existiert.',
      treasuryBalanceNotCheckedWarning:
        'Das Treasury-Guthaben wurde nicht geprüft. Die Voucher-Prüfung kann fortgesetzt werden, aber Live-Finanzierung erfordert eine aktuelle Guthabenprüfung.',
      treasuryBalanceTooLow:
        'Das Treasury-Guthaben ist für diesen Voucher zu niedrig. Erforderlich: {required}. Verfügbar: {available}.',
      couldNotLoadTreasuryWallet:
        'Treasury-Wallet-Status konnte nicht geladen werden.',
      treasuryBalanceRefreshed: 'Treasury-Guthaben aktualisiert.',
      couldNotRefreshTreasuryBalance:
        'Treasury-Guthaben konnte nicht aktualisiert werden. Prüfe deine Verbindung und versuche es erneut.',
      enterValidCashAmount: 'Gib zuerst einen gültigen Barbetrag ein.',
      treasuryBalanceCheckTimedOut:
        'Zeitüberschreitung bei der Treasury-Guthabenprüfung.',
      treasuryBalanceCouldNotBeCheckedWarning:
        'Treasury-Guthaben konnte nicht geprüft werden. Die Voucher-Prüfung kann fortgesetzt werden, aber Live-Finanzierung erfordert eine aktuelle Guthabenprüfung.',
      voucherKeyExportFailed:
        'Prüfung des Voucher-Schlüsselexports fehlgeschlagen. Die Prüfung kann fortgesetzt werden, aber Drucken/Übertragen erfordert den WIF-Export.',
      fallbackQuoteWarning:
        'Live-Preise waren nicht verfügbar, daher wird ein aktueller zwischengespeicherter Kurs verwendet. Prüfe den Kurs sorgfältig vor der Ausstellung.',
      liveQuoteLocked: 'Live-Kurs erfolgreich festgeschrieben.',
      couldNotPrepareReview:
        'Voucher-Prüfung konnte nicht vorbereitet werden. Bitte prüfe die Verbindung und versuche es erneut.',
      noLockedQuote:
        'Es ist kein festgeschriebener Kurs verfügbar. Bitte prüfe den Voucher erneut.',
      noVoucherAddress:
        'Es ist keine Voucher-Adresse verfügbar. Bitte prüfe den Voucher erneut.',
      couldNotIssueVoucher: 'Voucher konnte nicht ausgestellt werden.',
    },
  },
  cashOutPage: {
    hero: {
      eyebrow: 'BCH auszahlen',
      title: 'BCH auszahlen',
      intro:
        'Gib den Bargeldbetrag ein, den der Kunde erhalten möchte. Die App berechnet, wie viel BCH er an die Treasury des Händlers senden muss.',
    },
    actions: {
      treasuryWallet: 'Treasury-Wallet',
      voucherHistory: 'Gutschein-Verlauf',
      reviewCashOut: 'Auszahlung prüfen',
    },
    form: {
      cashAmountLabel: 'Auszuzahlender Bargeldbetrag',
      paymentQrNotice:
        'Der Kunde scannt einen BCH-Zahlungs-QR. Die Auszahlung wird erst abgeschlossen, nachdem BCH in der Treasury-Wallet erkannt wurde.',
    },
    preview: {
      title: 'Auszahlungsvorschau',
      subtitle:
        'Der endgültige BCH-Betrag wird nach der Prüfung festgeschrieben.',
      customerReceivesCash: 'Kunde erhält Bargeld',
      serviceFeeSpread: 'Servicegebühr / Marge',
      customerSendsValue: 'Wert, den der Kunde sendet',
      quoteSource: 'Kursquelle',
      lockedAfterReview: 'Nach Prüfung festgeschrieben',
    },
    paymentUri: {
      label: 'BCH-Auszahlung',
    },
    safetyNotice:
      'Das BCH des Kunden muss erkannt werden, bevor der Händler Bargeld auszahlt.',
    messages: {
      couldNotLoadTreasuryWallet:
        'Treasury-Wallet konnte nicht geladen werden.',
      enterValidCashAmount: 'Gib einen gültigen Bargeldbetrag ein.',
      setUpTreasuryFirst:
        'Richte die Treasury-Wallet des Händlers ein, bevor eine Auszahlung vorbereitet wird.',
      fallbackQuoteWarning:
        'Fallback-Kurs verwendet. Prüfe den Kurs sorgfältig, bevor du fortfährst.',
      pricingUnavailable:
        'Preise sind derzeit nicht verfügbar. Prüfe deine Verbindung und versuche es erneut.',
      couldNotPrepareCashOut: 'Auszahlung konnte nicht vorbereitet werden.',
      receiptPrintingPending:
        'Der Belegdruck wird verbunden, nachdem die Zahlungserkennung hinzugefügt wurde.',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: 'Auszahlung prüfen',
      receivedTitle: 'BCH empfangen',
      reviewSubtitle:
        'Bitte den Kunden, den QR-Code zu scannen und das erforderliche BCH zu senden.',
      receivedSubtitle:
        'Die Kundenzahlung wurde in der Händler-Treasury erkannt.',
    },
    quoteStatus: {
      fallback:
        'Fallback-Kurs verwendet. Prüfe den Kurs sorgfältig, bevor du fortfährst.',
      liveLocked: 'Live-Kurs erfolgreich festgeschrieben.',
    },
    breakdown: {
      title: 'Aufschlüsselung der Auszahlung',
      subtitle: 'Kundenauszahlung und erforderliches BCH',
      cashOutAmount: 'Auszahlungsbetrag',
      cashOutAmountNote: 'Bargeld, das an den Kunden ausgezahlt wird',
      serviceFeeSpread: 'Servicegebühr / Marge',
      cashOutTotal: 'Auszahlung gesamt',
      cashOutTotalNote: 'Der Kunde sendet diesen Gesamtwert in BCH',
    },
    summary: {
      cashCustomerReceives: 'Bargeld, das der Kunde erhält',
      customerSends: 'Kunde sendet',
      fiatEquivalentSent: 'Gesendeter Fiat-Gegenwert',
      serviceFeeSpread: 'Servicegebühr / Marge',
    },
    paymentQr: {
      title: 'Zahlungs-QR des Kunden',
      subtitle:
        'Bitte den Kunden, diesen QR-Code mit seiner BCH-Wallet zu scannen. Warte, bis die BCH-Zahlung in deiner Treasury-Wallet eingegangen ist, bevor du Bargeld auszahlst.',
      qrAlt: 'BCH-Zahlungs-QR für Auszahlung',
      qrUnavailable: 'QR nicht verfügbar',
    },
    paymentDetails: {
      amountToSend: 'Zu sendender Betrag',
      treasuryReceivingAddress: 'Empfangsadresse der Treasury',
      tapToRevealAddress: 'Tippen, um die vollständige Adresse anzuzeigen',
      paymentUri: 'Zahlungs-URI',
    },
    paymentUri: {
      label: 'BCH-Auszahlung',
    },
    details: {
      orderDetailsTitle: 'Bestelldetails',
      orderDetailsCaption:
        'Hier klicken, um die Details der Auszahlung zu sehen',
      reference: 'Referenz',
      marketRate: 'Marktkurs',
      quoteSource: 'Kursquelle',
      fallbackBadge: 'Fallback',
      quoteTime: 'Kurszeitpunkt',
      quoteExpires: 'Kurs läuft ab',
      status: 'Status',
      bchReceived: 'BCH empfangen',
      transactionId: 'Transaktions-ID',
      detected: 'Erkannt',
    },
    success: {
      title: 'BCH empfangen',
      nowGiveCustomer: 'Zahle dem Kunden jetzt',
      cash: 'bar aus',
    },
    actions: {
      copyAddress: 'Adresse kopieren',
      copyPaymentUri: 'Zahlungs-URI kopieren',
      closeReview: 'Auszahlung abbrechen und schließen',
      printReceipt: 'Beleg drucken',
    },
    messages: {
      treasuryAddressCopied: 'Treasury-Adresse kopiert.',
      paymentUriCopied: 'Zahlungs-URI kopiert.',
      copyFailed: 'Kopieren fehlgeschlagen.',
    },
    quoteSources: {
      developmentQuote: 'Entwicklungskurs',
      cachedQuote: 'Zwischengespeicherter Kurs',
      manualQuote: 'Manueller Kurs',
      unknown: 'Unbekannt',
    },
  },

  saleConfirm: {
    title: 'Voucher prüfen',
    subtitle:
      'Bestätige die Kundenzahlung, den BCH-Betrag und die Belegdetails, bevor dieser Voucher ausgestellt wird.',
    quoteStatus: {
      fallback:
        'Live-Preise waren nicht verfügbar, daher wird ein aktueller zwischengespeicherter Kurs verwendet. Prüfe den Kurs sorgfältig vor der Ausstellung.',
      liveLocked: 'Live-Kurs erfolgreich festgeschrieben.',
    },
    summary: {
      customerPays: 'Kunde zahlt',
      voucherValue: 'Voucher-Wert',
      bchLoaded: 'BCH geladen',
      serviceFee: 'Servicegebühr',
    },
    details: {
      marketRate: 'Marktkurs',
      quoteSource: 'Kursquelle',
      fallbackBadge: 'Fallback',
      quoteTime: 'Kurszeitpunkt',
      quoteExpires: 'Kurs läuft ab',
      treasuryBalance: 'Treasury-Guthaben',
    },
    fundingReadiness: {
      ready:
        'Finanzierungsbereitschaftsprüfungen bestanden. Live-Transaktionsübertragungen bleiben weiterhin durch den aktuellen Sicherheitsschutz geschützt.',
      notReady: 'Live-Finanzierung ist noch nicht bereit.',
    },
    safetyNotice:
      'Der Entwicklungssicherheitsmodus ist aktiv. Dieser Bildschirm kann den Voucher-Datensatz und die Belegvorschau erstellen, während Live-Übertragungen geschützt bleiben, bis sie ausdrücklich aktiviert werden.',
    actions: {
      issueVoucher: 'Voucher ausstellen',
    },
    quoteSources: {
      developmentQuote: 'Entwicklungskurs',
      cachedQuote: 'Zwischengespeicherter Kurs',
    },
  },

  historyPage: {
    hero: {
      eyebrow: 'Voucher-Datensätze',
      title: 'Voucher-Verlauf',
      intro:
        'Prüfe ausgestellte BCH-Voucher, kontrolliere den Einlösestatus und greife auf Entwicklungs-Belegvorschauen zu, während der Druckertest noch vorbereitet wird.',
    },
    actions: {
      sellVoucher: 'Voucher verkaufen',
    },
    summary: {
      totalVouchers: 'Voucher gesamt',
      openActive: 'Offen / aktiv',
      sweptRedeemed: 'Übertragen / eingelöst',
    },
    records: {
      title: 'Voucher-Datensätze',
      subtitle:
        'Kundenrelevante Voucher-Informationen erscheinen zuerst. Technische Finanzierungs- und Testwerkzeuge bleiben innerhalb jedes Datensatzes.',
    },
    safetyNotice:
      'Der Entwicklungssicherheitsmodus ist weiterhin aktiv. Belegvorschau und Einlösewerkzeuge bleiben für Tests verfügbar, bevor der endgültige Druckerablauf verbunden wird.',
    messages: {
      couldNotLoadVoucherRecords:
        'Voucher-Datensätze konnten nicht geladen werden.',
      createdTestVoucher: 'Test-Voucher {serial} erstellt.',
      couldNotCreateTestVoucher: 'Test-Voucher konnte nicht erstellt werden.',
      markedManualRedemption:
        '{serial} wurde manuell als übertragen/eingelöst markiert.',
      couldNotFindVoucherRecordToUpdate:
        'Voucher-Datensatz zum Aktualisieren konnte nicht gefunden werden.',
      couldNotMarkVoucherAsManuallyRedeemed:
        'Voucher konnte nicht manuell als eingelöst markiert werden.',
      clearedManualRedemption:
        'Manueller Einlösestatus für {serial} wurde gelöscht.',
      couldNotClearManualRedemption:
        'Manueller Einlösestatus konnte nicht gelöscht werden.',
      couldNotFindVoucherRecordToCheck:
        'Voucher-Datensatz zur Prüfung konnte nicht gefunden werden.',
      checkedOnChainRedemptionStatus:
        'On-Chain-Einlösestatus für {serial} geprüft: {status}.',
      couldNotUpdateVoucherRedemptionDetectionResult:
        'Ergebnis der Voucher-Einlösungserkennung konnte nicht aktualisiert werden.',
      couldNotCheckVoucherRedemptionStatus:
        'Voucher-Einlösestatus konnte nicht geprüft werden.',
      clearedAllLocalTestVoucherRecords:
        'Alle lokalen Test-Voucher-Datensätze wurden gelöscht.',
      couldNotClearVoucherRecords:
        'Voucher-Datensätze konnten nicht gelöscht werden.',
    },
  },

  historyList: {
    empty: {
      title: 'Noch keine Voucher-Datensätze',
      text: 'Ausgestellte Voucher erscheinen hier, nachdem ein Verkauf abgeschlossen wurde.',
    },
    issuedDate: 'Ausgestellt {date}',
    summary: {
      customerPaid: 'Kunde zahlte',
      bchLoaded: 'BCH geladen',
      redemption: 'Einlösung',
      quote: 'Kurs',
    },
    address: {
      voucherAddress: 'Voucher-Adresse',
      notDerivedYet: 'Noch nicht abgeleitet',
    },
    actions: {
      previewReceipt: 'Belegvorschau',
      checkRedemption: 'Einlösung prüfen',
      checkOnChainStatus: 'On-Chain-Status prüfen',
      markAsManuallySwept: 'Manuell als übertragen markieren',
      clearManualSweepStatus: 'Manuellen Übertragungsstatus löschen',
    },
    status: {
      redeemed: 'Eingelöst',
      funded: 'Finanziert',
      error: 'Fehler',
      issued: 'Ausgestellt',
    },
    redemption: {
      manualSwept: 'Manuell übertragen',
      swept: 'Übertragen',
      funded: 'Finanziert',
      unfunded: 'Nicht finanziert',
      notChecked: 'Nicht geprüft',
    },
    redemptionTools: {
      label: 'Einlösewerkzeuge',
      caption: 'Manueller Übertragungsstatus und On-Chain-Einlöseprüfung',
      manualMarked: 'Voucher wurde manuell als übertragen/eingelöst markiert.',
      notCheckedYet: 'Der Einlösestatus wurde noch nicht geprüft.',
      status: 'Status',
      sweepTransactionId: 'Übertragungs-Transaktions-ID',
      note: 'Notiz',
      redeemed: 'Eingelöst',
      detectedStatus: 'Erkannter Status',
      detectedBalance: 'Erkanntes Guthaben',
      detectedUtxos: 'Erkannte UTXOs',
      checked: 'Geprüft',
      sweepTxidOptional: 'Übertragungs-TXID optional',
      noteOptional: 'Notiz optional',
    },
    quoteSources: {
      cached: 'Zwischengespeichert',
      manual: 'Manuell',
      unknown: 'Unbekannt',
    },
  },

  treasuryPage: {
    common: {
      notConfigured: 'Nicht konfiguriert',
      valid: 'Gültig',
      notReady: 'Nicht bereit',
      validNotRequired: 'Gültig / nicht erforderlich',
    },
    hero: {
      eyebrow: 'Händlergelder',
      title: 'Treasury-Wallet',
      intro:
        'Verwalte die BCH-Wallet, die zur Finanzierung von Kunden-Voucher-Belegen verwendet wird.',
    },
    walletStatus: {
      title: 'Wallet-Status',
      subtitle: 'Prüfe, ob die Treasury-Wallet des Händlers bereit ist.',
      setupBanner: 'Treasury-Wallet ist eingerichtet.',
      notSetupBanner: 'Es wurde noch keine Treasury-Wallet eingerichtet.',
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
      title: 'Bargeldbestand',
      subtitle:
        'Optionale Erfassung von physischem Bargeld für Aufladungen, Auszahlungen und lokale Berichte.',
      setUp: 'Einrichten',
      notSetUp: 'Nicht eingerichtet',
      notSetUpPrompt:
        'Erfasse das aktuell in diesem Geschäft oder in der Kasse verfügbare Bargeld.',
      currentBalance: 'Aktueller Bargeldbestand',
      readyForManualTracking: 'Bereit für die manuelle Bargelderfassung.',
      lastUpdated: 'Zuletzt aktualisiert: {date}',
      currency: 'Währung',
      actions: {
        setUp: 'Einrichten',
        addCash: 'Bargeld hinzufügen',
        withdrawCash: 'Bargeld entnehmen',
        clear: 'Bargeldbestand löschen',
        confirmClear: 'Bargeldbestand löschen',
        saveSetup: 'Speichern',
        saveAdd: 'Speichern',
        saveWithdraw: 'Speichern',
      },
      dialog: {
        setupTitle: 'Bargeldbestand einrichten',
        setupSubtitle:
          'Gib den aktuell verfügbaren Startbetrag an physischem Bargeld ein.',
        addTitle: 'Bargeld hinzufügen',
        addSubtitle:
          'Erfasse zusätzliches physisches Bargeld, das in die Ladenkasse gelegt wurde.',
        withdrawTitle: 'Bargeld entnehmen',
        withdrawSubtitle:
          'Erfasse physisches Bargeld, das aus der Ladenkasse entnommen wurde.',
        currentCash: 'Aktueller Bargeldbestand',
        enteredAmount: 'Eingegebener Betrag',
        newCash: 'Neuer Bargeldbestand',
        startingAmount: 'Startbetrag',
        amountToAdd: 'Hinzuzufügender Betrag',
        amountToWithdraw: 'Zu entnehmender Betrag',
        noteOptional: 'Notiz optional',
      },
      clearDialog: {
        title: 'Bargeldbestand löschen?',
        message:
          'Dies setzt den Bargeldbestand auf den Status „nicht eingerichtet“ zurück. Aufladungen und Auszahlungen funktionieren weiterhin.',
        warning:
          'Der aktuell erfasste Bestand beträgt {amount}. Durch das Löschen wird dieser aktive Bestand von der Treasury-Wallet-Seite entfernt.',
        clearNote: 'Bargeldbestand manuell gelöscht.',
      },
      transactions: {
        link: 'Transaktionen',
        title: 'Transaktionen',
        subtitle: 'Bargeldbewegungen, die diesen Bestand geändert haben.',
        emptyTitle: 'Noch keine Transaktionen',
        emptySubtitle: 'Änderungen am Bargeldbestand erscheinen hier.',
        showing: 'Zeige {count} von {total}',
        showMore: 'Weitere 10 anzeigen',
        viewOlder: 'Ältere Transaktionen anzeigen',
        backToLatest: 'Zurück zu den neuesten Transaktionen',
        olderPage: 'Ältere Transaktionen · Seite {page}',
        detailTitle: 'Details zur Bargeldbewegung',
        type: 'Typ',
        date: 'Datum',
        cashAmount: 'Bargeldbetrag',
        balanceAfter: 'Bestand danach',
        reference: 'Referenz',
        bchAddress: 'BCH-Adresse',
        bchTransaction: 'BCH-Transaktion',
        note: 'Notiz',
        noRelatedRecord: 'Zugehöriger Datensatz nicht gefunden',
        types: {
          setup: 'Einrichtung',
          topup: 'Aufladung',
          cashOut: 'Auszahlung',
          cashAdded: 'Bargeld hinzugefügt',
          withdrawal: 'Entnahme',
          cleared: 'Gelöscht',
        },
        amount: {
          reset: 'Zurückgesetzt auf {amount}',
        },
      },
      errors: {
        enterValidAmount: 'Gib einen gültigen Bargeldbetrag ein.',
        enterPositiveAmount: 'Gib einen Betrag größer als null ein.',
        withdrawTooMuch:
          'Du kannst nicht mehr Bargeld entnehmen, als verfügbar ist.',
      },
      messages: {
        couldNotLoad: 'Bargeldbestand konnte nicht geladen werden.',
        setUp: 'Bargeldbestand eingerichtet.',
        added: 'Bargeld zum Bargeldbestand hinzugefügt.',
        withdrawn: 'Bargeld aus dem Bargeldbestand entnommen.',
        cleared: 'Bargeldbestand gelöscht.',
        couldNotSave:
          'Änderung am Bargeldbestand konnte nicht gespeichert werden.',
        couldNotClear: 'Bargeldbestand konnte nicht gelöscht werden.',
      },
    },
    summary: {
      status: 'Status',
      ready: 'Bereit',
      notSetUp: 'Nicht eingerichtet',
      balance: 'Guthaben',
      notChecked: 'Nicht geprüft',
      utxos: 'UTXOs',
      lastChecked: 'Zuletzt geprüft',
      notCheckedYet: 'Noch nicht geprüft',
      balanceUnavailable: 'Fiat balance unavailable',
    },
    details: {
      treasuryAddress: 'Treasury-Adresse',
      created: 'Erstellt',
      updated: 'Aktualisiert',
    },
    actions: {
      sellVoucher: 'Voucher verkaufen',
      refreshBalance: 'Guthaben aktualisieren',
      walletReady: 'Treasury-Wallet bereit',
      createWallet: 'Wallet erstellen',
      hideSeed: 'Seed verbergen',
      revealSeedBackup: 'Seed-Backup anzeigen',
      clearRestoreTool: 'Wiederherstellungswerkzeug leeren',
      checkSeed: 'Seed prüfen',
      importCheckedSeed: 'Geprüften Seed importieren',
      clearTreasuryWallet: 'Treasury-Wallet löschen',
      create: 'Create',
    },
    utxoDetails: {
      label: 'UTXO-Details',
      caption: 'Erweiterte schreibgeschützte Treasury-Ausgänge',
      description:
        'Dies sind die derzeit erkannten nicht ausgegebenen Ausgänge der Treasury-Wallet. Dieser Abschnitt ist schreibgeschützt.',
      noneDetected: 'Keine Treasury-UTXOs erkannt.',
      utxoNumber: 'UTXO {number}',
      value: 'Wert',
      tx: 'Tx',
      outputIndex: 'Ausgabeindex',
    },
    fundingConfig: {
      label: 'Finanzierungskonfiguration',
      caption:
        'Bereitschaft der Gebührenadresse für Live-Treasury-Finanzierung',
      platformFeeValid:
        'Die Plattformgebührenadresse ist konfiguriert und gültig.',
      platformFeeInvalid:
        'Die Plattformgebührenadresse ist konfiguriert, aber ungültig: {error}',
      platformFeeNotConfigured:
        'Die Plattformgebührenadresse ist nicht konfiguriert. Live-Finanzierung muss deaktiviert bleiben.',
      bufferReserveValid:
        'Die Pufferreserveadresse ist konfiguriert und gültig.',
      bufferReserveOptional:
        'Der Pufferreserve-Ausgang ist für das MVP optional und derzeit nicht erforderlich.',
      platformFeeAddress: 'Plattformgebührenadresse',
      platformFeeAddressStatus: 'Status der Plattformgebührenadresse',
      bufferReserveAddress: 'Pufferreserveadresse',
      bufferReserveAddressStatus: 'Status der Pufferreserveadresse',
      configChecked: 'Konfiguration geprüft',
    },
    walletBackup: {
      label: 'Wallet-Backup',
      caption:
        'Sicherheitskritisches Seed-Backup für Entwicklung und Wiederherstellung',
      warning:
        'Jede Person mit dieser Seed-Phrase kann das Treasury-BCH kontrollieren. Zeige sie nur in einer sicheren privaten Umgebung an.',
      backupStatus: 'Backup-Status',
      seedLoaded: 'Seed für Backup geladen',
      seedNotRevealed: 'Seed nicht angezeigt',
      seedPhrase: 'Seed-Phrase',
      exported: 'Exportiert',
    },
    restore: {
      label: 'Wallet wiederherstellen / importieren',
      caption: 'Eine Treasury-Seed-Phrase prüfen oder importieren',
      warning:
        'Der Import ersetzt die aktuelle lokale Treasury-Wallet. Füge keinen Produktions-Seed in diesen Entwicklungs-Build ein.',
      seedInputLabel: 'Treasury-Seed-Phrase zum Prüfen/Importieren',
      matchesCurrentAddress:
        'Dieser Seed leitet die aktuelle Treasury-Adresse ab.',
      differentAddress: 'Dieser Seed leitet eine andere Treasury-Adresse ab.',
      importedIntoLocalStorage:
        'Treasury-Wallet in den lokalen Speicher importiert.',
      derivedAddress: 'Abgeleitete Adresse',
      currentTreasuryAddress: 'Aktuelle Treasury-Adresse',
      noCurrentTreasuryWallet: 'Keine aktuelle Treasury-Wallet',
      checked: 'Geprüft',
      importedAddress: 'Importierte Adresse',
      replacedExistingWallet: 'Bestehende Wallet ersetzt',
      imported: 'Importiert',
    },
    dangerZone: {
      label: 'Gefahrenzone',
      caption: 'Lokale Treasury-Wallet löschen',
      warning:
        'Das Löschen der lokalen Treasury-Wallet entfernt die auf diesem Gerät gespeicherten Treasury-Wallet-Daten. Tu dies nur, wenn du sicher bist, dass die Wallet gesichert ist oder nicht mehr benötigt wird.',
    },
    safetyNotice:
      'Der Entwicklungssicherheitsmodus ist weiterhin aktiv. Treasury-Werkzeuge sind für Tests verfügbar, während der echte Händlerbetrieb vorbereitet wird.',
    messages: {
      couldNotLoadWalletInfo:
        'Treasury-Wallet-Informationen konnten nicht geladen werden.',
      createdWallet: 'Treasury-Wallet erstellt.',
      couldNotCreateWallet: 'Treasury-Wallet konnte nicht erstellt werden.',
      clearedWallet: 'Treasury-Wallet gelöscht.',
      couldNotClearWallet: 'Treasury-Wallet konnte nicht gelöscht werden.',
      balanceRefreshed: 'Treasury-Guthaben aktualisiert.',
      couldNotRefreshBalance:
        'Treasury-Guthaben konnte nicht aktualisiert werden. Prüfe deine Verbindung und versuche es erneut.',
      seedBackupLoaded: 'Treasury-Seed-Backup geladen.',
      couldNotLoadBackupInfo:
        'Treasury-Backup-Informationen konnten nicht geladen werden.',
      seedBackupHidden: 'Treasury-Seed-Backup verborgen.',
      restoreSeedCheckCompleted:
        'Prüfung des Treasury-Wiederherstellungs-Seeds abgeschlossen.',
      couldNotCheckRestoreSeed:
        'Treasury-Wiederherstellungs-Seed konnte nicht geprüft werden.',
      checkSeedBeforeImporting:
        'Prüfe eine Treasury-Seed-Phrase vor dem Import.',
      importedCheckedSeed:
        'Geprüfter Treasury-Seed wurde in den lokalen Speicher importiert.',
      couldNotImportSeed: 'Treasury-Seed konnte nicht importiert werden.',
      restoreToolCleared: 'Treasury-Wiederherstellungswerkzeug geleert.',
    },
  },

  treasuryTopUpQr: {
    title: 'Treasury-Auflade-QR',
    subtitle:
      'Scanne diesen QR-Code mit einer anderen BCH-Wallet, um die Treasury-Wallet des Händlers aufzuladen.',
    qrAlt: 'QR-Code zum Aufladen der Treasury',
    qrUnavailable: 'QR-Code nicht verfügbar.',
    treasuryAddress: 'Adresse der Treasury-Wallet',
    paymentUri: 'BCH-Zahlungs-URI',
    qrGenerated: 'QR erstellt',
    copy: 'Kopieren',
    copyAddress: 'Adresse kopieren',
    copyPaymentUri: 'Zahlungs-URI kopieren',
    tapQrToCopy: 'Tippe auf den QR-Code, um die Wallet-Adresse zu kopieren.',
    watching: 'Warte auf eingehendes BCH...',
    watchingError:
      'Eingehendes BCH konnte nicht überwacht werden. Du kannst die Adresse trotzdem kopieren und den Kontostand nach dem Senden aktualisieren.',
    receivedTitle: 'Empfangen',
    receivedSubtitle:
      'Eingehendes BCH wurde in deiner Treasury-Wallet erkannt. Schließe dieses Fenster, um zum aktualisierten Wallet-Kontostand zurückzukehren.',
    receivedAmount: 'Empfangen',
    receivedTxid: 'Transaktion',
    uriLabel: 'BCH-Gutschein-Treasury',
    uriMessage: 'Treasury-Wallet des Händlers aufladen',
    addressCopied: 'Treasury-Adresse kopiert.',
    uriCopied: 'Treasury-Zahlungs-URI kopiert.',
    copyFailed: 'Konnte nicht in die Zwischenablage kopieren.',
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

  layout: {
    brand: {
      title: 'Bitcoin-Cash-Gutscheine',
      subtitle: 'Händler-App',
    },
    drawer: {
      subtitle: 'Gutschein-App für Händler',
    },
    navigation: {
      openMenu: 'Navigationsmenü öffnen',
      closeMenu: 'Navigationsmenü schließen',
    },
    status: {
      treasury: 'Treasury',
      printerPending: 'Drucker ausstehend',
      devMode: 'Dev-Modus',
    },
    sections: {
      main: 'Hauptmenü',
      merchantSetup: 'Händler-Einrichtung',
      help: 'Hilfe',
      advanced: 'Erweitert',
    },
    items: {
      home: 'Startseite',
      sellVoucher: 'Voucher verkaufen',
      cashOut: 'BCH auszahlen',
      voucherHistory: 'Voucher-Verlauf',
      treasuryWallet: 'Treasury-Wallet',
      printerSetup: 'Drucker einrichten',
      appSettings: 'App-Einstellungen',
      checkForUpdates: 'Check for Updates',
      updateAvailable: 'Update Available',
      checkForUpdatesCaption: 'App version and download status',
      howToSellVoucher: 'So verkaufst du einen Voucher',
      howToCashOut: 'How to Cash-out',
      howCustomersRedeem: 'So lösen Kunden ein',
      faq: 'FAQ',
      support: 'Support',
      communities: 'Communities',
      socialMedia: 'Soziale Medien',
      developerTools: 'Entwicklerwerkzeuge',
    },
    common: {
      comingSoon: 'Demnächst',
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
      title: 'Druckvorschau',
      subtitle: 'A4-Vorschau des Händlerberichts',
      pdfTitle: 'PDF exportieren',
      pdfSubtitle: 'Diesen A4-Händlerbericht als PDF speichern.',
      savePdf: 'Als PDF speichern',
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
      close: 'Schließen',
      print: 'Drucken',
      reportTitle: 'Händlerbericht',
      selectedRange: 'Ausgewählter Zeitraum',
      generated: 'Erstellt',
      atAGlance: 'Auf einen Blick',
      topupsVsCashOuts: 'Aufladungen vs. Auszahlungen',
      currencyBreakdown: 'Aufschlüsselung nach Währung',
      currency: 'Währung',
      topups: 'Aufladungen',
      cashOuts: 'Auszahlungen',
      totalFiat: 'Fiat gesamt',
      noCurrencyData:
        'In diesem Zeitraum gibt es noch keine Währungsaktivität.',
      localNotice:
        'Lokal aus Datensätzen erstellt, die auf diesem Gerät gespeichert sind. Es werden keine Berichtsdaten an einen Server gesendet.',
    },
    connectedNotice:
      'Berichte sind jetzt mit den lokalen Aufladungs- und Auszahlungsdatensätzen auf diesem Gerät verbunden.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'Geladener Wert',
      scanToRedeem: 'Zum Einlösen scannen',
      reference: 'Referenz',
      issued: 'Ausgestellt',
      customerPaid: 'Kunde bezahlt',
      loaded: 'Geladen',
      voucherAddress: 'Gutschein-Adresse',
    },
    privateKeyWarning:
      'Nur Entwicklungsvorschau. Dieser Beleg enthält einen QR-Code mit einem übertragbaren privaten Schlüssel. Jede Person, die ihn scannt oder kopiert, kann die Voucher-Gelder übertragen.',
    loading: 'Belegvorschau wird erstellt...',
    receiptTitle: 'BCH-Voucher',
    printerSubtitle: 'Topup Voucher',
    receiptSubtitle: 'Übertragbarer BCH-Voucher-Beleg',
    voucherValueLoaded: 'Geladener Voucher-Wert',
    scanToSweep: 'Zum Übertragen scannen',
    qrAlt: 'QR-Code für übertragbaren BCH-Voucher',
    reference: 'Referenz',
    issued: 'Ausgestellt',
    customerPaid: 'Kunde zahlte',
    voucherAddress: 'Voucher-Adresse',
    keepSafeUntilRedeemed: 'Bis zur Einlösung sicher aufbewahren',
    redemptionInstruction:
      'Scanne diesen QR-Code mit einer Bitcoin-Cash-Wallet, die das Übertragen privater Schlüssel unterstützt.',
    cashWarning:
      'Behandle diesen Beleg wie Bargeld. Jede Person mit diesem QR-Code kann die Gelder übertragen.',
    supportNote:
      'Bewahre diesen Beleg sicher auf, bis das BCH in deine eigene Wallet übertragen wurde.',
    couldNotBuildPreview: 'Voucher-Belegvorschau konnte nicht erstellt werden.',
    errors: {
      invalidDerivationIndex:
        'Der Voucher hat keinen gültigen Ableitungsindex.',
      missingSerial: 'Der Voucher hat keine Serien-/Referenznummer.',
      missingFiatCurrency: 'Der Voucher hat keine Fiat-Währung.',
      invalidBchAmount: 'Der Voucher hat keinen gültigen geladenen BCH-Betrag.',
      missingAddress: 'Der Voucher hat keine BCH-Adresse.',
      addressMismatch:
        'Die Voucher-Adresse stimmt nicht mit der Adresse des exportierten Voucher-Schlüssels überein.',
    },
  },
};

export default de;
