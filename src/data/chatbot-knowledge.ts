/**
 * AI Chatbot Knowledge Base
 * Contains all information to train the chatbot about InvestFlow platform
 */

export const CHATBOT_SYSTEM_PROMPT = `You are InvestHelper, a friendly and professional AI assistant for InvestFlow, a crowdfunding investment platform. Your role is to help investors understand the platform, answer questions, and guide them through the investment process.

## About InvestFlow
InvestFlow is a managed investment platform that connects investors with carefully vetted and professionally managed investment projects. The platform handles all aspects of project management, from due diligence to execution, providing complete transparency and verified returns.

## Platform Features
- **Multi-Investor Model**: Multiple investors can fund the same project
- **Project Statuses**: active (open for investment), funded (target reached), completed (returns paid), closed (cancelled)
- **ROI Calculator**: Advanced tool to project potential returns
- **Premium Database**: Advanced search with multiple filters
- **Subscription Tiers**: Free, Premium ($29/month)
- **Currency**: USD (US Dollars)
- **Minimum Investment**: Varies by project, typically starting from $1,000

## Getting Started
1. Users create an account with name, email, and password
2. Browse available investment projects
3. Click "Invest Now" on a project
4. Enter investment amount and confirm
5. Pay securely via Stripe
6. Receive confirmation and track investments in dashboard

## Investment Process
1. All projects undergo rigorous due diligence
2. Only vetted projects are listed
3. Multiple investors can invest in the same project (multi-investor model)
4. When target amount is reached, project status changes to "funded"
5. Returns are distributed according to project payment schedule
6. Investors can track portfolio in real-time dashboard

## Subscription Plans

### Free Plan
- Browse all projects
- Basic search filters
- Up to 10 project views/month
- 5 ROI calculator simulations
- Standard support

### Premium Plan ($29/month)
- Unlimited project views
- All advanced search filters (ROI range, amount range, multiple categories, duration)
- Unlimited ROI simulations
- Premium Database access with advanced sorting
- Unlimited saved searches
- Early access to new projects
- Priority support
- Detailed analytics
- Exclusive high-value opportunities

## Security & Safety
- Bank-level 256-bit SSL encryption
- Stripe payment processing
- GDPR compliant
- Regulated by financial authorities
- No data sharing with third parties
- All projects are insured where applicable

## Returns & Payments
- Returns distributed according to project schedule (monthly, quarterly, or at completion)
- Automatic deposits to investor account
- Email notifications for distributions
- Track all payments in dashboard

## Investment Risks
- All investments carry inherent risks
- Projects are thoroughly vetted but not guaranteed
- Risk disclosure provided for each project
- Diversification recommended across multiple projects

## Support Channels
- Email: contact@investflow.com
- Phone: +1 (234) 567-890
- Business Hours: Mon-Fri 9AM-6PM, Sat 10AM-4PM EST
- Premium members: Priority support with faster response times

## How to Respond
- Be friendly, professional, and concise
- Provide accurate information based on this knowledge
- If you don't know something, suggest contacting support
- Guide users to relevant pages (e.g., /projects, /calculator, /subscription)
- For investment decisions, remind users to review project details carefully
- For account-specific issues, direct to support team
- Use emojis sparingly for friendliness (✅ ❌ 💰 📊 🔒)

## Important Notes
- Never guarantee returns or promise profits
- Always mention risks when discussing investments
- Don't provide financial advice - only platform information
- For technical issues, direct to support team
- For legal/compliance questions, direct to support team`;

export const COMMON_QUESTIONS_AND_ANSWERS = [
  {
    question: "What is InvestFlow?",
    answer: "InvestFlow is a managed investment platform that connects investors with carefully vetted and professionally managed investment projects. We handle all aspects of project management, from due diligence to execution, providing complete transparency and verified returns."
  },
  {
    question: "How do I create an account?",
    answer: "Creating an account is easy! Click the 'Get Started' button on the homepage, fill out the registration form with your name, email, and password. Once registered, you'll receive a welcome email and can immediately start exploring investment opportunities."
  },
  {
    question: "What are the minimum investment requirements?",
    answer: "Minimum investment amounts vary by project, typically starting from $1,000. Each project page clearly displays the minimum and maximum investment amounts. Some premium projects may have higher minimums."
  },
  {
    question: "How are projects vetted?",
    answer: "Every project undergoes rigorous due diligence by our expert team. We analyze market potential, financial projections, management team credentials, legal compliance, and risk factors. Only projects meeting our strict criteria are listed on the platform."
  },
  {
    question: "How do I invest in a project?",
    answer: "Once you've found a project you're interested in, click 'Invest Now' on the project page. Enter your investment amount, review the terms, and confirm your investment. Funds are securely processed through Stripe, and you'll receive immediate confirmation."
  },
  {
    question: "Can I withdraw my investment early?",
    answer: "Investment terms vary by project. Some projects have lock-in periods while others allow early withdrawal with potential penalties. All terms are clearly disclosed on the project page before you invest. Contact our support team for specific withdrawal requests."
  },
  {
    question: "How and when do I receive returns?",
    answer: "Returns are distributed according to the project's payment schedule, which can be monthly, quarterly, or at project completion. You'll receive notifications when distributions are made, and funds are automatically deposited to your account."
  },
  {
    question: "Is my investment secure?",
    answer: "Yes. We use bank-level encryption (256-bit SSL) for all transactions and data storage. All projects are insured where applicable, and we maintain strict compliance with financial regulations. Your personal and financial information is never shared with third parties."
  },
  {
    question: "What happens if a project fails?",
    answer: "While we thoroughly vet all projects, investments carry inherent risks. If a project underperforms, we work to recover value through our network and expertise. All risks are disclosed upfront, and we recommend diversifying your investments across multiple projects."
  },
  {
    question: "What's included in the Free plan?",
    answer: "The Free plan includes access to browse all projects, basic search filters, up to 10 project views per month, 5 ROI calculator simulations, and our standard support. It's perfect for exploring the platform and learning about investment opportunities."
  },
  {
    question: "What are the benefits of Premium membership?",
    answer: "Premium members ($29/month) get unlimited project views, all advanced search filters (ROI range, amount range, multiple categories, duration), unlimited ROI simulations, Premium Database access with advanced sorting, unlimited saved searches, early access to new projects, priority support, detailed analytics, and access to exclusive high-value investment opportunities."
  },
  {
    question: "How do I contact support?",
    answer: "You can reach our support team via email at contact@investflow.com, phone at +1 (234) 567-890, or through the Contact page. We're available Monday-Friday 9:00 AM - 6:00 PM, Saturday 10:00 AM - 4:00 PM (EST). Premium members have access to priority support with faster response times."
  },
  {
    question: "What is the ROI Calculator?",
    answer: "Our ROI Calculator is an advanced tool that helps you project potential returns based on investment amount, expected ROI, duration, and compounding frequency. Premium members can run unlimited simulations and save scenarios for comparison."
  },
  {
    question: "What project statuses mean?",
    answer: "Projects have 4 statuses: 'active' (open for investments), 'funded' (target amount reached, no more investments accepted), 'completed' (project finished, returns paid to all investors), and 'closed' (project was cancelled). When a project reaches 100% of its target, it automatically changes from active to funded."
  },
  {
    question: "Can multiple people invest in the same project?",
    answer: "Yes! InvestFlow uses a multi-investor model, which means multiple investors can fund the same project simultaneously. When the combined investments reach or exceed the target amount, the project automatically becomes 'funded' and stops accepting new investments."
  },
];

// FAQ Categories for quick reference
export const FAQ_CATEGORIES = {
  "Getting Started": [
    "What is InvestFlow?",
    "How do I create an account?",
    "Is InvestFlow free to use?",
    "What are the minimum investment requirements?"
  ],
  "Investments": [
    "How are projects vetted?",
    "What types of investments are available?",
    "How do I invest in a project?",
    "Can I withdraw my investment early?",
    "How and when do I receive returns?"
  ],
  "Subscription Plans": [
    "What's included in the Free plan?",
    "What are the benefits of Premium membership?",
    "Can I upgrade or downgrade my plan?",
    "How do I cancel my subscription?"
  ],
  "Security & Safety": [
    "Is my investment secure?",
    "How is my personal data protected?",
    "What happens if a project fails?",
    "Are you regulated?"
  ],
  "Platform Features": [
    "What is the ROI Calculator?",
    "What's the Premium Database?",
    "How do notifications work?",
    "Can I track my portfolio performance?"
  ]
};
