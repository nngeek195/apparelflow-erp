import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface VerificationAlertParams {
  orderNo: string;
  recipeName: string;
  targetQty: number;
  decision: 'APPROVED' | 'REJECTED';
  wastagePct: number;
  wastageCap: number;
  verifierName: string;
  rejectionNote?: string | null;
  toEmail?: string;
}

export async function sendVerificationEmail({
  orderNo,
  recipeName,
  targetQty,
  decision,
  wastagePct,
  wastageCap,
  verifierName,
  rejectionNote,
  toEmail = 'audit@apparelflow.com',
}: VerificationAlertParams) {
  if (!resend) {
    console.warn('[Resend] API key not found. Skipping email dispatch.');
    return { skipped: true };
  }

  const isApproved = decision === 'APPROVED';
  const subject = isApproved
    ? `✅ [ApparelFlow] Order ${orderNo} VERIFIED - Ready for Sewing Line`
    : `🚨 [ApparelFlow] Order ${orderNo} REJECTED - Quality Non-Conformance`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, ${isApproved ? '#059669' : '#dc2626'}, ${isApproved ? '#047857' : '#991b1b'}); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: -0.02em;">ApparelFlow ERP</h1>
        <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">Quality Verification Audit Dispatch</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'};">
          <h2 style="margin: 0 0 8px; font-size: 18px; color: ${isApproved ? '#34d399' : '#f87171'};">
            ${isApproved ? 'Order Verification Approved' : 'Order Verification Rejected'}
          </h2>
          <p style="margin: 0; font-size: 14px; color: #cbd5e1;">
            Order <strong>${orderNo}</strong> has been processed by Quality Verifier <strong>${verifierName}</strong>.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px 0; color: #94a3b8;">Order Number:</td>
            <td style="padding: 10px 0; color: #f8fafc; font-weight: 600; text-align: right;">${orderNo}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px 0; color: #94a3b8;">Apparel Style:</td>
            <td style="padding: 10px 0; color: #f8fafc; font-weight: 600; text-align: right;">${recipeName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px 0; color: #94a3b8;">Target Quantity:</td>
            <td style="padding: 10px 0; color: #f8fafc; font-weight: 600; text-align: right;">${targetQty} pcs</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px 0; color: #94a3b8;">Fabric Wastage:</td>
            <td style="padding: 10px 0; color: ${wastagePct > wastageCap ? '#f87171' : '#34d399'}; font-weight: 600; text-align: right;">
              ${wastagePct.toFixed(2)}% (Cap: ${wastageCap.toFixed(1)}%)
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px 0; color: #94a3b8;">Verification Decision:</td>
            <td style="padding: 10px 0; text-align: right;">
              <span style="background: ${isApproved ? '#065f46' : '#7f1d1d'}; color: ${isApproved ? '#a7f3d0' : '#fecaca'}; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 12px;">
                ${decision}
              </span>
            </td>
          </tr>
        </table>

        ${
          rejectionNote
            ? `<div style="background: #2d1515; border: 1px solid #7f1d1d; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 700; color: #fca5a5; text-transform: uppercase; margin-bottom: 4px;">Rejection Remarks:</div>
                <div style="font-size: 14px; color: #fecaca;">${rejectionNote}</div>
              </div>`
            : ''
        }

        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 24px 0 0;">
          ApparelFlow ERP Automated Dispatch • Cloud SQL PostgreSQL • GCP us-east4
        </p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'ApparelFlow ERP <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      html: htmlContent,
    });
    return { success: true, data };
  } catch (err: any) {
    console.error('[Resend Error]', err);
    return { error: err.message };
  }
}
