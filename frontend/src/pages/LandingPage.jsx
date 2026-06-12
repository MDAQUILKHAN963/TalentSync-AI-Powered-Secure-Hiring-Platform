import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Shield, Users, CheckCircle, Zap, MessageSquare, Mail, ChevronDown, Play, ArrowRight } from 'lucide-react';
import { FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';
import RoleSelectionModal from '../components/RoleSelectionModal';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../layouts/Navbar';
import FadeUp from '../components/animations/FadeUp';
import Stagger from '../components/animations/Stagger';
import StaggerItem from '../components/animations/StaggerItem';
import '../App.css';

const revealVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

const Section = ({ id, children, className }) => (
  <motion.section
    id={id}
    className={`landing-section ${className}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={revealVariants}
  >
    {children}
  </motion.section>
);

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
    return () => setTheme(localStorage.getItem('theme') || 'dark');
  }, [setTheme]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div className="landing-page-root dark">
      <motion.div className="scroll-progress" style={{ scaleX }} />
      
      <Navbar setIsModalOpen={setIsModalOpen} />

      {/* Fixed Hero Section */}
      <div className="hero-sticky-container">
        <div className="hero-glow-base" />
        <div className="hero-vertical-bars">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="hero-bar" />
          ))}
        </div>

        <main className="hero-content-vetra">
          <motion.h1
            className="vetra-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Trusted Opportunities <br />
            <motion.span 
              className="elegant-italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Smarter Careers.
            </motion.span>
          </motion.h1>

          <motion.p
            className="vetra-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            AI-driven recruitment & insights. Empower your future, connect with verified companies, and maximize your potential effortlessly.
          </motion.p>

          <motion.div 
            className="hero-actions-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <button className="btn-get-started-hero" onClick={() => setIsModalOpen(true)}>
              Get Started
            </button>
          </motion.div>

          <motion.div 
            className="hero-social-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="hero-social-icon">
              <FaInstagram size={18} />
            </div>
            <div className="hero-social-icon">
              <FaTwitter size={18} />
            </div>
            <div className="hero-social-icon">
              <FaLinkedin size={18} />
            </div>
          </motion.div>
        </main>
      </div>

      {/* Content Wrapper that scrolls over the Hero */}
      <div className="content-wrapper-next">
        <Section id="about" className="about-section">
          <FadeUp>
            <div className="section-header">
              <span className="section-badge">ABOUT US</span>
              <h2>Getting to know TalentSync</h2>
              <p>We are more than just a recruitment platform; we are your trusted partner in navigating the complexities of your career.</p>
            </div>
          </FadeUp>
          
          <div className="stats-grid">
            <motion.div className="stat-card orange" variants={slideLeft} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="stat-icon"><Users size={24} /></div>
              <div className="stat-value"><span>AI MATCHING</span></div>
              <p>Every job ranked against your parsed resume with a transparent match score — skills, semantics, and experience weighted.</p>
            </motion.div>
            <motion.div className="stat-card black" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="stat-icon"><Zap size={24} /></div>
              <div className="stat-value"><span>BIAS-FREE</span></div>
              <p>Name, gender, age, and contact details are stripped before AI scoring — candidates are judged on skills alone.</p>
            </motion.div>
            <motion.div className="stat-card gray" variants={slideRight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="stat-icon"><Shield size={24} /></div>
              <div className="stat-value"> <span>VERIFIED ONLY</span></div>
              <p>Every company is verified against government registration data, and AI fraud detection blocks scam postings in real time.</p>
            </motion.div>
          </div>
        </Section>

        <Section id="features" className="features-section">
          <div className="features-container">
            <FadeUp>
              <div className="section-header">
                <span className="section-badge">FEATURES</span>
                <h2>All-in-one platform for your future</h2>
                <p>Simplify your career search by securely connecting with verified companies and automated matching.</p>
              </div>
            </FadeUp>
            
            <Stagger>
              <div className="features-list">
                {[
                  { id: '01', title: 'Secure and Easy Verification', desc: 'Government-backed automated verification for all companies.' },
                  { id: '02', title: 'AI-Powered Job Matching', desc: 'Smarter recommendations based on your unique skills and profile.' },
                  { id: '03', title: 'Real-Time Application Tracking', desc: 'Monitor your progress from application to offer in one place.' }
                ].map(f => (
                  <StaggerItem key={f.id}>
                    <div className="feature-item">
                      <span className="feature-id">{f.id}</span>
                      <div className="feature-info">
                        <h4>{f.title}</h4>
                        <p>{f.desc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </Stagger>
          </div>
        </Section>

        <Section id="faqs" className="faq-section">
          <FadeUp>
            <div className="section-header">
              <span className="section-badge">FAQs</span>
              <h2>Frequently Asked Questions</h2>
            </div>
          </FadeUp>
          <Stagger>
            <div className="faq-grid">
              {[
                { q: "Is TalentSync free for students?", a: "Yes, TalentSync is completely free for all students looking for opportunities." },
                { q: "How does AI matching work?", a: "Our AI analyzes your skills, experience, and preferences to match you with the best roles." },
                { q: "Are all companies verified?", a: "Yes, we use government data and automated checks to ensure 100% verification." },
                { q: "Can I track my applications?", a: "Absolutely. Your dashboard provides real-time updates on every application." }
              ].map((item, i) => (
                <StaggerItem key={i}>
                  <div 
                    className={`faq-card ${activeFaq === i ? 'active' : ''}`}
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  >
                    <div className="faq-question">
                      <h4>{item.q}</h4>
                      <motion.div animate={{ rotate: activeFaq === i ? 180 : 0 }}>
                        <ChevronDown size={20} />
                      </motion.div>
                    </div>
                    <motion.div 
                      className="faq-answer"
                      initial={false}
                      animate={{ height: activeFaq === i ? 'auto' : 0, opacity: activeFaq === i ? 1 : 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </Section>

        <Section id="contact" className="contact-section">
          <div className="contact-container">
            <div className="contact-info">
              <h2>Let's build your future together</h2>
              <p>Have questions? Our team is here to help you get started.</p>
              <div className="contact-methods">
                <div className="method">
                  <Mail size={20} />
                  <span>support@talentsync.com</span>
                </div>
                <div className="method">
                  <MessageSquare size={20} />
                  <span>Live Chat Support</span>
                </div>
              </div>
            </div>
            <form className="contact-form" onSubmit={e => e.preventDefault()}>
              <div className="form-group">
                <input type="text" placeholder="Full Name" />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Email Address" />
              </div>
              <div className="form-group">
                <textarea placeholder="How can we help?" rows={4}></textarea>
              </div>
              <button className="btn btn-primary w-full">Send Message</button>
            </form>
          </div>
        </Section>

        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <Shield size={24} className="logo-icon" />
              <span>TalentSync</span>
            </div>
            <p>© 2026 TalentSync. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <RoleSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
