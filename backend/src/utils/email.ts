import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

let transporter: Transporter | null = null;

/**
 * Devuelve un transporter de nodemailer. Si no hay credenciales SMTP configuradas,
 * crea una cuenta de pruebas en Ethereal (los emails no se envían realmente pero
 * se obtiene una URL de previsualización en consola).
 */
async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (env.smtp.host) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
  return transporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
  try {
    const tx = await getTransporter();
    const info = await tx.sendMail({ from: env.smtp.from, to, subject, html });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`📧 Email de prueba enviado: ${preview}`);
  } catch (err) {
    // No interrumpir el flujo de la aplicación si falla el envío.
    console.error('Error enviando email:', (err as Error).message);
  }
}

export function buildDecisionEmail(
  employeeName: string,
  approved: boolean,
  start: string,
  end: string,
  comment?: string | null,
): string {
  const color = approved ? '#10b981' : '#ef4444';
  const status = approved ? 'APROBADA' : 'RECHAZADA';
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto">
    <h2 style="color:${color}">Tu solicitud de vacaciones ha sido ${status}</h2>
    <p>Hola ${employeeName},</p>
    <p>Tu solicitud de vacaciones del <strong>${start}</strong> al <strong>${end}</strong>
       ha sido <strong style="color:${color}">${status.toLowerCase()}</strong>.</p>
    ${comment ? `<p><em>Comentario del administrador:</em> ${comment}</p>` : ''}
    <hr style="border:none;border-top:1px solid #e5e7eb"/>
    <p style="color:#6b7280;font-size:12px">Canal Directo — Vacaciones</p>
  </div>`;
}

export function buildRequestNotificationEmail(
  employeeName: string,
  departmentName: string,
  start: string,
  end: string,
  days: number,
  year: number,
  frontendUrl: string,
  reason?: string | null,
): string {
  const approvalLink = `${frontendUrl}/vacations/approvals`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto">
    <h2 style="color:#2563eb">Nueva solicitud de vacaciones recibida</h2>
    <p>Hola,</p>
    <p>El empleado <strong>${employeeName}</strong> del sector <strong>${departmentName}</strong> ha registrado una nueva solicitud de vacaciones.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr>
        <td style="padding:8px 0;color:#6b7280;width:150px">Desde:</td>
        <td style="padding:8px 0;font-weight:600">${start}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6b7280">Hasta:</td>
        <td style="padding:8px 0;font-weight:600">${end}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6b7280">Días solicitados:</td>
        <td style="padding:8px 0;font-weight:600">${days}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#6b7280">Año correspondiente:</td>
        <td style="padding:8px 0;font-weight:600">${year}</td>
      </tr>
      ${reason ? `
      <tr>
        <td style="padding:8px 0;color:#6b7280;vertical-align:top">Motivo:</td>
        <td style="padding:8px 0;font-style:italic">${reason}</td>
      </tr>
      ` : ''}
    </table>
    <div style="margin:24px 0">
      <a href="${approvalLink}" style="background-color:#2563eb;color:#ffffff;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:500;display:inline-block">Revisar solicitud en el sistema</a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb"/>
    <p style="color:#6b7280;font-size:12px">Canal Directo — Vacaciones</p>
  </div>`;
}
