export type DocumentType = 'PDF' | 'Word' | 'Excel' | 'PowerPoint' | 'Image' | 'Text' | 'Zip' | 'Other';

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType;
  size: string; // e.g., "1.2MB", "256KB"
  uploadedAt: string; // ISO string
  uploadedBy: string;
  url: string; // Download link (can be a placeholder like '#')
}
