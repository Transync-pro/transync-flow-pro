
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const BlogNewsletter: React.FC = () => {
  const [email, setEmail] = useState("");
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Subscription successful",
      description: "Thank you for subscribing to our newsletter!",
    });
    setEmail("");
  };
  
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold gradient-text mb-6">Subscribe to Our Newsletter</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Get the latest QuickBooks tips, accounting best practices, and TransyncPro updates delivered to your inbox.
        </p>
        
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input 
            type="email" 
            placeholder="Your email address" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-grow"
          />
          <Button 
            type="submit"
            className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white whitespace-nowrap"
          >
            Subscribe
          </Button>
        </form>
        
        <p className="text-xs text-gray-500 mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
};

export default BlogNewsletter;
