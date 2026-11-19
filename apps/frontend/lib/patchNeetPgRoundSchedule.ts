/** Live CMS still has old Round-1 dates; patch at render so /md-ms/up shows updates without WP edit. */

const ROUND1_TITLE = 'NEET PG ROUND-1 SCHEDULE';
const ROUND2_TITLE = 'NEET PG ROUND-2 SCHEDULE';

const ROUND1_DATES = [
  '21-10-2026 to 26-10-2026',
  '26-10-2026 to 30-10-2026',
  '02-11-2026',
] as const;

const ROUND2_DATES = [
  '16-11-2026 to 19-11-2026',
  '20-11-2026 to 25-11-2026',
  '26-11-2026',
] as const;

const OLD_ROUND1_DATES = ['6.11.25-14.11.25', '15.11.25-24.11.25', '26.11.25'] as const;

function replaceFirst(haystack: string, needle: string, replacement: string): string {
  const idx = haystack.indexOf(needle);
  if (idx < 0) return haystack;
  return haystack.slice(0, idx) + replacement + haystack.slice(idx + needle.length);
}

function extractSection(html: string, title: string): { start: number; end: number; html: string } | null {
  const titleIdx = html.indexOf(title);
  if (titleIdx < 0) return null;
  const start = html.lastIndexOf('<section', titleIdx);
  const end = html.indexOf('</section>', titleIdx);
  if (start < 0 || end < 0) return null;
  const close = end + '</section>'.length;
  return { start, end: close, html: html.slice(start, close) };
}

function applyDatesInOrder(sectionHtml: string, from: readonly string[], to: readonly string[]): string {
  let next = sectionHtml;
  for (let i = 0; i < from.length; i++) {
    const idx = next.indexOf(from[i]);
    if (idx < 0) continue;
    next = next.slice(0, idx) + to[i] + next.slice(idx + from[i].length);
  }
  return next;
}

function buildRound2FromRound1(round1Html: string): string {
  let round2 = round1Html
    .split('elementor-element-5d74baa').join('elementor-element-7c91e2b')
    .split('data-id="5d74baa"').join('data-id="7c91e2b"')
    .split('data-eae-slider="62151"').join('data-eae-slider="73262"')
    .split('elementor-element-a4c4413').join('elementor-element-8d02f3c')
    .split('data-id="a4c4413"').join('data-id="8d02f3c"')
    .split('data-eae-slider="60778"').join('data-eae-slider="84373"')
    .split('elementor-element-39ca7f8').join('elementor-element-9e13a4d')
    .split('data-id="39ca7f8"').join('data-id="9e13a4d"')
    .split('elementor-element-e31dc8d').join('elementor-element-af24b5e')
    .split('data-id="e31dc8d"').join('data-id="af24b5e"')
    .split('data-table_id="e31dc8d"').join('data-table_id="af24b5e"')
    .split('eael-data-table-wrapper-e31dc8d').join('eael-data-table-wrapper-af24b5e')
    .split('eael-data-table-e31dc8d').join('eael-data-table-af24b5e');

  round2 = replaceFirst(round2, ROUND1_TITLE, ROUND2_TITLE);
  round2 = applyDatesInOrder(round2, ROUND1_DATES, ROUND2_DATES);
  return round2;
}

export function patchNeetPgRoundScheduleHtml(html: string): string {
  if (!html || !html.includes(ROUND1_TITLE)) return html;

  const section = extractSection(html, ROUND1_TITLE);
  if (!section) return html;

  let round1 = section.html;
  if (round1.includes(OLD_ROUND1_DATES[0])) {
    round1 = applyDatesInOrder(round1, OLD_ROUND1_DATES, ROUND1_DATES);
  } else if (!round1.includes(ROUND1_DATES[0])) {
    // Unknown date format — leave Round 1 as-is, still try Round 2 insert if missing
  }

  if (html.includes(ROUND2_TITLE)) {
    const r2 = extractSection(html, ROUND2_TITLE);
    if (!r2) {
      return html.slice(0, section.start) + round1 + html.slice(section.end);
    }
    const round2 = buildRound2FromRound1(round1);
    return html.slice(0, section.start) + round1 + html.slice(section.end, r2.start) + round2 + html.slice(r2.end);
  }

  const round2 = buildRound2FromRound1(round1);
  return html.slice(0, section.start) + round1 + '\n' + round2 + html.slice(section.end);
}
