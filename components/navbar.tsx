"use client";

import { Button } from "./ui/button";
import Link from "next/link";
import { Heart } from "lucide-react";

export function Navbar() {
  return (
    <div className="bg-background/50 fixed top-0 right-0 left-0 z-50 h-14 gap-4 border-b p-4 backdrop-blur-xl w-screen">
      <div className="container mx-auto flex h-full items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-2">
          <Link 
            href="https://hytalemodding.dev" 
            className="text-foreground hover:text-foreground/80 transition-colors"
          >
            HytaleModding
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">NPC Builder</span>
        </div>
        
        <Button 
          asChild 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Link href="https://opencollective.com/HytaleModding" target="_blank">
            <Heart className="h-4 w-4" />
            Sponsor
          </Link>
        </Button>
      </div>
    </div>
  );
}