import { getDiscoverProfiles } from "@/lib/data";
import { ProfileCard } from "@/components/profile-card";
import { MainHeader } from "@/components/layout/main-header";
import { FizuLogo } from "@/components/icons/fizu-logo";

export default function DiscoverPage() {
  const profiles = getDiscoverProfiles();

  return (
    <div>
      <MainHeader title="Discover" showBackButton={false}>
        <FizuLogo className="text-3xl" />
      </MainHeader>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {profiles.map((user) => (
            <ProfileCard key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}
