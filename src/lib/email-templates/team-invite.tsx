import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface TeamInviteProps {
  teamName: string
  inviteUrl: string
  inviterEmail?: string
}

export function TeamInviteEmail({ teamName, inviteUrl, inviterEmail }: TeamInviteProps) {
  return (
    <Html>
      <Head />
      <Preview>{`You've been added as an admin for ${teamName} on Huge Fines`}</Preview>
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '520px' }}>
          <Heading style={{ fontSize: '22px', margin: '0 0 16px' }}>
            You're now an admin for {teamName}
          </Heading>
          <Text style={{ fontSize: '15px', color: '#333', lineHeight: '22px' }}>
            {inviterEmail ? `${inviterEmail} has` : 'You have'} been given access to log fines,
            rounds and votes for <strong>{teamName}</strong> on Huge Fines.
          </Text>
          <Section style={{ margin: '28px 0' }}>
            <Button
              href={inviteUrl}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                padding: '12px 22px',
                borderRadius: '6px',
                fontSize: '15px',
                textDecoration: 'none',
              }}
            >
              Accept invite
            </Button>
          </Section>
          <Text style={{ fontSize: '13px', color: '#666', lineHeight: '20px' }}>
            If the button doesn't work, copy this link into your browser:
            <br />
            {inviteUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template: TemplateEntry = {
  component: TeamInviteEmail,
  displayName: 'Team admin invite',
  subject: (data) => `You've been added as an admin for ${data.teamName ?? 'a team'}`,
  previewData: {
    teamName: 'Westside CC',
    inviteUrl: 'https://hugefines.com/invite-welcome',
    inviterEmail: 'captain@example.com',
  },
}
