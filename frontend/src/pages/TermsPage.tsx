import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using Thinkback, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Use License</h2>
            <p className="text-gray-300 leading-relaxed">
              Permission is granted to temporarily use Thinkback for personal, non-commercial 
              transitory viewing only. This is the grant of a license, not a transfer of title, 
              and under this license you may not modify or copy the materials, use them for any 
              commercial purpose, or remove any copyright or other proprietary notations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">User Responsibilities</h2>
            <p className="text-gray-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account 
              or password. You may not use the service for any illegal or unauthorized purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">User Content and Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain full ownership of all content you save through our service. Thinkback 
              does not claim ownership of your saved content. However, by using our service, 
              you grant Thinkback the right to store, process, and display your content solely 
              for the purpose of providing the service to you. We will not use your content 
              for any other purpose without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to terminate or suspend your account at any time for violations 
              of these Terms of Service, including but not limited to illegal activities, 
              harassment, or abuse of our services. You may also terminate your account at any 
              time by contacting us. Upon termination, your access to the service will cease 
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Modification of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. We will notify 
              users of any material changes via email or through our service. Your continued 
              use of Thinkback after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              Your privacy is important to us. Please review our{' '}
              <a href="/privacy" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </a>
              , which also governs your use of the service and is incorporated into these Terms 
              of Service by reference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              In no event shall Thinkback or its suppliers be liable for any damages arising 
              out of the use or inability to use the materials on Thinkback's website, even 
              if Thinkback or a Thinkback authorized representative has been notified orally 
              or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at 
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

export default TermsPage; 