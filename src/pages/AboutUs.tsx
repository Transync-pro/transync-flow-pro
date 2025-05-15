
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const AboutUs = () => {
  const teamMembers = [
    {
      name: "Sarah Johnson",
      title: "CEO & Founder",
      bio: "QuickBooks Certified ProAdvisor with 15+ years of experience in accounting and financial software.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80"
    },
    {
      name: "Michael Chen",
      title: "CTO",
      bio: "Former Intuit engineer with expertise in API integrations and enterprise software development.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80"
    },
    {
      name: "Aisha Patel",
      title: "Head of Product",
      bio: "10+ years in product management with a focus on fintech and accounting software solutions.",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80"
    },
    {
      name: "David Wilson",
      title: "Lead Developer",
      bio: "Software architect specializing in secure data handling and cloud-based applications.",
      image: "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80"
    }
  ];

  const timeline = [
    {
      year: "2020",
      title: "Company Founded",
      description: "TransyncPro was founded with a mission to simplify QuickBooks data management for businesses of all sizes."
    },
    {
      year: "2021",
      title: "Initial Release",
      description: "Launched our first version with core import and export functionality for QuickBooks Online."
    },
    {
      year: "2022",
      title: "QuickBooks Desktop Support",
      description: "Expanded our platform to support QuickBooks Desktop integration via secure connection."
    },
    {
      year: "2023",
      title: "Enterprise Features",
      description: "Added advanced features for larger organizations, including bulk deletion, automated scheduling, and custom API access."
    },
    {
      year: "2024",
      title: "AI-Powered Updates",
      description: "Introduced AI-assisted field mapping and data validation to further improve accuracy and efficiency."
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Expanded services to support international versions of QuickBooks and multi-currency operations."
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Story</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            TransyncPro was founded by accountants and developers who understood the challenges of QuickBooks data management.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold gradient-text mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At TransyncPro, our mission is to empower businesses to take control of their QuickBooks data through
                intuitive, powerful tools that save time, reduce errors, and provide deeper insights.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that accounting data should be accessible, manageable, and actionable for businesses of all sizes.
                By solving the common pain points of data entry, reporting, and cleanup in QuickBooks, we help our customers
                focus on growth rather than administrative tasks.
              </p>
              <p className="text-lg text-gray-600">
                Our commitment to security, accuracy, and usability drives everything we do, from feature development to
                customer support.
              </p>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <img 
                src="https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Team collaboration" 
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Our Leadership Team</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden card-hover">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-64 object-cover object-center"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-transyncpro-heading">{member.name}</h3>
                  <p className="text-gray-500 mb-3">{member.title}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Our Journey</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 left-1/2 w-px h-full bg-gray-200 -translate-x-1/2 hidden md:block"></div>
            
            <div className="space-y-12 relative">
              {timeline.map((event, index) => (
                <div key={index} className={`md:flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="md:w-1/2 mb-8 md:mb-0 relative">
                    {/* Timeline dot */}
                    <div className="absolute top-0 left-1/2 w-4 h-4 rounded-full bg-transyncpro-button -translate-x-1/2 -translate-y-1/2 hidden md:block"></div>
                    
                    <div className={`p-6 bg-gray-50 rounded-lg shadow-sm md:mx-8 ${index % 2 === 0 ? 'md:mr-0' : 'md:ml-0'}`}>
                      <div className="inline-block px-4 py-1 rounded-full bg-transyncpro-button/10 text-transyncpro-button font-medium mb-3">
                        {event.year}
                      </div>
                      <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">{event.title}</h3>
                      <p className="text-gray-600">{event.description}</p>
                    </div>
                  </div>
                  
                  {/* Spacer for alternating layout */}
                  <div className="md:w-1/2 hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Our Core Values</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Security First</h3>
              <p className="text-gray-600">
                We prioritize the security of your financial data above all else, with enterprise-grade encryption
                and strict data handling protocols.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Efficiency Driven</h3>
              <p className="text-gray-600">
                We're obsessed with creating tools that save time and reduce manual effort, allowing
                businesses to focus on growth instead of data entry.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Customer Partnership</h3>
              <p className="text-gray-600">
                We see ourselves as partners in your success, providing not just software but the support
                and guidance needed to optimize your QuickBooks workflows.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Accuracy & Precision</h3>
              <p className="text-gray-600">
                We build validation and verification into every aspect of our platform to ensure your
                financial data stays accurate and reliable.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Continuous Innovation</h3>
              <p className="text-gray-600">
                We constantly push the boundaries of what's possible with QuickBooks data management, 
                incorporating new technologies and approaches.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">Inclusivity</h3>
              <p className="text-gray-600">
                We design our solutions to be accessible for businesses of all sizes, from solopreneurs
                to enterprise organizations with complex needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold gradient-text mb-6">Join Us on Our Mission</h2>
          <p className="text-lg text-gray-600 mb-8">
            Experience how TransyncPro can transform your QuickBooks data management and help your business thrive.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button className="w-full sm:w-auto bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
                Get Started Free
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="w-full sm:w-auto">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AboutUs;
