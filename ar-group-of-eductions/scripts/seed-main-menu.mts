/**
 * Seed Header global menu from live-site trees (mbbs-india / mbbs-abroad) + top links.
 *
 * Usage: npx tsx scripts/seed-main-menu.mts
 *   --states-only   India: state links only (no college sub-links); abroad unchanged
 */

import 'dotenv/config'
process.env.PAYLOAD_DATABASE_PUSH = 'false'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

type MenuLeaf = {
  label: string
  linkType: 'custom'
  url: string
}

type MenuL2 = MenuLeaf & { collegeLinks?: MenuLeaf[] }

type MenuL1 = MenuLeaf & {
  megaMenu?: 'none' | 'mbbs-india' | 'mbbs-abroad' | 'md-ms'
  subItems?: MenuL2[]
}

function custom(label: string, url: string): MenuLeaf {
  return { label, linkType: 'custom', url }
}

async function loadIndiaTree() {
  const p = path.join(ROOT, 'apps/frontend/data/mbbs-india-tree.json')
  return JSON.parse(await readFile(p, 'utf8')) as {
    states: Array<{
      id?: string
      navLabel: string
      name: string
      href: string
      colleges: Array<{ name: string; href: string }>
    }>
  }
}

async function loadAbroadTree() {
  const p = path.join(ROOT, 'apps/frontend/data/mbbs-abroad-tree.json')
  return JSON.parse(await readFile(p, 'utf8')) as {
    countries: Array<{
      navLabel: string
      name: string
      href: string
      colleges?: Array<{ name: string; href: string }>
      universities?: Array<{
        name: string
        href: string
        colleges?: Array<{ name: string; href: string }>
      }>
    }>
  }
}

function abroadCollegeLinks(country: Awaited<ReturnType<typeof loadAbroadTree>>['countries'][number]): MenuLeaf[] {
  return [
    ...(country.colleges ?? []).map((c) => custom(c.name, c.href)),
    ...(country.universities ?? []).flatMap((u) => [
      custom(u.name, u.href),
      ...(u.colleges ?? []).map((c) => custom(c.name, c.href)),
    ]),
  ]
}

async function main() {
  const statesOnly = process.argv.includes('--states-only')
  const india = await loadIndiaTree()
  const abroad = await loadAbroadTree()

  const indiaSubItems: MenuL2[] = india.states.map((state) => {
    const collegeLinks = statesOnly
      ? []
      : (state.colleges ?? []).map((c) => custom(c.name, c.href))
    return {
      ...custom(state.navLabel || state.name, state.href),
      collegeLinks,
    }
  })

  const menuItems: MenuL1[] = [
    custom('Home', '/'),
    custom('About Us', '/about'),
    {
      ...custom('MBBS India', '/mbbs-india'),
      megaMenu: 'mbbs-india',
      subItems: indiaSubItems,
    },
    {
      ...custom('MBBS Abroad', '/mbbs-abroad'),
      megaMenu: 'mbbs-abroad',
      subItems: abroad.countries.map((country) => ({
        ...custom(country.navLabel || country.name, country.href),
        collegeLinks: statesOnly ? [] : abroadCollegeLinks(country),
      })),
    },
    { ...custom('MD/MS', '/md-ms'), megaMenu: 'md-ms' },
    custom('Latest Updates', '/blog'),
    custom('Contact', '/contact'),
  ]

  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'header',
    data: {
      menuItems,
      quickPickPages: [],
    },
    overrideAccess: true,
    context: { disableRevalidate: true, disableBackendSync: true },
  })

  const countL3 = menuItems.reduce((n, item) => {
    let c = 0
    for (const s of item.subItems ?? []) c += (s.collegeLinks?.length ?? 0) + 1
    return n + (item.subItems?.length ?? 0) + c + 1
  }, 0)

  const indiaColleges = india.states.reduce((n, s) => n + (s.colleges?.length ?? 0), 0)
  console.log(`[seed-main-menu] Saved ${menuItems.length} top-level items (~${countL3} links in tree).`)
  console.log(
    `[seed-main-menu] MBBS India: ${india.states.length} states, ${statesOnly ? 0 : indiaColleges} college links.`,
  )
  console.log('[seed-main-menu] Admin → Site menu & footer → Main menu')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
