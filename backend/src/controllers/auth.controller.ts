import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { addHours } from 'date-fns';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendMail } from '../utils/email';
import { recordAudit } from '../services/audit.service';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const passwordStrengthSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

export const directResetSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordStrengthSchema,
});

function publicUser(user: {
  id: string;
  email: string;
  role: string;
  employeeId: string | null;
  managedDepartmentId: string | null;
  employee?: { firstName: string; lastName: string; position: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    managedDepartmentId: user.managedDepartmentId,
    name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'Administrador',
    position: user.employee?.position ?? null,
  };
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await prisma.user.findUnique({ where: { email }, include: { employee: true } });
  if (!user || !(await comparePassword(password, user.password))) {
    throw ApiError.unauthorized('Credenciales inválidas');
  }

  const payload = { sub: user.id, role: user.role, employeeId: user.employeeId, managedDepartmentId: user.managedDepartmentId };
  await recordAudit({ action: 'LOGIN', entity: 'User', entityId: user.id, userId: user.id, metadata: { email: user.email } });

  res.json({
    user: publicUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Refresh token inválido o expirado');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized();

  const newPayload = { sub: user.id, role: user.role, employeeId: user.employeeId, managedDepartmentId: user.managedDepartmentId };
  res.json({
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    include: { employee: true },
    // managedDepartmentId is a scalar field, always included
  });
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  res.json({ user: publicUser(user) });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as z.infer<typeof forgotSchema>;
  const user = await prisma.user.findUnique({ where: { email } });

  // Respuesta genérica para no revelar si el email existe.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetExpires: addHours(new Date(), 1) },
    });
    const link = `${env.frontendUrl}/reset-password?token=${token}`;
    await sendMail({
      to: email,
      subject: 'Recuperación de contraseña — Canal Directo',
      html: `<p>Has solicitado restablecer tu contraseña.</p>
             <p><a href="${link}">Haz clic aquí para crear una nueva contraseña</a> (válido 1 hora).</p>`,
    });
  }
  res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer la contraseña.' });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body as z.infer<typeof resetSchema>;
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetExpires: { gt: new Date() } },
  });
  if (!user) throw ApiError.badRequest('Token inválido o expirado');

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(password), resetToken: null, resetExpires: null },
  });
  await recordAudit({ action: 'RESET_PASSWORD', entity: 'User', entityId: user.id, userId: user.id, metadata: { email: user.email } });
  res.json({ message: 'Contraseña actualizada correctamente.' });
}

export async function directReset(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof directResetSchema>;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.notFound('No existe ningún usuario con ese email');

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(password), resetToken: null, resetExpires: null },
  });
  await recordAudit({
    action: 'RESET_PASSWORD',
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    metadata: { email: user.email, method: 'direct-modal' },
  });
  res.json({ message: 'Contraseña actualizada correctamente.' });
}
