import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as documentsService from '../../services/documents.service';

jest.mock('../../services/documents.service');

describe('Documents Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDocument', () => {
    it('should create a document successfully', async () => {
      const mockDocument = {
        id: 'doc_123',
        title: 'Test Document',
        content: 'Test content',
        type: 'general',
        status: 'draft',
        version: 1,
        ownerId: 'user_123',
        owner: {
          id: 'user_123',
          name: 'Test User',
          email: 'test@example.com',
        },
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      };

      (documentsService.createDocument as jest.MockedFunction<typeof documentsService.createDocument>)
        .mockResolvedValue(mockDocument as any);

      const result = await documentsService.createDocument('user_123', {
        title: 'Test Document',
        content: 'Test content',
      });

      expect(result).toEqual(mockDocument);
      expect(documentsService.createDocument).toHaveBeenCalledWith('user_123', {
        title: 'Test Document',
        content: 'Test content',
      });
    });

    it('should handle errors when creating document', async () => {
      (documentsService.createDocument as jest.MockedFunction<typeof documentsService.createDocument>)
        .mockRejectedValue(new Error('Database error'));

      await expect(
        documentsService.createDocument('user_123', {
          title: 'Test',
          content: 'Content',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getDocuments', () => {
    it('should fetch documents for a user', async () => {
      const mockDocuments = [
        {
          id: 'doc_1',
          title: 'Document 1',
          content: 'Content 1',
          type: 'general',
          status: 'draft',
          version: 1,
          ownerId: 'user_123',
          owner: {
            id: 'user_123',
            name: 'Test User',
            email: 'test@example.com',
          },
          tags: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
        },
      ];

      (documentsService.getDocuments as jest.MockedFunction<typeof documentsService.getDocuments>)
        .mockResolvedValue(mockDocuments as any);

      const result = await documentsService.getDocuments('user_123');

      expect(result).toEqual(mockDocuments);
      expect(result).toHaveLength(1);
    });

    it('should filter documents by status', async () => {
      const mockDocuments = [
        {
          id: 'doc_1',
          title: 'Published Doc',
          status: 'approved',
        },
      ];

      (documentsService.getDocuments as jest.MockedFunction<typeof documentsService.getDocuments>)
        .mockResolvedValue(mockDocuments as any);

      const result = await documentsService.getDocuments('user_123', { status: 'approved' });

      expect(result).toEqual(mockDocuments);
      expect(documentsService.getDocuments).toHaveBeenCalledWith('user_123', { status: 'approved' });
    });
  });

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      const mockUpdated = {
        id: 'doc_123',
        title: 'Updated Title',
        content: 'Updated content',
        type: 'general',
        status: 'review',
        version: 1,
        ownerId: 'user_123',
        owner: {
          id: 'user_123',
          name: 'Test User',
          email: 'test@example.com',
        },
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      };

      (documentsService.updateDocument as jest.MockedFunction<typeof documentsService.updateDocument>)
        .mockResolvedValue(mockUpdated as any);

      const result = await documentsService.updateDocument('doc_123', 'user_123', {
        title: 'Updated Title',
        status: 'review',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('review');
    });

    it('should throw error for non-existent document', async () => {
      (documentsService.updateDocument as jest.MockedFunction<typeof documentsService.updateDocument>)
        .mockRejectedValue(new Error('Document not found'));

      await expect(
        documentsService.updateDocument('doc_999', 'user_123', { title: 'Test' })
      ).rejects.toThrow('Document not found');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      (documentsService.deleteDocument as jest.MockedFunction<typeof documentsService.deleteDocument>)
        .mockResolvedValue({ success: true });

      const result = await documentsService.deleteDocument('doc_123', 'user_123');

      expect(result).toEqual({ success: true });
    });

    it('should throw error when document not found', async () => {
      (documentsService.deleteDocument as jest.MockedFunction<typeof documentsService.deleteDocument>)
        .mockRejectedValue(new Error('Document not found'));

      await expect(
        documentsService.deleteDocument('doc_999', 'user_123')
      ).rejects.toThrow('Document not found');
    });
  });

  describe('createDocumentVersion', () => {
    it('should create a new version of document', async () => {
      const mockNewVersion = {
        id: 'doc_124',
        title: 'Test Document (v2)',
        content: 'Test content',
        type: 'general',
        status: 'draft',
        version: 2,
        ownerId: 'user_123',
        owner: {
          id: 'user_123',
          name: 'Test User',
          email: 'test@example.com',
        },
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: 'doc_123',
      };

      (documentsService.createDocumentVersion as jest.MockedFunction<typeof documentsService.createDocumentVersion>)
        .mockResolvedValue(mockNewVersion as any);

      const result = await documentsService.createDocumentVersion('doc_123', 'user_123');

      expect(result.version).toBe(2);
      expect(result.parentId).toBe('doc_123');
      expect(result.status).toBe('draft');
    });
  });
});
