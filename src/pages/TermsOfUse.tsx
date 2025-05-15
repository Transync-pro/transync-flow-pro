
import PageLayout from "@/components/PageLayout";

const TermsOfUse = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold gradient-text mb-8">Terms of Use</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {currentDate}</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Use constitute a legally binding agreement between you and TransyncPro ("we," "our," or "us") regarding your use of our website, products, and services (collectively, the "Services").
            </p>
            <p className="text-gray-700">
              By accessing or using our Services, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these Terms of Use, you must not access or use our Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              You must be at least 18 years old and have the legal capacity to enter into a binding agreement to use our Services. By using our Services, you represent and warrant that you meet these requirements.
            </p>
            <p className="text-gray-700">
              If you are accessing or using our Services on behalf of a business entity, you represent and warrant that you have the authority to bind that entity to these Terms of Use.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">3. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              In order to access certain features of our Services, you may need to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            <p className="text-gray-700 mb-4">
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your account at our discretion without notice if we suspect any unauthorized access or use of your account or any violation of these Terms of Use.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">4. Subscription and Payment</h2>
            <p className="text-gray-700 mb-4">
              Some of our Services are available on a subscription basis. By subscribing to our Services, you agree to pay the applicable subscription fees as described on our website. All fees are in US dollars and are non-refundable except as expressly provided in these Terms of Use.
            </p>
            <p className="text-gray-700 mb-4">
              Subscription fees are billed in advance on a monthly or annual basis, depending on the subscription plan you select. You authorize us to charge your chosen payment method for all subscription fees.
            </p>
            <p className="text-gray-700">
              We reserve the right to change our subscription fees at any time. If we change our subscription fees, we will provide notice of the change on our website or by email at least 30 days before the change takes effect.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">5. QuickBooks Integration</h2>
            <p className="text-gray-700 mb-4">
              Our Services integrate with QuickBooks accounting software. By connecting your QuickBooks account to our Services, you grant us permission to access and use your QuickBooks data as necessary to provide our Services to you.
            </p>
            <p className="text-gray-700 mb-4">
              You represent and warrant that you have all necessary rights and permissions to share your QuickBooks data with us and to allow us to access and use such data as described in these Terms of Use.
            </p>
            <p className="text-gray-700">
              We are not responsible for any errors, omissions, or issues with your QuickBooks data or for any problems that may arise from your use of QuickBooks.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">6. Use Restrictions</h2>
            <p className="text-gray-700 mb-4">
              You agree not to use our Services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">In any way that violates any applicable federal, state, local, or international law or regulation</li>
              <li className="mb-2">To engage in any activity that is fraudulent, false, or misleading</li>
              <li className="mb-2">To impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
              <li className="mb-2">To engage in any conduct that restricts or inhibits anyone's use or enjoyment of our Services</li>
              <li className="mb-2">To attempt to gain unauthorized access to our Services, systems, or networks</li>
              <li className="mb-2">To introduce any viruses, Trojan horses, worms, logic bombs, or other malicious or technologically harmful material</li>
              <li className="mb-2">To interfere with the proper working of our Services</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">7. Intellectual Property Rights</h2>
            <p className="text-gray-700 mb-4">
              Our Services and all content, features, and functionality thereof (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by us, our licensors, or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <p className="text-gray-700 mb-4">
              These Terms of Use permit you to use our Services for your personal, non-commercial use only. You must not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Services, except as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials</li>
              <li className="mb-2">You may store files that are automatically cached by your web browser for display enhancement purposes</li>
              <li className="mb-2">You may print or download one copy of a reasonable number of pages of our Services for your own personal, non-commercial use and not for further reproduction, publication, or distribution</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">8. Data Security and Privacy</h2>
            <p className="text-gray-700 mb-4">
              We take data security and privacy seriously. Our collection and use of your personal information is governed by our Privacy Policy.
            </p>
            <p className="text-gray-700">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-gray-700 mb-4">
              OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-gray-700 mb-4">
              WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT OUR SERVICES OR THE SERVER THAT MAKES THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            <p className="text-gray-700">
              WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE CONTENT ON OUR SERVICES OR THE CONTENT OF ANY WEBSITES LINKED TO OUR SERVICES.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE, OUR AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, OUR SERVICES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.
            </p>
            <p className="text-gray-700">
              THE FOREGOING DOES NOT AFFECT ANY LIABILITY WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">11. Indemnification</h2>
            <p className="text-gray-700">
              You agree to defend, indemnify, and hold us harmless, including our affiliates, licensors, and service providers, and our and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms of Use or your use of our Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">12. Changes to Terms of Use</h2>
            <p className="text-gray-700 mb-4">
              We may revise and update these Terms of Use from time to time at our sole discretion. All changes are effective immediately when we post them, and apply to all access to and use of our Services thereafter.
            </p>
            <p className="text-gray-700">
              Your continued use of our Services following the posting of revised Terms of Use means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">13. Governing Law and Jurisdiction</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Use and any disputes or claims arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of the State of California, without giving effect to any choice or conflict of law provision or rule.
            </p>
            <p className="text-gray-700">
              Any legal suit, action, or proceeding arising out of, or related to, these Terms of Use or our Services shall be instituted exclusively in the federal courts of the United States or the courts of the State of California, in each case located in the City of Merced and County of Merced, although we retain the right to bring any suit, action, or proceeding against you for breach of these Terms of Use in your country of residence or any other relevant country.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">14. Severability</h2>
            <p className="text-gray-700">
              If any provision of these Terms of Use is held by a court or other tribunal of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms of Use will continue in full force and effect.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">15. Entire Agreement</h2>
            <p className="text-gray-700">
              These Terms of Use and our Privacy Policy constitute the sole and entire agreement between you and TransyncPro with respect to our Services and supersede all prior and contemporaneous understandings, agreements, representations and warranties, both written and oral, with respect to our Services.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-transyncpro-heading mb-4">16. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions or comments about these Terms of Use, please contact us at:
            </p>
            <div className="text-gray-700">
              <p>TransyncPro</p>
              <p>3075 Park Ave</p>
              <p>Merced, CA 95348</p>
              <p>Email: legal@transyncpro.com</p>
              <p>Phone: (800) 555-0123</p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default TermsOfUse;
