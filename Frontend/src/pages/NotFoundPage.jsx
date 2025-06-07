import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-purple-500">404</h1>
        <div className="bg-purple-600 px-2 text-sm rounded rotate-12 absolute">
          Page Not Found
        </div>
        <div className="mt-16 text-xl">
          <h2 className="mb-4">Oops! Looks like you've ventured into unknown territory.</h2>
          <p className="text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex space-x-4 justify-center">
          <Link
            to="/"
            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="px-5 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 