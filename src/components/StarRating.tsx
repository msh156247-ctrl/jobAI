'use client'

interface StarRatingProps {
  rating: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  onRatingChange?: (rating: number) => void
}

export default function StarRating({
  rating,
  readonly = false,
  size = 'md',
  showText = true,
  className = '',
  onRatingChange
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`flex ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={readonly}
            className={`${
              readonly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-110 transition-transform'
            } ${
              star <= rating
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {showText && (
        <span className="text-sm text-gray-600 ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}