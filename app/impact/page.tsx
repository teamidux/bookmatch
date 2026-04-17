import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'เรื่องราวของเรา — BookMatch | ต่อชีวิตหนังสือ ลดขยะ ลดคาร์บอน',
  description: 'BookMatch คือตลาดกลางที่เชื่อมคนปล่อยหนังสือกับคนตามหา — Circular Economy สำหรับหนังสือ ลดขยะ ลดคาร์บอน Scope 3 และช่วยให้ความรู้เดินทางต่อ',
  openGraph: {
    title: 'หนังสือทุกเล่มสมควรมีชีวิตที่สอง',
    description: 'Circular Economy สำหรับหนังสือ · ลดขยะ ลดคาร์บอน เชื่อมคนอ่าน',
    type: 'website',
    locale: 'th_TH',
    siteName: 'BookMatch',
  },
}

export default function ImpactPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'Sarabun, sans-serif', color: '#1a1a2e', lineHeight: 1.8 }}>

      {/* HERO */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#2563EB', marginBottom: 14 }}>
          BookMatch
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 16, color: '#0F172A' }}>
          หนังสือทุกเล่ม<br />สมควรมีชีวิตที่สอง
        </h1>
        <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
          ตลาดกลางที่เชื่อมคนที่อยากปล่อยหนังสือ
          กับคนที่กำลังตามหามัน — ลดขยะ ลดคาร์บอน
          และช่วยให้ความรู้เดินทางต่อได้
        </p>
      </div>

      {/* THE PROBLEM */}
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 48, marginBottom: 20, letterSpacing: '-0.01em' }}>
        ปัญหาที่เรามองเห็น
      </h2>

      <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 14, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#713F12', marginBottom: 10 }}>
          1. ของดีหาไม่เจอ
        </div>
        <p style={{ fontSize: 15, color: '#78350F', lineHeight: 1.75, margin: 0, marginBottom: 10 }}>
          ในกลุ่มขายหนังสือมือสองบน Facebook คนขายมักถ่ายรูปหนังสือกองรวมกัน
          ไม่สะดวกพิมพ์ชื่อทีละเล่ม ส่วนคนซื้อก็ search ไม่ได้เพราะ FB
          ไม่มี search รูป
        </p>
        <p style={{ fontSize: 15, color: '#78350F', lineHeight: 1.75, margin: 0, marginBottom: 10 }}>
          ในร้านหนังสือมือสองก็เจอปัญหาเดียวกัน — ร้านส่วนใหญ่ไม่มีระบบจัดการ
          สต็อก เวลาลูกค้าถามว่า "มีเล่มนี้ไหม?" เจ้าของร้านตอบไม่ได้ ต้อง
          ไปรื้อกองหาเอง <strong>แถมเจ้าของบางร้านไม่รู้ด้วยซ้ำว่าตัวเอง
          มีหนังสือหายากราคาหลักพันอยู่ในกอง</strong>
        </p>
        <p style={{ fontSize: 15, color: '#78350F', lineHeight: 1.75, margin: 0 }}>
          ผลคือ — <strong>คนมีของดีแต่ไม่รู้ตัว คนที่หาก็หาไม่เจอสักที
          เดินกันคนละทาง</strong>
        </p>
      </div>

      <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 14, padding: '20px 22px', marginBottom: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#7F1D1D', marginBottom: 8 }}>
          2. หนังสือ = ขยะจัดการยาก
        </div>
        <p style={{ fontSize: 15, color: '#991B1B', lineHeight: 1.75, margin: 0 }}>
          ในวงการจัดการขยะ หนังสือเป็นประเภทที่จัดการยากที่สุด — จะชั่งขาย
          ของเก่าก็เสียดาย ร้านรับซื้อของเก่าบางร้านเอาไปขายมือสอง แต่
          <strong>อีกหลายร้านฉีกทิ้งรีไซเคิล</strong> ความรู้ที่ควรถึงคนอื่น
          กลายเป็นเยื่อกระดาษ
        </p>
      </div>

      {/* SOLUTION */}
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 48, marginBottom: 20, letterSpacing: '-0.01em' }}>
        วิธีที่เราแก้
      </h2>

      <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
        {[
          { icon: '📱', title: 'ลงขายง่ายแค่ 15 วินาที', desc: 'สแกน barcode หลังเล่ม → ระบบดึงชื่อ ผู้แต่ง และราคากลางให้เอง ไม่ต้องพิมพ์ — ทำให้คนที่ต้องการขาย ขายง่ายขึ้น' },
          { icon: '🔔', title: 'กดตามหา รอเจอจริง', desc: 'อยากได้เล่มไหนกด "ตามหา" รอไว้ พอมีคนมาลงขายเมื่อไหร่ ระบบส่งแจ้งเตือนเข้า LINE คุณทันที — ของดีไม่หลุดมือ' },
          { icon: '🏪', title: 'ระบบสต็อกสำหรับร้านมือสอง', desc: 'ร้านใช้เป็นระบบจัดเก็บหนังสือฟรี — สแกนเข้าเล่ม ดูราคากลาง รู้ว่าเล่มไหนในกองคือของหายาก ลูกค้าถามตอบได้ทันที ไม่ต้องรื้อ' },
          { icon: '🔄', title: 'หนังสือเล่มเดียว ส่งต่อได้หลายคน', desc: '1 เล่ม → ผู้อ่านคนที่ 2 → คนที่ 3 → ... ทุกครั้งที่ส่งต่อ คือ 1 เล่มใหม่ที่ไม่ต้องพิมพ์' },
        ].map(s => (
          <div key={s.title} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14 }}>
            <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ทำไมสำคัญ */}
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 48, marginBottom: 20, letterSpacing: '-0.01em' }}>
        ทำไมถึงสำคัญกับโลก
      </h2>

      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '📚', title: 'ความรู้ไปถึงคนมากขึ้น', desc: 'หนังสือมือสองราคาย่อมเยา ทำให้คนที่เงินไม่พอซื้อเล่มใหม่ก็มีโอกาสได้อ่าน' },
          { icon: '♻️', title: 'ของดีไม่กลายเป็นขยะ', desc: 'หนังสือที่คุณอ่านจบแล้ววางไว้ในชั้น กลับไปเป็นสมบัติของใครอีกคนแทนที่จะถูกทิ้ง' },
          { icon: '🌳', title: 'ต้นไม้ไม่ถูกตัดเพิ่ม', desc: 'ทุกเล่มที่ถูก reuse = ไม่ต้องผลิตใหม่ = ต้นไม้ กระดาษ น้ำ และพลังงานไม่ถูกใช้เพิ่ม' },
        ].map(s => (
          <div key={s.title} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14 }}>
            <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, marginBottom: 14 }}>
        งานวิจัยในต่างประเทศประมาณว่า หนังสือใหม่ 1 เล่มปล่อยคาร์บอนราว <strong>2.5 กิโลกรัม</strong>
        (จากการผลิตเยื่อ กระดาษ หมึก และขนส่ง) — ทุกเล่มที่คุณส่งต่อผ่าน BookMatch
        จึงเป็นการช่วยโลกเล็กๆ ที่รวมกันแล้วไม่เล็ก
      </p>

      <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 40, lineHeight: 1.7 }}>
        * สิ่งที่เราทำสอดคล้องกับเป้าหมาย <strong>SDG 4, 12, 13</strong> ของสหประชาชาติ
        (การศึกษา · การบริโภคอย่างรับผิดชอบ · ลดผลกระทบต่อสภาพภูมิอากาศ)
      </p>

      {/* FOUNDER STORY */}
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 48, marginBottom: 20, letterSpacing: '-0.01em' }}>
        จุดเริ่มต้น
      </h2>

      <blockquote style={{ background: 'white', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB', borderRadius: 10, padding: '22px 24px', margin: 0, marginBottom: 16, fontSize: 15, color: '#334155', lineHeight: 1.85 }}>
        <p style={{ margin: 0, marginBottom: 14 }}>
          ผมทำงานในวงการจัดการขยะ รีไซเคิล และกำจัดสินค้า end-of-life
          ให้<strong>แบรนด์ชั้นนำและบริษัท MNC</strong> มากว่า 20 ปี
        </p>
        <p style={{ margin: 0, marginBottom: 14 }}>
          จนวันหนึ่งเจอปัญหาของตัวเอง — ผมชอบตามหาหนังสือหายาก
          ในกลุ่ม Facebook คนขายกองหนังสือรวมๆ กัน ไม่รู้ด้วยซ้ำว่ามีเล่มหายาก
          ในกอง พอถามก็บอก "ไม่รู้ หาเอาเอง" — ใครจะไปหาเจอ?
        </p>
        <p style={{ margin: 0, marginBottom: 14 }}>
          กลับมามองอาชีพตัวเอง ก็เห็นว่าหนังสือเป็นประเภทขยะที่จัดการยาก
          หลายร้านไม่คุ้มที่จะรับมาขายต่อ ต้องฉีกทิ้งเป็นเยื่อกระดาษ
        </p>
        <p style={{ margin: 0, marginBottom: 14 }}>
          เลย<strong>ตั้งใจทำระบบนี้ขึ้นมา</strong>แก้ทั้งสองฝั่ง
        </p>
        <p style={{ margin: 0, fontWeight: 600, color: '#1E3A8A' }}>
          ของที่ไม่มีค่าสำหรับคุณ — อาจเปลี่ยนชีวิตใครสักคนก็ได้ครับ
        </p>
      </blockquote>

      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 40, textAlign: 'right' }}>
        — ณัฐวุฒิ หวังธนาโชติ (ทีม) · ผู้ก่อตั้ง BookMatch
      </p>

      {/* FOR YOU — CTAs */}
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 48, marginBottom: 20, letterSpacing: '-0.01em' }}>
        ร่วมสนับสนุน
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { icon: '📖', title: 'ผู้ใช้งาน', desc: 'ขายหนังสือที่ไม่ได้อ่านแล้ว หรือตามหาเล่มที่อยากอ่าน — ใช้ฟรี ไม่มีขั้นต่ำ', cta: 'เริ่มใช้งาน', href: '/', color: '#16A34A' },
          { icon: '🏢', title: 'สำนักพิมพ์ / ร้านหนังสือ', desc: 'ดูว่าหนังสือของคุณยังมีคนตามหาไหม + ร่วมลดขยะหนังสือไปกับเรา', cta: 'ติดต่อเรา', href: 'mailto:bookmatch2468@gmail.com?subject=BookMatch × สำนักพิมพ์', color: '#2563EB' },
          { icon: '💼', title: 'นักลงทุน / Partner', desc: 'สนใจร่วมลงทุนใน startup ที่แก้ปัญหาหนังสือถูกทิ้ง — คุยกันได้', cta: 'ติดต่อเรา', href: 'mailto:bookmatch2468@gmail.com?subject=BookMatch × Investor', color: '#7C3AED' },
          { icon: '📰', title: 'สื่อ / นักวิจัย', desc: 'ขอข้อมูล รูปภาพ หรือสัมภาษณ์ — สำหรับบทความและงานวิจัย', cta: 'ขอข้อมูล', href: 'mailto:bookmatch2468@gmail.com?subject=BookMatch × Media', color: '#DC2626' },
        ].map(c => (
          <div key={c.title} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 18px' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 14, minHeight: 40 }}>{c.desc}</div>
            <a
              href={c.href}
              style={{
                display: 'inline-block',
                fontSize: 14,
                fontWeight: 700,
                color: c.color,
                textDecoration: 'none',
                borderBottom: `2px solid ${c.color}`,
                paddingBottom: 2,
              }}
            >
              {c.cta} →
            </a>
          </div>
        ))}
      </div>

      {/* CONTACT */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '22px 24px', textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>ติดต่อทีม</div>
        <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
          email: <a href="mailto:bookmatch2468@gmail.com" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>bookmatch2468@gmail.com</a><br />
          LINE: <strong>@bookmatch</strong>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
        <Link href="/" style={{ color: '#94A3B8', textDecoration: 'underline', textUnderlineOffset: 2 }}>← กลับหน้าแรก</Link>
      </div>
    </div>
  )
}
