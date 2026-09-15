import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
  BookOpen,
  Users,
  Building2,
  Sparkles,
  X,
  Search,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Demo accounts organized by institutional governance domain - Complete role set
const DEMO_ACCOUNTS = [
  {
    category: "Governance & Property Oversight",
    icon: Building2,
    accounts: [
      {
        name: "Abel Tesfaye",
        email: "abel.admin@university.edu",
        role: "Administrator",
        initials: "AT",
        color: "bg-purple-600",
        description: "System configuration, user accounts, and immutable audit logs.",
      },
      {
        name: "Meron Alemu",
        email: "meron.pao@university.edu",
        role: "Property Administration Officer",
        initials: "MA",
        color: "bg-blue-600",
        description: "Senior approval gate for store requisitions, SIVs, returns & transfers.",
      },
      {
        name: "Dr. Tewodros Fikru",
        email: "tewodros.dept@university.edu",
        role: "Department Head",
        initials: "TF",
        color: "bg-indigo-600",
        description: "Departmental requisitions, staff request approvals & unit custody.",
      },
    ],
  },
  {
    category: "Store & Warehouse Operations",
    icon: Building2,
    accounts: [
      {
        name: "Dawit Bekele",
        email: "dawit.store@university.edu",
        role: "Store Head",
        initials: "DB",
        color: "bg-emerald-600",
        description: "Delivery receipt, Model 20 SIV creation, Model 22 issuing & FIFO deduction.",
      },
      {
        name: "Sara Getachew",
        email: "sara.clerk@university.edu",
        role: "Stock Clerk",
        initials: "SG",
        color: "bg-teal-600",
        description: "Delivery logging, storage bin/shelf allocation, and physical count lines.",
      },
    ],
  },
  {
    category: "Inspection & Registration",
    icon: Shield,
    accounts: [
      {
        name: "Eng. Yonas Kebede",
        email: "yonas.tec@university.edu",
        role: "Technical Evaluation Committee",
        initials: "YK",
        color: "bg-amber-600",
        description: "Specification inspection for goods receipts and return condition grading.",
      },
      {
        name: "Hana Girma",
        email: "hana.registration@university.edu",
        role: "Property Registration Officer",
        initials: "HG",
        color: "bg-cyan-600",
        description: "Official Model 19 (GRN) issuance, asset tagging & User-Card registers.",
      },
    ],
  },
  {
    category: "Finance, Governance & Security",
    icon: Users,
    accounts: [
      {
        name: "Selam Mulu",
        email: "selam.acct@university.edu",
        role: "Accountant",
        initials: "SM",
        color: "bg-rose-600",
        description: "Perpetual FIFO inventory valuation, write-offs & reconciliation.",
      },
      {
        name: "Disposal Board",
        email: "disposal.committee@university.edu",
        role: "Disposal Committee",
        initials: "DC",
        color: "bg-red-600",
        description: "Sole authority to approve retirement via Auction, Destruction, or Donation.",
      },
      {
        name: "Girum Assefa",
        email: "girum.security@university.edu",
        role: "Campus Security Officer",
        initials: "GA",
        color: "bg-orange-600",
        description: "Pre-approval of gate clearance requests before materials leave campus.",
      },
      {
        name: "Abebe Bekele",
        email: "abebe.gate@university.edu",
        role: "Gate Security Guard",
        initials: "AB",
        color: "bg-orange-700",
        description: "Physical gate verification and exit logging when materials leave campus.",
      },
    ],
  },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogin(e) {
    if (e) e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail) {
    setEmail(demoEmail);
    setPassword("passwd");
    setShowDemoModal(false);
    setError("");
    setLoading(true);

    try {
      await login(demoEmail, "passwd");
      navigate("/");
    } catch (err) {
      setError(err.message || "Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials(demoEmail) {
    setEmail(demoEmail);
    setPassword("passwd");
    setShowDemoModal(false);
    setError("");
  }

  const filteredAccounts = DEMO_ACCOUNTS.map(category => ({
    ...category,
    accounts: category.accounts.filter(acc =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.accounts.length > 0);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Side: University Branding */}
      <div className="relative hidden lg:flex lg:flex-col lg:justify-center bg-gradient-to-br from-university-600 via-university-700 to-university-900 p-12 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse-slow" />
        <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 left-20 h-80 w-80 rounded-full bg-university-400/10 blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          {/* University Logo */}
          <div className="mb-8 flex items-center gap-4 animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 border-2 border-white/30 shadow-2xl backdrop-blur-sm">
              <Building2 className="h-9 w-9 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-university-200 tracking-wider uppercase">University</p>
              <h1 className="text-2xl font-bold tracking-tight">Stock & Property Management</h1>
            </div>
          </div>

          {/* System Title */}
          <h2 className="mb-4 text-4xl font-bold leading-tight animate-fade-in-delay-1">
            Institutional Inventory Control System
          </h2>
          <p className="mb-12 text-lg text-university-100 leading-relaxed animate-fade-in-delay-2">
            Complete material lifecycle tracking with full document compliance
            and segregation of duties enforcement.
          </p>

          {/* Features List */}
          <div className="space-y-4 animate-fade-in-delay-3">
            <div className="flex items-start gap-3 group">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-500/30 border border-success-400/30 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-5 w-5 text-success-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Complete Lifecycle Tracking</h3>
                <p className="text-sm text-university-200">
                  From procurement to disposal with full audit trail
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 group">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-500/30 border border-success-400/30 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-5 w-5 text-success-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Model Document Compliance</h3>
                <p className="text-sm text-university-200">
                  Official forms and documents for institutional tracking
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 group">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-500/30 border border-success-400/30 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-5 w-5 text-success-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Segregation of Duties</h3>
                <p className="text-sm text-university-200">
                  Role-based access with approval workflows and audit compliance
                </p>
              </div>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="mt-12 inline-flex items-center gap-2 rounded-full bg-white/20 border-2 border-white/30 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm shadow-lg animate-fade-in-delay-4">
            <Shield className="h-4 w-4 text-success-300" />
            <span>Secure • Compliant • Auditable</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 lg:hidden animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-university-600 text-white shadow-xl">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SPMS</h1>
              <p className="text-sm text-muted-foreground">Stock Management</p>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="space-y-3 text-center lg:text-left animate-fade-in-delay-1">
            <h2 className="text-4xl font-bold text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-base text-muted-foreground">
              Sign in to access the Stock Management System
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border-2 border-danger-300 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-950/50 shadow-lg animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400" />
              <p className="text-sm font-medium text-danger-700 dark:text-danger-300">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-semibold text-foreground"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@university.edu"
                  className={cn(
                    "w-full rounded-xl border-2 border-input bg-background px-4 py-3 pl-11 shadow-sm",
                    "text-sm font-medium text-foreground placeholder:text-muted-foreground",
                    "focus:border-university-500 focus:outline-none focus:ring-4 focus:ring-university-500/10",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="text-sm font-semibold text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(
                    "w-full rounded-xl border-2 border-input bg-background px-4 py-3 pl-11 pr-11 shadow-sm",
                    "text-sm font-medium text-foreground placeholder:text-muted-foreground",
                    "focus:border-university-500 focus:outline-none focus:ring-4 focus:ring-university-500/10",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-2 border-input text-university-600 focus:ring-2 focus:ring-university-500/20 cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm font-semibold text-university-600 hover:text-university-700 dark:text-university-400 dark:hover:text-university-300 transition-colors hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full bg-university-600 hover:bg-university-700 shadow-lg shadow-university-600/20",
                "text-white font-bold text-base h-12",
                "hover:shadow-xl hover:shadow-university-600/30 hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                "transition-all duration-200"
              )}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
          </form>

          {/* Demo Accounts Button */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDemoModal(true)}
            className="w-full border-2 border-university-200 text-university-700 hover:bg-university-50 hover:border-university-300 dark:border-university-800 dark:text-university-300 dark:hover:bg-university-950 dark:hover:border-university-700 font-semibold transition-all"
            size="lg"
          >
            <span>Explore Demo Accounts</span>
          </Button>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground">
            Authorized personnel only. All activities are logged and monitored.
          </p>
        </div>
      </div>

      {/* Demo Accounts Modal - Modern Solid Design */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-background shadow-2xl overflow-hidden">
            {/* Modal Header - Solid Design with Gradient Accent */}
            <div className="relative bg-gradient-to-r from-university-600 to-university-700 px-6 py-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">Demo Accounts</h3>
                  <p className="text-sm text-university-100">
                    Select any role to explore the system • Password: <span className="font-mono font-semibold">passwd</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close demo accounts modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search Bar - Integrated into header */}
              <div className="relative mt-4">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-university-300" />
                <input
                  type="text"
                  placeholder="Search accounts by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 pl-11 text-sm text-white placeholder:text-university-200 focus:bg-white/15 focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Accounts List - Clean Solid Cards */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
              {filteredAccounts.length > 0 ? (
                <div className="p-6 space-y-6">
                  {filteredAccounts.map((category) => (
                    <div key={category.category}>
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-university-100 dark:bg-university-900/30">
                          <category.icon className="h-4 w-4 text-university-600 dark:text-university-400" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                          {category.category}
                        </h4>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {category.accounts.length} {category.accounts.length === 1 ? 'account' : 'accounts'}
                        </span>
                      </div>

                      {/* Account Cards Grid */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {category.accounts.map((account) => (
                          <div
                            key={account.email}
                            className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 p-5 transition-all hover:border-university-500 hover:shadow-xl hover:-translate-y-1"
                          >
                            {/* Account Header */}
                            <div className="flex items-start gap-4 mb-4">
                              <div
                                className={cn(
                                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-lg shadow-lg ring-4 ring-white dark:ring-slate-900",
                                  account.color
                                )}
                              >
                                {account.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-foreground text-base leading-tight mb-1">
                                  {account.name}
                                </h5>
                                <p className="text-xs font-semibold text-university-600 dark:text-university-400 mb-1">
                                  {account.role}
                                </p>
                                <p className="text-xs font-mono text-muted-foreground truncate bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  {account.email}
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                              {account.description}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fillDemoCredentials(account.email)}
                                className="flex-1 h-9 text-xs font-semibold border-2"
                              >
                                Fill Form
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDemoLogin(account.email)}
                                className="flex-1 h-9 bg-university-600 hover:bg-university-700 text-white text-xs font-semibold shadow-lg shadow-university-600/20"
                              >
                                <span>Sign In</span>
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Hover Accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-university-500 to-university-600 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800 mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-base font-semibold text-foreground mb-1">No accounts found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer - Clean Stats Bar */}
            <div className="border-t-2 border-border bg-white dark:bg-slate-900 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-university-100 dark:bg-university-900/30">
                    <Users className="h-4 w-4 text-university-600 dark:text-university-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {filteredAccounts.reduce((acc, cat) => acc + cat.accounts.length, 0)} accounts available
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDemoModal(false)}
                  className="border-2 font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
