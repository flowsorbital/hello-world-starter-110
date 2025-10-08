import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

// Cal.com types
declare global {
  interface Window {
    Cal?: any;
  }
}

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
    
    if (!contactForm.fullName || !contactForm.email || !contactForm.company || !contactForm.reason || !contactForm.message) {
      toast({
        title: "All fields required",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save to Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          full_name: contactForm.fullName,
          email: contactForm.email,
          company: contactForm.company,
          reason: contactForm.reason,
          message: contactForm.message
        });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setContactForm({ fullName: "", email: "", company: "", reason: "", message: "" });
    } catch (error: any) {
      console.error('Error saving contact message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
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

  // Initialize Cal.com when component mounts
  useEffect(() => {
    // Cal.com inline embed script
    const calScript = `
      (function (C, A, L) { 
        let p = function (a, ar) { a.q.push(ar); }; 
        let d = C.document; 
        C.Cal = C.Cal || function () { 
          let cal = C.Cal; 
          let ar = arguments; 
          if (!cal.loaded) { 
            cal.ns = {}; 
            cal.q = cal.q || []; 
            d.head.appendChild(d.createElement("script")).src = A; 
            cal.loaded = true; 
          } 
          if (ar[0] === L) { 
            const api = function () { p(api, arguments); }; 
            const namespace = ar[1]; 
            api.q = api.q || []; 
            if(typeof namespace === "string"){
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar); 
            return;
          } 
          p(cal, ar); 
        }; 
      })(window, "https://app.cal.com/embed/embed.js", "init");
      
      Cal("init", "orbital-flows/30min", {origin:"https://cal.com"});
      Cal.ns["orbital-flows/30min"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
    `;

    // Execute the script
    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = calScript;
    document.head.appendChild(scriptElement);

    return () => {
      if (document.head.contains(scriptElement)) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

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
                 Orbital Flows
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
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary-hover text-lg px-8 py-4"
              data-cal-link="orbital-flows/30min"
              data-cal-namespace="orbital-flows/30min"
              data-cal-config='{"layout":"month_view"}'
            >
              Book a Demo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
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
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary-hover"
              data-cal-link="orbital-flows/30min"
              data-cal-namespace="orbital-flows/30min"
              data-cal-config='{"layout":"month_view"}'
            >
              Book a Demo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
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
                <div key={index} className="flex items-center justify-center min-w-[200px] mx-8 hover:scale-105 transition-transform">
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://logo.clearbit.com/${logo.domain}`} 
                      alt={logo.name}
                      className="h-8 w-auto filter"
                      style={{ filter: `drop-shadow(0 0 5px ${logo.color})` }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <span className="text-sm font-semibold" style={{ color: logo.color }}>
                      {logo.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary-hover"
            data-cal-link="orbital-flows/30min"
            data-cal-namespace="orbital-flows/30min"
            data-cal-config='{"layout":"month_view"}'
          >
            Book a Demo
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Growth"
              price="₹15,000"
              period="/mo"
              features={[
                "800 minutes",
                "1 integration", 
                "Priority support",
                "Advanced analytics"
              ]}
              popular
            />
            <PricingCard
              name="Pro"
              price="₹32,000"
              period="/mo"
              features={[
                "2200 minutes",
                "3 integrations",
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
              Everything you need to know about Orbital Flows
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
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary-hover"
              data-cal-link="orbital-flows/30min"
              data-cal-namespace="orbital-flows/30min"
              data-cal-config='{"layout":"month_view"}'
            >
              Book a Demo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h2>
            <p className="text-xl text-muted-foreground">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={contactForm.fullName}
                    onChange={(e) => setContactForm({...contactForm, fullName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Select value={contactForm.reason} onValueChange={(value) => setContactForm({...contactForm, reason: value})} required>
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
                    <span>flowsorbital@gmail.com</span>
                  </div>
                </div>
              </div>

              {/* Global Locations */}
              <div>
                <h3 className="text-2xl font-bold mb-4">Our Presence</h3>
                <div className="grid grid-cols-1 gap-4">
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <div className="font-semibold">Delhi</div>
                        <div className="text-sm text-muted-foreground">Headquarter</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Prefer a demo instead?</h3>
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-cal-link="orbital-flows/30min"
                  data-cal-namespace="orbital-flows/30min"
                  data-cal-config='{"layout":"month_view"}'
                >
                  Book a Demo
                  <CalendarIcon className="ml-2 h-4 w-4" />
                </Button>
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
                Orbital Flows
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
            <p className="text-muted-foreground">© 2025 Orbital Flows. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component definitions continue...
const SolutionCard = ({ icon, title, problems }: { icon: React.ReactNode; title: string; problems: string[] }) => (
  <Card className="text-center group hover:shadow-large hover:scale-105 hover:border-primary/50 transition-all duration-300 cursor-pointer">
    <CardHeader>
      <div className="flex justify-center mb-4 text-primary group-hover:text-secondary transition-colors">
        {icon}
      </div>
      <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {problems.map((problem, index) => (
          <li key={index} className="text-muted-foreground group-hover:text-foreground transition-colors">{problem}</li>
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
  { name: "Google Calendar", domain: "calendar.google.com", color: "#4285F4" },
  { name: "HubSpot", domain: "hubspot.com", color: "#FF7A59" }, 
  { name: "Salesforce", domain: "salesforce.com", color: "#00A1E0" },
  { name: "Make.com", domain: "make.com", color: "#6366F1" },
  { name: "Stripe", domain: "stripe.com", color: "#635BFF" },
  { name: "Zapier", domain: "zapier.com", color: "#FF4A00" },
  { name: "Slack", domain: "slack.com", color: "#4A154B" },
  { name: "Microsoft Teams", domain: "teams.microsoft.com", color: "#6264A7" },
  { name: "Zoom", domain: "zoom.us", color: "#2D8CFF" },
  { name: "Calendly", domain: "calendly.com", color: "#006BFF" },
  { name: "Mailchimp", domain: "mailchimp.com", color: "#FFE01B" },
  { name: "ActiveCampaign", domain: "activecampaign.com", color: "#356AE6" }
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
    question: "Do I need technical skills to use Orbital Flows?",
    answer: "Not at all! Orbital Flows is designed for business users with no technical background. Our drag-and-drop interface and pre-built templates make it easy to get started."
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
