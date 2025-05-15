
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play, Clock, BookOpen, Bookmark } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const Tutorials = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];
  
  const tutorials = [
    {
      id: 1,
      title: "Getting Started with TransyncPro",
      description: "Learn the basics of setting up your account and connecting to QuickBooks.",
      type: "Video",
      difficulty: "Beginner",
      duration: "10 min",
      thumbnail: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: true
    },
    {
      id: 2,
      title: "Your First Bulk Import",
      description: "Learn how to properly format a CSV file and import it into QuickBooks.",
      type: "Video",
      difficulty: "Beginner",
      duration: "15 min",
      thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 3,
      title: "Advanced Field Mapping Techniques",
      description: "Master the art of mapping complex data structures to QuickBooks fields.",
      type: "Article",
      difficulty: "Intermediate",
      duration: "12 min read",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 4,
      title: "Bulk Exporting and Reporting",
      description: "Learn how to create custom exports for detailed financial analysis.",
      type: "Video",
      difficulty: "Intermediate",
      duration: "20 min",
      thumbnail: "https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: true
    },
    {
      id: 5,
      title: "Safe Deletion Practices",
      description: "Best practices for safely removing data from QuickBooks without breaking references.",
      type: "Article",
      difficulty: "Advanced",
      duration: "15 min read",
      thumbnail: "https://images.unsplash.com/photo-1484807352052-23338990c6c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 6,
      title: "Working with Transaction Data",
      description: "How to properly import, export, and manage transaction data in QuickBooks.",
      type: "Video",
      difficulty: "Intermediate",
      duration: "25 min",
      thumbnail: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 7,
      title: "Setting Up Data Validation Rules",
      description: "Create custom validation rules to ensure data integrity during imports.",
      type: "Article",
      difficulty: "Advanced",
      duration: "18 min read",
      thumbnail: "https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 8,
      title: "Using Templates for Repeated Imports",
      description: "Save time by creating and managing import templates for regular operations.",
      type: "Video",
      difficulty: "Beginner",
      duration: "12 min",
      thumbnail: "https://images.unsplash.com/photo-1664575599736-c5197c684128?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    }
  ];

  // Filter tutorials by search query and difficulty
  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === "All" || tutorial.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  // Split tutorials into featured and regular
  const featuredTutorials = filteredTutorials.filter(tutorial => tutorial.featured);
  const regularTutorials = filteredTutorials.filter(tutorial => !tutorial.featured);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Tutorials & Guides</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Learn how to use TransyncPro effectively with our comprehensive tutorials and step-by-step guides.
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex items-center justify-between">
            <div className="relative mb-4 md:mb-0 md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {difficulties.map(difficulty => (
                <Button
                  key={difficulty}
                  variant={difficultyFilter === difficulty ? "default" : "outline"}
                  onClick={() => setDifficultyFilter(difficulty)}
                  className={difficultyFilter === difficulty ? "bg-transyncpro-button hover:bg-transyncpro-button/90" : ""}
                >
                  {difficulty}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold gradient-text mb-8">Featured Tutorials</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {featuredTutorials.map(tutorial => (
                <div key={tutorial.id} className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden card-hover h-full">
                  <div className="relative">
                    <img 
                      src={tutorial.thumbnail} 
                      alt={tutorial.title} 
                      className="h-60 w-full object-cover"
                    />
                    {tutorial.type === "Video" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors z-10">
                          <Play className="h-6 w-6 text-transyncpro-button" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-4 flex justify-between">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                        ${tutorial.difficulty === "Beginner" ? "bg-green-100 text-green-800" : 
                          tutorial.difficulty === "Intermediate" ? "bg-blue-100 text-blue-800" : 
                          "bg-purple-100 text-purple-800"}`}
                      >
                        {tutorial.difficulty}
                      </span>
                      <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                        {tutorial.type}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">{tutorial.title}</h3>
                    <p className="text-gray-600 mb-4 flex-grow">{tutorial.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {tutorial.duration}
                      </div>
                      <Button variant="link" className="text-transyncpro-button p-0">
                        {tutorial.type === "Video" ? "Watch Now" : "Read Now"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Tutorials */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold gradient-text mb-8">All Tutorials</h2>
          
          {regularTutorials.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularTutorials.map(tutorial => (
                <div key={tutorial.id} className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden card-hover h-full">
                  <div className="relative">
                    <img 
                      src={tutorial.thumbnail} 
                      alt={tutorial.title} 
                      className="h-48 w-full object-cover"
                    />
                    {tutorial.type === "Video" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors z-10">
                          <Play className="h-5 w-5 text-transyncpro-button" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 shadow-sm hover:bg-white transition-colors">
                        <Bookmark className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-3 flex justify-between">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                        ${tutorial.difficulty === "Beginner" ? "bg-green-100 text-green-800" : 
                          tutorial.difficulty === "Intermediate" ? "bg-blue-100 text-blue-800" : 
                          "bg-purple-100 text-purple-800"}`}
                      >
                        {tutorial.difficulty}
                      </span>
                      <span className="inline-flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {tutorial.duration}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-transyncpro-heading mb-2">{tutorial.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow">{tutorial.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
                        {tutorial.type}
                      </span>
                      <Button variant="link" className="text-transyncpro-button p-0 text-sm">
                        {tutorial.type === "Video" ? (
                          <span className="flex items-center">
                            <Play className="h-3 w-3 mr-1" /> Watch
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" /> Read
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No tutorials found matching your search criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setDifficultyFilter("All");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold gradient-text mb-8">Learning Paths</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl">
            Follow these structured learning paths to progressively build your TransyncPro expertise.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-green-200 rounded-xl overflow-hidden shadow-sm">
              <div className="h-2 bg-green-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Getting Started</h3>
                <p className="text-gray-600 mb-4">Learn the basics of TransyncPro and start managing your QuickBooks data effectively.</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">4 tutorials</span>
                  <span className="text-gray-500">45 minutes</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-4">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: "25%" }}></div>
                </div>
                <Button className="w-full mt-4 bg-green-500 hover:bg-green-600">Start Learning</Button>
              </div>
            </div>
            
            <div className="border border-blue-200 rounded-xl overflow-hidden shadow-sm">
              <div className="h-2 bg-blue-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Data Import Pro</h3>
                <p className="text-gray-600 mb-4">Master advanced import techniques for complex data structures and validation rules.</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">6 tutorials</span>
                  <span className="text-gray-500">90 minutes</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-4">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: "50%" }}></div>
                </div>
                <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600">Continue Learning</Button>
              </div>
            </div>
            
            <div className="border border-purple-200 rounded-xl overflow-hidden shadow-sm">
              <div className="h-2 bg-purple-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">API Integration</h3>
                <p className="text-gray-600 mb-4">Learn to integrate TransyncPro with your existing systems using our comprehensive API.</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">5 tutorials</span>
                  <span className="text-gray-500">120 minutes</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-4">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: "10%" }}></div>
                </div>
                <Button className="w-full mt-4 bg-purple-500 hover:bg-purple-600">Start Learning</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold gradient-text mb-6">Can't Find What You Need?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Our support team is ready to help with any questions or custom training needs you may have.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
              Contact Support
            </Button>
            <Button variant="outline">
              Request Custom Training
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Tutorials;
