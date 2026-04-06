import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get('size') || 192)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(145deg, #2563EB, #1d4ed8)',
          borderRadius: size * 0.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: size * 0.04,
        }}
      >
        {/* Book left page */}
        <div style={{ display: 'flex', position: 'relative' }}>
          <div
            style={{
              width: size * 0.28,
              height: size * 0.38,
              background: 'white',
              borderRadius: `${size * 0.04}px 0 0 ${size * 0.04}px`,
              opacity: 0.95,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: size * 0.03,
              padding: size * 0.04,
            }}
          >
            <div style={{ width: '80%', height: size * 0.025, background: '#2563EB', borderRadius: 99, opacity: 0.35 }} />
            <div style={{ width: '60%', height: size * 0.025, background: '#2563EB', borderRadius: 99, opacity: 0.35 }} />
            <div style={{ width: '70%', height: size * 0.025, background: '#2563EB', borderRadius: 99, opacity: 0.35 }} />
          </div>
          {/* Spine */}
          <div style={{ width: size * 0.04, height: size * 0.38, background: '#1e40af' }} />
          {/* Right page */}
          <div
            style={{
              width: size * 0.28,
              height: size * 0.38,
              background: 'white',
              borderRadius: `0 ${size * 0.04}px ${size * 0.04}px 0`,
              opacity: 0.75,
            }}
          />
        </div>
        {/* BM label */}
        <div
          style={{
            color: 'white',
            fontSize: size * 0.13,
            fontWeight: 800,
            letterSpacing: size * 0.01,
            opacity: 0.9,
            fontFamily: 'serif',
          }}
        >
          BookMatch
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
