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
};

export default es;
