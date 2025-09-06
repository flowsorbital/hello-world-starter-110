import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Phone, Users, Globe, Check, Star, Calendar as CalendarIcon, Mail, MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Homepage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isBookingDemo, setIsBookingDemo] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [contactForm, setContactForm] = useState({
    fullName: "",
    email: "",
    company: "",
    reason: "",
    message: ""
  });
  const [demoForm, setDemoForm] = useState({
    fullName: "",
    email: "",
    company: "",
    phone: "",
    useCase: ""
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission to Supabase
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setContactForm({ fullName: "", email: "", company: "", reason: "", message: "" });
  };

  const handleDemoBooking = async () => {
    if (!selectedDate || !demoForm.fullName || !demoForm.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a date.",
        variant: "destructive"
      });
      return;
    }
    
    // TODO: Implement demo booking to Supabase and send confirmation email
    toast({
      title: "Demo booked!",
      description: "You'll receive a confirmation email shortly.",
    });
    setIsBookingDemo(false);
    setDemoForm({ fullName: "", email: "", company: "", phone: "", useCase: "" });
    setSelectedDate(undefined);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                OrbitalConnect AI
              </button>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection("solutions")} className="text-foreground hover:text-primary transition-colors">
                Solutions
              </button>
              <button onClick={() => scrollToSection("integrations")} className="text-foreground hover:text-primary transition-colors">
                Integrations
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-foreground hover:text-primary transition-colors">
                Pricing
              </button>
              <button onClick={() => scrollToSection("resources")} className="text-foreground hover:text-primary transition-colors">
                Resources
              </button>
              <button onClick={() => scrollToSection("contact")} className="text-foreground hover:text-primary transition-colors">
                Contact Us
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/signup")}>
                    Get Started
                  </Button>
                  <Button onClick={() => navigate("/login")}>
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your Business Conversations{" "}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              Powered by AI from Orbit
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Create Voice Agents in minutes to book appointments, qualify leads, manage renewals and support customers.
          </p>
          <div className="flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary hover:bg-primary-hover text-lg px-8 py-4">
                  Book a Demo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <BookDemoModal 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                demoForm={demoForm}
                setDemoForm={setDemoForm}
                onBookDemo={handleDemoBooking}
              />
            </Dialog>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-brand opacity-10 blur-3xl rounded-full"></div>
            <div className="relative bg-card border rounded-2xl p-8 shadow-large">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="flex flex-col items-center">
                  <Phone className="h-16 w-16 text-primary mb-4" />
                  <h3 className="font-semibold text-lg">Voice Agents</h3>
                  <p className="text-muted-foreground text-center">Human-like conversations</p>
                </div>
                <div className="flex flex-col items-center">
                  <Users className="h-16 w-16 text-secondary mb-4" />
                  <h3 className="font-semibold text-lg">Smart Automation</h3>
                  <p className="text-muted-foreground text-center">24/7 customer engagement</p>
                </div>
                <div className="flex flex-col items-center">
                  <Globe className="h-16 w-16 text-primary mb-4" />
                  <h3 className="font-semibold text-lg">Global Reach</h3>
                  <p className="text-muted-foreground text-center">Multi-language support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Solutions for Every Business Need</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform your customer interactions with AI-powered voice agents that work around the clock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SolutionCard
              icon={<Phone className="h-8 w-8" />}
              title="📞 Inbound"
              problems={[
                "Missed calls = lost revenue",
                "Long hold times = poor CX", 
                "Repetitive FAQs = agent fatigue"
              ]}
            />
            <SolutionCard
              icon={<Users className="h-8 w-8" />}
              title="📢 Outbound"
              problems={[
                "Manual lead calling = time drain",
                "Missed follow-ups = low conversion",
                "Inefficient campaigns = wasted spend"
              ]}
            />
            <SolutionCard
              icon={<Globe className="h-8 w-8" />}
              title="🌐 Website Voice Widget"
              problems={[
                "Chatbots feel robotic",
                "No human-like interaction",
                "Voice-first web agents = next-gen support"
              ]}
            />
          </div>

          <div className="text-center mt-12">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary hover:bg-primary-hover">
                  Book a Demo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <BookDemoModal 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                demoForm={demoForm}
                setDemoForm={setDemoForm}
                onBookDemo={handleDemoBooking}
              />
            </Dialog>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Seamlessly connect with your tools</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Integrate with your existing workflow and maximize productivity with our comprehensive integration ecosystem.
          </p>

          {/* Scrolling Brand Logos */}
          <div className="overflow-hidden mb-12">
            <div className="flex animate-scroll">
              {[...integrationLogos, ...integrationLogos].map((logo, index) => (
                <div key={index} className="flex items-center justify-center min-w-[200px] mx-8">
                  <img 
                    src={`https://logo.clearbit.com/${logo.domain}`} 
                    alt={logo.name}
                    className="h-12 w-auto grayscale hover:grayscale-0 transition-all duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-lg font-semibold text-muted-foreground">${logo.name}</span>`;
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary-hover">
                Book a Demo
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </DialogTrigger>
            <BookDemoModal 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              demoForm={demoForm}
              setDemoForm={setDemoForm}
              onBookDemo={handleDemoBooking}
            />
          </Dialog>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your business needs. Scale up or down anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <PricingCard
              name="Starter"
              price="$50"
              period="/mo"
              features={[
                "250 minutes",
                "2 integrations",
                "Email support",
                "Basic analytics"
              ]}
            />
            <PricingCard
              name="Growth"
              price="$150"
              period="/mo"
              features={[
                "800 minutes",
                "5 integrations", 
                "Priority support",
                "Advanced analytics"
              ]}
              popular
            />
            <PricingCard
              name="Pro"
              price="$400"
              period="/mo"
              features={[
                "2200 minutes",
                "10 integrations",
                "Advanced analytics",
                "Custom workflows"
              ]}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              period="pricing"
              features={[
                "5000+ minutes",
                "Unlimited integrations",
                "Dedicated manager",
                "White-label options"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Resources/FAQs Section */}
      <section id="resources" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about OrbitalConnect AI
            </p>
          </div>

          <Accordion type="single" collapsible className="mb-12">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary hover:bg-primary-hover">
                  Book a Demo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <BookDemoModal 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                demoForm={demoForm}
                setDemoForm={setDemoForm}
                onBookDemo={handleDemoBooking}
              />
            </Dialog>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h2>
            <p className="text-xl text-muted-foreground">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={contactForm.fullName}
                    onChange={(e) => setContactForm({...contactForm, fullName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Select value={contactForm.reason} onValueChange={(value) => setContactForm({...contactForm, reason: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="query">Query</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary-hover">
                  Send Message
                </Button>
              </form>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-primary mr-3" />
                    <span>support@orbitalconnect.ai</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-3" />
                    <span>San Francisco, CA</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Prefer a demo instead?</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Book a Demo
                      <CalendarIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <BookDemoModal 
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    demoForm={demoForm}
                    setDemoForm={setDemoForm}
                    onBookDemo={handleDemoBooking}
                  />
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-4">
                OrbitalConnect AI
              </h3>
              <p className="text-muted-foreground">
                Revolutionizing business conversations with AI-powered voice agents.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><button onClick={() => scrollToSection("solutions")}>Inbound Calls</button></li>
                <li><button onClick={() => scrollToSection("solutions")}>Outbound Campaigns</button></li>
                <li><button onClick={() => scrollToSection("solutions")}>Website Widget</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><button onClick={() => scrollToSection("pricing")}>Pricing</button></li>
                <li><button onClick={() => scrollToSection("resources")}>Resources</button></li>
                <li><button onClick={() => scrollToSection("contact")}>Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">© 2025 OrbitalConnect AI. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-muted-foreground">Follow us on social media</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component definitions continue...
const SolutionCard = ({ icon, title, problems }: { icon: React.ReactNode; title: string; problems: string[] }) => (
  <Card className="text-center hover:shadow-large transition-shadow">
    <CardHeader>
      <div className="flex justify-center mb-4 text-primary">
        {icon}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {problems.map((problem, index) => (
          <li key={index} className="text-muted-foreground">{problem}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const PricingCard = ({ name, price, period, features, popular = false }: {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleSubscribe = () => {
    if (!user) {
      navigate("/login");
    } else {
      // Handle subscription logic here - navigate to billing/subscription page
      navigate("/dashboard");
    }
  };

  return (
    <Card className={cn("relative", popular && "border-primary shadow-large")}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-1">{period}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button onClick={handleSubscribe} className="w-full bg-primary hover:bg-primary-hover">
          Subscribe
        </Button>
      </CardContent>
    </Card>
  );
};

const BookDemoModal = ({ selectedDate, setSelectedDate, demoForm, setDemoForm, onBookDemo }: any) => (
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-2xl">Book Your Demo</DialogTitle>
    </DialogHeader>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="demo-fullName">Full Name *</Label>
          <Input
            id="demo-fullName"
            value={demoForm.fullName}
            onChange={(e) => setDemoForm({...demoForm, fullName: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="demo-email">Business Email *</Label>
          <Input
            id="demo-email"
            type="email"
            value={demoForm.email}
            onChange={(e) => setDemoForm({...demoForm, email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="demo-company">Company Name</Label>
          <Input
            id="demo-company"
            value={demoForm.company}
            onChange={(e) => setDemoForm({...demoForm, company: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="demo-phone">Phone Number</Label>
          <Input
            id="demo-phone"
            type="tel"
            value={demoForm.phone}
            onChange={(e) => setDemoForm({...demoForm, phone: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="demo-useCase">Use Case</Label>
          <Select value={demoForm.useCase} onValueChange={(value) => setDemoForm({...demoForm, useCase: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select your primary use case" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="website">Website Widget</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label className="text-sm font-medium mb-2 block">Select a Date *</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
      </div>
    </div>
    
    <Button onClick={onBookDemo} className="w-full bg-primary hover:bg-primary-hover mt-6">
      Confirm Booking
    </Button>
  </DialogContent>
);

const integrationLogos = [
  { name: "Google Calendar", domain: "calendar.google.com" },
  { name: "HubSpot", domain: "hubspot.com" }, 
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Make.com", domain: "make.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Zapier", domain: "zapier.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Microsoft Teams", domain: "teams.microsoft.com" },
  { name: "Zoom", domain: "zoom.us" },
  { name: "Calendly", domain: "calendly.com" },
  { name: "Mailchimp", domain: "mailchimp.com" },
  { name: "ActiveCampaign", domain: "activecampaign.com" }
];

const faqs = [
  {
    question: "What is a Voice Agent?",
    answer: "A Voice Agent is an AI-powered virtual assistant that can have natural conversations with your customers over the phone. It can handle inquiries, book appointments, qualify leads, and provide support 24/7."
  },
  {
    question: "How do I set up my first campaign?",
    answer: "Setting up your first campaign is simple. Just use our intuitive campaign builder, define your goals, upload your contact list, and launch. Our platform guides you through each step."
  },
  {
    question: "Do I need technical skills to use OrbitalConnect AI?",
    answer: "Not at all! OrbitalConnect AI is designed for business users with no technical background. Our drag-and-drop interface and pre-built templates make it easy to get started."
  },
  {
    question: "Which integrations are supported?",
    answer: "We support integrations with popular CRM systems like HubSpot and Salesforce, calendar apps like Google Calendar, payment processors like Stripe, and automation tools like Zapier and Make.com."
  },
  {
    question: "Can I scale minutes as I grow?",
    answer: "Absolutely! You can upgrade your plan at any time to get more minutes and additional features. We also offer custom enterprise solutions for high-volume needs."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes! We offer a 7-day free trial with 50 minutes included so you can test our platform risk-free. No credit card required to start."
  }
];

export default Homepage;