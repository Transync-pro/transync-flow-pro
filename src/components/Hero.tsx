
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-gradient absolute inset-0 opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
            <span className="block">Simplify Your</span>
            <span className="block gradient-text">QuickBooks Data Management</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-xl text-transyncpro-text sm:max-w-3xl">
            Bulk import, export, and delete QuickBooks data with ease. 
            Save hours of manual work and focus on what matters most to your business.
          </p>
          <div className="mt-10 max-w-sm mx-auto sm:flex sm:justify-center sm:max-w-none gap-4">
            <div className="mb-4 sm:mb-0">
              <Link to="/signup">
                <Button className="py-3 px-8 text-base font-medium bg-transyncpro-button hover:bg-transyncpro-button/90 text-white shadow-lg hover:shadow-xl">
                  Get Started
                </Button>
              </Link>
            </div>
            <div>
              <Link to="/demo">
                <Button variant="outline" className="py-3 px-8 text-base font-medium border-transyncpro-button text-transyncpro-button hover:bg-transyncpro-button/10">
                  See Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
