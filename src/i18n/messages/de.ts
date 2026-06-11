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
  },

  home: {
    eyebrow: 'Gutschein-App für Händler',
    title: 'Bitcoin-Cash-Gutschein',
    intro:
      'Verkaufe Bitcoin-Cash-Voucher im Geschäft, stelle einen Beleg aus und ermögliche dem Kunden, das BCH in seine eigene Wallet zu übertragen.',
    actionTitle: 'Was möchtest du tun?',
    actionSubtitle: 'Wähle die nächste Händleraktion.',
    sellVoucher: 'Neuen Voucher verkaufen',
    cashOutBch: 'BCH gegen Bargeld auszahlen',
    voucherHistory: 'Voucher-Verlauf',
    treasuryWallet: 'Treasury-Wallet',
    receiptPreview: 'Belegvorschau',
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
      reviewTitle: 'Auszahlungszahlung prüfen',
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
      paymentUri: 'Zahlungs-URI',
    },
    paymentUri: {
      label: 'BCH-Auszahlung',
    },
    details: {
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
      closeReview: 'Prüfung schließen',
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
    receiveOnlyNotice:
      'Nur-Empfangs-QR. Damit kann der Händler BCH zur Treasury-Wallet hinzufügen. Aus dieser App wird nichts ausgegeben oder übertragen.',
    qrAlt: 'Treasury-Auflade-QR-Code',
    qrUnavailable: 'QR-Code nicht verfügbar.',
    treasuryAddress: 'Treasury-Adresse',
    paymentUri: 'BCH-Zahlungs-URI',
    qrGenerated: 'QR generiert',
    copyAddress: 'Adresse kopieren',
    copyPaymentUri: 'Zahlungs-URI kopieren',
    uriLabel: 'BCH-Voucher-Treasury',
    uriMessage: 'Treasury-Wallet des Händlers aufladen',
    addressCopied: 'Treasury-Adresse kopiert.',
    uriCopied: 'Treasury-Zahlungs-URI kopiert.',
    copyFailed: 'Konnte nicht in die Zwischenablage kopiert werden.',
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
      howToSellVoucher: 'So verkaufst du einen Voucher',
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
  },

  receiptPreview: {
    privateKeyWarning:
      'Nur Entwicklungsvorschau. Dieser Beleg enthält einen QR-Code mit einem übertragbaren privaten Schlüssel. Jede Person, die ihn scannt oder kopiert, kann die Voucher-Gelder übertragen.',
    loading: 'Belegvorschau wird erstellt...',
    receiptTitle: 'BCH-Voucher',
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
