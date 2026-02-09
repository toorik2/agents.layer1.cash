import { createResource, Show } from 'solid-js';
import { marked } from 'marked';
import styles from './MarkdownRenderer.module.css';

interface Props {
  file: string;
}

export function MarkdownRenderer(props: Props) {
  const [content] = createResource(
    () => props.file,
    async (file) => {
      const res = await fetch(`/context/${file}.md`);
      if (!res.ok) throw new Error('Not found');
      const md = await res.text();
      return marked.parse(md) as string;
    }
  );

  return (
    <Show when={!content.loading} fallback={<div class={styles.loading}>Loading...</div>}>
      <Show when={!content.error} fallback={<div class={styles.error}>Content not found.</div>}>
        <div class={styles.markdown} innerHTML={content()} />
      </Show>
    </Show>
  );
}
