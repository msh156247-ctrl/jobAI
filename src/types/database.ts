export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'user' | 'company'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'user' | 'company'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'user' | 'company'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          skills: string[]
          career_years: number
          location: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skills?: string[]
          career_years?: number
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skills?: string[]
          career_years?: number
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      company_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          description: string | null
          industry: string | null
          location: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          description?: string | null
          industry?: string | null
          location?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          description?: string | null
          industry?: string | null
          location?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string
          requirements: string[]
          salary_min: number | null
          salary_max: number | null
          location: string | null
          type: 'full-time' | 'part-time' | 'contract' | 'internship'
          status: 'active' | 'closed' | 'draft'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description: string
          requirements?: string[]
          salary_min?: number | null
          salary_max?: number | null
          location?: string | null
          type?: 'full-time' | 'part-time' | 'contract' | 'internship'
          status?: 'active' | 'closed' | 'draft'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string
          requirements?: string[]
          salary_min?: number | null
          salary_max?: number | null
          location?: string | null
          type?: 'full-time' | 'part-time' | 'contract' | 'internship'
          status?: 'active' | 'closed' | 'draft'
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          user_id: string
          status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
          cover_letter: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          status?: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
          cover_letter?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          status?: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
          cover_letter?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          event_type: 'job_fair' | 'workshop' | 'webinar' | 'networking' | 'info_session'
          start_date: string
          end_date: string
          location: string | null
          is_online: boolean
          online_link: string | null
          max_participants: number | null
          registration_deadline: string | null
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          event_type: 'job_fair' | 'workshop' | 'webinar' | 'networking' | 'info_session'
          start_date: string
          end_date: string
          location?: string | null
          is_online?: boolean
          online_link?: string | null
          max_participants?: number | null
          registration_deadline?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          event_type?: 'job_fair' | 'workshop' | 'webinar' | 'networking' | 'info_session'
          start_date?: string
          end_date?: string
          location?: string | null
          is_online?: boolean
          online_link?: string | null
          max_participants?: number | null
          registration_deadline?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'registered' | 'attended' | 'no_show' | 'cancelled'
          registered_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'registered' | 'attended' | 'no_show' | 'cancelled'
          registered_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'registered' | 'attended' | 'no_show' | 'cancelled'
          registered_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewee_id: string
          application_id: string
          rating: number
          title: string
          comment: string | null
          review_type: 'company_to_user' | 'user_to_company'
          reviewer_type: 'seeker' | 'employer'
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewee_id: string
          application_id: string
          rating: number
          title: string
          comment?: string | null
          review_type?: 'company_to_user' | 'user_to_company'
          reviewer_type: 'seeker' | 'employer'
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          reviewee_id?: string
          application_id?: string
          rating?: number
          title?: string
          comment?: string | null
          review_type?: 'company_to_user' | 'user_to_company'
          reviewer_type?: 'seeker' | 'employer'
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user_id: string
          job_id: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          score?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          score?: number
          created_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          application_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}