import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Decentralized Event Management
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
            Discover, create, and manage events on the Pubky network. Your data,
            your control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Events
              </Button>
            </Link>
            <Link href="/calendar">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Browse Calendars
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="flex flex-col items-center text-center p-6">
            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4 mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Calendar Discovery</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Find and subscribe to calendars from across the Pubky network
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4 mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Event Discovery</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Discover events that match your interests from the decentralized
              network
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Own Your Data</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Built on Pubky - a truly decentralized protocol where you control
              your data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
