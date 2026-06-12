import posthog from 'posthog-js'

// PostHog product analytics — dormant unless VITE_POSTHOG_KEY is set.
// Covers traffic (visitors, region, session duration, live feed) via autocapture,
// plus custom events like credit_purchased for revenue reporting.

let enabled = false

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return
  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,      // pageviews (incl. SPA route changes)
    capture_pageleave: true,     // needed for accurate session duration
    person_profiles: 'identified_only',
  })
  enabled = true
}

// Tie events to a specific user once they're logged in.
export function identifyUser(user) {
  if (!enabled || !user) return
  posthog.identify(user.id, { email: user.email })
}

// Clear identity on sign-out so the next visitor isn't merged with this one.
export function resetAnalytics() {
  if (!enabled) return
  posthog.reset()
}

// Track a custom event (e.g. a credit purchase) with properties.
export function trackEvent(name, props = {}) {
  if (!enabled) return
  posthog.capture(name, props)
}
