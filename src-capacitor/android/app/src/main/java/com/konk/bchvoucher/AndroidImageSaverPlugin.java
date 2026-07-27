package com.konk.bchvoucher;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.util.Locale;
import java.util.UUID;

@CapacitorPlugin(name = "AndroidImageSaver")
public class AndroidImageSaverPlugin extends Plugin {
    @PluginMethod
    public void savePngImage(PluginCall call) {
        String dataUrl = call.getString("dataUrl", "");
        String requestedFileName = call.getString("fileName", "");
        String albumName = call.getString("albumName", "Bitcoin Cash Topups");

        if (dataUrl == null || dataUrl.trim().isEmpty()) {
            call.reject("Image data is missing.");
            return;
        }

        if (requestedFileName == null || requestedFileName.trim().isEmpty()) {
            call.reject("Image filename is missing.");
            return;
        }

        Uri imageUri = null;

        try {
            String base64Data = dataUrl;

            int commaIndex = dataUrl.indexOf(",");
            if (commaIndex >= 0) {
                base64Data = dataUrl.substring(commaIndex + 1);
            }

            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);

            if (imageBytes.length == 0) {
                call.reject("Decoded image data is empty.");
                return;
            }

            ContentResolver resolver = getContext().getContentResolver();
            long nowMs = System.currentTimeMillis();
            long nowSeconds = nowMs / 1000;

            String safeFileName = buildUniquePngFileName(requestedFileName);

            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, safeFileName);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
            values.put(MediaStore.Images.Media.DATE_ADDED, nowSeconds);
            values.put(MediaStore.Images.Media.DATE_MODIFIED, nowSeconds);
            values.put(MediaStore.Images.Media.DATE_TAKEN, nowMs);
            values.put(
                MediaStore.Images.Media.RELATIVE_PATH,
                Environment.DIRECTORY_PICTURES + "/" + albumName
            );
            values.put(MediaStore.Images.Media.IS_PENDING, 1);

            imageUri = resolver.insert(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                values
            );

            if (imageUri == null) {
                call.reject("Could not create image file.");
                return;
            }

            OutputStream outputStream = resolver.openOutputStream(imageUri);

            if (outputStream == null) {
                cleanupPendingImage(resolver, imageUri);
                call.reject("Could not open image file for writing.");
                return;
            }

            outputStream.write(imageBytes);
            outputStream.flush();
            outputStream.close();

            ContentValues finishedValues = new ContentValues();
            finishedValues.put(MediaStore.Images.Media.IS_PENDING, 0);
            finishedValues.put(MediaStore.Images.Media.DATE_MODIFIED, nowSeconds);
            finishedValues.put(MediaStore.Images.Media.DATE_TAKEN, nowMs);

            resolver.update(imageUri, finishedValues, null, null);
            resolver.notifyChange(imageUri, null);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("fileName", safeFileName);
            result.put("message", "Image saved to Pictures/" + albumName + ".");
            result.put("uri", imageUri.toString());

            call.resolve(result);
        } catch (Exception error) {
            if (imageUri != null) {
                cleanupPendingImage(getContext().getContentResolver(), imageUri);
            }

            call.reject("Could not save image: " + error.getMessage(), error);
        }
    }

    private String buildUniquePngFileName(String requestedFileName) {
        String trimmedName = requestedFileName.trim();

        if (trimmedName.toLowerCase(Locale.ROOT).endsWith(".png")) {
            trimmedName = trimmedName.substring(0, trimmedName.length() - 4);
        }

        String cleanBaseName = trimmedName
            .replaceAll("[^a-zA-Z0-9._-]", "-")
            .replaceAll("-+", "-");

        if (cleanBaseName.isEmpty()) {
            cleanBaseName = "bitcoin-cash-topups-report";
        }

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        return cleanBaseName + "-" + uniqueSuffix + ".png";
    }

    private void cleanupPendingImage(ContentResolver resolver, Uri imageUri) {
        try {
            resolver.delete(imageUri, null, null);
        } catch (Exception ignored) {
            // Best-effort cleanup only.
        }
    }
}
