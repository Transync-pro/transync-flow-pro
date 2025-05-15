
import { Mail, Phone, MapPin } from "lucide-react";

const ContactInfo = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold gradient-text mb-6">Contact Information</h2>
      
      <div className="space-y-6">
        <div className="flex items-start">
          <Mail className="h-6 w-6 text-transyncpro-heading mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Email</h3>
            <p className="text-gray-600">
              <a href="mailto:info@transyncpro.com" className="hover:text-transyncpro-heading">
                info@transyncpro.com
              </a>
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <Phone className="h-6 w-6 text-transyncpro-heading mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Phone</h3>
            <p className="text-gray-600">
              <a href="tel:+1-800-555-0123" className="hover:text-transyncpro-heading">
                (800) 555-0123
              </a>
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <MapPin className="h-6 w-6 text-transyncpro-heading mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Address</h3>
            <p className="text-gray-600">
              3075 Park Ave<br />
              Merced, CA 95348
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
        <table className="w-full text-left">
          <tbody>
            <tr>
              <td className="py-1 text-gray-600">Monday - Friday</td>
              <td className="py-1 text-gray-900">9:00 AM - 6:00 PM PST</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-600">Saturday</td>
              <td className="py-1 text-gray-900">10:00 AM - 4:00 PM PST</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-600">Sunday</td>
              <td className="py-1 text-gray-900">Closed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactInfo;
