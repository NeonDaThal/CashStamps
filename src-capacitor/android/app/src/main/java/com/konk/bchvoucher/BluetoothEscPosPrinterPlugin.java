package com.konk.bchvoucher;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.os.Build;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.util.Base64;

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
import java.io.InputStream;
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

    private static final int RECEIPT_WIDTH_PX = 384;
    private static final int RECEIPT_TEXT_DARK_THRESHOLD = 155;
    private static final String RECEIPT_BRAND_TITLE = "Bitcoin Cash";
    private static final String RECEIPT_WEBSITE = "www.bchtopups.com";

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
        final String printerSubtitle = safeString(call.getString("printerSubtitle", ""));
        final String serial = safeString(call.getString("serial", "UNKNOWN"));
        final String issuedAtLabel = safeString(call.getString("issuedAtLabel", ""));
        final String customerPaidLabel = safeString(call.getString("customerPaidLabel", ""));
        final String loadedFiatLabel = safeString(call.getString("loadedFiatLabel", ""));
        final String bchAmountLabel = safeString(call.getString("bchAmountLabel", ""));
        final String voucherAddress = safeString(call.getString("voucherAddress", ""));
        final String qrPayload = safeString(call.getString("qrPayload", ""));
        final String qrImageDataUrl = safeString(call.getString("qrImageDataUrl", ""));
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
                    printerSubtitle,
                    serial,
                    issuedAtLabel,
                    customerPaidLabel,
                    loadedFiatLabel,
                    bchAmountLabel,
                    voucherAddress,
                    qrPayload,
                    qrImageDataUrl,
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
            "Topup Voucher",
            "TEST-0001",
            "TEST MODE",
            "GBP 11.00",
            "GBP 10.00",
            "0.01234567 BCH",
            "bitcoincash:qptestvoucheraddress000000000000000000000000000",
            "BCH_VOUCHER_TEST_ONLY_REFERENCE_TEST-0001",
            "",
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
        String printerSubtitle,
        String serial,
        String issuedAtLabel,
        String customerPaidLabel,
        String loadedFiatLabel,
        String bchAmountLabel,
        String voucherAddress,
        String qrPayload,
        String qrImageDataUrl,
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

        writeBrandHeaderBlock(output, title, printerSubtitle, serial);
        writeCompactDivider(output);

        writeValueLoadedBlock(
            output,
            valueLoadedLabel,
            loadedFiatLabel,
            bchAmountLabel
        );
        writeCompactDivider(output);

        writeRasterTextBlock(
            output,
            scanToRedeemLabel,
            25,
            false,
            Layout.Alignment.ALIGN_CENTER,
            10,
            0
        );

        writeRasterSpacer(output, 4);

        Bitmap qrBitmap = decodeQrImageDataUrl(qrImageDataUrl);

        if (qrBitmap != null) {
            try {
                writeQrImageBlock(output, qrBitmap);
            } finally {
                qrBitmap.recycle();
            }
        } else {
            writeFeedLines(output, 1);
            writeQrCode(output, qrPayload, 6);
            writeFeedLines(output, 1);
        }

        if (hasText(redemptionInstruction)) {
            writeRasterTextBlock(
                output,
                redemptionInstruction,
                22,
                false,
                Layout.Alignment.ALIGN_CENTER,
                10,
                0
            );
            writeRasterSpacer(output, 4);
        }

        writeCompactDivider(output);

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
            24,
            false,
            Layout.Alignment.ALIGN_NORMAL,
            10,
            0
        );

        writeRasterSpacer(output, 4);

        String bottomWarning = buildBottomWarningText(cashWarning, supportNote);

        if (hasText(bottomWarning)) {
            writeCompactDivider(output);
            writeRasterSpacer(output, 8);
            writeBorderedRasterTextBlock(output, bottomWarning, 21);
        }

        writeRasterTextBlock(
            output,
            RECEIPT_WEBSITE,
            23,
            false,
            Layout.Alignment.ALIGN_CENTER,
            8,
            0
        );

        writeFeedLines(output, 3);

        return output.toByteArray();
    }

    private void writeBrandHeaderBlock(
        ByteArrayOutputStream output,
        String title,
        String printerSubtitle,
        String serial
    ) throws IOException {
        String subtitle = buildTopupVoucherSubtitle(title, printerSubtitle);
        boolean isTestReceipt = hasText(serial) && serial.startsWith("TEST");

        int widthPx = RECEIPT_WIDTH_PX;
        int logoSizePx = 34;
        int iconGapPx = 8;
        int topPaddingPx = 8;
        int titleTextSizePx = 32;
        int subtitleTextSizePx = 23;
        int testTextSizePx = 20;
        int titleLineHeightPx = 42;
        int subtitleLineHeightPx = 31;
        int testLineHeightPx = isTestReceipt ? 26 : 0;
        int bottomPaddingPx = 6;

        int heightPx =
            topPaddingPx +
            titleLineHeightPx +
            subtitleLineHeightPx +
            testLineHeightPx +
            bottomPaddingPx;

        Bitmap bitmap = Bitmap.createBitmap(
            widthPx,
            heightPx,
            Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);

        Paint titlePaint = new Paint(
            Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG
        );
        titlePaint.setColor(Color.BLACK);
        titlePaint.setTextSize(titleTextSizePx);
        titlePaint.setTypeface(getUbuntuTypeface(false));

        float titleTextWidth = titlePaint.measureText(RECEIPT_BRAND_TITLE);
        float titleGroupWidth = logoSizePx + iconGapPx + titleTextWidth;
        float titleStartX = Math.max(0, (widthPx - titleGroupWidth) / 2.0f);

        Paint.FontMetrics titleMetrics = titlePaint.getFontMetrics();
        float titleBaseline =
            topPaddingPx +
            ((titleLineHeightPx - titleMetrics.bottom + titleMetrics.top) / 2.0f)
                - titleMetrics.top;

        int logoTop = Math.max(
            0,
            Math.round(titleBaseline - logoSizePx + 4)
        );

        drawBchLogo(canvas, Math.round(titleStartX), logoTop, logoSizePx);
        canvas.drawText(
            RECEIPT_BRAND_TITLE,
            titleStartX + logoSizePx + iconGapPx,
            titleBaseline,
            titlePaint
        );

        Paint subtitlePaint = new Paint(
            Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG
        );
        subtitlePaint.setColor(Color.BLACK);
        subtitlePaint.setTextSize(subtitleTextSizePx);
        subtitlePaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.NORMAL));
        subtitlePaint.setTextAlign(Paint.Align.CENTER);

        Paint.FontMetrics subtitleMetrics = subtitlePaint.getFontMetrics();
        float subtitleTop = topPaddingPx + titleLineHeightPx;
        float subtitleBaseline =
            subtitleTop +
            ((subtitleLineHeightPx - subtitleMetrics.bottom + subtitleMetrics.top) / 2.0f)
                - subtitleMetrics.top;

        canvas.drawText(subtitle, widthPx / 2.0f, subtitleBaseline, subtitlePaint);

        if (isTestReceipt) {
            Paint testPaint = new Paint(
                Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG
            );
            testPaint.setColor(Color.BLACK);
            testPaint.setTextSize(testTextSizePx);
            testPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.NORMAL));
            testPaint.setTextAlign(Paint.Align.CENTER);

            Paint.FontMetrics testMetrics = testPaint.getFontMetrics();
            float testTop = subtitleTop + subtitleLineHeightPx;
            float testBaseline =
                testTop +
                ((testLineHeightPx - testMetrics.bottom + testMetrics.top) / 2.0f)
                    - testMetrics.top;

            canvas.drawText(
                "TEST RECEIPT - NOT REAL",
                widthPx / 2.0f,
                testBaseline,
                testPaint
            );
        }

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);
        } finally {
            bitmap.recycle();
        }
    }

    private String buildTopupVoucherSubtitle(
        String title,
        String printerSubtitle
    ) {
        if (hasText(printerSubtitle)) {
            return printerSubtitle;
        }

        String rawTitle = safeString(title);

        if (!hasText(rawTitle)) {
            return "Topup Voucher";
        }

        String subtitle = rawTitle
            .replaceAll("(?i)bitcoin\\s*cash", "")
            .replaceAll("(?i)\\bbch\\b", "")
            .trim();

        subtitle = subtitle
            .replaceAll("\\s{2,}", " ")
            .replaceAll("^[-–—:|/]+", "")
            .replaceAll("[-–—:|/]+$", "")
            .trim();

        if (
            !hasText(subtitle)
                || subtitle.equalsIgnoreCase("voucher")
                || rawTitle.equalsIgnoreCase("BCH Voucher")
        ) {
            return "Topup Voucher";
        }

        return subtitle;
    }

    private void writeValueLoadedBlock(
        ByteArrayOutputStream output,
        String valueLoadedLabel,
        String loadedFiatLabel,
        String bchAmountLabel
    ) throws IOException {
        int widthPx = RECEIPT_WIDTH_PX;
        int textSizePx = 25;
        int lineHeightPx = 33;
        int topPaddingPx = 7;
        int bottomPaddingPx = 7;
        int lineCount =
            1 +
            (hasText(loadedFiatLabel) ? 1 : 0) +
            (hasText(bchAmountLabel) ? 1 : 0);

        int heightPx = topPaddingPx + (lineCount * lineHeightPx) + bottomPaddingPx;

        Bitmap bitmap = Bitmap.createBitmap(
            widthPx,
            heightPx,
            Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);

        Paint textPaint = new Paint(
            Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG
        );
        textPaint.setColor(Color.BLACK);
        textPaint.setTextSize(textSizePx);
        textPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.NORMAL));
        textPaint.setTextAlign(Paint.Align.CENTER);

        int currentLine = 0;

        drawCenteredTextLine(
            canvas,
            safeString(valueLoadedLabel),
            textPaint,
            topPaddingPx,
            lineHeightPx,
            currentLine
        );
        currentLine += 1;

        if (hasText(loadedFiatLabel)) {
            drawCenteredTextLine(
                canvas,
                loadedFiatLabel,
                textPaint,
                topPaddingPx,
                lineHeightPx,
                currentLine
            );
            currentLine += 1;
        }

        if (hasText(bchAmountLabel)) {
            drawBchAmountLine(
                canvas,
                bchAmountLabel,
                textPaint,
                topPaddingPx,
                lineHeightPx,
                currentLine
            );
        }

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);
        } finally {
            bitmap.recycle();
        }
    }

    private void drawCenteredTextLine(
        Canvas canvas,
        String text,
        Paint paint,
        int topPaddingPx,
        int lineHeightPx,
        int lineIndex
    ) {
        Paint.FontMetrics metrics = paint.getFontMetrics();
        float lineTop = topPaddingPx + (lineIndex * lineHeightPx);
        float baseline =
            lineTop +
            ((lineHeightPx - metrics.bottom + metrics.top) / 2.0f)
                - metrics.top;

        canvas.drawText(text, RECEIPT_WIDTH_PX / 2.0f, baseline, paint);
    }

    private void drawBchAmountLine(
        Canvas canvas,
        String text,
        Paint paint,
        int topPaddingPx,
        int lineHeightPx,
        int lineIndex
    ) {
        int logoSizePx = 20;
        int iconGapPx = 5;
        float textWidth = paint.measureText(text);
        float groupWidth = logoSizePx + iconGapPx + textWidth;
        float startX = Math.max(0, (RECEIPT_WIDTH_PX - groupWidth) / 2.0f);

        Paint.FontMetrics metrics = paint.getFontMetrics();
        float lineTop = topPaddingPx + (lineIndex * lineHeightPx);
        float baseline =
            lineTop +
            ((lineHeightPx - metrics.bottom + metrics.top) / 2.0f)
                - metrics.top;

        int logoTop = Math.round(baseline - logoSizePx + 3);
        drawBchLogo(canvas, Math.round(startX), logoTop, logoSizePx);

        Paint leftAlignedPaint = new Paint(paint);
        leftAlignedPaint.setTextAlign(Paint.Align.LEFT);
        canvas.drawText(text, startX + logoSizePx + iconGapPx, baseline, leftAlignedPaint);
    }

    private void writeQrImageBlock(
        ByteArrayOutputStream output,
        Bitmap qrBitmap
    ) throws IOException {
        int widthPx = RECEIPT_WIDTH_PX;
        int borderSizePx = 292;
        int qrSizePx = 244;
        int topPaddingPx = 8;
        int bottomPaddingPx = 9;
        int heightPx = borderSizePx + topPaddingPx + bottomPaddingPx;
        int borderLeftPx = (widthPx - borderSizePx) / 2;
        int borderTopPx = topPaddingPx;
        int qrLeftPx = borderLeftPx + ((borderSizePx - qrSizePx) / 2);
        int qrTopPx = borderTopPx + ((borderSizePx - qrSizePx) / 2);

        Bitmap bitmap = Bitmap.createBitmap(
            widthPx,
            heightPx,
            Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);

        Paint imagePaint = new Paint();
        imagePaint.setFilterBitmap(false);
        imagePaint.setDither(false);

        Rect destination = new Rect(
            qrLeftPx,
            qrTopPx,
            qrLeftPx + qrSizePx,
            qrTopPx + qrSizePx
        );
        canvas.drawBitmap(qrBitmap, null, destination, imagePaint);

        Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        borderPaint.setColor(Color.BLACK);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2.0f);

        Rect borderRect = new Rect(
            borderLeftPx,
            borderTopPx,
            borderLeftPx + borderSizePx,
            borderTopPx + borderSizePx
        );
        canvas.drawRect(borderRect, borderPaint);

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);
        } finally {
            bitmap.recycle();
        }
    }

    private Bitmap decodeQrImageDataUrl(String qrImageDataUrl) {
        if (!hasText(qrImageDataUrl)) {
            return null;
        }

        String data = qrImageDataUrl.trim();
        int commaIndex = data.indexOf(',');

        if (commaIndex >= 0 && commaIndex + 1 < data.length()) {
            data = data.substring(commaIndex + 1);
        }

        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void writeBorderedRasterTextBlock(
        ByteArrayOutputStream output,
        String text,
        int textSizePx
    ) throws IOException {
        int widthPx = RECEIPT_WIDTH_PX;
        int outerPaddingPx = 12;
        int borderPaddingPx = 10;
        int contentWidthPx = widthPx - (outerPaddingPx * 2) - (borderPaddingPx * 2);

        TextPaint textPaint = new TextPaint(
            Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG
        );
        textPaint.setColor(Color.BLACK);
        textPaint.setTextSize(textSizePx);
        textPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.NORMAL));

        StaticLayout layout = new StaticLayout(
            text,
            textPaint,
            contentWidthPx,
            Layout.Alignment.ALIGN_CENTER,
            1.12f,
            0.0f,
            false
        );

        int heightPx =
            layout.getHeight() +
            (outerPaddingPx * 2) +
            (borderPaddingPx * 2);

        Bitmap bitmap = Bitmap.createBitmap(
            widthPx,
            heightPx,
            Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);

        Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        borderPaint.setColor(Color.BLACK);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2.0f);

        Rect borderRect = new Rect(
            outerPaddingPx,
            2,
            widthPx - outerPaddingPx,
            heightPx - 3
        );
        canvas.drawRect(borderRect, borderPaint);

        canvas.save();
        canvas.translate(
            outerPaddingPx + borderPaddingPx,
            outerPaddingPx + borderPaddingPx
        );
        layout.draw(canvas);
        canvas.restore();

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);
        } finally {
            bitmap.recycle();
        }
    }

    private String buildBottomWarningText(String cashWarning, String supportNote) {
        String safeCashWarning = safeString(cashWarning);
        String safeSupportNote = safeString(supportNote);

        if (
            safeCashWarning.toLowerCase().contains("anyone with this qr code can sweep")
                || safeSupportNote.toLowerCase().contains("swept into your own wallet")
        ) {
            return "Keep this voucher safe until the BCH has been swept into your wallet. Anyone with this QR code can sweep the funds.";
        }

        StringBuilder builder = new StringBuilder();

        if (hasText(safeSupportNote)) {
            builder.append(safeSupportNote);
        }

        if (hasText(safeCashWarning)) {
            if (builder.length() > 0) {
                builder.append(" ");
            }

            builder.append(safeCashWarning);
        }

        return builder.toString().trim();
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
        writeRasterTextBlock(
            output,
            text,
            textSizePx,
            bold,
            Layout.Alignment.ALIGN_NORMAL,
            10,
            1
        );
    }

    private void writeRasterTextBlock(
        ByteArrayOutputStream output,
        String text,
        int textSizePx,
        boolean bold,
        Layout.Alignment alignment,
        int verticalPaddingPx,
        int feedLinesAfter
    ) throws IOException {
        Bitmap bitmap = renderTextBlockBitmap(
            text,
            RECEIPT_WIDTH_PX,
            textSizePx,
            bold,
            alignment,
            verticalPaddingPx
        );

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);

            if (feedLinesAfter > 0) {
                writeFeedLines(output, feedLinesAfter);
            }
        } finally {
            bitmap.recycle();
        }
    }

    private Bitmap renderTextBlockBitmap(
        String text,
        int widthPx,
        int textSizePx,
        boolean bold,
        Layout.Alignment alignment,
        int verticalPaddingPx
    ) {
        int horizontalPaddingPx = 12;
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
            safeString(text),
            textPaint,
            contentWidthPx,
            alignment,
            1.12f,
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

    private Typeface getUbuntuTypeface(boolean bold) {
        String[] assetPaths = new String[] {
            "fonts/Ubuntu-Bold.ttf",
            "fonts/Ubuntu-Regular.ttf",
            "public/fonts/Ubuntu-Bold.ttf",
            "public/fonts/Ubuntu-Regular.ttf",
            "public/assets/Ubuntu-Bold.ttf",
            "public/assets/Ubuntu-Regular.ttf",
            "assets/Ubuntu-Bold.ttf",
            "assets/Ubuntu-Regular.ttf"
        };

        for (String assetPath : assetPaths) {
            try {
                if (!bold && assetPath.toLowerCase().contains("bold")) {
                    continue;
                }

                if (bold && assetPath.toLowerCase().contains("regular")) {
                    continue;
                }

                return Typeface.createFromAsset(getContext().getAssets(), assetPath);
            } catch (Exception ignored) {
                // Try the next likely asset location.
            }
        }

        return Typeface.create(
            "sans-serif",
            bold ? Typeface.BOLD : Typeface.NORMAL
        );
    }

    private void drawBchLogo(Canvas canvas, int leftPx, int topPx, int sizePx) {
        Bitmap sourceLogo = loadBchLogoBitmap(sizePx);

        if (sourceLogo != null) {
            try {
                Rect destination = new Rect(
                    leftPx,
                    topPx,
                    leftPx + sizePx,
                    topPx + sizePx
                );
                canvas.drawBitmap(sourceLogo, null, destination, null);
                return;
            } finally {
                sourceLogo.recycle();
            }
        }

        Paint circlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        circlePaint.setColor(Color.BLACK);
        circlePaint.setStyle(Paint.Style.FILL);

        float radius = sizePx / 2.0f;
        canvas.drawCircle(leftPx + radius, topPx + radius, radius, circlePaint);

        Paint textPaint = new Paint(
            Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG
        );
        textPaint.setColor(Color.WHITE);
        textPaint.setTextSize(sizePx * 0.68f);
        textPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        textPaint.setTextAlign(Paint.Align.CENTER);

        Paint.FontMetrics metrics = textPaint.getFontMetrics();
        float baseline =
            topPx +
            radius -
            ((metrics.ascent + metrics.descent) / 2.0f);

        canvas.drawText("B", leftPx + radius, baseline, textPaint);
    }

    private Bitmap loadBchLogoBitmap(int sizePx) {
        String[] assetPaths = new String[] {
            "bch-logo.png",
            "assets/bch-logo.png",
            "public/assets/bch-logo.png",
            "public/bch-logo.png",
            "www/assets/bch-logo.png"
        };

        for (String assetPath : assetPaths) {
            try (InputStream inputStream = getContext().getAssets().open(assetPath)) {
                Bitmap decoded = BitmapFactory.decodeStream(inputStream);

                if (decoded == null) {
                    continue;
                }

                return Bitmap.createScaledBitmap(decoded, sizePx, sizePx, true);
            } catch (Exception ignored) {
                // Try the next likely asset location.
            }
        }

        return null;
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
        return luminance < RECEIPT_TEXT_DARK_THRESHOLD;
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

    private void writeCompactDivider(ByteArrayOutputStream output) throws IOException {
        int widthPx = RECEIPT_WIDTH_PX;
        int heightPx = 14;

        Bitmap bitmap = Bitmap.createBitmap(
            widthPx,
            heightPx,
            Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);

        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.BLACK);
        paint.setStrokeWidth(1.6f);

        canvas.drawLine(12, heightPx / 2.0f, widthPx - 12, heightPx / 2.0f, paint);

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);
        } finally {
            bitmap.recycle();
        }
    }

    private void writeRasterSpacer(
        ByteArrayOutputStream output,
        int heightPx
    ) throws IOException {
        if (heightPx <= 0) {
            return;
        }

        Bitmap bitmap = Bitmap.createBitmap(
            RECEIPT_WIDTH_PX,
            heightPx,
            Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.WHITE);

        try {
            writeAlignCenter(output);
            writeRasterBitmap(output, bitmap);
        } finally {
            bitmap.recycle();
        }
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

        // The printer defaults to QR model 2. We intentionally avoid sending
        // the model-selection command here because this JK-5803P-compatible
        // printer can print the command's model byte as a stray "2" above the QR.
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