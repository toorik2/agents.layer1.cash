import { Router, Route } from '@solidjs/router';
import type { ParentProps } from 'solid-js';
import { TopBar } from './shared/TopBar';

import Home from './pages/Home';
import WhyBch from './pages/WhyBch';
import Guide from './pages/Guide';
import Guides from './pages/Guides';
import Skills from './pages/Skills';
import './App.css';

function Layout(props: ParentProps) {
  return (
    <>
      <TopBar />
      <main class="main-content">
        {props.children}
      </main>

    </>
  );
}

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/why-bch" component={WhyBch} />
      <Route path="/guides" component={Guides} />
      <Route path="/guides/:name" component={Guide} />
      <Route path="/skills" component={Skills} />
    </Router>
  );
}
