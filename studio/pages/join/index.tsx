import React from 'react'
import { useStore, withAuth } from 'hooks'
import { Button, IconAlertCircle, Typography } from '@supabase/ui'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { API_URL } from 'lib/constants'
import { get, post, delete_ } from 'lib/common/fetch'
import { useEffect } from 'react'

interface TokenInfoI {
  organization_name: string | undefined
  token_does_not_exist: boolean
  email_match: boolean
  authorized_user: boolean
  expired_token: boolean
  invite_id: number
}

type TokenInfo = TokenInfoI | undefined

const User = () => {
  const router = useRouter()
  const { slug, token } = router.query
  const { ui } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tokenValidationInfo, setTokenValidationInfo] = useState<TokenInfo>(undefined)
  const [tokenInfoLoaded, setTokenInfoLoaded] = useState(false)
  const {
    token_does_not_exist,
    email_match,
    authorized_user,
    expired_token,
    organization_name,
    invite_id,
  } = tokenValidationInfo || {}

  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const response = await get(`${API_URL}/organizations/${slug}/members/join?token=${token}`)
        setTokenValidationInfo(response)
        setTokenInfoLoaded(true)
      } catch (error) {
        console.error(error)
      }
    }

    if (router.query.token && !tokenInfoLoaded) {
      fetchTokenInfo()
    }
  }, [router.query])

  async function handleJoinOrganization() {
    setIsSubmitting(true)
    const response = await post(`${API_URL}/organizations/${slug}/members/join?token=${token}`, {})
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to join organization: ${response.error.message}`,
      })
      setIsSubmitting(false)
    } else {
      setIsSubmitting(false)
      //   app.organizations.load()
      router.push('/')
    }
  }

  async function handleDeclineJoinOrganization() {
    setIsSubmitting(true)
    const response = await delete_(
      `${API_URL}/organizations/${slug}/members/invite?invited_id=${invite_id}`,
      {}
    )
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to decline invitation: ${response.error.message}`,
      })
      setIsSubmitting(false)
    } else {
      setIsSubmitting(false)
      router.push('/')
    }
  }

  return (
    <div className="bg-scale-200 flex h-full min-h-screen w-full flex-col place-items-center items-center justify-center gap-8 px-5">
      <div
        className="
          bg-scale-300 border-scale-400 mx-auto max-w-md
          overflow-hidden rounded-md border text-center shadow"
      >
        <div className="space-y-4 px-6 py-6">
          <Link href="/">
            <a className="flex items-center justify-center gap-4">
              <img
                src="/img/supabase-logo.svg"
                alt="Supabase"
                className="block h-[24px] cursor-pointer rounded"
              />
              {/* <h3 className="text-scale-1200">Supabase</h3> */}
            </a>
          </Link>
          <p className="text-scale-900 text-sm">
            Join {organization_name && email_match ? organization_name : 'a new organization'}
          </p>

          {!token_does_not_exist ? (
            <p className="text-scale-1200 text-xl">
              You have been invited to join{' '}
              {organization_name && email_match
                ? `${organization_name}'s organization`
                : 'a new organization'}{' '}
              at Supabase.
            </p>
          ) : (
            <div className="w-96" />
          )}
        </div>

        <div className="border-scale-400 border-t bg-amber-100">
          <div className="flex flex-col gap-4 px-6 py-6 ">
            {authorized_user && !expired_token && email_match && tokenInfoLoaded && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleJoinOrganization}
                  htmlType="submit"
                  loading={isSubmitting}
                  size="small"
                  type="primary"
                >
                  Join this organization
                </Button>

                <Button
                  onClick={handleDeclineJoinOrganization}
                  htmlType="submit"
                  size="small"
                  type="warning"
                >
                  Decline
                </Button>
              </div>
            )}

            {tokenInfoLoaded && (
              <div className="text-amber-1100 flex gap-4 text-base">
                {(tokenInfoLoaded && token_does_not_exist) ||
                  (tokenInfoLoaded && !email_match) ||
                  (tokenInfoLoaded && expired_token && (
                    <IconAlertCircle size={24} strokeWidth={2} />
                  ))}

                {tokenInfoLoaded && token_does_not_exist
                  ? 'The invite token is invalid. Try copying and pasting the link from the invite email, or ask the organization owner to invite you again.'
                  : tokenInfoLoaded && !email_match
                  ? 'The email address does not match. Are you signed in with right GitHub account?'
                  : tokenInfoLoaded && expired_token
                  ? 'The invite token has expired. Please request a new one from the organization owner.'
                  : ''}
              </div>
            )}
            {authorized_user && !expired_token && email_match && tokenInfoLoaded && (
              <div className="flex flex-row items-center gap-3">
                <Button onClick={handleDeclineJoinOrganization} size="small" type="text">
                  Decline
                </Button>

                <Button onClick={handleJoinOrganization} loading={isSubmitting} size="small">
                  Join this organization
                </Button>
              </div>
            )}
            {!authorized_user && (
              <div>
                <Link
                  passHref
                  href={`/?next=${encodeURIComponent(
                    `/join?token=${router.query.token}&slug=${router.query.slug}`
                  )}`}
                >
                  <Button size="medium" as="a" type="default">
                    Sign in
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default User
