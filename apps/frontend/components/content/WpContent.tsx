import { ContentArticle } from './ContentPageShell';

type WpContentProps = {
  html: string;
  featuredImage?: string | null;
  title: string;
  showFeaturedImage?: boolean;
};

/** @deprecated Prefer ContentPageShell for full layout with sidebar TOC. */
export function WpContent(props: WpContentProps) {
  return <ContentArticle {...props} />;
}
