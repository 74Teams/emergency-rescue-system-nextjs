import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
} from 'axios'
import { apiBaseUrl, apiRoutes } from './endpoints'
import {
    clearStoredAuthSession,
    getStoredAccessToken,
    getStoredRefreshToken,
    setStoredAuthSession,
} from './storage'
import type { ApiErrorResponse, AuthTokenPayload } from './types'

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean
}

export type AuthRefreshHandler = (
    refreshToken: string
) => Promise<AuthTokenPayload | null>

let refreshHandler: AuthRefreshHandler | null = null

let isRefreshing = false
let refreshPromise: Promise<AuthTokenPayload | null> | null = null

function redirectToLoginIfNeeded() {
    if (typeof window !== 'undefined') {
        const pathname = window.location.pathname
        const isPublic =
            pathname === '/' ||
            pathname.startsWith('/sos') ||
            pathname.startsWith('/map') ||
            pathname.startsWith('/login') ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/forgot-password') ||
            pathname.startsWith('/pending-approval')

        if (!isPublic) {
            window.location.replace(
                `/login?redirect=${encodeURIComponent(pathname)}`
            )
        }
    }
}

export function setAuthRefreshHandler(handler: AuthRefreshHandler | null) {
    refreshHandler = handler
}

export const apiClient: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        Accept: 'application/json',
    },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const accessToken = getStoredAccessToken()

    if (accessToken) {
        config.headers = config.headers ?? {}
        ;(config.headers as Record<string, string>).Authorization =
            `Bearer ${accessToken}`
    }

    if (config.data instanceof FormData) {
        config.headers = config.headers ?? {}
        delete (config.headers as Record<string, unknown>)['Content-Type']
    }

    return config
})

const isoDateWithoutZRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

function appendZToDates(obj: unknown) {
    if (obj === null || typeof obj !== 'object') return

    for (const key of Object.keys(obj as Record<string, unknown>)) {
        const value = (obj as Record<string, unknown>)[key]
        if (typeof value === 'string' && isoDateWithoutZRegex.test(value)) {
            ;(obj as Record<string, unknown>)[key] = value + 'Z'
        } else if (typeof value === 'object' && value !== null) {
            appendZToDates(value)
        }
    }
}

apiClient.interceptors.response.use(
    response => {
        if (response.data) {
            appendZToDates(response.data)
        }
        return response
    },
    async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as
            | RetryableRequestConfig
            | undefined

        if (!originalRequest || error.response?.status !== 401) {
            return Promise.reject(error)
        }

        // Check if the request is an authentication route (e.g. login, refresh) to avoid infinite loops
        const isAuthRoute =
            originalRequest.url?.includes(apiRoutes.auth.login) ||
            originalRequest.url?.includes(apiRoutes.auth.register) ||
            originalRequest.url?.includes(apiRoutes.auth.forgotPassword) ||
            originalRequest.url?.includes(apiRoutes.auth.resetPassword) ||
            originalRequest.url?.includes(apiRoutes.auth.refresh)

        if (isAuthRoute) {
            if (originalRequest.url?.includes(apiRoutes.auth.refresh)) {
                clearStoredAuthSession()
                redirectToLoginIfNeeded()
            }
            return Promise.reject(error)
        }

        if (originalRequest._retry) {
            clearStoredAuthSession()
            redirectToLoginIfNeeded()
            return Promise.reject(error)
        }

        const refreshToken = getStoredRefreshToken()
        if (!refreshToken || !refreshHandler) {
            clearStoredAuthSession()
            redirectToLoginIfNeeded()
            return Promise.reject(error)
        }

        originalRequest._retry = true

        // Use a shared promise to prevent multiple concurrent refresh requests
        if (!isRefreshing) {
            isRefreshing = true
            refreshPromise = refreshHandler(refreshToken)
                .then(session => {
                    isRefreshing = false
                    refreshPromise = null
                    return session
                })
                .catch(() => {
                    isRefreshing = false
                    refreshPromise = null
                    return null
                })
        }

        try {
            const nextSession = await refreshPromise
            if (!nextSession) {
                clearStoredAuthSession()
                redirectToLoginIfNeeded()
                return Promise.reject(error)
            }

            setStoredAuthSession(nextSession)
            originalRequest.headers = originalRequest.headers ?? {}
            ;(originalRequest.headers as Record<string, string>).Authorization =
                `Bearer ${nextSession.accessToken}`
            return apiClient(originalRequest)
        } catch {
            clearStoredAuthSession()
            redirectToLoginIfNeeded()
            return Promise.reject(error)
        }
    }
)

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.request<T>(config)
    return response.data
}

export function getApiErrorMessage(error: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const data = error.response?.data
        if (data?.errors?.length) {
            return data.errors
                .map(item => item.message)
                .filter(Boolean)
                .join('. ')
        }
        if (
            data?.errors &&
            typeof data.errors === 'object' &&
            !Array.isArray(data.errors)
        ) {
            const messages = Object.values(
                data.errors as Record<string, string[]>
            )
                .flat()
                .filter(Boolean)
            if (messages.length) return messages.join('. ')
        }
        return data?.message ?? error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'Unexpected API error'
}
