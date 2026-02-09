import { useParams } from '@solidjs/router';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export default function Guide() {
  const params = useParams();
  return <MarkdownRenderer file={params.name} />;
}
