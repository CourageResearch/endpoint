import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false })
    }

    return NextResponse.json({
      isAdmin: isAdmin(session.user.email)
    })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}
