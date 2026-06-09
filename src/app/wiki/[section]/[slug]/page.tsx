import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticle, getAllArticles, getNav } from '@/lib/wiki';
import WikiClient from '../../WikiClient';

interface Props {
  params: Promise<{ section: string; slug: string }>;
}

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ section: a.section, slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, slug } = await params;
  const article = getArticle(section, slug);
  if (!article) return {};
  return {
    title: `${article.title} — Ledger Docs`,
    description: article.lede,
  };
}

export default async function WikiArticlePage({ params }: Props) {
  const { section, slug } = await params;
  const article = getArticle(section, slug);
  if (!article) notFound();

  const allArticles = getAllArticles();
  const nav = getNav(allArticles);

  return <WikiClient nav={nav} article={article} allArticles={allArticles} />;
}
