'use client';

import CoverLetterReviewer from '@/components/CoverLetterReviewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CoverLetterReviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold hover:text-blue-600">
                JobAI
              </Link>
              <nav className="flex space-x-8">
                <Link href="/jobs" className="text-gray-600 hover:text-blue-600">
                  채용공고
                </Link>
                <Link
                  href="/cover-letter-review"
                  className="text-blue-600 font-medium border-b-2 border-blue-600"
                >
                  자기소개서 리뷰
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 돌아가기
          </Link>
        </div>
        <CoverLetterReviewer />
      </main>
    </div>
  );
}
