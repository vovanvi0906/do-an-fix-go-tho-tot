import { RegistrationProofService } from './registration-proof.service';

describe('Registration conflict mapping', () => {
  it.each([['email', 'REGISTRATION_EMAIL_CONFLICT'], ['phone', 'REGISTRATION_PHONE_CONFLICT']])('maps unique %s without returning account data', async (field, code) => {
    const prisma = { $transaction: jest.fn().mockRejectedValue({ code: 'P2002', meta: { target: [field] } }) };
    const service = new RegistrationProofService(prisma, { normalizePhone: phone => phone });
    await expect(service.createCustomer({ phone: '0912345678' }, 'a'.repeat(64)))
      .rejects.toMatchObject({ status: 409, response: { code } });
  });
  it('rejects malformed proofs before a transaction', async () => {
    const prisma = { $transaction: jest.fn() };
    const service = new RegistrationProofService(prisma, {});
    await expect(service.createCustomer({}, 'invalid')).rejects.toMatchObject({ status: 400, response: { code: 'REGISTRATION_PROOF_INVALID' } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
