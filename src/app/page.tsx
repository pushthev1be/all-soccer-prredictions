import Link from "next/link";
import { ArrowRight, Zap, BarChart3, Brain } from "lucide-react";
import { LiveScores } from "@/components/live-scores/live-scores";

export default function Home() {
  return (
    <div className="min-h-screen relative z-10">
      {/* Live Scores Bar */}
      <LiveScores />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative container-fluid py-12 sm:py-20">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center justify-center space-x-2 bg-white px-4 py-2 rounded-full border-2 border-black shadow-sm">
              <Zap className="h-4 w-4 text-black" />
              <span className="text-xs sm:text-sm font-bold text-black">AI-Powered Analysis</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              Soccer Prediction<br className="sm:hidden" /> Intelligence
            </h1>
            
            <p className="text-sm sm:text-lg text-white/90 max-w-xl mx-auto leading-relaxed px-4">
              Get AI-powered feedback on your soccer predictions. Analyze odds, market trends, and team form in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 px-4">
              <Link
                href="/api/auth/signin"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-white text-black font-bold text-sm sm:text-base rounded-lg border-2 border-white hover:bg-gray-100 transition-all duration-200"
              >
                Get Started
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-transparent text-white font-bold text-sm sm:text-base rounded-lg border-2 border-white hover:bg-white/10 transition-all duration-200"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="container-fluid py-12 sm:py-16 space-y-8">
        <div className="text-center space-y-2 mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Powerful Features</h2>
          <p className="text-white/80 text-sm sm:text-base">Everything you need for smarter predictions</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: Brain, title: "AI Analysis", desc: "Intelligent feedback on odds, form, and tactics" },
            { icon: BarChart3, title: "Market Data", desc: "Real-time betting odds and market trends" },
            { icon: Zap, title: "Quick Feedback", desc: "Predictions analyzed in seconds" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group p-4 sm:p-6 rounded-xl bg-white border-2 border-black shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-black mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-bold text-black mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
