import type { INestApplication } from '@nestjs/common';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let emailService: EmailService;
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = moduleRef.createNestApplication();

    emailService = moduleRef.get(EmailService);

    await app.init();
  });

  it('should return true when email is sent successfully', async () => {
    vi.spyOn(emailService['resend'].emails, 'send').mockResolvedValueOnce({
      data: { id: 'email-id-123' },
      error: null,
      headers: null,
    });

    const result = await emailService.send(
      'Test Subject',
      '<p>Hello</p>',
      'recipient@example.com'
    );

    expect(result).toBe(true);
  });

  it('should return false when resend returns an error', async () => {
    vi.spyOn(emailService['resend'].emails, 'send').mockResolvedValueOnce({
      data: null,
      error: {
        name: 'validation_error',
        message: 'Invalid email address',
        statusCode: 422,
      },
      headers: null,
    });

    const result = await emailService.send(
      'Test Subject',
      '<p>Hello</p>',
      'invalid-email'
    );

    expect(result).toBe(false);
  });

  it('should call resend with the correct payload', async () => {
    const sendSpy = vi
      .spyOn(emailService['resend'].emails, 'send')
      .mockResolvedValueOnce({
        data: { id: 'email-id-123' },
        error: null,
        headers: null,
      });

    await emailService.send(
      'Order update',
      '<p>Your package arrived</p>',
      'user@example.com'
    );

    expect(sendSpy).toHaveBeenCalledWith({
      from: 'Fast Feet onboarding@resend.dev',
      to: 'user@example.com',
      subject: 'Order update',
      html: expect.stringContaining('<p>Your package arrived</p>'),
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
