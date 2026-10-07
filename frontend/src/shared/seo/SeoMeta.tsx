import { useEffect } from "react";
import { APP_NAME, PUBLIC_SITE_URL } from "../../config/appConfig";

interface SeoMetaProps {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
}

const findOrCreateMeta = (
  attribute: "name" | "property",
  key: string,
) => {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return { element: existing, created: false };

  const element = document.createElement("meta");
  element.setAttribute(attribute, key);
  element.dataset.pamaheSeo = "true";
  document.head.appendChild(element);
  return { element, created: true };
};

const absoluteUrl = (value: string) => {
  try {
    const base = PUBLIC_SITE_URL || window.location.origin;
    return new URL(value, `${base}/`).toString();
  } catch {
    return value;
  }
};

export function SeoMeta({
  title,
  description,
  canonicalPath,
  image,
  imageAlt,
  type = "website",
}: SeoMetaProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const changes: Array<{
      element: HTMLMetaElement;
      created: boolean;
      previous: string | null;
    }> = [];

    const setMeta = (
      attribute: "name" | "property",
      key: string,
      content?: string,
    ) => {
      if (!content) return;
      const { element, created } = findOrCreateMeta(attribute, key);
      changes.push({
        element,
        created,
        previous: element.getAttribute("content"),
      });
      element.setAttribute("content", content);
    };

    const canonical = absoluteUrl(canonicalPath);
    setMeta("name", "description", description);
    setMeta("property", "og:site_name", APP_NAME);
    setMeta("property", "og:locale", "es_UY");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonical);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    if (image) {
      const absoluteImage = absoluteUrl(image);
      setMeta("property", "og:image", absoluteImage);
      setMeta("property", "og:image:alt", imageAlt || title);
      setMeta("name", "twitter:image", absoluteImage);
      setMeta("name", "twitter:image:alt", imageAlt || title);
    }

    let canonicalLink = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    const canonicalCreated = !canonicalLink;
    const previousCanonical = canonicalLink?.getAttribute("href") ?? null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      canonicalLink.dataset.pamaheSeo = "true";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    return () => {
      document.title = previousTitle;
      for (const change of changes) {
        if (change.created) {
          change.element.remove();
        } else if (change.previous === null) {
          change.element.removeAttribute("content");
        } else {
          change.element.setAttribute("content", change.previous);
        }
      }

      if (canonicalCreated) {
        canonicalLink?.remove();
      } else if (canonicalLink && previousCanonical !== null) {
        canonicalLink.setAttribute("href", previousCanonical);
      }
    };
  }, [canonicalPath, description, image, imageAlt, title, type]);

  return null;
}
