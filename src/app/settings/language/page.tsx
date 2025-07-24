
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function LanguageSettingsPage() {
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const { toast } = useToast();

    const handleSelect = (language: string) => {
        setSelectedLanguage(language);
        toast({
            title: "Language Updated",
            description: `Language has been set to ${language}.`,
        });
    }

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader title="Language" showBackButton={true}/>
            <div className="flex-1 p-4 space-y-2">
                <Button 
                    variant={selectedLanguage === 'English' ? 'default' : 'outline'}
                    className="w-full justify-between py-6 text-base"
                    onClick={() => handleSelect('English')}
                >
                    <span>English</span>
                    {selectedLanguage === 'English' && <Check className="h-5 w-5" />}
                </Button>
                <Button 
                    variant={selectedLanguage === 'Swahili' ? 'default' : 'outline'}
                    className="w-full justify-between py-6 text-base"
                    onClick={() => handleSelect('Swahili')}
                >
                    <span>Swahili</span>
                    {selectedLanguage === 'Swahili' && <Check className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}
