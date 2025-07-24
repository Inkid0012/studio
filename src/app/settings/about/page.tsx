
import { MainHeader } from "@/components/layout/main-header";
import { FizuLogo } from "@/components/icons/fizu-logo";

export default function AboutPage() {
    return (
        <div>
            <MainHeader title="About Fizu" showBackButton={true} />
            <div className="p-4 text-center">
                <FizuLogo className="mx-auto my-8 text-6xl" />
                <p className="text-lg font-semibold">Fizu</p>
                <p className="text-muted-foreground mb-4">Version 1.0.0</p>
                <p className="max-w-prose mx-auto text-muted-foreground">
                    Fizu is a premium dating application designed to help you find meaningful connections. Our mission is to create a safe and engaging community where you can discover your spark.
                </p>
            </div>
        </div>
    );
}
