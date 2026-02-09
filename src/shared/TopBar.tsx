import { createSignal, Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import styles from './TopBar.module.css';

export function TopBar() {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const location = useLocation();

  const toggleMenu = () => setMenuOpen(!menuOpen());
  const closeMenu = () => setMenuOpen(false);

  const isActive = (path: string) => {
    if (path === '/why-bch') return location.pathname === '/why-bch';
    if (path === '/guides') return location.pathname.startsWith('/guides');
    if (path === '/skills') return location.pathname === '/skills';
    return false;
  };

  return (
    <nav class={styles.topBar}>
      <A href="/" class={styles.brand}>
        agents.layer1.cash
      </A>

      {/* Right section */}
      <div class={styles.rightSection}>
        {/* Desktop inline nav */}
        <div class={styles.desktopNav}>
          <A href="/why-bch" class={`${styles.navLink} ${isActive('/why-bch') ? styles.navLinkActive : ''}`}>Why BCH</A>
          <A href="/skills" class={`${styles.navLink} ${isActive('/skills') ? styles.navLinkActive : ''}`}>Skills</A>
          <A href="/guides" class={`${styles.navLink} ${isActive('/guides') ? styles.navLinkActive : ''}`}>Guides</A>
        </div>

        <a href="https://github.com/toorik2/agents.layer1.cash" target="_blank" rel="noopener noreferrer" class={styles.githubLink} aria-label="GitHub">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>

        {/* Mobile hamburger */}
        <button class={styles.menuButton} onClick={toggleMenu} aria-label="Menu">
        <div class={`${styles.hamburger} ${menuOpen() ? styles.hamburgerOpen : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      </div>

      <Show when={menuOpen()}>
        <div class={styles.menuOverlay} onClick={closeMenu}></div>
        <div class={styles.menu}>
          <A href="/why-bch" onClick={closeMenu}>Why BCH</A>
          <A href="/skills" onClick={closeMenu}>Skills</A>
          <A href="/guides" onClick={closeMenu}>Guides</A>
          <a href="https://github.com/toorik2/agents.layer1.cash" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>GitHub</a>
        </div>
      </Show>
    </nav>
  );
}
