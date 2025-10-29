import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { CredentialService } from '../services/credentials.service.js';
import { z } from 'zod';

const router: Router = Router();
const credService = new CredentialService();

// Validation schemas
const saveCredentialSchema = z.object({
  provider: z.string(),
  accountId: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  accessSecret: z.string().optional(),
  scope: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// List credentials (masked)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const credentials = await credService.getMaskedCredentials(req.user!.id);
    
    const masked = credentials.map(cred => ({
      id: cred.id,
      provider: cred.provider,
      accountId: cred.accountId,
      status: cred.status,
      scope: cred.scope,
      accessToken: cred.accessToken,
      expiresAt: cred.expiresAt,
      lastUsedAt: cred.lastUsedAt,
      createdAt: cred.createdAt,
    }));
    
    res.json({ credentials: masked });
  } catch (error) {
    console.error('List credentials error:', error);
    res.status(500).json({ error: 'Failed to list credentials' });
  }
});

// Get specific credential (masked)
router.get('/:provider', requireAuth, async (req: AuthRequest, res) => {
  try {
    const cred = await credService.getMaskedCredential(req.user!.id, req.params.provider);
    
    if (!cred) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    
    res.json({
      credential: {
        id: cred.id,
        provider: cred.provider,
        accountId: cred.accountId,
        status: cred.status,
        scope: cred.scope,
        accessToken: cred.accessToken,
        expiresAt: cred.expiresAt,
        lastUsedAt: cred.lastUsedAt,
      },
    });
  } catch (error) {
    console.error('Get credential error:', error);
    res.status(500).json({ error: 'Failed to get credential' });
  }
});

// Save/update credential
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = saveCredentialSchema.parse(req.body);
    
    const credential = await credService.saveCredential({
      userId: req.user!.id,
      provider: data.provider,
      accountId: data.accountId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessSecret: data.accessSecret,
      scope: data.scope,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
    
    res.json({
      credential: {
        id: credential.id,
        provider: credential.provider,
        status: credential.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Save credential error:', error);
    res.status(500).json({ error: 'Failed to save credential' });
  }
});

// Revoke credential
router.delete('/:provider', requireAuth, async (req: AuthRequest, res) => {
  try {
    await credService.revokeCredential(req.user!.id, req.params.provider);
    res.json({ success: true });
  } catch (error) {
    console.error('Revoke credential error:', error);
    res.status(500).json({ error: 'Failed to revoke credential' });
  }
});

export default router;