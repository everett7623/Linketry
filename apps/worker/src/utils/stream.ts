/** Encode one chunk per consumer pull; cancellation stops the producer. */
export function streamText(chunks: AsyncIterable<string>): ReadableStream<Uint8Array> {
  const iterator = chunks[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await iterator.next();
        if (cancelled) return;
        if (chunk.done) controller.close();
        else controller.enqueue(encoder.encode(chunk.value));
      } catch (error) {
        if (!cancelled) controller.error(error);
      }
    },
    async cancel() {
      cancelled = true;
      await iterator.return?.();
    },
  }, { highWaterMark: 0 });
}
