import { Shield, Lock, CheckCircle, Award, Users, Banknote } from "lucide-react";

interface TrustIndicatorProps {
  variant?: "landing" | "dashboard" | "footer";
  className?: string;
}

export default function TrustIndicators({ variant = "landing", className = "" }: TrustIndicatorProps) {
  const badges = [
    {
      icon: Shield,
      title: "FDIC Insured",
      description: "Your deposits are protected up to $250,000",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-400/20"
    },
    {
      icon: Lock,
      title: "Bank-Grade Security",
      description: "256-bit SSL encryption protects your data",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10", 
      borderColor: "border-blue-400/20"
    },
    {
      icon: CheckCircle,
      title: "SOC 2 Compliant",
      description: "Independently audited security controls",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-400/20"
    },
    {
      icon: Award,
      title: "PCI DSS Level 1",
      description: "Highest level of payment security",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-400/20"
    }
  ];

  if (variant === "footer") {
    return (
      <div className={`flex flex-wrap items-center gap-6 ${className}`}>
        {badges.map((badge, index) => {
          const IconComponent = badge.icon;
          return (
            <div 
              key={index} 
              className="flex items-center gap-2 text-sm text-gray-400"
              title={badge.description}
            >
              <IconComponent className={`h-4 w-4 ${badge.color}`} aria-hidden="true" />
              <span>{badge.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
        {badges.map((badge, index) => {
          const IconComponent = badge.icon;
          return (
            <div 
              key={index}
              className={`flex items-center gap-2 p-3 rounded-lg border ${badge.bgColor} ${badge.borderColor} backdrop-blur-sm`}
              role="img"
              aria-label={`${badge.title}: ${badge.description}`}
            >
              <IconComponent className={`h-4 w-4 ${badge.color}`} aria-hidden="true" />
              <span className="text-xs font-medium text-white">{badge.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Landing page variant
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {badges.map((badge, index) => {
        const IconComponent = badge.icon;
        return (
          <div 
            key={index}
            className={`p-6 rounded-xl border ${badge.bgColor} ${badge.borderColor} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
            role="img"
            aria-label={`${badge.title}: ${badge.description}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full ${badge.bgColor} flex items-center justify-center mb-4`}>
                <IconComponent className={`h-6 w-6 ${badge.color}`} aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white mb-2">{badge.title}</h3>
              <p className="text-sm text-gray-300">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SecurityStatus({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <div className="flex items-center gap-1">
        <Lock className="h-4 w-4 text-green-400" aria-hidden="true" />
        <span className="text-sm font-medium text-green-400">Secure Connection</span>
      </div>
      <div className="w-1 h-1 bg-gray-400 rounded-full" aria-hidden="true"></div>
      <div className="flex items-center gap-1">
        <Shield className="h-4 w-4 text-blue-400" aria-hidden="true" />
        <span className="text-sm text-gray-300">Protected by Prime Edge</span>
      </div>
    </div>
  );
}

export function RegulatedBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-400/20 rounded-lg ${className}`}>
      <Banknote className="h-4 w-4 text-green-400" aria-hidden="true" />
      <div className="text-sm">
        <span className="font-medium text-green-400">Regulated</span>
        <span className="text-gray-300 ml-1">Financial Institution</span>
      </div>
    </div>
  );
}

export function CustomerStats({ className = "" }: { className?: string }) {
  const stats = [
    { value: "500K+", label: "Customers Trust Us" },
    { value: "$2.5B+", label: "Assets Protected" },
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "24/7", label: "Customer Support" }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="text-center" role="img" aria-label={`${stat.value} ${stat.label}`}>
          <div className="text-2xl lg:text-3xl font-bold text-white mb-2">{stat.value}</div>
          <div className="text-sm text-gray-300">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}