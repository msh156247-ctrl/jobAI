/**
 * GraphQL Queries for Recommendation System
 */

import { gql } from '@apollo/client'

/**
 * 사용자 프로필 조회
 */
export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: UUID!) {
    seeker_profiles(where: { user_id: { _eq: $userId } }) {
      user_id
      name
      email
      phone
      location
      industry
      career_type
      career_years
      preferred_locations
      work_types
      salary_min
      salary_max
      skills
      bio
      personalities
      educations
      certifications
      language_scores
      career_histories
    }
  }
`

/**
 * 추천을 위한 공고 목록 조회 (필터링 포함)
 */
export const GET_JOBS_FOR_RECOMMENDATION = gql`
  query GetJobsForRecommendation(
    $limit: Int = 100
    $offset: Int = 0
    $industries: [String!]
    $locations: [String!]
    $types: [String!]
    $salaryMin: Int
  ) {
    job_postings(
      limit: $limit
      offset: $offset
      where: {
        status: { _eq: "active" }
        _and: [
          { industry: { _in: $industries } }
          { location: { _in: $locations } }
          { type: { _in: $types } }
          { salary_min: { _gte: $salaryMin } }
        ]
      }
      order_by: { created_at: desc }
    ) {
      id
      title
      company_id
      company_profiles {
        company_name
        industry
        size
        location
      }
      description
      requirements
      responsibilities
      benefits
      location
      type
      industry
      experience_level
      salary_min
      salary_max
      skills
      deadline
      created_at
      view_count
      application_count
    }
  }
`

/**
 * 사용자의 행동 데이터 조회 (협업 필터링용)
 */
export const GET_USER_BEHAVIORS = gql`
  query GetUserBehaviors($userId: UUID!, $limit: Int = 100) {
    user_behaviors(
      where: { user_id: { _eq: $userId } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      user_id
      job_id
      action
      timestamp
      metadata
    }
  }
`

/**
 * 유사한 사용자 찾기 (협업 필터링용)
 */
export const GET_SIMILAR_USERS = gql`
  query GetSimilarUsers($userId: UUID!, $skills: [String!], $industry: String, $limit: Int = 10) {
    seeker_profiles(
      where: {
        user_id: { _neq: $userId }
        _or: [
          { skills: { _contains: $skills } }
          { industry: { _eq: $industry } }
        ]
      }
      limit: $limit
    ) {
      user_id
      industry
      skills
      preferred_locations
      career_years
    }
  }
`

/**
 * 유사 사용자들의 행동 데이터 조회
 */
export const GET_SIMILAR_USERS_BEHAVIORS = gql`
  query GetSimilarUsersBehaviors($userIds: [UUID!]!, $limit: Int = 50) {
    user_behaviors(
      where: {
        user_id: { _in: $userIds }
        action: { _in: ["view", "save", "apply"] }
      }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      user_id
      job_id
      action
      timestamp
    }
  }
`

/**
 * 추천 점수를 포함한 복합 쿼리
 */
export const GET_RECOMMENDATIONS_WITH_SCORES = gql`
  query GetRecommendationsWithScores(
    $userId: UUID!
    $limit: Int = 20
    $industries: [String!]
    $locations: [String!]
  ) {
    job_postings(
      where: {
        status: { _eq: "active" }
        industry: { _in: $industries }
        location: { _in: $locations }
      }
      limit: $limit
    ) {
      id
      title
      company_id
      company_profiles {
        company_name
      }
      location
      type
      industry
      skills
      salary_min
      salary_max
      experience_level
      view_count
      application_count
    }
  }
`

/**
 * 행동 추적 데이터 삽입
 */
export const INSERT_USER_BEHAVIOR = gql`
  mutation InsertUserBehavior(
    $userId: UUID!
    $jobId: UUID!
    $action: String!
    $metadata: jsonb
  ) {
    insert_user_behaviors_one(
      object: {
        user_id: $userId
        job_id: $jobId
        action: $action
        timestamp: "now()"
        metadata: $metadata
      }
    ) {
      id
      user_id
      job_id
      action
      timestamp
    }
  }
`

/**
 * 세션 이벤트 일괄 삽입
 */
export const INSERT_SESSION_EVENTS = gql`
  mutation InsertSessionEvents($events: [user_behaviors_insert_input!]!) {
    insert_user_behaviors(objects: $events) {
      affected_rows
      returning {
        id
        user_id
        job_id
        action
        timestamp
      }
    }
  }
`

/**
 * 사용자가 이미 본 공고 제외
 */
export const GET_JOBS_EXCLUDING_VIEWED = gql`
  query GetJobsExcludingViewed($userId: UUID!, $limit: Int = 20) {
    job_postings(
      where: {
        status: { _eq: "active" }
        _not: {
          user_behaviors: {
            user_id: { _eq: $userId }
            action: { _in: ["view", "reject"] }
          }
        }
      }
      limit: $limit
      order_by: { created_at: desc }
    ) {
      id
      title
      company_profiles {
        company_name
      }
      location
      type
      industry
      skills
      salary_min
      salary_max
    }
  }
`
