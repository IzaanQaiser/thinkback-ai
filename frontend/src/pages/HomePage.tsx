import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  Brain, 
  Search, 
  Zap, 
  Globe, 
  ArrowRight,
  Bookmark,
  Sparkles,
  Clock
} from 'lucide-react';

const HomePage: React.FC = () => {
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    document.title = 'thinkback - Make your doomscrolling productive';
    
    AOS.init({
      duration: 250,
      easing: 'ease-out-cubic',
      once: true,
      mirror: true,
    });

    // Intersection Observer to detect which section is in view
    const observerOptions = {
      threshold: 0.5,
      rootMargin: '-10% 0px -10% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const sectionIndex = ['hero', 'how-it-works', 'features', 'roadmap', 'final-cta'].indexOf(sectionId);
          if (sectionIndex !== -1) {
            setCurrentSection(sectionIndex);
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('#hero, #how-it-works, #features, #roadmap, #final-cta');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const SignInForm = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto justify-center items-center ${className}`}>
      <Link
        to="/auth"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 min-w-[120px] text-center shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105"
      >
        Sign In
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  // Section Navigation Indicator
  const SectionIndicator = () => (
    <div className={`fixed left-8 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-700 ease-in-out hidden md:block ${currentSection === 0 ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            onClick={() => {
              if (index === 0) {
                // Scroll to top for hero section
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                // Scroll to specific section for others
                const sections = ['hero', 'how-it-works', 'features', 'roadmap', 'final-cta'];
                const targetSection = document.getElementById(sections[index]);
                if (targetSection) {
                  targetSection.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
            className="group relative"
          >
            <div
              className={`transition-all duration-500 ease-out transform ${
                currentSection === index
                  ? 'w-2 h-4 bg-blue-300 rounded-full scale-110' // Vertical oval for current section, bigger and brighter
                  : 'w-2 h-2 bg-slate-400 rounded-full hover:bg-slate-300 hover:scale-110' // Circle for other sections
              }`}
            />
            {/* Tooltip */}
            <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap scale-95 group-hover:scale-100">
              {['Hero', 'How it Works', 'Features', 'Roadmap', 'Get Started'][index]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#1A1D29' }}>
      {/* Section Navigation Indicator */}
      <SectionIndicator />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 w-full bg-[#1A1D29]/70 backdrop-blur-sm border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/thinkback-logo.png" alt="Thinkback Logo" className="w-8 h-8 object-contain rounded-lg" />
            </div>
            <span className="text-lg font-semibold">thinkback</span>
          </div>
          <nav className="flex items-center gap-6 w-full justify-end">
            <a href="#features" className="hidden md:inline text-slate-300 hover:text-white transition-colors duration-150 ease-out text-sm">Features</a>
            <a href="#how-it-works" className="hidden md:inline text-slate-300 hover:text-white transition-colors duration-150 ease-out text-sm">How it works</a>
            <Link
              to="/auth"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors duration-150 ease-out text-base shadow-md text-white text-center whitespace-nowrap"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer to account for fixed navbar */}
      <div className="h-16"></div>

      {/* Hero Section */}
      <section id="hero" className="relative px-4 py-8 sm:py-12 w-full h-[calc(100vh-80px)] flex items-center" data-aos="fade-up">
        <div className="max-w-4xl mx-auto text-center w-full">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-12 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] -mt-8">
            Make your doomscrolling <span className="text-blue-300 drop-shadow-[0_0_20px_rgba(147,197,253,0.6)] animate-[pulse_3s_ease-out_infinite]">productive.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your personal AI vault for capturing and rediscovering the content that inspires you. Save from anywhere, find it when you need it.
          </p>
          
          <SignInForm className="mb-12" />
          
          <div>
            <p className="text-sm text-slate-400">
              Turn your
              <span className="font-semibold text-purple-400 mx-1">doomscrolling</span>
              into a
              <span className="font-semibold text-green-400 mx-1">productive task</span>
              with
              <span className="font-semibold text-blue-400 mx-1">thinkback</span>.
            </p>
          </div>
        </div>
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="px-4 py-32 bg-slate-800/30 w-full min-h-[calc(100vh-80px)] flex items-center" data-aos="fade-up">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Three simple steps to build your personal knowledge vault
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 w-full">
            <div className="text-center group" data-aos="zoom-in" data-aos-delay="50">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600/30 transition-colors">
                <Bookmark className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Save from anywhere</h3>
              <p className="text-slate-300 leading-relaxed">
                Drop links from YouTube, Instagram, Reddit, TikTok, and more. Our AI instantly captures and processes your content.
              </p>
            </div>
            
            <div className="text-center group" data-aos="zoom-in" data-aos-delay="100">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-600/30 transition-colors">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI categorization</h3>
              <p className="text-slate-300 leading-relaxed">
                Advanced AI automatically categorizes and tags your content, making it searchable and organized without any effort.
              </p>
            </div>
            
            <div className="text-center group" data-aos="zoom-in" data-aos-delay="150">
              <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600/30 transition-colors">
                <Clock className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart resurfacing</h3>
              <p className="text-slate-300 leading-relaxed">
                Content resurfaces at the perfect moment when it's most relevant to your current interests and projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="features" className="px-4 py-32 w-full min-h-[calc(100vh-80px)] flex items-center" data-aos="fade-up">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why creators choose Thinkback</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Stop losing track of great content. Build a searchable vault of inspiration.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-150 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl" data-aos="zoom-in" data-aos-delay="50">
              <Search className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-3">Instant search</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Find any saved content in seconds with AI-powered semantic search across all your platforms.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-150 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl" data-aos="zoom-in" data-aos-delay="100">
              <Globe className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold mb-3">Multi-platform</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Works with YouTube, Instagram, Reddit, TikTok, Twitter, and any web content you want to save.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-150 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl" data-aos="zoom-in" data-aos-delay="150">
              <Zap className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-3">Smart insights</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Discover patterns in your saved content and get personalized recommendations for new material.
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-150 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl" data-aos="zoom-in" data-aos-delay="200">
              <Brain className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="text-lg font-semibold mb-3">Zero effort</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                No manual tagging or organization needed. AI handles everything so you can focus on creating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline/Phase Agenda Section */}
      <section id="roadmap" className="px-4 py-32 w-full min-h-[calc(100vh-80px)] flex items-center" data-aos="fade-up">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">Product Roadmap</h2>
          <ol className="relative border-l-2 border-blue-700/30 pl-6">
            <li className="mb-12">
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 bg-blue-600 rounded-full mr-3"></span>
                <span className="font-semibold text-lg">Phase 1: AI-Categorized Vault</span>
              </div>
              <p className="text-slate-300 ml-7">Save content from YouTube, Instagram, TikTok, and more into your Thinkback vault. Each entry is scraped, categorized by AI, and summarized for you.</p>
            </li>
            <li className="mb-12">
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 bg-blue-600 rounded-full mr-3"></span>
                <span className="font-semibold text-lg">Phase 2: Custom AI Model</span>
              </div>
              <p className="text-slate-300 ml-7">Develop a proprietary model to watch videos and extract deeper context, making your saved entries even richer and more useful.</p>
            </li>
            <li className="mb-12">
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 bg-blue-600 rounded-full mr-3"></span>
                <span className="font-semibold text-lg">Phase 3: Context-Aware Recommendations</span>
              </div>
              <p className="text-slate-300 ml-7">Leverage global and user context to recommend entries based on real-world events and your activity. E.g., surface investment strategies when the market changes.</p>
            </li>
            <li className="mb-12">
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 bg-blue-600 rounded-full mr-3"></span>
                <span className="font-semibold text-lg">Phase 4: Conversational Retrieval</span>
              </div>
              <p className="text-slate-300 ml-7">Chat with your vault—retrieve and interact with your saved content using natural language, powered by a system trained on your entries.</p>
            </li>
            <li className="mb-12">
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 bg-blue-600 rounded-full mr-3"></span>
                <span className="font-semibold text-lg">Phase 5: Journaling & Calendar Integration</span>
              </div>
              <p className="text-slate-300 ml-7">Integrate your journal and calendar to enable context-aware suggestions—e.g., recommend relaxing content when your schedule frees up.</p>
            </li>
            <li>
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 bg-blue-600 rounded-full mr-3"></span>
                <span className="font-semibold text-lg">Phase 6: Native Platform Integration</span>
              </div>
              <p className="text-slate-300 ml-7">Deeper integration with supported platforms (e.g., Chrome extension, share sheets, and eventually direct integration with apps like YouTube and Instagram).</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="px-4 py-32 bg-gradient-to-r from-blue-600/10 to-purple-600/10 w-full min-h-[calc(100vh-80px)] flex items-center" data-aos="fade-up">
        <div className="max-w-4xl mx-auto text-center w-full">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to build your knowledge vault?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Start organizing your content today and never lose track of great ideas again.
          </p>
          
          <SignInForm className="mb-8" />
          
          <div className="flex justify-center gap-6 text-sm">
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 