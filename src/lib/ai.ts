// AI helper — calls Anthropic via the Next.js API route
// so the API key stays server-side.

async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt }),
  });
  if (!res.ok) throw new Error('AI request failed');
  const data = await res.json();
  return data.result;
}

export async function summarizeNotes(notesText: string): Promise<string> {
  return callAI(
    `Please summarize the following notes clearly and concisely, highlighting key concepts:\n\n${notesText}`,
    'You are a helpful study assistant. Provide well-structured, clear summaries that aid understanding and revision.'
  );
}

export async function generatePracticeQuestions(
  topic: string,
  notesText: string,
  count = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<Array<{ question: string; answer: string }>> {
  const raw = await callAI(
    `Generate ${count} ${difficulty} practice questions for the topic "${topic}" based on these notes:\n\n${notesText}\n\nRespond ONLY with a JSON array like: [{"question":"...","answer":"..."}]`,
    'You are a helpful study assistant. Generate thoughtful, accurate practice questions. Return only valid JSON, no markdown.'
  );
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function explainConcept(concept: string, context?: string): Promise<string> {
  const contextStr = context ? `\nContext from notes: ${context}` : '';
  return callAI(
    `Please explain the concept "${concept}" clearly.${contextStr}`,
    'You are a patient, knowledgeable tutor. Explain concepts clearly with examples where helpful. Use simple language but be accurate.'
  );
}

export async function generateStudyPlan(
  subjects: string[],
  daysAvailable: number,
  hoursPerDay: number
): Promise<string> {
  return callAI(
    `Create a ${daysAvailable}-day study plan for these subjects: ${subjects.join(', ')}. Available time: ${hoursPerDay} hours per day. Format it clearly with daily schedules.`,
    'You are an expert academic coach. Create practical, balanced study plans that optimize retention and avoid burnout.'
  );
}

export async function improveNotes(notesText: string): Promise<string> {
  return callAI(
    `Please improve and expand these notes, adding clarity, structure, and any important missing concepts:\n\n${notesText}`,
    'You are a knowledgeable study assistant. Improve notes by adding structure, clarity, examples, and ensuring accuracy. Keep the student\'s original ideas.'
  );
}
