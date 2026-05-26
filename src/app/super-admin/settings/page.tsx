"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Settings, User, Shield, Bell, Globe,
  Save, Loader2, ArrowLeft, Eye, EyeOff,
  CheckCircle, AlertCircle
} from "lucide-react"

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  two_fa_enabled: boolean
}

interface Platform {
  site_name: string
  logo_url: string
  support_email: string
  notify_new_school: boolean
  notify_new_user: boolean
  notify_billing: boolean
}

type Tab = "profile" | "platform" | "security" | "notifications"

type ToastType = "success" | "error"

export default function SettingsPage() {
  const [activeTab, setActiveTab]   = useState<Tab>("profile")
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{ msg: string; type: ToastType } | null>(null)

  // Profile
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", email: "", phone: "" })

  // Password
  const [pwForm, setPwForm]         = useState({ current_password: "", new_password: "", confirm_password: "" })
  const [showPw, setShowPw]         = useState({ current: false, new: false, confirm: false })

  // Platform
  const [platform, setPlatform]     = useState<Platform | null>(null)
  const [platformForm, setPlatformForm] = useState({ site_name: "", logo_url: "", support_email: "" })

  // Notifications
  const [notifForm, setNotifForm]   = useState({ notify_new_school: true, notify_new_user: true, notify_billing: true })

  // 2FA
  const [twoFA, setTwoFA]           = useState(false)
  const [togglingTwoFA, setTogglingTwoFA] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""

  const showToast = (msg: string, type: ToastType = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/super-admin/settings", {
      })
      const data = await res.json()
      setProfile(data.profile)
      setProfileForm({
        first_name: data.profile.first_name || "",
        last_name:  data.profile.last_name  || "",
        email:      data.profile.email      || "",
        phone:      data.profile.phone      || "",
      })
      setTwoFA(data.profile.two_fa_enabled)
      setPlatform(data.platform)
      setPlatformForm({
        site_name:     data.platform.site_name     || "",
        logo_url:      data.platform.logo_url      || "",
        support_email: data.platform.support_email || "",
      })
      setNotifForm({
        notify_new_school: data.platform.notify_new_school ?? true,
        notify_new_user:   data.platform.notify_new_user   ?? true,
        notify_billing:    data.platform.notify_billing    ?? true,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const save = async (type: string, body: object) => {
    setSaving(true)
    try {
      const res  = await fetch("/api/super-admin/settings", {
        method:  "PUT"`, "Content-Type": "application/json" },
        body:    JSON.stringify({ type, ...body }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || "Failed to save", "error"); return }
      showToast("Saved successfully!")
      if (type === "password") setPwForm({ current_password: "", new_password: "", confirm_password: "" })
    } catch {
      showToast("Network error", "error")
    } finally {
      setSaving(false)
    }
  }

  const toggleTwoFA = async () => {
    setTogglingTwoFA(true)
    try {
      const res = await fetch("/api/super-admin/settings", {
        method:  "PUT"`, "Content-Type": "application/json" },
        body:    JSON.stringify({ type: "2fa", two_fa_enabled: !twoFA }),
      })
      if (res.ok) {
        setTwoFA(!twoFA)
        showToast(`2FA ${!twoFA ? "enabled" : "disabled"} successfully`)
      }
    } finally {
      setTogglingTwoFA(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile",       label: "Profile",       icon: <User className="w-4 h-4" />    },
    { id: "platform",      label: "Platform",      icon: <Globe className="w-4 h-4" />   },
    { id: "security",      label: "Security",      icon: <Shield className="w-4 h-4" />  },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  return (
    <div className="w-full max-w-none p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" /> Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and platform preferences</p>
      </div>

      <div className="flex gap-6">

        {/* Sidebar Tabs */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">

          {/* ── Profile Tab ──────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg">Profile Information</h2>

              {/* Avatar preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {profileForm.first_name?.[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{profileForm.first_name} {profileForm.last_name}</p>
                  <p className="text-sm text-gray-500">{profileForm.email}</p>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Super Admin</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                  <input value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                  <input value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <button onClick={() => save("profile", profileForm)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          )}

          {/* ── Platform Tab ─────────────────────────────────── */}
          {activeTab === "platform" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg">Platform Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Site Name</label>
                  <input value={platformForm.site_name}
                    onChange={(e) => setPlatformForm({ ...platformForm, site_name: e.target.value })}
                    placeholder="EduFlow LMS"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Logo URL</label>
                  <input value={platformForm.logo_url}
                    onChange={(e) => setPlatformForm({ ...platformForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {platformForm.logo_url && (
                    <img src={platformForm.logo_url} alt="Logo preview"
                      className="mt-2 h-12 object-contain rounded border border-gray-200 p-1" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Support Email</label>
                  <input value={platformForm.support_email}
                    onChange={(e) => setPlatformForm({ ...platformForm, support_email: e.target.value })}
                    placeholder="support@eduflow.pk"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <button onClick={() => save("platform", platformForm)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Platform Settings
              </button>
            </div>
          )}

          {/* ── Security Tab ─────────────────────────────────── */}
          {activeTab === "security" && (
            <div className="space-y-6">

              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <h2 className="font-semibold text-gray-800 text-lg">Change Password</h2>
                <div className="space-y-4">
                  {[
                    { key: "current_password", label: "Current Password", show: showPw.current, toggle: () => setShowPw({ ...showPw, current: !showPw.current }) },
                    { key: "new_password",     label: "New Password",     show: showPw.new,     toggle: () => setShowPw({ ...showPw, new: !showPw.new })         },
                    { key: "confirm_password", label: "Confirm Password", show: showPw.confirm, toggle: () => setShowPw({ ...showPw, confirm: !showPw.confirm }) },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                      <div className="relative">
                        <input
                          type={f.show ? "text" : "password"}
                          value={pwForm[f.key as keyof typeof pwForm]}
                          onChange={(e) => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={f.toggle} type="button"
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {pwForm.new_password && pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                <button
                  onClick={() => {
                    if (pwForm.new_password !== pwForm.confirm_password) { showToast("Passwords do not match", "error"); return }
                    save("password", { current_password: pwForm.current_password, new_password: pwForm.new_password })
                  }}
                  disabled={saving || !pwForm.current_password || !pwForm.new_password || pwForm.new_password !== pwForm.confirm_password}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Password
                </button>
              </div>

              {/* 2FA */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800 text-lg">Two-Factor Authentication</h2>
                    <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button onClick={toggleTwoFA} disabled={togglingTwoFA}
                    className={`relative w-12 h-6 rounded-full transition ${twoFA ? "bg-indigo-600" : "bg-gray-300"} disabled:opacity-50`}>
                    {togglingTwoFA
                      ? <Loader2 className="w-3 h-3 animate-spin absolute top-1.5 left-4 text-white" />
                      : <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${twoFA ? "left-7" : "left-1"}`} />}
                  </button>
                </div>
                <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium w-fit ${twoFA ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {twoFA ? "2FA is enabled" : "2FA is disabled"}
                </div>
              </div>

            </div>
          )}

          {/* ── Notifications Tab ────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Choose which events trigger email notifications.</p>

              <div className="space-y-4">
                {[
                  { key: "notify_new_school", label: "New School Registered",    desc: "Get notified when a new school signs up" },
                  { key: "notify_new_user",   label: "New User Created",          desc: "Get notified when a new user is added"   },
                  { key: "notify_billing",    label: "Billing & Subscription",    desc: "Get notified on payment events"          },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifForm({ ...notifForm, [item.key]: !notifForm[item.key as keyof typeof notifForm] })}
                      className={`relative w-10 h-5 rounded-full transition ${notifForm[item.key as keyof typeof notifForm] ? "bg-indigo-600" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${notifForm[item.key as keyof typeof notifForm] ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => save("notifications", notifForm)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Notification Settings
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
