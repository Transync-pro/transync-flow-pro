
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Calendar, Play, Clock } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { toast } from "@/components/ui/use-toast";

const Demo = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    employees: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Demo Request Received",
        description: "Our team will contact you shortly to schedule your personalized demo.",
      });
      
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        employees: "",
        message: ""
      });
      
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Experience TransyncPro in Action</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            See how our platform can transform your QuickBooks data management with a personalized demo.
          </p>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gradient-text mb-6">Product Demo</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Watch our quick overview video to see how TransyncPro streamlines QuickBooks data management.
            </p>
          </div>
          
          <div className="relative rounded-xl overflow-hidden shadow-xl aspect-video bg-gray-900">
            {!videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => setVideoPlaying(true)}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors z-10"
                >
                  <Play className="h-6 w-6 text-transyncpro-button" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="TransyncPro Demo Thumbnail" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            
            {videoPlaying && (
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="TransyncPro Product Demo"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Note: This is a product overview. For a personalized demo tailored to your business needs, 
              please schedule a call with our team below.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Why Schedule a Personal Demo?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">👋</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Personalized Tour</h3>
              <p className="text-gray-600">
                Get a guided walkthrough of features most relevant to your business needs and QuickBooks setup.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Q&A Session</h3>
              <p className="text-gray-600">
                Ask specific questions about how TransyncPro can solve your unique data management challenges.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Tips & Best Practices</h3>
              <p className="text-gray-600">
                Learn expert tips on optimizing your QuickBooks workflow and data organization strategies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Request Form */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-xl shadow-sm overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-2xl font-bold gradient-text mb-6">Schedule Your Demo</h2>
                <p className="text-gray-600 mb-6">
                  Fill out the form to schedule a personalized demo with one of our product specialists.
                  We'll tailor the session to your specific needs and QuickBooks setup.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-transyncpro-heading mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">Flexible Scheduling</h3>
                      <p className="text-gray-600 text-sm">
                        We'll work with your calendar to find a convenient time.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-transyncpro-heading mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">30-Minute Session</h3>
                      <p className="text-gray-600 text-sm">
                        Our demos are concise and focused on your needs.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-transyncpro-heading mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">No Obligation</h3>
                      <p className="text-gray-600 text-sm">
                        Learn about our platform with no pressure to purchase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 p-8 md:p-12 bg-white">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Business Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@yourcompany.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        placeholder="Your Company Inc."
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(123) 456-7890"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="employees" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Size
                      </label>
                      <Input
                        id="employees"
                        name="employees"
                        value={formData.employees}
                        onChange={handleChange}
                        placeholder="Number of employees"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Specific Areas of Interest
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please let us know what features you're most interested in seeing demonstrated."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90 text-white py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Request Demo"} 
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">What Customers Say After Their Demo</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="text-amber-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4 italic">
                "The demo was incredibly helpful. I saw exactly how TransyncPro could save us at least 10 hours per week on data entry alone. The ROI was immediately clear."
              </p>
              <div>
                <p className="font-medium text-gray-900">Jessica T.</p>
                <p className="text-gray-500 text-sm">Financial Controller, Retail Company</p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="text-amber-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4 italic">
                "I appreciated that the demo was tailored to our specific accounting workflow. They showed us exactly how to solve our biggest QuickBooks headaches."
              </p>
              <div>
                <p className="font-medium text-gray-900">Michael R.</p>
                <p className="text-gray-500 text-sm">Accounting Manager, Manufacturing Firm</p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="text-amber-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4 italic">
                "The product specialist who gave us the demo really knew QuickBooks inside and out. They answered all our technical questions and showed us features we didn't even know we needed."
              </p>
              <div>
                <p className="font-medium text-gray-900">David K.</p>
                <p className="text-gray-500 text-sm">CPA, Accounting Practice</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Demo;
