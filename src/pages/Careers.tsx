
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { MapPin, Clock, DollarSign, Users } from "lucide-react";

const Careers = () => {
  const jobOpenings = [
    {
      id: 1,
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      salary: "$70,000 - $90,000",
      description: "We're looking for an experienced Marketing Manager to lead our marketing initiatives and drive growth for TransyncPro. You'll be responsible for developing and executing comprehensive marketing strategies.",
      requirements: [
        "5+ years of marketing experience in B2B SaaS",
        "Experience with digital marketing channels",
        "Strong analytical and project management skills",
        "Bachelor's degree in Marketing, Business, or related field",
        "Experience with QuickBooks or accounting software is a plus"
      ],
      responsibilities: [
        "Develop and execute marketing strategies",
        "Manage digital marketing campaigns",
        "Analyze marketing performance and ROI",
        "Collaborate with sales and product teams",
        "Create compelling marketing content"
      ]
    },
    {
      id: 2,
      title: "SEO Executive",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      salary: "$45,000 - $60,000",
      description: "Join our marketing team as an SEO Executive to help improve our search engine visibility and drive organic traffic to TransyncPro.",
      requirements: [
        "2+ years of SEO experience",
        "Knowledge of SEO tools (SEMrush, Ahrefs, Google Analytics)",
        "Understanding of technical SEO",
        "Experience with content optimization",
        "Knowledge of local SEO is preferred"
      ],
      responsibilities: [
        "Conduct keyword research and analysis",
        "Optimize website content for search engines",
        "Monitor and report on SEO performance",
        "Implement technical SEO improvements",
        "Stay updated with SEO best practices"
      ]
    },
    {
      id: 3,
      title: "SEO Executive",
      department: "Marketing", 
      location: "Remote",
      type: "Full-time",
      salary: "$45,000 - $60,000",
      description: "We have an additional opening for an SEO Executive to expand our SEO team and accelerate our organic growth initiatives.",
      requirements: [
        "2+ years of SEO experience",
        "Knowledge of SEO tools (SEMrush, Ahrefs, Google Analytics)",
        "Understanding of technical SEO",
        "Experience with content optimization",
        "Knowledge of local SEO is preferred"
      ],
      responsibilities: [
        "Conduct keyword research and analysis",
        "Optimize website content for search engines",
        "Monitor and report on SEO performance",
        "Implement technical SEO improvements",
        "Stay updated with SEO best practices"
      ]
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Join Our Team</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Help us revolutionize QuickBooks data management and build the future of financial software integration.
          </p>
          <div className="flex justify-center space-x-8 text-white/80">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <span>Remote-First</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>Flexible Hours</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              <span>Competitive Pay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Why Work at TransyncPro?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-transyncpro-button/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-transyncpro-button" />
              </div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Great Team Culture</h3>
              <p className="text-gray-600">
                Work with passionate professionals who are dedicated to excellence and innovation in fintech.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-transyncpro-button/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-transyncpro-button" />
              </div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Work-Life Balance</h3>
              <p className="text-gray-600">
                Flexible remote work options and schedules that respect your personal life and commitments.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-transyncpro-button/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-transyncpro-button" />
              </div>
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Growth Opportunities</h3>
              <p className="text-gray-600">
                Advance your career with competitive compensation, benefits, and professional development opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Current Openings</h2>
          
          <div className="space-y-6">
            {jobOpenings.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-transyncpro-heading">{job.title}</CardTitle>
                      <div className="flex items-center gap-4 text-gray-600 mt-2">
                        <span className="inline-flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.type}
                        </span>
                        <span className="inline-flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </span>
                      </div>
                    </div>
                    <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90">
                      Apply Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">{job.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-transyncpro-heading mb-3">Requirements:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {job.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-transyncpro-heading mb-3">Responsibilities:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {job.responsibilities.map((resp, index) => (
                          <li key={index}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Benefits & Perks</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="font-semibold text-transyncpro-heading mb-2">Health Insurance</h3>
              <p className="text-gray-600">Comprehensive health, dental, and vision coverage</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="font-semibold text-transyncpro-heading mb-2">Remote Work</h3>
              <p className="text-gray-600">Work from anywhere with flexible schedules</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-transyncpro-heading mb-2">Competitive Salary</h3>
              <p className="text-gray-600">Fair compensation with performance bonuses</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="font-semibold text-transyncpro-heading mb-2">Learning Budget</h3>
              <p className="text-gray-600">Annual budget for courses, conferences, and books</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold gradient-text mb-6">Ready to Join Us?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Don't see a perfect match? We're always looking for talented individuals to join our team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact">
              <Button className="w-full sm:w-auto bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
                Contact Us
              </Button>
            </Link>
            <Button variant="outline" className="w-full sm:w-auto">
              View All Positions
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Careers;
