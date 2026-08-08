package com.konk.bchvoucher;

import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;
import java.util.UUID;

@CapacitorPlugin(name = "AndroidReportSharer")
public class AndroidReportSharerPlugin extends Plugin {
    @PluginMethod
    public void sharePngReport(PluginCall call) {
        String dataUrl = call.getString("dataUrl", "");
        String requestedFileName = call.getString("fileName", "");
        String title = call.getString("title", "Share report");
        String text = call.getString("text", "");

        if (dataUrl == null || dataUrl.trim().isEmpty()) {
            call.reject("Image data is missing.");
            return;
        }

        if (requestedFileName == null || requestedFileName.trim().isEmpty()) {
            call.reject("Image filename is missing.");
            return;
        }

        if (getActivity() == null) {
            call.reject("Android activity is not available.");
            return;
        }

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

            File shareDirectory = new File(getContext().getCacheDir(), "shared-reports");

            if (!shareDirectory.exists() && !shareDirectory.mkdirs()) {
                call.reject("Could not create share directory.");
                return;
            }

            String safeFileName = buildUniquePngFileName(requestedFileName);
            File imageFile = new File(shareDirectory, safeFileName);

            FileOutputStream outputStream = new FileOutputStream(imageFile);
            outputStream.write(imageBytes);
            outputStream.flush();
            outputStream.close();

            Uri contentUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                imageFile
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("image/png");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            shareIntent.putExtra(Intent.EXTRA_TEXT, text);
            shareIntent.setClipData(
                ClipData.newUri(getContext().getContentResolver(), title, contentUri)
            );
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooserIntent = Intent.createChooser(shareIntent, title);
            chooserIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            getActivity().startActivity(chooserIntent);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("fileName", safeFileName);
            result.put("message", "Android share sheet opened.");

            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not share report: " + error.getMessage(), error);
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

        return cleanBaseName + "-share-" + uniqueSuffix + ".png";
    }
}
