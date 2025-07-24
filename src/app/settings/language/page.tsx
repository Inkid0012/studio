
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/i18n";

export default function LanguageSettingsPage() {
    const { language, setLanguage, t } = useTranslation();
    const { toast } = useToast();

    const handleSelect = (lang: 'en' | 'sw') => {
        setLanguage(lang);
        toast({
            title: t('language_settings.toast_title'),
            description: `${t('language_settings.toast_description')} ${lang === 'en' ? 'English' : 'Swahili'}.`,
        });
    }

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader title={t('language_settings.title')} showBackButton={true}/>
            <div className="flex-1 p-4 space-y-2">
                <Button 
                    variant={language === 'en' ? 'default' : 'outline'}
                    className="w-full justify-between py-6 text-base"
                    onClick={() => handleSelect('en')}
                >
                    <span>English</span>
                    {language === 'en' && <Check className="h-5 w-5" />}
                </Button>
                <Button 
                    variant={language === 'sw' ? 'default' : 'outline'}
                    className="w-full justify-between py-6 text-base"
                    onClick={() => handleSelect('sw')}
                >
                    <span>Swahili</span>
                    {language === 'sw' && <Check className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}
