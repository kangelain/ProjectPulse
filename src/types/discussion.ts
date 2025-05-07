export interface DiscussionComment {
  id: string;
  projectId: string;
  author: string;
  authorAvatar?: string; // URL to avatar image
  timestamp: string; // ISO string
  content: string;
  // replies?: DiscussionComment[]; // For nested replies, future enhancement
}
