/**
 * Minimal SSE parser over fetch's ReadableStream. Not using EventSource
 * because EventSource can't send a POST body, and generation needs one
 * (the prompt).
 */
export async function* readSSE(
  response: Response
): AsyncGenerator<{ event: string; data: unknown }> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      let event = "message";
      let data = "";
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7);
        if (line.startsWith("data: ")) data = line.slice(6);
      }
      if (data) yield { event, data: JSON.parse(data) };
    }
  }
}
