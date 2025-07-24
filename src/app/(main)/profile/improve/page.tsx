import { MainHeader } from "@/components/layout/main-header";
import { ProfileImprover } from "@/components/profile-improver";

export default function ImproveProfilePage() {
    return (
        <div>
            <MainHeader title="AI Profile Coach" />
            <div className="p-4 md:p-8 max-w-2xl mx-auto">
                <ProfileImprover />
            </div>
        </div>
    );
}
