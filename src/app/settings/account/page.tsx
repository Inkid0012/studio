
import { MainHeader } from "@/components/layout/main-header";

export default function AccountSettingsPage() {
    return (
        <div>
            <MainHeader title="Account and Security" showBackButton={true} />
            <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">[ Account and Security Settings ]</p>
            </div>
        </div>
    );
}
