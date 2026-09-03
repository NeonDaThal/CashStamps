export type FaqCategoryId =
  | 'bitcoin-cash'
  | 'cashouts'
  | 'how-to'
  | 'security'
  | 'topups';

export type FaqCategoryDefinition = {
  id: FaqCategoryId;
  icon: string;
  labelKey: string;
};

export type FaqInternalArticleLink = {
  type: 'article';
  articleId: string;
  labelKey?: string;
};

export type FaqExternalLink = {
  type: 'external';
  url: string;
  labelKey?: string;
};

export type FaqLearnMore = FaqInternalArticleLink | FaqExternalLink;

export type FaqEntry = {
  id: string;

  /**
   * Controls which section this FAQ appears beneath on the
   * default grouped FAQ screen.
   */
  primaryCategory: FaqCategoryId;

  /**
   * All categories this FAQ belongs to.
   *
   * The primary category should always also appear in this array.
   * This allows one FAQ to be found through multiple category filters
   * without duplicating it across multiple default sections.
   */
  categories: readonly FaqCategoryId[];

  /**
   * Translation keys containing the visible question and answer.
   */
  questionKey: string;
  answerKey: string;

  /**
   * Optional link to more detailed information.
   *
   * `article` is intended for the future locale-aware Markdown
   * article system.
   *
   * `external` is for an external website or resource.
   */
  learnMore?: FaqLearnMore;
};

export const faqCategories: readonly FaqCategoryDefinition[] = [
  {
    id: 'bitcoin-cash',
    icon: 'currency_bitcoin',
    labelKey: 'faq.categories.bitcoinCash',
  },
  {
    id: 'how-to',
    icon: 'school',
    labelKey: 'faq.categories.howTo',
  },
  {
    id: 'security',
    icon: 'shield',
    labelKey: 'faq.categories.security',
  },
  {
    id: 'topups',
    icon: 'receipt_long',
    labelKey: 'faq.categories.topups',
  },
  {
    id: 'cashouts',
    icon: 'payments',
    labelKey: 'faq.categories.cashouts',
  },
];

/**
 * FAQ content is intentionally kept separate from the FAQ UI.
 *
 * Each entry references translation keys rather than containing
 * English text directly.
 *
 * Example:
 *
 * {
 *   id: 'what-is-a-topup',
 *   primaryCategory: 'topups',
 *   categories: ['topups', 'how-to'],
 *   questionKey: 'faq.questions.whatIsATopup.question',
 *   answerKey: 'faq.questions.whatIsATopup.answer',
 * }
 *
 * An FAQ can later link to a multilingual Markdown article:
 *
 * {
 *   ...
 *   learnMore: {
 *     type: 'article',
 *     articleId: 'how-to-redeem-a-topup',
 *   },
 * }
 *
 * The future article resolver can use the current app locale to load:
 *
 * src/content/articles/en/how-to-redeem-a-topup.md
 * src/content/articles/es/how-to-redeem-a-topup.md
 * etc.
 *
 * The FAQ itself therefore never needs to know the translated
 * article filename or URL.
 */
export const faqEntries: readonly FaqEntry[] = [
  // Bitcoin Cash
  {
    id: 'what-is-bitcoin-cash',
    primaryCategory: 'bitcoin-cash',
    categories: ['bitcoin-cash'],
    questionKey: 'faq.questions.whatIsBitcoinCash.question',
    answerKey: 'faq.questions.whatIsBitcoinCash.answer',
  },
  {
    id: 'what-is-bch-wallet',
    primaryCategory: 'bitcoin-cash',
    categories: ['bitcoin-cash', 'how-to', 'security'],
    questionKey: 'faq.questions.whatIsBchWallet.question',
    answerKey: 'faq.questions.whatIsBchWallet.answer',
  },
  {
    id: 'what-is-satoshi',
    primaryCategory: 'bitcoin-cash',
    categories: ['bitcoin-cash'],
    questionKey: 'faq.questions.whatIsSatoshi.question',
    answerKey: 'faq.questions.whatIsSatoshi.answer',
  },

  // How to
  {
    id: 'how-to-sell-topup',
    primaryCategory: 'how-to',
    categories: ['how-to', 'topups'],
    questionKey: 'faq.questions.howToSellTopup.question',
    answerKey: 'faq.questions.howToSellTopup.answer',
  },
  {
    id: 'how-to-change-language',
    primaryCategory: 'how-to',
    categories: ['how-to'],
    questionKey: 'faq.questions.howToChangeLanguage.question',
    answerKey: 'faq.questions.howToChangeLanguage.answer',
  },
  {
    id: 'how-to-view-transactions',
    primaryCategory: 'how-to',
    categories: ['how-to', 'topups', 'cashouts'],
    questionKey: 'faq.questions.howToViewTransactions.question',
    answerKey: 'faq.questions.howToViewTransactions.answer',
  },

  // Security
  {
    id: 'why-treat-voucher-like-cash',
    primaryCategory: 'security',
    categories: ['security', 'topups'],
    questionKey: 'faq.questions.whyTreatVoucherLikeCash.question',
    answerKey: 'faq.questions.whyTreatVoucherLikeCash.answer',
  },
  {
    id: 'can-switch-topup-delivery',
    primaryCategory: 'security',
    categories: ['security', 'topups'],
    questionKey: 'faq.questions.canSwitchTopupDelivery.question',
    answerKey: 'faq.questions.canSwitchTopupDelivery.answer',
  },
  {
    id: 'protect-wallet-secrets',
    primaryCategory: 'security',
    categories: ['security', 'bitcoin-cash'],
    questionKey: 'faq.questions.protectWalletSecrets.question',
    answerKey: 'faq.questions.protectWalletSecrets.answer',
  },

  // Topups
  {
    id: 'what-is-topup',
    primaryCategory: 'topups',
    categories: ['topups', 'bitcoin-cash'],
    questionKey: 'faq.questions.whatIsTopup.question',
    answerKey: 'faq.questions.whatIsTopup.answer',
  },
  {
    id: 'how-customer-redeems-topup',
    primaryCategory: 'topups',
    categories: ['topups', 'how-to'],
    questionKey: 'faq.questions.howCustomerRedeemsTopup.question',
    answerKey: 'faq.questions.howCustomerRedeemsTopup.answer',
  },
  {
    id: 'can-cancel-delivered-topup',
    primaryCategory: 'topups',
    categories: ['topups', 'security'],
    questionKey: 'faq.questions.canCancelDeliveredTopup.question',
    answerKey: 'faq.questions.canCancelDeliveredTopup.answer',
  },

  // Cashouts
  {
    id: 'what-is-cashout',
    primaryCategory: 'cashouts',
    categories: ['cashouts', 'bitcoin-cash'],
    questionKey: 'faq.questions.whatIsCashout.question',
    answerKey: 'faq.questions.whatIsCashout.answer',
  },
  {
    id: 'why-cashout-payment-detection',
    primaryCategory: 'cashouts',
    categories: ['cashouts', 'security'],
    questionKey: 'faq.questions.whyCashoutPaymentDetection.question',
    answerKey: 'faq.questions.whyCashoutPaymentDetection.answer',
  },
  {
    id: 'where-cashout-bch-goes',
    primaryCategory: 'cashouts',
    categories: ['cashouts', 'security'],
    questionKey: 'faq.questions.whereCashoutBchGoes.question',
    answerKey: 'faq.questions.whereCashoutBchGoes.answer',
  },
];

export function getFaqCategory(
  categoryId: FaqCategoryId
): FaqCategoryDefinition {
  const category = faqCategories.find(
    (candidate) => candidate.id === categoryId
  );

  if (!category) {
    throw new Error(`Unknown FAQ category: ${categoryId}`);
  }

  return category;
}

export function getFaqEntryValidationErrors(
  entries: readonly FaqEntry[] = faqEntries
): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const entry of entries) {
    if (seenIds.has(entry.id)) {
      errors.push(`Duplicate FAQ id: ${entry.id}`);
    }

    seenIds.add(entry.id);

    if (!entry.categories.includes(entry.primaryCategory)) {
      errors.push(
        `FAQ "${entry.id}" does not include its primary category "${entry.primaryCategory}" in categories.`
      );
    }

    if (entry.categories.length === 0) {
      errors.push(`FAQ "${entry.id}" has no categories.`);
    }
  }

  return errors;
}
