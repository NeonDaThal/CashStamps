const es = {
  common: {
    appName: 'Impresora de vales BCH',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'Vale BCH',
    continue: 'Continuar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    back: 'Atrás',
    done: 'Listo',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    yes: 'Sí',
    no: 'No',
  },

  language: {
    label: 'Idioma',
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
    eyebrow: 'Aplicación de vales para comercios',
    title: 'Recargas Bitcoin Cash',
    intro:
      'Vende vales de Bitcoin Cash en tienda, emite un recibo y permite que el cliente transfiera el BCH a su propia billetera.',
    actionTitle: '¿Qué quieres hacer?',
    actionSubtitle: 'Elige la siguiente acción del cliente.',
    sellVoucher: 'Recarga',
    cashOutBch: 'Retiro',
    voucherHistory: 'Historial',
    treasuryWallet: 'Tesorería',
    receiptPreview: 'Vista previa del recibo',
    glance: {
      title: 'De un vistazo',
      subtitle: 'Resumen de la actividad de hoy hasta el momento',
      topups: 'Recargas',
      cashOuts: 'Retiros',
      totalActions: 'Total de acciones',
    },
    status: {
      receipts: {
        title: 'Recibos de vales',
        text: 'La vista previa del recibo en navegador está lista.',
      },
      printer: {
        title: 'Impresora térmica',
        text: 'La conexión con la impresora se añadirá después.',
      },
      cashHandling: {
        title: 'Manejo de efectivo',
        text: 'Trata los códigos QR de vales impresos como dinero en efectivo.',
      },
    },
  },

  sellForm: {
    customerCashAmount: 'Importe en efectivo del cliente',
    salePreviewTitle: 'Vista previa de la venta',
    salePreviewSubtitle:
      'Se bloqueará una cotización BCH en vivo en la pantalla de revisión.',
    customerPays: 'El cliente paga',
    serviceFee: 'Comisión de servicio',
    voucherValueBeforeQuote: 'Valor del vale antes de la cotización',
    quoteSource: 'Fuente de cotización',
    lockedAfterReview: 'Bloqueada después de la revisión',
    reviewVoucher: 'Revisar vale',
    viewHistory: 'Ver historial',
  },

  issueProgress: {
    title: 'Emitiendo vale',
    subtitle: 'Preparando el registro del vale y el recibo para el cliente.',
    safetyModeNotice:
      'El modo de seguridad de desarrollo está activo. La emisión de vales se puede probar mientras la transmisión en vivo sigue protegida por las barreras de seguridad existentes.',
  },

  sellPage: {
    hero: {
      eyebrow: 'Cobro del comercio',
      title: 'Vender vale BCH',
      intro:
        'Introduce el importe en efectivo del cliente, revisa el valor en BCH, emite el vale y muestra el QR del recibo al cliente.',
    },
    treasury: {
      title: 'Billetera de tesorería',
      subtitle: 'Esta billetera suministra BCH para los vales emitidos.',
      ready: 'Lista',
      address: 'Dirección',
      balance: 'Saldo',
      lastChecked: 'Última comprobación',
      balanceNotChecked: 'El saldo aún no se ha comprobado.',
      notSetUp: 'No configurada',
      setUpBeforeUse:
        'Configura la billetera de tesorería antes del uso real en comercio.',
      refreshBalance: 'Actualizar saldo',
    },
    sale: {
      eyebrow: 'Nuevo vale',
      title: 'Introduce el importe de la venta',
      copy: 'Añade el importe en efectivo que paga el cliente. La app bloqueará una cotización BCH y mostrará una pantalla de revisión antes de emitir el vale.',
    },
    issued: {
      title: 'Vale emitido',
      subtitle:
        'El vale se ha guardado y la vista previa del recibo está lista para el cliente.',
      voucherReference: 'Referencia del vale',
      customerPaid: 'El cliente pagó',
      bchLoaded: 'BCH cargado',
      voucherAddress: 'Dirección del vale',
      issueAnother: 'Emitir otro',
    },
    developerDetails: {
      title: 'Detalles de desarrollo',
      derivationIndex: 'Índice de derivación',
      wifExportReady: 'Exportación WIF lista',
      platformFeePlan: 'Plan de comisión de plataforma',
      recordStatus: 'Estado del registro',
    },
    issueSteps: {
      quote: {
        label: 'Confirmar cotización bloqueada',
        description:
          'Usar la cotización BCH/GBP bloqueada antes de la confirmación.',
      },
      wallet: {
        label: 'Preparar billetera del vale',
        description:
          'Usar la dirección del vale preparada antes de la confirmación.',
      },
      funding: {
        label: 'Preparar plan de financiación',
        description:
          'Comprobar el plan de financiación preparado mientras la transmisión en vivo sigue protegida.',
      },
      store: {
        label: 'Guardar registro del vale',
        description: 'Guardar localmente el registro de venta del vale.',
      },
    },
    receiptDialog: {
      title: 'Recibo del vale',
      subtitle: 'Vista previa del recibo en el momento de emisión',
    },
    safetyNotice:
      'El modo de seguridad de desarrollo sigue activo. La experiencia del comercio se está puliendo, pero la transmisión de transacciones en vivo sigue protegida por las barreras de seguridad existentes hasta que se cambie explícitamente.',
    messages: {
      treasuryNotSetUpWarning:
        'La billetera de tesorería no está configurada. La revisión del vale puede continuar, pero la financiación en vivo estará bloqueada hasta que exista una billetera de tesorería.',
      treasuryBalanceNotCheckedWarning:
        'El saldo de tesorería no se ha comprobado. La revisión del vale puede continuar, pero la financiación en vivo requerirá una comprobación de saldo reciente.',
      treasuryBalanceTooLow:
        'El saldo de tesorería es demasiado bajo para este vale. Requerido: {required}. Disponible: {available}.',
      couldNotLoadTreasuryWallet:
        'No se pudo cargar el estado de la billetera de tesorería.',
      treasuryBalanceRefreshed: 'Saldo de tesorería actualizado.',
      couldNotRefreshTreasuryBalance:
        'No se pudo actualizar el saldo de tesorería. Comprueba tu conexión e inténtalo de nuevo.',
      enterValidCashAmount: 'Introduce primero un importe en efectivo válido.',
      treasuryBalanceCheckTimedOut:
        'La comprobación del saldo de tesorería agotó el tiempo de espera.',
      treasuryBalanceCouldNotBeCheckedWarning:
        'No se pudo comprobar el saldo de tesorería. La revisión del vale puede continuar, pero la financiación en vivo requerirá una comprobación de saldo reciente.',
      voucherKeyExportFailed:
        'La comprobación de exportación de la clave del vale falló. La revisión puede continuar, pero imprimir/barrer requerirá exportación WIF.',
      fallbackQuoteWarning:
        'El precio en vivo no estaba disponible, por lo que se está usando una cotización reciente en caché. Revisa la cotización con cuidado antes de emitir.',
      liveQuoteLocked: 'Cotización de precio en vivo bloqueada correctamente.',
      couldNotPrepareReview:
        'No se pudo preparar la revisión del vale. Comprueba la conexión e inténtalo de nuevo.',
      noLockedQuote:
        'No hay una cotización bloqueada disponible. Revisa el vale de nuevo.',
      noVoucherAddress:
        'No hay una dirección de vale disponible. Revisa el vale de nuevo.',
      couldNotIssueVoucher: 'No se pudo emitir el vale.',
    },
  },
  cashOutPage: {
    hero: {
      eyebrow: 'Vender BCH por efectivo',
      title: 'Vender BCH por efectivo',
      intro:
        'Introduce el importe en efectivo que el cliente quiere recibir. La app calculará cuánto BCH debe enviar a la tesorería del comercio.',
    },
    actions: {
      treasuryWallet: 'Billetera de tesorería',
      voucherHistory: 'Historial de vales',
      reviewCashOut: 'Revisar retirada',
    },
    form: {
      cashAmountLabel: 'Importe en efectivo a pagar',
      paymentQrNotice:
        'El cliente escaneará un QR de pago BCH. La retirada solo se completará después de detectar BCH en la billetera de tesorería.',
    },
    preview: {
      title: 'Vista previa de retirada',
      subtitle: 'El importe final en BCH se bloquea después de la revisión.',
      customerReceivesCash: 'El cliente recibe efectivo',
      serviceFeeSpread: 'Comisión de servicio / margen',
      customerSendsValue: 'Valor que envía el cliente',
      quoteSource: 'Fuente de cotización',
      lockedAfterReview: 'Bloqueado después de revisar',
    },
    paymentUri: {
      label: 'Retirada BCH',
    },
    safetyNotice:
      'El BCH del cliente debe detectarse antes de que el comercio entregue efectivo.',
    messages: {
      couldNotLoadTreasuryWallet:
        'No se pudo cargar la billetera de tesorería.',
      enterValidCashAmount: 'Introduce un importe en efectivo válido.',
      setUpTreasuryFirst:
        'Configura la billetera de tesorería del comercio antes de preparar una retirada.',
      fallbackQuoteWarning:
        'Se usó una cotización de respaldo. Comprueba cuidadosamente el tipo de cambio antes de continuar.',
      pricingUnavailable:
        'Los precios no están disponibles actualmente. Comprueba tu conexión e inténtalo de nuevo.',
      couldNotPrepareCashOut: 'No se pudo preparar la retirada.',
      receiptPrintingPending:
        'La impresión del recibo se conectará después de añadir la detección de pago.',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: 'Revisar retiro',
      receivedTitle: 'BCH recibido',
      reviewSubtitle:
        'Pide al cliente que escanee el código QR y envíe el BCH requerido.',
      receivedSubtitle:
        'El pago del cliente ha sido detectado en la tesorería del comercio.',
    },
    quoteStatus: {
      fallback:
        'Se usó una cotización de respaldo. Comprueba cuidadosamente el tipo de cambio antes de continuar.',
      liveLocked: 'Cotización de precio en vivo bloqueada correctamente.',
    },
    breakdown: {
      title: 'Desglose del retiro',
      subtitle: 'Pago al cliente y BCH requerido',
      cashOutAmount: 'Importe del retiro',
      cashOutAmountNote: 'Efectivo pagado al cliente',
      serviceFeeSpread: 'Comisión de servicio / margen',
      cashOutTotal: 'Total del retiro',
      cashOutTotalNote: 'El cliente envía este valor total en BCH',
    },
    summary: {
      cashCustomerReceives: 'Efectivo que recibe el cliente',
      customerSends: 'El cliente envía',
      fiatEquivalentSent: 'Equivalente fiat enviado',
      serviceFeeSpread: 'Comisión de servicio / margen',
    },
    paymentQr: {
      title: 'QR de pago del cliente',
      subtitle:
        'Pide al cliente que escanee este código QR con su billetera BCH. Espera a que el pago BCH llegue a tu billetera de tesorería antes de entregar el efectivo.',
      qrAlt: 'QR de pago BCH para retirada',
      qrUnavailable: 'QR no disponible',
    },
    paymentDetails: {
      amountToSend: 'Importe a enviar',
      treasuryReceivingAddress: 'Dirección receptora de tesorería',
      tapToRevealAddress: 'Toca para mostrar la dirección completa',
      paymentUri: 'URI de pago',
    },
    paymentUri: {
      label: 'Retirada BCH',
    },
    details: {
      orderDetailsTitle: 'Detalles del pedido',
      orderDetailsCaption: 'Haz clic aquí para ver los detalles del retiro',
      reference: 'Referencia',
      marketRate: 'Tipo de cambio de mercado',
      quoteSource: 'Fuente de cotización',
      fallbackBadge: 'respaldo',
      quoteTime: 'Hora de cotización',
      quoteExpires: 'La cotización vence',
      status: 'Estado',
      bchReceived: 'BCH recibido',
      transactionId: 'ID de transacción',
      detected: 'Detectado',
    },
    success: {
      title: 'BCH recibido',
      nowGiveCustomer: 'Ahora entrega al cliente',
      cash: 'en efectivo',
    },
    actions: {
      copyAddress: 'Copiar dirección',
      copyPaymentUri: 'Copiar URI de pago',
      closeReview: 'Cancelar retiro y cerrar',
      printReceipt: 'Imprimir recibo',
    },
    messages: {
      treasuryAddressCopied: 'Dirección de tesorería copiada.',
      paymentUriCopied: 'URI de pago copiado.',
      copyFailed: 'Error al copiar.',
    },
    quoteSources: {
      developmentQuote: 'Cotización de desarrollo',
      cachedQuote: 'Cotización en caché',
      manualQuote: 'Cotización manual',
      unknown: 'Desconocida',
    },
  },
  saleConfirm: {
    title: 'Revisar vale',
    subtitle:
      'Confirma el pago del cliente, el importe en BCH y los detalles del recibo antes de emitir este vale.',
    quoteStatus: {
      fallback:
        'El precio en vivo no estaba disponible, por lo que se está usando una cotización reciente en caché. Revisa la cotización con cuidado antes de emitir.',
      liveLocked: 'Cotización de precio en vivo bloqueada correctamente.',
    },
    summary: {
      customerPays: 'El cliente paga',
      voucherValue: 'Valor del vale',
      bchLoaded: 'BCH cargado',
      serviceFee: 'Comisión de servicio',
    },
    details: {
      marketRate: 'Tipo de cambio de mercado',
      quoteSource: 'Fuente de cotización',
      fallbackBadge: 'respaldo',
      quoteTime: 'Hora de cotización',
      quoteExpires: 'La cotización vence',
      treasuryBalance: 'Saldo de tesorería',
    },
    fundingReadiness: {
      ready:
        'Las comprobaciones de preparación de financiación pasaron. La transmisión de transacciones en vivo sigue protegida por la barrera de seguridad actual.',
      notReady: 'La financiación en vivo aún no está lista.',
    },
    safetyNotice:
      'El modo de seguridad de desarrollo está activo. Esta pantalla puede emitir el registro del vale y la vista previa del recibo, mientras la transmisión en vivo sigue protegida hasta que se active explícitamente.',
    actions: {
      issueVoucher: 'Emitir vale',
    },
    quoteSources: {
      developmentQuote: 'Cotización de desarrollo',
      cachedQuote: 'Cotización en caché',
    },
  },
  historyPage: {
    hero: {
      eyebrow: 'Registros de vales',
      title: 'Historial de vales',
      intro:
        'Revisa los vales BCH emitidos, comprueba el estado de redención y accede a vistas previas de recibos de desarrollo mientras se prepara la prueba de impresora.',
    },
    actions: {
      sellVoucher: 'Vender vale',
    },
    summary: {
      totalVouchers: 'Total de vales',
      openActive: 'Abiertos / activos',
      sweptRedeemed: 'Barridos / redimidos',
    },
    records: {
      title: 'Registros de vales',
      subtitle:
        'La información del vale orientada al cliente aparece primero. Las herramientas técnicas de financiación y prueba se mantienen dentro de cada registro.',
    },
    safetyNotice:
      'El modo de seguridad de desarrollo sigue activo. La vista previa del recibo y las herramientas de redención siguen disponibles para pruebas antes de conectar el flujo final de impresora.',
    messages: {
      couldNotLoadVoucherRecords:
        'No se pudieron cargar los registros de vales.',
      createdTestVoucher: 'Vale de prueba {serial} creado.',
      couldNotCreateTestVoucher: 'No se pudo crear el vale de prueba.',
      markedManualRedemption:
        '{serial} marcado como barrido/redimido manualmente.',
      couldNotFindVoucherRecordToUpdate:
        'No se pudo encontrar el registro de vale para actualizar.',
      couldNotMarkVoucherAsManuallyRedeemed:
        'No se pudo marcar el vale como redimido manualmente.',
      clearedManualRedemption:
        'Estado de redención manual borrado para {serial}.',
      couldNotClearManualRedemption:
        'No se pudo borrar el estado de redención manual.',
      couldNotFindVoucherRecordToCheck:
        'No se pudo encontrar el registro de vale para comprobar.',
      checkedOnChainRedemptionStatus:
        'Estado de redención en cadena comprobado para {serial}: {status}.',
      couldNotUpdateVoucherRedemptionDetectionResult:
        'No se pudo actualizar el resultado de detección de redención del vale.',
      couldNotCheckVoucherRedemptionStatus:
        'No se pudo comprobar el estado de redención del vale.',
      clearedAllLocalTestVoucherRecords:
        'Todos los registros locales de vales de prueba fueron borrados.',
      couldNotClearVoucherRecords:
        'No se pudieron borrar los registros de vales.',
    },
  },
  historyList: {
    empty: {
      title: 'Aún no hay registros de vales',
      text: 'Los vales emitidos aparecerán aquí después de completar una venta.',
    },
    issuedDate: 'Emitido {date}',
    summary: {
      customerPaid: 'El cliente pagó',
      bchLoaded: 'BCH cargado',
      redemption: 'Redención',
      quote: 'Cotización',
    },
    address: {
      voucherAddress: 'Dirección del vale',
      notDerivedYet: 'Aún no derivada',
    },
    actions: {
      previewReceipt: 'Vista previa del recibo',
      checkRedemption: 'Comprobar redención',
      checkOnChainStatus: 'Comprobar estado en cadena',
      markAsManuallySwept: 'Marcar como barrido manualmente',
      clearManualSweepStatus: 'Borrar estado de barrido manual',
    },
    status: {
      redeemed: 'Redimido',
      funded: 'Financiado',
      error: 'Error',
      issued: 'Emitido',
    },
    redemption: {
      manualSwept: 'Barrido manual',
      swept: 'Barrido',
      funded: 'Financiado',
      unfunded: 'Sin fondos',
      notChecked: 'No comprobado',
    },
    redemptionTools: {
      label: 'Herramientas de redención',
      caption: 'Estado de barrido manual y comprobación de redención en cadena',
      manualMarked: 'Vale marcado manualmente como barrido/redimido.',
      notCheckedYet: 'El estado de redención aún no se ha comprobado.',
      status: 'Estado',
      sweepTransactionId: 'ID de transacción de barrido',
      note: 'Nota',
      redeemed: 'Redimido',
      detectedStatus: 'Estado detectado',
      detectedBalance: 'Saldo detectado',
      detectedUtxos: 'UTXOs detectados',
      checked: 'Comprobado',
      sweepTxidOptional: 'TXID de barrido opcional',
      noteOptional: 'Nota opcional',
    },
    quoteSources: {
      cached: 'En caché',
      manual: 'Manual',
      unknown: 'Desconocida',
    },
  },
  treasuryPage: {
    common: {
      notConfigured: 'No configurada',
      valid: 'Válida',
      notReady: 'No lista',
      validNotRequired: 'Válida / no requerida',
    },
    hero: {
      eyebrow: 'Fondos del comercio',
      title: 'Billetera de tesorería',
      intro:
        'Gestiona la billetera BCH usada para financiar los recibos de vales de los clientes.',
    },
    walletStatus: {
      title: 'Estado de la billetera',
      subtitle:
        'Comprueba si la billetera de tesorería del comercio está lista.',
      setupBanner: 'La billetera de tesorería está configurada.',
      notSetupBanner:
        'Todavía no se ha configurado una billetera de tesorería.',
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
      title: 'Efectivo en caja',
      subtitle:
        'Registro opcional del efectivo físico para recargas, retiros e informes locales.',
      setUp: 'Configurar',
      notSetUp: 'No configurado',
      notSetUpPrompt:
        'Registra el efectivo físico disponible actualmente en esta tienda o caja.',
      currentBalance: 'Efectivo actual en caja',
      readyForManualTracking: 'Listo para el registro manual de efectivo.',
      lastUpdated: 'Última actualización: {date}',
      currency: 'Moneda',
      actions: {
        setUp: 'Configurar',
        addCash: 'Añadir efectivo',
        withdrawCash: 'Retirar efectivo',
        clear: 'Borrar efectivo en caja',
        confirmClear: 'Borrar efectivo en caja',
        saveSetup: 'Guardar',
        saveAdd: 'Guardar',
        saveWithdraw: 'Guardar',
      },
      dialog: {
        setupTitle: 'Configurar efectivo en caja',
        setupSubtitle:
          'Introduce el importe inicial de efectivo físico disponible actualmente.',
        addTitle: 'Añadir efectivo',
        addSubtitle:
          'Registra efectivo físico adicional añadido a la caja de la tienda.',
        withdrawTitle: 'Retirar efectivo',
        withdrawSubtitle:
          'Registra efectivo físico retirado de la caja de la tienda.',
        currentCash: 'Efectivo actual en caja',
        enteredAmount: 'Importe introducido',
        newCash: 'Nuevo efectivo en caja',
        startingAmount: 'Importe inicial',
        amountToAdd: 'Importe a añadir',
        amountToWithdraw: 'Importe a retirar',
        noteOptional: 'Nota opcional',
      },
      clearDialog: {
        title: '¿Borrar efectivo en caja?',
        message:
          'Esto restablece el efectivo en caja al estado no configurado. Las recargas y los retiros seguirán funcionando.',
        warning:
          'El saldo registrado actual es {amount}. Al borrarlo, se eliminará este saldo activo de la página de la billetera de tesorería.',
        clearNote: 'Efectivo en caja borrado manualmente.',
      },
      transactions: {
        link: 'Transacciones',
        title: 'Transacciones',
        subtitle: 'Movimientos de efectivo en caja que cambiaron este saldo.',
        emptyTitle: 'Aún no hay transacciones',
        emptySubtitle: 'Los cambios de efectivo en caja aparecerán aquí.',
        showing: 'Mostrando {count} de {total}',
        showMore: 'Mostrar 10 más',
        viewOlder: 'Ver transacciones anteriores',
        backToLatest: 'Volver a las transacciones recientes',
        olderPage: 'Transacciones anteriores · página {page}',
        detailTitle: 'Detalles del movimiento de efectivo',
        type: 'Tipo',
        date: 'Fecha',
        cashAmount: 'Importe en efectivo',
        balanceAfter: 'Saldo después',
        reference: 'Referencia',
        bchAddress: 'Dirección BCH',
        bchTransaction: 'Transacción BCH',
        note: 'Nota',
        noRelatedRecord: 'Registro relacionado no encontrado',
        types: {
          setup: 'Configuración',
          topup: 'Recarga',
          cashOut: 'Retiro',
          cashAdded: 'Efectivo añadido',
          withdrawal: 'Retiro',
          cleared: 'Borrado',
        },
        amount: {
          reset: 'Restablecido a {amount}',
        },
      },
      errors: {
        enterValidAmount: 'Introduce un importe de efectivo válido.',
        enterPositiveAmount: 'Introduce un importe mayor que cero.',
        withdrawTooMuch: 'No puedes retirar más efectivo del disponible.',
      },
      messages: {
        couldNotLoad: 'No se pudo cargar la información de efectivo en caja.',
        setUp: 'Efectivo en caja configurado.',
        added: 'Efectivo añadido al efectivo en caja.',
        withdrawn: 'Efectivo retirado del efectivo en caja.',
        cleared: 'Efectivo en caja borrado.',
        couldNotSave: 'No se pudo guardar el cambio de efectivo en caja.',
        couldNotClear: 'No se pudo borrar el efectivo en caja.',
      },
    },
    summary: {
      status: 'Estado',
      ready: 'Lista',
      notSetUp: 'No configurada',
      balance: 'Saldo',
      notChecked: 'No comprobado',
      utxos: 'UTXOs',
      lastChecked: 'Última comprobación',
      notCheckedYet: 'Aún no comprobado',
      balanceUnavailable: 'Fiat balance unavailable',
    },
    details: {
      treasuryAddress: 'Dirección de tesorería',
      created: 'Creada',
      updated: 'Actualizada',
    },
    actions: {
      sellVoucher: 'Vender vale',
      refreshBalance: 'Actualizar saldo',
      walletReady: 'Billetera de tesorería lista',
      createWallet: 'Crear billetera',
      hideSeed: 'Ocultar semilla',
      revealSeedBackup: 'Revelar copia de seguridad de semilla',
      clearRestoreTool: 'Limpiar herramienta de restauración',
      checkSeed: 'Comprobar semilla',
      importCheckedSeed: 'Importar semilla comprobada',
      clearTreasuryWallet: 'Borrar billetera de tesorería',
      create: 'Create',
    },
    utxoDetails: {
      label: 'Detalles de UTXO',
      caption: 'Salidas de tesorería avanzadas de solo lectura',
      description:
        'Estas son las salidas no gastadas detectadas actualmente para la billetera de tesorería. Esta sección es de solo lectura.',
      noneDetected: 'No se detectaron UTXOs de tesorería.',
      utxoNumber: 'UTXO {number}',
      value: 'Valor',
      tx: 'Tx',
      outputIndex: 'Índice de salida',
    },
    fundingConfig: {
      label: 'Configuración de financiación',
      caption:
        'Preparación de la dirección de comisión para financiación en vivo de tesorería',
      platformFeeValid:
        'La dirección de comisión de plataforma está configurada y es válida.',
      platformFeeInvalid:
        'La dirección de comisión de plataforma está configurada pero no es válida: {error}',
      platformFeeNotConfigured:
        'La dirección de comisión de plataforma no está configurada. La financiación en vivo debe permanecer desactivada.',
      bufferReserveValid:
        'La dirección de reserva de búfer está configurada y es válida.',
      bufferReserveOptional:
        'La salida de reserva de búfer es opcional para el MVP y actualmente no es requerida.',
      platformFeeAddress: 'Dirección de comisión de plataforma',
      platformFeeAddressStatus:
        'Estado de la dirección de comisión de plataforma',
      bufferReserveAddress: 'Dirección de reserva de búfer',
      bufferReserveAddressStatus: 'Estado de la dirección de reserva de búfer',
      configChecked: 'Configuración comprobada',
    },
    walletBackup: {
      label: 'Copia de seguridad de billetera',
      caption:
        'Copia de seguridad sensible de semilla para desarrollo y recuperación',
      warning:
        'Cualquier persona con esta frase semilla puede controlar el BCH de tesorería. Revélala solo en un entorno privado y seguro.',
      backupStatus: 'Estado de copia de seguridad',
      seedLoaded: 'Semilla cargada para copia de seguridad',
      seedNotRevealed: 'Semilla no revelada',
      seedPhrase: 'Frase semilla',
      exported: 'Exportada',
    },
    restore: {
      label: 'Restaurar / importar billetera',
      caption: 'Comprobar o importar una frase semilla de tesorería',
      warning:
        'Importar reemplazará la billetera de tesorería local actual. No pegues una frase semilla de producción en esta compilación de desarrollo.',
      seedInputLabel: 'Frase semilla de tesorería para comprobar/importar',
      matchesCurrentAddress:
        'Esta semilla deriva la dirección de tesorería actual.',
      differentAddress:
        'Esta semilla deriva una dirección de tesorería diferente.',
      importedIntoLocalStorage:
        'Billetera de tesorería importada al almacenamiento local.',
      derivedAddress: 'Dirección derivada',
      currentTreasuryAddress: 'Dirección de tesorería actual',
      noCurrentTreasuryWallet: 'No hay billetera de tesorería actual',
      checked: 'Comprobada',
      importedAddress: 'Dirección importada',
      replacedExistingWallet: 'Reemplazó billetera existente',
      imported: 'Importada',
    },
    dangerZone: {
      label: 'Zona de peligro',
      caption: 'Borrar la billetera de tesorería local',
      warning:
        'Borrar la billetera de tesorería local elimina los datos de billetera de tesorería guardados en este dispositivo. Hazlo solo cuando estés seguro de que la billetera está respaldada o ya no se necesita.',
    },
    safetyNotice:
      'El modo de seguridad de desarrollo sigue activo. Las herramientas de tesorería están disponibles para pruebas mientras se prepara la operación real del comercio.',
    messages: {
      couldNotLoadWalletInfo:
        'No se pudo cargar la información de la billetera de tesorería.',
      createdWallet: 'Billetera de tesorería creada.',
      couldNotCreateWallet: 'No se pudo crear la billetera de tesorería.',
      clearedWallet: 'Billetera de tesorería borrada.',
      couldNotClearWallet: 'No se pudo borrar la billetera de tesorería.',
      balanceRefreshed: 'Saldo de tesorería actualizado.',
      couldNotRefreshBalance:
        'No se pudo actualizar el saldo de tesorería. Comprueba tu conexión e inténtalo de nuevo.',
      seedBackupLoaded: 'Copia de seguridad de semilla de tesorería cargada.',
      couldNotLoadBackupInfo:
        'No se pudo cargar la información de copia de seguridad de tesorería.',
      seedBackupHidden: 'Copia de seguridad de semilla de tesorería ocultada.',
      restoreSeedCheckCompleted:
        'Comprobación de semilla de restauración de tesorería completada.',
      couldNotCheckRestoreSeed:
        'No se pudo comprobar la semilla de restauración de tesorería.',
      checkSeedBeforeImporting:
        'Comprueba una frase semilla de tesorería antes de importar.',
      importedCheckedSeed:
        'Semilla de tesorería comprobada importada al almacenamiento local.',
      couldNotImportSeed: 'No se pudo importar la semilla de tesorería.',
      restoreToolCleared: 'Herramienta de restauración de tesorería limpiada.',
    },
  },
  treasuryTopUpQr: {
    title: 'QR para recargar tesorería',
    subtitle:
      'Escanea este código QR desde otra billetera BCH para recargar la billetera de tesorería del comercio.',
    qrAlt: 'Código QR de recarga de tesorería',
    qrUnavailable: 'Código QR no disponible.',
    treasuryAddress: 'Dirección de la billetera de tesorería',
    paymentUri: 'URI de pago BCH',
    qrGenerated: 'QR generado',
    copy: 'Copiar',
    copyAddress: 'Copiar dirección',
    copyPaymentUri: 'Copiar URI de pago',
    tapQrToCopy: 'Toca el QR para copiar la dirección de la billetera.',
    watching: 'Esperando BCH entrante...',
    watchingError:
      'No se pudo vigilar la llegada de BCH. Aun así puedes copiar la dirección y actualizar el saldo después de enviar.',
    receivedTitle: 'Recibido',
    receivedSubtitle:
      'Se ha detectado BCH entrante en tu billetera de tesorería. Cierra esta ventana para volver al saldo actualizado de la billetera.',
    receivedAmount: 'Recibido',
    receivedTxid: 'Transacción',
    uriLabel: 'Tesorería de vales BCH',
    uriMessage: 'Recargar billetera de tesorería del comercio',
    addressCopied: 'Dirección de tesorería copiada.',
    uriCopied: 'URI de pago de tesorería copiado.',
    copyFailed: 'No se pudo copiar al portapapeles.',
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
      title: 'Vales de Bitcoin Cash',
      subtitle: 'App de comercio',
    },
    drawer: {
      subtitle: 'App de vales para comercios',
    },
    navigation: {
      openMenu: 'Abrir menú de navegación',
      closeMenu: 'Cerrar menú de navegación',
    },
    status: {
      treasury: 'Tesorería',
      printerPending: 'Impresora pendiente',
      devMode: 'Modo dev',
    },
    sections: {
      main: 'Principal',
      merchantSetup: 'Configuración del comercio',
      help: 'Ayuda',
      advanced: 'Avanzado',
    },
    items: {
      home: 'Inicio',
      sellVoucher: 'Vender vale',
      cashOut: 'Retirar efectivo',
      voucherHistory: 'Historial de vales',
      treasuryWallet: 'Billetera de tesorería',
      printerSetup: 'Configurar impresora',
      appSettings: 'Ajustes de la app',
      checkForUpdates: 'Check for Updates',
      checkForUpdatesCaption: 'App version and download status',
      updateAvailable: 'Update Available',
      howToSellVoucher: 'Cómo vender un vale',
      howToCashOut: 'How to Cash-out',
      howCustomersRedeem: 'Cómo redimen los clientes',
      faq: 'Preguntas frecuentes',
      support: 'Soporte',
      communities: 'Comunidades',
      socialMedia: 'Redes sociales',
      developerTools: 'Herramientas de desarrollo',
    },
    common: {
      comingSoon: 'Próximamente',
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
      title: 'Vista previa de impresión',
      subtitle: 'Vista previa del informe del comercio en A4',
      pdfTitle: 'Exportar PDF',
      pdfSubtitle: 'Guarda este informe del comercio en A4 como PDF.',
      savePdf: 'Guardar como PDF',
      imageTitle: 'Save Image',
      imageSubtitle: 'Save this A4 merchant report as a PNG image.',
      saveImage: 'Save Image',
      savingImage: 'Saving image…',
      imageSaved: 'Image saved',
      imageSavedAndroidCaption: 'Saved to Pictures/Bitcoin Cash Topups.',
      imageSavedDesktopCaption: 'Downloaded as a PNG image.',
      imageSaveFailed: 'Could not save image',
      imageSaveFailedCaption: 'Please try again.',
      close: 'Cerrar',
      print: 'Imprimir',
      reportTitle: 'Informe del comercio',
      selectedRange: 'Rango seleccionado',
      generated: 'Generado',
      atAGlance: 'De un vistazo',
      topupsVsCashOuts: 'Recargas vs retiros',
      currencyBreakdown: 'Desglose por moneda',
      currency: 'Moneda',
      topups: 'Recargas',
      cashOuts: 'Retiros',
      totalFiat: 'Total fiat',
      noCurrencyData: 'Aún no hay actividad por moneda en este rango.',
      localNotice:
        'Generado localmente a partir de registros guardados en este dispositivo. No se envían datos del informe a ningún servidor.',
    },
    connectedNotice:
      'Los informes ahora están conectados a los registros locales de recargas y retiros de este dispositivo.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'Valor cargado',
      scanToRedeem: 'Escanear para canjear',
      reference: 'Referencia',
      issued: 'Emitido',
      customerPaid: 'Cliente pagó',
      loaded: 'Cargado',
      voucherAddress: 'Dirección del vale',
    },
    privateKeyWarning:
      'Solo vista previa de desarrollo. Este recibo contiene un QR de clave privada barrible. Cualquier persona que lo escanee o copie puede barrer los fondos del vale.',
    loading: 'Construyendo vista previa del recibo...',
    receiptTitle: 'Vale BCH',
    printerSubtitle: 'Topup Voucher',
    receiptSubtitle: 'Recibo de vale BCH barrible',
    voucherValueLoaded: 'Valor cargado en el vale',
    scanToSweep: 'Escanear para barrer',
    qrAlt: 'Código QR de vale BCH barrible',
    reference: 'Referencia',
    issued: 'Emitido',
    customerPaid: 'El cliente pagó',
    voucherAddress: 'Dirección del vale',
    keepSafeUntilRedeemed: 'Guardar de forma segura hasta redimir',
    redemptionInstruction:
      'Escanea este código QR con una billetera de Bitcoin Cash compatible con barrido de claves privadas.',
    cashWarning:
      'Trata este recibo como dinero en efectivo. Cualquier persona con este código QR puede barrer los fondos.',
    supportNote:
      'Guarda este recibo de forma segura hasta que el BCH haya sido barrido a tu propia billetera.',
    couldNotBuildPreview:
      'No se pudo construir la vista previa del recibo del vale.',
    errors: {
      invalidDerivationIndex:
        'El vale no tiene un índice de derivación válido.',
      missingSerial: 'El vale no tiene número de serie/referencia.',
      missingFiatCurrency: 'El vale no tiene una moneda fiat.',
      invalidBchAmount: 'El vale no tiene un importe BCH cargado válido.',
      missingAddress: 'El vale no tiene una dirección BCH.',
      addressMismatch:
        'La dirección del vale no coincide con la dirección de la clave de vale exportada.',
    },
  },
};

export default es;
