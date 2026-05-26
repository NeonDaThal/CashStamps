package com.konk.bchvoucher;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.os.Build;

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
    private static final Charset PRINTER_TEXT_CHARSET = Charset.forName("GBK");

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (!ensureBluetoothConnectPermission(call, "getPairedDevicesPermissionCallback")) {
            return;
        }

        doGetPairedDevices(call);
    }

    @PermissionCallback
    private void getPairedDevicesPermissionCallback(PluginCall call) {
        if (!hasBluetoothConnectPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doGetPairedDevices(call);
    }

    @PluginMethod
    public void printTestPage(PluginCall call) {
        if (!ensureBluetoothConnectPermission(call, "printTestPagePermissionCallback")) {
            return;
        }

        doPrintTestPage(call);
    }

    @PermissionCallback
    private void printTestPagePermissionCallback(PluginCall call) {
        if (!hasBluetoothConnectPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintTestPage(call);
    }

    @PluginMethod
    public void printQrTest(PluginCall call) {
        if (!ensureBluetoothConnectPermission(call, "printQrTestPermissionCallback")) {
            return;
        }

        doPrintQrTest(call);
    }

    @PermissionCallback
    private void printQrTestPermissionCallback(PluginCall call) {
        if (!hasBluetoothConnectPermission()) {
            call.reject("Bluetooth permission was not granted.");
            return;
        }

        doPrintQrTest(call);
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

    private boolean ensureBluetoothConnectPermission(
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

    private boolean hasBluetoothConnectPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }

        return getPermissionState(BLUETOOTH_PRINTER_ALIAS) == PermissionState.GRANTED;
    }

    private void sendBytesToPrinter(String address, byte[] bytes) throws IOException {
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
                Thread.sleep(300);
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

        writeQrCode(output, qrPayload);
        writeFeedLines(output, 1);

        writeTextLine(output, "QR payload is test-only.");
        writeTextLine(output, "No voucher key printed.");
        writeFeedLines(output, 3);

        return output.toByteArray();
    }

    private void writeInitialize(ByteArrayOutputStream output) {
        output.write(0x1B);
        output.write(0x40);
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

    private void writeFeedLines(ByteArrayOutputStream output, int lines) {
        for (int index = 0; index < lines; index += 1) {
            output.write(0x0A);
        }
    }

    private void writeQrCode(ByteArrayOutputStream output, String payload)
        throws IOException {
        byte[] data = payload.getBytes(Charset.forName("US-ASCII"));

        // QR model 2.
        output.write(new byte[] {
            0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00
        });

        // QR module size. 6 is deliberately large for an easy first test.
        output.write(new byte[] {
            0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06
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
