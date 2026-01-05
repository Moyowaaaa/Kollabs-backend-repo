export interface IProjects {
  title: string;
  description: string;
  collaborators: string[];
  status: "draft" | "pending" | "ongoing" | "completed" | "deleted";
  createdAt: Date;
  updatedAt: Date;
  conversationId?: string;
  author: string;
  media?: { url: string; id: string }[]; // Array of {url, publicId} for Cloudinary
}

export interface ICreateProject {
  title: string;
  description: string;
  media?: { url: string; id: string }[];
}
