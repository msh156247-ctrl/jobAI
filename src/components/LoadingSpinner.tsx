export default function LoadingSpinner({ size = 'md', fullScreen = false }: {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="로딩 중"
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}
