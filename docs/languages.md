# Bitcoin Cash Topup — Language / i18n Setup

_Last updated: 17 August 2026_

## Purpose of this document

This file documents how language support is currently implemented in **Bitcoin Cash Topup / BCH Topups**.

It is intended to be useful for:

- a human developer returning to the project later;
- another AI assistant starting a fresh conversation;
- adding new languages safely;
- changing the language selector UI;
- debugging locale persistence;
- understanding how the toolbar language selector and App Settings language selector stay synchronized.

The goal is that someone should be able to read this document and understand the language architecture without needing the original development conversation.

---

# 1. Current language architecture at a glance

The app has one central language definition in:

```text
src/i18n/index.ts
```

That file defines:

- which locales are supported;
- the compact visible code for each locale;
- the translation key used for each language name;
- the `SupportedLocale` TypeScript type;
- the list of supported locale values;
- the default locale;
- the fallback locale;
- the imported translation message files;
- the helper used to resolve locale metadata.

Two UI locations consume the same central locale metadata:

```text
src/layouts/MainLayout.vue
```

for the compact language selector in the top-right app toolbar, and:

```text
src/pages/AppSettingsPage.vue
```

for the full **App Settings → Language** selector.

Locale persistence is handled separately by:

```text
src/i18n/locale-storage.ts
```

Both selectors ultimately modify the same global Vue i18n locale and persist the same locale value, so they always stay synchronized.

---

# 2. Relevant files

## Core i18n configuration

```text
src/i18n/index.ts
```

Responsibilities:

- imports every language message file;
- defines `localeOptions`;
- derives `SupportedLocale`;
- derives `supportedLocales`;
- defines the default and fallback locale;
- exposes `getLocaleOption()`;
- exports the final Vue i18n `messages` object.

This is the main source of truth for supported languages.

---

## Locale persistence

```text
src/i18n/locale-storage.ts
```

Responsibilities:

- stores the selected locale in browser / WebView `localStorage`;
- validates stored locale values;
- returns the stored locale when the app initializes;
- falls back to English if no valid saved value exists.

Current storage key:

```text
bch-voucher-locale
```

The storage key is older project naming and has intentionally been left unchanged so existing installations retain their saved language preference.

---

## Individual translation files

Current files:

```text
src/i18n/messages/en.ts
src/i18n/messages/es.ts
src/i18n/messages/de.ts
src/i18n/messages/pt.ts
src/i18n/messages/zh-HK.ts
src/i18n/messages/ne-NP.ts
src/i18n/messages/sv-SE.ts
src/i18n/messages/sw.ts
```

Each language file should contain the same translation-key structure.

English is the default/fallback reference language:

```text
src/i18n/messages/en.ts
```

When adding new UI labels, English should normally be updated first and the same keys then added to all other locale files.

Do not create duplicate translation keys when an existing shared key already describes the same text or concept.

---

## Main app toolbar selector

```text
src/layouts/MainLayout.vue
```

The top-right toolbar language menu reads from the shared `localeOptions` array in `src/i18n/index.ts`.

It no longer has its own hard-coded list of supported languages.

The toolbar shows the compact `toolbarLabel`, for example:

```text
EN
ES
DE
PT
HK
NP
SE
SW
```

The dropdown itself displays translated language names using each locale option's `labelKey`.

Changing language here:

1. changes the global Vue i18n locale immediately;
2. saves the locale with `saveStoredLocale()`;
3. updates the App Settings Language view automatically.

---

## App Settings Language selector

```text
src/pages/AppSettingsPage.vue
```

The **Language** category is a functional internal App Settings view.

It uses the same `localeOptions` array as `MainLayout.vue`.

The Language page:

- shows all supported locales;
- uses compact two-letter-style code pills;
- uses translated language names;
- visually highlights the currently selected language;
- shows a green check icon on the selected row;
- switches language immediately when tapped;
- persists the choice immediately;
- requires no separate Save button.

The Language row on the main App Settings page shows the currently selected language name rather than a generic description.

Configured values shown on the main Settings page use the BCH Topup branded green colour:

```text
#00CE1B
```

This applies, for example, to:

- the saved Business name;
- the currently selected Language.

Unconfigured / descriptive subtitles remain neutral grey.

---

# 3. Current supported languages

The currently supported locales are:

| Locale value | Toolbar / Settings code | Language |
|---|---:|---|
| `en` | `EN` | English |
| `es` | `ES` | Spanish |
| `de` | `DE` | German |
| `pt` | `PT` | Portuguese |
| `zh-HK` | `HK` | Cantonese |
| `ne-NP` | `NP` | Nepali |
| `sv-SE` | `SE` | Swedish |
| `sw` | `SW` | Swahili |

The visible short code is intentionally not always the literal locale suffix.

For example:

```text
zh-HK -> HK
ne-NP -> NP
sv-SE -> SE
```

This is a UI decision only.

The actual locale values remain the full locale identifiers such as:

```text
zh-HK
ne-NP
sv-SE
```

Those real locale values are what Vue i18n and locale persistence use.

---

# 4. `src/i18n/index.ts`

The current architecture is based around `localeOptions`.

Conceptually:

```ts
export const localeOptions = [
  {
    value: 'en',
    toolbarLabel: 'EN',
    labelKey: 'language.english',
  },
  {
    value: 'es',
    toolbarLabel: 'ES',
    labelKey: 'language.spanish',
  },

  // etc.
] as const;
```

Each entry contains three important pieces of information.

## `value`

Example:

```ts
value: 'zh-HK'
```

This is the actual locale identifier used by the application.

It is used for:

- Vue i18n;
- locale persistence;
- equality checks;
- the `SupportedLocale` TypeScript type.

---

## `toolbarLabel`

Example:

```ts
toolbarLabel: 'HK'
```

This is the compact user-facing code.

It is currently used by both:

- the toolbar selector;
- the code pill in App Settings → Language.

The property is still called `toolbarLabel` because the toolbar was its original use, but it now acts as the shared compact locale display code.

---

## `labelKey`

Example:

```ts
labelKey: 'language.cantonese'
```

This references a translation key that exists in every language message file.

The selector does **not** hard-code language names.

Instead it uses:

```ts
t(localeOption.labelKey)
```

This means language names themselves can be translated.

---

# 5. Derived locale types and lists

`SupportedLocale` is derived from `localeOptions`.

Conceptually:

```ts
export type SupportedLocale =
  (typeof localeOptions)[number]['value'];
```

This is important because adding a new locale option automatically expands the TypeScript union of valid locale values.

The plain list of supported locale values is also derived from `localeOptions`:

```ts
export const supportedLocales: readonly SupportedLocale[] =
  localeOptions.map((localeOption) => localeOption.value);
```

Therefore:

> **Do not manually maintain a second `supportedLocales` array when adding languages.**

Adding the locale to `localeOptions` is enough for it to appear in `supportedLocales`.

---

# 6. Default and fallback locale

Current values:

```ts
export const defaultLocale: SupportedLocale = 'en';

export const fallbackLocale: SupportedLocale = 'en';
```

English is therefore:

- the default locale;
- the fallback locale.

If a stored locale is invalid or absent, the app returns to English.

---

# 7. Locale metadata lookup

`src/i18n/index.ts` exposes:

```ts
getLocaleOption(value)
```

The helper is used when the UI needs metadata for the active locale.

It first tries an exact locale match.

For example:

```text
zh-HK -> zh-HK
```

If there is no exact match, it attempts a match using the first two characters / main language code.

If no match exists, it falls back to the first locale option, currently English.

This makes display logic more defensive if Vue i18n ever exposes a slightly different locale variant.

---

# 8. Messages object

Every imported translation file must also be registered in the final `messages` object.

Conceptually:

```ts
const messages = {
  en,
  es,
  de,
  pt,
  'zh-HK': zhHK,
  'ne-NP': neNP,
  'sv-SE': svSE,
  sw,
};
```

The key in this object must correspond to the locale's `value` in `localeOptions`.

For region-specific locales, quote the key where necessary:

```ts
'zh-HK': zhHK
```

---

# 9. Locale persistence

File:

```text
src/i18n/locale-storage.ts
```

The important API is:

```ts
getStoredLocale()
saveStoredLocale(locale)
isSupportedLocale(value)
```

## `isSupportedLocale()`

Checks whether a string exists in the shared `supportedLocales` list.

Because `supportedLocales` is derived from `localeOptions`, newly added locales automatically become valid after being added to `localeOptions`.

---

## `getStoredLocale()`

When the app loads:

1. reads:

```text
bch-voucher-locale
```

from `window.localStorage`;

2. checks whether it is a currently supported locale;

3. returns the stored locale if valid;

4. otherwise returns:

```ts
defaultLocale
```

which is currently English.

---

## `saveStoredLocale()`

Writes the selected `SupportedLocale` directly to local storage.

Both the toolbar and App Settings use this same storage mechanism.

No second App Settings-specific language setting should be introduced.

---

# 10. Toolbar language behaviour

File:

```text
src/layouts/MainLayout.vue
```

The toolbar imports:

```ts
localeOptions
getLocaleOption
SupportedLocale
```

from:

```text
src/i18n/index.ts
```

and uses the existing locale-storage service.

The dropdown is generated with a loop similar to:

```vue
<q-item
  v-for="localeOption in localeOptions"
  :key="localeOption.value"
  clickable
  @click="setLocale(localeOption.value)"
>
  <q-item-section>
    {{ t(localeOption.labelKey) }}
  </q-item-section>
</q-item>
```

This means adding a locale to `localeOptions` automatically adds it to the toolbar menu.

The toolbar button's visible short label is resolved from:

```ts
getLocaleOption(locale.value).toolbarLabel
```

There should therefore be no language-specific `if` / `else` chain in `MainLayout.vue`.

---

# 11. App Settings Language behaviour

File:

```text
src/pages/AppSettingsPage.vue
```

The Language category uses the global i18n locale:

```ts
const { t, locale } = useI18n({ useScope: 'global' });
```

and imports:

```ts
getLocaleOption
localeOptions
SupportedLocale
```

from the central i18n configuration.

The currently selected locale is derived from the global locale.

Conceptually:

```ts
const currentLocale = computed<SupportedLocale>(() => {
  return getLocaleOption(locale.value).value;
});
```

When the merchant selects a language:

```ts
function setAppLocale(newLocale: SupportedLocale): void {
  if (locale.value === newLocale) {
    return;
  }

  locale.value = newLocale;
  saveStoredLocale(newLocale);
}
```

This provides immediate switching.

There is intentionally:

- no temporary selection state;
- no Apply button;
- no Save button;
- no App Settings-specific locale storage.

---

# 12. Synchronization between selectors

The toolbar and Settings selector remain synchronized because both use:

```text
the same global Vue i18n locale
+
the same saveStoredLocale() persistence function
+
the same localeOptions metadata
```

Examples:

### Settings -> toolbar

If the user selects Spanish in App Settings:

```text
locale.value = 'es'
```

The toolbar immediately resolves:

```text
ES
```

from the same global locale.

### Toolbar -> Settings

If the user selects German from the toolbar:

```text
locale.value = 'de'
```

Opening App Settings → Language immediately shows German as selected.

No event bus, watcher, Pinia store, or duplicate state is required.

---

# 13. Language Settings design

The current visual treatment intentionally avoids flags.

Reason:

> Languages can span multiple countries, so a national flag can inaccurately imply that a language belongs to only one country.

Each language row therefore uses a compact language-code pill.

Examples:

```text
EN
ES
DE
PT
HK
NP
SE
SW
```

The selected row uses:

- subtle pale-green row background;
- dark / black compact code pill;
- BCH branded green text;
- BCH-green selected/check icon.

The design matches the wider App Settings visual system:

- white cards;
- dark text;
- BCH green;
- rounded corners;
- mobile-first layout;
- restrained shadows;
- clean grouped list rows.

---

# 14. Language page text

The Language settings page currently includes:

```text
Please select the language you wish to use
```

and:

```text
You can also switch language at any time by clicking the language button in the top, right hand corner of the app.
```

These live under the App Settings language translation section, for example in English:

```ts
appSettings: {
  language: {
    prompt: 'Please select the language you wish to use',
    toolbarHint:
      'You can also switch language at any time by clicking the language button in the top, right hand corner of the app.',
  },
}
```

These keys should exist in each supported language file.

---

# 15. Existing shared language-name keys

Language names are already translated through the general `language` section.

Current keys include:

```text
language.english
language.spanish
language.german
language.portuguese
language.cantonese
language.nepali
language.swedish
language.swahili
```

These are shared by:

- the toolbar dropdown;
- the App Settings Language selector;
- the selected Language subtitle on the App Settings main page.

Do not duplicate these names under `appSettings.language`.

If a translation key has a wider purpose than App Settings, prefer keeping it in the general `language` namespace.

---

# 16. Adding a new language

This is the standard checklist.

For this example, assume French is being added as:

```text
fr
```

## Step 1 — Create the translation file

Create:

```text
src/i18n/messages/fr.ts
```

It should contain the same translation-key structure as the other locale files.

A practical approach is to copy:

```text
src/i18n/messages/en.ts
```

and translate the values while preserving the keys and nesting.

---

## Step 2 — Import it in `src/i18n/index.ts`

Add:

```ts
import fr from './messages/fr';
```

---

## Step 3 — Add one `localeOptions` entry

Add:

```ts
{
  value: 'fr',
  toolbarLabel: 'FR',
  labelKey: 'language.french',
},
```

The position of the entry determines where the language appears in the toolbar and App Settings lists.

---

## Step 4 — Register the message file

Add it to:

```ts
const messages = {
  // ...
  fr,
};
```

---

## Step 5 — Add the language-name translation key

Because the locale option references:

```text
language.french
```

that key needs to exist in every language file.

For example, English:

```ts
language: {
  french: 'French',
}
```

and the equivalent translated value in all other locale files.

---

## Step 6 — Ensure the new locale file contains all current app keys

The new file must include the full current translation structure, including:

```text
appSettings.language.prompt
appSettings.language.toolbarHint
```

and all other app translation sections.

---

## Step 7 — No additional selector code should be required

After the above changes, the new language should automatically appear in:

```text
MainLayout toolbar selector
App Settings -> Language
```

and automatically become valid in:

```text
locale-storage.ts
```

because `supportedLocales` is derived from `localeOptions`.

You should **not** normally need to edit:

```text
src/layouts/MainLayout.vue
src/pages/AppSettingsPage.vue
src/i18n/locale-storage.ts
```

just to add another locale.

---

# 17. Adding a region-specific locale

For a locale such as Canadian French:

```text
fr-CA
```

the setup could be:

```ts
{
  value: 'fr-CA',
  toolbarLabel: 'FR',
  labelKey: 'language.frenchCanadian',
},
```

or another compact visible code if the product requires distinction between multiple French variants.

The important distinction is:

```text
value
```

is the real locale identifier, while:

```text
toolbarLabel
```

is only presentation.

If the app eventually supports two variants that would both naturally display `FR`, the UI may need a revised compact-label strategy to distinguish them.

---

# 18. Translation-key policy

When adding language-related text:

## Reuse an existing key when:

- the wording means the same thing;
- the label is shared across different parts of the app;
- a general-purpose language key already exists.

Example:

```text
language.english
```

should be reused everywhere the language name "English" is needed.

## Add an App Settings-specific key when:

- the wording only belongs to the Settings workflow;
- the text is explanatory copy specific to that screen;
- reusing a generic key would make its meaning ambiguous.

Example:

```text
appSettings.language.toolbarHint
```

is specific to the Language Settings screen and therefore belongs there.

---

# 19. App Settings structure note

At the time of this document, the Business and Language category views still live inside:

```text
src/pages/AppSettingsPage.vue
```

As more settings categories become functional, the intended next architectural improvement is to split category implementations into separate components.

Proposed direction:

```text
src/components/app-settings/
├── BusinessSettingsPanel.vue
├── LanguageSettingsPanel.vue
└── ...
```

Then `AppSettingsPage.vue` should primarily coordinate:

- the main App Settings category list;
- the currently open settings category;
- configured-value summaries;
- generic Coming Soon handling;
- the version footer.

This refactor has not yet been performed at the time of writing.

When it happens, update this document with the new component paths.

---

# 20. Testing checklist after language changes

After changing language infrastructure or adding a locale, test:

## Build / lint

Run targeted lint on changed files, for example:

```powershell
npx eslint src/i18n/index.ts src/i18n/locale-storage.ts src/layouts/MainLayout.vue src/pages/AppSettingsPage.vue
```

Then:

```powershell
npm run build
```

---

## Toolbar tests

Check:

- all supported languages appear;
- translated language names render correctly;
- selected language changes immediately;
- toolbar compact code updates;
- region-specific locales display the intended compact code.

---

## App Settings tests

Check:

- App Settings → Language opens correctly;
- every supported language appears;
- the active row is highlighted;
- the selected row has its check icon;
- compact code pill is correct;
- selecting a locale changes the UI immediately;
- Back returns to App Settings;
- the Language row shows the selected language name;
- configured Language subtitle is BCH green.

---

## Cross-selector synchronization

Test:

```text
Settings -> select language -> toolbar updates
```

and:

```text
Toolbar -> select language -> Settings selection updates
```

---

## Persistence

After selecting a locale:

- refresh browser;
- close/reopen app;
- confirm locale remains selected.

On Android, test persistence after a full app close as well.

---

## Mobile layout

Check narrow widths, particularly:

- code pills;
- long translated language names;
- selected icon;
- no text collision;
- no horizontal overflow.

---

# 21. Important invariants

When doing future language work, preserve these rules unless intentionally redesigning the architecture:

1. **`src/i18n/index.ts` is the source of truth for supported locale metadata.**
2. **Do not hard-code separate language lists in individual UI components.**
3. **Toolbar and App Settings must use the same global Vue i18n locale.**
4. **Both selectors must persist via the same locale-storage service.**
5. **Do not introduce a second language preference into `app-settings.ts`.**
6. **Language names should use shared `language.*` keys rather than App Settings duplicates.**
7. **Use language codes rather than flags.**
8. **Actual locale identifiers and visible compact codes are separate concepts.**
9. **English remains the current default and fallback locale.**
10. **Every translation file should maintain the same key structure.**

---

# 22. Quick reference for another developer / AI

If you only need the shortest possible mental model:

```text
SUPPORTED LANGUAGES
        |
        v
src/i18n/index.ts
  localeOptions
  ├─ real locale value
  ├─ compact display code
  └─ language-name translation key
        |
        +--------------------------+
        |                          |
        v                          v
MainLayout.vue              AppSettingsPage.vue
toolbar selector            Language settings
        |                          |
        +------------+-------------+
                     |
                     v
             global vue-i18n locale
                     |
                     v
          src/i18n/locale-storage.ts
                     |
                     v
          localStorage persistence
```

To add a language:

```text
1. Create messages/<locale>.ts
2. Import it in i18n/index.ts
3. Add one localeOptions entry
4. Add it to messages
5. Add its language-name key to all locale files
6. Ensure the new translation file contains all current keys
7. Lint, build, test toolbar + Settings + persistence
```

No hard-coded selector additions should otherwise be necessary.

---

# 23. Maintenance

Update this document whenever any of the following changes:

- a locale is added or removed;
- locale storage changes;
- the default/fallback locale changes;
- `localeOptions` structure changes;
- language-name translation keys move;
- the toolbar selector is redesigned;
- the Language Settings view is moved into its own component;
- app-wide locale initialization changes;
- language persistence moves away from `localStorage`.

Keeping this file current should make future language work much safer and faster.
