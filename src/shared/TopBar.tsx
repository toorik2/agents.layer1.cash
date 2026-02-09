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

      {/* Desktop inline nav */}
      <div class={styles.desktopNav}>
        <A href="/why-bch" class={`${styles.navLink} ${isActive('/why-bch') ? styles.navLinkActive : ''}`}>Why BCH</A>
        <A href="/skills" class={`${styles.navLink} ${isActive('/skills') ? styles.navLinkActive : ''}`}>Skills</A>
        <A href="/guides" class={`${styles.navLink} ${isActive('/guides') ? styles.navLinkActive : ''}`}>Guides</A>
      </div>

      {/* Mobile hamburger */}
      <button class={styles.menuButton} onClick={toggleMenu} aria-label="Menu">
        <div class={`${styles.hamburger} ${menuOpen() ? styles.hamburgerOpen : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      <Show when={menuOpen()}>
        <div class={styles.menuOverlay} onClick={closeMenu}></div>
        <div class={styles.menu}>
          <A href="/why-bch" onClick={closeMenu}>Why BCH</A>
          <A href="/skills" onClick={closeMenu}>Skills</A>
          <A href="/guides" onClick={closeMenu}>Guides</A>
        </div>
      </Show>
    </nav>
  );
}
