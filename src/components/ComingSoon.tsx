import { Clock, Sparkles } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="relative inline-block mb-8">
          <Sparkles className="w-20 h-20 text-blue-600 relative animate-bounce" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          {title}
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-blue-600" />
          <p className="text-2xl font-semibold text-blue-600">Coming Soon</p>
        </div>

        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          {description ||
            "We're working hard to bring you this exciting new feature. Stay tuned for updates!"}
        </p>
      </div>
    </div>
  );
}
