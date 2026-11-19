/** Renders structured data. Used by route files (metadata layer), never by views. */
export function JsonLd({ data }: { data: Record<string, unknown> | undefined }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // Escape "<" so the JSON can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
