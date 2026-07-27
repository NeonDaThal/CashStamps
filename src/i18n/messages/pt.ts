const pt = {
  common: {
    appName: 'Impressora de vales BCH',
    bitcoinCash: 'Bitcoin Cash',
    bchVoucher: 'Vale BCH',
    continue: 'Continuar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Fechar',
    back: 'Voltar',
    done: 'Concluído',
    loading: 'A carregar...',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
    yes: 'Sim',
    no: 'Não',
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
    eyebrow: 'App de vales para comerciantes',
    title: 'Recargas Bitcoin Cash',
    intro:
      'Venda vales de Bitcoin Cash na loja, emita um recibo e permita que o cliente transfira o BCH para a sua própria carteira.',
    actionTitle: 'O que pretende fazer?',
    actionSubtitle: 'Escolha a próxima ação do comerciante.',
    sellVoucher: 'Recarga',
    cashOutBch: 'Retirada',
    voucherHistory: 'Histórico de vales',
    treasuryWallet: 'Carteira de tesouraria',
    receiptPreview: 'Pré-visualização do recibo',
    glance: {
      title: 'Visão geral',
      subtitle: 'Resumo da atividade de hoje até agora',
      topups: 'Recargas',
      cashOuts: 'Retiradas',
      totalActions: 'Total de ações',
    },
    status: {
      receipts: {
        title: 'Recibos de vales',
        text: 'Pré-visualização do recibo no navegador pronta.',
      },
      printer: {
        title: 'Impressora térmica',
        text: 'A ligação à impressora será adicionada a seguir.',
      },
      cashHandling: {
        title: 'Manuseamento de dinheiro',
        text: 'Trate os códigos QR dos vales impressos como dinheiro.',
      },
    },
  },

  sellForm: {
    customerCashAmount: 'Valor em dinheiro do cliente',
    salePreviewTitle: 'Pré-visualização da venda',
    salePreviewSubtitle:
      'Uma cotação BCH em tempo real será bloqueada no ecrã de revisão.',
    customerPays: 'Cliente paga',
    serviceFee: 'Taxa de serviço',
    voucherValueBeforeQuote: 'Valor do vale antes da cotação',
    quoteSource: 'Fonte da cotação',
    lockedAfterReview: 'Bloqueada após a revisão',
    reviewVoucher: 'Rever vale',
    viewHistory: 'Ver histórico',
  },

  issueProgress: {
    title: 'A emitir vale',
    subtitle: 'A preparar o registo do vale e o recibo para o cliente.',
    safetyModeNotice:
      'O modo de segurança de desenvolvimento está ativo. A emissão de vales pode ser testada enquanto a transmissão em tempo real permanece protegida pelas salvaguardas existentes.',
  },

  sellPage: {
    hero: {
      eyebrow: 'Pagamento do comerciante',
      title: 'Vender vale BCH',
      intro:
        'Introduza o valor em dinheiro do cliente, reveja o valor em BCH, emita o vale e apresente o QR do recibo ao cliente.',
    },
    treasury: {
      title: 'Carteira de tesouraria',
      subtitle: 'Esta carteira fornece BCH para os vales emitidos.',
      ready: 'Pronta',
      address: 'Endereço',
      balance: 'Saldo',
      lastChecked: 'Última verificação',
      balanceNotChecked: 'O saldo ainda não foi verificado.',
      notSetUp: 'Não configurada',
      setUpBeforeUse:
        'Configure a carteira de tesouraria antes de a usar em operação real.',
      refreshBalance: 'Atualizar saldo',
    },
    sale: {
      eyebrow: 'Novo vale',
      title: 'Introduzir valor da venda',
      copy: 'Adicione o valor em dinheiro que o cliente está a pagar. A app bloqueará uma cotação BCH e mostrará um ecrã de revisão antes de emitir o vale.',
    },
    issued: {
      title: 'Vale emitido',
      subtitle:
        'O vale foi guardado e a pré-visualização do recibo está pronta para o cliente.',
      voucherReference: 'Referência do vale',
      customerPaid: 'Cliente pagou',
      bchLoaded: 'BCH carregado',
      voucherAddress: 'Endereço do vale',
      issueAnother: 'Emitir outro',
    },
    developerDetails: {
      title: 'Detalhes de desenvolvimento',
      derivationIndex: 'Índice de derivação',
      wifExportReady: 'Exportação WIF pronta',
      platformFeePlan: 'Plano de taxa da plataforma',
      recordStatus: 'Estado do registo',
    },
    issueSteps: {
      quote: {
        label: 'Confirmar cotação bloqueada',
        description: 'Usar a cotação BCH/GBP bloqueada antes da confirmação.',
      },
      wallet: {
        label: 'Preparar carteira do vale',
        description: 'Usar o endereço do vale preparado antes da confirmação.',
      },
      funding: {
        label: 'Preparar plano de financiamento',
        description:
          'Verificar o plano de financiamento preparado enquanto a transmissão em tempo real permanece protegida.',
      },
      store: {
        label: 'Guardar registo do vale',
        description: 'Guardar localmente o registo da venda do vale.',
      },
    },
    receiptDialog: {
      title: 'Recibo do vale',
      subtitle: 'Pré-visualização do recibo no momento da emissão',
    },
    safetyNotice:
      'O modo de segurança de desenvolvimento continua ativo. A experiência do comerciante está a ser refinada, mas a transmissão de transações em tempo real continua protegida pelas salvaguardas existentes até ser alterada explicitamente.',
    messages: {
      treasuryNotSetUpWarning:
        'A carteira de tesouraria não está configurada. A revisão do vale pode continuar, mas o financiamento em tempo real ficará bloqueado até existir uma carteira de tesouraria.',
      treasuryBalanceNotCheckedWarning:
        'O saldo da tesouraria ainda não foi verificado. A revisão do vale pode continuar, mas o financiamento em tempo real exigirá uma verificação recente do saldo.',
      treasuryBalanceTooLow:
        'O saldo da tesouraria é demasiado baixo para este vale. Necessário: {required}. Disponível: {available}.',
      couldNotLoadTreasuryWallet:
        'Não foi possível carregar o estado da carteira de tesouraria.',
      treasuryBalanceRefreshed: 'Saldo da tesouraria atualizado.',
      couldNotRefreshTreasuryBalance:
        'Não foi possível atualizar o saldo da tesouraria. Verifique a ligação e tente novamente.',
      enterValidCashAmount: 'Introduza primeiro um valor em dinheiro válido.',
      treasuryBalanceCheckTimedOut:
        'A verificação do saldo da tesouraria excedeu o tempo limite.',
      treasuryBalanceCouldNotBeCheckedWarning:
        'Não foi possível verificar o saldo da tesouraria. A revisão do vale pode continuar, mas o financiamento em tempo real exigirá uma verificação recente do saldo.',
      voucherKeyExportFailed:
        'A verificação da exportação da chave do vale falhou. A revisão pode continuar, mas imprimir/transferir exigirá a exportação WIF.',
      fallbackQuoteWarning:
        'O preço em tempo real não estava disponível, por isso está a ser usada uma cotação recente em cache. Reveja a cotação com cuidado antes de emitir.',
      liveQuoteLocked: 'Cotação de preço em tempo real bloqueada com sucesso.',
      couldNotPrepareReview:
        'Não foi possível preparar a revisão do vale. Verifique a ligação e tente novamente.',
      noLockedQuote:
        'Não existe uma cotação bloqueada disponível. Reveja o vale novamente.',
      noVoucherAddress:
        'Não existe um endereço de vale disponível. Reveja o vale novamente.',
      couldNotIssueVoucher: 'Não foi possível emitir o vale.',
    },
  },
  cashOutPage: {
    hero: {
      eyebrow: 'Levantar BCH',
      title: 'Levantar BCH',
      intro:
        'Introduza o valor em dinheiro que o cliente quer receber. A app calculará quanto BCH deve enviar para a tesouraria do comerciante.',
    },
    actions: {
      treasuryWallet: 'Carteira de tesouraria',
      voucherHistory: 'Histórico de vales',
      reviewCashOut: 'Rever levantamento',
    },
    form: {
      cashAmountLabel: 'Valor em dinheiro a pagar',
      paymentQrNotice:
        'O cliente irá digitalizar um QR de pagamento BCH. O levantamento só será concluído depois de BCH ser detetado na carteira de tesouraria.',
    },
    preview: {
      title: 'Pré-visualização do levantamento',
      subtitle: 'O valor final em BCH é bloqueado após a revisão.',
      customerReceivesCash: 'Cliente recebe dinheiro',
      serviceFeeSpread: 'Taxa de serviço / margem',
      customerSendsValue: 'Valor que o cliente envia',
      quoteSource: 'Fonte da cotação',
      lockedAfterReview: 'Bloqueado após a revisão',
    },
    paymentUri: {
      label: 'Levantamento BCH',
    },
    safetyNotice:
      'O BCH do cliente deve ser detetado antes de o comerciante entregar dinheiro.',
    messages: {
      couldNotLoadTreasuryWallet:
        'Não foi possível carregar a carteira de tesouraria.',
      enterValidCashAmount: 'Introduza um valor em dinheiro válido.',
      setUpTreasuryFirst:
        'Configure a carteira de tesouraria do comerciante antes de preparar um levantamento.',
      fallbackQuoteWarning:
        'Cotação de reserva usada. Verifique a taxa cuidadosamente antes de continuar.',
      pricingUnavailable:
        'Os preços estão indisponíveis neste momento. Verifique a ligação e tente novamente.',
      couldNotPrepareCashOut: 'Não foi possível preparar o levantamento.',
      receiptPrintingPending:
        'A impressão do recibo será ligada depois de a deteção de pagamento ser adicionada.',
    },
  },

  cashOutConfirm: {
    header: {
      reviewTitle: 'Revisar saque',
      receivedTitle: 'BCH recebido',
      reviewSubtitle:
        'Peça ao cliente para digitalizar o código QR e enviar o BCH necessário.',
      receivedSubtitle:
        'O pagamento do cliente foi detetado na tesouraria do comerciante.',
    },
    quoteStatus: {
      fallback:
        'Cotação de reserva usada. Verifique a taxa cuidadosamente antes de continuar.',
      liveLocked: 'Cotação de preço em tempo real bloqueada com sucesso.',
    },
    breakdown: {
      title: 'Detalhe da retirada',
      subtitle: 'Pagamento ao cliente e BCH necessário',
      cashOutAmount: 'Valor da retirada',
      cashOutAmountNote: 'Dinheiro pago ao cliente',
      serviceFeeSpread: 'Taxa de serviço / margem',
      cashOutTotal: 'Total da retirada',
      cashOutTotalNote: 'O cliente envia este valor total em BCH',
    },
    summary: {
      cashCustomerReceives: 'Dinheiro que o cliente recebe',
      customerSends: 'Cliente envia',
      fiatEquivalentSent: 'Equivalente fiat enviado',
      serviceFeeSpread: 'Taxa de serviço / margem',
    },
    paymentQr: {
      title: 'QR de pagamento do cliente',
      subtitle:
        'Peça ao cliente para digitalizar este código QR com a sua carteira BCH. Aguarde até o pagamento BCH chegar à carteira de tesouraria antes de entregar o dinheiro.',
      qrAlt: 'QR de pagamento BCH para levantamento',
      qrUnavailable: 'QR indisponível',
    },
    paymentDetails: {
      amountToSend: 'Valor a enviar',
      treasuryReceivingAddress: 'Endereço de receção da tesouraria',
      tapToRevealAddress: 'Toque para mostrar o endereço completo',
      paymentUri: 'URI de pagamento',
    },
    paymentUri: {
      label: 'Levantamento BCH',
    },
    details: {
      orderDetailsTitle: 'Detalhes do pedido',
      orderDetailsCaption: 'Clique aqui para ver os detalhes da retirada',
      reference: 'Referência',
      marketRate: 'Taxa de mercado',
      quoteSource: 'Fonte da cotação',
      fallbackBadge: 'reserva',
      quoteTime: 'Hora da cotação',
      quoteExpires: 'Cotação expira',
      status: 'Estado',
      bchReceived: 'BCH recebido',
      transactionId: 'ID da transação',
      detected: 'Detetado',
    },
    success: {
      title: 'BCH recebido',
      nowGiveCustomer: 'Agora entregue ao cliente',
      cash: 'em dinheiro',
    },
    actions: {
      copyAddress: 'Copiar endereço',
      copyPaymentUri: 'Copiar URI de pagamento',
      closeReview: 'Cancelar retirada e fechar',
      printReceipt: 'Imprimir recibo',
    },
    messages: {
      treasuryAddressCopied: 'Endereço da tesouraria copiado.',
      paymentUriCopied: 'URI de pagamento copiado.',
      copyFailed: 'Falha ao copiar.',
    },
    quoteSources: {
      developmentQuote: 'Cotação de desenvolvimento',
      cachedQuote: 'Cotação em cache',
      manualQuote: 'Cotação manual',
      unknown: 'Desconhecida',
    },
  },

  saleConfirm: {
    title: 'Rever vale',
    subtitle:
      'Confirme o pagamento do cliente, o valor em BCH e os detalhes do recibo antes de emitir este vale.',
    quoteStatus: {
      fallback:
        'O preço em tempo real não estava disponível, por isso está a ser usada uma cotação recente em cache. Reveja a cotação com cuidado antes de emitir.',
      liveLocked: 'Cotação de preço em tempo real bloqueada com sucesso.',
    },
    summary: {
      customerPays: 'Cliente paga',
      voucherValue: 'Valor do vale',
      bchLoaded: 'BCH carregado',
      serviceFee: 'Taxa de serviço',
    },
    details: {
      marketRate: 'Taxa de mercado',
      quoteSource: 'Fonte da cotação',
      fallbackBadge: 'reserva',
      quoteTime: 'Hora da cotação',
      quoteExpires: 'Cotação expira',
      treasuryBalance: 'Saldo da tesouraria',
    },
    fundingReadiness: {
      ready:
        'As verificações de prontidão do financiamento foram aprovadas. A transmissão de transações em tempo real continua protegida pela salvaguarda atual.',
      notReady: 'O financiamento em tempo real ainda não está pronto.',
    },
    safetyNotice:
      'O modo de segurança de desenvolvimento está ativo. Este ecrã pode emitir o registo do vale e a pré-visualização do recibo, enquanto a transmissão em tempo real permanece protegida até ser ativada explicitamente.',
    actions: {
      issueVoucher: 'Emitir vale',
    },
    quoteSources: {
      developmentQuote: 'Cotação de desenvolvimento',
      cachedQuote: 'Cotação em cache',
    },
  },

  historyPage: {
    hero: {
      eyebrow: 'Registos de vales',
      title: 'Histórico de vales',
      intro:
        'Reveja vales BCH emitidos, verifique o estado de resgate e aceda a pré-visualizações de recibos de desenvolvimento enquanto o teste da impressora ainda está a ser preparado.',
    },
    actions: {
      sellVoucher: 'Vender vale',
    },
    summary: {
      totalVouchers: 'Total de vales',
      openActive: 'Abertos / ativos',
      sweptRedeemed: 'Transferidos / resgatados',
    },
    records: {
      title: 'Registos de vales',
      subtitle:
        'As informações do vale voltadas para o cliente aparecem primeiro. As ferramentas técnicas de financiamento e teste ficam dentro de cada registo.',
    },
    safetyNotice:
      'O modo de segurança de desenvolvimento continua ativo. A pré-visualização do recibo e as ferramentas de resgate continuam disponíveis para testes antes de ligar o fluxo final da impressora.',
    messages: {
      couldNotLoadVoucherRecords:
        'Não foi possível carregar os registos de vales.',
      createdTestVoucher: 'Vale de teste {serial} criado.',
      couldNotCreateTestVoucher: 'Não foi possível criar o vale de teste.',
      markedManualRedemption:
        '{serial} foi marcado manualmente como transferido/resgatado.',
      couldNotFindVoucherRecordToUpdate:
        'Não foi possível encontrar o registo do vale para atualizar.',
      couldNotMarkVoucherAsManuallyRedeemed:
        'Não foi possível marcar o vale como resgatado manualmente.',
      clearedManualRedemption:
        'Estado de resgate manual removido para {serial}.',
      couldNotClearManualRedemption:
        'Não foi possível remover o estado de resgate manual.',
      couldNotFindVoucherRecordToCheck:
        'Não foi possível encontrar o registo do vale para verificar.',
      checkedOnChainRedemptionStatus:
        'Estado de resgate on-chain verificado para {serial}: {status}.',
      couldNotUpdateVoucherRedemptionDetectionResult:
        'Não foi possível atualizar o resultado da deteção de resgate do vale.',
      couldNotCheckVoucherRedemptionStatus:
        'Não foi possível verificar o estado de resgate do vale.',
      clearedAllLocalTestVoucherRecords:
        'Todos os registos locais de vales de teste foram apagados.',
      couldNotClearVoucherRecords:
        'Não foi possível apagar os registos de vales.',
    },
  },

  historyList: {
    empty: {
      title: 'Ainda não há registos de vales',
      text: 'Os vales emitidos aparecerão aqui após uma venda ser concluída.',
    },
    issuedDate: 'Emitido {date}',
    summary: {
      customerPaid: 'Cliente pagou',
      bchLoaded: 'BCH carregado',
      redemption: 'Resgate',
      quote: 'Cotação',
    },
    address: {
      voucherAddress: 'Endereço do vale',
      notDerivedYet: 'Ainda não derivado',
    },
    actions: {
      previewReceipt: 'Pré-visualizar recibo',
      checkRedemption: 'Verificar resgate',
      checkOnChainStatus: 'Verificar estado on-chain',
      markAsManuallySwept: 'Marcar como transferido manualmente',
      clearManualSweepStatus: 'Limpar estado de transferência manual',
    },
    status: {
      redeemed: 'Resgatado',
      funded: 'Financiado',
      error: 'Erro',
      issued: 'Emitido',
    },
    redemption: {
      manualSwept: 'Transferido manualmente',
      swept: 'Transferido',
      funded: 'Financiado',
      unfunded: 'Sem fundos',
      notChecked: 'Não verificado',
    },
    redemptionTools: {
      label: 'Ferramentas de resgate',
      caption:
        'Estado de transferência manual e verificação de resgate on-chain',
      manualMarked: 'Vale marcado manualmente como transferido/resgatado.',
      notCheckedYet: 'O estado de resgate ainda não foi verificado.',
      status: 'Estado',
      sweepTransactionId: 'ID da transação de transferência',
      note: 'Nota',
      redeemed: 'Resgatado',
      detectedStatus: 'Estado detetado',
      detectedBalance: 'Saldo detetado',
      detectedUtxos: 'UTXOs detetados',
      checked: 'Verificado',
      sweepTxidOptional: 'TXID da transferência opcional',
      noteOptional: 'Nota opcional',
    },
    quoteSources: {
      cached: 'Em cache',
      manual: 'Manual',
      unknown: 'Desconhecida',
    },
  },

  treasuryPage: {
    common: {
      notConfigured: 'Não configurada',
      valid: 'Válida',
      notReady: 'Não pronta',
      validNotRequired: 'Válida / não necessária',
    },
    hero: {
      eyebrow: 'Fundos do comerciante',
      title: 'Carteira de tesouraria',
      intro:
        'Gerencie a carteira BCH usada para financiar os recibos de vales dos clientes.',
    },
    walletStatus: {
      title: 'Estado da carteira',
      subtitle:
        'Verifique se a carteira de tesouraria do comerciante está pronta.',
      setupBanner: 'A carteira de tesouraria está configurada.',
      notSetupBanner:
        'Ainda não foi configurada nenhuma carteira de tesouraria.',
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
      title: 'Dinheiro em caixa',
      subtitle:
        'Controle opcional de dinheiro físico para recargas, retiradas e relatórios locais.',
      setUp: 'Configurar',
      notSetUp: 'Não configurado',
      notSetUpPrompt:
        'Controle o dinheiro físico disponível atualmente nesta loja ou caixa.',
      currentBalance: 'Dinheiro atual em caixa',
      readyForManualTracking: 'Pronto para controle manual de dinheiro.',
      lastUpdated: 'Última atualização: {date}',
      currency: 'Moeda',
      actions: {
        setUp: 'Configurar',
        addCash: 'Adicionar dinheiro',
        withdrawCash: 'Retirar dinheiro',
        clear: 'Limpar dinheiro em caixa',
        confirmClear: 'Limpar dinheiro em caixa',
        saveSetup: 'Guardar',
        saveAdd: 'Guardar',
        saveWithdraw: 'Guardar',
      },
      dialog: {
        setupTitle: 'Configurar dinheiro em caixa',
        setupSubtitle:
          'Introduza o valor inicial de dinheiro físico disponível atualmente.',
        addTitle: 'Adicionar dinheiro',
        addSubtitle:
          'Registe dinheiro físico extra adicionado ao caixa da loja.',
        withdrawTitle: 'Retirar dinheiro',
        withdrawSubtitle: 'Registe dinheiro físico retirado do caixa da loja.',
        currentCash: 'Dinheiro atual em caixa',
        enteredAmount: 'Valor introduzido',
        newCash: 'Novo dinheiro em caixa',
        startingAmount: 'Valor inicial',
        amountToAdd: 'Valor a adicionar',
        amountToWithdraw: 'Valor a retirar',
        noteOptional: 'Nota opcional',
      },
      clearDialog: {
        title: 'Limpar dinheiro em caixa?',
        message:
          'Isto repõe o dinheiro em caixa para o estado não configurado. As recargas e retiradas continuarão a funcionar.',
        warning:
          'O saldo atualmente controlado é {amount}. Limpar remove este saldo ativo da página da carteira de tesouraria.',
        clearNote: 'Dinheiro em caixa limpo manualmente.',
      },
      transactions: {
        link: 'Transações',
        title: 'Transações',
        subtitle: 'Movimentos de dinheiro em caixa que alteraram este saldo.',
        emptyTitle: 'Ainda não há transações',
        emptySubtitle: 'As alterações de dinheiro em caixa aparecerão aqui.',
        showing: 'A mostrar {count} de {total}',
        showMore: 'Mostrar mais 10',
        viewOlder: 'Ver transações mais antigas',
        backToLatest: 'Voltar às transações recentes',
        olderPage: 'Transações antigas · página {page}',
        detailTitle: 'Detalhes do movimento de dinheiro',
        type: 'Tipo',
        date: 'Data',
        cashAmount: 'Valor em dinheiro',
        balanceAfter: 'Saldo depois',
        reference: 'Referência',
        bchAddress: 'Endereço BCH',
        bchTransaction: 'Transação BCH',
        note: 'Nota',
        noRelatedRecord: 'Registo relacionado não encontrado',
        types: {
          setup: 'Configuração',
          topup: 'Recarga',
          cashOut: 'Retirada',
          cashAdded: 'Dinheiro adicionado',
          withdrawal: 'Retirada',
          cleared: 'Limpo',
        },
        amount: {
          reset: 'Reposto para {amount}',
        },
      },
      errors: {
        enterValidAmount: 'Introduza um valor em dinheiro válido.',
        enterPositiveAmount: 'Introduza um valor maior que zero.',
        withdrawTooMuch:
          'Não pode retirar mais dinheiro do que está disponível.',
      },
      messages: {
        couldNotLoad:
          'Não foi possível carregar as informações de dinheiro em caixa.',
        setUp: 'Dinheiro em caixa configurado.',
        added: 'Dinheiro adicionado ao dinheiro em caixa.',
        withdrawn: 'Dinheiro retirado do dinheiro em caixa.',
        cleared: 'Dinheiro em caixa limpo.',
        couldNotSave:
          'Não foi possível guardar a alteração de dinheiro em caixa.',
        couldNotClear: 'Não foi possível limpar o dinheiro em caixa.',
      },
    },
    summary: {
      status: 'Estado',
      ready: 'Pronta',
      notSetUp: 'Não configurada',
      balance: 'Saldo',
      notChecked: 'Não verificado',
      utxos: 'UTXOs',
      lastChecked: 'Última verificação',
      notCheckedYet: 'Ainda não verificado',
      balanceUnavailable: 'Fiat balance unavailable',
    },
    details: {
      treasuryAddress: 'Endereço da tesouraria',
      created: 'Criada',
      updated: 'Atualizada',
    },
    actions: {
      sellVoucher: 'Vender vale',
      refreshBalance: 'Atualizar saldo',
      walletReady: 'Carteira de tesouraria pronta',
      createWallet: 'Criar carteira',
      hideSeed: 'Ocultar seed',
      revealSeedBackup: 'Revelar backup da seed',
      clearRestoreTool: 'Limpar ferramenta de restauro',
      checkSeed: 'Verificar seed',
      importCheckedSeed: 'Importar seed verificada',
      clearTreasuryWallet: 'Apagar carteira de tesouraria',
      create: 'Create',
    },
    utxoDetails: {
      label: 'Detalhes de UTXO',
      caption: 'Saídas avançadas de tesouraria somente leitura',
      description:
        'Estas são as saídas não gastas atualmente detetadas para a carteira de tesouraria. Esta secção é somente leitura.',
      noneDetected: 'Nenhuma UTXO de tesouraria detetada.',
      utxoNumber: 'UTXO {number}',
      value: 'Valor',
      tx: 'Tx',
      outputIndex: 'Índice de saída',
    },
    fundingConfig: {
      label: 'Configuração de financiamento',
      caption:
        'Prontidão do endereço de taxa para financiamento de tesouraria em tempo real',
      platformFeeValid:
        'O endereço da taxa da plataforma está configurado e é válido.',
      platformFeeInvalid:
        'O endereço da taxa da plataforma está configurado mas é inválido: {error}',
      platformFeeNotConfigured:
        'O endereço da taxa da plataforma não está configurado. O financiamento em tempo real deve permanecer desativado.',
      bufferReserveValid:
        'O endereço de reserva de buffer está configurado e é válido.',
      bufferReserveOptional:
        'A saída de reserva de buffer é opcional para o MVP e atualmente não é necessária.',
      platformFeeAddress: 'Endereço da taxa da plataforma',
      platformFeeAddressStatus: 'Estado do endereço da taxa da plataforma',
      bufferReserveAddress: 'Endereço da reserva de buffer',
      bufferReserveAddressStatus: 'Estado do endereço da reserva de buffer',
      configChecked: 'Configuração verificada',
    },
    walletBackup: {
      label: 'Backup da carteira',
      caption: 'Backup sensível da seed para desenvolvimento e recuperação',
      warning:
        'Qualquer pessoa com esta frase seed pode controlar o BCH da tesouraria. Revele-a apenas num ambiente privado e seguro.',
      backupStatus: 'Estado do backup',
      seedLoaded: 'Seed carregada para backup',
      seedNotRevealed: 'Seed não revelada',
      seedPhrase: 'Frase seed',
      exported: 'Exportada',
    },
    restore: {
      label: 'Restaurar / importar carteira',
      caption: 'Verificar ou importar uma frase seed da tesouraria',
      warning:
        'Importar substituirá a carteira de tesouraria local atual. Não cole uma frase seed de produção nesta versão de desenvolvimento.',
      seedInputLabel: 'Frase seed da tesouraria para verificar/importar',
      matchesCurrentAddress: 'Esta seed deriva o endereço atual da tesouraria.',
      differentAddress: 'Esta seed deriva um endereço de tesouraria diferente.',
      importedIntoLocalStorage:
        'Carteira de tesouraria importada para o armazenamento local.',
      derivedAddress: 'Endereço derivado',
      currentTreasuryAddress: 'Endereço atual da tesouraria',
      noCurrentTreasuryWallet: 'Não há carteira de tesouraria atual',
      checked: 'Verificado',
      importedAddress: 'Endereço importado',
      replacedExistingWallet: 'Substituiu carteira existente',
      imported: 'Importada',
    },
    dangerZone: {
      label: 'Zona de perigo',
      caption: 'Apagar a carteira de tesouraria local',
      warning:
        'Apagar a carteira de tesouraria local remove os dados da carteira de tesouraria guardados neste dispositivo. Faça isto apenas quando tiver a certeza de que a carteira tem backup ou já não é necessária.',
    },
    safetyNotice:
      'O modo de segurança de desenvolvimento continua ativo. As ferramentas de tesouraria estão disponíveis para testes enquanto a operação real do comerciante está a ser preparada.',
    messages: {
      couldNotLoadWalletInfo:
        'Não foi possível carregar as informações da carteira de tesouraria.',
      createdWallet: 'Carteira de tesouraria criada.',
      couldNotCreateWallet: 'Não foi possível criar a carteira de tesouraria.',
      clearedWallet: 'Carteira de tesouraria apagada.',
      couldNotClearWallet: 'Não foi possível apagar a carteira de tesouraria.',
      balanceRefreshed: 'Saldo da tesouraria atualizado.',
      couldNotRefreshBalance:
        'Não foi possível atualizar o saldo da tesouraria. Verifique a ligação e tente novamente.',
      seedBackupLoaded: 'Backup da seed da tesouraria carregado.',
      couldNotLoadBackupInfo:
        'Não foi possível carregar as informações do backup da tesouraria.',
      seedBackupHidden: 'Backup da seed da tesouraria ocultado.',
      restoreSeedCheckCompleted:
        'Verificação da seed de restauro da tesouraria concluída.',
      couldNotCheckRestoreSeed:
        'Não foi possível verificar a seed de restauro da tesouraria.',
      checkSeedBeforeImporting:
        'Verifique uma frase seed da tesouraria antes de importar.',
      importedCheckedSeed:
        'Seed de tesouraria verificada importada para o armazenamento local.',
      couldNotImportSeed: 'Não foi possível importar a seed da tesouraria.',
      restoreToolCleared: 'Ferramenta de restauro da tesouraria limpa.',
    },
  },

  treasuryTopUpQr: {
    title: 'QR de recarga da tesouraria',
    subtitle:
      'Digitalize este código QR a partir de outra carteira BCH para recarregar a carteira de tesouraria do comerciante.',
    qrAlt: 'Código QR de recarga da tesouraria',
    qrUnavailable: 'Código QR indisponível.',
    treasuryAddress: 'Endereço da carteira de tesouraria',
    paymentUri: 'URI de pagamento BCH',
    qrGenerated: 'QR gerado',
    copy: 'Copiar',
    copyAddress: 'Copiar endereço',
    copyPaymentUri: 'Copiar URI de pagamento',
    tapQrToCopy: 'Toque no QR para copiar o endereço da carteira.',
    watching: 'A aguardar BCH recebido...',
    watchingError:
      'Não foi possível monitorizar BCH recebido. Ainda pode copiar o endereço e atualizar o saldo depois de enviar.',
    receivedTitle: 'Recebido',
    receivedSubtitle:
      'BCH recebido foi detetado na sua carteira de tesouraria. Feche esta janela para voltar ao saldo atualizado da carteira.',
    receivedAmount: 'Recebido',
    receivedTxid: 'Transação',
    uriLabel: 'Tesouraria de vales BCH',
    uriMessage: 'Recarregar carteira de tesouraria do comerciante',
    addressCopied: 'Endereço da tesouraria copiado.',
    uriCopied: 'URI de pagamento da tesouraria copiado.',
    copyFailed: 'Não foi possível copiar para a área de transferência.',
  },

  layout: {
    brand: {
      title: 'Recargas BCH',
      subtitle: 'App do comerciante',
    },
    drawer: {
      subtitle: 'App de vales para comerciantes',
    },
    navigation: {
      openMenu: 'Abrir menu de navegação',
      closeMenu: 'Fechar menu de navegação',
    },
    status: {
      treasury: 'Tesouraria',
      printerPending: 'Impressora pendente',
      devMode: 'Modo dev',
    },
    sections: {
      main: 'Principal',
      merchantSetup: 'Configuração do comerciante',
      help: 'Ajuda',
      advanced: 'Avançado',
    },
    items: {
      home: 'Início',
      sellVoucher: 'Vender recarga',
      cashOut: 'Retirar',
      voucherHistory: 'Histórico de vales',
      treasuryWallet: 'Carteira de tesouraria',
      printerSetup: 'Configurar impressora',
      appSettings: 'Definições da app',
      checkForUpdates: 'Check for Updates',
      checkForUpdatesCaption: 'App version and download status',
      howToSellVoucher: 'Como vender uma recarga',
      howToCashOut: 'How to Cash-out',
      howCustomersRedeem: 'Como os clientes resgatam',
      faq: 'Perguntas frequentes',
      support: 'Suporte',
      communities: 'Comunidades',
      socialMedia: 'Redes sociais',
      developerTools: 'Ferramentas de desenvolvimento',
    },
    common: {
      comingSoon: 'Em breve',
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
      title: 'Pré-visualização de impressão',
      subtitle: 'Pré-visualização do relatório do comerciante em A4',
      pdfTitle: 'Exportar PDF',
      pdfSubtitle: 'Guarde este relatório do comerciante em A4 como PDF.',
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
      close: 'Fechar',
      print: 'Imprimir',
      reportTitle: 'Relatório do comerciante',
      selectedRange: 'Intervalo selecionado',
      generated: 'Gerado',
      atAGlance: 'Visão geral',
      topupsVsCashOuts: 'Recargas vs retiradas',
      currencyBreakdown: 'Detalhe por moeda',
      currency: 'Moeda',
      topups: 'Recargas',
      cashOuts: 'Retiradas',
      totalFiat: 'Total fiat',
      noCurrencyData: 'Ainda não há atividade por moeda neste intervalo.',
      localNotice:
        'Gerado localmente a partir de registos guardados neste dispositivo. Nenhum dado do relatório é enviado para um servidor.',
    },
    connectedNotice:
      'Os relatórios estão agora ligados aos registos locais de recargas e retiradas deste dispositivo.',
  },

  receiptPreview: {
    printLabels: {
      valueLoaded: 'Valor carregado',
      scanToRedeem: 'Digitalizar para resgatar',
      reference: 'Referência',
      issued: 'Emitido',
      customerPaid: 'Cliente pagou',
      loaded: 'Carregado',
      voucherAddress: 'Endereço do vale',
    },
    privateKeyWarning:
      'Apenas pré-visualização de desenvolvimento. Este recibo contém um QR com uma chave privada transferível. Qualquer pessoa que o digitalize ou copie pode transferir os fundos do vale.',
    loading: 'A construir pré-visualização do recibo...',
    receiptTitle: 'Vale BCH',
    receiptSubtitle: 'Recibo de vale BCH transferível',
    voucherValueLoaded: 'Valor carregado no vale',
    scanToSweep: 'Digitalizar para transferir',
    qrAlt: 'Código QR de vale BCH transferível',
    reference: 'Referência',
    issued: 'Emitido',
    customerPaid: 'Cliente pagou',
    voucherAddress: 'Endereço do vale',
    keepSafeUntilRedeemed: 'Guardar em segurança até ser resgatado',
    redemptionInstruction:
      'Digitalize este código QR com uma carteira Bitcoin Cash que suporte transferência por chave privada.',
    cashWarning:
      'Trate este recibo como dinheiro. Qualquer pessoa com este código QR pode transferir os fundos.',
    supportNote:
      'Guarde este recibo em segurança até o BCH ter sido transferido para a sua própria carteira.',
    couldNotBuildPreview:
      'Não foi possível criar a pré-visualização do recibo do vale.',
    errors: {
      invalidDerivationIndex: 'O vale não tem um índice de derivação válido.',
      missingSerial: 'O vale não tem número de série/referência.',
      missingFiatCurrency: 'O vale não tem uma moeda fiat.',
      invalidBchAmount: 'O vale não tem um valor BCH carregado válido.',
      missingAddress: 'O vale não tem um endereço BCH.',
      addressMismatch:
        'O endereço do vale não corresponde ao endereço da chave do vale exportada.',
    },
  },
};

export default pt;
