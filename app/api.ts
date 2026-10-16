import type { MarkResult, Sample } from "../core/types.ts";

export interface TaskInfo {
  id: string;
  label: string;
  minWords: number;
  needsImage: boolean;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? res.statusText);
  return json as T;
}

export const api = {
  tasks: () => get<TaskInfo[]>("/api/tasks"),
  samples: (task: string) => get<Sample[]>(`/api/samples?task=${encodeURIComponent(task)}`),
  example: (task: string) =>
    get<{ sampleId: string; result: MarkResult } | { error: string }>(`/api/example?task=${encodeURIComponent(task)}`),
  imageUrl: (task: string, file: string) =>
    `/api/sample-image?task=${encodeURIComponent(task)}&file=${encodeURIComponent(file)}`,
  async mark(body: {
    taskId: string;
    question: string;
    essay: string;
    data?: string;
    imageBase64?: string;
    sampleId?: string;
  }): Promise<MarkResult> {
    const res = await fetch("/api/mark", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? res.statusText);
    return json as MarkResult;
  },
};
