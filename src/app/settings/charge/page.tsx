
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Phone } from "lucide-react";

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
    return (
        <div>
            <MainHeader title="Charge Settings" showBackButton={true} />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">Coin Charges</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <ChargeItem icon={MessageSquare} label="Message Charges" value="-30" valueUnit="coins" />
                       <ChargeItem icon={Phone} label="Call Charges" value="-150" valueUnit="coins" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
