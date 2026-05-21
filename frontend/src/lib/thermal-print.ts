import { buildThermalReceiptLines } from './thermal-receipt-format';
import type { ThermalReceiptPayload } from './thermal-receipt-types';

function thermalPrintCss(pageSize: '58mm' | '80mm'): string {
  const width = pageSize === '58mm' ? '58mm' : '80mm';
  return `
    @page { size: ${width} auto; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 4px;
      width: ${width};
      max-width: ${width};
      font-family: "Courier New", Courier, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font: inherit;
    }
    @media print {
      html, body { margin: 0; padding: 0; }
    }
  `;
}

function buildPrintHtml(data: ThermalReceiptPayload): string {
  const pageSize =
    data.template.pageSize === '58mm' || data.template.pageSize === '80mm'
      ? data.template.pageSize
      : '80mm';
  const lines = buildThermalReceiptLines({ ...data, template: { ...data.template, pageSize } });
  const escaped = lines
    .map((l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;'))
    .join('\n');

  const hint = data.template.printerHint.trim()
    ? `<p style="font-size:10px;margin-top:8px;font-family:monospace">Impresora: ${data.template.printerHint.replace(/</g, '')}</p>`
    : '';

  const safeTitle = data.receipt.fullNumber.replace(/[^\w.-]+/g, '_');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ticket ${safeTitle}</title>
  <style>${thermalPrintCss(pageSize)}</style>
</head>
<body>
  <pre>${escaped || '(Sin contenido)'}</pre>
  ${hint}
  <script>
    (function () {
      function doPrint() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error(e);
        }
      }
      if (document.readyState === 'complete') {
        setTimeout(doPrint, 300);
      } else {
        window.addEventListener('load', function () {
          setTimeout(doPrint, 300);
        });
      }
    })();
  </script>
</body>
</html>`;
}

function printViaHiddenIframe(html: string): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Impresión ticket');
  iframe.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!doc) {
    iframe.remove();
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  win?.focus();
  win?.print();
  setTimeout(() => iframe.remove(), 2000);
  return true;
}

/** Abre diálogo de impresión del sistema (impresora térmica 58/80 mm). */
export function printThermalReceipt(data: ThermalReceiptPayload): void {
  const html = buildPrintHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Sin "noopener": si no, Chrome abre about:blank pero no deja escribir el documento.
  const w = window.open(url, '_blank');
  if (w) {
    w.addEventListener(
      'load',
      () => {
        URL.revokeObjectURL(url);
      },
      { once: true },
    );
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return;
  }

  URL.revokeObjectURL(url);
  if (printViaHiddenIframe(html)) {
    return;
  }

  alert(
    'No se pudo abrir la ventana de impresión. Permita ventanas emergentes para este sitio o use el botón Imprimir del navegador (Ctrl+P) en la vista previa.',
  );
}

export { buildThermalReceiptLines };
