const faq = {
  categories: {
    bitcoinCash: 'Bitcoin Cash',
    cashouts: 'Cashouts',
    howTo: 'How to',
    security: 'Security',
    topups: 'Topups',
  },

  controls: {
    searchPlaceholder: 'Search FAQs',
    categoryFilter: 'Category',
    allCategories: 'All categories',
    clearFilters: 'Clear filters',
  },

  actions: {
    viewMore: 'View more',
    learnMore: 'Click here',
  },

  states: {
    noResults: 'No FAQs matched your search or selected category.',
  },

  questions: {
  whatIsBitcoinCash: {
    question: 'What is Bitcoin Cash?',
    answer:
      'Bitcoin Cash (BCH) is peer-to-peer electronic cash that can be sent directly between people without needing a bank or payment processor.',
  },

  whatIsBchWallet: {
    question: 'What is a Bitcoin Cash wallet?',
    answer:
      'A Bitcoin Cash wallet is an app or device used to receive, hold and send BCH. A non-custodial wallet gives the user control of the keys needed to spend their BCH.',
  },

  whatIsSatoshi: {
    question: 'What is a satoshi?',
    answer:
      'A satoshi, or sat, is the smallest unit used to measure Bitcoin Cash. One BCH contains 100,000,000 satoshis.',
  },

  howToSellTopup: {
    question: 'How do I sell a Topup?',
    answer:
      'Enter the Topup amount, review and lock the quote, confirm the transaction and choose the customer delivery method. The app then funds the new Topup from the Treasury Wallet and delivers it as either a Printed or Digital Voucher.',
  },

  howToChangeLanguage: {
    question: 'How do I change the app language?',
    answer:
      'Open App Settings and select Language, then tap the language you want to use. You can also switch language at any time using the language button in the top-right corner of the app.',
  },

  howToViewTransactions: {
    question: 'Where can I see previous transactions?',
    answer:
      'Open Transactions from the main menu to view recorded Topup and transaction activity stored by the app.',
  },

  whyTreatVoucherLikeCash: {
    question: 'Why should a Topup Voucher be treated like cash?',
    answer:
      'The voucher contains the secret needed to spend its BCH. Anyone who obtains that secret may be able to sweep the funds, so a Printed or Digital Voucher should be protected and handed only to the intended customer.',
  },

  canSwitchTopupDelivery: {
    question:
      'Can I switch a Topup between Printed and Digital after choosing?',
    answer:
      'No. For a real Topup, the selected delivery method is permanent. A Printed Voucher cannot later become Digital, and a Digital Voucher cannot later be printed.',
  },

  protectWalletSecrets: {
    question: 'What wallet information should I keep private?',
    answer:
      'Seed phrases and private keys must be kept private. Anyone with access to them may be able to control the associated BCH. Never share wallet recovery information unless you deliberately intend to give control of those funds to someone else.',
  },

  whatIsTopup: {
    question: 'What is a Bitcoin Cash Topup?',
    answer:
      'A Bitcoin Cash Topup lets a customer buy BCH from a merchant using cash. The BCH is loaded onto a newly created voucher that is delivered either as a Printed Voucher or a Digital Voucher.',
  },

  howCustomerRedeemsTopup: {
    question: 'How does a customer use a Topup?',
    answer:
      'The customer scans the voucher QR using a compatible Bitcoin Cash wallet that supports sweeping the voucher private key. The BCH is then moved from the voucher into the customer’s own wallet.',
  },

  canCancelDeliveredTopup: {
    question: 'Can a Topup be cancelled after the voucher is delivered?',
    answer:
      'No. Once the voucher secret has been printed or revealed to the customer, the Topup is considered delivered and the merchant should treat it as completed.',
  },

  whatIsCashout: {
    question: 'What is a Cash-out?',
    answer:
      'A Cash-out lets a customer sell Bitcoin Cash to the merchant in exchange for cash. The customer sends BCH to the payment request shown by the app and the merchant pays the agreed cash amount.',
  },

  whyCashoutPaymentDetection: {
    question: 'Why does the app wait for a Cash-out payment to be detected?',
    answer:
      'Payment detection helps the merchant confirm that the required BCH payment has been seen before completing the Cash-out and handing over cash.',
  },

  whereCashoutBchGoes: {
    question: 'Where does BCH received from a Cash-out go?',
    answer:
      'Each Cash-out uses a receiving address associated with the merchant Treasury Wallet so incoming BCH can be identified for that transaction and become part of the merchant’s treasury funds.',
  },
},
};

export default faq;
