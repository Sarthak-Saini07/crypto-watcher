import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-9xl font-extrabold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-md">
        Back to Dashboard
      </Link>
    </div>
  );
}
