
import React from "react";

interface BlogHeroProps {
  title: string;
  description: string;
}

const BlogHero: React.FC<BlogHeroProps> = ({ title, description }) => {
  return (
    <section className="py-20 md:py-28 bg-gradient-primary relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/20"></div>
        <div className="absolute left-10 bottom-10 w-48 h-48 rounded-full bg-white/20"></div>
        <div className="absolute -left-20 top-1/3 w-72 h-72 rounded-full bg-white/10"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-sm">{title}</h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
};

export default BlogHero;
