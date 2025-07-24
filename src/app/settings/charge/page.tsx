
import { MainHeader } from "@/components/layout/main-header";

export default function ChargeSettingsPage() {
    return (
        <div>
            <MainHeader title="Charge Settings" showBackButton={true} />
            <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">[ Charge Settings ]</p>
            </div>
        </div>
    );
}
