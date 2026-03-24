import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <p className="text-8xl font-black text-gray-200">404</p>
        <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
        <p className="text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          className="inline-block mt-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
