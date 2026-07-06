export function isSiteProtectionEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  if (process.env.NEXT_PUBLIC_SITE_PROTECTION_DISABLED === 'true') return false;
  return true;
}

/** Runs before React hydration to block right-click and devtools shortcuts early. */
export const SITE_PROTECTION_INLINE_SCRIPT = `(function(){document.addEventListener("contextmenu",function(e){e.preventDefault();},true);document.addEventListener("keydown",function(e){var k=e.key,c=e.ctrlKey||e.metaKey;if(k==="F12"||(c&&e.shiftKey&&/^[ijc]$/i.test(k))||(c&&/^[us]$/i.test(k))||(e.metaKey&&e.altKey&&/^[ijc]$/i.test(k))){e.preventDefault();e.stopPropagation();}},true);})();`;

export function isDevtoolsShortcut(event: KeyboardEvent): boolean {
  const key = event.key;

  if (key === 'F12') return true;

  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  if (ctrlOrMeta && event.shiftKey && /^[ijc]$/i.test(key)) return true;
  if (ctrlOrMeta && /^[us]$/i.test(key)) return true;
  if (event.metaKey && event.altKey && /^[ijc]$/i.test(key)) return true;

  return false;
}
