import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/redeem', component: () => import('pages/RedeemPage.vue') },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'create', component: () => import('pages/CreatePage.vue') },
      {
        path: 'sell-voucher',
        component: () => import('pages/SellVoucherPage.vue'),
      },
      {
        path: 'cash-out',
        component: () => import('pages/CashOutPage.vue'),
      },
      {
        path: 'merchant-reports',
        component: () => import('pages/MerchantReportsPage.vue'),
      },
      {
        path: 'treasury-settings',
        component: () => import('pages/TreasurySettingsPage.vue'),
      },
      {
        path: 'printer-settings',
        component: () => import('pages/PrinterSettingsPage.vue'),
      },
      {
        path: 'voucher-history',
        component: () => import('pages/VoucherHistoryPage.vue'),
      },
      {
        path: 'voucher-key-check',
        component: () => import('pages/VoucherKeyCheckPage.vue'),
      },
      { path: 'faq', component: () => import('pages/FAQPage.vue') },
      { path: 'debug', component: () => import('pages/DebugPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
