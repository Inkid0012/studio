
import { MainHeader } from "@/components/layout/main-header";
import { FizuLogo } from "@/components/icons/fizu-logo";

export default function AboutPage() {
    return (
        <div>
            <MainHeader title="About Fizu" showBackButton={true} />
            <div className="p-4 text-center">
                <FizuLogo className="mx-auto my-8 text-6xl" />
                <p className="text-lg font-semibold">Fizu</p>
                <p className="text-muted-foreground">Version 1.0.0</p>
            </div>
        </div>
    );
}
