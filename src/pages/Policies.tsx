import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, RefreshCw } from "lucide-react";

const policies = {
  privacy: {
    title: "Privacy Policy",
    icon: Shield,
    lastUpdated: "January 1, 2025",
    content: `
## 1. Information We Collect

### 1.1 Personal Information
When you create an account or use our services, we may collect:
- Name and email address
- Company name and billing information
- Usage data and preferences
- IP address and device information

### 1.2 Usage Data
We automatically collect information about how you interact with our platform:
- API call logs and performance metrics
- Feature usage patterns
- Error logs and diagnostics

## 2. How We Use Your Information

We use collected information to:
- Provide and maintain our services
- Process transactions and send related information
- Send technical notices, updates, and support messages
- Monitor and analyze usage patterns
- Detect, prevent, and address technical issues

## 3. Data Sharing and Disclosure

We do not sell your personal information. We may share data with:
- Service providers who assist in our operations
- Legal authorities when required by law
- Business partners with your consent

## 4. Data Security

We implement industry-standard security measures including:
- Encryption in transit and at rest
- Regular security audits
- Access controls and monitoring
- SOC 2 Type II compliance

## 5. Your Rights

You have the right to:
- Access your personal data
- Request data correction or deletion
- Opt-out of marketing communications
- Data portability

## 6. Contact Us

For privacy-related inquiries:
privacy@modelstack.ai
    `,
  },
  terms: {
    title: "Terms of Service",
    icon: FileText,
    lastUpdated: "January 1, 2025",
    content: `
## 1. Acceptance of Terms

By accessing or using ModelStack's services, you agree to be bound by these Terms of Service and all applicable laws and regulations.

## 2. Account Registration

### 2.1 Account Requirements
- You must be at least 18 years old
- Provide accurate and complete information
- Maintain the security of your account credentials
- Notify us immediately of unauthorized access

### 2.2 Account Responsibilities
You are responsible for all activities under your account and must comply with all applicable laws and our Acceptable Use Policy.

## 3. Service Description

ModelStack provides AI-powered business solutions including:
- AI Chatbot services
- Email automation tools
- Appointment scheduling
- Content generation

## 4. Payment Terms

### 4.1 Billing
- Subscription fees are billed in advance
- All fees are non-refundable unless stated otherwise
- We reserve the right to modify pricing with 30 days notice

### 4.2 Free Trial
- 14-day free trial available for new accounts
- No credit card required for trial period
- Full access to selected features during trial

## 5. Intellectual Property

### 5.1 Our Rights
ModelStack and its licensors retain all rights to the platform, technology, and associated intellectual property.

### 5.2 Your Content
You retain ownership of content you create using our services. You grant us a license to use this content to provide and improve our services.

## 6. Limitation of Liability

To the maximum extent permitted by law, ModelStack shall not be liable for any indirect, incidental, special, or consequential damages.

## 7. Termination

We may terminate or suspend your account for violation of these terms. Upon termination, your right to use the service ceases immediately.

## 8. Changes to Terms

We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.
    `,
  },
  refund: {
    title: "Refund Policy",
    icon: RefreshCw,
    lastUpdated: "January 1, 2025",
    content: `
## 1. Free Trial Period

### 1.1 Trial Terms
- All new accounts receive a 14-day free trial
- No payment information required during trial
- Full access to plan features during trial period
- Trial automatically ends; no automatic billing

## 2. Subscription Refunds

### 2.1 Monthly Subscriptions
- Refund requests accepted within 7 days of initial purchase
- No refunds for partial months after the 7-day period
- Account access continues until the end of the billing period

### 2.2 Annual Subscriptions
- Full refund available within 14 days of purchase
- Pro-rated refunds available within first 30 days
- No refunds after 30 days from purchase date

## 3. How to Request a Refund

### 3.1 Process
1. Log into your ModelStack account
2. Navigate to Settings > Billing
3. Click "Request Refund" and provide reason
4. Our team will review within 48 hours

### 3.2 Required Information
- Account email address
- Transaction ID or invoice number
- Reason for refund request

## 4. Refund Processing

### 4.1 Timeline
- Approved refunds processed within 5-7 business days
- Funds returned to original payment method
- Bank processing may add additional time

### 4.2 Non-Refundable Items
- API calls already consumed
- Custom training or professional services
- Third-party integration fees

## 5. Cancellation

### 5.1 How to Cancel
You can cancel your subscription at any time through your account settings. Your access continues until the end of the current billing period.

### 5.2 Data Retention
After cancellation, your data is retained for 30 days before deletion. You can export your data during this period.

## 6. Contact Support

For refund inquiries:
- Email: billing@modelstack.ai
- Response time: Within 24 hours
- Include your account email and transaction details
    `,
  },
};

export default function Policies() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Legal & Policies
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our commitment to transparency and protecting your rights.
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="privacy" className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-3 w-full mb-8 h-auto p-1 bg-secondary">
              {Object.entries(policies).map(([key, policy]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <policy.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{policy.title}</span>
                  <span className="sm:hidden">{policy.title.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(policies).map(([key, policy]) => (
              <TabsContent key={key} value={key}>
                <div className="bg-card rounded-xl border border-border p-6 md:p-10">
                  <div className="flex items-center gap-3 mb-2">
                    <policy.icon className="w-6 h-6 text-accent" />
                    <h2 className="text-2xl font-bold text-foreground">
                      {policy.title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-8">
                    Last updated: {policy.lastUpdated}
                  </p>

                  <div className="prose prose-gray max-w-none">
                    {policy.content.split("\n").map((line, index) => {
                      if (line.startsWith("## ")) {
                        return (
                          <h2
                            key={index}
                            className="text-xl font-bold text-foreground mt-8 mb-4 first:mt-0"
                          >
                            {line.replace("## ", "")}
                          </h2>
                        );
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h3
                            key={index}
                            className="text-lg font-semibold text-foreground mt-6 mb-3"
                          >
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li
                            key={index}
                            className="text-muted-foreground ml-4 mb-1"
                          >
                            {line.replace("- ", "")}
                          </li>
                        );
                      }
                      if (line.trim() === "") {
                        return <br key={index} />;
                      }
                      return (
                        <p key={index} className="text-muted-foreground mb-2">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Contact CTA */}
          <div className="max-w-4xl mx-auto mt-8 text-center bg-secondary/50 rounded-xl p-8 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Questions about our policies?
            </h3>
            <p className="text-muted-foreground">
              Contact our legal team at{" "}
              <a
                href="mailto:legal@modelstack.ai"
                className="text-accent hover:underline"
              >
                legal@modelstack.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
