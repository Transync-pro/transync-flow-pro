
import PageLayout from "@/components/PageLayout";

const PrivacyPolicy = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold gradient-text mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {currentDate}</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              At TransyncPro ("we," "our," or "us"), we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            <p className="text-gray-700">
              By accessing or using TransyncPro, you consent to the practices described in this Privacy Policy. If you do not agree with the policies and practices described here, please do not use our services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect several types of information from and about users of our website and services, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">
                <strong>Personal Information:</strong> This includes information that can be used to identify you, such as your name, email address, postal address, phone number, and billing information.
              </li>
              <li className="mb-2">
                <strong>Account Information:</strong> Information you provide when creating an account, including your username, password, and profile information.
              </li>
              <li className="mb-2">
                <strong>Transaction Information:</strong> Details about purchases or transactions made through our website.
              </li>
              <li className="mb-2">
                <strong>Usage Data:</strong> Information about how you access and use our website and services, including your IP address, browser type, device information, operating system, and the pages you visit.
              </li>
              <li className="mb-2">
                <strong>QuickBooks Connection Data:</strong> When you connect your QuickBooks account to our service, we receive access to your QuickBooks data as authorized by you during the connection process.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">3. How We Collect Information</h2>
            <p className="text-gray-700 mb-4">
              We collect information in the following ways:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">
                <strong>Direct Collection:</strong> Information you provide when registering for an account, subscribing to our service, filling out forms, or corresponding with us.
              </li>
              <li className="mb-2">
                <strong>Automated Collection:</strong> As you navigate through our website, we may use cookies, web beacons, and other tracking technologies to collect usage data.
              </li>
              <li className="mb-2">
                <strong>Third-Party Sources:</strong> We may receive information about you from third-party partners, such as QuickBooks when you connect your account to our service.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">4. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect for various purposes, including to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">Provide, maintain, and improve our services</li>
              <li className="mb-2">Process transactions and send related information</li>
              <li className="mb-2">Respond to your comments, questions, and requests</li>
              <li className="mb-2">Communicate with you about our services, updates, and promotions</li>
              <li className="mb-2">Monitor and analyze usage patterns and trends to enhance user experience</li>
              <li className="mb-2">Protect against, identify, and prevent fraud and other illegal activities</li>
              <li className="mb-2">Comply with our legal obligations</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">
                <strong>With Service Providers:</strong> We may share your information with third-party vendors, consultants, and other service providers who perform services on our behalf.
              </li>
              <li className="mb-2">
                <strong>With Your Consent:</strong> We may share your information when you direct us to do so, such as when you connect our service to third-party applications.
              </li>
              <li className="mb-2">
                <strong>For Legal Reasons:</strong> We may disclose your information if required by law or in response to valid requests by public authorities.
              </li>
              <li className="mb-2">
                <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of the transaction.
              </li>
            </ul>
            <p className="text-gray-700">
              We do not sell your personal information to third parties.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">The right to access and receive a copy of your personal information</li>
              <li className="mb-2">The right to correct inaccurate or incomplete information</li>
              <li className="mb-2">The right to request deletion of your personal information</li>
              <li className="mb-2">The right to restrict or object to processing of your personal information</li>
              <li className="mb-2">The right to data portability</li>
              <li className="mb-2">The right to withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700">
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to collect information about your browsing activities on our website. Cookies are small data files stored on your device that help us improve our website and your experience, understand which areas of our website are most popular, and count visits.
            </p>
            <p className="text-gray-700 mb-4">
              You can control cookies through your browser settings and other tools. However, if you block certain cookies, you may not be able to register, log in, or access certain parts or make full use of the website.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our services are not intended for and we do not knowingly collect personal information from children under the age of 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information as quickly as possible.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            <p className="text-gray-700">
              We encourage you to review this Privacy Policy periodically for any changes. Your continued use of our services after any changes to this Privacy Policy will constitute your acceptance of such changes.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="text-gray-700">
              <p>TransyncPro</p>
              <p>3075 Park Ave</p>
              <p>Merced, CA 95348</p>
              <p>Email: privacy@transyncpro.com</p>
              <p>Phone: (800) 555-0123</p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;
