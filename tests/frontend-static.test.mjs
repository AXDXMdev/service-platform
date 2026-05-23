import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

test("launch-critical frontend routes and boundaries exist", () => {
  const requiredFiles = [
    "app/page.tsx",
    "app/services/page.tsx",
    "app/service/[id]/page.tsx",
    "app/provider/[id]/page.tsx",
    "app/login/page.tsx",
    "app/register/page.tsx",
    "app/dashboard/page.tsx",
    "app/my-requests/page.tsx",
    "app/chat/[requestId]/page.tsx",
    "app/account/privacy/page.tsx",
    "app/account/delete/page.tsx",
    "app/report/page.tsx",
    "app/plattform-beschwerden/page.tsx",
    "app/links/page.tsx",
    "app/error.tsx",
    "app/loading.tsx",
    "app/not-found.tsx",
  ]

  for (const relativePath of requiredFiles) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `${relativePath} is missing`)
  }
})

test("marketplace navigation exposes launch-critical user journeys", () => {
  const navigation = read("components/Navigation.tsx")
  const footer = read("components/SiteFooter.tsx")
  const trustBar = read("components/MarketplaceTrustBar.tsx")
  for (const href of ["/services", "/create-service", "/dashboard"]) {
    assert.match(navigation, new RegExp(`href=["']${href}["']`), `${href} missing from navigation`)
  }
  for (const href of ["/plattform-beschwerden", "/cookie-einstellungen", "/links"]) {
    assert.match(footer, new RegExp(`href=["']${href}["']`), `${href} missing from footer`)
  }
  assert.match(trustBar, /href:\s*"\/report"/, "/report missing from marketplace trust surface")
})

test("frontend forms expose accessible input names and mobile-safe submit flow", () => {
  const login = read("app/login/page.tsx")
  const register = read("app/register/page.tsx")
  const chat = read("app/chat/[requestId]/page.tsx")
  const serviceDetail = read("app/service/[id]/page.tsx")

  assert.match(login, /aria-label=\{t\("authEmailPlaceholder"\)\}/)
  assert.match(login, /aria-label=\{t\("authPasswordPlaceholder"\)\}/)
  assert.match(register, /aria-label=\{t\("authEmailPlaceholder"\)\}/)
  assert.match(register, /aria-label=\{t\("authPasswordPlaceholder"\)\}/)
  assert.match(chat, /<form[\s\S]*onSubmit=/)
  assert.match(chat, /role="log"/)
  assert.match(serviceDetail, /htmlFor="customer-budget"/)
})

test("service discovery includes trust, empty state, and filter reset affordances", () => {
  const servicesPage = read("components/ServicesPageClient.tsx")
  const providerPage = read("app/provider/[id]/page.tsx")

  assert.match(servicesPage, /MarketplaceTrustBar/)
  assert.match(servicesPage, /Filter zurücksetzen/)
  assert.match(servicesPage, /Noch keine Anbieter|Regionaler Marktplatz im Aufbau/)
  assert.match(providerPage, /MarketplaceTrustBar/)
  assert.match(providerPage, /Anfragen/)
})

test("marketplace pages expose server-side SEO metadata and JSON-LD", () => {
  const servicesLayout = read("app/services/layout.tsx")
  const serviceLayout = read("app/service/[id]/layout.tsx")
  const providerLayout = read("app/provider/[id]/layout.tsx")
  const linksPage = read("app/links/page.tsx")
  const seo = read("lib/seo.ts")

  assert.match(servicesLayout, /servicesMarketplaceJsonLd/)
  assert.match(serviceLayout, /generateMetadata/)
  assert.match(serviceLayout, /serviceDetailJsonLd/)
  assert.match(providerLayout, /generateMetadata/)
  assert.match(providerLayout, /providerProfileJsonLd/)
  assert.match(linksPage, /utm_source=tiktok/)
  assert.match(linksPage, /utm_source=instagram/)
  assert.match(linksPage, /utm_source=youtube/)
  assert.match(linksPage, /utm_source=linkedin/)
  assert.match(seo, /"@type": "CollectionPage"/)
  assert.match(seo, /"@type": "Service"/)
  assert.match(seo, /"@type": "ProfilePage"/)
})

test("open launch social and operations documents exist", () => {
  const requiredFiles = [
    "docs/open-launch-checklist.md",
    "content/social/handles-checklist.md",
    "content/social/bios.md",
    "content/social/hooks.md",
    "content/social/captions.md",
    "content/social/posting-plan.md",
  ]

  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(root, relativePath)
    assert.equal(fs.existsSync(absolutePath), true, `${relativePath} is missing`)
    assert.match(fs.readFileSync(absolutePath, "utf8"), /Hilfinio|Launch|Social|Hook|Caption/)
  }
})

test("service detail experience includes conversion and trust components", () => {
  const servicePage = read("app/service/[id]/page.tsx")
  const providerPage = read("app/provider/[id]/page.tsx")
  const architecture = read("DETAIL_PAGE_CONVERSION_ARCHITECTURE.md")

  for (const component of [
    "ServiceHeroGallery",
    "ConversionSignalGrid",
    "TrustBadgeGrid",
    "ReviewSnapshot",
    "SafetyPanel",
    "MobileStickyActions",
  ]) {
    assert.match(servicePage, new RegExp(component), `${component} missing from service page`)
  }

  assert.match(providerPage, /ProviderAvatar/)
  assert.match(providerPage, /ConversionSignalGrid/)
  assert.match(architecture, /provider_trust_profiles/)
  assert.match(architecture, /service_review_breakdowns/)
})
