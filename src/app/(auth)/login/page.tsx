import Link from "next/link";
import { Facebook, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FizuLogo } from "@/components/icons/fizu-logo";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <FizuLogo className="mx-auto mb-4 text-5xl" />
          <p className="mt-2 text-center text-muted-foreground font-body">
            Find your spark.
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base" >
            <Link href="/discover">
              <Mail className="mr-2 h-5 w-5" />
              Continue with Email
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full font-bold py-6 text-base border-primary/30 hover:bg-primary/5">
            <Link href="/discover">
              <Facebook className="mr-2 h-5 w-5 text-blue-600" />
              Continue with Facebook
            </Link>
          </Button>
          <Button variant="ghost" asChild className="w-full text-muted-foreground hover:text-primary">
            <Link href="/discover">
              <User className="mr-2 h-5 w-5" />
              Continue Anonymously
            </Link>
          </Button>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground font-body">
          By clicking continue, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
