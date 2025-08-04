import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, 
              save content, or contact us for support. This may include your email address, name, 
              and any content you choose to save through our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, 
              to communicate with you, and to develop new features. We do not sell your personal information to third parties. If we ever consider new ways to use anonymized or aggregate data, we will notify users and request consent before proceeding.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, 
              no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at 
              <a href="mailto:izaanqaiser05@gmail.com" className="text-blue-400 hover:text-blue-300 ml-1">
                izaanqaiser05@gmail.com
              </a>
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage; 