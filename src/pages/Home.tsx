import { A } from '@solidjs/router';
import { GUIDES, SKILLS } from '../data/content';
import styles from './Home.module.css';

function copySkillUrl(id: string, e: MouseEvent) {
  const url = `${window.location.origin}/skills/${id}/SKILL.md`;
  navigator.clipboard.writeText(url);
  const el = e.currentTarget as HTMLAnchorElement;
  el.textContent = 'copied!';
  setTimeout(() => {
    el.textContent = 'copy URL';
  }, 1500);
}

export default function Home() {
  return (
    <div class={styles.home}>
      <header class={styles.header}>
        <h1 class={styles.title}>Bitcoin Cash (BCH) for AI Agents</h1>
        <p class={styles.subtitle}>
          Downloadable skills and context files for Bitcoin Cash payments.{' '}
          <A href="/why-bch" class={styles.whyLink}>Why BCH?</A>
        </p>
      </header>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Endpoints</h2>
        <div class={styles.endpointBlock}>
          <a href="/llms.txt" class={styles.endpointLine} target="_blank" rel="noopener noreferrer">/llms.txt</a>
          <a href="/api/context" class={styles.endpointLine} target="_blank" rel="noopener noreferrer">/api/context</a>
          <a href="/api/skills" class={styles.endpointLine} target="_blank" rel="noopener noreferrer">/api/skills</a>
        </div>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Skills</h2>
        <p class={styles.sectionDesc}>
          Installable BCH capabilities following the <a href="https://agentskills.io/specification" target="_blank" rel="noopener noreferrer">Agent Skills</a> standard.
        </p>
        <ul class={styles.skillList}>
          {SKILLS.map(s => (
            <li class={styles.skillRow}>
              <span class={styles.skillName}>{s.name}</span>
              <span class={styles.skillDesc}>{s.description}</span>
              <a href={`/skills/${s.id}/SKILL.md`} class={styles.skillAction} target="_blank" rel="noopener noreferrer">SKILL.md</a>
              <a class={styles.skillAction} onClick={(e) => copySkillUrl(s.id, e)}>copy URL</a>
            </li>
          ))}
        </ul>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Context Guides</h2>
        <p class={styles.sectionDesc}>
          Available as raw markdown at <code>/context/[name].md</code>.
        </p>
        <ul class={styles.guideList}>
          {GUIDES.map(g => (
            <li class={styles.guideRow}>
              <span class={styles.guideTitle}>{g.title}</span>
              <span class={styles.guideDesc}>{g.description}</span>
              <A href={`/guides/${g.slug}`} class={styles.guideMd}>view</A>
              <a href={g.contextUrl} class={styles.guideMd} target="_blank" rel="noopener noreferrer">raw .md</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
