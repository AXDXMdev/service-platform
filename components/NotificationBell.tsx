"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Notification } from "@/app/types"
import { getNotificationsData, markAllNotificationsRead, markNotificationRead } from "@/lib/dashboardApi"
import { supabase } from "@/lib/supabaseClient"

function notificationHref(notification: Notification) {
  if (notification.request_id) return `/dashboard/requests/${notification.request_id}`
  return "/dashboard/inbox"
}

function shortTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(diff) || diff < 60_000) return "jetzt"
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function NotificationBell() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = async () => {
    if (!loggedIn) return
    setLoading(true)
    try {
      const data = await getNotificationsData()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setLoggedIn(Boolean(data.session))
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setLoggedIn(Boolean(session))
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    let active = true
    getNotificationsData()
      .then((data) => {
        if (!active) return
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      })
      .catch(() => {
        if (!active) return
        setNotifications([])
        setUnreadCount(0)
      })
    return () => {
      active = false
    }
  }, [loggedIn])

  if (!loggedIn) return null

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-secondary relative min-h-10 min-w-10 rounded-[10px] px-3 py-2 text-sm font-semibold"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
          if (!open) void load()
        }}
      >
        <span aria-hidden className="text-xs font-black">N</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-20 z-50 rounded-[14px] border border-[var(--surface-border)] bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.22)] dark:bg-slate-950 sm:absolute sm:right-0 sm:left-auto sm:top-12 sm:w-96">
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <p className="font-semibold text-slate-950 dark:text-slate-100">Notifications</p>
            <button
              type="button"
              className="text-xs font-semibold text-[var(--brand)] hover:underline"
              onClick={async () => {
                await markAllNotificationsRead().catch(() => undefined)
                setNotifications((current) =>
                  current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() }))
                )
                setUnreadCount(0)
              }}
            >
              Alle gelesen
            </button>
          </div>

          <div className="max-h-[70vh] space-y-2 overflow-y-auto sm:max-h-96">
            {loading && <div className="h-16 animate-pulse rounded-[10px] bg-slate-100 dark:bg-slate-800" />}
            {!loading && notifications.length === 0 && (
              <div className="rounded-[10px] bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Keine Notifications.
              </div>
            )}
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notificationHref(notification)}
                className={`block rounded-[10px] p-3 transition hover:bg-slate-50 dark:hover:bg-slate-900 ${
                  notification.read_at ? "bg-transparent" : "bg-[var(--brand)]/10"
                }`}
                onClick={() => {
                  setOpen(false)
                  if (!notification.read_at) {
                    void markNotificationRead(notification.id).catch(() => undefined)
                    setNotifications((current) =>
                      current.map((item) =>
                        item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
                      )
                    )
                    setUnreadCount((current) => Math.max(0, current - 1))
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {notification.body}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">
                    {shortTime(notification.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/dashboard/inbox"
            className="mt-3 block rounded-[10px] bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            onClick={() => setOpen(false)}
          >
            Zur Inbox
          </Link>
        </div>
      )}
    </div>
  )
}
