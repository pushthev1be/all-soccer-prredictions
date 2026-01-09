import Link from "next/link";
import { ArrowRight, Zap, BarChart3, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 opacity-40" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center space-x-2 bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-500/30">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">AI-Powered Analysis</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent leading-tight">
              Soccer Prediction Intelligence
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Get AI-powered feedback on your soccer predictions. Analyze odds, market trends, and team form in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/api/auth/signin"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3 bg-slate-700/50 text-white font-semibold rounded-lg border border-slate-600 hover:bg-slate-600 transition-all duration-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Powerful Features</h2>
          <p className="text-slate-400 text-lg">Everything you need for smarter predictions</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI Analysis", desc: "Intelligent feedback on odds, form, and tactics" },
            { icon: BarChart3, title: "Market Data", desc: "Real-time betting odds and market trends" },
            { icon: Zap, title: "Quick Feedback", desc: "Predictions analyzed in seconds" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="group p-6 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                <Icon className="h-10 w-10 text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}