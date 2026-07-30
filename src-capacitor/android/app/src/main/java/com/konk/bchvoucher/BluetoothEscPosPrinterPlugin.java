package com.konk.bchvoucher;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.os.Build;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothEscPosPrinter",
    permissions = {
        @Permission(
            alias = BluetoothEscPosPrinterPlugin.BLUETOOTH_PRINTER_ALIAS,
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN
            }
        )
    }
)
public class BluetoothEscPosPrinterPlugin extends Plugin {
    static final String BLUETOOTH_PRINTER_ALIAS = "bluetoothPrinter";

    private static final String DEFAULT_PRINTER_ADDRESS = "60:6E:41:45:8C:14";
    private static final String DEFAULT_PRINTER_NAME = "JK-5803P";
    private static final String SPP_UUID_STRING = "00001101-0000-1000-8000-00805F9B34FB";

    private static final UUID SPP_UUID = UUID.fromString(SPP_UUID_STRING);
    private static final int PRINTER_TEXT_CHARACTER_TABLE = 16;
    private static final Charset PRINTER_TEXT_CHARSET = Charset.forName("windows-1252");

    private static final int MAX_PRINT_ATTEMPTS = 3;
    private static final long PRINT_RETRY_DELAY_MS = 650L;
    private static final long POST_FLUSH_SETTLE_DELAY_MS = 180L;

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (!ensureBluetoothPrinterPermission(call, "getPairedDevicesPermissionCallback")) {
            return;
        }

        doGetPairedDevices(call);
    }

    @PermissionCallback
    private void getPairedDevicesPermissionCallback(PluginCall call) {
        if (!hasBluetoothPrinterPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doGetPairedDevices(call);
    }

    @PluginMethod
    public void printTestPage(PluginCall call) {
        if (!ensureBluetoothPrinterPermission(call, "printTestPagePermissionCallback")) {
            return;
        }

        doPrintTestPage(call);
    }

    @PermissionCallback
    private void printTestPagePermissionCallback(PluginCall call) {
        if (!hasBluetoothPrinterPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintTestPage(call);
    }

    @PluginMethod
    public void printQrTest(PluginCall call) {
        if (!ensureBluetoothPrinterPermission(call, "printQrTestPermissionCallback")) {
            return;
        }

        doPrintQrTest(call);
    }

    @PermissionCallback
    private void printQrTestPermissionCallback(PluginCall call) {
        if (!hasBluetoothPrinterPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintQrTest(call);
    }

    @PluginMethod
    public void printVoucherReceiptTest(PluginCall call) {
        if (!ensureBluetoothPrinterPermission(call, "printVoucherReceiptTestPermissionCallback")) {
            return;
        }

        doPrintVoucherReceiptTest(call);
    }

    @PermissionCallback
    private void printVoucherReceiptTestPermissionCallback(PluginCall call) {
        if (!hasBluetoothPrinterPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintVoucherReceiptTest(call);
    }

    @PluginMethod
    public void printCharacterEncodingTest(PluginCall call) {
        if (!ensureBluetoothPrinterPermission(call, "printCharacterEncodingTestPermissionCallback")) {
            return;
        }

        doPrintCharacterEncodingTest(call);
    }

    @PermissionCallback
    private void printCharacterEncodingTestPermissionCallback(PluginCall call) {
        if (!hasBluetoothPrinterPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintCharacterEncodingTest(call);
    }

    @PluginMethod
    public void printRasterTextTest(PluginCall call) {
        if (!ensureBluetoothPrinterPermission(call, "printRasterTextTestPermissionCallback")) {
            return;
        }

        doPrintRasterTextTest(call);
    }

    @PermissionCallback
    private void printRasterTextTestPermissionCallback(PluginCall call) {
        if (!hasBluetoothPrinterPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintRasterTextTest(call);
    }

    @PluginMethod
    public void printVoucherReceipt(PluginCall call) {
        if (!ensureBluetoothPrinterPermission(call, "printVoucherReceiptPermissionCallback")) {
            return;
        }

        doPrintVoucherReceipt(call);
    }

    @PermissionCallback
    private void printVoucherReceiptPermissionCallback(PluginCall call) {
        if (!hasBluetoothPrinterPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintVoucherReceipt(call);
    }

    private void doGetPairedDevices(PluginCall call) {
        try {
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();

            if (adapter == null) {
                call.reject("Bluetooth is not available on this device.");
                return;
            }

            if (!adapter.isEnabled()) {
                call.reject("Bluetooth is turned off. Turn Bluetooth on and try again.");
                return;
            }

            Set<BluetoothDevice> bondedDevices = adapter.getBondedDevices();
            JSONArray devices = new JSONArray();

            for (BluetoothDevice device : bondedDevices) {
                JSObject item = new JSObject();
                item.put("name", safeDeviceName(device));
                item.put("address", safeDeviceAddress(device));
                item.put("bondState", device.getBondState());
                devices.put(item);
            }

            JSObject result = new JSObject();
            result.put("devices", devices);
            call.resolve(result);
        } catch (SecurityException error) {
            call.reject("Bluetooth permission error: " + error.getMessage());
        } catch (Exception error) {
            call.reject("Could not read paired Bluetooth devices: " + error.getMessage());
        }
    }

    private void doPrintTestPage(PluginCall call) {
        final String address = normalisePrinterAddress(
            call.getString("address", DEFAULT_PRINTER_ADDRESS)
        );
        final String printerName = call.getString("name", DEFAULT_PRINTER_NAME);
        final String text = call.getString(
            "text",
            "BCH Voucher Printer Test"
        );

        new Thread(() -> {
            try {
                byte[] bytes = buildTextTestBytes(text);
                sendBytesToPrinter(address, bytes);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("printerName", printerName);
                result.put("address", address);
                result.put("message", "Text test sent to printer.");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Text test print failed: " + error.getMessage());
            }
        }).start();
    }

    private void doPrintQrTest(PluginCall call) {
        final String address = normalisePrinterAddress(
            call.getString("address", DEFAULT_PRINTER_ADDRESS)
        );
        final String printerName = call.getString("name", DEFAULT_PRINTER_NAME);
        final String qrPayload = call.getString(
            "qrPayload",
            "BCH Voucher Printer QR Test"
        );

        new Thread(() -> {
            try {
                byte[] bytes = buildQrTestBytes(qrPayload);
                sendBytesToPrinter(address, bytes);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("printerName", printerName);
                result.put("address", address);
                result.put("message", "QR test sent to printer.");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("QR test print failed: " + error.getMessage());
            }
        }).start();
    }

    private void doPrintVoucherReceiptTest(PluginCall call) {
        final String address = normalisePrinterAddress(
            call.getString("address", DEFAULT_PRINTER_ADDRESS)
        );
        final String printerName = call.getString("name", DEFAULT_PRINTER_NAME);

        new Thread(() -> {
            try {
                byte[] bytes = buildVoucherReceiptTestBytes();
                sendBytesToPrinter(address, bytes);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("printerName", printerName);
                result.put("address", address);
                result.put("message", "Voucher receipt test sent to printer.");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Voucher receipt test print failed: " + error.getMessage());
            }
        }).start();
    }

    private void doPrintCharacterEncodingTest(PluginCall call) {
        final String address = normalisePrinterAddress(
            call.getString("address", DEFAULT_PRINTER_ADDRESS)
        );
        final String printerName = call.getString("name", DEFAULT_PRINTER_NAME);

        new Thread(() -> {
            try {
                byte[] bytes = buildCharacterEncodingTestBytes();
                sendBytesToPrinter(address, bytes);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("printerName", printerName);
                result.put("address", address);
                result.put("message", "Character encoding test sent to printer.");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Character encoding test print failed: " + error.getMessage());
            }
        }).start();
    }

    private void doPrintRasterTextTest(PluginCall call) {
        final String address = normalisePrinterAddress(
            call.getString("address", DEFAULT_PRINTER_ADDRESS)
        );
        final String printerName = call.getString("name", DEFAULT_PRINTER_NAME);

        new Thread(() -> {
            try {
                byte[] bytes = buildRasterTextTestBytes();
                sendBytesToPrinter(address, bytes);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("printerName", printerName);
                result.put("address", address);
                result.put("message", "Raster text test sent to printer.");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Raster text test print failed: " + error.getMessage());
            }
        }).start();
    }

    private void doPrintVoucherReceipt(PluginCall call) {
        final String printerAddress = normalisePrinterAddress(
            call.getString("address", DEFAULT_PRINTER_ADDRESS)
        );
        final String printerName = call.getString("name", DEFAULT_PRINTER_NAME);

        final String title = safeString(call.getString("title", "BCH Voucher"));
        final String serial = safeString(call.getString("serial", "UNKNOWN"));
        final String issuedAtLabel = safeString(call.getString("issuedAtLabel", ""));
        final String customerPaidLabel = safeString(call.getString("customerPaidLabel", ""));
        final String loadedFiatLabel = safeString(call.getString("loadedFiatLabel", ""));
        final String bchAmountLabel = safeString(call.getString("bchAmountLabel", ""));
        final String voucherAddress = safeString(call.getString("voucherAddress", ""));
        final String qrPayload = safeString(call.getString("qrPayload", ""));
        final String redemptionInstruction = safeString(call.getString("redemptionInstruction", ""));
        final String cashWarning = safeString(call.getString("cashWarning", ""));
        final String supportNote = safeString(call.getString("supportNote", ""));

        final String valueLoadedLabel = getStringWithFallback(
            call,
            "valueLoadedLabel",
            "Value loaded"
        );
        final String scanToRedeemLabel = getStringWithFallback(
            call,
            "scanToRedeemLabel",
            "Scan to Redeem"
        );
        final String referenceLabel = getStringWithFallback(
            call,
            "referenceLabel",
            "Reference"
        );
        final String issuedLabel = getStringWithFallback(
            call,
            "issuedLabel",
            "Issued"
        );
        final String customerPaidFieldLabel = getStringWithFallback(
            call,
            "customerPaidFieldLabel",
            "Customer Paid"
        );
        final String loadedFieldLabel = getStringWithFallback(
            call,
            "loadedFieldLabel",
            "Loaded"
        );
        final String voucherAddressLabel = getStringWithFallback(
            call,
            "voucherAddressLabel",
            "Voucher Address"
        );

        if (!hasText(qrPayload)) {
            call.reject("Voucher receipt QR payload is missing.");
            return;
        }

        new Thread(() -> {
            try {
                byte[] bytes = buildVoucherReceiptBytes(
                    title,
                    serial,
                    issuedAtLabel,
                    customerPaidLabel,
                    loadedFiatLabel,
                    bchAmountLabel,
                    voucherAddress,
                    qrPayload,
                    redemptionInstruction,
                    cashWarning,
                    supportNote,
                    valueLoadedLabel,
                    scanToRedeemLabel,
                    referenceLabel,
                    issuedLabel,
                    customerPaidFieldLabel,
                    loadedFieldLabel,
                    voucherAddressLabel
                );

                sendBytesToPrinter(printerAddress, bytes);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("printerName", printerName);
                result.put("address", printerAddress);
                result.put("message", "Voucher receipt sent to printer.");
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Voucher receipt print failed: " + error.getMessage());
            }
        }).start();
    }

    private boolean ensureBluetoothPrinterPermission(
        PluginCall call,
        String callbackName
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }

        if (getPermissionState(BLUETOOTH_PRINTER_ALIAS) == PermissionState.GRANTED) {
            return true;
        }

        requestPermissionForAlias(BLUETOOTH_PRINTER_ALIAS, call, callbackName);
        return false;
    }

    private boolean hasBluetoothPrinterPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }

        return getPermissionState(BLUETOOTH_PRINTER_ALIAS) == PermissionState.GRANTED;
    }

    private void sendBytesToPrinter(String address, byte[] bytes) throws IOException {
        IOException lastError = null;

        for (int attempt = 1; attempt <= MAX_PRINT_ATTEMPTS; attempt += 1) {
            try {
                sendBytesToPrinterOnce(address, bytes);
                return;
            } catch (SecurityException error) {
                throw new IOException(
                    "Bluetooth permission error. Check Nearby devices permission is allowed.",
                    error
                );
            } catch (IOException error) {
                lastError = error;

                if (attempt < MAX_PRINT_ATTEMPTS) {
                    sleepBeforeRetry();
                }
            }
        }

        String details =
            lastError != null && lastError.getMessage() != null
                ? lastError.getMessage()
                : "Unknown Bluetooth socket error.";

        throw new IOException(
            "Could not connect to printer. Check the printer is switched on, nearby, and not connected to another app. Last error: "
                + details,
            lastError
        );
    }

    private void sendBytesToPrinterOnce(String address, byte[] bytes) throws IOException {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();

        if (adapter == null) {
            throw new IOException("Bluetooth is not available on this device.");
        }

        if (!adapter.isEnabled()) {
            throw new IOException("Bluetooth is turned off.");
        }

        BluetoothDevice device = adapter.getRemoteDevice(address);
        BluetoothSocket socket = null;

        adapter.cancelDiscovery();

        try {
            socket = createBluetoothSocket(device);
            socket.connect();

            OutputStream outputStream = socket.getOutputStream();
            outputStream.write(bytes);
            outputStream.flush();

            try {
                Thread.sleep(POST_FLUSH_SETTLE_DELAY_MS);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException ignored) {
                    // Ignore close errors after print attempt.
                }
            }
        }
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(PRINT_RETRY_DELAY_MS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private BluetoothSocket createBluetoothSocket(BluetoothDevice device)
        throws IOException {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.GINGERBREAD_MR1) {
            return device.createInsecureRfcommSocketToServiceRecord(SPP_UUID);
        }

        return device.createRfcommSocketToServiceRecord(SPP_UUID);
    }

    private byte[] buildTextTestBytes(String text) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        writeInitialize(output);
        writeAlignCenter(output);
        writeBold(output, true);
        writeTextLine(output, "BCH VOUCHER");
        writeTextLine(output, "PRINTER TEST");
        writeBold(output, false);
        writeFeedLines(output, 1);

        writeAlignLeft(output);
        writeTextLine(output, "Printer: " + DEFAULT_PRINTER_NAME);
        writeTextLine(output, "Paper: 58mm");
        writeTextLine(output, "Mode: ESC/POS Bluetooth");
        writeTextLine(output, "Message:");
        writeTextLine(output, text);
        writeFeedLines(output, 3);

        return output.toByteArray();
    }

    private byte[] buildQrTestBytes(String qrPayload) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        writeInitialize(output);
        writeAlignCenter(output);
        writeBold(output, true);
        writeTextLine(output, "BCH VOUCHER");
        writeTextLine(output, "QR TEST");
        writeBold(output, false);
        writeFeedLines(output, 1);

        writeQrCode(output, qrPayload, 6);
        writeFeedLines(output, 1);

        writeTextLine(output, "QR payload is test-only.");
        writeTextLine(output, "No voucher key printed.");
        writeFeedLines(output, 3);

        return output.toByteArray();
    }

    private byte[] buildVoucherReceiptTestBytes() throws IOException {
        return buildVoucherReceiptBytes(
            "BCH Voucher",
            "TEST-0001",
            "TEST MODE",
            "GBP 11.00",
            "GBP 10.00",
            "0.01234567 BCH",
            "bitcoincash:qptestvoucheraddress000000000000000000000000000",
            "BCH_VOUCHER_TEST_ONLY_REFERENCE_TEST-0001",
            "This QR is test-only. It does not contain a voucher key.",
            "WARNING: TREAT A REAL VOUCHER LIKE CASH.",
            "Keep the receipt safe until the voucher is redeemed.",
            "Value loaded",
            "Scan to Redeem",
            "Reference",
            "Issued",
            "Customer Paid",
            "Loaded",
            "Voucher Address"
        );
    }

    private byte[] buildCharacterEncodingTestBytes() throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        writeInitialize(output);
        writeAlignCenter(output);
        writeBold(output, true);
        writeTextLine(output, "CHARACTER TEST");
        writeBold(output, false);
        writeTextLine(output, "JK-5803P ESC/POS");
        writeFeedLines(output, 1);

        writeAlignLeft(output);
        writeTextLine(output, "This is test-only.");
        writeTextLine(output, "Tell the chat which section");
        writeTextLine(output, "prints best on paper.");

        writeDivider(output);

        writeEncodingTestSection(
            output,
            "A: Live receipt profile",
            PRINTER_TEXT_CHARACTER_TABLE,
            PRINTER_TEXT_CHARSET.name(),
            "LATIN: GBP £10.00 EUR €10.00",
            "ES: España niño acción café",
            "PT: ação coração ç ã õ",
            "SV: å ä ö Å Ä Ö",
            "ZH: 中文 香港 廣東話 現金充值",
            "NE: नेपाली नमस्ते"
        );

        writeEncodingTestSection(
            output,
            "B: ESC t 0 / IBM437",
            0,
            "IBM437",
            "LATIN: GBP £10.00 EUR €10.00",
            "ES: España niño acción café",
            "PT: ação coração ç ã õ",
            "SV: å ä ö Å Ä Ö"
        );

        writeEncodingTestSection(
            output,
            "C: ESC t 2 / IBM850",
            2,
            "IBM850",
            "LATIN: GBP £10.00 EUR €10.00",
            "ES: España niño acción café",
            "PT: ação coração ç ã õ",
            "SV: å ä ö Å Ä Ö"
        );

        writeEncodingTestSection(
            output,
            "D: ESC t 19 / IBM858",
            19,
            "IBM00858",
            "LATIN: GBP £10.00 EUR €10.00",
            "ES: España niño acción café",
            "PT: ação coração ç ã õ",
            "SV: å ä ö Å Ä Ö"
        );

        writeEncodingTestSection(
            output,
            "E: ESC t 16 / Windows-1252",
            16,
            "windows-1252",
            "LATIN: GBP £10.00 EUR €10.00",
            "ES: España niño acción café",
            "PT: ação coração ç ã õ",
            "SV: å ä ö Å Ä Ö"
        );

        writeChineseCharacterMode(output, true);
        writeEncodingTestSection(
            output,
            "F: GBK + Chinese mode",
            -1,
            "GBK",
            "ZH: 中文 香港 廣東話 現金充值"
        );
        writeChineseCharacterMode(output, false);

        writeEncodingTestSection(
            output,
            "G: Raw UTF-8 bytes",
            -1,
            "UTF-8",
            "LATIN: GBP £10.00 EUR €10.00",
            "ES: España niño acción café",
            "PT: ação coração ç ã õ",
            "SV: å ä ö Å Ä Ö",
            "ZH: 中文 香港 廣東話 現金充值",
            "NE: नेपाली नमस्ते"
        );

        writeDivider(output);
        writeTextLine(output, "END OF CHARACTER TEST");
        writeFeedLines(output, 4);

        return output.toByteArray();
    }

    private byte[] buildRasterTextTestBytes() throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        writeInitialize(output);
        writeAlignCenter(output);
        writeBold(output, true);
        writeTextLine(output, "RASTER TEXT TEST");
        writeBold(output, false);
        writeTextLine(output, "Android bitmap rendering");
        writeFeedLines(output, 1);

        writeAlignLeft(output);
        writeWrappedText(
            output,
            "This test prints Android-rendered text as ESC/POS raster images. It is separate from the live voucher receipt.",
            32
        );
        writeDivider(output);

        writeRasterTextBlock(
            output,
            "Nepali sample\n" +
                "BCH रिचार्ज भौचर\n" +
                "लोड गरिएको मूल्य: GBP 10.00\n" +
                "रिडिम गर्न स्क्यान गर्नुहोस्\n" +
                "यो रसिदलाई नगद जस्तै व्यवहार गर्नुहोस्।",
            28,
            false
        );

        writeDivider(output);

        writeRasterTextBlock(
            output,
            "Hong Kong Cantonese sample\n" +
                "BCH 增值券\n" +
                "已載入價值：GBP 10.00\n" +
                "掃描以兌換\n" +
                "請將此收據當作現金處理。",
            28,
            false
        );

        writeDivider(output);

        writeRasterTextBlock(
            output,
            "Arabic sample\n" +
                "قسيمة شحن BCH\n" +
                "القيمة المحملة: GBP 10.00\n" +
                "امسح للاسترداد\n" +
                "عامل هذا الإيصال مثل النقود.",
            28,
            false
        );

        writeDivider(output);
        writeTextLine(output, "END OF RASTER TEST");
        writeFeedLines(output, 4);

        return output.toByteArray();
    }

    private byte[] buildVoucherReceiptBytes(
        String title,
        String serial,
        String issuedAtLabel,
        String customerPaidLabel,
        String loadedFiatLabel,
        String bchAmountLabel,
        String voucherAddress,
        String qrPayload,
        String redemptionInstruction,
        String cashWarning,
        String supportNote,
        String valueLoadedLabel,
        String scanToRedeemLabel,
        String referenceLabel,
        String issuedLabel,
        String customerPaidFieldLabel,
        String loadedFieldLabel,
        String voucherAddressLabel
    ) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        writeInitialize(output);

        writeRasterTextBlock(
            output,
            buildHeaderText(title, serial),
            30,
            false
        );

        writeDivider(output);

        writeRasterTextBlock(
            output,
            buildValueLoadedText(valueLoadedLabel, loadedFiatLabel, bchAmountLabel),
            32,
            false
        );

        writeDivider(output);

        writeRasterTextBlock(output, scanToRedeemLabel, 28, false);
        writeFeedLines(output, 1);
        writeQrCode(output, qrPayload, 6);
        writeFeedLines(output, 1);

        if (hasText(redemptionInstruction)) {
            writeRasterTextBlock(output, redemptionInstruction, 26, false);
        }

        writeDivider(output);

        writeRasterTextBlock(
            output,
            buildReceiptDetailsText(
                referenceLabel,
                serial,
                issuedLabel,
                issuedAtLabel,
                customerPaidFieldLabel,
                customerPaidLabel,
                loadedFieldLabel,
                loadedFiatLabel,
                voucherAddressLabel,
                voucherAddress
            ),
            25,
            false
        );

        if (hasText(cashWarning)) {
            writeDivider(output);
            writeRasterTextBlock(output, cashWarning, 26, false);
        }

        if (hasText(supportNote)) {
            writeFeedLines(output, 1);
            writeRasterTextBlock(output, supportNote, 25, false);
        }

        writeFeedLines(output, 4);

        return output.toByteArray();
    }

    private String buildHeaderText(String title, String serial) {
        StringBuilder builder = new StringBuilder();
        builder.append("BITCOIN CASH");

        if (hasText(title)) {
            builder.append("\n").append(title);
        }

        if (hasText(serial) && serial.startsWith("TEST")) {
            builder.append("\nTEST RECEIPT - NOT REAL");
        }

        return builder.toString();
    }

    private String buildValueLoadedText(
        String valueLoadedLabel,
        String loadedFiatLabel,
        String bchAmountLabel
    ) {
        StringBuilder builder = new StringBuilder();
        builder.append(valueLoadedLabel);

        if (hasText(loadedFiatLabel)) {
            builder.append("\n").append(loadedFiatLabel);
        }

        if (hasText(bchAmountLabel)) {
            builder.append("\n").append(bchAmountLabel);
        }

        return builder.toString();
    }

    private String buildReceiptDetailsText(
        String referenceLabel,
        String serial,
        String issuedLabel,
        String issuedAtLabel,
        String customerPaidFieldLabel,
        String customerPaidLabel,
        String loadedFieldLabel,
        String loadedFiatLabel,
        String voucherAddressLabel,
        String voucherAddress
    ) {
        StringBuilder builder = new StringBuilder();

        appendLabelValue(builder, referenceLabel, serial);
        appendLabelValue(builder, issuedLabel, issuedAtLabel);
        appendLabelValue(builder, customerPaidFieldLabel, customerPaidLabel);
        appendLabelValue(builder, loadedFieldLabel, loadedFiatLabel);

        if (hasText(voucherAddress)) {
            appendBlankLine(builder);
            builder.append(voucherAddressLabel).append(":\n");
            builder.append(voucherAddress);
        }

        return builder.toString();
    }

    private void appendLabelValue(
        StringBuilder builder,
        String label,
        String value
    ) {
        if (!hasText(label) || !hasText(value)) {
            return;
        }

        if (builder.length() > 0) {
            builder.append("\n");
        }

        builder.append(label).append(": ").append(value);
    }

    private void appendBlankLine(StringBuilder builder) {
        if (builder.length() > 0) {
            builder.append("\n\n");
        }
    }

    private void writeEncodingTestSection(
        ByteArrayOutputStream output,
        String heading,
        int characterCodeTable,
        String charsetName,
        String... lines
    ) throws IOException {
        writeAlignLeft(output);

        if (characterCodeTable >= 0) {
            writeSelectCharacterCodeTable(output, characterCodeTable);
        }

        writeTextLine(output, heading);
        writeTextLine(output, "Java charset: " + charsetName);

        if (!Charset.isSupported(charsetName)) {
            writeTextLine(output, "Android charset unsupported.");
            writeFeedLines(output, 1);
            return;
        }

        Charset charset = Charset.forName(charsetName);

        for (String line : lines) {
            writeTextLine(output, line, charset);
        }

        writeFeedLines(output, 1);
    }

    private void writeSelectCharacterCodeTable(
        ByteArrayOutputStream output,
        int characterCodeTable
    ) {
        output.write(0x1B);
        output.write(0x74);
        output.write(characterCodeTable & 0xFF);
    }

    private void writeChineseCharacterMode(
        ByteArrayOutputStream output,
        boolean enabled
    ) {
        output.write(0x1C);
        output.write(enabled ? 0x26 : 0x2E);
    }

    private void writeRasterTextBlock(
        ByteArrayOutputStream output,
        String text,
        int textSizePx,
        boolean bold
    ) throws IOException {
        Bitmap bitmap = renderTextBlockBitmap(text, 384, textSizePx, bold);

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);
            writeFeedLines(output, 1);
        } finally {
            bitmap.recycle();
        }
    }

    private Bitmap renderTextBlockBitmap(
        String text,
        int widthPx,
        int textSizePx,
        boolean bold
    ) {
        int horizontalPaddingPx = 12;
        int verticalPaddingPx = 10;
        int contentWidthPx = widthPx - (horizontalPaddingPx * 2);

        TextPaint textPaint = new TextPaint(
            Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG
        );
        textPaint.setColor(Color.BLACK);
        textPaint.setTextSize(textSizePx);
        textPaint.setTypeface(
            bold
                ? Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                : Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        );

        StaticLayout layout = new StaticLayout(
            text,
            textPaint,
            contentWidthPx,
            Layout.Alignment.ALIGN_NORMAL,
            1.15f,
            0.0f,
            false
        );

        int heightPx = Math.max(
            1,
            layout.getHeight() + (verticalPaddingPx * 2)
        );

        Bitmap bitmap = Bitmap.createBitmap(
            widthPx,
            heightPx,
            Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);
        canvas.translate(horizontalPaddingPx, verticalPaddingPx);
        layout.draw(canvas);

        return bitmap;
    }

    private void writeRasterBitmap(
        ByteArrayOutputStream output,
        Bitmap bitmap
    ) throws IOException {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        int widthBytes = (width + 7) / 8;

        output.write(0x1D);
        output.write(0x76);
        output.write(0x30);
        output.write(0x00);
        output.write(widthBytes & 0xFF);
        output.write((widthBytes >> 8) & 0xFF);
        output.write(height & 0xFF);
        output.write((height >> 8) & 0xFF);

        for (int y = 0; y < height; y += 1) {
            for (int xByte = 0; xByte < widthBytes; xByte += 1) {
                int value = 0;

                for (int bit = 0; bit < 8; bit += 1) {
                    int x = (xByte * 8) + bit;

                    if (x < width && isDarkPixel(bitmap.getPixel(x, y))) {
                        value |= 0x80 >> bit;
                    }
                }

                output.write(value);
            }
        }
    }

    private boolean isDarkPixel(int pixel) {
        int red = Color.red(pixel);
        int green = Color.green(pixel);
        int blue = Color.blue(pixel);
        int alpha = Color.alpha(pixel);

        if (alpha < 128) {
            return false;
        }

        int luminance = (red * 299 + green * 587 + blue * 114) / 1000;
        return luminance < 180;
    }

    private void writeInitialize(ByteArrayOutputStream output) {
        output.write(0x1B);
        output.write(0x40);
        writeSelectCharacterCodeTable(output, PRINTER_TEXT_CHARACTER_TABLE);
    }

    private void writeAlignLeft(ByteArrayOutputStream output) {
        output.write(0x1B);
        output.write(0x61);
        output.write(0x00);
    }

    private void writeAlignCenter(ByteArrayOutputStream output) {
        output.write(0x1B);
        output.write(0x61);
        output.write(0x01);
    }

    private void writeBold(ByteArrayOutputStream output, boolean enabled) {
        output.write(0x1B);
        output.write(0x45);
        output.write(enabled ? 0x01 : 0x00);
    }

    private void writeTextLine(ByteArrayOutputStream output, String text)
        throws IOException {
        output.write(text.getBytes(PRINTER_TEXT_CHARSET));
        output.write(0x0A);
    }

    private void writeTextLine(
        ByteArrayOutputStream output,
        String text,
        Charset charset
    ) throws IOException {
        output.write(text.getBytes(charset));
        output.write(0x0A);
    }

    private void writeWrappedText(
        ByteArrayOutputStream output,
        String text,
        int maxChars
    ) throws IOException {
        if (text == null || text.length() == 0) {
            writeTextLine(output, "");
            return;
        }

        String remaining = text.trim();

        while (remaining.length() > maxChars) {
            int splitIndex = remaining.lastIndexOf(' ', maxChars);

            if (splitIndex <= 0) {
                splitIndex = maxChars;
            }

            writeTextLine(output, remaining.substring(0, splitIndex).trim());
            remaining = remaining.substring(splitIndex).trim();
        }

        if (remaining.length() > 0) {
            writeTextLine(output, remaining);
        }
    }

    private void writeKeyValueLine(
        ByteArrayOutputStream output,
        String label,
        String value
    ) throws IOException {
        String prefix = label + ": ";
        int maxChars = 32;

        if ((prefix + value).length() <= maxChars) {
            writeTextLine(output, prefix + value);
            return;
        }

        writeTextLine(output, prefix);
        writeWrappedText(output, value, maxChars);
    }

    private void writeDivider(ByteArrayOutputStream output) throws IOException {
        writeFeedLines(output, 1);
        writeTextLine(output, "--------------------------------");
        writeFeedLines(output, 1);
    }

    private void writeFeedLines(ByteArrayOutputStream output, int lines) {
        for (int index = 0; index < lines; index += 1) {
            output.write(0x0A);
        }
    }

    private void writeQrCode(
        ByteArrayOutputStream output,
        String payload,
        int moduleSize
    ) throws IOException {
        byte[] data = payload.getBytes(Charset.forName("US-ASCII"));

        // QR model 2.
        output.write(new byte[] {
            0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00
        });

        // QR module size.
        output.write(new byte[] {
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, (byte) moduleSize
        });

        // QR error correction: M.
        output.write(new byte[] {
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31
        });

        int storeLength = data.length + 3;
        int pL = storeLength & 0xFF;
        int pH = (storeLength >> 8) & 0xFF;

        // Store QR data.
        output.write(0x1D);
        output.write(0x28);
        output.write(0x6B);
        output.write(pL);
        output.write(pH);
        output.write(0x31);
        output.write(0x50);
        output.write(0x30);
        output.write(data);

        // Print QR.
        output.write(new byte[] {
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30
        });
    }

    private String normalisePrinterAddress(String address) {
        if (address == null) {
            return DEFAULT_PRINTER_ADDRESS;
        }

        return address.trim().replace("-", ":").toUpperCase();
    }

    private String getStringWithFallback(
        PluginCall call,
        String key,
        String fallback
    ) {
        String value = call.getString(key);

        if (value == null || value.trim().length() == 0) {
            return fallback;
        }

        return value.trim();
    }

    private String safeString(String value) {
        if (value == null) {
            return "";
        }

        return value.trim();
    }

    private boolean hasText(String value) {
        return value != null && value.trim().length() > 0;
    }

    private String safeDeviceName(BluetoothDevice device) {
        try {
            String name = device.getName();
            return name == null ? "" : name;
        } catch (SecurityException error) {
            return "";
        }
    }

    private String safeDeviceAddress(BluetoothDevice device) {
        try {
            String address = device.getAddress();
            return address == null ? "" : address;
        } catch (SecurityException error) {
            return "";
        }
    }
}