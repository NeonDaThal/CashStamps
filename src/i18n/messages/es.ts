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
  },

  home: {
    eyebrow: 'Aplicación de vales para comercios',
    title: 'Vales de Bitcoin Cash',
    intro:
      'Vende vales de Bitcoin Cash en tienda, emite un recibo y permite que el cliente transfiera el BCH a su propia billetera.',
    actionTitle: '¿Qué quieres hacer?',
    actionSubtitle: 'Elige la siguiente acción del comercio.',
    sellVoucher: 'Vender nuevo vale',
    voucherHistory: 'Historial de vales',
    treasuryWallet: 'Billetera de tesorería',
    receiptPreview: 'Vista previa del recibo',
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
    title: 'QR de recarga de tesorería',
    subtitle:
      'Escanea este código QR desde otra billetera BCH para recargar la billetera de tesorería del comercio.',
    receiveOnlyNotice:
      'QR solo para recibir. Esto permite que el comercio añada BCH a la billetera de tesorería. No gasta ni transmite nada desde esta app.',
    qrAlt: 'Código QR de recarga de tesorería',
    qrUnavailable: 'Código QR no disponible.',
    treasuryAddress: 'Dirección de tesorería',
    paymentUri: 'URI de pago BCH',
    qrGenerated: 'QR generado',
    copyAddress: 'Copiar dirección',
    copyPaymentUri: 'Copiar URI de pago',
    uriLabel: 'Tesorería de vales BCH',
    uriMessage: 'Recargar billetera de tesorería del comercio',
    addressCopied: 'Dirección de tesorería copiada.',
    uriCopied: 'URI de pago de tesorería copiado.',
    copyFailed: 'No se pudo copiar al portapapeles.',
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
      voucherHistory: 'Historial de vales',
      treasuryWallet: 'Billetera de tesorería',
      printerSetup: 'Configurar impresora',
      appSettings: 'Ajustes de la app',
      howToSellVoucher: 'Cómo vender un vale',
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
  },
  receiptPreview: {
    privateKeyWarning:
      'Solo vista previa de desarrollo. Este recibo contiene un QR de clave privada barrible. Cualquier persona que lo escanee o copie puede barrer los fondos del vale.',
    loading: 'Construyendo vista previa del recibo...',
    receiptSubtitle: 'Recibo de vale BCH barrible',
    voucherValueLoaded: 'Valor cargado en el vale',
    scanToSweep: 'Escanear para barrer',
    qrAlt: 'Código QR de vale BCH barrible',
    reference: 'Referencia',
    issued: 'Emitido',
    customerPaid: 'El cliente pagó',
    voucherAddress: 'Dirección del vale',
    keepSafeUntilRedeemed: 'Guardar de forma segura hasta redimir',
    couldNotBuildPreview:
      'No se pudo construir la vista previa del recibo del vale.',
  },
};

export default es;
