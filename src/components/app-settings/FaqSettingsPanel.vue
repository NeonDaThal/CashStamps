<template>
  <div class="faq-settings-panel">
    <!-- Back + title card -->
    <!-- Back + heading -->
    <section class="settings-detail-header">
      <q-btn
        flat
        dense
        round
        icon="arrow_back"
        class="settings-back-button"
        :aria-label="t('appSettings.navigation.backToSettings')"
        @click="emit('back')"
      />

      <div class="settings-detail-heading">
        <div class="settings-eyebrow">
          {{ t('appSettings.sections.help') }}
        </div>

        <h1>{{ t('appSettings.items.faq.title') }}</h1>

        <p>
          {{ t('appSettings.items.faq.subtitle') }}
        </p>
      </div>
    </section>

    <!-- Category shortcut cards -->
    <div class="faq-category-strip">
      <button
        v-for="category in faqCategories"
        :key="category.id"
        type="button"
        class="faq-category-tile"
        :class="{
          'faq-category-tile--selected': selectedCategory === category.id,
        }"
        @click="toggleCategory(category.id)"
      >
        <div class="faq-category-icon">
          <q-icon :name="category.icon" />
        </div>

        <span>
          {{ t(category.labelKey) }}
        </span>
      </button>
    </div>

    <!-- Search + filter -->
    <q-card flat bordered class="faq-controls-card">
      <q-card-section class="faq-controls">
        <q-input
          v-model="searchQuery"
          outlined
          clearable
          dense
          class="faq-search"
          :placeholder="t('faq.controls.searchPlaceholder')"
          @clear="handleClearSearch"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select
          v-model="selectedCategory"
          :options="categoryFilterOptions"
          outlined
          clearable
          dense
          emit-value
          map-options
          class="faq-category-filter"
          :label="t('faq.controls.categoryFilter')"
        />

        <q-btn
          v-if="hasActiveFilters"
          flat
          no-caps
          icon="close"
          class="faq-clear-button"
          :label="t('faq.controls.clearFilters')"
          @click="clearFilters"
        />
      </q-card-section>
    </q-card>

    <!-- Default grouped view -->
    <template v-if="showDefaultGroupedView">
      <section
        v-for="category in populatedDefaultCategories"
        :key="category.id"
        class="faq-section"
      >
        <div class="faq-section-heading">
          <h2>
            {{ t(category.labelKey) }}
          </h2>

          <button
            v-if="
              getEntriesForPrimaryCategory(category.id).length >
              defaultPreviewCount
            "
            type="button"
            class="faq-view-more"
            @click="selectedCategory = category.id"
          >
            {{ t('faq.actions.viewMore') }}
          </button>
        </div>

        <q-card flat bordered class="faq-question-card">
          <q-list separator>
            <FaqQuestion
              v-for="entry in getPreviewEntries(category.id)"
              :key="entry.id"
              :entry="entry"
            />
          </q-list>
        </q-card>
      </section>
    </template>

    <!-- Search / category results -->
    <template v-else-if="filteredEntries.length > 0">
      <q-card flat bordered class="faq-question-card">
        <q-list separator>
          <FaqQuestion
            v-for="entry in filteredEntries"
            :key="entry.id"
            :entry="entry"
          />
        </q-list>
      </q-card>
    </template>

    <!-- No results -->
    <q-card
      v-else-if="faqEntries.length > 0"
      flat
      bordered
      class="faq-empty-card"
    >
      <q-card-section class="faq-empty-content">
        <div class="faq-empty-icon">
          <q-icon name="search_off" />
        </div>

        <p>
          {{ t('faq.states.noResults') }}
        </p>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import { QExpansionItem, QIcon } from 'quasar';
import { useI18n } from 'vue-i18n';

import {
  faqCategories,
  faqEntries,
  type FaqCategoryId,
  type FaqEntry,
} from 'src/data/faq';

const emit = defineEmits<{
  back: [];
}>();

const { t, locale } = useI18n({ useScope: 'global' });

const defaultPreviewCount = 3;

const searchQuery = ref<string | null>('');
const selectedCategory = ref<FaqCategoryId | null>(null);

const categoryFilterOptions = computed(() => {
  const options = faqCategories.map((category) => ({
    label: t(category.labelKey),
    value: category.id,
  }));

  return options.sort((left, right) =>
    left.label.localeCompare(right.label, locale.value)
  );
});

const sortedCategories = computed(() => {
  return [...faqCategories].sort((left, right) =>
    t(left.labelKey).localeCompare(t(right.labelKey), locale.value)
  );
});

const populatedDefaultCategories = computed(() => {
  return sortedCategories.value.filter(
    (category) => getEntriesForPrimaryCategory(category.id).length > 0
  );
});

const normalizedSearchTerms = computed(() => {
  return normalizeSearchText(searchQuery.value ?? '')
    .split(/\s+/)
    .filter(Boolean);
});

const hasActiveFilters = computed(() => {
  return (
    Boolean((searchQuery.value ?? '').trim()) || selectedCategory.value !== null
  );
});

const showDefaultGroupedView = computed(() => {
  return !hasActiveFilters.value;
});

const filteredEntries = computed(() => {
  return faqEntries.filter((entry) => {
    if (
      selectedCategory.value &&
      !entry.categories.includes(selectedCategory.value)
    ) {
      return false;
    }

    if (normalizedSearchTerms.value.length === 0) {
      return true;
    }

    const searchableText = normalizeSearchText(
      `${t(entry.questionKey)} ${t(entry.answerKey)}`
    );

    return normalizedSearchTerms.value.every((term) =>
      searchableText.includes(term)
    );
  });
});

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(locale.value)
    .trim();
}

function handleClearSearch(): void {
  searchQuery.value = '';
}

function toggleCategory(categoryId: FaqCategoryId): void {
  selectedCategory.value =
    selectedCategory.value === categoryId ? null : categoryId;
}

function clearFilters(): void {
  searchQuery.value = '';
  selectedCategory.value = null;
}

function getEntriesForPrimaryCategory(
  categoryId: FaqCategoryId
): readonly FaqEntry[] {
  return faqEntries.filter((entry) => entry.primaryCategory === categoryId);
}

function getPreviewEntries(categoryId: FaqCategoryId): readonly FaqEntry[] {
  return getEntriesForPrimaryCategory(categoryId).slice(0, defaultPreviewCount);
}

/**
 * Local render-only component for an individual expandable FAQ.
 *
 * Keeping this small piece local avoids creating another file before
 * we know whether FAQ answers will later need richer article/media UI.
 */
const FaqQuestion = defineComponent({
  name: 'FaqQuestion',

  props: {
    entry: {
      type: Object as () => FaqEntry,
      required: true,
    },
  },

  setup(props) {
    return () =>
      h(
        QExpansionItem,
        {
          label: t(props.entry.questionKey),
          expandIcon: 'keyboard_arrow_down',
          expandedIcon: 'keyboard_arrow_up',
          headerClass: 'faq-question-header',
          contentClass: 'faq-question-content',
        },
        {
          default: () => [
            h(
              'div',
              {
                class: 'faq-answer',
              },
              [
                h('p', t(props.entry.answerKey)),

                props.entry.learnMore?.type === 'external'
                  ? h(
                      'a',
                      {
                        href: props.entry.learnMore.url,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        class: 'faq-learn-more',
                      },
                      [
                        t(
                          props.entry.learnMore.labelKey ??
                            'faq.actions.learnMore'
                        ),
                        h(QIcon, {
                          name: 'open_in_new',
                          size: '16px',
                        }),
                      ]
                    )
                  : null,
              ]
            ),
          ],
        }
      );
  },
});
</script>

<style lang="scss" scoped>
.faq-settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-back-button {
  background: #ffffff;
  border: 1px solid #dddddd;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.06);
  color: #111111;
  flex: 0 0 auto;
  margin-top: 8px;
}

.settings-back-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.faq-controls-card,
.faq-question-card,
.faq-empty-card {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 22px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.055);
  overflow: hidden;
}

.settings-detail-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  padding: 6px 2px 0;
}

.settings-back-button {
  background: #ffffff;
  border: 1px solid #dddddd;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.06);
  color: #111111;
  flex: 0 0 auto;
  margin-top: 2px;
}

.settings-back-button :deep(.q-focus-helper) {
  border-radius: inherit;
}

.settings-detail-heading {
  min-width: 0;
}

.settings-eyebrow {
  color: #008f13;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.09em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.settings-detail-heading h1 {
  color: #111111;
  font-size: clamp(30px, 8vw, 42px);
  font-weight: 950;
  letter-spacing: -1px;
  line-height: 1.05;
  margin: 0;
}

.settings-detail-heading p {
  color: #555555;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.45;
  margin: 10px 0 0;
}

/* Horizontal category shortcuts */
.faq-category-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 1px 5px;
  scrollbar-width: none;
}

.faq-category-strip::-webkit-scrollbar {
  display: none;
}

.faq-category-tile {
  align-items: center;
  appearance: none;
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 18px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.045);
  color: #111111;
  cursor: pointer;
  display: flex;
  flex: 1 0 120px;
  flex-direction: column;
  font: inherit;
  gap: 8px;
  justify-content: center;
  min-height: 104px;
  padding: 12px 10px;
  transition: border-color 140ms ease, background 140ms ease,
    transform 140ms ease;
}

.faq-category-tile:hover {
  border-color: rgba(0, 206, 27, 0.45);
  transform: translateY(-1px);
}

.faq-category-tile--selected {
  background: rgba(0, 206, 27, 0.08);
  border-color: rgba(0, 206, 27, 0.45);
}

.faq-category-icon {
  align-items: center;
  background: #f0f4f0;
  border: 1px solid #e1e5e1;
  border-radius: 15px;
  color: #00a816;
  display: flex;
  font-size: 24px;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.faq-category-tile--selected .faq-category-icon {
  background: #111111;
  border-color: #111111;
  color: #00ce1b;
}

.faq-category-tile span {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
}

/* Search/filter controls */
.faq-controls {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px) auto;
  padding: 16px;
}

.faq-search :deep(.q-field__control),
.faq-category-filter :deep(.q-field__control) {
  border-radius: 15px;
}

.faq-clear-button {
  color: #008f13;
  font-weight: 850;
  white-space: nowrap;
}

/* Default category sections */
.faq-section {
  display: grid;
  gap: 8px;
}

.faq-section-heading {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 0 6px;
}

.faq-section-heading h2 {
  color: #111111;
  font-size: 16px;
  font-weight: 950;
  margin: 0;
}

.faq-view-more {
  appearance: none;
  background: transparent;
  border: 0;
  color: #008f13;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  padding: 4px 0;
}

.faq-view-more:hover {
  text-decoration: underline;
}

/* Expansion rows */
.faq-question-card :deep(.q-separator) {
  background: #eeeeee;
}

.faq-question-card :deep(.faq-question-header) {
  color: #111111;
  font-size: 14px;
  font-weight: 850;
  min-height: 62px;
  padding: 10px 16px;
}

.faq-question-card :deep(.faq-question-header .q-focus-helper) {
  border-radius: 0;
}

.faq-question-card :deep(.faq-question-content) {
  background: #fafafa;
}

:deep(.faq-answer) {
  border-top: 1px solid #eeeeee;
  color: #555555;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
  padding: 18px 20px 20px;
}

:deep(.faq-answer p) {
  margin: 0;
}

:deep(.faq-learn-more) {
  align-items: center;
  color: #008f13;
  display: inline-flex;
  font-weight: 900;
  gap: 4px;
  margin-top: 14px;
  text-decoration: none;
}

:deep(.faq-learn-more:hover) {
  text-decoration: underline;
}

/* Empty search result */
.faq-empty-content {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 34px 20px;
  text-align: center;
}

.faq-empty-icon {
  align-items: center;
  background: #f0f4f0;
  border-radius: 16px;
  color: #777777;
  display: flex;
  font-size: 28px;
  height: 52px;
  justify-content: center;
  width: 52px;
}

.faq-empty-content p {
  color: #666666;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.45;
  margin: 0;
}

@media (max-width: 700px) {
  .faq-settings-panel {
    gap: 18px;
  }

  .faq-top-row {
    gap: 10px;
  }

  .settings-back-button {
    margin-top: 5px;
  }

  .settings-detail-heading h1 {
    font-size: 30px;
  }

  .settings-detail-heading p {
    font-size: 14px;
  }

  .faq-category-tile {
    flex-basis: 105px;
    min-height: 96px;
  }

  .faq-controls {
    grid-template-columns: 1fr;
  }

  .faq-clear-button {
    justify-self: start;
  }
}
</style>
