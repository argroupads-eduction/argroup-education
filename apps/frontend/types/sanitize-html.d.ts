declare module 'sanitize-html' {
  interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    allowVulnerableTags?: boolean;
    transformTags?: Record<string, unknown>;
  }
  interface Defaults {
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
  }
  function sanitizeHtml(dirty: string, options?: IOptions): string;
  namespace sanitizeHtml {
    const defaults: Defaults;
    function simpleTransform(
      tag: string,
      attribs: Record<string, string>,
    ): { tagName: string; attribs: Record<string, string> };
  }
  export = sanitizeHtml;
}
