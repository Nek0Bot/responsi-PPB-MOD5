
import { useEffect, useState } from 'react'
import profileService from '../services/profileService.js'

const ID_KEY = 'studymate-profile-id-v2'
const CACHE_KEY = 'studymate-profile-cache-v2'

const read = (k) => {
  try { return localStorage.getItem(k) }
  catch { return null }
}

const write = (k, v) => {
  try { localStorage.setItem(k, v) }
  catch { /* abaikan */ }
}

const clear = (k) => {
  try { localStorage.removeItem(k) }
  catch { /* abaikan */ }
}

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const remember = (p) => {
    setProfile(p)
    write(ID_KEY, p.id)
    write(CACHE_KEY, JSON.stringify(p))
  }

  const logout = () => {
    setProfile(null)
    clear(ID_KEY)
    clear(CACHE_KEY)
  }

  useEffect(() => {
    const id = read(ID_KEY)

    if (!id) {
      setProfileLoading(false)
      return
    }

    let cancelled = false

    profileService.getById(id)
      .then(p => {
        if (!cancelled) {
          p ? remember(p) : logout()
        }
      })
      .catch(() => {
        if (cancelled) return

        try {
          const c = JSON.parse(read(CACHE_KEY))
          if (c?.id === id) setProfile(c)
        } catch { /* abaikan */ }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const saveProfile = async (form) => {
    if (profile) {
      const updated = await profileService.update(profile.id, form)
      remember(updated)
      return updated
    }

    const existing = await profileService.getByNim(form.nim)

    if (existing) {
      if (!confirm(`NIM ${form.nim} sudah terdaftar atas nama ${existing.name}. Masuk sebagai profil ini?`)) {
        return null
      }

      remember(existing)
      return existing
    }

    const created = await profileService.create(form)
    remember(created)
    return created
  }

  const deleteProfile = async () => {
    if (!profile) return

    await profileService.remove(profile.id)
    logout()
  }

  return {
    profile,
    profileLoading,
    saveProfile,
    deleteProfile,
    logout
  }
}
