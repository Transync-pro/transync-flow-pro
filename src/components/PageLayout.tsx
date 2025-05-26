
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import EnvironmentDebugger from "./EnvironmentDebugger";

interface PageLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
}

const PageLayout = ({ children, showNavbar = true, showFooter = true }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showNavbar && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      {process.env.NODE_ENV !== 'production' && <EnvironmentDebugger />}
    </div>
  );
};

export default PageLayout;
