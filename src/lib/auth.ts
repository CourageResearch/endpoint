import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || 'Endpoint <onboarding@resend.dev>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Endpoint <onboarding@resend.dev>',
            to: email,
            subject: 'Sign in to Endpoint',
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Sign in to Endpoint</h2>
                <p>Click the button below to sign in to your account:</p>
                <a href="${url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                  Sign In
                </a>
                <p style="color: #666; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
                <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
              </div>
            `
          })
        } catch (error) {
          console.error('Error sending verification email:', error)
          throw new Error('Failed to send verification email')
        }
      }
    })
  ],
  session: {
    strategy: 'database'
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/signin'
  },
  events: {
    async createUser({ user }) {
      // New users get 1000 balance (already default in schema)
      // This event fires when a new user signs in for the first time
      console.log('New user created:', user.email)
    }
  }
}
