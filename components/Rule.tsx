export default function Rule({ glyph = "* * *" }: { glyph?: string }) {
  return <div className="rule">{glyph}</div>;
}
