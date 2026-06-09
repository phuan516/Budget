import { getAllArticles, getNav } from '@/lib/wiki';
import WikiClient from './WikiClient';

export default function WikiIndexPage() {
  const allArticles = getAllArticles();
  const nav = getNav(allArticles);
  return <WikiClient nav={nav} article={null} allArticles={allArticles} />;
}
