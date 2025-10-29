import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { SettingsService } from '../services/settings.service.js';
import { z } from 'zod';

const router: Router = Router();
const settingsService = new SettingsService();

// Validation
const updateSettingsSchema = z.object({
  brandVoice: z.record(z.any()).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  notificationFrequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  dateFormat: z.string().optional(),
  dataRetention: z.number().min(1).max(365).optional(),
  allowAnalytics: z.boolean().optional(),
  allowPersonalization: z.boolean().optional(),
  apiRateLimit: z.number().min(10).max(10000).optional(),
  webhookUrl: z.string().url().optional().nullable(),
  webhookSecret: z.string().optional().nullable(),
});

// Get settings
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const settings = await settingsService.getSettings(req.user!.id);
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = updateSettingsSchema.parse(req.body);
    const settings = await settingsService.updateSettings(req.user!.id, data);
    res.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Specific setting updates
router.put('/brand-voice', requireAuth, async (req: AuthRequest, res) => {
  try {
    const settings = await settingsService.updateSettings(req.user!.id, {
      brandVoice: req.body,
    });
    res.json({ brandVoice: settings.brandVoice });
  } catch (error) {
    console.error('Update brand voice error:', error);
    res.status(500).json({ error: 'Failed to update brand voice' });
  }
});

router.put('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      notificationFrequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
    }).parse(req.body);
    
    const settings = await settingsService.updateSettings(req.user!.id, data);
    res.json({
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      notificationFrequency: settings.notificationFrequency,
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

router.put('/privacy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = z.object({
      dataRetention: z.number().min(1).max(365).optional(),
      allowAnalytics: z.boolean().optional(),
      allowPersonalization: z.boolean().optional(),
    }).parse(req.body);
    
    const settings = await settingsService.updateSettings(req.user!.id, data);
    res.json({
      dataRetention: settings.dataRetention,
      allowAnalytics: settings.allowAnalytics,
      allowPersonalization: settings.allowPersonalization,
    });
  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

export default router;