
import React from "react";

interface BlogHeroProps {
  title: string;
  description: string;
}

const BlogHero: React.FC<BlogHeroProps> = ({ title, description }) => {
  return (
    <section className="py-16 md:py-24 bg-gradient-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{title}</h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto">
          {description}
        </p>
      </div>
    </section>
  );
};

export default BlogHero;
