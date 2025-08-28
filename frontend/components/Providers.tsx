"use client"

import React from 'react'
import { ApolloWrapper } from '@/lib/apollo-wrapper'
import { AuthProvider } from '@/hooks/useAuth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloWrapper>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ApolloWrapper>
  )
}