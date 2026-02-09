import { SKILLS } from '../data/content';
import styles from './Skills.module.css';

function copySkillUrl(id: string, e: MouseEvent) {
  const url = `${window.location.origin}/skills/${id}/SKILL.md`;
  navigator.clipboard.writeText(url);
  const el = e.currentTarget as HTMLAnchorElement;
  el.textContent = 'copied!';
  setTimeout(() => {
    el.textContent = 'copy URL';
  }, 1500);
}

export default function Skills() {
  return (
    <div>
      <h1 class={styles.title}>Skills</h1>
      <p class={styles.subtitle}>
        Each skill follows the <a href="https://agentskills.io/specification" target="_blank" rel="noopener noreferrer">Agent Skills</a> standard.
        Download the SKILL.md and drop it into your project's skill directory
        (<code>.claude/commands/</code>, <code>.github/skills/</code>, <code>.cursor/rules/</code>, etc.).
      </p>
      <ul class={styles.list}>
        {SKILLS.map(s => (
          <li class={styles.row}>
            <span class={styles.name}>{s.name}</span>
            <span class={styles.desc}>{s.description}</span>
            <a href={`/skills/${s.id}/SKILL.md`} class={styles.action} target="_blank" rel="noopener noreferrer">SKILL.md</a>
            <a class={styles.action} onClick={(e) => copySkillUrl(s.id, e)}>copy URL</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
