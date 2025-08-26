import Link from "next/link";
import { BookOpen, Plus, Home } from "lucide-react";
import { Button } from "@/components/common/Button";

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ReadUp
            </span>
          </Link>
          
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Button
              as={Link}
              href="/"
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>
            
            <Button
              as={Link}
              href="/add"
              variant="primary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Book</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
