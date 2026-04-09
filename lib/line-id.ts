// LINE ID normalization + validation + URL builders
//
// LINE มี ID 2 แบบ:
//   - Personal: ตั้งเอง 4-20 ตัวอักษร (a-z 0-9 . _ -) เช่น "somchai_books"
//     URL: https://line.me/ti/p/~somchai_books  (มี ~ นำหน้า)
//   - Official Account: ขึ้นต้น @ เช่น "@bookmatch"
//     URL: https://line.me/R/ti/p/@bookmatch
//
// ผู้ใช้มัก paste มาแบบหลากหลาย: "@user", "~user", "line.me/ti/p/~user", "user"
// เรา normalize ให้เหลือแค่ ID จริง พร้อม flag ว่าเป็น official หรือ personal

export type LineIdInfo = {
  raw: string         // ID ที่ store (ไม่มี ~ หรือ @)
  isOfficial: boolean // true = official account
  display: string     // ที่แสดงบน UI เช่น "@user" หรือ "user"
  addUrl: string      // URL สำหรับเปิด LINE app เพื่อ add friend
}

/**
 * รับ LINE ID จาก user input หลากหลายแบบ → normalize หรือ return null ถ้า invalid
 */
export function parseLineId(input: string): LineIdInfo | null {
  if (!input) return null
  let s = input.trim().toLowerCase()
  if (!s) return null

  // ตัด URL prefix ออก
  s = s.replace(/^https?:\/\//, '')
  s = s.replace(/^line\.me\/r?\/?ti\/p\//, '')
  s = s.replace(/^line:\/\/ti\/p\//, '')

  // ตรวจ official account (@) vs personal (~)
  let isOfficial = false
  if (s.startsWith('@')) {
    isOfficial = true
    s = s.slice(1)
  } else if (s.startsWith('~')) {
    s = s.slice(1)
  }

  // กัน trailing slash หรือ query string
  s = s.replace(/[/?#].*$/, '')

  // Validate ตาม LINE rules: 4-20 chars, a-z 0-9 . _ -
  if (!/^[a-z0-9._-]{4,20}$/.test(s)) return null

  return {
    raw: s,
    isOfficial,
    display: isOfficial ? `@${s}` : s,
    addUrl: isOfficial
      ? `https://line.me/R/ti/p/@${s}`
      : `https://line.me/R/ti/p/~${s}`,
  }
}

/**
 * Quick check ว่า input parse ได้ valid LINE ID หรือไม่ (ไม่ care info)
 */
export function isValidLineId(input: string): boolean {
  return parseLineId(input) !== null
}
