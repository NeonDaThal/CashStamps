<template>
  <q-page padding class="landing-page">
    <div class="landing-container">
      <q-card flat bordered class="landing-card">
        <q-card-section class="text-center">
          <div class="text-h4 text-weight-bold q-mb-sm">BCH Voucher</div>

          <p class="text-grey-7 q-mb-none">
            Development landing page for the BCH voucher merchant app.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="column q-gutter-md">
            <q-btn
              color="primary"
              size="lg"
              label="Sell BCH Voucher"
              icon="point_of_sale"
              to="/sell-voucher"
              unelevated
            />

            <q-btn
              color="secondary"
              size="lg"
              label="Voucher History"
              icon="receipt_long"
              to="/voucher-history"
              unelevated
            />

            <q-btn
              color="green-8"
              size="lg"
              label="Treasury Settings"
              icon="account_balance_wallet"
              to="/treasury-settings"
              unelevated
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner class="bg-orange-1 text-orange-10" rounded>
            <template #avatar>
              <q-icon name="construction" />
            </template>

            Temporary Phase 5 Android testing screen. Final merchant branding,
            splash screen, and production navigation will be designed later.
          </q-banner>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.landing-page {
  background: #f5f7f8;
}

.landing-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.landing-card {
  width: 100%;
  max-width: 520px;
}
</style>
