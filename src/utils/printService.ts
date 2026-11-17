import { CompanyProfile, Product, Purchase, Sale, SystemConfig } from '../types/pos';

export type PrintFormat = SystemConfig['invoice']['format'];
export type SaleDocKind = 'TICKET' | 'BOLETA' | 'FACTURA';

interface SalePrintOptions {
  company?: CompanyProfile;
  invoiceConfig?: SystemConfig['invoice'];
  formatOverride?: PrintFormat;
  docKindOverride?: SaleDocKind;
  titleOverride?: string;
}

interface PurchasePrintOptions {
  company?: CompanyProfile;
  formatOverride?: PrintFormat;
}

const escapeHtml = (value: string | number | undefined | null): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMoney = (amount: number, symbol = 'C$'): string =>
  `${symbol}${Number(amount || 0).toFixed(2)}`;

const resolveCurrency = (company?: CompanyProfile): string => {
  const raw = (company?.currencySymbol || '').trim();
  if (!raw || raw === 'L' || raw === 'L.') return 'C$';
  return raw;
};

const printHtmlInIframe = (fullHtml: string) => {
  const existing = document.getElementById('smartpos-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'smartpos-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(fullHtml);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 1500);
    }
  };

  const imgs = Array.from(doc.images || []);
  if (imgs.length === 0) {
    setTimeout(triggerPrint, 80);
    return;
  }

  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    setTimeout(triggerPrint, 80);
  };

  let remaining = imgs.length;
  imgs.forEach((img) => {
    if (img.complete) {
      remaining -= 1;
      if (remaining <= 0) done();
    } else {
      img.onload = () => {
        remaining -= 1;
        if (remaining <= 0) done();
      };
      img.onerror = () => {
        remaining -= 1;
        if (remaining <= 0) done();
      };
    }
  });
  setTimeout(done, 800);
};

const getPageCss = (format: PrintFormat): { pageRule: string; widthCss: string } => {
  switch (format) {
    case 'TICKET_58MM':
      return {
        pageRule: '@page { size: 58mm auto; margin: 2mm; }',
        widthCss: '54mm',
      };
    case 'TICKET_80MM':
      return {
        pageRule: '@page { size: 80mm auto; margin: 3mm; }',
        widthCss: '74mm',
      };
    case 'MEDIA_CARTA':
      return {
        pageRule: '@page { size: 140mm 216mm; margin: 7mm; }',
        widthCss: '126mm',
      };
    case 'CARTA_A4':
    default:
      return {
        pageRule: '@page { size: letter; margin: 12mm; }',
        widthCss: '186mm',
      };
  }
};

const resolveDocKind = (format: PrintFormat, override?: SaleDocKind): SaleDocKind => {
  if (override) return override;
  if (format === 'TICKET_80MM' || format === 'TICKET_58MM') return 'TICKET';
  if (format === 'MEDIA_CARTA') return 'BOLETA';
  return 'FACTURA';
};

export const buildSaleDocumentHtml = (sale: Sale, options: SalePrintOptions = {}): string => {
  const { company, invoiceConfig, formatOverride, docKindOverride, titleOverride } = options;
  const format: PrintFormat = formatOverride || invoiceConfig?.format || 'TICKET_80MM';
  const docKind = resolveDocKind(format, docKindOverride);
  const { pageRule, widthCss } = getPageCss(format);
  const currency = resolveCurrency(company);
  const companyName = company?.commercialName || company?.name || 'SMART PUNTO DE VENTA';
  const companyLegal = company?.name && company.name !== companyName ? company.name : '';
  const logoSrc = company?.imageUrl || '/logo.png';
  const showLogo = invoiceConfig?.showLogo ?? true;
  const showBarcode = invoiceConfig?.showBarcode ?? true;
  const showTax = invoiceConfig?.showTaxBreakdown ?? true;
  const showSignature = invoiceConfig?.showClientSignature ?? sale.paymentType === 'CREDITO';
  const accentColor = invoiceConfig?.headerColor || '#1e3a5f';
  const prefix = invoiceConfig?.prefix || '';
  const isPreventa = sale.mode === 'PREVENTA' || sale.status === 'PENDIENTE_PREVENTA';
  const fullNumber = `${prefix}${sale.invoiceNumber}`;
  const exento = Math.max(0, Number((sale.total - sale.subtotal - sale.taxTotal).toFixed(2)));

  const docTitle =
    titleOverride ||
    (isPreventa
      ? 'PREVENTA / PROFORMA'
      : docKind === 'TICKET'
      ? 'TICKET DE VENTA'
      : docKind === 'BOLETA'
      ? 'BOLETA DE VENTA'
      : 'FACTURA DE VENTA');

  let bodyHtml = '';

  if (docKind === 'TICKET') {
    const ticketRows = (sale.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">
            <div style="font-weight: 700;">${escapeHtml(item.name)}</div>
            <div style="font-size: 9px; color: #475569;">
              ${item.quantity} x ${formatMoney(item.unitPrice, currency)}
              ${item.discount > 0 ? ` (-${formatMoney(item.discount, currency)})` : ''}
            </div>
          </td>
          <td style="padding: 3px 0; text-align: right; vertical-align: top; font-weight: 700; white-space: nowrap;">
            ${formatMoney(item.total, currency)}
          </td>
        </tr>
      `
      )
      .join('');

    bodyHtml = `
      <style>
        ${pageRule}
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 8px;
          font-family: 'Consolas', 'Courier New', monospace;
          color: #0f172a;
          font-size: ${format === 'TICKET_58MM' ? '10px' : '11px'};
          background: #ffffff;
        }
        .ticket { width: ${widthCss}; margin: 0 auto; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #334155; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
      </style>
      <div class="ticket">
        <div class="center">
          ${showLogo ? `<img src="${escapeHtml(logoSrc)}" alt="Logo" style="max-height: 44px; max-width: 110px; object-fit: contain; margin: 0 auto 4px; display: block;" />` : ''}
          <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.3px;">${escapeHtml(companyName)}</div>
          ${companyLegal ? `<div style="font-size: 9px;">${escapeHtml(companyLegal)}</div>` : ''}
          ${company?.taxId ? `<div style="font-size: 9px;">RUC: ${escapeHtml(company.taxId)}</div>` : ''}
          ${company?.address ? `<div style="font-size: 9px;">${escapeHtml(company.address)}${company?.city ? `, ${escapeHtml(company.city)}` : ''}</div>` : ''}
          ${company?.phone ? `<div style="font-size: 9px;">Tel: ${escapeHtml(company.phone)}</div>` : ''}
        </div>
        <div style="margin: 6px 0; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; padding: 3px 0; text-align: center;">
          <div style="font-weight: 900; font-size: 11px;">${escapeHtml(docTitle)}</div>
          <div style="font-weight: 800; font-size: 11px;">Nº ${escapeHtml(fullNumber)}</div>
        </div>
        <div style="font-size: 10px; line-height: 1.35;">
          <div><strong>Fecha:</strong> ${escapeHtml(sale.date)}</div>
          <div><strong>Cliente:</strong> ${escapeHtml(sale.clientName)}</div>
          <div><strong>Vendedor:</strong> ${escapeHtml(sale.sellerName)}</div>
          <div><strong>Pago:</strong> ${escapeHtml(sale.paymentType)} (${escapeHtml(sale.status)})</div>
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #334155; font-size: 9px;">
              <th style="text-align: left; padding-bottom: 3px;">DESCRIPCIÓN</th>
              <th style="text-align: right; padding-bottom: 3px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>${ticketRows}</tbody>
        </table>
        <div class="divider"></div>
        <table style="font-size: 10px; line-height: 1.4;">
          ${
            showTax
              ? `
            <tr><td>Subtotal Gravado:</td><td style="text-align: right;">${formatMoney(sale.subtotal, currency)}</td></tr>
            ${exento > 0 ? `<tr><td>Exento:</td><td style="text-align: right;">${formatMoney(exento, currency)}</td></tr>` : ''}
            <tr><td>ISV 15%:</td><td style="text-align: right;">${formatMoney(sale.taxTotal, currency)}</td></tr>
          `
              : ''
          }
          ${sale.discountTotal > 0 ? `<tr><td>Descuento:</td><td style="text-align: right;">-${formatMoney(sale.discountTotal, currency)}</td></tr>` : ''}
          <tr style="font-size: 13px; font-weight: 900;">
            <td style="padding-top: 4px;">TOTAL:</td>
            <td style="text-align: right; padding-top: 4px;">${formatMoney(sale.total, currency)}</td>
          </tr>
          ${
            sale.balanceDue > 0
              ? `<tr><td>Saldo Pendiente:</td><td style="text-align: right; font-weight: 700;">${formatMoney(sale.balanceDue, currency)}</td></tr>`
              : ''
          }
        </table>
        ${sale.notes ? `<div style="margin-top: 5px; font-size: 9px;"><strong>Obs:</strong> ${escapeHtml(sale.notes)}</div>` : ''}
        ${
          showSignature
            ? `<div style="margin-top: 22px; border-top: 1px solid #334155; text-align: center; font-size: 9px; padding-top: 3px;">Firma del Cliente</div>`
            : ''
        }
        ${
          showBarcode
            ? `<div class="center" style="margin-top: 8px;">
                <div style="font-family: monospace; letter-spacing: 2px; font-size: 13px; font-weight: 900;">|||| ||| |||| || |||</div>
                <div style="font-size: 8px; color: #475569;">${escapeHtml(fullNumber)}</div>
              </div>`
            : ''
        }
        <div class="divider"></div>
        <div class="center" style="font-size: 9px; line-height: 1.35;">
          ${escapeHtml(invoiceConfig?.footerNotes || '¡Gracias por su compra!')}
        </div>
      </div>
    `;
  } else if (docKind === 'BOLETA') {
    const boletaRows = (sale.items || [])
      .map(
        (item, idx) => `
        <tr style="background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${item.quantity}</td>
          <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 600;">${escapeHtml(item.name)}</div>
            <div style="font-size: 9px; color: #64748b;">Cód: ${escapeHtml(item.code)}</div>
          </td>
          <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(item.unitPrice, currency)}</td>
          <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${formatMoney(item.total, currency)}</td>
        </tr>
      `
      )
      .join('');

    bodyHtml = `
      <style>
        ${pageRule}
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 10px;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #0f172a;
          font-size: 10.5px;
          background: #ffffff;
        }
        .boleta { width: ${widthCss}; margin: 0 auto; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 10px; }
        table { width: 100%; border-collapse: collapse; }
      </style>
      <div class="boleta">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${escapeHtml(accentColor)}; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${showLogo ? `<img src="${escapeHtml(logoSrc)}" alt="Logo" style="height: 40px; width: 40px; object-fit: contain;" />` : ''}
            <div>
              <div style="font-size: 14px; font-weight: 900; color: ${escapeHtml(accentColor)};">${escapeHtml(companyName)}</div>
              <div style="font-size: 9px; color: #475569;">
                ${company?.taxId ? `RUC: ${escapeHtml(company.taxId)} • ` : ''}${escapeHtml(company?.phone || '')}
              </div>
              ${company?.address ? `<div style="font-size: 9px; color: #475569;">${escapeHtml(company.address)}</div>` : ''}
            </div>
          </div>
          <div style="text-align: center; background: ${escapeHtml(accentColor)}; color: #ffffff; padding: 5px 10px; border-radius: 5px;">
            <div style="font-size: 8.5px; font-weight: 700; letter-spacing: 0.6px;">${escapeHtml(docTitle)}</div>
            <div style="font-size: 13px; font-weight: 900;">Nº ${escapeHtml(fullNumber)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 4px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px; margin-bottom: 8px; font-size: 10px;">
          <div><strong>Señor(es):</strong> ${escapeHtml(sale.clientName)}</div>
          <div><strong>Fecha:</strong> ${escapeHtml(sale.date)}</div>
          <div><strong>Pago:</strong> ${escapeHtml(sale.paymentType)}</div>
          <div><strong>Atendió:</strong> ${escapeHtml(sale.sellerName)}</div>
        </div>

        <table style="border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #e2e8f0; color: #0f172a; font-size: 9.5px;">
              <th style="padding: 5px 6px; text-align: center; width: 45px;">CANT.</th>
              <th style="padding: 5px 6px; text-align: left;">DESCRIPCIÓN</th>
              <th style="padding: 5px 6px; text-align: right; width: 75px;">P. UNIT</th>
              <th style="padding: 5px 6px; text-align: right; width: 80px;">IMPORTE</th>
            </tr>
          </thead>
          <tbody>${boletaRows}</tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; gap: 10px;">
          <div style="flex: 1; font-size: 9.5px; color: #475569;">
            ${sale.notes ? `<div style="margin-bottom: 6px;"><strong>Nota:</strong> ${escapeHtml(sale.notes)}</div>` : ''}
            <div>${escapeHtml(invoiceConfig?.footerNotes || '¡Gracias por su compra!')}</div>
            ${
              showSignature
                ? `<div style="margin-top: 22px; width: 160px; border-top: 1px solid #334155; text-align: center; font-size: 9px; padding-top: 2px;">Firma / Recibí Conforme</div>`
                : ''
            }
          </div>
          <table style="width: 190px; border: 1px solid #cbd5e1; font-size: 10px;">
            ${
              showTax
                ? `
              <tr><td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0;">Subtotal</td><td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(sale.subtotal, currency)}</td></tr>
              <tr><td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0;">ISV 15%</td><td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(sale.taxTotal, currency)}</td></tr>
            `
                : ''
            }
            ${sale.discountTotal > 0 ? `<tr><td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0;">Descuento</td><td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">-${formatMoney(sale.discountTotal, currency)}</td></tr>` : ''}
            <tr style="background: ${escapeHtml(accentColor)}; color: #ffffff; font-weight: 900; font-size: 12px;">
              <td style="padding: 5px 6px;">TOTAL</td>
              <td style="padding: 5px 6px; text-align: right;">${formatMoney(sale.total, currency)}</td>
            </tr>
            ${
              sale.balanceDue > 0
                ? `<tr><td style="padding: 3px 6px; color: #b91c1c; font-weight: 700;">Saldo</td><td style="padding: 3px 6px; text-align: right; color: #b91c1c; font-weight: 700;">${formatMoney(sale.balanceDue, currency)}</td></tr>`
                : ''
            }
          </table>
        </div>
      </div>
    `;
  } else {
    const facturaRows = (sale.items || [])
      .map(
        (item, idx) => `
        <tr style="background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${escapeHtml(item.code)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(item.name)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(item.unitPrice, currency)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(item.discount, currency)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${formatMoney(item.total, currency)}</td>
        </tr>
      `
      )
      .join('');

    bodyHtml = `
      <style>
        ${pageRule}
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 12px;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #0f172a;
          font-size: 11px;
          background: #ffffff;
        }
        .sheet { width: ${widthCss}; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; }
      </style>
      <div class="sheet">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${escapeHtml(accentColor)}; padding-bottom: 10px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${showLogo ? `<img src="${escapeHtml(logoSrc)}" alt="Logo" style="height: 56px; width: 56px; object-fit: contain;" />` : ''}
            <div>
              <div style="font-size: 18px; font-weight: 900; color: ${escapeHtml(accentColor)};">${escapeHtml(companyName)}</div>
              ${companyLegal ? `<div style="font-size: 10px; color: #475569;">${escapeHtml(companyLegal)}</div>` : ''}
              <div style="font-size: 10px; color: #475569;">
                ${company?.taxId ? `RUC: ${escapeHtml(company.taxId)} • ` : ''}${escapeHtml(company?.address || '')}${company?.city ? `, ${escapeHtml(company.city)}` : ''}
              </div>
              ${company?.phone || company?.email ? `<div style="font-size: 10px; color: #475569;">${company?.phone ? `Tel: ${escapeHtml(company.phone)}` : ''} ${company?.email ? `• ${escapeHtml(company.email)}` : ''}</div>` : ''}
            </div>
          </div>
          <div style="text-align: right; border: 2px solid ${escapeHtml(accentColor)}; padding: 7px 14px; border-radius: 5px; background: #f8fafc;">
            <div style="font-size: 10px; font-weight: 800; color: #475569; letter-spacing: 0.5px;">${escapeHtml(docTitle)}</div>
            <div style="font-size: 17px; font-weight: 900; color: ${escapeHtml(accentColor)};">Nº ${escapeHtml(fullNumber)}</div>
            <div style="font-size: 10px; color: #475569;">${escapeHtml(sale.date)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 9px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 11px;">
          <div><strong>Cliente:</strong> ${escapeHtml(sale.clientName)}</div>
          <div><strong>Vendedor:</strong> ${escapeHtml(sale.sellerName)}</div>
          <div><strong>Condición de Pago:</strong> ${escapeHtml(sale.paymentType)}</div>
          <div><strong>Estado:</strong> ${escapeHtml(sale.status)}</div>
        </div>

        <table style="border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: ${escapeHtml(accentColor)}; color: #ffffff; font-size: 10px;">
              <th style="padding: 7px 8px; text-align: center; width: 70px;">CÓDIGO</th>
              <th style="padding: 7px 8px; text-align: left;">DESCRIPCIÓN</th>
              <th style="padding: 7px 8px; text-align: center; width: 55px;">CANT.</th>
              <th style="padding: 7px 8px; text-align: right; width: 85px;">P. UNIT</th>
              <th style="padding: 7px 8px; text-align: right; width: 75px;">DESC.</th>
              <th style="padding: 7px 8px; text-align: right; width: 95px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>${facturaRows}</tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px;">
          <div style="max-width: 55%; font-size: 10px; color: #475569;">
            ${sale.notes ? `<div><strong>Observaciones:</strong> ${escapeHtml(sale.notes)}</div>` : ''}
            <div style="margin-top: 8px;">${escapeHtml(invoiceConfig?.footerNotes || '¡Gracias por su preferencia!')}</div>
            <div style="margin-top: 4px; font-size: 9px; color: #64748b;">Original: Cliente • Copia: Contabilidad</div>
          </div>
          <table style="width: 245px; font-size: 11px; border: 1px solid #cbd5e1;">
            ${
              showTax
                ? `
              <tr><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Subtotal Gravado</td><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(sale.subtotal, currency)}</td></tr>
              ${exento > 0 ? `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Exento</td><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(exento, currency)}</td></tr>` : ''}
              <tr><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">ISV 15%</td><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(sale.taxTotal, currency)}</td></tr>
            `
                : ''
            }
            ${sale.discountTotal > 0 ? `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Descuento</td><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">-${formatMoney(sale.discountTotal, currency)}</td></tr>` : ''}
            <tr style="background: #f1f5f9; font-weight: 900; font-size: 13px;">
              <td style="padding: 6px 8px;">TOTAL</td>
              <td style="padding: 6px 8px; text-align: right;">${formatMoney(sale.total, currency)}</td>
            </tr>
            ${
              sale.balanceDue > 0
                ? `<tr><td style="padding: 4px 8px; color: #b91c1c; font-weight: 700;">Saldo Pendiente</td><td style="padding: 4px 8px; text-align: right; color: #b91c1c; font-weight: 700;">${formatMoney(sale.balanceDue, currency)}</td></tr>`
                : ''
            }
          </table>
        </div>

        ${
          showSignature
            ? `<div style="margin-top: 42px; display: flex; justify-content: space-around; font-size: 10px;">
                <div style="width: 200px; border-top: 1px solid #334155; text-align: center; padding-top: 4px;">Firma Autorizada</div>
                <div style="width: 200px; border-top: 1px solid #334155; text-align: center; padding-top: 4px;">Recibí Conforme (Cliente)</div>
              </div>`
            : ''
        }
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(`${docTitle} #${fullNumber}`)}</title>
</head>
<body>${bodyHtml}</body>
</html>`;
};

export const printSaleDocument = (sale: Sale, options: SalePrintOptions = {}) => {
  const fullHtml = buildSaleDocumentHtml(sale, options);
  printHtmlInIframe(fullHtml);
};

export const printPurchaseDocument = (purchase: Purchase, options: PurchasePrintOptions = {}) => {
  const { company, formatOverride = 'CARTA_A4' } = options;
  const { pageRule, widthCss } = getPageCss(formatOverride);
  const currency = resolveCurrency(company);
  const companyName = company?.commercialName || company?.name || 'SMART PUNTO DE VENTA';
  const logoSrc = company?.imageUrl || '/logo.png';

  const rowsHtml = (purchase.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${escapeHtml(it.code)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(it.name)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(it.unitCost, currency)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${formatMoney(it.total, currency)}</td>
      </tr>
    `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(`Compra #${purchase.documentNumber}`)}</title>
</head>
<body>
  <style>
    ${pageRule}
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; font-size: 11px; }
    .sheet { width: ${widthCss}; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
  </style>
  <div class="sheet">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${escapeHtml(logoSrc)}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain;" />
        <div>
          <div style="font-size: 16px; font-weight: 900; color: #1e3a5f;">${escapeHtml(companyName)}</div>
          <div style="font-size: 10px; color: #475569;">COMPROBANTE DE COMPRA / INGRESO DE MERCADERÍA</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 15px; font-weight: 900; color: #1e3a5f;">COMPRA #${escapeHtml(purchase.documentNumber)}</div>
        <div style="font-size: 10px; color: #475569;">Fecha: ${escapeHtml(purchase.date)}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 4px; margin-bottom: 12px;">
      <div><strong>Proveedor:</strong> ${escapeHtml(purchase.supplierName)}</div>
      <div><strong>Factura Proveedor:</strong> ${escapeHtml(purchase.supplierInvoice)}</div>
      <div><strong>Términos:</strong> ${escapeHtml(purchase.paymentType)}</div>
      <div><strong>Estado:</strong> ${escapeHtml(purchase.status)}</div>
    </div>

    <table>
      <thead>
        <tr style="background: #1e3a5f; color: #ffffff; font-size: 10px;">
          <th style="padding: 7px 8px; text-align: center; width: 75px;">CÓDIGO</th>
          <th style="padding: 7px 8px; text-align: left;">PRODUCTO</th>
          <th style="padding: 7px 8px; text-align: center; width: 60px;">CANT.</th>
          <th style="padding: 7px 8px; text-align: right; width: 95px;">COSTO UNIT.</th>
          <th style="padding: 7px 8px; text-align: right; width: 95px;">TOTAL</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
      <table style="width: 240px; border: 1px solid #cbd5e1;">
        <tr><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">Subtotal</td><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(purchase.subtotal, currency)}</td></tr>
        <tr><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">ISV 15%</td><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(purchase.taxTotal, currency)}</td></tr>
        <tr style="background: #f1f5f9; font-weight: 900; font-size: 13px;"><td style="padding: 6px 8px;">TOTAL COMPRA</td><td style="padding: 6px 8px; text-align: right;">${formatMoney(purchase.total, currency)}</td></tr>
        <tr><td style="padding: 4px 8px; color: #b91c1c; font-weight: 700;">Saldo Pendiente</td><td style="padding: 4px 8px; text-align: right; color: #b91c1c; font-weight: 700;">${formatMoney(purchase.balanceDue, currency)}</td></tr>
      </table>
    </div>
  </div>
</body>
</html>`;

  printHtmlInIframe(html);
};

export const printProductLabel = (
  product: Product,
  options: { company?: CompanyProfile; copies?: number } = {}
) => {
  const { company, copies = 1 } = options;
  const currency = resolveCurrency(company);
  const companyName = company?.commercialName || company?.name || 'SMART POS';

  const labelCard = `
    <div style="width: 50mm; height: 28mm; border: 1px dashed #94a3b8; padding: 2.5mm; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; margin-bottom: 3mm;">
      <div style="font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase;">${escapeHtml(companyName)}</div>
      <div style="font-size: 10px; font-weight: 800; line-height: 1.15; max-height: 24px; overflow: hidden;">${escapeHtml(product.name)}</div>
      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-family: 'Consolas', monospace; font-size: 9px;">*${escapeHtml(product.barcode || product.code)}*</div>
        <div style="font-size: 14px; font-weight: 900;">${formatMoney(product.price, currency)}</div>
      </div>
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(`Etiqueta ${product.code}`)}</title>
</head>
<body>
  <style>
    @page { size: 54mm 32mm; margin: 2mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; }
  </style>
  ${Array.from({ length: Math.max(1, copies) }, () => labelCard).join('')}
</body>
</html>`;

  printHtmlInIframe(html);
};
