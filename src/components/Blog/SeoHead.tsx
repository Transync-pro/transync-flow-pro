
import { Helmet } from "react-helmet";
import { type SeoData } from "@/types/blog";

interface SeoHeadProps {
  seo: SeoData;
  slug?: string;
}

export default function SeoHead({ seo, slug = "" }: SeoHeadProps) {
  const baseUrl = window.location.origin;
  const url = slug ? `${baseUrl}/blog/${slug}` : baseUrl;
  
  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords && <meta name="keywords" content={seo.keywords.join(', ')} />}
      
      {seo.canonical && <link rel="canonical" href={seo.canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.og_title || seo.title} />
      <meta property="og:description" content={seo.og_description || seo.description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      {seo.og_image && <meta property="og:image" content={seo.og_image} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content={seo.twitter_card || "summary_large_image"} />
      <meta name="twitter:title" content={seo.twitter_title || seo.title} />
      <meta name="twitter:description" content={seo.twitter_description || seo.description} />
      {seo.twitter_image && <meta name="twitter:image" content={seo.twitter_image} />}
    </Helmet>
  );
}
