
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainHeader } from '@/components/layout/main-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser, setCurrentUser, personalInfoOptions, countries } from '@/lib/data';
import type { User, PersonalInfoOption } from '@/types';
import { ChevronRight, BadgeDollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { OptionSelector } from '@/components/option-selector';

export default function PersonalInformationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<PersonalInfoOption | null>(null);

    useEffect(() => {
        setIsMounted(true);
        setUser(getCurrentUser());
    }, []);

    const handleUpdate = (key: keyof User, value: any) => {
        if (user) {
            const updatedUser = { ...user, [key]: value };
            setUser(updatedUser);
            setCurrentUser(updatedUser);
            toast({
                title: 'Profile Updated',
                description: 'Your information has been saved.',
            });
        }
    };
    
    if (!isMounted || !user) {
        return <div>Loading...</div>; // Or a skeleton loader
    }
    
    if (selectedOption) {
        return (
            <OptionSelector 
                option={selectedOption}
                currentValue={user[selectedOption.key] as string}
                onSelect={(value) => {
                    handleUpdate(selectedOption.key, value);
                    setSelectedOption(null);
                }}
                onBack={() => setSelectedOption(null)}
            />
        )
    }

    return (
        <div className="pb-8">
            <MainHeader title="Personal Information" />

            <div className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">My basic information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <InfoRow label="Name" value={user.name} onClick={() => router.push('/profile/edit')} />
                        <InfoRow label="Birthday" value={format(new Date(user.dob), 'yyyy-MM-dd')} onClick={() => router.push('/profile/edit')} />
                        <CountryRow 
                            label="Country" 
                            value={user.country} 
                            onCountryChange={(value) => handleUpdate('country', value)}
                        />
                        <InfoRow label="Social Preferences" onClick={() => {}} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg flex items-center justify-between">
                            <span>More about me</span>
                            <span className="flex items-center gap-1 text-sm font-body font-bold text-yellow-500 bg-yellow-100/50 px-2 py-1 rounded-full">
                                +20
                                <BadgeDollarSign className="h-4 w-4" />
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {personalInfoOptions.map((option) => (
                            <InfoRow 
                                key={option.key}
                                label={option.label}
                                value={user[option.key] as string | undefined}
                                icon={option.icon}
                                onClick={() => setSelectedOption(option)}
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const InfoRow = ({ label, value, icon: Icon, onClick }: { label: string; value?: string; icon?: React.ElementType; onClick: () => void; }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between py-3 text-sm border-b border-border last:border-b-0">
        <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <span>{value || 'Add'}</span>
            <ChevronRight className="h-4 w-4" />
        </div>
    </button>
);

const CountryRow = ({ label, value, onCountryChange }: { label: string; value?: string; onCountryChange: (value: string) => void }) => (
    <div className="w-full flex items-center justify-between py-3 text-sm border-b border-border">
        <span className="font-medium">{label}</span>
        <Select value={value} onValueChange={onCountryChange}>
            <SelectTrigger className="w-[180px] border-none text-right justify-end gap-2 pr-0">
                <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
                {countries.map(country => (
                    <SelectItem key={country} value={country}>
                        {country}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);