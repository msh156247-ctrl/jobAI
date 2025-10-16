import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables')
}

// Mock 모드 (테스트용)
const mockUsers = new Map()
const mockProfiles = new Map()
const mockUserProfiles = new Map()
const mockCompanyProfiles = new Map()
const mockJobs = new Map()
const mockApplications = new Map()
const mockChatRooms = new Map()
const mockMessages = new Map()
const mockNotifications = new Map()

// Real-time subscription management
const activeSubscriptions = new Map()
const channelCallbacks = new Map()

// Helper function to trigger real-time callbacks
function triggerRealtimeCallback(table: string, event: string, record: any) {
  const callbacks = channelCallbacks.get(`${table}:${record.room_id || record.id}`)
  if (callbacks) {
    callbacks.forEach((callback: any) => {
      setTimeout(() => callback({ new: record }), 10)
    })
  }
}

let currentUser: any = null
let authStateChangeCallback: any = null

export const supabase = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      const userId = `user-${Date.now()}`
      const user = {
        id: userId,
        email,
        email_confirmed_at: new Date().toISOString(), // Mock에서는 즉시 인증 완료
        user_metadata: options?.data || {}
      }
      mockUsers.set(userId, { ...user, password })

      // 자동으로 profiles 테이블에 기본 레코드 생성
      mockProfiles.set(userId, {
        id: userId,
        email,
        full_name: options?.data?.full_name || null,
        role: options?.data?.role || 'user',
        created_at: new Date().toISOString()
      })

      currentUser = user

      console.log('Mock SignUp Success:', email)
      console.log('User role:', options?.data?.role || 'user')

      // 회원가입 성공 시 AuthContext 콜백 호출
      setTimeout(() => {
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_IN', { user: currentUser })
        }
      }, 100)

      return {
        data: {
          user,
          session: {
            access_token: `mock-token-${userId}`,
            user: user
          }
        },
        error: null
      }
    },

    signInWithPassword: async ({ email, password }: any) => {
      console.log('Mock Login attempt:', email)
      console.log('Available users:', Array.from(mockUsers.values()).map(u => ({ email: u.email, id: u.id })))

      const user = Array.from(mockUsers.values()).find((u: any) => u.email === email && u.password === password)

      if (user) {
        const userSession = {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          user_metadata: user.user_metadata || {}
        }

        currentUser = userSession

        console.log('Login successful for:', email, 'with user:', userSession)

        // 로그인 성공 시 AuthContext 콜백 호출
        setTimeout(() => {
          if (authStateChangeCallback) {
            authStateChangeCallback('SIGNED_IN', { user: currentUser })
          }
        }, 100)

        return {
          data: {
            user: currentUser,
            session: {
              access_token: `mock-token-${user.id}`,
              user: currentUser
            }
          },
          error: null
        }
      }

      console.log('Login failed for:', email)
      console.log('Password check failed. Expected:', password)
      return {
        data: { user: null, session: null },
        error: { message: '이메일 또는 비밀번호가 잘못되었습니다.' }
      }
    },

    signOut: async () => {
      currentUser = null
      return { error: null }
    },

    getUser: async () => {
      return {
        data: { user: currentUser },
        error: null
      }
    },

    onAuthStateChange: (callback: any) => {
      // 콜백 저장
      authStateChangeCallback = callback

      // Mock implementation - setTimeout으로 초기 상태 설정
      setTimeout(() => {
        callback(currentUser ? 'SIGNED_IN' : 'SIGNED_OUT', currentUser ? { user: currentUser } : null)
      }, 100)

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authStateChangeCallback = null
            }
          }
        },
        error: null
      }
    },

    getSession: async () => {
      return {
        data: {
          session: currentUser ? { user: currentUser, access_token: `mock-token-${currentUser.id}` } : null
        },
        error: null
      }
    }
  },

  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          let data = null
          if (table === 'profiles') {
            data = mockProfiles.get(value) || null
          } else if (table === 'user_profiles') {
            data = Array.from(mockUserProfiles.values()).find((p: any) => p.user_id === value) || null
          } else if (table === 'company_profiles') {
            data = Array.from(mockCompanyProfiles.values()).find((p: any) => p.user_id === value) || null
          } else if (table === 'jobs') {
            data = mockJobs.get(value) || null
          } else if (table === 'chat_rooms') {
            data = mockChatRooms.get(value) || null
          } else if (table === 'messages') {
            data = mockMessages.get(value) || null
          } else if (table === 'notifications') {
            data = mockNotifications.get(value) || null
          }
          return { data, error: null }
        },
        order: (column: string, options: any = {}) => ({
          limit: (count: number) => ({
            then: async (callback: any) => {
              let data = []
              if (table === 'profiles') {
                data = [mockProfiles.get(value)].filter(Boolean)
              } else if (table === 'user_profiles') {
                data = Array.from(mockUserProfiles.values()).filter((p: any) => p.user_id === value)
              } else if (table === 'company_profiles') {
                data = Array.from(mockCompanyProfiles.values()).filter((p: any) => p.user_id === value)
              } else if (table === 'jobs') {
                data = Array.from(mockJobs.values()).filter((j: any) => j.company_id === value)
              } else if (table === 'applications') {
                data = Array.from(mockApplications.values()).filter((a: any) => a.job_id === value)
              } else if (table === 'chat_rooms') {
                data = Array.from(mockChatRooms.values()).filter((c: any) => c.application_id === value)
              } else if (table === 'messages') {
                data = Array.from(mockMessages.values()).filter((m: any) => m.room_id === value)
              } else if (table === 'notifications') {
                data = Array.from(mockNotifications.values()).filter((n: any) => n.user_id === value)
              }

              // 정렬 적용
              if (column && data.length > 0) {
                data.sort((a: any, b: any) => {
                  const aVal = a[column]
                  const bVal = b[column]
                  if (options.ascending === false) {
                    return bVal > aVal ? 1 : -1
                  }
                  return aVal > bVal ? 1 : -1
                })
              }

              // 제한 적용
              data = data.slice(0, count)

              return callback({ data, error: null })
            }
          }),
          then: async (callback: any) => {
            let data = []
            if (table === 'profiles') {
              data = [mockProfiles.get(value)].filter(Boolean)
            } else if (table === 'user_profiles') {
              data = Array.from(mockUserProfiles.values()).filter((p: any) => p.user_id === value)
            } else if (table === 'company_profiles') {
              data = Array.from(mockCompanyProfiles.values()).filter((p: any) => p.user_id === value)
            } else if (table === 'jobs') {
              data = Array.from(mockJobs.values()).filter((j: any) => j.company_id === value)
            } else if (table === 'applications') {
              data = Array.from(mockApplications.values()).filter((a: any) => a.job_id === value)
            }

            // 정렬 적용
            if (column && data.length > 0) {
              data.sort((a: any, b: any) => {
                const aVal = a[column]
                const bVal = b[column]
                if (options.ascending === false) {
                  return bVal > aVal ? 1 : -1
                }
                return aVal > bVal ? 1 : -1
              })
            }

            return callback({ data, error: null })
          }
        }),
        limit: (count: number) => ({
          then: async (callback: any) => {
            let data = []
            if (table === 'profiles') {
              data = [mockProfiles.get(value)].filter(Boolean)
            } else if (table === 'user_profiles') {
              data = Array.from(mockUserProfiles.values()).filter((p: any) => p.user_id === value)
            } else if (table === 'company_profiles') {
              data = Array.from(mockCompanyProfiles.values()).filter((p: any) => p.user_id === value)
            } else if (table === 'jobs') {
              data = Array.from(mockJobs.values()).filter((j: any) => j.company_id === value)
            } else if (table === 'applications') {
              data = Array.from(mockApplications.values()).filter((a: any) => a.job_id === value)
            }

            // 제한 적용
            data = data.slice(0, count)

            return callback({ data, error: null })
          }
        }),
        then: async (callback: any) => {
          let data = []
          if (table === 'profiles') {
            data = [mockProfiles.get(value)].filter(Boolean)
          } else if (table === 'user_profiles') {
            data = Array.from(mockUserProfiles.values()).filter((p: any) => p.user_id === value)
          } else if (table === 'company_profiles') {
            data = Array.from(mockCompanyProfiles.values()).filter((p: any) => p.user_id === value)
          } else if (table === 'jobs') {
            data = Array.from(mockJobs.values()).filter((j: any) => j.company_id === value)
          } else if (table === 'applications') {
            data = Array.from(mockApplications.values()).filter((a: any) => a.job_id === value)
          }
          return callback({ data, error: null })
        }
      }),
      ilike: (column: string, pattern: string) => ({
        order: (sortColumn: string, options: any = {}) => ({
          limit: (count: number) => ({
            then: async (callback: any) => {
              let data = []
              if (table === 'jobs') {
                data = Array.from(mockJobs.values())
              }

              // ilike 필터 적용
              const searchTerm = pattern.replace(/%/g, '')
              data = data.filter((item: any) => {
                const value = item[column]
                return value && value.toLowerCase().includes(searchTerm.toLowerCase())
              })

              // 정렬 적용
              if (sortColumn && data.length > 0) {
                data.sort((a: any, b: any) => {
                  const aVal = a[sortColumn]
                  const bVal = b[sortColumn]
                  if (options.ascending === false) {
                    return bVal > aVal ? 1 : -1
                  }
                  return aVal > bVal ? 1 : -1
                })
              }

              // 제한 적용
              data = data.slice(0, count)

              return callback({ data, error: null })
            }
          }),
          then: async (callback: any) => {
            let data = []
            if (table === 'jobs') {
              data = Array.from(mockJobs.values())
            }

            // ilike 필터 적용
            const searchTerm = pattern.replace(/%/g, '')
            data = data.filter((item: any) => {
              const value = item[column]
              return value && value.toLowerCase().includes(searchTerm.toLowerCase())
            })

            // 정렬 적용
            if (sortColumn && data.length > 0) {
              data.sort((a: any, b: any) => {
                const aVal = a[sortColumn]
                const bVal = b[sortColumn]
                if (options.ascending === false) {
                  return bVal > aVal ? 1 : -1
                }
                return aVal > bVal ? 1 : -1
              })
            }

            return callback({ data, error: null })
          }
        }),
        then: async (callback: any) => {
          let data = []
          if (table === 'jobs') {
            data = Array.from(mockJobs.values())
          }

          // ilike 필터 적용
          const searchTerm = pattern.replace(/%/g, '')
          data = data.filter((item: any) => {
            const value = item[column]
            return value && value.toLowerCase().includes(searchTerm.toLowerCase())
          })

          return callback({ data, error: null })
        }
      }),
      or: (conditions: string) => ({
        order: (sortColumn: string, options: any = {}) => ({
          limit: (count: number) => ({
            then: async (callback: any) => {
              let data = []
              if (table === 'jobs') {
                data = Array.from(mockJobs.values())
              }

              // or 조건 처리 (간단한 구현)
              // 예: "title.ilike.%term%,description.ilike.%term%"
              data = data.filter((item: any) => {
                // 간단한 title, description 검색 구현
                const searchTerm = conditions.match(/%([^%]+)%/)?.[1] || ''
                return (
                  item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              })

              // 정렬 적용
              if (sortColumn && data.length > 0) {
                data.sort((a: any, b: any) => {
                  const aVal = a[sortColumn]
                  const bVal = b[sortColumn]
                  if (options.ascending === false) {
                    return bVal > aVal ? 1 : -1
                  }
                  return aVal > bVal ? 1 : -1
                })
              }

              // 제한 적용
              data = data.slice(0, count)

              return callback({ data, error: null })
            }
          }),
          then: async (callback: any) => {
            let data = []
            if (table === 'jobs') {
              data = Array.from(mockJobs.values())
            }

            // or 조건 처리
            data = data.filter((item: any) => {
              const searchTerm = conditions.match(/%([^%]+)%/)?.[1] || ''
              return (
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            })

            // 정렬 적용
            if (sortColumn && data.length > 0) {
              data.sort((a: any, b: any) => {
                const aVal = a[sortColumn]
                const bVal = b[sortColumn]
                if (options.ascending === false) {
                  return bVal > aVal ? 1 : -1
                }
                return aVal > bVal ? 1 : -1
              })
            }

            return callback({ data, error: null })
          }
        }),
        then: async (callback: any) => {
          let data = []
          if (table === 'jobs') {
            data = Array.from(mockJobs.values())
          }

          // or 조건 처리
          data = data.filter((item: any) => {
            const searchTerm = conditions.match(/%([^%]+)%/)?.[1] || ''
            return (
              item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          })

          return callback({ data, error: null })
        }
      }),
      range: (start: number, end: number) => ({
        then: async (callback: any) => {
          let data = []
          if (table === 'jobs') {
            data = Array.from(mockJobs.values())
          }

          // range 적용
          data = data.slice(start, end + 1)

          return callback({ data, error: null })
        }
      }),
      order: (column: string, options: any = {}) => ({
        limit: (count: number) => ({
          then: async (callback: any) => {
            let data = []
            if (table === 'jobs') {
              data = Array.from(mockJobs.values())
            } else if (table === 'applications') {
              data = Array.from(mockApplications.values())
            } else if (table === 'profiles') {
              data = Array.from(mockProfiles.values())
            } else if (table === 'user_profiles') {
              data = Array.from(mockUserProfiles.values())
            } else if (table === 'company_profiles') {
              data = Array.from(mockCompanyProfiles.values())
            }

            // 정렬 적용
            if (column && data.length > 0) {
              data.sort((a: any, b: any) => {
                const aVal = a[column]
                const bVal = b[column]
                if (options.ascending === false) {
                  return bVal > aVal ? 1 : -1
                }
                return aVal > bVal ? 1 : -1
              })
            }

            // 제한 적용
            data = data.slice(0, count)

            return callback({ data, error: null })
          }
        }),
        then: async (callback: any) => {
          let data = []
          if (table === 'jobs') {
            data = Array.from(mockJobs.values())
          } else if (table === 'applications') {
            data = Array.from(mockApplications.values())
          } else if (table === 'profiles') {
            data = Array.from(mockProfiles.values())
          } else if (table === 'user_profiles') {
            data = Array.from(mockUserProfiles.values())
          } else if (table === 'company_profiles') {
            data = Array.from(mockCompanyProfiles.values())
          }

          // 정렬 적용
          if (column && data.length > 0) {
            data.sort((a: any, b: any) => {
              const aVal = a[column]
              const bVal = b[column]
              if (options.ascending === false) {
                return bVal > aVal ? 1 : -1
              }
              return aVal > bVal ? 1 : -1
            })
          }

          return callback({ data, error: null })
        }
      }),
      limit: (count: number) => ({
        then: async (callback: any) => {
          let data = []
          if (table === 'profiles') {
            data = Array.from(mockProfiles.values())
          } else if (table === 'user_profiles') {
            data = Array.from(mockUserProfiles.values())
          } else if (table === 'company_profiles') {
            data = Array.from(mockCompanyProfiles.values())
          } else if (table === 'jobs') {
            data = Array.from(mockJobs.values())
          }

          // 제한 적용
          data = data.slice(0, count)

          return callback({ data, error: null })
        }
      }),
      then: async (callback: any) => {
        let data = []
        if (table === 'profiles') {
          data = Array.from(mockProfiles.values())
        } else if (table === 'user_profiles') {
          data = Array.from(mockUserProfiles.values())
        } else if (table === 'company_profiles') {
          data = Array.from(mockCompanyProfiles.values())
        } else if (table === 'jobs') {
          data = Array.from(mockJobs.values())
        } else if (table === 'chat_rooms') {
          data = Array.from(mockChatRooms.values())
        } else if (table === 'messages') {
          data = Array.from(mockMessages.values())
        } else if (table === 'notifications') {
          data = Array.from(mockNotifications.values())
        }
        return callback({ data, error: null })
      }
    }),

    insert: (records: any[]) => ({
      select: () => ({
        single: async () => {
          const record = Array.isArray(records) ? records[0] : records
          const id = record.id || `${table}-${Date.now()}`
          const newRecord = { ...record, id, created_at: new Date().toISOString() }

          if (table === 'profiles') {
            mockProfiles.set(id, newRecord)
          } else if (table === 'user_profiles') {
            mockUserProfiles.set(id, newRecord)
          } else if (table === 'company_profiles') {
            mockCompanyProfiles.set(id, newRecord)
          } else if (table === 'jobs') {
            mockJobs.set(id, newRecord)
          } else if (table === 'applications') {
            mockApplications.set(id, newRecord)
          } else if (table === 'chat_rooms') {
            mockChatRooms.set(id, newRecord)
          } else if (table === 'messages') {
            mockMessages.set(id, newRecord)
            // Trigger real-time subscription callbacks for messages
            triggerRealtimeCallback('messages', 'INSERT', newRecord)
          } else if (table === 'notifications') {
            mockNotifications.set(id, newRecord)
          }

          return { data: newRecord, error: null }
        }
      })
    }),

    update: (updates: any) => ({
      eq: (column: string, value: any) => ({
        then: async (callback?: any) => {
          let updated = false
          if (table === 'profiles') {
            if (mockProfiles.has(value)) {
              mockProfiles.set(value, { ...mockProfiles.get(value), ...updates, updated_at: new Date().toISOString() })
              updated = true
            }
          } else if (table === 'user_profiles') {
            for (const [id, profile] of mockUserProfiles) {
              if ((profile as any)[column] === value) {
                mockUserProfiles.set(id, { ...profile, ...updates, updated_at: new Date().toISOString() })
                updated = true
                break
              }
            }
          } else if (table === 'company_profiles') {
            for (const [id, profile] of mockCompanyProfiles) {
              if ((profile as any)[column] === value) {
                mockCompanyProfiles.set(id, { ...profile, ...updates, updated_at: new Date().toISOString() })
                updated = true
                break
              }
            }
          } else if (table === 'jobs') {
            if (mockJobs.has(value)) {
              mockJobs.set(value, { ...mockJobs.get(value), ...updates, updated_at: new Date().toISOString() })
              updated = true
            }
          } else if (table === 'chat_rooms') {
            if (mockChatRooms.has(value)) {
              mockChatRooms.set(value, { ...mockChatRooms.get(value), ...updates, updated_at: new Date().toISOString() })
              updated = true
            }
          } else if (table === 'applications') {
            if (mockApplications.has(value)) {
              mockApplications.set(value, { ...mockApplications.get(value), ...updates, updated_at: new Date().toISOString() })
              updated = true
            }
          }

          if (callback) {
            return callback({ error: updated ? null : new Error('Record not found') })
          }
          return { error: updated ? null : new Error('Record not found') }
        }
      })
    })
  }),

  // 기타 필요한 메서드들
  channel: (channelName: string) => {
    const subscriptions = new Set()

    return {
      on: (event: string, config: any, callback: Function) => {
        return {
          subscribe: () => {
            const subscriptionId = `${channelName}_${Date.now()}_${Math.random()}`
            activeSubscriptions.set(subscriptionId, { channelName, event, config, callback })

            // Store callback for triggering later
            if (config.table && config.filter) {
              const filterMatch = config.filter.match(/room_id=eq\.(.+)/)
              if (filterMatch) {
                const roomId = filterMatch[1]
                const key = `${config.table}:${roomId}`
                if (!channelCallbacks.has(key)) {
                  channelCallbacks.set(key, new Set())
                }
                channelCallbacks.get(key).add(callback)
              }
            }

            return {
              unsubscribe: () => {
                activeSubscriptions.delete(subscriptionId)
                if (config.table && config.filter) {
                  const filterMatch = config.filter.match(/room_id=eq\.(.+)/)
                  if (filterMatch) {
                    const roomId = filterMatch[1]
                    const key = `${config.table}:${roomId}`
                    if (channelCallbacks.has(key)) {
                      channelCallbacks.get(key).delete(callback)
                    }
                  }
                }
              }
            }
          }
        }
      },
      subscribe: () => ({
        unsubscribe: () => {
          // Cleanup all subscriptions for this channel
          for (const [id, sub] of activeSubscriptions) {
            if ((sub as any).channelName === channelName) {
              activeSubscriptions.delete(id)
            }
          }
        }
      })
    }
  },
  removeChannel: (channel: any) => {
    // In a real implementation, this would clean up the channel
    if (channel && channel.unsubscribe) {
      channel.unsubscribe()
    }
  }
} as any

// Mock 데이터 초기화 (테스트용) - 한 번만 실행
let isInitialized = false

if (!isInitialized) {
  setTimeout(() => {
    // 테스트 사용자 추가 (중복 방지)
    const testUserId = 'user-test-1'

    if (!mockUsers.has(testUserId)) {
      const testUser = {
        id: testUserId,
        email: 'msh1562@naver.com',
        password: '123456', // 간단한 테스트 비밀번호
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { role: 'user' }
      }

      mockUsers.set(testUserId, testUser)
      mockProfiles.set(testUserId, {
        id: testUserId,
        email: 'msh1562@naver.com',
        full_name: '명성현',
        role: 'user',
        created_at: new Date().toISOString()
      })

      console.log('Test user added:', testUser.email, 'password:', testUser.password)
      console.log('All mock users:', Array.from(mockUsers.values()).map(u => ({ email: u.email, id: u.id })))

      // 샘플 채용공고 추가
      const sampleJobs = [
        {
          id: 'job-1',
          title: 'Frontend 개발자',
          description: 'React, TypeScript를 활용한 웹 개발자를 모집합니다. 모던한 프론트엔드 기술을 사용하여 사용자 경험을 개선하는 일을 담당합니다.',
          requirements: ['React', 'TypeScript', 'JavaScript'],
          skills_required: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
          salary_min: 3000,
          salary_max: 5000,
          location: '서울',
          type: 'full-time',
          status: 'active',
          experience_level: 'junior',
          company_id: 'company-1',
          created_at: new Date().toISOString(),
          company_profiles: {
            company_name: '테크 스타트업',
            description: '혁신적인 기술 회사'
          }
        },
        {
          id: 'job-2',
          title: 'Backend 개발자',
          description: 'Node.js와 Python을 활용한 서버 개발자를 모집합니다. 확장 가능한 API를 설계하고 구현하는 일을 담당합니다.',
          requirements: ['Node.js', 'Python', 'MySQL', 'AWS'],
          skills_required: ['Node.js', 'Python', 'MySQL', 'AWS', 'Docker'],
          salary_min: 3500,
          salary_max: 6000,
          location: '서울',
          type: 'full-time',
          status: 'active',
          experience_level: 'mid',
          company_id: 'company-2',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          company_profiles: {
            company_name: '클라우드 솔루션',
            description: '클라우드 기반 솔루션 제공 회사'
          }
        },
        {
          id: 'job-3',
          title: 'Full Stack 개발자',
          description: '프론트엔드와 백엔드를 모두 다룰 수 있는 풀스택 개발자를 모집합니다. React와 Spring Boot를 주로 사용합니다.',
          requirements: ['React', 'Spring Boot', 'Java', 'MySQL'],
          skills_required: ['React', 'Spring Boot', 'Java', 'MySQL', 'Git'],
          salary_min: 4000,
          salary_max: 7000,
          location: '부산',
          type: 'full-time',
          status: 'active',
          experience_level: 'senior',
          company_id: 'company-3',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          company_profiles: {
            company_name: '핀테크 솔루션',
            description: '금융 기술 솔루션 개발 회사'
          }
        },
        {
          id: 'job-4',
          title: 'UI/UX 디자이너',
          description: '사용자 중심의 디자인을 통해 최고의 사용자 경험을 만들어갈 디자이너를 모집합니다.',
          requirements: ['Figma', 'Adobe XD', 'Photoshop'],
          skills_required: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator'],
          salary_min: 2800,
          salary_max: 4500,
          location: '서울',
          type: 'full-time',
          status: 'active',
          experience_level: 'junior',
          company_id: 'company-1',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          company_profiles: {
            company_name: '테크 스타트업',
            description: '혁신적인 기술 회사'
          }
        },
        {
          id: 'job-5',
          title: 'DevOps 엔지니어',
          description: 'CI/CD 파이프라인 구축과 인프라 자동화를 담당할 DevOps 엔지니어를 모집합니다.',
          requirements: ['Docker', 'Kubernetes', 'AWS', 'Jenkins'],
          skills_required: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform'],
          salary_min: 4500,
          salary_max: 8000,
          location: '원격근무',
          type: 'full-time',
          status: 'active',
          experience_level: 'senior',
          company_id: 'company-4',
          created_at: new Date(Date.now() - 345600000).toISOString(),
          company_profiles: {
            company_name: '인프라 테크',
            description: '클라우드 인프라 전문 회사'
          }
        }
      ]

      sampleJobs.forEach(job => {
        if (!mockJobs.has(job.id)) {
          mockJobs.set(job.id, job)
        }
      })

      console.log('Sample jobs added:', sampleJobs.length, 'jobs')

      // 샘플 지원서 추가
      const sampleApplications = [
        {
          id: 'app-1',
          user_id: testUserId,
          job_id: 'job-1',
          cover_letter: 'React 개발에 관심이 많아 지원하게 되었습니다.',
          status: 'applied',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          profiles: {
            full_name: '명성현',
            email: 'msh1562@naver.com'
          },
          jobs: {
            title: 'Frontend 개발자',
            company_profiles: {
              company_name: '테크 스타트업'
            }
          }
        }
      ]

      sampleApplications.forEach(app => {
        if (!mockApplications.has(app.id)) {
          mockApplications.set(app.id, app)
        }
      })

      // 샘플 채팅룸 추가
      const sampleChatRooms = [
        {
          id: 'chat-1',
          application_id: 'app-1',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          applications: {
            id: 'app-1',
            user_id: testUserId,
            job_id: 'job-1',
            jobs: {
              title: 'Frontend 개발자',
              company_profiles: {
                company_name: '테크 스타트업'
              }
            },
            profiles: {
              full_name: '명성현',
              email: 'msh1562@naver.com'
            }
          }
        }
      ]

      sampleChatRooms.forEach(room => {
        if (!mockChatRooms.has(room.id)) {
          mockChatRooms.set(room.id, room)
        }
      })

      // 샘플 메시지 추가
      const sampleMessages = [
        {
          id: 'msg-1',
          room_id: 'chat-1',
          sender_id: testUserId,
          content: '안녕하세요! Frontend 개발자 포지션에 지원한 명성현입니다. 관련해서 궁금한 점이 있어서 연락드립니다.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          profiles: {
            full_name: '명성현',
            email: 'msh1562@naver.com'
          }
        },
        {
          id: 'msg-2',
          room_id: 'chat-1',
          sender_id: 'company-user-1',
          content: '안녕하세요! 지원해주셔서 감사합니다. 궁금한 점이 있으시면 언제든지 말씀해주세요.',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          profiles: {
            full_name: 'HR 담당자',
            email: 'hr@techstartup.com'
          }
        }
      ]

      sampleMessages.forEach(msg => {
        if (!mockMessages.has(msg.id)) {
          mockMessages.set(msg.id, msg)
        }
      })

      console.log('Sample applications, chat rooms, and messages added')
    }
  }, 100)

  isInitialized = true
}