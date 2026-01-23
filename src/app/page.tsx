import Link from "next/link";
import { ArrowRight, Zap, BarChart3, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.05)] rounded-b-3xl">
        <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border-2 border-blue-200 shadow-sm">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">AI-Powered Analysis</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-black leading-tight tracking-tight drop-shadow-sm">
              Soccer Prediction Intelligence
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Get AI-powered feedback on your soccer predictions. Analyze odds, market trends, and team form in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/api/auth/signin"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-all duration-300 transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-300"
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
          <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight drop-shadow-sm">Powerful Features</h2>
          <p className="text-gray-600 text-lg">Everything you need for smarter predictions</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI Analysis", desc: "Intelligent feedback on odds, form, and tactics" },
            { icon: BarChart3, title: "Market Data", desc: "Real-time betting odds and market trends" },
            { icon: Zap, title: "Quick Feedback", desc: "Predictions analyzed in seconds" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group p-6 rounded-xl bg-white border-2 border-gray-200 shadow-md hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Icon className="h-10 w-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}