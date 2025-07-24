
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Phone } from "lucide-react";
import { useTranslation } from "@/contexts/i18n";

const ChargeItem = ({ icon: Icon, label, value, valueUnit }: { icon: React.ElementType, label: string, value: string, valueUnit: string }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0 px-2">
        <div className="flex items-center gap-4">
            <Icon className="h-6 w-6 text-muted-foreground" />
            <span className="text-base font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
            <span className="font-bold text-lg text-destructive">{value}</span>
            <span className="text-sm text-muted-foreground">{valueUnit}</span>
        </div>
    </div>
);


export default function ChargeSettingsPage() {
    const { t } = useTranslation();

    return (
        <div>
            <MainHeader title={t('charge_settings.title')} showBackButton={true} />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">{t('charge_settings.coin_charges')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <ChargeItem icon={MessageSquare} label={t('charge_settings.message_charges')} value="-30" valueUnit={t('charge_settings.coins')} />
                       <ChargeItem icon={Phone} label={t('charge_settings.call_charges')} value="-150" valueUnit={t('charge_settings.coins')} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
