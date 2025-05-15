
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, HelpCircle, Mail, MessageSquare, Phone, Video } from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import PageLayout from "@/components/PageLayout";
import { toast } from "@/components/ui/use-toast";

const Support = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Support Request Submitted",
        description: "We'll get back to you as soon as possible.",
      });
      
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
      
      setIsSubmitting(false);
    }, 1500);
  };
  
  const faqCategories = [
    {
      title: "Account & Billing",
      faqs: [
        {
          question: "How do I change my subscription plan?",
          answer: "You can change your subscription plan at any time from your account settings. Go to Profile > Subscription and select the plan you'd like to switch to. Changes take effect at the start of your next billing cycle."
        },
        {
          question: "How do I update my billing information?",
          answer: "To update your billing information, navigate to Profile > Billing Information. Here, you can update your credit card details, billing address, and other payment information."
        },
        {
          question: "Can I get a refund if I'm not satisfied?",
          answer: "Yes, we offer a 30-day money-back guarantee for all new subscriptions. If you're not completely satisfied, contact our support team within 30 days of your purchase for a full refund."
        },
        {
          question: "How can I get an invoice for my subscription?",
          answer: "Invoices are automatically generated and emailed to you after each payment. You can also find all your invoices in your account under Profile > Billing History."
        }
      ]
    },
    {
      title: "QuickBooks Connection",
      faqs: [
        {
          question: "How do I connect TransyncPro to my QuickBooks account?",
          answer: "To connect TransyncPro to QuickBooks, go to the Dashboard and click on 'Connect to QuickBooks'. You'll be guided through the Intuit authorization process to grant TransyncPro access to your QuickBooks data."
        },
        {
          question: "Why did my QuickBooks connection stop working?",
          answer: "QuickBooks connections may need to be refreshed periodically due to security protocols. If your connection stops working, simply click 'Reconnect to QuickBooks' on your dashboard. If the issue persists, please contact our support team."
        },
        {
          question: "Is my QuickBooks data secure?",
          answer: "Yes, TransyncPro uses bank-level encryption and follows strict security protocols. We use OAuth 2.0 for authentication with Intuit, which means we never store your QuickBooks credentials. All data transfers are encrypted using SSL/TLS."
        },
        {
          question: "Can I connect multiple QuickBooks companies to TransyncPro?",
          answer: "Yes, Business and Enterprise plans allow you to connect multiple QuickBooks companies. To add another company, go to your Dashboard > Company Settings > Add Company Connection."
        }
      ]
    },
    {
      title: "Data Operations",
      faqs: [
        {
          question: "What file formats can I import into QuickBooks?",
          answer: "TransyncPro supports importing data from CSV, Excel (XLSX), and JSON formats. Each import type has field mapping tools to ensure your data is correctly matched to QuickBooks fields."
        },
        {
          question: "How do I handle errors during import?",
          answer: "When errors occur during import, TransyncPro provides detailed error logs that identify the specific rows and fields causing issues. You can export these errors, fix the data, and then re-import only the corrected records."
        },
        {
          question: "Can I schedule automated imports or exports?",
          answer: "Yes, automated operations are available on the Enterprise plan. You can schedule imports, exports, and other data operations to run at specific times or intervals through the Automation section of your dashboard."
        },
        {
          question: "Is there a limit to how much data I can import?",
          answer: "Import limits depend on your subscription plan. The Starter plan allows up to 1,000 records per month, Business plan allows up to 10,000 records per month, and Enterprise has unlimited imports."
        }
      ]
    }
  ];

  // Filter FAQs by search query
  const filteredFAQs = searchQuery === "" 
    ? faqCategories 
    : faqCategories.map(category => {
        const filteredItems = category.faqs.filter(faq => 
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return {
          ...category,
          faqs: filteredItems
        };
      }).filter(category => category.faqs.length > 0);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Support Center</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Find answers to your questions or get in touch with our support team.
          </p>
          
          <div className="mt-10 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">How Can We Help?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center card-hover">
              <div className="bg-blue-50 mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <HelpCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Help Center</h3>
              <p className="text-gray-600 mb-4">
                Browse our knowledge base for answers to common questions.
              </p>
              <Button variant="outline" className="w-full">
                Browse Articles
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center card-hover">
              <div className="bg-purple-50 mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <Video className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Video Tutorials</h3>
              <p className="text-gray-600 mb-4">
                Watch step-by-step video guides for using TransyncPro.
              </p>
              <Button variant="outline" className="w-full">
                Watch Tutorials
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center card-hover">
              <div className="bg-green-50 mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">
                Chat with our support team for immediate assistance.
              </p>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center card-hover">
              <div className="bg-amber-50 mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <Mail className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">
                Send us an email and we'll get back to you within 24 hours.
              </p>
              <Button variant="outline" className="w-full">
                Email Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Frequently Asked Questions</h2>
          
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-8">
                <h3 className="text-xl font-semibold text-transyncpro-heading mb-4">{category.title}</h3>
                
                <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-sm mb-6">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                      <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                        <span className="text-left">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <p className="text-gray-600">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 mb-4">No FAQs found matching your search criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-xl shadow-sm overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 p-8 md:p-12 bg-transyncpro-button text-white">
                <h2 className="text-2xl font-bold mb-6">Contact Our Support Team</h2>
                <p className="mb-8">
                  Can't find what you're looking for? Our dedicated support team is here to help.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Email Support</h3>
                      <p className="text-white/80 text-sm">
                        <a href="mailto:support@transyncpro.com" className="hover:text-white">
                          support@transyncpro.com
                        </a>
                      </p>
                      <p className="text-white/70 text-xs mt-1">Response within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Phone Support</h3>
                      <p className="text-white/80 text-sm">
                        <a href="tel:+1-800-555-0123" className="hover:text-white">
                          (800) 555-0123
                        </a>
                      </p>
                      <p className="text-white/70 text-xs mt-1">Mon-Fri, 9AM-6PM PST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MessageSquare className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Live Chat</h3>
                      <p className="text-white/80 text-sm">
                        Available for Business and Enterprise plans
                      </p>
                      <p className="text-white/70 text-xs mt-1">24/7 support</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3 p-8 md:p-12">
                <h3 className="text-xl font-semibold text-transyncpro-heading mb-6">Send Us a Message</h3>
                
                <form onSubmit={handleContactSubmit}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={contactForm.name}
                        onChange={handleContactChange}
                        required
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={contactForm.email}
                        onChange={handleContactChange}
                        required
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleContactChange}
                        required
                        placeholder="How can we help you?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={contactForm.message}
                        onChange={handleContactChange}
                        required
                        placeholder="Please provide details about your issue or question..."
                        rows={5}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90 text-white py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Hours Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Support Hours & SLAs</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-4">Standard Support</h3>
              <p className="text-gray-600 mb-6">
                Included with all plans.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Support</span>
                  <span className="text-gray-800 font-medium">24-48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Support</span>
                  <span className="text-gray-800 font-medium">Business hours only</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Live Chat</span>
                  <span className="text-gray-800 font-medium">Not included</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Business Hours</h4>
                <p className="text-gray-600 text-sm">Monday - Friday</p>
                <p className="text-gray-800 font-medium mb-2">9:00 AM - 6:00 PM PST</p>
                <p className="text-gray-600 text-sm">Weekends & Holidays</p>
                <p className="text-gray-800 font-medium">Closed</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-primary">
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-4">Business Support</h3>
              <p className="text-gray-600 mb-6">
                Included with Business plan.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Support</span>
                  <span className="text-gray-800 font-medium">12-24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Support</span>
                  <span className="text-gray-800 font-medium">Priority queue</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Live Chat</span>
                  <span className="text-gray-800 font-medium">Business hours</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Extended Hours</h4>
                <p className="text-gray-600 text-sm">Monday - Friday</p>
                <p className="text-gray-800 font-medium mb-2">8:00 AM - 8:00 PM PST</p>
                <p className="text-gray-600 text-sm">Weekends</p>
                <p className="text-gray-800 font-medium">10:00 AM - 4:00 PM PST</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-4">Enterprise Support</h3>
              <p className="text-gray-600 mb-6">
                Included with Enterprise plan.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Support</span>
                  <span className="text-gray-800 font-medium">4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Support</span>
                  <span className="text-gray-800 font-medium">Dedicated line</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Live Chat</span>
                  <span className="text-gray-800 font-medium">24/7 support</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-800 mb-2">24/7 Support</h4>
                <p className="text-gray-600 text-sm">Monday - Sunday</p>
                <p className="text-gray-800 font-medium mb-2">24 hours</p>
                <p className="text-gray-600 text-sm">Holidays</p>
                <p className="text-gray-800 font-medium">24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Support;
