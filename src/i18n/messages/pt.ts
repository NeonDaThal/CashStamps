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
  },

  home: {
    eyebrow: 'App de vales para comerciantes',
    title: 'Vales de Bitcoin Cash',
    intro:
      'Venda vales de Bitcoin Cash na loja, emita um recibo e permita que o cliente transfira o BCH para a sua própria carteira.',
    actionTitle: 'O que pretende fazer?',
    actionSubtitle: 'Escolha a próxima ação do comerciante.',
    sellVoucher: 'Vender novo vale',
    voucherHistory: 'Histórico de vales',
    treasuryWallet: 'Carteira de tesouraria',
    receiptPreview: 'Pré-visualização do recibo',
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
    receiveOnlyNotice:
      'QR apenas para receber. Isto permite ao comerciante adicionar BCH à carteira de tesouraria. Não gasta nem transmite nada a partir desta app.',
    qrAlt: 'Código QR de recarga da tesouraria',
    qrUnavailable: 'Código QR indisponível.',
    treasuryAddress: 'Endereço da tesouraria',
    paymentUri: 'URI de pagamento BCH',
    qrGenerated: 'QR gerado',
    copyAddress: 'Copiar endereço',
    copyPaymentUri: 'Copiar URI de pagamento',
    uriLabel: 'Tesouraria de vales BCH',
    uriMessage: 'Recarregar carteira de tesouraria do comerciante',
    addressCopied: 'Endereço da tesouraria copiado.',
    uriCopied: 'URI de pagamento da tesouraria copiado.',
    copyFailed: 'Não foi possível copiar para a área de transferência.',
  },

  layout: {
    brand: {
      title: 'Vales de Bitcoin Cash',
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
      sellVoucher: 'Vender vale',
      voucherHistory: 'Histórico de vales',
      treasuryWallet: 'Carteira de tesouraria',
      printerSetup: 'Configurar impressora',
      appSettings: 'Definições da app',
      howToSellVoucher: 'Como vender um vale',
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
  },

  receiptPreview: {
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
