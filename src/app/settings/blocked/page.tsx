
import { MainHeader } from "@/components/layout/main-header";

export default function BlockedListPage() {
    return (
        <div>
            <MainHeader title="Blocked List" showBackButton={true} />
            <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">[ Blocked users will appear here ]</p>
            </div>
        </div>
    );
}
