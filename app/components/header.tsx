"use client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useShop } from "../contexts/ShopContext";

interface HeaderProps {
  isActiveMenu?: string;
  backRoute?: string;
}

export default function Header({ isActiveMenu, backRoute }: HeaderProps) {
  const { shop, isLoading } = useShop();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Memoize navLinks to prevent unnecessary recalculations
  const navLinks = useMemo(() => {
    const baseLinks = [
      { href: "/dashboard", label: "Dashboard", key: "dashboard" },
      { href: "/products", label: "Products", key: "products" },
      { href: "/orders", label: "Orders", key: "orders" },
      { href: "/settings", label: "Settings", key: "settings" },
    ];

    // Only add shop parameter if available
    if (shop) {
      return baseLinks.map(link => ({
        ...link,
        href: `${link.href}?shop=${shop}`
      }));
    }

    return baseLinks;
  }, [shop]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Handle back button click
  const handleBackClick = () => {
    if (backRoute) {
      if (shop) {
        router.push(`${backRoute}?shop=${shop}`);
      } else {
        router.push(backRoute);
      }
    } else {
      // Fallback: go back in history
      router.back();
    }
  };

  // Fixed active link detection - prioritize props over pathname
  const isActive = (linkKey: string) => {
    // If isActiveMenu prop is provided, use it
    if (isActiveMenu) {
      return isActiveMenu === linkKey;
    }
    
    // Fallback to pathname detection
    return pathname.startsWith(`/${linkKey}`);
  };

  const NavLink = ({ href, label, linkKey }: { href: string; label: string; linkKey: string }) => {
    const active = isActive(linkKey);
    
    return (
      <Link
        href={href}
        className={`navbar-links px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          active 
            ? 'nav-active bg-blue-100 text-blue-700 border-b-2 border-blue-500' 
            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-current={active ? 'page' : undefined}
      >
        {label}
        {isLoading && !shop && (
          <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gray-400"></span>
        )}
      </Link>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <header>
        <nav className="bg-white shadow-sm my-5" style={{ borderRadius: '5px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-40 h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="hidden md:flex space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header>
      <nav className="bg-white shadow-sm my-5" style={{ borderRadius: '5px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo or Back Button */}
            <div className="flex items-center">
              {backRoute ? (
                // Back Button
                <button
                  onClick={handleBackClick}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group cursor-pointer text-lg"
                >
                  <svg 
                    className="w-6 h-6 mr-3 transform group-hover:-translate-x-1 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium text-lg">Back</span>
                </button>
              ) : (
                // Logo
                <Link 
                  href={shop ? `/dashboard?shop=${shop}` : '/dashboard'}
                  className="flex items-center"
                >
                  <img
                    className="app-top-logo"
                    src="/assets/app-logo.png"
                    width="180"
                    height="45"
                    alt="App Logo"
                  />
                </Link>
              )}
            </div>

            {/* Desktop Menu Links */}
            <div className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <NavLink 
                  key={link.key} 
                  href={link.href} 
                  label={link.label} 
                  linkKey={link.key} 
                />
              ))}
            </div>  

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none p-2 transition-colors duration-200"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2 pt-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.key}
                    href={link.href}
                    label={link.label}
                    linkKey={link.key}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}