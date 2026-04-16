import { env } from "@/config/env";
import { convertKeysToCamelCase } from "@/utils/apiClient";

export interface SharedTask {
  id: string;
  title?: string | null;
  text?: string | null;
  status: string;
  dateOption1?: string | null;
  dateOption2?: string | null;
  dueDate?: string | null;
  address?: string | null;
  imageUrl?: string | null;
}

export interface VoteCounts {
  1: number;
  2: number;
  total: number;
}

export interface TaskComment {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${env.API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return convertKeysToCamelCase<T>(data);
}

export const shareService = {
  getSharedTask(token: string): Promise<{ task: SharedTask; votes: VoteCounts }> {
    return request(`/share/${token}`);
  },

  submitVote(
    token: string,
    selectedOption: 1 | 2,
    voterSession: string
  ): Promise<{ success: boolean; votes: VoteCounts }> {
    return request(`/share/${token}/vote`, {
      method: "POST",
      body: JSON.stringify({ selectedOption, voterSession }),
    });
  },

  getComments(token: string): Promise<{ comments: TaskComment[] }> {
    return request(`/share/${token}/comments`);
  },

  postComment(
    token: string,
    voterSession: string,
    comment: string,
    name?: string
  ): Promise<{ comments: TaskComment[] }> {
    return request(`/share/${token}/comments`, {
      method: "POST",
      body: JSON.stringify({ voterSession, comment, name }),
    });
  },
};
