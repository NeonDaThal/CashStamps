package com.konk.bchvoucher;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothEscPosPrinterPlugin.class);
        registerPlugin(AndroidReportPrinterPlugin.class);
        registerPlugin(AndroidImageSaverPlugin.class);
        registerPlugin(AndroidReportSharerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
