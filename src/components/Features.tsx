
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "Bulk Import",
    description: "Import thousands of records at once from CSV, Excel, or other formats directly into your QuickBooks account.",
    icon: "📥",
    color: "from-blue-500/20 to-purple-500/20",
    link: "/features/import"
  },
  {
    title: "Bulk Export",
    description: "Export your QuickBooks data in various formats for analysis, reporting, or backup purposes.",
    icon: "📤",
    color: "from-purple-500/20 to-indigo-500/20",
    link: "/features/export"
  },
  {
    title: "Bulk Delete",
    description: "Clean up your QuickBooks account by safely removing multiple records at once with validation checks.",
    icon: "🗑️",
    color: "from-indigo-500/20 to-blue-500/20",
    link: "/features/delete"
  },
  {
    title: "Data Validation",
    description: "Ensure data integrity with automatic validation before any import or deletion operations.",
    icon: "✓",
    color: "from-green-500/20 to-emerald-500/20",
    link: "/features/validation"
  },
  {
    title: "Custom Mapping",
    description: "Create and save custom field mappings for your frequent import and export operations.",
    icon: "🔄",
    color: "from-amber-500/20 to-yellow-500/20",
    link: "/features/mapping"
  },
  {
    title: "Scheduled Operations",
    description: "Set up recurring imports, exports, or maintenance operations on your preferred schedule.",
    icon: "🕒",
    color: "from-rose-500/20 to-pink-500/20",
    link: "/features/scheduled"
  }
];

const Features = () => {
  return (
    <section className="py-16 md:py-24 bg-transyncpro-ui-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Powerful Features for QuickBooks Users
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your QuickBooks data management with our comprehensive toolset
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover border border-gray-200 bg-white">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 bg-gradient-to-br ${feature.color}`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <a 
                  href={feature.link} 
                  className="text-transyncpro-button font-medium flex items-center hover:underline"
                >
                  Learn more <ArrowRight size={16} className="ml-2" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
