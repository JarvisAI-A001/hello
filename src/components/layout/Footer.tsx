import { Link } from "react-router-dom";
import { Layers, Mail, Github, Twitter, Linkedin, Youtube } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", path: "/#features" },
    { name: "Pricing", path: "/pricing" },
    { name: "Playground", path: "/playground" },
    { name: "API Docs", path: "#" },
  ],
  company: [
    { name: "About", path: "#" },
    { name: "Blog", path: "#" },
    { name: "Careers", path: "#" },
    { name: "Contact", path: "#" },
  ],
  legal: [
    { name: "Privacy Policy", path: "/policies#privacy" },
    { name: "Terms of Service", path: "/policies#terms" },
    { name: "Refund Policy", path: "/policies#refund" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "https://www.youtube.com/@modelstackapi", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <Layers className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-bold text-xl">
                model<span className="text-accent">stack</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-4">
              <Youtube className="w-4 h-4" />
              <span>@modelstackapi</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-sm mb-6">
              Empowering small and medium businesses with enterprise-grade AI solutions. 
              Build, deploy, and scale your AI projects effortlessly.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/50">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/50">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/50">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © 2024 ModelStack. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-primary-foreground/50">
            <Mail className="w-4 h-4" />
            <a href="mailto:support@modelstack.ai" className="hover:text-accent transition-colors">
              support@modelstack.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
