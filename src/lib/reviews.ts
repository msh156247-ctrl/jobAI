import { supabase } from './supabase'
import { Database } from '@/types/database'

export type Review = Database['public']['Tables']['reviews']['Row']

export interface ReviewWithProfiles extends Review {
  reviewer_profile?: {
    full_name: string | null
    email: string
  }
  reviewee_profile?: {
    full_name: string | null
    email: string
  }
  application?: {
    job_id: string
    jobs: {
      title: string
      company_profiles: {
        company_name: string
      } | null
    } | null
  }
}

export interface ReviewFormData {
  rating: number
  title: string
  comment: string
  isAnonymous: boolean
}

export interface UserRatingSummary {
  user_id: string
  reviewer_type: 'user' | 'company'
  review_count: number
  average_rating: number
  five_star_count: number
  four_star_count: number
  three_star_count: number
  two_star_count: number
  one_star_count: number
  latest_review_date: string
}

// Create a new review
export async function createReview(
  applicationId: string,
  reviewerId: string,
  revieweeId: string,
  reviewerType: 'seeker' | 'employer',
  reviewData: ReviewFormData
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        application_id: applicationId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        reviewer_type: reviewerType,
        rating: reviewData.rating,
        title: reviewData.title.trim(),
        comment: reviewData.comment.trim() || null,
        is_anonymous: reviewData.isAnonymous
      }
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update an existing review
export async function updateReview(
  reviewId: string,
  reviewData: ReviewFormData
): Promise<Review> {
  const { data, error } = await (supabase
    .from('reviews') as any)
    .update({
      rating: reviewData.rating,
      title: reviewData.title.trim(),
      comment: reviewData.comment.trim() || null,
      is_anonymous: reviewData.isAnonymous,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (error) throw error
}

// Get reviews for a specific user (as reviewee)
export async function getUserReviews(
  userId: string,
  reviewerType?: 'user' | 'company',
  limit: number = 50
): Promise<ReviewWithProfiles[]> {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      reviewer_profile:reviewer_id (
        full_name,
        email
      ),
      application:application_id (
        job_id,
        jobs (
          title,
          company_profiles (
            company_name
          )
        )
      )
    `)
    .eq('reviewee_id', userId)
    .eq('is_anonymous', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (reviewerType) {
    query = query.eq('reviewer_type', reviewerType)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Get reviews written by a specific user (as reviewer)
export async function getReviewsByUser(
  userId: string,
  limit: number = 50
): Promise<ReviewWithProfiles[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewee_profile:reviewee_id (
        full_name,
        email
      ),
      application:application_id (
        job_id,
        jobs (
          title,
          company_profiles (
            company_name
          )
        )
      )
    `)
    .eq('reviewer_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Get review for a specific application
export async function getApplicationReview(
  applicationId: string,
  reviewerId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('application_id', applicationId)
    .eq('reviewer_id', reviewerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No review found
    throw error
  }
  return data
}

// Check if user can review an application
export async function canUserReviewApplication(
  applicationId: string,
  userId: string,
  userRole: 'seeker' | 'employer'
): Promise<boolean> {
  try {
    // Check if application exists and user is part of it
    const { data: application } = await supabase
      .from('applications')
      .select(`
        id,
        user_id,
        status,
        jobs (
          company_id,
          company_profiles (
            user_id
          )
        )
      `)
      .eq('id', applicationId)
      .single()

    if (!application) return false

    // Only allow reviews for completed applications (accepted or rejected)
    if (!['accepted', 'rejected'].includes((application as any).status)) return false

    // Check if user is the applicant or company owner
    const isApplicant = (application as any).user_id === userId && userRole === 'seeker'
    const isCompanyOwner = (application as any).jobs?.company_profiles?.user_id === userId && userRole === 'employer'

    if (!isApplicant && !isCompanyOwner) return false

    // Check if review already exists
    const existingReview = await getApplicationReview(applicationId, userId)
    return !existingReview

  } catch (error) {
    console.error('Error checking review permission:', error)
    return false
  }
}

// Get user rating summary
export async function getUserRatingSummary(
  userId: string,
  reviewerType?: 'user' | 'company'
): Promise<UserRatingSummary[]> {
  let query = supabase
    .from('user_ratings_summary')
    .select('*')
    .eq('user_id', userId)

  if (reviewerType) {
    query = query.eq('reviewer_type', reviewerType)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Get applications that can be reviewed by user
export async function getReviewableApplications(
  userId: string,
  userRole: 'seeker' | 'employer'
): Promise<any[]> {
  let query: any

  if (userRole === 'seeker') {
    // Get user's completed applications that haven't been reviewed
    query = supabase
      .from('applications')
      .select(`
        *,
        jobs (
          title,
          company_profiles (
            company_name,
            user_id
          )
        )
      `)
      .eq('user_id', userId)
      .in('status', ['accepted', 'rejected'])
      .not('id', 'in', `(
        select application_id from reviews where reviewer_id = '${userId}'
      )`)
  } else {
    // Get company's applications that haven't been reviewed
    query = supabase
      .from('applications')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        jobs!inner (
          title,
          company_profiles!inner (
            company_name
          )
        )
      `)
      .eq('jobs.company_profiles.user_id', userId)
      .in('status', ['accepted', 'rejected'])
      .not('id', 'in', `(
        select application_id from reviews where reviewer_id = '${userId}'
      )`)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get top rated users/companies
export async function getTopRatedProfiles(
  type: 'user' | 'company',
  limit: number = 10
): Promise<any[]> {
  const table = type === 'user' ? 'user_profiles' : 'company_profiles'
  const ratingColumn = type === 'user' ? 'rating_from_companies' : 'rating_from_users'
  const reviewCountColumn = type === 'user' ? 'total_company_reviews' : 'total_user_reviews'

  const { data, error } = await supabase
    .from(table)
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .gt(reviewCountColumn, 0)
    .order(ratingColumn, { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Utility function to format rating display
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

// Utility function to get star display
export function getStarDisplay(rating: number): string {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars)
}

// Utility function to get rating color class
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600'
  if (rating >= 4.0) return 'text-green-500'
  if (rating >= 3.5) return 'text-yellow-600'
  if (rating >= 3.0) return 'text-yellow-500'
  if (rating >= 2.0) return 'text-orange-500'
  return 'text-red-500'
}

// Utility function to get rating description
export function getRatingDescription(rating: number): string {
  if (rating >= 4.5) return '매우 우수'
  if (rating >= 4.0) return '우수'
  if (rating >= 3.5) return '좋음'
  if (rating >= 3.0) return '보통'
  if (rating >= 2.0) return '미흡'
  return '불만족'
}