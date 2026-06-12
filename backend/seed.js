const User = require('./models/User');
const Company = require('./models/Company');
const Job = require('./models/Job');
const bcrypt = require('bcryptjs');

const COMPANIES = [
  {
    user: { firstName: 'Google', lastName: 'Hiring', email: 'hiring@google.com', password: 'Google123!' },
    profile: { companyName: 'Google', govRegId: 'U72200KA2003PTC031234', gstCin: '29AABCG3194A1ZU', verifiedStatus: 'verified', description: 'Google LLC is a global technology leader specializing in internet-related services and products, including search, cloud computing, advertising, and AI.', website: 'https://careers.google.com', location: 'Mountain View, CA', industry: 'Technology' },
    jobs: [
      { title: 'Senior Frontend Engineer', description: 'Build next-gen user experiences for Google Search and Maps using React, TypeScript, and modern web standards. You will work with a world-class team to ship features used by billions of people daily. Responsibilities include component architecture, performance optimization, and accessibility compliance.', skillsRequired: ['react', 'typescript', 'javascript', 'html', 'css', 'graphql', 'node.js'], location: 'Mountain View, CA', salaryRange: '$150k – $220k', jobType: 'Full-time' },
      { title: 'Machine Learning Engineer', description: 'Design and deploy large-scale ML models for Google Cloud AI products. Work on TensorFlow-based pipelines, model optimization, and real-time inference systems. Collaborate with research teams to bring cutting-edge papers into production.', skillsRequired: ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'data science', 'docker'], location: 'San Francisco, CA', salaryRange: '$170k – $250k', jobType: 'Full-time' }
    ]
  },
  {
    user: { firstName: 'Microsoft', lastName: 'Talent', email: 'talent@microsoft.com', password: 'Microsoft123!' },
    profile: { companyName: 'Microsoft', govRegId: 'U72900MH1998PTC456789', gstCin: '27AAACM5374C1ZN', verifiedStatus: 'verified', description: 'Microsoft Corporation develops, manufactures, and sells software, consumer electronics, and personal computers. Known for Windows, Azure, Office 365, and LinkedIn.', website: 'https://careers.microsoft.com', location: 'Redmond, WA', industry: 'Technology' },
    jobs: [
      { title: 'Full Stack Developer', description: 'Join Azure DevOps to build scalable cloud-native applications. Work across the entire stack using React, C#/.NET, and Azure services. You will design RESTful APIs, implement CI/CD pipelines, and mentor junior engineers.', skillsRequired: ['react', 'node.js', 'c#', 'sql', 'azure', 'docker', 'kubernetes', 'rest api'], location: 'Redmond, WA', salaryRange: '$140k – $200k', jobType: 'Full-time' },
      { title: 'Cloud DevOps Engineer', description: 'Architect and maintain infrastructure for Azure at scale. Design Kubernetes clusters, Terraform modules, and CI/CD pipelines for globally distributed services.', skillsRequired: ['docker', 'kubernetes', 'terraform', 'azure', 'linux', 'bash', 'python', 'ci/cd'], location: 'Remote', salaryRange: '$130k – $185k', jobType: 'Full-time' }
    ]
  },
  {
    user: { firstName: 'Amazon', lastName: 'Jobs', email: 'jobs@amazon.com', password: 'Amazon123!' },
    profile: { companyName: 'Amazon', govRegId: 'U51100KA2010PTC112233', gstCin: '29AABCA8911B1ZZ', verifiedStatus: 'verified', description: 'Amazon is a multinational technology company focusing on e-commerce, cloud computing (AWS), artificial intelligence, and digital streaming.', website: 'https://amazon.jobs', location: 'Seattle, WA', industry: 'E-Commerce & Cloud' },
    jobs: [
      { title: 'Backend Engineer – AWS', description: 'Build and scale core AWS services handling millions of requests per second. Design distributed systems, implement microservices using Java and Go, and optimize database performance for DynamoDB and RDS.', skillsRequired: ['java', 'go', 'aws', 'dynamodb', 'microservices', 'rest api', 'docker', 'sql'], location: 'Seattle, WA', salaryRange: '$145k – $210k', jobType: 'Full-time' },
      { title: 'Data Science Intern', description: 'Work with the Amazon Personalization team to build recommendation models using Python, Pandas, and scikit-learn. Analyze customer behavior data and build dashboards with Tableau.', skillsRequired: ['python', 'pandas', 'numpy', 'scikit-learn', 'data science', 'data analysis', 'sql', 'tableau'], location: 'Bangalore, India', salaryRange: '₹50k – ₹80k/month', jobType: 'Internship' }
    ]
  },
  {
    user: { firstName: 'Stripe', lastName: 'Engineering', email: 'eng@stripe.com', password: 'Stripe123!' },
    profile: { companyName: 'Stripe', govRegId: 'U65990MH2016PTC287654', gstCin: '27AADCS2814E1ZN', verifiedStatus: 'verified', description: 'Stripe is a financial infrastructure platform for the internet. Millions of businesses use Stripe to accept payments, grow revenue, and accelerate new business opportunities.', website: 'https://stripe.com/jobs', location: 'San Francisco, CA', industry: 'Fintech' },
    jobs: [
      { title: 'React Frontend Developer', description: 'Build the Stripe Dashboard used by millions of merchants worldwide. Implement complex financial data visualizations, payment flow UIs, and real-time transaction monitoring interfaces using React and TypeScript.', skillsRequired: ['react', 'typescript', 'javascript', 'css', 'graphql', 'jest', 'html'], location: 'Remote', salaryRange: '$130k – $190k', jobType: 'Full-time' },
      { title: 'API Platform Engineer', description: 'Design and maintain Stripe\'s world-class RESTful and GraphQL APIs. Work on API versioning, rate limiting, webhook delivery, and developer tooling using Ruby and Go.', skillsRequired: ['ruby', 'go', 'rest api', 'graphql', 'postgresql', 'redis', 'docker', 'git'], location: 'San Francisco, CA', salaryRange: '$155k – $225k', jobType: 'Full-time' }
    ]
  },
  {
    user: { firstName: 'Netflix', lastName: 'Studios', email: 'tech@netflix.com', password: 'Netflix123!' },
    profile: { companyName: 'Netflix', govRegId: 'U92130DL2016PTC301122', gstCin: '07AACCN4521D1ZX', verifiedStatus: 'verified', description: 'Netflix is the world\'s leading streaming entertainment service with over 230 million memberships in 190+ countries, offering TV series, documentaries, films, and mobile games.', website: 'https://jobs.netflix.com', location: 'Los Gatos, CA', industry: 'Entertainment & Tech' },
    jobs: [
      { title: 'UI Engineer – Content Platform', description: 'Build the Netflix content browsing experience across web and TV devices. Optimize rendering performance for low-powered devices, implement A/B testing frameworks, and work with the design system team.', skillsRequired: ['react', 'javascript', 'typescript', 'node.js', 'css', 'webpack', 'jest'], location: 'Los Gatos, CA', salaryRange: '$160k – $240k', jobType: 'Full-time' },
      { title: 'Data Engineer – Analytics', description: 'Build data pipelines processing petabytes of streaming data daily. Work with Apache Spark, Kafka, and Flink to power real-time analytics for content recommendations and business intelligence.', skillsRequired: ['python', 'sql', 'aws', 'docker', 'data analysis', 'postgresql', 'linux'], location: 'Remote', salaryRange: '$140k – $200k', jobType: 'Full-time' }
    ]
  },
  {
    user: { firstName: 'Spotify', lastName: 'Tech', email: 'careers@spotify.com', password: 'Spotify123!' },
    profile: { companyName: 'Spotify', govRegId: 'U74999TN2018PTC125566', gstCin: '33AAECS7733F1ZF', verifiedStatus: 'verified', description: 'Spotify is the most popular audio streaming platform globally, providing access to millions of songs, podcasts, and audiobooks from creators all over the world.', website: 'https://lifeatspotify.com', location: 'Stockholm, Sweden', industry: 'Music & Technology' },
    jobs: [
      { title: 'Mobile Developer – React Native', description: 'Build features for the Spotify mobile app serving 500M+ users. Implement audio playback features, offline mode improvements, and social sharing using React Native and native modules.', skillsRequired: ['react native', 'javascript', 'typescript', 'ios', 'android', 'react', 'git'], location: 'Stockholm, Sweden', salaryRange: '€70k – €110k', jobType: 'Full-time' },
      { title: 'Backend Engineer – Microservices', description: 'Design and scale microservices powering Spotify\'s playlist, search, and recommendation engines. Work with Java, gRPC, and Google Cloud Platform in a squad-based agile environment.', skillsRequired: ['java', 'python', 'gcp', 'docker', 'kubernetes', 'microservices', 'postgresql', 'git'], location: 'London, UK', salaryRange: '£80k – £120k', jobType: 'Full-time' }
    ]
  }
];

async function seedDatabase() {
  try {
    // Check if already seeded
    const existingJobs = await Job.countDocuments();
    if (existingJobs > 0) {
      console.log(`[Seed] Database already has ${existingJobs} jobs — skipping seed`);
      return;
    }

    console.log('[Seed] Populating database with company and job data...');
    const hashedPassword = await bcrypt.hash('Company123!', 10);

    let totalJobs = 0;

    for (const companyData of COMPANIES) {
      // Create company user
      const user = await User.create({
        firstName: companyData.user.firstName,
        lastName: companyData.user.lastName,
        email: companyData.user.email,
        password: hashedPassword,
        role: 'company'
      });

      // Create company profile
      const company = await Company.create({
        user: user._id,
        ...companyData.profile
      });

      // Create jobs
      for (const jobData of companyData.jobs) {
        await Job.create({
          ...jobData,
          company: company._id,
          status: 'open'
        });
        totalJobs++;
      }
    }

    console.log(`[Seed] ✓ Created ${COMPANIES.length} companies with ${totalJobs} job listings`);
  } catch (error) {
    console.error('[Seed] Error:', error.message);
  }
}

module.exports = seedDatabase;
module.exports.COMPANIES = COMPANIES;
