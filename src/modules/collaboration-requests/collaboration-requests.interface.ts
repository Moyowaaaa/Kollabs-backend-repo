export interface ICollaborationRequest {
  _id: string;
  projectId: string; // Reference to Project
  requesterId: string; // User requesting to join
  proposal: string; // Why they want to collaborate
  media?: { url: string; id: string }[]; // Supporting media (portfolio, etc.)
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
