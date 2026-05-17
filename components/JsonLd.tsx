type JsonLdProps = {
  data: unknown
  nonce?: string
}

export default function JsonLd({ data, nonce }: JsonLdProps) {
  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
