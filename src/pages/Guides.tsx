import { A } from '@solidjs/router';
import { GUIDES } from '../data/content';
import styles from './Guides.module.css';

export default function Guides() {
  return (
    <div>
      <h1 class={styles.title}>Context Guides</h1>
      <p class={styles.subtitle}>
        Each guide is self-contained with real code examples. Available as raw markdown at <code>/context/[name].md</code>.
      </p>
      <ul class={styles.list}>
        {GUIDES.map(g => (
          <li class={styles.row}>
            <span class={styles.name}>{g.title}</span>
            <span class={styles.desc}>{g.description}</span>
            <A href={`/guides/${g.slug}`} class={styles.action}>view</A>
            <a href={g.contextUrl} class={styles.action} target="_blank" rel="noopener noreferrer">raw .md</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
