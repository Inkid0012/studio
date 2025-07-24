
import { MainHeader } from "@/components/layout/main-header";

export default function RightsCenterPage() {
    return (
        <div>
            <MainHeader title="Rights Center" showBackButton={true} />
            <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">[ Rights Center ]</p>
            </div>
        </div>
    );
}
