/**
 * Tests for utility functions
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { cn } from '@/lib/utils'
import { isValidEmail, isValidUrl, isUser, isCampaign } from '@/lib/types'

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle undefined values', () => {
      const result = cn('px-4', undefined, 'bg-blue-500')
      expect(result).toBe('px-4 bg-blue-500')
    })

    it('should handle empty strings', () => {
      const result = cn('', '', '')
      expect(result).toBe('')
    })
  })

  describe('type guards', () => {
    describe('isValidEmail', () => {
      it('should validate correct email addresses', () => {
        expect(isValidEmail('test@example.com')).toBe(true)
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      })

      it('should reject invalid email addresses', () => {
        expect(isValidEmail('invalid-email')).toBe(false)
        expect(isValidEmail('test@')).toBe(false)
        expect(isValidEmail('')).toBe(false)
      })
    })

    describe('isValidUrl', () => {
      it('should validate correct URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true)
        expect(isValidUrl('http://localhost:3000')).toBe(true)
      })

      it('should reject invalid URLs', () => {
        expect(isValidUrl('not-a-url')).toBe(false)
        expect(isValidUrl('')).toBe(false)
      })
    })

    describe('isUser', () => {
      it('should identify valid user objects', () => {
        const validUser = {
          id: '1',
          email: 'test@example.com',
          role: 'user',
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
        expect(isUser(validUser)).toBe(true)
      })

      it('should reject invalid user objects', () => {
        expect(isUser(null)).toBe(false)
        expect(isUser({})).toBe(false)
        expect(isUser({ id: '1' })).toBe(false)
      })
    })

    describe('isCampaign', () => {
      it('should identify valid campaign objects', () => {
        const validCampaign = {
          id: '1',
          userId: 'user-1',
          name: 'Test Campaign',
          type: 'email',
          status: 'active',
          config: {},
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
        expect(isCampaign(validCampaign)).toBe(true)
      })

      it('should reject invalid campaign objects', () => {
        expect(isCampaign(null)).toBe(false)
        expect(isCampaign({})).toBe(false)
        expect(isCampaign({ id: '1' })).toBe(false)
      })
    })
  })
})