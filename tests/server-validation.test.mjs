import test from "node:test"
import assert from "node:assert/strict"
const requestRules = await import("../services/requestRules.ts")
const validation = await import("../services/validation.ts")
const mediaUpload = await import("../lib/mediaUpload.ts")
const uploadService = await import("../services/uploadService.ts")

test("request creation validation rejects invalid budget and accepts normal payload", () => {
  assert.equal(validation.validateRequestCreateInput({ serviceId: "abc", customerBudgetEur: "99,50" }).ok, true)
  assert.equal(validation.validateRequestCreateInput({ serviceId: "", customerBudgetEur: null }).ok, false)
  assert.equal(validation.validateRequestCreateInput({ serviceId: "abc", customerBudgetEur: "-5" }).ok, false)
})

test("request status validation and transition rules stay strict", () => {
  assert.equal(validation.validateRequestStatusInput({ nextStatus: "accepted" }).ok, true)
  assert.equal(validation.validateRequestStatusInput({ nextStatus: "unsupported" }).ok, false)
  assert.equal(requestRules.canProviderTransition("pending", "accepted"), true)
  assert.equal(requestRules.canProviderTransition("accepted", "rejected"), false)
  assert.equal(requestRules.canCustomerTransition("pending", "cancelled"), true)
  assert.equal(requestRules.canCustomerTransition("accepted", "cancelled"), false)
})

test("chat and provider validation require meaningful payloads", () => {
  assert.equal(validation.validateChatMessageInput({ requestId: "r1", message: "Hallo" }).ok, true)
  assert.equal(validation.validateChatMessageInput({ requestId: "r1", message: "   " }).ok, false)

  const providerResult = validation.validateProviderVerificationInput(
    {
      companyName: "Hilfinio Service",
      city: "Stuttgart",
      proofLinks: "https://example.com/proof",
      privacyAccepted: true,
      verificationDisclaimerAccepted: true,
    },
    "team@example.com"
  )
  assert.equal(providerResult.ok, true)
  assert.equal(
    validation.validateProviderVerificationInput(
      { companyName: "x", city: "Stuttgart", proofLinks: "", privacyAccepted: true, verificationDisclaimerAccepted: true },
      "team@example.com"
    ).ok,
    false
  )
})

test("service creation validation enforces pilot mode and basic structure", () => {
  const valid = validation.validateServiceCreateInput({
    title: "Reinigung",
    description: "Wohnungsreinigung",
    providerName: "Max Team",
    city: "Stuttgart",
    mediaUrls: ["https://example.com/a.jpg"],
    availabilityDays: ["Mo", "Fr", "X"],
  })
  assert.equal(valid.ok, true)
  if (valid.ok) {
    assert.deepEqual(valid.value.availabilityDays, ["Mo", "Fr"])
  }

  const pilotOnly = validation.validateServiceCreateInput({
    title: "Reinigung",
    description: "Wohnungsreinigung",
    providerName: "Max Team",
    city: "Koeln",
  })
  assert.equal(pilotOnly.ok, false)
})

test("provider offer validation rejects invalid values", () => {
  assert.equal(validation.validateProviderOfferInput({ providerOfferEur: "150" }).ok, true)
  assert.equal(validation.validateProviderOfferInput({ providerOfferEur: "0" }).ok, false)
})

test("favorites, waitlist and reviews are validated server-side", () => {
  assert.equal(validation.validateFavoriteInput({ serviceId: "svc_1" }).ok, true)
  assert.equal(validation.validateFavoriteInput({ serviceId: "" }).ok, false)

  assert.equal(
    validation.validateWaitlistInput({
      name: "Alaadin Adem",
      email: "alaadin@example.com",
      city: "Stuttgart",
      role: "provider",
      privacyAccepted: true,
      marketingAccepted: true,
    }).ok,
    true
  )
  assert.equal(
    validation.validateWaitlistInput({
      name: "Alaadin Adem",
      email: "invalid",
      city: "Stuttgart",
      role: "provider",
      privacyAccepted: true,
    }).ok,
    false
  )

  assert.equal(
    validation.validateReviewCreateInput({
      requestId: "req_1",
      serviceId: "svc_1",
      rating: 5,
      comment: "Sehr gut",
      proofLinks: ["https://example.com/review.jpg"],
    }).ok,
    true
  )
  assert.equal(
    validation.validateReviewCreateInput({
      requestId: "req_1",
      serviceId: "svc_1",
      rating: 0,
      proofLinks: [],
    }).ok,
    false
  )
})

test("service media upload policy rejects unsupported files and limits selection", () => {
  const result = mediaUpload.validateUploadSelection(
    [
      { name: "photo.jpg", type: "image/jpeg", size: 1024 },
      { name: "script.svg", type: "image/svg+xml", size: 1024 },
      { name: "video.mp4", type: "video/mp4", size: 1024 },
    ],
    mediaUpload.SERVICE_MEDIA_POLICY
  )

  assert.equal(result.accepted.length, 2)
  assert.equal(result.rejected.length, 1)
  assert.match(result.rejected[0], /erlaubten formaten/i)
})

test("site asset upload policy builds safe storage paths", () => {
  const validationResult = mediaUpload.validateUploadFile(
    { name: "logo Final.PNG", type: "image/png", size: 1024 },
    mediaUpload.SITE_ASSET_POLICY
  )
  assert.equal(validationResult.ok, true)

  const path = mediaUpload.buildStorageObjectPath("admin", "logo Final.PNG")
  assert.match(path, /^admin\/.+-logo-final\.png$/)
})

test("signed upload validation rejects invalid presets and accepts supported files", () => {
  assert.equal(
    uploadService.validateUploadGrantInput({
      kind: "unknown",
      fileName: "bild.png",
      fileSize: 123,
      contentType: "image/png",
    }).ok,
    false
  )

  const valid = uploadService.validateUploadGrantInput({
    kind: "serviceMedia",
    fileName: "referenzfoto.webp",
    fileSize: 1024,
    contentType: "image/webp",
  })

  assert.equal(valid.ok, true)
  if (valid.ok) {
    assert.equal(valid.value.kind, "serviceMedia")
  }
})
