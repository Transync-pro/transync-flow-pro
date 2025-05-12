
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote: "TransyncPro saved our accounting team countless hours of manual data entry. What used to take days now takes minutes.",
    name: "Sarah Johnson",
    title: "CFO, GreenTech Solutions",
    image: "https://randomuser.me/api/portraits/women/32.jpg"
  },
  {
    quote: "The bulk delete feature helped us clean up years of outdated vendor data without affecting our active accounts.",
    name: "Michael Chen",
    title: "Accounting Manager, Pinnacle Retail",
    image: "https://randomuser.me/api/portraits/men/45.jpg"
  },
  {
    quote: "As a bookkeeper managing multiple clients, TransyncPro's export features have revolutionized my reporting workflow.",
    name: "Jessica Williams",
    title: "Senior Bookkeeper, Clarity Accounting Services",
    image: "https://randomuser.me/api/portraits/women/65.jpg"
  },
  {
    quote: "The data validation features saved us from importing thousands of duplicate customer records. Absolutely worth every penny.",
    name: "Robert Garcia",
    title: "Owner, Garcia Manufacturing",
    image: "https://randomuser.me/api/portraits/men/22.jpg"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-transyncpro-ui-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Trusted by Businesses Like Yours
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of QuickBooks users who have streamlined their data management
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="card-hover bg-white border border-gray-200 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="mb-4 text-transyncpro-heading">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.69.686.285.998l-4.204 3.602a.563.563 0 00-.181.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.18-.557l-4.204-3.602a.563.563 0 01.285-.998l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-gray-700 italic flex-grow mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <img 
                        className="h-10 w-10 rounded-full object-cover"
                        src={testimonial.image}
                        alt={testimonial.name}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{testimonial.name}</h4>
                      <p className="text-xs text-gray-500">{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16">
          <div className="text-gray-400 text-xl font-semibold">Trusted by users at:</div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/76/Intuit_Logo.svg" alt="Intuit" className="h-6 md:h-8 opacity-60 hover:opacity-100 transition-opacity" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Oracle_Corporation_logo.svg" alt="Oracle" className="h-6 md:h-8 opacity-60 hover:opacity-100 transition-opacity" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/9d/Deloitte_Logo.svg" alt="Deloitte" className="h-6 md:h-8 opacity-60 hover:opacity-100 transition-opacity" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Microsoft_logo.svg" alt="Microsoft" className="h-6 md:h-8 opacity-60 hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
