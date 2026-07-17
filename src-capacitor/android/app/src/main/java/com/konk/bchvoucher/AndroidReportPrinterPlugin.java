package com.konk.bchvoucher;

import android.content.Context;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AndroidReportPrinter")
public class AndroidReportPrinterPlugin extends Plugin {
    private WebView printWebView;

    @PluginMethod
    public void printHtml(PluginCall call) {
        final String html = call.getString("html", "");
        final String jobName = call.getString(
            "jobName",
            "Bitcoin Cash Topups Merchant Report"
        );

        if (html == null || html.trim().length() == 0) {
            call.reject("Report HTML is missing.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                printWebView = new WebView(getContext());
                printWebView.getSettings().setJavaScriptEnabled(false);

                printWebView.setWebViewClient(new WebViewClient() {
                    private boolean hasStartedPrint = false;

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (hasStartedPrint) {
                            return;
                        }

                        hasStartedPrint = true;
                        createPrintJob(view, jobName, call);
                    }
                });

                printWebView.loadDataWithBaseURL(
                    "https://bchtopups.local/",
                    html,
                    "text/html",
                    "UTF-8",
                    null
                );
            } catch (Exception error) {
                call.reject("Could not prepare Android report print: " + error.getMessage());
            }
        });
    }

    private void createPrintJob(WebView webView, String jobName, PluginCall call) {
        try {
            PrintManager printManager =
                (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);

            if (printManager == null) {
                call.reject("Android print service is not available on this device.");
                return;
            }

            PrintDocumentAdapter printAdapter;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                printAdapter = webView.createPrintDocumentAdapter(jobName);
            } else {
                printAdapter = webView.createPrintDocumentAdapter();
            }

            PrintAttributes printAttributes = new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build();

            printManager.print(jobName, printAdapter, printAttributes);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("jobName", jobName);
            result.put("message", "Android print dialog opened.");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not open Android print dialog: " + error.getMessage());
        }
    }
}
