
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center md:text-left md:flex md:items-center md:justify-between">
          <div className="mb-8 md:mb-0 md:mr-8">
            <h2 className="text-3xl font-bold text-transyncpro-heading mb-4">
              Ready to Transform Your QuickBooks Experience?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Start saving time and reducing errors today with TransyncPro's powerful data management tools.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/signup">
              <Button className="w-full sm:w-auto text-base py-3 px-8 bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
                Get Started Free
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" className="w-full sm:w-auto text-base py-3 px-8 border-transyncpro-button text-transyncpro-button hover:bg-transyncpro-button/10">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
