
import { MainHeader } from "@/components/layout/main-header";

export default function ChatSettingsPage() {
    return (
        <div>
            <MainHeader title="Chat Settings" showBackButton={true} />
            <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">[ Chat Settings ]</p>
            </div>
        </div>
    );
}
