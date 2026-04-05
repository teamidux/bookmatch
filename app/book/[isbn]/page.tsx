import { Metadata } from 'next'
import BookDetailClient from './BookDetailClient'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PageProps {
  params: { isbn: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isbn = decodeURIComponent(params.isbn)
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('isbn', isbn)
    .maybeSingle()

  if (!book) return { title: `ISBN ${isbn} — BookMatch` }

  return {
    title: `${book.title} — BookMatch`,
    description: `ซื้อ "${book.title}" มือสอง ราคาเริ่มต้น ฿${book.min_price || '-'}`,
    openGraph: {
      title: book.title,
      description: 'หนังสือมือสองราคาดี | BookMatch',
      images: book.cover_url ? [book.cover_url] : [],
    },
  }
}

export default function BookPage({ params }: PageProps) {
  const isbn = decodeURIComponent(params.isbn)
  return <BookDetailClient isbn={isbn} />
}
