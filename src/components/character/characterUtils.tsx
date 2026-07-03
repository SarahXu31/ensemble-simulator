// 风莫村 · 人物簿工具：SVG 头像、性别推断、人设文本解析

const AVATAR_PALETTES: Array<{ bg: string; ink: string }> = [
  { bg: '#E7DCC4', ink: '#5C3B2E' },
  { bg: '#DCE4DB', ink: '#2E5E4E' },
  { bg: '#EADFD0', ink: '#8B6F47' },
  { bg: '#E6D9D6', ink: '#B83A3A' },
  { bg: '#DDE0E6', ink: '#3A3A3A' },
  { bg: '#EDE6D3', ink: '#6B6B6B' },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// 圆形线稿头像：以姓名首字为标识，配色由姓名决定。
export function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  const palette = AVATAR_PALETTES[hashString(name) % AVATAR_PALETTES.length];
  const initial = name?.trim().charAt(0) ?? '客';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      role="img"
      aria-label={`${name} 头像`}
    >
      <circle cx="36" cy="36" r="35" fill={palette.bg} stroke="var(--kraft-brown)" strokeWidth="1" />
      <circle cx="36" cy="36" r="30" fill="none" stroke={palette.ink} strokeOpacity="0.18" strokeWidth="1" />
      <text
        x="36"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="30"
        fontFamily="var(--font-title)"
        fill={palette.ink}
      >
        {initial}
      </text>
    </svg>
  );
}

// 依据姓名/描述做轻量性别推断（数据模型未存性别）。
export function inferGender(name: string, description?: string): string {
  const femaleHints = ['娘', '姑', '妃', '嫂', '婆', '姐', '女'];
  const text = `${name}${description ?? ''}`;
  if (femaleHints.some((h) => name.includes(h))) return '女';
  if (/她|老板娘/.test(text)) return '女';
  return '男';
}

export type ParsedIdentity = {
  brief: string; // 【】标记之前的性情描述
  secrets: string[]; // 【秘密】/【把柄】等隐私条目
};

// 解析 identity 文本：正文性情 + 【秘密】【把柄】等隐私块。
export function parseIdentity(identity?: string): ParsedIdentity {
  if (!identity) return { brief: '', secrets: [] };
  const markerRe = /【(秘密|把柄)】([^【（]*)/g;
  const secrets: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = markerRe.exec(identity)) !== null) {
    const body = match[2].trim();
    if (body) secrets.push(`${match[1]}：${body}`);
  }
  const firstMarker = identity.search(/【/);
  const brief = (firstMarker >= 0 ? identity.slice(0, firstMarker) : identity)
    .replace(/\s+/g, '')
    .trim();
  return { brief, secrets };
}
